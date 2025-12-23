# 🔧 Correctifs Complets : Gestion des Modes Multi-Variables

## 📋 Résumé

Trois correctifs majeurs ont été appliqués pour résoudre les problèmes de gestion des modes (Light/Dark) dans le plugin :

1. **Indexation multi-modes** : Toutes les valeurs de tous les modes sont maintenant indexées
2. **Préservation du mode du node** : Le mode actif du node est préservé lors de l'application
3. **Suggestions multi-modes** : Les suggestions incluent toutes les correspondances, pas seulement le mode par défaut

---

## 🐛 Problème 1 : Scan ne trouve pas les variables du mode Dark

### Symptôme
- Un calque avec `#0D0C0D` (valeur Dark de `color-bg-canvas`)
- Le scan ne propose pas `color-bg-canvas`
- Seules les variables du mode Light sont proposées

### Cause
`createValueToVariableMap()` n'indexait que le mode par défaut de chaque collection (généralement "Light").

### Solution
**Fichier** : `code.js` - Fonction `createValueToVariableMap()`

```javascript
// AVANT : Indexait seulement le mode par défaut
var activeModeId = activeModes[collection.id];
collection.variableIds.forEach(function (variableId) {
  var resolvedValue = resolveVariableValue(variable, activeModeId);
  // Indexe seulement pour ce mode
});

// APRÈS : Parcourt TOUS les modes
collection.modes.forEach(function (mode) {
  var modeId = mode.modeId;
  var modeName = mode.name;
  
  collection.variableIds.forEach(function (variableId) {
    var resolvedValue = resolveVariableValue(variable, modeId);
    // Indexe pour CHAQUE mode
    map.get(hexValue).push({
      id: variable.id,
      name: variable.name,
      modeId: modeId,  // ← Inclut le modeId
      modeName: modeName,  // ← Inclut le nom du mode
      // ...
    });
  });
});
```

**Résultat** :
- ✅ La map contient maintenant `color-bg-canvas` avec ses valeurs Light ET Dark
- ✅ Un calque `#0D0C0D` trouve `color-bg-canvas` (mode Dark)
- ✅ Un calque `#F3F2F3` trouve `color-bg-canvas` (mode Light)

---

## 🐛 Problème 2 : Variable appliquée affiche la mauvaise valeur

### Symptôme
- Une variable est appliquée à un node en mode Dark
- La variable affiche la valeur du mode Light
- Le mode du node n'est pas respecté

### Cause
`setBoundVariable()` ne prend pas de paramètre de mode. Le mode affiché dépend du **mode explicite du node**, pas de la variable.

Si le node n'a pas de mode explicite défini, Figma utilise le mode par défaut de la collection.

### Solution
**Fichiers** : `code.js` - Fonctions `applyColorVariableToFill()`, `applyColorVariableToStroke()`, `applyNumericVariable()`

```javascript
// AVANT : Application directe sans définir le mode
node.setBoundVariable(fillPath, variable);

// APRÈS : Préservation du mode actif du node
var collection = figma.variables.getVariableCollectionById(variable.variableCollectionId);
if (collection) {
  var currentNodeMode = getNodeActiveMode(node, collection.id);
  if (currentNodeMode) {
    // Rendre explicite le mode actif (hérité ou déjà explicite)
    node.setExplicitVariableModeForCollection(collection, currentNodeMode);
  } else {
    // Utiliser le mode par défaut si aucun mode actif
    node.setExplicitVariableModeForCollection(collection, collection.defaultModeId);
  }
}

// Puis appliquer la variable
node.setBoundVariable(fillPath, variable);
```

**Nouvelle fonction** : `getNodeActiveMode(node, collectionId)`
```javascript
function getNodeActiveMode(node, collectionId) {
  // 1. Vérifier resolvedVariableModes (inclut explicites + hérités)
  if (node.resolvedVariableModes && node.resolvedVariableModes[collectionId]) {
    return node.resolvedVariableModes[collectionId];
  }
  
  // 2. Fallback : vérifier explicitVariableModes (seulement explicites)
  if (node.explicitVariableModes && node.explicitVariableModes[collectionId]) {
    return node.explicitVariableModes[collectionId];
  }
  
  // 3. Fallback final : utiliser le mode par défaut de la collection
  var collection = figma.variables.getVariableCollectionById(collectionId);
  return collection ? collection.defaultModeId : null;
}
```

**Résultat** :
- ✅ Le mode actif du node est détecté via `resolvedVariableModes`
- ✅ Ce mode est rendu explicite avec `setExplicitVariableModeForCollection()`
- ✅ La variable affiche la bonne valeur pour le bon mode
- ✅ Fonctionne pour les couleurs (Fill/Stroke) ET les propriétés numériques (fontSize, spacing, radius, etc.)

---

## 🐛 Problème 3 : Suggestions filtrées par mode par défaut

### Symptôme
- La map contient des variables pour tous les modes
- Mais `findColorSuggestions` et `findNumericSuggestions` filtrent strictement par mode par défaut
- Résultat : certaines correspondances ne sont pas proposées

