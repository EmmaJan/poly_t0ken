# 🔍 AUDIT REFACTO SAFE - PolyToken by Emma

**Date** : 23 décembre 2025  
**Reviewer** : Senior JS/TS Specialist  
**Objectif** : Audit exhaustif + Plan de refactorisation safe sans casser le fonctionnel

---

## 📋 1. INVENTAIRE DES FONCTIONNALITÉS

### 1.1 Génération de Tokens

**Nom** : Token Generation System  
**Entrées** :
- Couleur primaire (hex)
- Type de librairie (tailwind, mui, ant, bootstrap, chakra, shadcn)
- Mode thème (light, dark, both)

**Sorties** :
- Tokens primitifs (brand, gray, system, spacing, radius, typography, border)
- Tokens sémantiques (bg, text, border, action, status, on-colors)
- Variables Figma synchronisées

**État manipulé** :
- `cachedTokens` (global)
- `figma.root.pluginData["tokenStarter.naming"]`
- `figma.root.pluginData["tokenStarter.primitives"]`
- `figma.root.pluginData["tokenStarter.semantic"]`
- `figma.variables` (collections + variables)

**Dépendances** :
- **Fonctions** : `generateBrandColors`, `generateGrayscale`, `generateSystemColors`, `generateSpacing`, `generateRadius`, `generateTypography`, `generateBorder`, `generateSemanticTokens`, `generateCorePrimitives`, `generateCoreSemantics`
- **Services** : `FigmaService`, `ColorService`
- **Constantes** : `SEMANTIC_TOKENS`, `SEMANTIC_TYPE_MAP`, `SEMANTIC_NAME_MAP`
- **Storage** : `saveNamingToFile`, `savePrimitivesTokensToFile`, `saveSemanticTokensToFile`

**Points de fragilité** :
- ⚠️ **Double moteur** (Legacy vs Core) avec flag `USE_CORE_ENGINE = false` → risque de divergence
- ⚠️ **Alias non créés** dans certains cas (voir `AUDIT_GENERATION_SEMANTIQUE.md`)
- ⚠️ **Structure modes** complexe pour sémantiques (light/dark)
- ⚠️ **Palette incomplète** (26/55 tokens selon INDEX_AUDIT.md)

---

### 1.2 Scan & Détection d'Écarts

**Nom** : Smart Scanner  
**Entrées** :
- Sélection Figma (nodes)
- Flag `ignoreHiddenLayers` (boolean)

**Sorties** :
- Liste de résultats avec écarts détectés
- Suggestions de tokens sémantiques
- Score de pertinence par suggestion

**État manipulé** :
- `Scanner.lastScanResults` (array)
- `Scanner.valueMap` (Map, cache 30s)
- `lastScanResults` (UI global)
- `appliedResultIndices`, `ignoredResultIndices` (UI)

**Dépendances** :
- **Fonctions** : `Scanner.scanSelection`, `Scanner._scanNodeRecursive`, `Scanner._checkProperties`, `Scanner.initMap`
- **Helpers** : `isSemanticVariable`, `isColorProperty`, `isNumericProperty`, `calculateColorDistance`, `isNumericMatch`
- **Figma API** : `figma.currentPage.selection`, `figma.getNodeById`

**Points de fragilité** :
- ⚠️ **Cache valueMap** peut devenir stale si variables changent pendant le scan
- ⚠️ **Filtrage semantic-only** peut exclure des primitives utiles
- ⚠️ **Détection de mode** (Light/Dark) peut être incorrecte selon le frame
- ⚠️ **Profondeur max** (CONFIG.limits.MAX_DEPTH) peut limiter le scan de structures complexes

---

### 1.3 Application de Corrections (Fixer)

**Nom** : Auto-Fix System  
**Entrées** :
- Résultat de scan (nodeId, property, suggestedVariableId)
- Variable ID à appliquer

**Sorties** :
- Modifications Figma (fills, strokes, spacing, radius)
- Compteur de corrections appliquées
- Notifications utilisateur

