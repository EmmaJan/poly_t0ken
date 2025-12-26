# REFACTO SCAN ENGINE - État Actuel & Prochaines Étapes

## ✅ CE QUI EST FAIT

### 1. Bug Principal RÉSOLU ✅
- **Cause racine identifiée :** Mode detection basée sur luminance au lieu de mode explicite Figma
- **Solution :** Nouvelle fonction `detectNodeModeId()` qui retourne directement le `modeId`
- **Résultat :** `bg/inverse` est maintenant correctement détecté et suggéré !

### 2. Enums Créés ✅
```javascript
PropertyKind = { FILL, TEXT_FILL, STROKE, EFFECT_COLOR, GAP, PADDING, CORNER_RADIUS, STROKE_WEIGHT, FONT_SIZE, LINE_HEIGHT, LETTER_SPACING, UNKNOWN }
TokenKind = { SEMANTIC, PRIMITIVE }
IssueStatus = { UNBOUND, NO_MATCH, HAS_MATCHES }
ValueType = { COLOR, FLOAT }
```

### 3. Data Model Factories ✅
- `createScanIssue(params)` - Garantit aucun champ `undefined`
- `createSuggestion(params)` - Garantit aucun champ `undefined`

### 4. Token Name Normalization ✅
- `normalizeTokenName(name)` - Transforme `"bg.inverse"`, `"bg/inverse"`, `"bg / inverse"` → `"bg-inverse"`
- Utilisé dans `isSemanticVariable()`

### 5. Self-Checks Créés ✅
- `selfCheckNormalization()` - Teste toutes les variantes de noms
- `selfCheckScanIssueNoUndefined()` - Vérifie qu'aucun champ n'est `undefined`
- `selfCheckSuggestionNoUndefined()` - Vérifie qu'aucun champ n'est `undefined`
- `runAllSelfChecks()` - Execute tous les tests

## 🚧 CE QUI RESTE À FAIRE

### Étape 4 : Mode-Aware Index (CRITIQUE)
**Objectif :** Créer un index unique des variables pour un matching rapide et fiable.

**À implémenter :**
```javascript
var VariableIndex = {
  colorExact: new Map(),      // Map<modeId|hex, VariableMeta[]>
  colorPreferred: new Map(),  // Map<hex, VariableMeta[]>
  floatExact: new Map(),      // Map<modeId|value, VariableMeta[]>
  floatPreferred: new Map()   // Map<value, VariableMeta[]>
};

type VariableMeta = {
  id, name, normalizedName,
  resolvedType, tokenKind,
  scopes[], collectionName,
  modeId, resolvedValue
};
```

**Fonction :**
```javascript
function buildVariableIndex() {
  // Parcourir toutes les variables
  // Pour chaque variable :
  //   - Déterminer tokenKind (SEMANTIC/PRIMITIVE)
  //   - Pour chaque mode :
  //     - Résoudre la valeur
  //     - Indexer dans colorExact/floatExact avec clé modeId|value
  //     - Indexer dans colorPreferred/floatPreferred avec clé value
}
```

### Étape 5 : Refactorer findColorSuggestions (CRITIQUE)
**Objectif :** Utiliser le nouvel index au lieu de `valueToVariableMap`.

**Nouveau flow :**
1. Chercher dans `colorExact` avec clé `contextModeId|hexValue`
2. Si rien, chercher dans `colorPreferred` avec clé `hexValue`
3. Si rien, approximate matching (distance <= threshold) sur `colorPreferred` filtré par scopes
4. Utiliser `createSuggestion()` pour chaque match
5. Retourner les suggestions

### Étape 6 : Refactorer findNumericSuggestions
**Objectif :** Utiliser le nouvel index pour les valeurs numériques.

**Nouveau flow :**
1. Chercher dans `floatExact` avec clé `contextModeId|value`
2. Si rien, chercher dans `floatPreferred` avec clé `value`
3. Si rien, nearest matching (abs diff <= tolerance) sur `floatPreferred` filtré par scopes
4. Utiliser `createSuggestion()` pour chaque match
5. Retourner les suggestions

### Étape 7 : Utiliser createScanIssue dans checkFillsSafely
**Objectif :** Remplacer les objets ad-hoc par `createScanIssue()`.

