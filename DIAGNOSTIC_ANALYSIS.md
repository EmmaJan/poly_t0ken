# DIAGNOSTIC: Pourquoi bg/inverse n'apparaît jamais dans les suggestions FILL

## ANALYSE DU PIPELINE ACTUEL

### Pipeline Complet (code.js)

```
1. checkFillsSafely (ligne 7736)
   ↓ Détecte FILL hardcodé
   ↓ Calcule contextModeId via detectFrameMode()
   ↓
2. findColorSuggestions (ligne 6854)
   ↓ Cherche dans valueToVariableMap
   ↓ Filtre par scopes
   ↓ Filtre par isSemanticVariable
   ↓ Filtre par resolvedType === 'COLOR'
   ↓
3. enrichSuggestionsWithRealValues (ligne 7479)
   ↓ Résout les valeurs pour l'UI
   ↓ ⚠️ UTILISE collection.modes[0].modeId (ligne 7497)
   ↓
4. UI Display
```

## CAUSES PROBABLES IDENTIFIÉES

### 🔴 CAUSE #1: Utilisation de modes[0] au lieu de contextModeId

**Fichier:** `code.js`
**Fonction:** `enrichSuggestionsWithRealValues`
**Ligne:** 7497

```javascript
var modeId = (collection.modes && collection.modes.length > 0) ? collection.modes[0].modeId : 'default';
```

**Problème:**
- `enrichSuggestionsWithRealValues` ne reçoit PAS le `contextModeId`
- Utilise TOUJOURS `collection.modes[0]` (probablement "Light")
- Si bg/inverse a une valeur différente en Light vs Dark, la résolution sera incorrecte

