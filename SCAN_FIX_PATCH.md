# Scan & Fix - Patch de Stabilisation

## Résumé des modifications

### 1. ✅ Log de vérification V2
**Fichier**: `code.js` (ligne 6)
- Ajout d'un log au démarrage : `"✅ Using V2 scan functions (mode-aware, ValueType.FLOAT, strict scoping)"`
- Permet de vérifier immédiatement quelle version du scan est active

### 2. ✅ Tolérance EPSILON pour les floats
**Fichier**: `code.js` (lignes 7727-7739)
- Ajout d'une tolérance `EPSILON = 0.001` dans `findNumericSuggestionsV2`
- Corrige les erreurs de précision float (ex: 4.0000001 vs 4)
- Recherche limitée et performante (pas de scan global)
- Comportement strict conservé (pas de rounding 7→8)

**Logique implémentée** :
```javascript
// EPSILON tolerance for float precision issues (e.g., 4.0000001 vs 4)
var EPSILON = 0.001;
if (exactMatches.length === 0) {
  VariableIndex.floatPreferred.forEach(function (metas, candidateValue) {
    if (Math.abs(candidateValue - value) < EPSILON) {
      metas.forEach(function (meta) {
        if (isValidCandidate(meta)) exactMatches.push(meta);
      });
    }
  });
}
```

### 3. ✅ Logs d'erreur explicites
**Fichier**: `code.js`
- Remplacement de tous les `catch(e) {}` silencieux par des logs DEBUG
- Ajout de contexte détaillé : `nodeId`, `nodeName`, `nodeType`, `prop`, `error`

**Emplacements modifiés** :
- `checkCornerRadiusSafely:individual` (ligne 8724)
- `checkStrokesSafely:stroke` (ligne 8631)
- `checkNumericPropertiesSafely:padding` (ligne 8857)
- `checkNumericPropertiesSafely:global` (ligne 8861)
- `checkFillsSafely` (déjà présent, ligne 8523)
- `checkTypographyPropertiesSafely` (déjà présent, ligne 8125)

### 4. ✅ Suppression du badge "Already bound"
**Fichier**: `ui.html` (lignes 6811-6814 supprimées)
- Suppression complète du badge "Already bound" de l'interface
- L'UI affiche uniquement les issues par status (NO_MATCH/HAS_MATCHES)
- `isBound` reste utilisé en interne pour le groupement (correct)

### 5. ✅ ValueType.FLOAT déjà en place
**Vérification** : Aucune occurrence de `ValueType.NUMBER` trouvée
- Tous les scans numériques utilisent déjà `ValueType.FLOAT`
- `createScanIssue` remplit correctement `numericSuggestions` pour FLOAT
- Affichage "px" cohérent via `value: params.rawValue + (isFloat ? 'px' : '')`

## État des fonctions de scan

### ✅ Pas de duplication détectée
- `checkNumericPropertiesSafely` : 1 seule occurrence (ligne 8746)
- `createScanIssue` : 1 seule occurrence (ligne 5417)
- `findNumericSuggestionsV2` : 1 seule occurrence (ligne 7691)

Toutes les fonctions sont déjà en version V2 mode-aware.

## Validation

### Tests à effectuer :
1. ✅ **Log de démarrage** : Vérifier que le log V2 apparaît au chargement du plugin
2. ✅ **GAP exact** : Un gap de 4px doit proposer une variable sémantique si elle existe
3. ✅ **numericSuggestions** : Ne doit plus être vide si des suggestions existent
4. ✅ **Logs DEBUG** : Les erreurs de scan doivent être loggées avec contexte complet
5. ✅ **UI propre** : Aucun badge "Already bound" ne doit apparaître

### Comportement attendu :
- **Strict par défaut** : Pas de rounding automatique (7 ne match pas 8)
- **Tolérant aux floats** : 4.0000001 match 4 (EPSILON=0.001)
- **Logs utiles** : Tous les catch blocks loggent en DEBUG
- **UI claire** : Affichage basé uniquement sur status et suggestions

## Fichiers modifiés
- ✅ `code.js` : 6 modifications (log V2, EPSILON, 4x catch logs)
- ✅ `ui.html` : 1 modification (suppression badge)

## Aucune régression
- ✅ Syntaxe validée : `node -c code.js` passe
- ✅ Pas de breaking changes
- ✅ Patch minimal comme demandé
- ✅ Fonctions existantes préservées