**Changements :**
```javascript
// AVANT
results.push({
  nodeId: node.id,
  layerName: node.name,
  property: propertyType,
  value: hexValue,
  ...
});

// APRÈS
results.push(createScanIssue({
  nodeId: node.id,
  nodeName: node.name,
  nodeType: node.type,
  propertyKind: PropertyKind.FILL,
  propertyKey: 'fills',
  rawValue: hexValue,
  rawValueType: ValueType.COLOR,
  contextModeId: contextModeId,
  requiredScopes: requiredScopes,
  suggestions: suggestions,
  status: suggestions.length > 0 ? IssueStatus.HAS_MATCHES : IssueStatus.NO_MATCH
}));
```

### Étape 8 : Assertion "No Undefined" avant postMessage
**Objectif :** Garantir qu'aucun `undefined` n'est envoyé à l'UI.

**À ajouter :**
```javascript
function assertNoUndefined(obj, context) {
  var requiredFields = ['nodeId', 'nodeName', 'nodeType', 'propertyKind', 'propertyKey', 'rawValue', 'status'];
  for (var i = 0; i < requiredFields.length; i++) {
    var field = requiredFields[i];
    if (obj[field] === undefined) {
      console.error('[ASSERTION FAILED]', context, 'has undefined field:', field, obj);
      throw new Error('Undefined field: ' + field + ' in ' + context);
    }
  }
}

// Utilisation avant postMessage
results.forEach(function(result) {
  assertNoUndefined(result, 'scan result');
});
```

### Étape 9 : UI Safety
**Objectif :** Adapter `ui.html` pour afficher `ScanIssue` sans casser.

**Changements :**
- Utiliser `propertyKind` au lieu de `property`
- Afficher "Aucune variable compatible" si `status === NO_MATCH`
- Gérer `suggestions` vide sans erreur

## 📊 TESTS À EFFECTUER

### Test 1 : bg/inverse en mode Light ✅
- Frame avec `#030712` en mode Light
- **Attendu :** `bg/inverse` suggéré
- **Statut :** ✅ FONCTIONNE

### Test 2 : Aucun undefined dans l'UI
- Scanner une frame
- Inspecter les résultats dans la console
- **Attendu :** Aucun champ `undefined`
- **Statut :** ⏳ À TESTER après implémentation complète

### Test 3 : Scopes respectés
- Scanner un GAP (itemSpacing)
- **Attendu :** Aucune suggestion de FONT_SIZE
- **Statut :** ⏳ À TESTER

### Test 4 : Mode hérité du parent
- Frame parent en Light, enfants sans mode explicite
- **Attendu :** Tous les enfants utilisent Light
- **Statut :** ⏳ À TESTER

## 🎯 PRIORITÉS

**CRITIQUE (À faire maintenant) :**
1. Créer `buildVariableIndex()` et l'appeler au démarrage
2. Refactorer `findColorSuggestions` pour utiliser l'index
3. Utiliser `createScanIssue()` dans `checkFillsSafely`

**IMPORTANT (Peut attendre) :**
4. Refactorer `findNumericSuggestions`
5. Ajouter assertion "no undefined"
6. Adapter UI pour `ScanIssue`

**NICE TO HAVE :**
7. Intégrer self-checks au démarrage
8. Scan exhaustif de toutes les propriétés
9. Ranking intelligent par PropertyKind

## 📝 COMMITS

1. `2821300` - Pre-refacto snapshot
2. `a9eaecd` - Fix: detectNodeModeId returns modeId directly
3. `13395e5` - Fix: ensure suggestion.name is preserved
4. `1f5c266` - Refacto: added normalizeTokenName function
5. `f7ad449` - Docs: complete refacto summary
6. `e1bff2d` - Refacto: added enums and data model factories
7. `400efb5` - Refacto: added self-checks for validation

## ⏱️ ESTIMATION

**Temps restant pour refacto complète :** ~45-60 minutes

**Breakdown :**
- buildVariableIndex : 15 min
- Refactor findColorSuggestions : 15 min
- Utiliser createScanIssue : 10 min
- Tests & validation : 10 min
- Documentation finale : 10 min

## 🚀 PROCHAINE ACTION

**Veux-tu que je continue avec `buildVariableIndex()` maintenant ?**

Ou préfères-tu t'arrêter là et tester ce qui est déjà fait ?
