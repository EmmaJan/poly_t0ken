# 🔍 AUDIT - Génération de Tokens Sémantiques

## 📋 Résumé Exécutif

### Problèmes Identifiés

1. **❌ Alias non créés lors de la sync Figma** - Les tokens sémantiques ne sont pas liés aux primitives
2. **❌ Hiérarchie de couleurs background non respectée** - Collisions dans les palettes light générées
3. **❌ Palettes sémantiques incomplètes** - Tokens manquants par rapport aux standards des libs

---

## 🔴 PROBLÈME 1 : Alias Cassés lors de la Sync Figma

### Diagnostic

Le problème se situe dans la fonction `importTokensToFigma` (ligne 4639-4859) :

```javascript
// ❌ PROBLÈME : aliasRef n'est PAS créé par mapSemanticTokens
if (aliasRef && primitiveMap[aliasRef.category] && primitiveMap[aliasRef.category][aliasRef.key]) {
    var primitiveId = primitiveMap[aliasRef.category][aliasRef.key];
    var primitiveVar = figma.variables.getVariableById(primitiveId);
    if (primitiveVar) {
        valueToSet = figma.variables.createVariableAlias(primitiveVar);
        aliasCount++;
    }
} else {
    // ⚠️ FALLBACK : Valeur brute au lieu d'alias
    if (variableType === 'COLOR') valueToSet = hexToRgb(resolvedValue);
    else valueToSet = normalizeFloatValue(resolvedValue);
}
```

### Cause Racine

La fonction `mapSemanticTokens` (ligne 1014-1276) génère des tokens avec `aliasRef` mais **cette propriété n'est jamais utilisée correctement** :

```javascript
// ✅ CE QUI EST GÉNÉRÉ
result.modes[mode][semKey] = {
    resolvedValue: resolvedValue,
    type: mapDef.type,
    aliasRef: aliasInfo,  // ← Créé ici
    meta: {
        source: 'RefactoredEngine',
        hierarchyRule: 'Strict'
    }
};
```

**MAIS** lors de l'import, le code cherche `token.aliasRef` dans la structure **plate** :

```javascript
// ❌ PROBLÈME : token vient de modeData qui est déjà aplati
var token = modeData[key];
var aliasRef = token.aliasRef || (token.meta && token.meta.aliasRef);
```

### Solution

**Option A : Corriger la structure de données**
```javascript
// Dans mapSemanticTokens, retourner une structure compatible
return {
    light: {
        'bg.canvas': {
            resolvedValue: '#F5F5F5',
            type: 'COLOR',
            aliasRef: { category: 'gray', key: '50' }  // ← Doit être présent
        }
    },
    dark: { ... }
};
```

**Option B : Corriger importTokensToFigma**
```javascript
// Extraire aliasRef depuis la structure modes
var modesToProcess = [];
if (semanticData.modes && semanticData.modes.light) {
    modesToProcess.push({ 
        name: 'light', 
        id: lightMode.modeId, 
        data: semanticData.modes.light  // ← data contient déjà aliasRef
    });
}
```

---

## 🔴 PROBLÈME 2 : Hiérarchie Background Non Respectée

### Diagnostic

Dans `mapSemanticTokens`, la logique de collision (ligne 1149-1193) **ne fonctionne que pour la catégorie 'gray'** :

```javascript
// ❌ PROBLÈME : Collision uniquement pour gray
if (mapDef.type === 'COLOR' && category === 'gray') {
    // Logique de shift...
}
```

**MAIS** les mappings définissent des valeurs qui peuvent créer des doublons :

```javascript
// Light mode mappings
'bg.canvas':   { category: 'gray', light: '50',  dark: '950' },
'bg.surface':  { category: 'gray', light: '100', dark: '900' },
'bg.elevated': { category: 'gray', light: '200', dark: '800' },
'bg.muted':    { category: 'gray', light: '300', dark: '700' },  // ← Peut entrer en collision
'bg.inverse':  { category: 'gray', light: '950', dark: '50' },
```

### Exemple de Collision

Pour une palette avec seulement `['50', '100', '200', '950']` :

