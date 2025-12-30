# Analyse des Problèmes Restants

## Problèmes Identifiés

### 1. ❌ Pas de suggestions pour GAP et CORNER RADIUS

**Cause**: La tolérance est à `0` dans les appels à `findNumericSuggestionsV2`
- Ligne 8903: `findNumericSuggestionsV2(node.itemSpacing, contextModeId, requiredScopes, "Item Spacing", 0)`
- Ligne 8841: `findNumericSuggestionsV2(node.cornerRadius, contextModeId, requiredScopes, "Corner Radius", 0)`

**Problème**: Avec `tolerance = 0`, seules les correspondances **exactes** sont retournées. Si la valeur scannée n'existe pas exactement dans les variables, aucune suggestion n'est proposée.

**Solution**: Augmenter la tolérance à 2-4px pour les valeurs numériques.

---

### 2. ❌ PADDING remonte comme "Spacing" au lieu de "Padding"

**Cause**: Ligne 8961
```javascript
property: "Spacing",  // ❌ INCORRECT
```

**Problème**: Le label affiché dans l'UI est "Spacing" pour tous les types (GAP et PADDING).

**Solution**: Utiliser le bon label selon le type :
- GAP → "Spacing" (ou "Gap")
- PADDING → "Padding"

---

### 3. ❌ Live Preview ne fonctionne pas

**Cause**: À investiguer dans l'UI - probablement un problème de communication entre UI et plugin.

**Localisation**: `ui.html` - fonction `sendPreviewFix`

---

### 4. ❌ Erreur lors de l'application mais la carte disparaît quand même

**Cause**: La carte disparaît avant la vérification du succès de l'application.

**Problème**: L'animation de disparition se déclenche même si `applyAndVerifyFix` retourne `success: false`.

**Localisation**: 
- `code.js`: `applyAndVerifyFix` retourne probablement une erreur
- `ui.html`: La logique de disparition de carte ne vérifie pas le résultat

---

## Corrections Prioritaires

### Priorité 1: Tolérance pour suggestions numériques
- GAP: tolérance de 2px
- CORNER_RADIUS: tolérance de 2px  
- PADDING: tolérance de 2px

### Priorité 2: Label correct pour PADDING
- Changer "Spacing" → "Padding"

### Priorité 3: Gestion d'erreur d'application
- Ne pas faire disparaître la carte si l'application échoue
- Afficher un message d'erreur clair

### Priorité 4: Live Preview
- Vérifier la fonction `sendPreviewFix` dans ui.html
- Vérifier le handler côté plugin
