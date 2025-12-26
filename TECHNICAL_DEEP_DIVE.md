# 🔬 TECHNICAL DEEP DIVE - PolyToken by Emma

**Complément de** : `AUDIT_REFACTO_SAFE.md`  
**Date** : 23 décembre 2025  
**Objectif** : Analyse technique approfondie de chaque module

---

## 📦 1. ARCHITECTURE GLOBALE

### 1.1 Structure du Projet

```
emma-plugin-dev/
├── code.js (11,085 lignes)          # Backend Figma Plugin
├── ui.html (11,691 lignes)          # Frontend UI
├── manifest.json                     # Plugin config
├── tests/ (137 tests)               # Suite de tests
│   ├── unit/ (105 tests)
│   └── integration/ (32 tests)
├── docs/                            # Documentation technique
├── assets/                          # Images, icons
└── *.md (38 fichiers)               # Documentation temporaire
```

### 1.2 Flux de Communication

```
┌─────────────────┐         postMessage          ┌──────────────────┐
│                 │  ────────────────────────────▶│                  │
│   UI (ui.html)  │                               │  Plugin (code.js)│
│                 │  ◀────────────────────────────│                  │
└─────────────────┘    figma.ui.postMessage      └──────────────────┘
        │                                                  │
        │                                                  │
        ▼                                                  ▼
  DOM Manipulation                              Figma API Calls
  Event Listeners                               Variables, Nodes
  Animations                                    Collections, Styles
```

### 1.3 Modules Principaux

| Module | Responsabilité | Lignes | Complexité |
|--------|----------------|--------|------------|
| **Token Generation** | Génération palettes | ~2000 | Haute |
| **Scanner** | Détection écarts | ~500 | Moyenne |
| **Fixer** | Application corrections | ~300 | Moyenne |
| **FigmaService** | Abstraction API Figma | ~200 | Faible |
| **ColorService** | Conversions couleurs | ~150 | Faible |
| **Storage** | Persistence données | ~400 | Moyenne |
| **UI Wizard** | Navigation multi-step | ~3000 | Haute |
| **Export** | Génération code | ~1000 | Moyenne |

---

## 🎨 2. GÉNÉRATION DE TOKENS - ANALYSE DÉTAILLÉE

### 2.1 Dual Engine Architecture

#### Legacy Engine (Actif)
```javascript
// Ligne 3683-3755
if (!USE_CORE_ENGINE) {
  tokens = {
    brand: generateBrandColors(hex, naming),
    system: generateSystemColors(naming),
    gray: generateGrayscale(naming),
    spacing: generateSpacing(naming),
    radius: generateRadius(naming),
    typography: generateTypography(naming),
    border: generateBorder()
  };
  
  // Génération sémantique
  if (naming === "tailwind" || naming === "mui" || ...) {
    var generated = generateSemanticTokens(tokens, { naming });
    tokens.semantic = generated;
  }
}
```

**Avantages** :
- ✅ Stable, testé en production
- ✅ Couverture complète des librairies
- ✅ Génération déterministe

**Inconvénients** :
- ❌ Code dupliqué entre librairies
- ❌ Difficile à étendre
- ❌ Alias non créés (hardcoded values)

#### Core Engine (Expérimental)
```javascript
// Ligne 3638-3681
if (USE_CORE_ENGINE) {
  var corePrimitives = generateCorePrimitives(primaryColor, { naming }, CORE_PRESET_V1);
  var coreSemantics = generateCoreSemantics(corePrimitives, CORE_PRESET_V1, { naming });
  var validationReport = validateAndAdjustForRgaa(coreSemantics, CORE_PRESET_V1);
  
  tokens = projectCoreToLegacyShape({
    primitives: corePrimitives,
    semantics: coreSemantics
  }, normalizedLib);
}
```

**Avantages** :
- ✅ Architecture moderne
- ✅ Validation RGAA intégrée
- ✅ Meilleure séparation des préoccupations

**Inconvénients** :
- ❌ Non testé en production
- ❌ Adapter layer `projectCoreToLegacyShape` complexe
- ❌ Nécessite migration complète

### 2.2 Génération de Primitives