**État manipulé** :
- Propriétés des nodes Figma (fills, strokes, cornerRadius, etc.)
- `appliedResultIndices` (UI tracking)
- Historique Figma (undo stack)

**Dépendances** :
- **Fonctions** : `Fixer.applySingle`, `Fixer.applyGroup`, `Fixer.applyAll`, `applyColorVariableToFill`, `applyColorVariableToStroke`, `applyNumericVariable`
- **Validation** : `Fixer._validatePropertyExists`, `Fixer._validateVariableCanBeApplied`
- **Figma API** : `node.setBoundVariable`, `node.fills`, `node.strokes`

**Points de fragilité** :
- ⚠️ **Nodes locked** peuvent bloquer l'application
- ⚠️ **Nodes removed** causent des erreurs silencieuses
- ⚠️ **Validation scopes** peut rejeter des variables valides
- ⚠️ **Undo/Redo** ne restaure pas l'état UI (cartes disparues)

---

### 1.4 Import/Export de Tokens

**Nom** : Token Import/Export  
**Entrées** :
- Fichier JSON/CSS (import)
- Tokens générés (export)
- Format cible (CSS, JSON, Tailwind, SCSS)

**Sorties** :
- Variables Figma créées/mises à jour
- Code exporté (CSS, JSON, Tailwind config, SCSS)

**État manipulé** :
- `figma.variables` (création/mise à jour)
- Clipboard (copie export)

**Dépendances** :
- **Fonctions** : `importTokensToFigma`, `exportToCSS`, `exportToJSON`, `exportToTailwind`, `exportToSCSS`
- **Helpers** : `sanitizeVariableName`, `generateCssName`, `normalizeAliasTo`
- **UI** : `updateExport`, `highlightSyntax`, `doCopy`

**Points de fragilité** :
- ⚠️ **Sanitization** des noms peut créer des collisions
- ⚠️ **Export CSS** manquant selon INDEX_AUDIT.md
- ⚠️ **Alias perdus** lors de l'import/export
- ⚠️ **Format JSON** peut diverger entre versions

---

### 1.5 Gestion de l'UI (Wizard Multi-Step)

**Nom** : Wizard Navigation  
**Entrées** :
- Clics utilisateur
- Messages du plugin

**Sorties** :
- Navigation entre étapes (0-4)
- Affichage conditionnel de sections
- Feedback visuel

**État manipulé** :
- `currentStep` (0-4)
- `currentNaming`, `currentColor`, `currentThemeMode`
- `hasExistingTokens`, `existingTokensData`
- Visibilité des éléments DOM

**Dépendances** :
- **Fonctions** : `switchStep`, `resetWizard`, `updatePreview`, `updateExport`
- **Event Listeners** : 40+ addEventListener (voir grep_search)
- **DOM** : Manipulation massive de classes, styles, innerHTML

**Points de fragilité** :
- ⚠️ **État distribué** entre UI et plugin (sync complexe)
- ⚠️ **Event listeners** non nettoyés (memory leaks potentiels)
- ⚠️ **innerHTML** utilisé massivement (XSS risk, performance)
- ⚠️ **Conditions imbriquées** pour visibilité (hard to debug)

---

### 1.6 Animations & Feedback

**Nom** : UI Animation System  
**Entrées** :
- Actions utilisateur (apply fix, undo, etc.)
- Résultats d'opérations

**Sorties** :
- Animations CSS (fade, slide, color flash)
- Notifications toast
- Compteurs dynamiques

**État manipulé** :
- Styles inline des cartes
- Classes CSS temporaires
- Timers/timeouts

**Dépendances** :
- **Modules** : `AnimationManager`, `PillManager`, `UIManager` (optionnels)
- **Fonctions** : `handleAllFixesApplied`, `handleBatchUndoComplete`, `showNotification`
- **DOM** : Transitions CSS, opacity, transform

**Points de fragilité** :
- ⚠️ **Timers non nettoyés** (clearTimeout manquant)
- ⚠️ **Animations concurrentes** peuvent se chevaucher
- ⚠️ **Fallback vers ancien code** si modules non chargés
- ⚠️ **Performance** avec beaucoup de cartes (100+)

