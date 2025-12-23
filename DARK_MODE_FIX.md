# Dark Mode Token Fix - Summary & Test Plan

## Problem Summary

The Figma plugin was not correctly generating dark mode variables. Specifically:
- Dark mode tokens were defaulting to white (`#FFFFFF`) instead of their intended dark values
- The CSS export showed invalid dark mode values
- Figma variables only had light mode values, with dark mode missing or incorrect

## Root Cause

The issue was in the token saving and state determination logic:

1. **Token Generation**: The Token Engine correctly generated tokens with a `modes` structure:
   ```javascript
   {
     type: 'COLOR',
     modes: {
       light: { resolvedValue: '#fff', aliasRef: { category: 'gray', key: 'white' } },
       dark: { resolvedValue: '#000', aliasRef: { category: 'gray', key: '950' } }
     }
   }
   ```

2. **State Determination Bug**: The `saveSemanticTokensToFile` function was checking for `normalizedToken.aliasTo` to determine if a token was an alias, but tokens with the `modes` structure don't have `aliasTo` at the root level - they have `aliasRef` inside each mode (light/dark).

3. **Double-Counting Bug**: Tokens with the `modes` structure were being counted twice in the statistics, which could lead to incorrect reporting.

## Solution Applied

### 1. State Determination Fix (Lines 207-229)
Updated the state determination logic to check for `aliasRef` within `modes.light` and `modes.dark`:

```javascript
// ✅ Pour les tokens avec modes, vérifier aliasRef dans chaque mode
if (normalizedToken.modes) {
  var hasLightAlias = normalizedToken.modes.light && normalizedToken.modes.light.aliasRef;
  var hasDarkAlias = normalizedToken.modes.dark && normalizedToken.modes.dark.aliasRef;
  
  if (hasLightAlias || hasDarkAlias) {
    state = TOKEN_STATE.ALIAS_RESOLVED;
  }
} else if (normalizedToken.aliasTo) {
  // Ancienne structure : vérifier aliasTo
  // ...
}
```

### 2. Double-Counting Fix (Lines 268-271)
Removed the duplicate counting for tokens with `modes` structure. Now they're only counted once based on their state.

### 3. Previous Fixes (Already Applied)
- **Lines 191-205**: Preserve `modes` structure instead of normalizing
- **Lines 218-260**: Skip validation checks for tokens with `modes` structure

## Test Plan

### Prerequisites
1. Ensure `code.js` has all the fixes applied
2. Open Figma with the plugin installed
3. Have a design library selected (e.g., Tailwind, Chakra, MUI, or Ant Design)

### Test Steps

#### Step 1: Clear Existing Data
```javascript
// In Figma console:
figma.root.setPluginData("tokenStarter.semantic", "{}");
figma.root.setPluginData("tokenStarter.primitive", "{}");
console.log("✅ Plugin data cleared");
```

#### Step 2: Reload Plugin
- Close and reopen the plugin, OR
- Reload Figma

#### Step 3: Generate Tokens
1. Open the plugin
2. Select a design library (e.g., "Tailwind")
3. Click "Generate" or equivalent button
4. Wait for generation to complete

#### Step 4: Verify Console Logs
Check the Figma console for:
```
💾 SEMANTIC_SAVE[AUTO_GENERATE]: Total 50 | Resolved: XX | Unresolved: 0 | Values: YY
```
- `Resolved` should be > 0 (indicating aliases are detected)
- `Values` should be lower than before (since aliases aren't counted as values)

#### Step 5: Verify Figma Variables
1. Open Figma's "Local variables" panel (right sidebar)
2. Find the "Semantic" collection
3. Verify:
   - ✅ Both "Light" and "Dark" modes exist
   - ✅ Select a semantic color token (e.g., `bg/canvas`)
   - ✅ Check Light mode value (should be a light color or alias to primitive)
   - ✅ Check Dark mode value (should be a DIFFERENT dark color or alias to primitive)
   - ✅ Dark mode should NOT be white unless semantically correct

#### Step 6: Verify CSS Export
1. In the plugin, navigate to the "Developer" or "Export" tab
2. Select "CSS Variables" format
3. Click "Export" or "Download"
4. Open the exported CSS file
5. Verify:
   ```css
   :root {
     /* Primitives only */
   }
   
   html[data-theme="light"] {
     --bg-canvas: var(--gray-50); /* or similar */
   }
   
   html[data-theme="dark"] {
     --bg-canvas: var(--gray-900); /* DIFFERENT from light! */
   }
   ```
   - ✅ Dark mode values should be distinct from light mode
   - ✅ Dark mode should NOT default to `#FFFFFF` or `var(--gray-white)`

### Expected Results

✅ **Success Criteria:**
1. Console shows aliases are being detected (`Resolved > 0`)
2. Figma variables have both Light and Dark modes with distinct values
3. Dark mode colors are appropriate (dark backgrounds, light text, etc.)
4. CSS export shows correct dark mode values
5. No console errors about "CRITICAL: resolvedValue is an object"

❌ **Failure Indicators:**
1. Dark mode values are identical to light mode
2. Dark mode defaults to white/light colors
3. Console shows `Resolved: 0` (no aliases detected)
4. CSS export has invalid or missing dark mode values

## Rollback Plan

If the fix doesn't work, revert the following changes:
1. Lines 207-229 (state determination)
2. Lines 268-271 (double-counting fix)
3. Lines 191-205 (modes structure preservation)
4. Lines 218-260 (validation skip for modes)

## Additional Notes

- The fix maintains backward compatibility with tokens that don't have the `modes` structure
- Tokens with `modes` are now properly classified as `ALIAS_RESOLVED` when they have `aliasRef`
- The synchronization logic in `importTokensToFigma` (lines 4900-4970) already supports the `modes` structure correctly