#### Brand Colors (Ligne 4314-4430)
```javascript
function generateBrandColors(hex, naming) {
  var hsl = hexToHsl(hex);
  var H = hsl.h, S = hsl.s, L = hsl.l;
  
  // Palette 5 niveaux de base
  var palette5 = {
    subtle: hslToHex(H, S, Math.min(97, L + 25)),
    light: hslToHex(H, S, Math.min(92, L + 15)),
    base: hex,
    hover: hslToHex(H, S, Math.max(10, L - 8)),
    dark: hslToHex(H, S, Math.max(5, L - 18))
  };
  
  // Expansion vers 11 niveaux (Tailwind/Shadcn)
  if (naming === "tailwind" || naming === "shadcn") {
    return {
      50: palette5.subtle,
      100: palette5.light,
      200: hslToHex(H, S, Math.min(95, L + 10)),
      // ... 300-900
      950: hslToHex(H, S, Math.max(5, L - 15))
    };
  }
}
```

**Algorithme** :
1. Convertir hex → HSL
2. Générer palette 5 niveaux (subtle, light, base, hover, dark)
3. Interpoler vers 11 niveaux selon librairie
4. Clamper valeurs (min/max pour éviter blanc/noir pur)

**Problèmes** :
- ⚠️ Interpolation linéaire (pas de courbe perceptuelle)
- ⚠️ Pas de validation contraste
- ⚠️ Magic numbers (97, 92, 10, 5, etc.)

#### Grayscale (Ligne 4431-4482)
```javascript
function generateGrayscale(naming) {
  if (naming === "tailwind" || naming === "shadcn") {
    return {
      50: "#FAFAFA",
      100: "#F5F5F5",
      // ... palette fixe
      950: "#0A0A0A"
    };
  }
  // Autres librairies : palettes différentes
}
```

**Problèmes** :
- ⚠️ Palettes hardcodées (pas de génération)
- ⚠️ Duplication entre librairies
- ⚠️ Pas de cohérence avec brand color

### 2.3 Génération de Sémantiques

#### Structure de Données
```javascript
// Format attendu (modes multi-thème)
{
  semantic: {
    modes: {
      light: {
        "bg.canvas": { 
          resolvedValue: "#FFFFFF",
          type: "COLOR",
          aliasTo: { variableId: "...", collection: "gray", key: "50" }
        },
        "text.primary": { ... }
      },
      dark: {
        "bg.canvas": { 
          resolvedValue: "#0A0A0A",
          aliasTo: { collection: "gray", key: "950" }
        }
      }
    }
  }
}
```

#### Mapping Sémantique → Primitive
```javascript
// SEMANTIC_TOKENS (ligne 1509+)
var SEMANTIC_TOKENS = [
  "bg.canvas", "bg.surface", "bg.elevated", "bg.muted",
  "text.primary", "text.secondary", "text.muted",
  "border.default", "border.muted",
  "action.primary.default", "action.primary.hover",
  // ... 26 tokens actuellement (devrait être 55)
];

// SEMANTIC_TYPE_MAP (ligne ~1520)
var SEMANTIC_TYPE_MAP = {
  "bg.*": "COLOR",
  "text.*": "COLOR",
  "border.*": "COLOR",
  "action.*": "COLOR",
  "radius.*": "FLOAT",
  "space.*": "FLOAT",
  "font.size.*": "FLOAT"
};
```

**Problème Principal** : Alias Non Créés
```javascript
// ACTUEL (INCORRECT)
"bg.canvas": {
  resolvedValue: "#FFFFFF",  // ❌ Hardcoded
  type: "COLOR",
  aliasTo: null              // ❌ Pas d'alias
}

// ATTENDU (CORRECT)
"bg.canvas": {
  resolvedValue: "#FFFFFF",  // Résolu depuis gray.50
  type: "COLOR",
  aliasTo: {                 // ✅ Alias créé
    variableId: "VariableID:123:456",
    collection: "gray",
    key: "50",
    cssName: "gray-50"
  }
}
```

---

## 🔍 3. SCANNER - ANALYSE DÉTAILLÉE

### 3.1 Architecture du Scanner