---

### 1.7 Persistence & Storage

**Nom** : Data Persistence Layer  
**Entrées** :
- Tokens générés
- Préférences utilisateur

**Sorties** :
- Données sauvegardées dans Figma
- Restauration au démarrage

**État manipulé** :
- `figma.root.pluginData` (naming, themeMode)
- `figma.clientStorage` (async fallback)
- Variables Figma (source of truth)

**Dépendances** :
- **Fonctions** : `saveNamingToFile`, `getNamingFromFile`, `savePrimitivesTokensToFile`, `getPrimitivesTokensFromFile`, `saveSemanticTokensToFile`, `getSemanticTokensFromFile`
- **Helpers** : `safeStringify`, `analyzeSemanticTokensStats`

**Points de fragilité** :
- ⚠️ **Données corrompues** si JSON invalide
- ⚠️ **Limite de taille** pluginData (non documentée)
- ⚠️ **Sync async/sync** peut causer race conditions
- ⚠️ **Migration** entre versions non gérée

---

## 📊 2. CARTE DES FLUX (Événements → Handlers → Effets)

### 2.1 Flux de Génération

```
[UI] Clic "Générer" 
  → parent.postMessage({ type: 'generate', hex, naming, themeMode })
  → [Plugin] figma.ui.onmessage case 'generate'
    → generateBrandColors() / generateGrayscale() / etc.
    → generateSemanticTokens() (si Legacy) OU generateCoreSemantics() (si Core)
    → saveNamingToFile() + savePrimitivesTokensToFile() + saveSemanticTokensToFile()
    → figma.ui.postMessage({ type: 'tokens-generated', tokens, semanticPreview })
  → [UI] handleMsg_tokensGenerated()
    → currentTokens = msg.tokens
    → switchStep(3)
    → updatePreview()
```

**Invariants** :
- ✅ Tokens doivent contenir 7 catégories (brand, gray, system, spacing, radius, typography, border)
- ✅ Semantic tokens doivent avoir structure modes: {light: {}, dark: {}}
- ✅ Naming doit être sauvegardé avant tokens

---

### 2.2 Flux d'Import

```
[UI] Clic "Importer dans Figma"
  → parent.postMessage({ type: 'import', tokens, naming, overwrite })
  → [Plugin] figma.ui.onmessage case 'import'
    → importTokensToFigma(tokens, naming, overwrite)
      → Créer/Mettre à jour collections Figma
      → Créer/Mettre à jour variables Figma
      → Gérer les alias (aliasTo)
    → figma.ui.postMessage({ type: 'import-completed' })
  → [UI] Notification "Tokens importés"
```

**Invariants** :
- ✅ Collections doivent être créées avant variables
- ✅ Alias doivent pointer vers variables existantes
- ✅ Scopes doivent être valides selon type de token
- ✅ Overwrite doit préserver les variables non concernées

---

### 2.3 Flux de Scan

```
[UI] Sélection frame OU Clic "Scanner"
  → parent.postMessage({ type: 'scan-frame', ignoreHiddenLayers })
  → [Plugin] figma.ui.onmessage case 'scan-frame'
    → Scanner.scanSelection(ignoreHiddenLayers)
      → Scanner.initMap() (build valueMap from semantic variables)
      → Scanner._scanNodeRecursive() (traverse tree)
        → Scanner._checkProperties() (detect mismatches)
          → findColorSuggestions() / findNumericSuggestions()
      → figma.ui.postMessage({ type: 'scan-results', results })
  → [UI] handleMsg_scanResults()
    → lastScanResults = msg.results
    → groupResultsByValue()
    → displayScanResults()
```

**Invariants** :
- ✅ Scan doit filtrer semantic-only (pas de primitives)
- ✅ Suggestions doivent être triées par score
- ✅ Cache valueMap doit être invalidé après 30s
- ✅ Results doivent contenir nodeId, property, currentValue, suggestions

---

### 2.4 Flux d'Application de Corrections