```
bg.canvas   → 50  ✅
bg.surface  → 100 ✅
bg.elevated → 200 ✅
bg.muted    → 300 ❌ (n'existe pas, fallback vers 200 → COLLISION)
bg.inverse  → 950 ✅
```

### Cause Racine

1. **Pas de validation des primitives disponibles** avant le mapping
2. **Logique de shift insuffisante** - ne gère pas les gaps dans la palette
3. **Pas de fallback intelligent** vers les valeurs adjacentes

### Solution

```javascript
function mapSemanticTokens(palettes, preset, options) {
    // 1. VALIDER la palette gray disponible
    var availableGrayKeys = Object.keys(palettes.gray || {}).sort();
    
    // 2. AJUSTER les mappings selon la disponibilité
    function getStandardMapping(key) {
        if (key === 'bg.muted') {
            // Chercher la valeur la plus proche de 300
            var target = '300';
            if (!availableGrayKeys.includes(target)) {
                // Fallback intelligent
                var candidates = ['300', '400', '200', '500'];
                target = candidates.find(c => availableGrayKeys.includes(c)) || availableGrayKeys[2];
            }
            return { category: 'gray', light: target, dark: '700', type: 'COLOR' };
        }
        // ...
    }
    
    // 3. VÉRIFIER les collisions AVANT d'assigner
    var usedValues = new Set();
    keys.forEach(function(semKey) {
        var finalRef = preferredRef;
        
        // Si déjà utilisé, chercher la prochaine valeur disponible
        while (usedValues.has(finalRef)) {
            var idx = availableGrayKeys.indexOf(finalRef);
            finalRef = availableGrayKeys[idx + direction] || finalRef;
        }
        
        usedValues.add(finalRef);
        // ...
    });
}
```

---

## 🔴 PROBLÈME 3 : Palettes Sémantiques Incomplètes

### Tokens Manquants

Comparaison avec l'exemple fourni :

| Token Attendu | Présent dans Code | Status |
|--------------|-------------------|--------|
| `--color-bg-accent` | ❌ | Manquant |
| `--color-bg-subtle` | ❌ | Manquant |
| `--color-border-accent` | ❌ | Manquant |
| `--color-border-focus` | ❌ | Manquant |
| `--color-text-accent` | ❌ | Manquant |
| `--color-text-link` | ❌ | Manquant |
| `--color-text-on-inverse` | ❌ | Manquant |
| `--color-on-inverse` | ❌ | Manquant |
| `--on-primary` | ❌ | Manquant |
| `--on-secondary` | ❌ | Manquant |
| `--on-success` | ❌ | Manquant |
| `--on-warning` | ❌ | Manquant |
| `--on-error` | ❌ | Manquant |
| `--on-info` | ❌ | Manquant |

### Tokens Présents

```javascript
var SEMANTIC_TOKENS = [
    // Background (5/7 tokens)
    'bg.canvas', 'bg.surface', 'bg.elevated', 'bg.muted', 'bg.inverse',
    
    // Text (5/8 tokens)
    'text.primary', 'text.secondary', 'text.muted', 'text.inverse', 'text.disabled',
    
    // Border (2/4 tokens)
    'border.default', 'border.muted',
    
    // Action (4/8 tokens - manque contrastText)
    'action.primary.default', 'action.primary.hover', 'action.primary.active', 'action.primary.disabled',
    
    // Status (4/8 tokens - manque contrastText)
    'status.success', 'status.warning', 'status.error', 'status.info',
    
    // Floats (6 tokens)
    'radius.sm', 'radius.md', 'space.sm', 'space.md',
    'font.size.base', 'font.weight.base'
];
```

### Solution

Ajouter les tokens manquants dans `SEMANTIC_TOKENS` et `SEMANTIC_TYPE_MAP` :