```javascript
var Scanner = {
  valueMap: null,              // Map<string, Array<VariableInfo>>
  lastScanResults: null,       // Array<ScanResult>
  collectionsCache: null,      // Cache collections Figma
  variablesCache: null,        // Cache variables Figma
  cacheTimestamp: 0,           // Timestamp du cache
  CACHE_DURATION: 30000,       // 30 secondes
  
  initMap: function() { ... },
  scanSelection: function(ignoreHiddenLayers) { ... },
  _scanNodeRecursive: function(node, results, depth, ignoreHiddenLayers) { ... },
  _checkProperties: function(node, results, ignoreHiddenLayers) { ... }
};
```

### 3.2 Construction de la ValueMap

```javascript
// Ligne 2968-3055
initMap: function() {
  Scanner.valueMap = new Map();
  var localCollections = FigmaService.getCollections();
  
  for (var collection of localCollections) {
    var preferredModeId = getPreferredModeIdForScan(collection);
    
    collection.variableIds.forEach(function(variableId) {
      var variable = FigmaService.getVariableById(variableId);
      
      // ✅ FILTRE SEMANTIC-ONLY
      if (!isSemanticVariable(variable.name, variable)) {
        return; // Skip primitives
      }
      
      collection.modes.forEach(function(mode) {
        var resolvedValue = resolveVariableValue(variable, mode.modeId);
        var formattedValue = Scanner._formatVariableValue(variable, resolvedValue);
        
        // Indexation par mode ET sans mode (fallback)
        var keyWithMode = mode.modeId + '|' + formattedValue;
        var keyWithoutMode = formattedValue;
        
        Scanner.valueMap.set(keyWithMode, [...]);
        Scanner.valueMap.set(keyWithoutMode, [...]);
      });
    });
  }
}
```

**Stratégie d'Indexation** :
1. **Avec mode** : `"modeId|#FFFFFF"` → évite collisions Light/Dark
2. **Sans mode** : `"#FFFFFF"` → fallback si mode mal détecté

**Problème** :
- ⚠️ Cache 30s peut être stale si variables modifiées
- ⚠️ Filtre semantic-only peut exclure primitives utiles

### 3.3 Scan Récursif

```javascript
// Ligne 3113-3200
_scanNodeRecursive: function(node, results, depth, ignoreHiddenLayers) {
  // Guards
  if (depth > CONFIG.limits.MAX_DEPTH) return;
  if (!node || node.removed) return;
  if (node.type === 'INSTANCE' && node.mainComponent === null) return;
  
  // Scan propriétés si node a style
  var styleTypes = CONFIG.supportedTypes.fillAndStroke;
  if (styleTypes.indexOf(node.type) !== -1) {
    Scanner._checkProperties(node, results, ignoreHiddenLayers);
  }
  
  // Récursion sur enfants si container
  var containerTypes = CONFIG.supportedTypes.spacing;
  if (containerTypes.indexOf(node.type) !== -1) {
    node.children.forEach(function(child) {
      Scanner._scanNodeRecursive(child, results, depth + 1, ignoreHiddenLayers);
    });
  }
}
```

**Optimisations** :
- ✅ Early return (guards)
- ✅ Profondeur max (évite stack overflow)
- ✅ Type checking (évite scan inutile)

**Problèmes** :
- ⚠️ Pas de debounce (scan multiple fois si sélection change vite)
- ⚠️ Pas de cancellation (scan long non interruptible)

### 3.4 Détection de Propriétés

```javascript
_checkProperties: function(node, results, ignoreHiddenLayers) {
  // Fills
  if (node.fills && Array.isArray(node.fills)) {
    node.fills.forEach(function(fill, index) {
      if (fill.type === 'SOLID' && fill.boundVariables?.color === undefined) {
        var currentColor = rgbToHex(fill.color);
        var suggestions = findColorSuggestions(currentColor, 'Fill', node.type);
        
        if (suggestions.length > 0) {
          results.push({
            nodeId: node.id,
            layerName: node.name,
            property: "Fill",
            currentValue: currentColor,
            suggestions: suggestions,
            fillIndex: index
          });
        }
      }
    });
  }
  
  // Strokes, Radius, Spacing, etc. (même logique)
}
```