```
[UI] Clic "Appliquer" sur une carte
  → parent.postMessage({ type: 'apply-single-fix', index, selectedVariableId })
  → [Plugin] figma.ui.onmessage case 'apply-single-fix'
    → applySingleFix(result, variableId)
      → Fixer.applyAndVerify(result, variableId)
        → Validation (node exists, not locked, property exists)
        → Fixer._applyVariableToProperty()
          → applyColorVariableToFill() / applyNumericVariable()
        → Fixer._verifyVariableApplication()
      → figma.ui.postMessage({ type: 'single-fix-applied', appliedCount, index })
  → [UI] handleMsg_singleFixApplied()
    → Animation de la carte (fade + hide)
    → appliedResultIndices.push(index)
    → updateDynamicTabCounts()
```

**Invariants** :
- ✅ Node ne doit pas être locked
- ✅ Node ne doit pas être removed
- ✅ Variable doit exister et être compatible avec property
- ✅ Application doit être vérifiable (boundVariables)

---

### 2.5 Flux d'Undo

```
[UI] Clic "Annuler" (Ctrl+Z mentionné)
  → [Plugin] Figma native undo
  → [UI] Pas de sync automatique → cartes restent cachées ❌
```

**Problème identifié** :
- ⚠️ **Undo ne restaure pas l'UI** : les cartes appliquées restent cachées
- ⚠️ **Pas de listener** sur Figma undo events
- ⚠️ **Solution actuelle** : message "Utilisez Ctrl+Z" sans restauration UI

---

## 🛡️ 3. INVARIANTS À PRÉSERVER

### 3.1 Invariants de Données

| Invariant | Description | Validation |
|-----------|-------------|------------|
| **Token Structure** | Tokens doivent avoir 7 catégories primitives | `Object.keys(tokens).includes('brand', 'gray', 'system', ...)` |
| **Semantic Modes** | Semantic tokens doivent avoir `modes: {light, dark}` | `tokens.semantic.modes && tokens.semantic.modes.light` |
| **Alias Format** | Alias doivent être `{variableId, collection, key, cssName}` | `typeof aliasTo === 'object' && aliasTo.variableId` |
| **Color Format** | Couleurs doivent être hex uppercase `#RRGGBB` | `/^#[0-9A-F]{6}$/` |
| **Numeric Format** | Spacing/Radius doivent être numbers | `typeof value === 'number'` |

### 3.2 Invariants de Comportement

| Invariant | Description | Test |
|-----------|-------------|------|
| **Undo Restore Cards** | Undo doit restaurer les cartes dans l'UI | ❌ Non respecté actuellement |
| **Export Identical** | Export doit être identique pour mêmes tokens | ✅ Respecté (déterministe) |
| **Scan Semantic-Only** | Scan ne doit suggérer que des sémantiques | ✅ Respecté (filtre `isSemanticVariable`) |
| **Import Preserve Alias** | Import doit préserver les alias existants | ⚠️ Partiellement (alias perdus selon AUDIT) |
| **Generation Deterministic** | Même input → même output | ✅ Respecté (pas de random sauf bouton) |

### 3.3 Invariants UI

| Invariant | Description | Validation |
|-----------|-------------|------------|
| **Step Sequence** | Navigation 0→1→2→3 ou 0→4 | `currentStep` transitions |
| **Token Preview Sync** | Preview doit refléter currentTokens | `updatePreview()` appelé après modif |
| **Export Sync** | Export doit refléter currentTokens | `updateExport()` appelé après modif |
| **Scan Results Persistence** | lastScanResults doit survivre aux actions | ✅ Respecté (global) |

---

## ⚠️ 4. RISQUES MAJEURS CLASSÉS

### 🔴 CRITIQUE (P0)

#### 4.1 Double Moteur (Legacy vs Core)
**Pourquoi** : Code dupliqué, divergence possible, maintenance 2x  
**Impact** : Bugs différents selon flag, confusion développeurs  
**Preuve** : `USE_CORE_ENGINE = false` (ligne 22), 2 branches complètes (lignes 3638-3755)  
**Mitigation** : Décision à prendre (voir `LEGACY_ENGINE_DECISION.md`)