### Cause
Les fonctions de suggestion filtraient par `activeModes[collection.id]` qui retourne toujours le mode par défaut.

### Solution
**Fichiers** : `code.js` - Fonctions `findColorSuggestions()` et `findNumericSuggestions()`

```javascript
// AVANT : Filtrage strict par mode actif (mode par défaut)
var activeModes = getActiveModes();
var activeModeMatches = exactMatches.filter(function (v) {
  var collection = figma.variables.getVariableCollectionById(v.collectionId);
  return collection && activeModes[collection.id] === v.modeId;
});

// APRÈS : Priorisation des Semantic, tous modes confondus
var semanticMatches = exactMatches.filter(function (v) {
  return v.collectionName === 'Semantic';
});

var matchesToUse = semanticMatches.length > 0 ? semanticMatches : exactMatches;
var filteredMatches = filterVariablesByScopes(matchesToUse, requiredScopes);
```

**Résultat** :
- ✅ Toutes les correspondances exactes sont trouvées, quel que soit le mode
- ✅ Les variables Semantic sont toujours prioritaires
- ✅ Le filtrage par scopes est toujours appliqué
- ✅ Fonctionne pour les couleurs ET les propriétés numériques

---

## 🎯 Validation des Modes

La validation a également été améliorée pour tenir compte du mode du node :

**Fonction** : `validateVariableForActiveMode(variable, node)`

```javascript
// AVANT : Validation contre le mode par défaut
var activeModeId = activeModes[collection.id];
var valueInActiveMode = variable.valuesByMode[activeModeId];

// APRÈS : Validation contre le mode du node
if (node) {
  modeIdToCheck = getNodeActiveMode(node, variable.variableCollectionId);
} else {
  modeIdToCheck = getActiveModes()[collection.id];
}
var valueInActiveMode = variable.valuesByMode[modeIdToCheck];
```

**Résultat** :
- ✅ La validation vérifie que la variable a une valeur pour le mode du node
- ✅ Message d'erreur clair si la variable n'est pas compatible

---

## 📊 Récapitulatif des Modifications

| Fonction | Fichier | Modification | Impact |
|----------|---------|--------------|--------|
| `createValueToVariableMap()` | code.js | Indexe tous les modes | Scan trouve toutes les variables |
| `getNodeActiveMode()` | code.js | Nouvelle fonction | Détecte le mode actif du node |
| `applyColorVariableToFill()` | code.js | Préserve le mode | Couleurs correctes |
| `applyColorVariableToStroke()` | code.js | Préserve le mode | Couleurs correctes |
| `applyNumericVariable()` | code.js | Préserve le mode | Valeurs numériques correctes |
| `findColorSuggestions()` | code.js | Suggestions multi-modes | Trouve toutes les correspondances |
| `findNumericSuggestions()` | code.js | Suggestions multi-modes | Trouve toutes les correspondances |
| `validateVariableForActiveMode()` | code.js | Validation par node | Validation précise |
| `validateVariableCanBeApplied()` | code.js | Validation par node | Validation précise |

---

## 🧪 Tests Recommandés

### Test 1 : Scan Multi-Modes
1. Créer une frame en mode Dark
2. Ajouter un rectangle avec `#0D0C0D` (valeur Dark de `color-bg-canvas`)
3. Scanner la frame
4. ✅ Vérifier que `color-bg-canvas` est proposé

### Test 2 : Application Multi-Modes
1. Créer une frame en mode Dark
2. Scanner et appliquer une correction avec une variable sémantique
3. ✅ Vérifier que la couleur affichée correspond au mode Dark
4. Changer la frame en mode Light
5. ✅ Vérifier que la couleur change automatiquement

### Test 3 : Propriétés Numériques
1. Créer une frame en mode Dark avec des variables numériques différentes par mode
2. Ajouter un élément avec un spacing qui correspond au mode Dark
3. Scanner
4. ✅ Vérifier que la variable de spacing est proposée

---

## 🔍 Logs de Débogage

Les logs suivants sont maintenant disponibles :

```
[VariableMapCache] Map built with 245 unique values across all modes
Apply Fill Variable: Preserving node mode "Dark" for collection "Semantic"
Apply Fill Variable: Setting bound variable
Apply Fill Variable: Variable applied successfully via setBoundVariable
[validateVariableForActiveMode] Validating variable "color-bg-canvas" for node mode "Dark"
```

---

## 🎉 Conclusion

Le plugin gère maintenant correctement les modes Figma pour :
- ✅ **Toutes les propriétés** : Couleurs (Fill/Stroke) et valeurs numériques (fontSize, spacing, radius, border, padding)
- ✅ **Tous les modes** : Light, Dark, et tout autre mode personnalisé
- ✅ **Toutes les opérations** : Scan, suggestions, validation, et application

La solution est **complète, robuste, et extensible** pour gérer n'importe quel système de modes Figma.