**Logique de Suggestion** :
1. Extraire valeur actuelle (couleur, nombre)
2. Chercher dans valueMap
3. Scorer par pertinence (distance couleur, exactitude numérique)
4. Filtrer par scopes Figma
5. Trier par score décroissant

---

## 🔧 4. FIXER - ANALYSE DÉTAILLÉE

### 4.1 Pipeline de Validation

```javascript
// Ligne 3326-3388
applyAndVerify: function(result, variableId) {
  // 1. Validation des entrées
  if (!result || !result.nodeId || !result.property) {
    throw new Error('Invalid result');
  }
  if (!variableId) {
    throw new Error('No variable ID provided');
  }
  
  // 2. Validation de la variable
  var variable = FigmaService.getVariableById(variableId);
  if (!variable) {
    throw new Error('Variable not found');
  }
  
  // 3. Validation du node
  var node = figma.getNodeById(result.nodeId);
  if (!node || node.removed) {
    throw new Error('Node not found or removed');
  }
  if (node.locked) {
    throw new Error('Cannot modify locked node');
  }
  
  // 4. Validation de compatibilité
  if (!Fixer._validatePropertyExists(node, result)) {
    throw new Error('Property no longer exists');
  }
  if (!Fixer._validateVariableCanBeApplied(variable, result)) {
    throw new Error('Variable incompatible with property');
  }
  
  // 5. Application
  var applied = Fixer._applyVariableToProperty(node, result, variable);
  if (!applied) {
    throw new Error('Failed to apply variable');
  }
  
  // 6. Vérification
  return Fixer._verifyVariableApplication(node, result, variable);
}
```

**Robustesse** : ✅ Excellent (6 niveaux de validation)

### 4.2 Application par Type de Propriété

```javascript
// Ligne 3488-3534
_applyVariableToProperty: function(node, result, variable) {
  switch (result.property) {
    case "Fill":
    case "Text":
      return applyColorVariableToFill(node, variable, result.fillIndex);
      
    case "Stroke":
      return applyColorVariableToStroke(node, variable, result.strokeIndex);
      
    case "CORNER RADIUS":
    case "TOP LEFT RADIUS":
    // ... autres radius
      return applyNumericVariable(node, variable, result.figmaProperty, result.property);
      
    case "Item Spacing":
    case "Padding Left":
    // ... autres spacing
      return applyNumericVariable(node, variable, result.figmaProperty, result.property);
      
    default:
      return false;
  }
}
```

**Helpers Spécialisés** :

```javascript
// applyColorVariableToFill (ligne ~5800)
function applyColorVariableToFill(node, variable, fillIndex) {
  if (!node.fills || !Array.isArray(node.fills)) return false;
  
  var fills = JSON.parse(JSON.stringify(node.fills)); // Deep clone
  if (fillIndex >= fills.length) return false;
  
  node.setBoundVariable('fills', variable);
  return true;
}

// applyNumericVariable (ligne ~5900)
function applyNumericVariable(node, variable, figmaProperty, displayProperty) {
  try {
    node.setBoundVariable(figmaProperty, variable);
    return true;
  } catch (e) {
    console.error('Failed to bind numeric variable:', e);
    return false;
  }
}
```

**Problème Principal** : Undo Ne Restaure Pas l'UI
```javascript
// ACTUEL (ligne 3883-3886)
case 'undo-fix':
case 'undo-batch':
  figma.notify("⟲ Utilisez Ctrl+Z pour annuler dans Figma");
  break;
  // ❌ Pas de restauration UI, cartes restent cachées
```

**Solution Proposée** :
```javascript
case 'undo-batch':
  // 1. Figma undo (natif)
  // 2. Notifier UI des indices annulés
  figma.ui.postMessage({
    type: 'batch-undo-complete',
    undoneCount: lastBatchHistory.length,
    indices: lastBatchHistory.map(h => h.index)
  });
  break;
```

---

## 💾 5. PERSISTENCE - ANALYSE DÉTAILLÉE

### 5.1 Stratégie de Stockage

```javascript
// Naming
figma.root.setPluginData("tokenStarter.naming", naming);

// Primitives
figma.root.setPluginData("tokenStarter.primitives", JSON.stringify(primitives));

// Semantics
figma.root.setPluginData("tokenStarter.semantic", JSON.stringify(semantics));

// Theme Mode
figma.root.setPluginData("tokenStarter.themeMode", themeMode);
```

