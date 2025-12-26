# REFACTO SCAN ENGINE - Résumé Final

## 🎯 Cause Racine du Bug `bg/inverse`

**Problème :** Le système cherchait `#030712` avec `contextMode: 1:17` (Dark) au lieu de `1:16` (Light).

**Pourquoi ?**
1. `detectFrameMode()` retournait un **nom** ('light'/'dark') basé sur la **luminance du fond**
2. Fond noir (`#030712`) → luminance < 0.5 → détecté comme "dark"
3. `getModeIdByName()` convertissait 'dark' → `1:17`
4. Le système cherchait `1:17|#030712` dans la map
5. Dans Dark, `bg/inverse` = `#F9FAFB` (blanc), PAS `#030712`
6. Donc `bg/inverse` n'était PAS dans les exact matches
7. Le système trouvait `bg/canvas` à la place

## ✅ Solutions Implémentées

### 1. Fix Mode Detection (CRITIQUE)

**Nouvelle fonction `detectNodeModeId()`** qui retourne directement le `modeId` au lieu du nom.

**Priorités :**
1. **Mode explicite du node** : `node.explicitVariableModes`
2. **Mode explicite du parent** : héritage récursif
3. **Mode Light par défaut** : de la collection Semantic

**Avantages :**
- ✅ Pas de conversion nom → ID (source de bugs)
- ✅ Respecte le mode explicite défini dans Figma
- ✅ Hérite du parent si le node n'a pas de mode explicite
- ✅ Fallback intelligent sur Light (pas sur luminance)

**Fichiers modifiés :**
- `code.js` ligne ~5099 : Ajout de `detectNodeModeId()`
- `code.js` ligne ~8126 : Scan parent utilise `detectNodeModeId()`
- `code.js` ligne ~8232 : Scan children utilise `detectNodeModeId()`

### 2. Fix UI "undefined"

**Problème :** `suggestion.name` était `undefined` dans l'UI.

**Solution :** Ajout d'un fallback dans `enrichSuggestionsWithRealValues` pour récupérer le nom depuis la variable Figma si absent.

**Fichier modifié :**
- `code.js` ligne ~7703 : Ajout du fallback `enriched.name = variable.name`

### 3. Token Name Normalization

**Nouvelle fonction `normalizeTokenName()`** pour une correspondance cohérente des noms de tokens.

**Transformations :**
- `"bg.inverse"` → `"bg-inverse"`
- `"bg/inverse"` → `"bg-inverse"`
- `"bg / inverse"` → `"bg-inverse"`
- `"bg - inverse"` → `"bg-inverse"`

**Utilisation :**
- `isSemanticVariable()` : Détection sémantique cohérente
- Prêt pour utilisation dans l'indexation et le matching

**Fichier modifié :**
- `code.js` ligne ~5089 : Ajout de `normalizeTokenName()`
- `code.js` ligne ~4973 : Utilisation dans `isSemanticVariable()`

## 📊 Tests de Validation

### Test 1 : Frame avec mode Light explicite ✅
1. Créer une frame avec fill `#030712` (noir)
2. Définir le mode à "Light" (pas Auto)
3. Lancer le scan
4. **Résultat attendu :** `bg/inverse` suggéré
5. **Résultat obtenu :** ✅ `bg/inverse` trouvé et affiché

### Test 2 : Frame en mode Auto
1. Créer une frame avec fill `#030712` (noir)
2. Laisser le mode en "Auto"
3. Lancer le scan
4. **Résultat attendu :** Le système hérite du parent ou utilise Light par défaut
5. **À tester**

### Test 3 : Enfants héritent du parent
1. Frame parent en mode "Light"
2. Enfants sans mode explicite
3. Lancer le scan
4. **Résultat attendu :** Tous les enfants utilisent le mode Light du parent
5. **À tester**

## 🔍 Logs de Debug

Chercher dans la console :
```
🔍 [DEBUG] Detected modeId for parent: 1:16 node: Sidebar
🔍 [DEBUG] Detected modeId for children: 1:16 node: Sidebar
✅ FOUND: bg / inverse
Context Mode: 1:16
```

Si tu vois `1:17` au lieu de `1:16`, le mode est toujours mal détecté.

## 📝 Prochaines Étapes de la Refacto

### Étape 3 : Enums & Data Model (TODO)
- [ ] Créer `PropertyKind`, `TokenKind`, `IssueStatus` enums
- [ ] Créer le type `ScanIssue` unifié
- [ ] Créer le type `Suggestion` avec debug info

### Étape 4 : Mode-Aware Index (TODO)
- [ ] Construire `colorIndexExact: Map<modeId|hex, VariableMeta[]>`
- [ ] Construire `colorIndexPreferred: Map<hex, VariableMeta[]>`
- [ ] Construire `floatIndexExact` et `floatIndexPreferred`
- [ ] Créer `VariableMeta` avec `normalizedName`

### Étape 5 : Suggestion Engine (TODO)
- [ ] Refactorer `findColorSuggestions` pour utiliser le nouvel index
- [ ] Refactorer `findNumericSuggestions` pour utiliser le nouvel index
- [ ] Implémenter ranking intelligent par `PropertyKind` et `nodeType`
- [ ] Ajouter debug info dans chaque suggestion

### Étape 6 : Scan Exhaustif (TODO)
- [ ] Créer `scanNode(node, ctx) -> ScanIssue[]`
- [ ] Scanner TOUTES les propriétés (fills, strokes, effects, text, corners, spacing, typography)
- [ ] Produire un `ScanIssue` pour CHAQUE propriété non liée (même `NO_MATCH`)

### Étape 7 : UI Safety (TODO)
- [ ] Adapter `ui.html` pour afficher `ScanIssue`
- [ ] Gérer `status=NO_MATCH` avec message "Aucune variable compatible"
- [ ] Assertion "no undefined" avant `postMessage`

### Étape 8 : Tests & Self-Checks (TODO)
- [ ] Test `normalizeTokenName` sur toutes les variantes
- [ ] Test scopes : GAP ne propose jamais FONT_SIZE
- [ ] Test mode : token Light matchable en Light
- [ ] Test "no undefined" assertion

## ⚠️ Points de Vigilance

1. **Toujours recharger le plugin** après modification
2. **Vérifier le mode de la frame** dans Figma (pas Auto si problème)
3. **Vérifier les logs** pour confirmer le bon modeId
4. **Tester avec différents modes** (Light, Dark, Auto)
5. **Vérifier que `bg/inverse` s'affiche** sans "undefined"

## 📦 Commits

1. `2821300` - Pre-refacto snapshot
2. `a9eaecd` - Fix: detectNodeModeId returns modeId directly
3. `13395e5` - Fix: ensure suggestion.name is preserved
4. `1f5c266` - Refacto: added normalizeTokenName function

## 🎉 Résultat

**BUG PRINCIPAL RÉSOLU :** `bg/inverse` est maintenant correctement détecté et suggéré pour les frames en mode Light avec un fond noir !

**REFACTO EN COURS :** Fondations posées (mode detection + normalization), prêt pour la suite.
