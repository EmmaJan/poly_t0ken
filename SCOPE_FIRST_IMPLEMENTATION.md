# Scope-First Filtering System - Implementation

## Objectif

Implémenter un filtrage **strict "scope-first"** pour les suggestions de tokens :
- Filtrer par scope AVANT de calculer la proximité
- Aucun token hors scope ne peut apparaître, même avec une valeur proche
- Exemple : pour `gap: 10px`, aucun token `font/*` ne doit être suggéré

## Composants Implémentés

### 1. `getExpectedScope(propertyKind, nodeContext)`

**Rôle :** Détermine le scope attendu pour une propriété

**Mapping :**
```javascript
{
  'Item Spacing': 'SPACING',
  'Padding Left/Right/Top/Bottom': 'SPACING',
  'CORNER RADIUS': 'RADIUS',
  'Font Size': 'TYPO_SIZE',
  'Font Weight': 'TYPO_WEIGHT',
  'Fill/Stroke/Text': 'COLOR',
  'Width/Height': 'SIZING',
  'Stroke Weight': 'BORDER_WIDTH',
  'Opacity': 'OPACITY'
}
```

**Retour :** `"SPACING" | "SIZING" | "RADIUS" | "BORDER_WIDTH" | "TYPO_SIZE" | etc.`

### 2. `getTokenScope(token)`

**Rôle :** Détermine le scope d'un token

**Priorité 1 - Figma Scopes :**
```javascript
{
  'GAP': 'SPACING',
  'CORNER_RADIUS': 'RADIUS',
  'FONT_SIZE': 'TYPO_SIZE',
  'ALL_FILLS': 'COLOR',
  etc.
}
```

**Priorité 2 - Namespace Fallback :**
```javascript
'space/' → 'SPACING'
'radius/' → 'RADIUS'
'font/size' → 'TYPO_SIZE'
'font/weight' → 'TYPO_WEIGHT'
'bg/' → 'COLOR'
etc.
```

**Important :** Le fallback n'est pas "cas par cas", c'est une classification stable par familles.

### 3. `filterTokensByScope(tokens, expectedScope)`

**Rôle :** Filtre les tokens par scope attendu AVANT distance

**Pipeline :**
```javascript
candidates = allTokens.filter(t => getTokenScope(t) === expectedScope)
suggestions = rankByDistance(candidates, inputValue)
```

**Debug logs :**
```
[filterTokensByScope] Expected: SPACING | Before: 150 | After: 45
```

## Intégration

### Pour `findNumericSuggestions`

**Ajouté au début de la fonction :**
```javascript
var expectedScope = getExpectedScope(propertyType);
console.log('[findNumericSuggestions] Property:', propertyType, 
            '| Expected Scope:', expectedScope, 
            '| Value:', targetValue);
```

**Appliqué AVANT tous les autres filtres :**
```javascript
// ✅ SCOPE-FIRST: Filter by expected scope BEFORE other filters
var scopeFiltered = filterTokensByScope(vars, expectedScope);
var filteredVars = filterVariablesByScopes(scopeFiltered, getScopesForProperty(propertyType));
```

## Critères de Succès

### Test 1: Gap 10px
- **Input :** `gap: 10px`
- **Expected Scope :** `SPACING`
- **Attendu :** Seuls tokens `space/*` suggérés
- **Rejeté :** Aucun token `font/*`, `radius/*`, etc.

### Test 2: Font Size 16px
- **Input :** `fontSize: 16px`
- **Expected Scope :** `TYPO_SIZE`
- **Attendu :** Seuls tokens `font/size/*` suggérés
- **Rejeté :** Aucun token `space/*`, `radius/*`, etc.

### Test 3: Corner Radius 8px
- **Input :** `cornerRadius: 8px`
- **Expected Scope :** `RADIUS`
- **Attendu :** Seuls tokens `radius/*` suggérés
- **Rejeté :** Aucun token `space/*`, `font/*`, etc.

## Debug Logs

```
[findNumericSuggestions] Property: Item Spacing | Expected Scope: SPACING | Value: 10
[filterTokensByScope] Expected: SPACING | Before: 150 | After: 45
[findNumericSuggestions] After scope-first filter: 45 / 150
[getTokenScope] Could not determine scope for token: custom-token-name
```

## Fichiers Modifiés

- **scope-first.js** : 205 lignes (système complet)
- **code.js** : Système inséré avant `findNumericSuggestions` (ligne 7245)

## Prochaines Étapes

1. ✅ Système scope-first implémenté
2. ⏳ Intégrer dans `findNumericSuggestions` (exact + approximate)
3. ⏳ Tester avec différents types de propriétés
4. ⏳ Ajuster les mappings si nécessaire
5. ⏳ Étendre aux couleurs si besoin

## Notes

- Le système est **générique** et **extensible**
- Pas de hardcode de noms spécifiques
- Classification stable par familles
- Logs détaillés pour debug
- Filtre appliqué AVANT tout calcul de distance