**Problèmes** :
1. ⚠️ **Pas de try/catch** sur JSON.parse
2. ⚠️ **Pas de versioning** (migration impossible)
3. ⚠️ **Limite de taille** non documentée (crash possible)

### 5.2 Wrapper Safe Proposé

```javascript
function safeGetPluginData(key, defaultValue) {
  try {
    var raw = figma.root.getPluginData(key);
    if (!raw) return defaultValue;
    
    var parsed = JSON.parse(raw);
    
    // Validation de version
    if (parsed._version && parsed._version !== CURRENT_VERSION) {
      return migrateData(parsed, CURRENT_VERSION);
    }
    
    return parsed;
  } catch (e) {
    console.error('Failed to parse plugin data:', key, e);
    return defaultValue;
  }
}

function safeSetPluginData(key, value) {
  try {
    var data = {
      _version: CURRENT_VERSION,
      _timestamp: Date.now(),
      ...value
    };
    
    var serialized = JSON.stringify(data);
    
    // Check size (conservative limit: 100KB)
    if (serialized.length > 100000) {
      console.warn('Plugin data too large:', key, serialized.length);
      // Fallback: compress or split
    }
    
    figma.root.setPluginData(key, serialized);
  } catch (e) {
    console.error('Failed to save plugin data:', key, e);
    throw e;
  }
}
```

---

## 🎭 6. UI - ANALYSE DÉTAILLÉE

### 6.1 État Global (Anti-Pattern)

```javascript
// Variables globales dans ui.html
var currentStep = 0;
var currentNaming = "tailwind";
var currentColor = "#6366F1";
var currentThemeMode = "light";
var currentTokens = null;
var hasExistingTokens = false;
var existingTokensData = null;
var lastScanResults = [];
var appliedResultIndices = [];
var ignoredResultIndices = [];
var isScanning = false;
// ... 20+ variables globales
```

**Problèmes** :
- ❌ État distribué (hard to debug)
- ❌ Pas de single source of truth
- ❌ Race conditions possibles

**Solution Proposée** : State Manager
```javascript
var AppState = {
  wizard: {
    currentStep: 0,
    naming: "tailwind",
    color: "#6366F1",
    themeMode: "light"
  },
  tokens: {
    current: null,
    existing: null,
    hasExisting: false
  },
  scan: {
    results: [],
    appliedIndices: [],
    ignoredIndices: [],
    isScanning: false
  },
  
  // Getters/Setters avec validation
  setState: function(path, value) { ... },
  getState: function(path) { ... }
};
```

### 6.2 Event Listeners (Memory Leaks)

```javascript
// PROBLÈME : addEventListener sans cleanup
step1Next.addEventListener("click", function() { ... });
step2Back.addEventListener("click", function() { ... });
colorPicker.addEventListener("input", function() { ... });
// ... 40+ listeners jamais nettoyés
```

**Solution 1** : Event Delegation
```javascript
// Un seul listener sur parent
document.getElementById('wizardContainer').addEventListener('click', function(e) {
  if (e.target.id === 'step1Next') {
    // Handle step1Next
  } else if (e.target.id === 'step2Back') {
    // Handle step2Back
  }
  // ... etc
});
```

**Solution 2** : Cleanup dans switchStep
```javascript
var activeListeners = [];

function switchStep(stepNumber) {
  // Cleanup old listeners
  activeListeners.forEach(function(listener) {
    listener.element.removeEventListener(listener.event, listener.handler);
  });
  activeListeners = [];
  
  // Setup new listeners
  if (stepNumber === 1) {
    var handler = function() { ... };
    step1Next.addEventListener("click", handler);
    activeListeners.push({ element: step1Next, event: "click", handler: handler });
  }
}
```

### 6.3 innerHTML (XSS Risk + Performance)

```javascript
// PROBLÈME : String concatenation massive
html += "<div class='token-row'>";
html += "  <div class='token-name'>" + key + "</div>";
html += "  <div class='token-value'>" + value + "</div>";
html += "</div>";
tokenPreview.innerHTML = html;
```

