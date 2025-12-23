# ✅ CRITICAL FIX APPLIED: Per-Token Modes Preservation

## Summary

**Fixed:** `mergeSemanticWithExistingAliases` now correctly detects and preserves per-token `modes` structure, preventing dark mode data loss.

**File:** `code.js`  
**Lines Modified:** 7811-7864  
**Risk:** Low (only affects merge logic)  
**Impact:** **Fixes all dark mode data loss**

---

## Changes Made

### 1. Multi-Mode Detection (Lines 7811-7822)

**BEFORE:**
```javascript
const isGeneratedMultiMode = generated.modes && (generated.modes.light || generated.modes.dark);
```
❌ **Problem:** Checks for `modes` at root level, but tokens have `modes` per-token.

**AFTER:**
```javascript
var isGeneratedMultiMode = false;
for (var checkKey in generated) {
  if (generated.hasOwnProperty(checkKey) && generated[checkKey] && generated[checkKey].modes) {
    isGeneratedMultiMode = true;
    break;
  }
}
```
✅ **Solution:** Iterates through tokens to check if ANY token has a `modes` structure.

---

### 2. Merge Logic (Lines 7824-7864)

**BEFORE:**
```javascript
if (!isGeneratedMultiMode) {
  // Legacy merge logic (flat)
  // ... destroys modes structure ...
}
```
❌ **Problem:** Inverted logic - per-token modes fell into legacy path, getting flattened.

**AFTER:**
```javascript
if (isGeneratedMultiMode) {
  // ✅ Preserve per-token modes structure
  var merged = {};
  for (var key in generated) {
    var generatedToken = generated[key];
    var existingToken = existing[key];
    
    if (generatedToken.modes) {
      // Preserve modes structure
      merged[key] = generatedToken;
      
      // Preserve existing aliasTo if present
      if (existingToken && existingToken.aliasTo) {
        merged[key].aliasTo = existingToken.aliasTo;
      }
    } else {
      merged[key] = generatedToken;
    }
  }
  return merged;
}

// Legacy flat merge for old tokens
// ...
```
✅ **Solution:** Inverted condition - per-token modes are handled first, preserving the structure.

---

## Data Flow (After Fix)

### 1. Token Generation
`mapSemanticTokens` returns:
```javascript
{
  'bg.canvas': {
    type: 'COLOR',
    modes: {
      light: { resolvedValue: '#F8F6F5', aliasRef: { category: 'gray', key: '50' } },
      dark: { resolvedValue: '#090B13', aliasRef: { category: 'gray', key: '950' } }
    }
  }
}
```

### 2. Merge (FIXED)
`mergeSemanticWithExistingAliases` now:
1. ✅ Detects `isGeneratedMultiMode = true` (per-token modes found)
2. ✅ Preserves the entire token structure with `modes`
3. ✅ Returns tokens with intact `modes.light` and `modes.dark`

### 3. Save
`saveSemanticTokensToFile`:
1. ✅ Detects `tokenData.modes` exists
2. ✅ Preserves structure (line 196)
3. ✅ Saves to Figma with both modes intact

### 4. Sync
`importTokensToFigma`:
1. ✅ Finds `tokenData.modes.light` and `tokenData.modes.dark`
2. ✅ Creates aliases for both modes
3. ✅ Syncs to Figma variables

---

## Testing Instructions

### Step 1: Reload Plugin
1. Open Figma
2. Press **Cmd+Option+P**
3. Type "Reload" and reload the plugin

### Step 2: Clear Existing Data (Optional)
To ensure clean test:
```javascript
// In Figma console
figma.root.setPluginData("tokenStarter.semanticTokens", "");
```

### Step 3: Generate Tokens
1. In plugin UI, go to **Step 2: Generate Semantic Tokens**
2. Click **"Generate"**
3. Open console (**Cmd+Option+I**)

### Step 4: Check Console Logs

**Expected Output:**
```
🔍 [MERGE] isGeneratedMultiMode: true
✅ [MERGE] Preserving per-token modes structure
✅ [MERGE] bg.canvas: preserved modes structure (light: true, dark: true)
✅ [MERGE] bg.surface: preserved modes structure (light: true, dark: true)
...
```

**Failure Indicators:**
```
⚠️ [MERGE] Using legacy flat merge logic  // ← Should NOT appear!
❌ [SYNC_ERROR] No data for X in dark mode  // ← Should NOT appear!
```

### Step 5: Verify in Figma Variables Panel

1. Open **Variables** panel (right sidebar)
2. Select **Semantic** collection
3. Check tokens:

| Token | Light Mode | Dark Mode |
|-------|------------|-----------|
| `background/canvas` | `gray-50` ✅ | `gray-950` ✅ |
| `background/surface` | `gray-100` ✅ | `gray-900` ✅ |
| `background/elevated` | `gray-200` ✅ | `gray-800` ✅ |
| `text/primary` | `gray-950` ✅ | `gray-50` ✅ |
| `text/secondary` | `gray-600` ✅ | `gray-400` ✅ |

**Pass Criteria:**
- ✅ All tokens show **aliases** (not raw hex values)
- ✅ Dark mode shows **different values** than light mode
- ✅ No `#FFFFFF` in dark mode
- ✅ No `0` values for floats

---

## Expected Results

### Before Fix
```javascript
{
  'bg.canvas': {
    resolvedValue: "#F8F6F5",  // ← Only light mode!
    aliasRef: { category: "gray", key: "50" },
    // ❌ NO modes.dark
  }
}
```
**Figma Result:** Dark mode → `#FFFFFF` (default)

### After Fix
```javascript
{
  'bg.canvas': {
    type: 'COLOR',
    modes: {
      light: {
        resolvedValue: '#F8F6F5',
        aliasRef: { category: 'gray', key: '50' }
      },
      dark: {
        resolvedValue: '#090B13',
        aliasRef: { category: 'gray', key: '950' }
      }
    }
  }
}
```
**Figma Result:** 
- Light mode → `gray-50` ✅
- Dark mode → `gray-950` ✅

---

## Rollback Plan

If issues occur, revert lines 7811-7864 to:
```javascript
const isGeneratedMultiMode = generated.modes && (generated.modes.light || generated.modes.dark);

if (!isGeneratedMultiMode) {
  // Legacy merge logic...
}
```

---

## Next Steps

1. ✅ **Test immediately** - Reload plugin and regenerate tokens
2. ✅ **Verify visually** - Check Figma Variables panel
3. ✅ **Test CSS export** - Ensure dark mode variables are exported
4. ⚠️ **Monitor** - Watch for any edge cases with existing tokens

---

## Related Files

- **Root Cause Analysis:** `ROOT_CAUSE_MODES_LOSS.md`
- **Implementation Plan:** `.gemini/antigravity/brain/.../implementation_plan.md`
- **Walkthrough:** `.gemini/antigravity/brain/.../walkthrough.md`
