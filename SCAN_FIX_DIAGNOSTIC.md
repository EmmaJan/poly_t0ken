# Diagnostic Scan & Fix - Pas de suggestions

## Problème observé
- 199 issues détectées dans l'onglet "Manuel"
- Toutes marquées "Aucune variable compatible"
- Les GAP (3px, 16px, 4px, 18px) ne trouvent pas leurs variables

## Logs de diagnostic activés

J'ai ajouté des logs DEBUG détaillés pour identifier le problème :

### 1. Logs dans `findNumericSuggestionsV2`
```javascript
[findNumericSuggestionsV2] START {
  targetValue,
  value,
  contextModeId,
  requiredScopes,
  propertyType,
  tolerance,
  indexBuilt,
  floatExactSize,
  floatPreferredSize
}

[findNumericSuggestionsV2] END {
  value,
  suggestionsCount,
  exactMatchesCount,
  suggestions: [...]
}
```

### 2. Logs dans `filterVariableByScopes`
```javascript
[SCOPE_FILTER] Variable excluded (no scopes defined): nom_variable
[SCOPE_FILTER] Variable excluded (scope mismatch): nom_variable {
  varScopes: [...],
  requiredScopes: [...]
}
```

## Comment diagnostiquer

### Étape 1 : Activer DEBUG
Dans `code.js`, ligne ~25, vérifier que :
```javascript
const DEBUG = true;
```

### Étape 2 : Recharger le plugin
1. Cmd+Option+P → "Reload plugin"
2. Vérifier les logs de démarrage :
   ```
   ✅ Plugin initialized: scopes use setScopes() method only
   ✅ Using V2 scan functions (mode-aware, ValueType.FLOAT, strict scoping)
   ✅ [INDEX] Build Complete: { total: X, indexed: Y, ... }
   ```

### Étape 3 : Lancer un scan
1. Sélectionner un frame avec GAP
2. Lancer le scan
3. Observer la console développeur

### Étape 4 : Analyser les logs

#### Cas A : Index vide
```javascript
[findNumericSuggestionsV2] START {
  floatExactSize: 0,
  floatPreferredSize: 0
}
```
**Problème** : Les variables ne sont pas indexées
**Solution** : Vérifier que les variables existent et sont de type FLOAT

#### Cas B : Variables sans scopes
```javascript
[SCOPE_FILTER] Variable excluded (no scopes defined): spacing/gap-4
```
**Problème** : Les variables n'ont pas de scopes définis
**Solution** : Ajouter les scopes aux variables dans Figma

#### Cas C : Scopes incompatibles
```javascript
[SCOPE_FILTER] Variable excluded (scope mismatch): spacing/gap-4 {
  varScopes: ['CORNER_RADIUS'],
  requiredScopes: ['GAP']
}
```
**Problème** : Les variables ont les mauvais scopes
**Solution** : Corriger les scopes des variables

#### Cas D : Pas de match exact
```javascript
[findNumericSuggestionsV2] END {
  suggestionsCount: 0,
  exactMatchesCount: 0
}
```
**Problème** : Aucune variable ne correspond à la valeur
**Solution** : Créer les variables manquantes ou vérifier les valeurs

## Solutions possibles

### Solution 1 : Vérifier les scopes des variables
1. Ouvrir Figma → Variables
2. Sélectionner une variable de spacing (ex: `spacing/gap-4`)
3. Vérifier que le scope "Gap" est coché
4. Faire de même pour toutes les variables de spacing

### Solution 2 : Recréer les variables avec les bons scopes
Si les variables existent mais sans scopes :
1. Noter les valeurs actuelles
2. Supprimer les variables
3. Les recréer via le plugin avec les scopes corrects

### Solution 3 : Désactiver temporairement le filtrage strict
**⚠️ Temporaire uniquement pour diagnostic**

Dans `code.js`, ligne ~7663, modifier :
```javascript
if (!meta.scopes || meta.scopes.length === 0) {
  // Temporairement : accepter les variables sans scopes
  return true; // Au lieu de return false
}
```

Cela permettra de voir si le problème vient des scopes.

## Scopes attendus par propriété

| Propriété | Scopes requis |
|-----------|---------------|
| GAP (itemSpacing) | `['GAP']` |
| Padding | `['TOP_PADDING', 'BOTTOM_PADDING', 'LEFT_PADDING', 'RIGHT_PADDING']` |
| Corner Radius | `['CORNER_RADIUS']` |
| Font Size | `['FONT_SIZE']` |
| Line Height | `['LINE_HEIGHT']` |
| Fill (Shape) | `['ALL_FILLS', 'FRAME_FILL', 'SHAPE_FILL']` |
| Fill (Text) | `['ALL_FILLS', 'TEXT_FILL']` |
| Stroke | `['STROKE_COLOR']` |

## Prochaines étapes

1. **Lancer un scan avec DEBUG=true**
2. **Copier les logs de la console**
3. **Identifier le cas (A, B, C ou D)**
4. **Appliquer la solution correspondante**

Si le problème persiste, partager les logs complets pour analyse approfondie.
