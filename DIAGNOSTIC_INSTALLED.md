# SYSTÈME DE DIAGNOSTIC - INSTALLÉ ET PRÊT

## ✅ INSTALLATION COMPLÈTE

**Fichier modifié :** `code.js`
- **+552 lignes** (système de diagnostic)
- **Total :** 11,632 lignes
- **Aucune modification fonctionnelle** - Seulement des logs

## SONDES INSTALLÉES

### 1. Pipeline Overview (checkFillsSafely - ligne 7953)
```javascript
tracePipelineOverview();
traceCollectionFilters();
```

**Affiche :**
- Vue d'ensemble du pipeline complet
- Filtres de collection actifs

### 2. Vérification de la Map (findColorSuggestions - ligne 6866)
```javascript
// Check if bg/inverse is in valueToVariableMap
```

**Affiche :**
- ✅ bg/inverse FOUND ou ❌ NOT FOUND
- Détails : nom, clé, collection
- Taille de la map

### 3. Exact Matches Raw (findColorSuggestions - ligne 6933)
```javascript
debugExplainWhyNotToken(['bg/inverse'], 'EXACT_MATCHES_RAW', exactMatches)
```

**Affiche :**
- bg/inverse présent dans les matches exacts ?
- Détails complets si trouvé

### 4. After Scope Filter (findColorSuggestions - ligne 6945)
```javascript
debugExplainWhyNotToken(['bg/inverse'], 'AFTER_SCOPE_FILTER', filteredExactMatches)
```

**Affiche :**
- bg/inverse survit au filtre de scopes ?
- Scopes requis vs scopes de la variable

### 5. After Semantic Filter (findColorSuggestions - ligne 6960)
```javascript
debugExplainWhyNotToken(['bg/inverse'], 'AFTER_SEMANTIC_FILTER', semanticExactMatches)
```

**Affiche :**
- bg/inverse survit au filtre isSemanticVariable ?
- Raison d'exclusion si rejeté

### 6. After COLOR Type Filter (findColorSuggestions - ligne 6975)
```javascript
debugExplainWhyNotToken(['bg/inverse'], 'AFTER_COLOR_TYPE_FILTER', colorSemanticMatches)
```

**Affiche :**
- bg/inverse a bien resolvedType === 'COLOR' ?

### 7. Final Suggestions (checkFillsSafely - ligne 8020)
```javascript
debugExplainWhyNotToken(['bg/inverse'], 'FINAL_SUGGESTIONS_FROM_checkFillsSafely', suggestions)
```

**Affiche :**
- bg/inverse dans les suggestions finales ?
- ContextModeId utilisé
- Input hex

### 8. UI Enrichment (enrichSuggestionsWithRealValues - ligne 7549)
```javascript
traceUIEnrichment(suggestions, null);
```

**Affiche :**
- Suggestions enrichies pour l'UI
- ModeId utilisé pour chaque suggestion
- ⚠️ Pas de contextModeId disponible ici !

### 9. Modes[0] Warning (enrichSuggestionsWithRealValues - ligne 7574)
```javascript
if (variable.name.indexOf('inverse') !== -1) {
  console.log('⚠️ Using modes[0] instead of contextModeId!');
}
```

**Affiche :**
- Avertissement si bg/inverse est enrichi
- ModeId utilisé (modes[0])
- Modes disponibles

### 10. Scanner.initMap Exclusion (Scanner.initMap - ligne 2995)
```javascript
if (variable.name.indexOf('inverse') !== -1) {
  console.log('⚠️ bg/inverse EXCLUDED from map!');
}
```

**Affiche :**
- Si bg/inverse est exclu lors de la construction de la map
- Raison : isSemanticVariable retourne false

## COMMENT UTILISER

### Étape 1: Activer le diagnostic
Le flag `DIAGNOSTIC_BG_INVERSE` est déjà à `true` (ligne 7740)

### Étape 2: Préparer un test
1. Créer un rectangle avec bg/inverse appliqué
2. Casser la variable (détacher)
3. Lancer le scan

### Étape 3: Analyser les logs
Ouvrir la console Figma et chercher :

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ FILL SUGGESTION PIPELINE OVERVIEW                       ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

Puis suivre les logs :
```
✅ [DIAGNOSTIC] bg/inverse FOUND in valueToVariableMap
ou
❌ [DIAGNOSTIC] bg/inverse NOT FOUND in valueToVariableMap
```

Puis pour chaque filtre :
```
═══════════════════════════════════════════════════════════
[WHY_NOT_BG_INVERSE] Stage: EXACT_MATCHES_RAW
[WHY_NOT_BG_INVERSE] Looking for: bg/inverse OR bg-inverse
[WHY_NOT_BG_INVERSE] List size: 45
[WHY_NOT_BG_INVERSE] ✅ FOUND: bg/inverse
ou
[WHY_NOT_BG_INVERSE] ❌ NOT FOUND
═══════════════════════════════════════════════════════════
```

