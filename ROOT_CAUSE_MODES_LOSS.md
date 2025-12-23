# 🔴 ROOT CAUSE: Dark Mode Data Loss

## Problem

**Symptom:** All dark mode values default to `#FFFFFF` and `0`, no aliases are created.

**Root Cause:** `mergeSemanticWithExistingAliases` destroys the `modes` structure created by `mapSemanticTokens`.

---

## Data Flow

### 1. Token Generation (`mapSemanticTokens`)
**Lines:** 1057-1375  
**Returns:**
```javascript
{
  'bg.canvas': {
    type: 'COLOR',
    modes: {
      light: { resolvedValue: '#F8F6F5', aliasRef: { category: 'gray', key: '50' } },
      dark: { resolvedValue: '#090B13', aliasRef: { category: 'gray', key: '950' } }
    }
  },
  'bg.surface': {
    type: 'COLOR',
    modes: {
      light: { resolvedValue: '#F2F1F0', aliasRef: { category: 'gray', key: '100' } },
      dark: { resolvedValue: '#171B27', aliasRef: { category: 'gray', key: '900' } }
    }
  }
}
```

✅ **Structure:** Per-token `modes` object

---

### 2. Merge (`mergeSemanticWithExistingAliases`)
**Lines:** 7807-7870  
**Line 7812:**
```javascript
const isGeneratedMultiMode = generated.modes && (generated.modes.light || generated.modes.dark);
```

❌ **Problem:** This checks for `modes` at **ROOT LEVEL**, but `mapSemanticTokens` returns `modes` at **PER-TOKEN LEVEL**.

**Result:** `isGeneratedMultiMode = false` → Falls into legacy merge logic (lines 7827-7843)

---

### 3. Legacy Merge Logic (Lines 7827-7843)
```javascript
var merged = {};
for (var key in generated) {
  var generatedToken = generated[key];
  var existingToken = existing[key];
  
  if (existingToken && existingToken.aliasTo) {
    merged[key] = {
      resolvedValue: typeof generatedToken === 'object' ? (generatedToken.resolvedValue || generatedToken) : generatedToken,
      aliasTo: existingToken.aliasTo,
      type: existingToken.type || 'COLOR',
      meta: existingToken.meta
    };
  } else {
    merged[key] = typeof generatedToken === 'object' && generatedToken.resolvedValue !== undefined ? generatedToken.resolvedValue : generatedToken;
  }
}
```

❌ **Problem:** This logic expects `generatedToken.resolvedValue` to be a scalar, but it's actually an object with `modes`:
```javascript
generatedToken = {
  type: 'COLOR',
  modes: { light: {...}, dark: {...} }
}
```

**Result:** `generatedToken.resolvedValue` is `undefined`, so it falls back to `generatedToken` itself, which is the whole object. But then it's treated as a scalar value.

**Final Output:**
```javascript
{
  'bg.canvas': {
    resolvedValue: "#F8F6F5",  // ← Only light mode value!
    type: "COLOR",
    aliasRef: { category: "gray", key: "50" },  // ← Only light mode alias!
    aliasTo: null,
    state: "VALUE"
    // ❌ NO modes.dark !
  }
}
```

---

### 4. Save (`saveSemanticTokensToFile`)
**Lines:** 86-280  
**Line 194:**
```javascript
if (tokenData.modes) {
  normalizedToken = tokenData;  // Preserve modes structure
}
```

❌ **Problem:** `tokenData.modes` doesn't exist anymore! It was destroyed by `mergeSemanticWithExistingAliases`.

---

### 5. Sync (`importTokensToFigma`)
**Lines:** 4932-4964  
**Line 4939:**
```javascript
if (!modeInfo.modeId || !modeInfo.data) continue;
```

❌ **Problem:** `modeInfo.data` is `tokenData.modes.dark`, which is `null` because `tokenData.modes` doesn't exist.

**Result:** Dark mode is **completely skipped**, leaving Figma variables with default values (`#FFFFFF` for colors, `0` for floats).

---

## Solution

**Option 1:** Modify `mergeSemanticWithExistingAliases` to detect per-token `modes` structure

**Line 7812:**
```javascript
// BEFORE
const isGeneratedMultiMode = generated.modes && (generated.modes.light || generated.modes.dark);

// AFTER
// Check if ANY token has a modes structure
const isGeneratedMultiMode = Object.keys(generated).some(function(key) {
  return generated[key] && generated[key].modes;
});
```

**Lines 7827-7843:** Add logic to preserve per-token `modes` structure:
```javascript
if (!isGeneratedMultiMode) {
  // Legacy merge logic...
} else {
  // NEW: Per-token modes merge logic
  var merged = {};
  for (var key in generated) {
    if (!generated.hasOwnProperty(key)) continue;
    var generatedToken = generated[key];
    var existingToken = existing[key];
    
    if (generatedToken.modes) {
      // Preserve modes structure
      merged[key] = generatedToken;
      
      // If existing token has aliasTo, preserve it
      if (existingToken && existingToken.aliasTo) {
        merged[key].aliasTo = existingToken.aliasTo;
      }
    } else {
      // Legacy token without modes
      merged[key] = generatedToken;
    }
  }
  return merged;
}
```

---

**Option 2:** Skip `mergeSemanticWithExistingAliases` entirely for new tokens

**Line 3388:**
```javascript
// BEFORE
var merged = mergeSemanticWithExistingAliases(generated, existing);
tokens.semantic = merged || generated;

// AFTER
// Skip merge for now, use generated tokens directly
tokens.semantic = generated;
```

**Pros:** Simple, immediate fix  
**Cons:** Loses existing `aliasTo` data (if any)

---

## Recommendation

**Implement Option 1** to properly support per-token `modes` structure while preserving backward compatibility.

**Estimated Effort:** 15 minutes  
**Risk:** Low (only affects merge logic)  
**Impact:** Fixes all dark mode data loss