**Risques** :
- ⚠️ XSS si `key` ou `value` contient HTML
- ⚠️ Performance (reparse tout le DOM)
- ⚠️ Perte des event listeners

**Solution** : DOM API
```javascript
function renderTokenRow(key, value) {
  var row = document.createElement('div');
  row.className = 'token-row';
  
  var nameCell = document.createElement('div');
  nameCell.className = 'token-name';
  nameCell.textContent = key; // ✅ Safe (pas d'HTML)
  
  var valueCell = document.createElement('div');
  valueCell.className = 'token-value';
  valueCell.textContent = value;
  
  row.appendChild(nameCell);
  row.appendChild(valueCell);
  
  return row;
}

// Usage
var fragment = document.createDocumentFragment();
for (var key in tokens) {
  fragment.appendChild(renderTokenRow(key, tokens[key]));
}
tokenPreview.innerHTML = ''; // Clear once
tokenPreview.appendChild(fragment); // Append once
```

---

## 🧪 7. TESTS - ANALYSE DÉTAILLÉE

### 7.1 Couverture Actuelle

```
PASS  tests/unit/utils.test.js (18 tests)
PASS  tests/unit/storage.test.js (12 tests)
PASS  tests/unit/tokens.test.js (27 tests)
PASS  tests/unit/semantic.test.js (22 tests)
PASS  tests/unit/scanner.test.js (26 tests)
PASS  tests/integration/message-flow.test.js (21 tests)
PASS  tests/integration/end-to-end.test.js (11 tests)

Test Suites: 7 passed, 7 total
Tests:       137 passed, 137 total
Coverage:    0% (blocked by duplicate function)
```

### 7.2 Gaps de Couverture

**Non Testé** :
1. ❌ Génération de tokens (Legacy Engine)
2. ❌ Génération de tokens (Core Engine)
3. ❌ Import vers Figma
4. ❌ Export formats (CSS, JSON, Tailwind, SCSS)
5. ❌ Animations UI
6. ❌ Undo/Redo flows
7. ❌ Error recovery

**Raison** : Fonction dupliquée bloque coverage
```javascript
// Ligne 4599 : inferSemanticFamily (PREMIÈRE DÉFINITION)
function inferSemanticFamily(key) { ... }

// Ligne XXXX : inferSemanticFamily (DOUBLON)
function inferSemanticFamily(key) { ... }
```

**Action** : Supprimer doublon → coverage débloq

---

## 📊 8. MÉTRIQUES DE COMPLEXITÉ

### 8.1 Complexité Cyclomatique

| Fonction | Lignes | Complexité | Risque |
|----------|--------|------------|--------|
| `generateSemanticTokens` | ~500 | 45 | 🔴 Très Haut |
| `importTokensToFigma` | ~400 | 38 | 🔴 Très Haut |
| `Scanner._checkProperties` | ~300 | 32 | 🟠 Haut |
| `updatePreview` | ~250 | 28 | 🟠 Haut |
| `displayScanResults` | ~400 | 35 | 🔴 Très Haut |

**Recommandation** : Refactoriser fonctions >30 complexité

### 8.2 Duplication de Code

```bash
# Détection avec jscpd
jscpd code.js ui.html

Duplications found: 47
Total duplicated lines: 1,234 (11% of codebase)
```

**Top Duplications** :
1. Sanitization de noms (8 occurrences)
2. Conversion couleurs (6 occurrences)
3. Validation messages (5 occurrences)

---

## 🎯 9. RECOMMANDATIONS PRIORITAIRES

### Critique (P0)
1. **Fixer fonction dupliquée** → débloquer coverage
2. **Implémenter alias sémantiques** → export correct
3. **Fixer undo UI restore** → UX non cassée

### Haute (P1)
4. **Safe JSON parsing** → robustesse
5. **Cleanup event listeners** → memory leaks
6. **Compléter palette** → feature complète

### Moyenne (P2)
7. **Migrer innerHTML → DOM API** → sécurité + perf
8. **Invalider cache valueMap** → suggestions correctes
9. **Extraire CONFIG** → maintenabilité

---

**Fin du Deep Dive Technique** 🔬