**Impact:**
- bg/inverse en mode Dark (#030712) pourrait être résolu avec le mode Light
- La valeur affichée ne correspondrait pas à la couleur hardcodée
- Le token serait exclu du ranking par distance

### 🔴 CAUSE #2: Filtre sémantique strict via isSemanticVariable

**Fichier:** `code.js`
**Fonction:** `findColorSuggestions`
**Ligne:** 6900-6914

```javascript
var semanticExactMatches = filteredExactMatches.filter(function (v) {
  var isSemantic = isSemanticVariable(v.name, v);
  
  if (DEBUG_SCOPES_SCAN && !isSemantic) {
    console.log('🚫 [SUGGESTION_FILTER] Excluded non-semantic:', {
      name: v.name,
      reason: 'Not semantic (primitive or unknown pattern)'
    });
  }
  
  return isSemantic;
});
```

**Problème:**
- Si `isSemanticVariable("bg/inverse")` retourne `false`, le token est exclu
- Besoin de vérifier la logique de `isSemanticVariable` (ligne 4960)

**À vérifier:**
- Est-ce que "bg/inverse" matche les patterns sémantiques?
- Est-ce que la collection est reconnue comme sémantique?

### 🔴 CAUSE #3: Filtre de collection permissif (ligne 6924-6928)

```javascript
var semanticVars = filteredVars.filter(function (v) {
  if (!v.collectionName) return false;
  var name = v.collectionName.toLowerCase();
  return name.indexOf('semantic') !== -1 || name.indexOf('sémantique') !== -1 || 
         name.indexOf('tokens') !== -1 || name.indexOf('brand') !== -1 || 
         name.indexOf('emma') !== -1;
});
```

**Problème:**
- Si la collection de bg/inverse ne contient pas ces mots-clés, elle est exclue
- Whitelist implicite des collections

**À vérifier:**
- Quel est le nom exact de la collection contenant bg/inverse?

### 🟡 CAUSE #4: valueToVariableMap indexation

**Fichier:** `code.js`
**Fonction:** `Scanner.initMap` (ligne ~3000)

**Problème potentiel:**
- La map est construite avec un filtre sémantique (ligne 2991-2996)
- Si bg/inverse est considéré comme primitif, il n'est jamais indexé

```javascript
// FILTRE SEMANTIC-ONLY: ne garder que les variables sémantiques
if (!isSemanticVariable(variable.name, variable)) {
  if (DEBUG_SCOPES_SCAN) {
    console.log('🚫 [SCAN_FILTER] Excluded primitive variable:', variable.name);
  }
  return; // Skip les primitives
}
```

**À vérifier:**
- bg/inverse est-il dans la map initiale?
- Taille de la map vs nombre total de variables

### 🟡 CAUSE #5: Résolution d'alias échouée

**Si bg/inverse est un alias:**

**Problème potentiel:**
- L'alias pointe vers une primitive qui n'existe pas
- L'alias pointe vers un mode qui n'existe pas
- Cycle dans la chaîne d'alias

**À vérifier:**
- bg/inverse est-il un alias?
- Vers quoi pointe-t-il?
- La résolution réussit-elle dans contextModeId?

## HYPOTHÈSES À TESTER

### Hypothèse A: bg/inverse n'est jamais dans la map
**Test:** Log `valueToVariableMap.size` et chercher "inverse" dans les clés

### Hypothèse B: bg/inverse est filtré par isSemanticVariable
**Test:** Log tous les tokens exclus par ce filtre

### Hypothèse C: bg/inverse est filtré par collection
**Test:** Log le nom de la collection de bg/inverse

### Hypothèse D: bg/inverse est résolu avec le mauvais mode
**Test:** Log `modeId` utilisé vs `contextModeId` attendu

### Hypothèse E: bg/inverse a une valeur différente en Light vs Dark
**Test:** Log la valeur résolue en Light et en Dark

## PLAN DE DIAGNOSTIC (À IMPLÉMENTER)

### Étape 1: Insérer le système de diagnostic

**Fichier:** Insérer `DIAGNOSTIC_BG_INVERSE.js` dans `code.js` avant `checkFillsSafely`

### Étape 2: Instrumenter checkFillsSafely

**Ajouter après ligne 7736:**
```javascript
tracePipelineOverview();
traceCollectionFilters();
```

**Ajouter après ligne 7772 (après findColorSuggestions):**
```javascript
var tokenNeedles = ['bg/inverse', 'bg-inverse', 'bg / inverse', 'inverse'];
debugExplainWhyNotToken(tokenNeedles, 'FINAL_SUGGESTIONS', suggestions, {
  contextModeId: contextModeId,
  inputHex: hexValue
});
```

### Étape 3: Instrumenter findColorSuggestions

**Ajouter après ligne 6890 (après exactMatches):**
```javascript
if (exactMatches) {
  debugExplainWhyNotToken(['bg/inverse', 'bg-inverse'], 'EXACT_MATCHES_RAW', exactMatches, {
    contextModeId: contextModeId,
    searchKey: searchKey
  });
}
```

**Ajouter après ligne 6898 (après scope filter):**
```javascript
debugExplainWhyNotToken(['bg/inverse', 'bg-inverse'], 'AFTER_SCOPE_FILTER', filteredExactMatches, {
  requiredScopes: requiredScopes
});
```

**Ajouter après ligne 6914 (après semantic filter):**
```javascript
debugExplainWhyNotToken(['bg/inverse', 'bg-inverse'], 'AFTER_SEMANTIC_FILTER', semanticExactMatches, {
  filterFunction: 'isSemanticVariable'
});
```

**Ajouter après ligne 6928 (après COLOR type filter):**
```javascript
debugExplainWhyNotToken(['bg/inverse', 'bg-inverse'], 'AFTER_COLOR_TYPE_FILTER', colorSemanticMatches, {
  expectedType: 'COLOR'
});
```

### Étape 4: Instrumenter enrichSuggestionsWithRealValues

**Ajouter au début (ligne 7480):**
```javascript
traceUIEnrichment(suggestions, null); // contextModeId not available here!
```

**Ajouter après ligne 7497 (résolution de valeur):**
```javascript
if (variable.name.toLowerCase().indexOf('inverse') !== -1) {
  traceAliasResolution(variable.name, [], resolvedVal, modeId);
  console.log('⚠️ [ENRICHMENT] Using modeId:', modeId, 'for variable:', variable.name);
  console.log('⚠️ [ENRICHMENT] Should use contextModeId instead!');
}
```

### Étape 5: Instrumenter Scanner.initMap

**Ajouter après ligne 2991 (filtre sémantique):**
```javascript
if (variable.name.toLowerCase().indexOf('inverse') !== -1) {
  console.log('[SCANNER.INITMAP] Checking bg/inverse...');
  console.log('[SCANNER.INITMAP] isSemanticVariable result:', isSemanticVariable(variable.name, variable));
  if (!isSemanticVariable(variable.name, variable)) {
    console.log('⚠️ [SCANNER.INITMAP] bg/inverse EXCLUDED from map!');
  }
}
```

### Étape 6: Vérifier valueToVariableMap

**Ajouter au début de findColorSuggestions:**
```javascript
// Check if bg/inverse is in the map
var foundInverse = false;
valueToVariableMap.forEach(function(vars, key) {
  vars.forEach(function(v) {
    if (v.name.toLowerCase().indexOf('inverse') !== -1) {
      foundInverse = true;
      console.log('[DIAGNOSTIC] Found in map:', v.name, 'key:', key);
    }
  });
});
if (!foundInverse) {
  console.log('⚠️ [DIAGNOSTIC] bg/inverse NOT FOUND in valueToVariableMap!');
}
```

## RÉSULTATS ATTENDUS

Après exécution du diagnostic, on devrait savoir:

1. **bg/inverse est-il dans valueToVariableMap?** Oui/Non
2. **À quel filtre disparaît-il?**
   - Scope filter?
   - Semantic filter (isSemanticVariable)?
   - Collection filter?
   - COLOR type filter?
3. **Quel mode est utilisé pour la résolution?**
   - modes[0] (Light) au lieu de contextModeId (Dark)?
4. **La valeur résolue est-elle correcte?**
   - Correspond-elle à la couleur hardcodée?

## PLAN DE CORRECTION (NE PAS IMPLÉMENTER MAINTENANT)

### Fix #1: Passer contextModeId à enrichSuggestionsWithRealValues

**Ligne 7772:**
```javascript
// AVANT
var suggestions = enrichSuggestionsWithRealValues(findColorSuggestions(...));

// APRÈS
var suggestions = enrichSuggestionsWithRealValues(
  findColorSuggestions(...),
  contextModeId  // ← Ajouter ce paramètre
);
```

**Ligne 7479:**
```javascript
// AVANT
function enrichSuggestionsWithRealValues(suggestions) {

// APRÈS
function enrichSuggestionsWithRealValues(suggestions, contextModeId) {
```

**Ligne 7497:**
```javascript
// AVANT
var modeId = (collection.modes && collection.modes.length > 0) ? collection.modes[0].modeId : 'default';

// APRÈS
var modeId = contextModeId || (collection.modes && collection.modes.length > 0) ? collection.modes[0].modeId : 'default';
```

### Fix #2: Vérifier isSemanticVariable accepte bg/inverse

**Si bg/inverse est rejeté, ajouter le pattern dans isSemanticVariable (ligne ~5000)**

### Fix #3: Vérifier le nom de la collection

**Si la collection n'est pas reconnue, ajouter son nom dans le filtre (ligne 6926)**

### Fix #4: Désactiver le filtre sémantique dans Scanner.initMap

**Si bg/inverse n'est jamais indexé, commenter lignes 2991-2996**

## PROCHAINES ÉTAPES

1. ✅ Créer le système de diagnostic (DIAGNOSTIC_BG_INVERSE.js)
2. ⏳ Insérer les sondes dans code.js (sans modifier le comportement)
3. ⏳ Exécuter le scan avec un élément ayant bg/inverse cassé
4. ⏳ Analyser les logs pour identifier la cause exacte
5. ⏳ Implémenter le fix approprié

## FICHIERS À MODIFIER (DIAGNOSTIC SEULEMENT)

- `code.js` : Ajouter les appels aux fonctions de diagnostic
- Pas de modification fonctionnelle
- Tous les logs derrière le flag `DIAGNOSTIC_BG_INVERSE`