```javascript
var SEMANTIC_TOKENS = [
    // Background (complet)
    'bg.canvas', 'bg.surface', 'bg.elevated', 'bg.subtle', 'bg.muted', 'bg.accent', 'bg.inverse',
    
    // Text (complet)
    'text.primary', 'text.secondary', 'text.muted', 'text.accent', 'text.link', 
    'text.inverse', 'text.on-inverse', 'text.disabled',
    
    // Border (complet)
    'border.default', 'border.muted', 'border.accent', 'border.focus',
    
    // Action (complet avec contrastText)
    'action.primary.default', 'action.primary.hover', 'action.primary.active', 
    'action.primary.disabled', 'action.primary.text',
    'action.secondary.default', 'action.secondary.hover', 'action.secondary.active',
    'action.secondary.disabled', 'action.secondary.text',
    
    // Status (complet avec contrastText)
    'status.success', 'status.success.text',
    'status.warning', 'status.warning.text',
    'status.error', 'status.error.text',
    'status.info', 'status.info.text',
    
    // On-colors (nouveau)
    'on.primary', 'on.secondary', 'on.success', 'on.warning', 'on.error', 'on.info', 'on.inverse',
    
    // Floats (inchangé)
    'radius.sm', 'radius.md', 'space.sm', 'space.md',
    'font.size.base', 'font.weight.base'
];
```

---

## 🔴 PROBLÈME 4 : Standards des Librairies Non Respectés

### CSS Export Manquant

**Le plugin ne génère PAS d'export CSS** avec la structure attendue :

```css
/* ❌ MANQUANT : Export CSS structuré */
:root {
  /* PRIMITIVES */
  --brand-500: #D58234;
  --gray-50: #F3F2F2;
  /* ... */
}

html[data-theme='light'] {
  /* SEMANTICS */
  --color-action-primary: var(--brand-500);
  --color-bg-surface: var(--gray-white);
  /* ... */
}
```

### Fonction d'Export à Créer

```javascript
function generateCSSExport(tokens, naming) {
    var css = '/**\n * Design Tokens - CSS Variables\n * Generated by PolyToken\n */\n\n';
    
    // 1. Root - Primitives uniquement
    css += ':root {\n';
    css += '  /* BRAND */\n';
    for (var key in tokens.brand) {
        css += `  --brand-${key}: ${tokens.brand[key]};\n`;
    }
    // ... autres catégories primitives
    css += '}\n\n';
    
    // 2. Light theme - Sémantiques
    css += "html[data-theme='light'] {\n";
    for (var key in tokens.semantic.modes.light) {
        var token = tokens.semantic.modes.light[key];
        var cssName = key.replace(/\./g, '-');
        
        // Générer l'alias CSS si disponible
        if (token.aliasRef) {
            var aliasName = `--${token.aliasRef.category}-${token.aliasRef.key}`;
            css += `  --color-${cssName}: var(${aliasName});\n`;
        } else {
            css += `  --color-${cssName}: ${token.resolvedValue};\n`;
        }
    }
    css += '}\n\n';
    
    // 3. Dark theme
    css += "html[data-theme='dark'] {\n";
    // ... même logique
    css += '}\n';
    
    return css;
}
```

---

## 📊 Récapitulatif des Problèmes

| # | Problème | Sévérité | Impact | Fichier | Ligne |
|---|----------|----------|--------|---------|-------|
| 1 | Alias non créés | 🔴 Critique | Pas de liaison primitive→semantic | `code.js` | 4812-4841 |
| 2 | Structure de données incohérente | 🔴 Critique | aliasRef perdu entre génération et import | `code.js` | 1221-1229 |
| 3 | Hiérarchie background cassée | 🟠 Majeur | Collisions dans palette light | `code.js` | 1149-1193 |
| 4 | Tokens manquants | 🟠 Majeur | Palette incomplète vs standards | `code.js` | 1279-1287 |
| 5 | Pas de validation primitives | 🟡 Mineur | Mapping vers clés inexistantes | `code.js` | 1200-1219 |
| 6 | Export CSS manquant | 🟡 Mineur | Pas de format CSS standard | N/A | N/A |

---

## ✅ Plan de Correction Recommandé

### Phase 1 : Correction Critique (Alias)

1. **Unifier la structure de données** entre `mapSemanticTokens` et `importTokensToFigma`
2. **Garantir la présence de `aliasRef`** dans tous les tokens sémantiques
3. **Tester la création d'alias** dans Figma

### Phase 2 : Hiérarchie et Complétude

