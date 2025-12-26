# Generic Color Suggestion Engine - Implementation Notes

## Architecture Overview

Le nouveau moteur de suggestions de couleurs est **100% générique** et basé sur des principes scientifiques de perception des couleurs (OKLab).

## Composants Implémentés

### 1. OKLab Color Space (lignes 6854-6930)

**Conversion complète :** hex → sRGB → linear RGB → LMS → OKLab

**Fonction clé :** `oklabDistance(lab1, lab2)`
- Calcule la distance perceptuelle ΔE entre deux couleurs
- Plus précis que RGB Euclidien pour la perception humaine

### 2. Color Resolution with Alias Tracking (lignes 6932-7010)

**Fonction :** `resolveColor(value, modeId, variable, aliasChain, visited)`

**Fonctionnalités :**
- Résout les alias récursivement (variable → alias → primitive)
- Track la chaîne d'alias complète
- Détection de cycles
- Fallback explicite si mode non disponible
- Retourne : `{ hex, oklab, modeIdUsed, fallback, aliasChain }`

**Contraintes respectées :**
- ✅ Pas de `collection.modes[0]` pour résoudre
- ✅ Fallback explicite avec flag `fallback: true`
- ✅ Chaîne d'alias complète pour debug

### 3. Scope Compatibility (lignes 7012-7045)

**Fonction :** `isScopeCompatible(propertyKind, variableScopes)`

**Mapping générique :**
```javascript
{
  'Fill': ['ALL_FILLS', 'FRAME_FILL', 'SHAPE_FILL', 'TEXT_FILL'],
  'Stroke': ['ALL_STROKES', 'STROKE_COLOR'],
  'Text': ['TEXT_FILL'],
  'Background': ['FRAME_FILL', 'ALL_FILLS']
}
```

**Comportement :**
- Permissif si scopes absents (avec log)
- Permissif pour types inconnus (avec warning)
- Pas de hardcode de noms de librairies

### 4. Color Candidates Index (lignes 7047-7121)

**Fonction :** `buildColorCandidatesIndex(contextModeId)`

**Optimisation :**
- Cache de 30s pour éviter N*M à chaque couleur
- Construit l'index UNE FOIS par scan
- Résout toutes les variables COLOR dans le mode contexte
- **✅ Filtre sémantique :** Exclut automatiquement les primitives via `isSemanticVariable()`

**Filtre appliqué :**
```javascript
if (!isSemanticVariable(variable.name, variable)) {
  console.log('[buildColorCandidatesIndex] Excluded primitive:', variable.name);
  return;
}
```

**Primitives exclues :**
- `gray-50`, `gray-100`, etc. (échelles de couleurs)
- `brand-50`, `success-50`, etc. (primitives système)
- `spacing-1`, `border-1`, etc. (valeurs numériques)
- Collections : "Grayscale", "Brand Colors", "System Colors", etc.

**Sémantiques incluses :**
- `bg/canvas`, `text/primary`, etc. (avec slash)
- `background-default`, `action-primary`, etc. (préfixes sémantiques)
- Toute variable dans une collection sémantique

**Structure du cache :**
```javascript
{
  index: [...],
  contextModeId: "...",
  timestamp: Date.now(),
  CACHE_DURATION: 30000
}
```

### 5. Suggestion Engine (lignes 7117-7180)

**Fonction :** `suggestClosestVariables(inputHex, propertyKind, contextModeId, N=3)`

**Algorithme :**
1. Convert input → OKLab
2. Get candidates index
3. Filter by scope compatibility
4. Calculate OKLab distance for each
5. Apply fallback penalty (+0.2 si fallback mode)
6. Calculate confidence score
7. Sort by penalized distance
8. Return top N

**Score de confiance :**
```javascript
confidence = clamp(1 - (penalizedDistance / MAX_DISTANCE), 0, 1)
```

**Debug logs :**
- Nombre de candidates après filtre scope
- Top 10 résultats avec distance, confidence, fallback
- Chaîne d'alias pour chaque suggestion

### 6. Integration (ligne 7217-7235)

**Fonction wrapper :** `findColorSuggestions()`

**Changements :**
- Remplace toute la logique existante (~175 lignes → ~20 lignes)
- Appelle `suggestClosestVariables()` directement
- Convertit le résultat au format legacy pour compatibilité

**Format de retour :**
```javascript
{
  id: "...",
  name: "...",
  hex: "...",           // Couleur résolue utilisée pour le tri
  distance: 0.123,      // Distance OKLab brute
  confidence: 0.85,     // Score de confiance [0-1]
  fallback: false,      // true si mode fallback utilisé
  modeIdUsed: "...",    // Mode ID réellement utilisé
  aliasChain: [...]     // Chaîne d'alias complète
}
```

## Contraintes Respectées

✅ **Pas de logique sémantique :** Aucune règle basée sur "inverse", "primary", etc.
✅ **Pas de modes[0] :** Résolution explicite dans contextModeId
✅ **Fallback explicite :** Flag `fallback` + pénalité dans le score
✅ **Performance :** Index construit 1 fois, cache de 30s
✅ **Scope générique :** Mapping par type de propriété, pas par nom
✅ **Alias tracking :** Chaîne complète pour debug

## Tests à Effectuer

### 1. Frame Light + Couleur Sombre
**Input :** `#2D2827` dans frame light
**Attendu :** Tokens sombres en mode LIGHT remontent (ex: `text/primary` en light)

### 2. Frame Dark + Couleur Claire
**Input :** `#F9FAFB` dans frame dark
**Attendu :** Tokens clairs en mode DARK remontent (ex: `bg/canvas` en dark)

### 3. Token Alias
**Input :** Couleur qui matche un alias
**Attendu :** Tri basé sur la primitive résolue, aliasChain visible en debug

### 4. Token Sans Valeur
**Input :** Token qui n'existe pas dans ce mode
**Attendu :** Exclu OU fallback flaggé avec `fallback: true`

### 5. Scopes Incompatibles
**Input :** Couleur de texte
**Attendu :** Seuls tokens avec `TEXT_FILL` scope remontent

### 6. UI Consistency
**Attendu :** UI affiche `resolvedHex` (même valeur que celle utilisée pour le tri)

## Debug Logs Ajoutés

```javascript
[buildColorCandidatesIndex] Building new index for mode: <modeId>
[buildColorCandidatesIndex] Built index with <N> candidates
[suggestClosestVariables] Input: <hex> Property: <type> Mode: <modeId>
[suggestClosestVariables] Candidates after scope filter: <N> / <total>
[suggestClosestVariables] Top 10: [{ name, hex, dist, conf, fallback, aliasChain }]
[resolveColor] Cycle detected: <varName>
[resolveColor] Alias target not found: <id>
[isScopeCompatible] No scopes defined, allowing: <propertyKind>
[isScopeCompatible] Unknown propertyKind: <type>
```

## Fichiers Modifiés

- **code.js** : +361 lignes (moteur) + remplacement de `findColorSuggestions`
- **Total** : ~11270 lignes

## Prochaines Étapes

1. Tester dans Figma avec différents scénarios
2. Ajuster `MAX_DISTANCE` (actuellement 0.5) si nécessaire
3. Ajuster `FALLBACK_PENALTY` (actuellement 0.2) si nécessaire
4. Afficher `fallback` et `confidence` dans l'UI
5. Afficher `aliasChain` en mode debug