### Étape 4: Identifier la cause

**Si bg/inverse n'est PAS dans la map :**
→ Problème dans Scanner.initMap (filtre sémantique)
→ Chercher log : `⚠️ [SCANNER.INITMAP] bg/inverse EXCLUDED`

**Si bg/inverse disparaît après SCOPE_FILTER :**
→ Problème de scopes Figma incompatibles
→ Vérifier les scopes de bg/inverse dans Figma

**Si bg/inverse disparaît après SEMANTIC_FILTER :**
→ Problème dans isSemanticVariable
→ bg/inverse n'est pas reconnu comme sémantique

**Si bg/inverse disparaît après COLOR_TYPE_FILTER :**
→ Problème de resolvedType
→ bg/inverse n'a pas resolvedType === 'COLOR'

**Si bg/inverse est dans FINAL_SUGGESTIONS mais pas affiché :**
→ Problème dans enrichSuggestionsWithRealValues
→ Chercher log : `⚠️ [ENRICHMENT] Using modeId: ... (collection.modes[0])`
→ Vérifier si le mode utilisé est correct

## LOGS ATTENDUS (EXEMPLE)

### Cas 1: bg/inverse exclu de la map
```
⚠️ [SCANNER.INITMAP] Variable: bg/inverse
⚠️ [SCANNER.INITMAP] isSemanticVariable result: false
⚠️ [SCANNER.INITMAP] bg/inverse EXCLUDED from map!
⚠️ [SCANNER.INITMAP] Collection: VariableCollectionId:123:456

❌ [DIAGNOSTIC] bg/inverse NOT FOUND in valueToVariableMap!
   Map size: 150
```

**Diagnostic :** bg/inverse n'est jamais indexé car isSemanticVariable le rejette

### Cas 2: bg/inverse dans la map mais exclu par filtre sémantique
```
✅ [DIAGNOSTIC] bg/inverse FOUND in valueToVariableMap:
   - bg/inverse | key: #030712 | collection: Semantic Tokens

[WHY_NOT_BG_INVERSE] Stage: EXACT_MATCHES_RAW
[WHY_NOT_BG_INVERSE] ✅ FOUND: bg/inverse

[WHY_NOT_BG_INVERSE] Stage: AFTER_SCOPE_FILTER
[WHY_NOT_BG_INVERSE] ✅ FOUND: bg/inverse

[WHY_NOT_BG_INVERSE] Stage: AFTER_SEMANTIC_FILTER
[WHY_NOT_BG_INVERSE] ❌ NOT FOUND
[WHY_NOT_BG_INVERSE] Possible reason: AFTER_SEMANTIC_FILTER
```

**Diagnostic :** bg/inverse est exclu par isSemanticVariable dans findColorSuggestions

### Cas 3: bg/inverse dans les suggestions mais mauvais mode
```
✅ [DIAGNOSTIC] bg/inverse FOUND in valueToVariableMap:
   - bg/inverse | key: #030712 | collection: Semantic Tokens

[WHY_NOT_BG_INVERSE] Stage: FINAL_SUGGESTIONS_FROM_checkFillsSafely
[WHY_NOT_BG_INVERSE] ✅ FOUND: bg/inverse
[WHY_NOT_BG_INVERSE] Details: {
  resolvedHex: "#F9FAFB",  ← MAUVAIS! Devrait être #030712
  modeIdUsed: "light_mode_id"
}

⚠️ [ENRICHMENT] Variable: bg/inverse
⚠️ [ENRICHMENT] Using modeId: light_mode_id (collection.modes[0])
⚠️ [ENRICHMENT] Should use contextModeId instead!
⚠️ [ENRICHMENT] Available modes: ["Light:light_mode_id", "Dark:dark_mode_id"]
```

**Diagnostic :** bg/inverse est résolu avec le mauvais mode (Light au lieu de Dark)

## DÉSACTIVER LE DIAGNOSTIC

Pour désactiver tous les logs, changer ligne 7740 :
```javascript
var DIAGNOSTIC_BG_INVERSE = false;
```

## PROCHAINES ÉTAPES

1. ✅ Système de diagnostic installé
2. ⏳ Tester avec bg/inverse cassé
3. ⏳ Analyser les logs
4. ⏳ Identifier la cause exacte
5. ⏳ Implémenter le fix approprié

## FICHIERS CRÉÉS

- ✅ `DIAGNOSTIC_BG_INVERSE.js` - Fonctions de diagnostic (inséré dans code.js)
- ✅ `DIAGNOSTIC_ANALYSIS.md` - Analyse complète des causes probables
- ✅ `DIAGNOSTIC_INSTALLED.md` - Ce document

**Le système est prêt ! Recharge le plugin et lance un scan.** 🔍