#### 4.2 Alias Non Créés
**Pourquoi** : Tokens sémantiques ont valeurs hardcodées au lieu d'alias  
**Impact** : Changement primitives ne propage pas, export CSS incorrect  
**Preuve** : `INDEX_AUDIT.md` ligne 159 "Tokens avec alias : 0%"  
**Mitigation** : Implémenter `SOLUTIONS_GENERATION_SEMANTIQUE.md`

#### 4.3 Undo Ne Restaure Pas l'UI
**Pourquoi** : Pas de listener sur Figma undo, état UI désynchronisé  
**Impact** : UX cassée, utilisateur confus (cartes disparues)  
**Preuve** : `case 'undo-fix'` ligne 3883 → juste `figma.notify`  
**Mitigation** : Implémenter listener + restauration cartes

---

### 🟠 HAUT (P1)

#### 4.4 Palette Incomplète
**Pourquoi** : 26/55 tokens sémantiques générés  
**Impact** : Librairies incomplètes, fallback vers valeurs par défaut  
**Preuve** : `INDEX_AUDIT.md` ligne 161 "Complétude palette : 47%"  
**Mitigation** : Compléter `SEMANTIC_TOKENS`, `SEMANTIC_TYPE_MAP`

#### 4.5 innerHTML Massif
**Pourquoi** : Génération HTML par string concatenation  
**Impact** : XSS risk (faible car pas d'input user), performance, debugging dur  
**Preuve** : 50+ occurrences `innerHTML =` dans ui.html  
**Mitigation** : Migrer vers DOM API (`createElement`, `appendChild`)

#### 4.6 Event Listeners Non Nettoyés
**Pourquoi** : addEventListener sans removeEventListener  
**Impact** : Memory leaks sur navigation répétée  
**Preuve** : 40+ addEventListener, 0 removeEventListener  
**Mitigation** : Cleanup dans `switchStep()` ou use event delegation

---

### 🟡 MOYEN (P2)

#### 4.7 Cache valueMap Stale
**Pourquoi** : Cache 30s peut devenir obsolète si variables changent  
**Impact** : Suggestions incorrectes, faux positifs  
**Preuve** : `CACHE_DURATION: 30000` ligne 2965, pas d'invalidation manuelle  
**Mitigation** : Invalider cache sur `import-completed`, `tokens-generated`

#### 4.8 Données Corrompues (pluginData)
**Pourquoi** : Pas de validation JSON, pas de migration versions  
**Impact** : Plugin crash au démarrage, perte de données  
**Preuve** : `JSON.parse()` sans try/catch dans `getNamingFromFile`  
**Mitigation** : Wrapper safe + versioning + migration

#### 4.9 Timers Non Nettoyés
**Pourquoi** : setTimeout sans clearTimeout stocké  
**Impact** : Animations fantômes, actions retardées après navigation  
**Preuve** : 20+ setTimeout, peu de clearTimeout  
**Mitigation** : Stocker timer IDs, cleanup dans `switchStep`

---

### ⚪ FAIBLE (P3)

#### 4.10 Console.log Massif
**Pourquoi** : 278 console.log désactivés en prod, mais toujours présents  
**Impact** : Code verbeux, maintenance  
**Preuve** : `PRODUCTION_CHECKLIST.md` ligne 12  
**Mitigation** : Remplacer par logger configurable

#### 4.11 Magic Numbers
**Pourquoi** : Valeurs hardcodées (800, 950, 30000, etc.)  
**Impact** : Difficile à maintenir, pas de single source of truth  
**Preuve** : `figma.showUI(__html__, { width: 800, height: 950 })`  
**Mitigation** : Extraire dans CONFIG

---

## 📝 5. PLAN D'EXÉCUTION EN ÉTAPES SAFE

### Phase 1 : Stabilisation (1 semaine)

#### Étape 1.1 : Fixer Undo UI Restore
**Objectif** : Restaurer cartes dans UI après Figma undo  
**Fichiers** : `ui.html` (handleMsg_batchUndoComplete)  
**Check** : Undo → cartes réapparaissent avec animation  
**Rollback** : Garder ancien code en commentaire

#### Étape 1.2 : Compléter Palette Sémantique
**Objectif** : Passer de 26 à 55 tokens  
**Fichiers** : `code.js` (SEMANTIC_TOKENS, SEMANTIC_TYPE_MAP, SEMANTIC_NAME_MAP)  
**Check** : Export CSS contient 55 tokens  
**Rollback** : Backup des constantes

#### Étape 1.3 : Fixer Alias Sémantiques
**Objectif** : Créer alias au lieu de valeurs hardcodées  
**Fichiers** : `code.js` (mapSemanticTokens, importTokensToFigma)  
**Check** : Figma variables montrent alias, pas valeurs  
**Rollback** : Flag feature `USE_SEMANTIC_ALIASES`

---

### Phase 2 : Robustesse (1 semaine)

#### Étape 2.1 : Safe JSON Parsing
**Objectif** : Wrapper tous les JSON.parse avec try/catch  
**Fichiers** : `code.js` (getNamingFromFile, getPrimitivesTokensFromFile, getSemanticTokensFromFile)  
**Check** : Plugin ne crash pas avec données corrompues  
**Rollback** : Simple (ajout de try/catch)

#### Étape 2.2 : Invalider Cache valueMap
**Objectif** : Refresh cache après import/génération  
**Fichiers** : `code.js` (Scanner.initMap, case 'import-completed', case 'tokens-generated')  
**Check** : Scan après import donne résultats corrects  
**Rollback** : Garder ancien comportement en fallback

#### Étape 2.3 : Cleanup Event Listeners
**Objectif** : removeEventListener dans switchStep  
**Fichiers** : `ui.html` (switchStep, event delegation)  
**Check** : Memory profiler montre pas de leak  
**Rollback** : Garder listeners si problème

---

### Phase 3 : Refactorisation (2 semaines)

#### Étape 3.1 : Décision Moteur (Legacy vs Core)
**Objectif** : Choisir un moteur, supprimer l'autre  
**Fichiers** : `code.js` (tout le bloc génération)  
**Check** : Tests passent, toutes libs OK  
**Rollback** : Garder flag `USE_CORE_ENGINE`

#### Étape 3.2 : Migrer innerHTML → DOM API
**Objectif** : Remplacer string concat par createElement  
**Fichiers** : `ui.html` (displayScanResults, updatePreview, renderTokenRow)  
**Check** : UI identique, performance meilleure  
**Rollback** : Garder ancien code en fallback

#### Étape 3.3 : Extraire Constantes (CONFIG)
**Objectif** : Centraliser magic numbers  
**Fichiers** : `code.js`, `ui.html` (créer CONFIG global)  
**Check** : Aucun changement comportement  
**Rollback** : Simple (inline values)

---

### Phase 4 : Optimisation (1 semaine)

#### Étape 4.1 : Logger Configurable
**Objectif** : Remplacer console.log par logger  
**Fichiers** : `code.js`, `ui.html` (créer Logger class)  
**Check** : Logs désactivables sans recompile  
**Rollback** : Garder console.log en fallback

#### Étape 4.2 : Cleanup Timers
**Objectif** : Stocker et clear tous les setTimeout  
**Fichiers** : `ui.html` (animations, auto-scan)  
**Check** : Pas d'animations fantômes  
**Rollback** : Garder anciens timers

#### Étape 4.3 : Tests Automatisés
**Objectif** : Ajouter tests pour nouvelles features  
**Fichiers** : `tests/unit/`, `tests/integration/`  
**Check** : Coverage > 60%  
**Rollback** : N/A (ajout seulement)

---

## 🧹 6. DEAD CODE SUSPECTS

### 6.1 Fonctions Inutilisées (Haute Confiance)

| Fonction | Fichier | Ligne | Preuve | Action |
|----------|---------|-------|--------|--------|
| `debugTokens` | code.js | 58 | Wrapper legacy de `debugLog`, 0 appels directs | Supprimer après migration complète |
| `validateScopesAndFiltering` | code.js | ~4740 | Appelé seulement si DEBUG, self-test | Garder (utile debug) |
| `inferSemanticFamily` | code.js | 4599 | **DUPLIQUÉE** (empêche coverage) | Supprimer doublon |

### 6.2 Constantes Inutilisées (Moyenne Confiance)

| Constante | Fichier | Ligne | Preuve | Action |
|-----------|---------|-------|--------|--------|
| `TOKEN_STATE` | code.js | 96 | Défini mais jamais utilisé dans conditions | Vérifier usage, sinon supprimer |
| `DEBUG_TOKENS` | code.js | 26 | Alias de DEBUG, redondant | Supprimer, utiliser DEBUG |
| `DEBUG_SCOPES_SCAN` | code.js | 27 | Alias de DEBUG, redondant | Supprimer, utiliser DEBUG |

### 6.3 Branches Mortes (Moyenne Confiance)

| Branche | Fichier | Ligne | Preuve | Action |
|---------|---------|-------|--------|--------|
| `if (USE_CORE_ENGINE)` | code.js | 3638 | Flag = false, branche jamais exécutée | Décision Phase 3.1 |
| `case 'undo-batch'` | code.js | 3884 | Même handler que 'undo-fix', doublon | Merger |
| `case 'rollback-preview'` | code.js | 3865 | Re-scan complet, pas de vrai rollback | Implémenter vrai rollback ou supprimer |

### 6.4 Fichiers Obsolètes (Haute Confiance)

| Fichier | Raison | Preuve | Action |
|---------|--------|--------|--------|
| `code.js.backup-*` | Backups manuels | Plusieurs versions | Supprimer, utiliser git |
| `code.js.legacy` | Ancien moteur | Gardé "au cas où" | Supprimer après validation Core |
| `ui.html.legacy` | Ancienne UI | Gardé "au cas où" | Supprimer après validation |
| `*.md` (38 fichiers) | Documentation temporaire | Beaucoup de duplications | Consolider dans /docs |

### 6.5 Modules Non Chargés (Faible Confiance)

| Module | Fichier | Preuve | Action |
|--------|---------|--------|--------|
| `AnimationManager` | modules.js | Fallback vers ancien code si absent | Vérifier si chargé, sinon supprimer fallback |
| `PillManager` | modules.js | Fallback vers ancien code si absent | Vérifier si chargé, sinon supprimer fallback |
| `UIManager` | modules.js | Fallback vers ancien code si absent | Vérifier si chargé, sinon supprimer fallback |

**Stratégie de validation** :
1. Grep usage dans codebase
2. Run tests avec fonction commentée
3. Test manuel de tous les flows
4. Si aucun impact → supprimer
5. Si doute → marquer `@deprecated` + warning

---

## 📊 7. MÉTRIQUES DE SUCCÈS

### Avant Refacto

| Métrique | Valeur Actuelle |
|----------|-----------------|
| **Lignes de code** | code.js: 11,085 / ui.html: 11,691 |
| **Fonctions** | 264 (code.js outline) |
| **Tests** | 137 (105 unit + 32 integration) |
| **Coverage** | 0% (fonction dupliquée bloque) |
| **Tokens avec alias** | 0% |
| **Palette complète** | 47% (26/55) |
| **Fichiers .md** | 38 (beaucoup de duplication) |
| **Console.log** | 278 (désactivés en prod) |
| **Event listeners** | 40+ (non nettoyés) |

### Après Refacto (Objectifs)

| Métrique | Objectif |
|----------|----------|
| **Lignes de code** | -20% (élimination duplications) |
| **Fonctions** | -10% (merge similaires) |
| **Tests** | +30% (nouveaux tests features) |
| **Coverage** | >60% (fix doublon + nouveaux tests) |
| **Tokens avec alias** | >95% |
| **Palette complète** | 100% (55/55) |
| **Fichiers .md** | <15 (consolidation /docs) |
| **Console.log** | Remplacés par logger |
| **Event listeners** | Tous nettoyés (delegation) |

---

## ✅ 8. CHECKLIST DE VALIDATION PAR ÉTAPE

### Template de Validation

```markdown
## Étape X.Y : [Nom]

### Pre-Flight
- [ ] Backup code actuel (git commit)
- [ ] Tests passent (npm test)
- [ ] Plugin fonctionne manuellement

### Implémentation
- [ ] Code modifié selon plan
- [ ] Commentaires ajoutés
- [ ] Pas de console.error dans code

### Tests
- [ ] Tests unitaires passent
- [ ] Tests intégration passent
- [ ] Test manuel : [Flow spécifique]
- [ ] Test manuel : [Flow spécifique]

### Validation
- [ ] Aucun changement comportement observable
- [ ] Performance identique ou meilleure
- [ ] Pas de régression visuelle
- [ ] Logs montrent pas d'erreur

### Rollback Ready
- [ ] Code ancien en commentaire OU
- [ ] Feature flag permet rollback OU
- [ ] Git revert possible sans conflit

### Documentation
- [ ] README.md mis à jour si nécessaire
- [ ] CHANGELOG.md mis à jour
- [ ] Commentaires code ajoutés
```

---

## 🎯 9. PRIORITÉS RECOMMANDÉES

### Sprint 1 (Semaine 1) - Fixes Critiques
1. **Étape 1.3** : Fixer Alias Sémantiques (P0, bloquant export)
2. **Étape 1.1** : Fixer Undo UI Restore (P0, UX cassée)
3. **Étape 2.1** : Safe JSON Parsing (P1, robustesse)

### Sprint 2 (Semaine 2) - Complétion
4. **Étape 1.2** : Compléter Palette (P1, feature incomplète)
5. **Étape 2.2** : Invalider Cache (P2, bugs intermittents)
6. **Étape 2.3** : Cleanup Listeners (P1, memory leaks)

### Sprint 3 (Semaine 3-4) - Refacto
7. **Étape 3.1** : Décision Moteur (P0, dette technique)
8. **Étape 3.2** : Migrer innerHTML (P1, sécurité + perf)
9. **Étape 3.3** : Extraire CONFIG (P2, maintenabilité)

### Sprint 4 (Semaine 5) - Polish
10. **Étape 4.1** : Logger (P3, qualité)
11. **Étape 4.2** : Cleanup Timers (P2, bugs UX)
12. **Étape 4.3** : Tests (P1, confiance)

---

## 📚 10. RÉFÉRENCES

### Documents Existants
- `INDEX_AUDIT.md` - Index des audits précédents
- `AUDIT_GENERATION_SEMANTIQUE.md` - Problèmes génération
- `SOLUTIONS_GENERATION_SEMANTIQUE.md` - Solutions proposées
- `LEGACY_ENGINE_DECISION.md` - Décision Legacy vs Core
- `PRODUCTION_CHECKLIST.md` - Checklist prod
- `tests/README.md` - Documentation tests

### Fichiers Clés
- `code.js` (11,085 lignes) - Backend plugin
- `ui.html` (11,691 lignes) - Frontend UI
- `manifest.json` - Configuration plugin

### Tests
- 137 tests (105 unit + 32 integration)
- Coverage bloquée par fonction dupliquée

---

## 🚨 AVERTISSEMENTS FINAUX

### ⚠️ NE PAS FAIRE

1. **Ne pas supprimer Legacy Engine** avant validation complète Core (2-4 semaines)
2. **Ne pas modifier structure tokens** sans migration des données existantes
3. **Ne pas toucher Figma API calls** sans tests exhaustifs
4. **Ne pas refactoriser UI et Backend** en même temps (risque trop élevé)
5. **Ne pas merger plusieurs étapes** sans validation individuelle

### ✅ TOUJOURS FAIRE

1. **Toujours** commiter avant chaque étape
2. **Toujours** tester manuellement les 5 librairies (Tailwind, MUI, Ant, Bootstrap, Chakra)
3. **Toujours** vérifier que les tests passent
4. **Toujours** garder un rollback simple (flag ou commentaire)
5. **Toujours** documenter les changements dans CHANGELOG.md

---

**Fin de l'Audit - Prêt pour Exécution Safe** 🚀