1. **Valider les primitives disponibles** avant mapping
2. **Implémenter un fallback intelligent** pour les valeurs manquantes
3. **Ajouter les tokens manquants** selon les standards

### Phase 3 : Export et Standards

1. **Créer la fonction `generateCSSExport`**
2. **Valider la conformité** avec les conventions de chaque lib
3. **Ajouter des tests** pour vérifier la complétude

---

## 🎯 Recommandations Architecturales

### 1. Séparer Génération et Synchronisation

```javascript
// Génération (pure, sans side-effects)
var semanticTokens = generateSemanticTokens(primitives, options);

// Validation (avant sync)
var validation = validateSemanticTokens(semanticTokens, primitives);
if (!validation.valid) {
    console.error('Validation failed:', validation.errors);
    return;
}

// Synchronisation (avec Figma)
await syncSemanticToFigma(semanticTokens, primitiveMap);
```

### 2. Créer un Schéma de Validation

```javascript
var SEMANTIC_SCHEMA = {
    required: [
        'bg.canvas', 'bg.surface', 'bg.elevated', 'bg.subtle', 'bg.muted', 'bg.accent', 'bg.inverse',
        'text.primary', 'text.secondary', 'text.muted', 'text.accent', 'text.link',
        // ... tous les tokens requis
    ],
    structure: {
        'bg.*': { type: 'COLOR', aliasTo: 'gray' },
        'text.*': { type: 'COLOR', aliasTo: 'gray' },
        'action.*': { type: 'COLOR', aliasTo: 'brand' },
        // ...
    }
};

function validateSemanticTokens(tokens, primitives) {
    var errors = [];
    
    // Vérifier la présence de tous les tokens requis
    SEMANTIC_SCHEMA.required.forEach(function(key) {
        if (!tokens[key]) {
            errors.push({ type: 'MISSING_TOKEN', key: key });
        }
    });
    
    // Vérifier que les alias pointent vers des primitives existantes
    for (var key in tokens) {
        var token = tokens[key];
        if (token.aliasRef) {
            var primitive = primitives[token.aliasRef.category];
            if (!primitive || !primitive[token.aliasRef.key]) {
                errors.push({ 
                    type: 'BROKEN_ALIAS', 
                    key: key, 
                    aliasRef: token.aliasRef 
                });
            }
        }
    }
    
    return { valid: errors.length === 0, errors: errors };
}
```

### 3. Logging et Debugging

```javascript
function diagnoseSemanticGeneration(tokens, primitives) {
    console.group('🔍 Semantic Generation Diagnostics');
    
    // Stats générales
    console.log('Total semantic tokens:', Object.keys(tokens).length);
    
    // Comptage par catégorie
    var categories = {};
    for (var key in tokens) {
        var cat = key.split('.')[0];
        categories[cat] = (categories[cat] || 0) + 1;
    }
    console.table(categories);
    
    // Alias vs Raw values
    var aliasCount = 0;
    var rawCount = 0;
    for (var key in tokens) {
        if (tokens[key].aliasRef) aliasCount++;
        else rawCount++;
    }
    console.log('Aliases:', aliasCount, '| Raw values:', rawCount);
    
    // Tokens sans alias attendu
    var missingAliases = [];
    for (var key in tokens) {
        if (!tokens[key].aliasRef && SEMANTIC_TYPE_MAP[key] === 'COLOR') {
            missingAliases.push(key);
        }
    }
    if (missingAliases.length > 0) {
        console.warn('⚠️ Tokens without alias:', missingAliases);
    }
    
    console.groupEnd();
}
```

---

## 📝 Conclusion

Le système de génération de tokens sémantiques souffre de **3 problèmes majeurs** :

1. **Rupture de la chaîne alias** entre génération et synchronisation
2. **Hiérarchie non garantie** pour les backgrounds en mode light
3. **Palette incomplète** par rapport aux standards des librairies

La correction nécessite une **refonte partielle** de la logique de mapping et de synchronisation, avec l'ajout de **validations strictes** et d'un **export CSS conforme** aux standards.

**Effort estimé** : 2-3 jours de développement + tests
**Priorité** : 🔴 Critique (bloque la fonctionnalité principale)
