# 🔧 SOLUTIONS - Correction de la Génération Sémantique

## 🎯 Vue d'Ensemble

Ce document présente les solutions concrètes pour corriger les 3 problèmes majeurs identifiés dans l'audit.

---

## ✅ SOLUTION 1 : Restaurer la Chaîne d'Alias

### Problème
Les `aliasRef` générés par `mapSemanticTokens` ne sont pas utilisés lors de l'import dans Figma.

### Solution : Restructurer le Retour de `mapSemanticTokens`

**Avant (structure actuelle) :**
```javascript
// mapSemanticTokens retourne
{
    modes: {
        light: {
            'bg.canvas': {
                resolvedValue: '#F5F5F5',
                type: 'COLOR',
                aliasRef: { category: 'gray', key: '50' }
            }
        },
        dark: { ... }
    }
}
```

**Après (structure corrigée) :**
```javascript
// mapSemanticTokens doit retourner une structure plate par mode
{
    'bg.canvas': {
        resolvedValue: '#F5F5F5',
        type: 'COLOR',
        aliasRef: { category: 'gray', key: '50' },
        modes: {
            light: { 
                resolvedValue: '#F5F5F5',
                aliasRef: { category: 'gray', key: '50' }
            },
            dark: {
                resolvedValue: '#0D0D0C',
                aliasRef: { category: 'gray', key: '950' }
            }
        }
    }
}
```

### Code de Correction

**Étape 1 : Modifier `mapSemanticTokens` pour retourner la bonne structure**

```javascript
function mapSemanticTokens(palettes, preset, options) {
    console.log("Step 4: Mapping Semantics (Strict Mode)");

    var semanticKeys = [
        'bg.canvas', 'bg.surface', 'bg.elevated', 'bg.subtle', 'bg.muted', 'bg.accent', 'bg.inverse',
        'text.primary', 'text.secondary', 'text.muted', 'text.accent', 'text.link', 
        'text.inverse', 'text.on-inverse', 'text.disabled',
        'border.default', 'border.muted', 'border.accent', 'border.focus',
        'action.primary.default', 'action.primary.hover', 'action.primary.active', 
        'action.primary.disabled', 'action.primary.text',
        'action.secondary.default', 'action.secondary.hover', 'action.secondary.active',
        'action.secondary.disabled', 'action.secondary.text',
        'status.success', 'status.success.text',
        'status.warning', 'status.warning.text',
        'status.error', 'status.error.text',
        'status.info', 'status.info.text',
        'on.primary', 'on.secondary', 'on.success', 'on.warning', 'on.error', 'on.info', 'on.inverse',
        'radius.sm', 'radius.md', 'space.sm', 'space.md',
        'font.size.base', 'font.weight.base'
    ];

    var hierarchyGroups = {
        bg: ['bg.canvas', 'bg.surface', 'bg.elevated', 'bg.subtle', 'bg.muted', 'bg.accent', 'bg.inverse'],
        text: ['text.primary', 'text.secondary', 'text.muted', 'text.accent', 'text.link', 'text.disabled'],
        action: ['action.primary.default', 'action.primary.hover', 'action.primary.active'],
        border: ['border.default', 'border.muted', 'border.accent', 'border.focus']
    };

    // ✅ NOUVELLE STRUCTURE : Un objet par token avec modes imbriqués
    var result = {};

    var modes = ['light', 'dark'];

    modes.forEach(function (mode) {
        var isDark = mode === 'dark';
        var usedPrimitives = {};
        var processedKeys = [];

        Object.keys(hierarchyGroups).forEach(function (groupName) {
            var keys = hierarchyGroups[groupName];
            var familyUsedRefs = [];

            keys.forEach(function (semKey) {
                var mapDef = getStandardMapping(semKey);
                if (!mapDef) return;

                var category = mapDef.category;
                var preferredRef = isDark ? mapDef.dark : mapDef.light;

                // Collision resolution (inchangé)
                var finalRef = preferredRef;
                var paletteCat = palettes[category];

                if (mapDef.type === 'COLOR' && category === 'gray') {
                    var candidates = getAvailableKeys(paletteCat);
                    var idx = candidates.indexOf(preferredRef);
                    if (idx === -1) idx = 0;

                    var direction = isDark ? -1 : 1;
                    var currentIdx = idx;

                    while (
                        currentIdx >= 0 &&
                        currentIdx < candidates.length &&
                        familyUsedRefs.indexOf(candidates[currentIdx]) !== -1
                    ) {
                        currentIdx += direction;
                    }

                    if (currentIdx >= 0 && currentIdx < candidates.length) {
                        finalRef = candidates[currentIdx];
                    } else {
                        console.error("CRITICAL: hierarchy exhausted for " + semKey + " in " + mode + " mode.");
                        finalRef = preferredRef;
                    }

                    familyUsedRefs.push(finalRef);
                }

                // Resolve value
                var resolvedValue = "#FF00FF";
                var aliasInfo = null;

                if (paletteCat && paletteCat[finalRef]) {
                    resolvedValue = paletteCat[finalRef];
                    aliasInfo = {
                        category: category,
                        key: finalRef
                    };
                } else if (mapDef.type === 'FLOAT') {
                    resolvedValue = (palettes[category] && palettes[category][finalRef]) || 8;
                    aliasInfo = { category: category, key: finalRef };
                }

                // ✅ NOUVELLE STRUCTURE : Créer l'objet token si nécessaire
                if (!result[semKey]) {
                    result[semKey] = {
                        type: mapDef.type,
                        modes: {}
                    };
                }

                // ✅ Stocker les données par mode
                result[semKey].modes[mode] = {
                    resolvedValue: resolvedValue,
                    aliasRef: aliasInfo
                };

                processedKeys.push(semKey);
            });
        });

        // Process remaining keys (non-hierarchical)
        semanticKeys.forEach(function (semKey) {
            if (processedKeys.indexOf(semKey) !== -1) return;

            var mapDef = getStandardMapping(semKey);
            if (!mapDef) return;

            var category = mapDef.category;
            var preferredRef = isDark ? mapDef.dark : mapDef.light;

            var resolvedValue = "#000000";
            var aliasInfo = null;

            if (palettes[category]) {
                var val = palettes[category][preferredRef];
                if (val) {
                    resolvedValue = val;
                    aliasInfo = { category: category, key: preferredRef };
                } else {
                    var keys = Object.keys(palettes[category]);
                    if (keys.length > 0) {
                        resolvedValue = palettes[category][keys[0]];
                        aliasInfo = { category: category, key: keys[0] };
                    }
                }
            } else if (mapDef.type === 'FLOAT') {
                resolvedValue = 8;
                aliasInfo = { category: category, key: preferredRef };
            }

            if (!result[semKey]) {
                result[semKey] = {
                    type: mapDef.type,
                    modes: {}
                };
            }

            result[semKey].modes[mode] = {
                resolvedValue: resolvedValue,
                aliasRef: aliasInfo
            };
        });
    });

    return result;

    // Helper functions (inchangées)
    function getStandardMapping(key) {
        // Background
        if (key === 'bg.canvas') return { category: 'gray', light: '50', dark: '950', type: 'COLOR' };
        if (key === 'bg.surface') return { category: 'gray', light: '100', dark: '900', type: 'COLOR' };
        if (key === 'bg.elevated') return { category: 'gray', light: '200', dark: '800', type: 'COLOR' };
        if (key === 'bg.subtle') return { category: 'gray', light: '100', dark: '800', type: 'COLOR' };
        if (key === 'bg.muted') return { category: 'gray', light: '300', dark: '700', type: 'COLOR' };
        if (key === 'bg.accent') return { category: 'brand', light: '500', dark: '500', type: 'COLOR' };
        if (key === 'bg.inverse') return { category: 'gray', light: '950', dark: '50', type: 'COLOR' };

        // Text
        if (key === 'text.primary') return { category: 'gray', light: '950', dark: '50', type: 'COLOR' };
        if (key === 'text.secondary') return { category: 'gray', light: '600', dark: '400', type: 'COLOR' };
        if (key === 'text.muted') return { category: 'gray', light: '400', dark: '600', type: 'COLOR' };
        if (key === 'text.accent') return { category: 'brand', light: '600', dark: '400', type: 'COLOR' };
        if (key === 'text.link') return { category: 'brand', light: '500', dark: '300', type: 'COLOR' };
        if (key === 'text.disabled') return { category: 'gray', light: '300', dark: '700', type: 'COLOR' };
        if (key === 'text.inverse') return { category: 'gray', light: '50', dark: '950', type: 'COLOR' };
        if (key === 'text.on-inverse') return { category: 'gray', light: 'white', dark: '950', type: 'COLOR' };

        // Border
        if (key === 'border.default') return { category: 'gray', light: '200', dark: '800', type: 'COLOR' };
        if (key === 'border.muted') return { category: 'gray', light: '100', dark: '900', type: 'COLOR' };
        if (key === 'border.accent') return { category: 'brand', light: '200', dark: '500', type: 'COLOR' };
        if (key === 'border.focus') return { category: 'brand', light: '500', dark: '400', type: 'COLOR' };

        // Action
        var brandMain = (preset.name === 'mui') ? 'main' : '500';
        var brandHover = (preset.name === 'mui') ? 'dark' : '600';
        var brandActive = (preset.name === 'mui') ? 'dark' : '700';

        if (key === 'action.primary.default') return { category: 'brand', light: brandMain, dark: brandMain, type: 'COLOR' };
        if (key === 'action.primary.hover') return { category: 'brand', light: brandHover, dark: brandHover, type: 'COLOR' };
        if (key === 'action.primary.active') return { category: 'brand', light: brandActive, dark: brandActive, type: 'COLOR' };
        if (key === 'action.primary.disabled') return { category: 'gray', light: '300', dark: '800', type: 'COLOR' };
        if (key === 'action.primary.text') return { category: 'gray', light: 'white', dark: '900', type: 'COLOR' };

        if (key === 'action.secondary.default') return { category: 'gray', light: '100', dark: '800', type: 'COLOR' };
        if (key === 'action.secondary.hover') return { category: 'gray', light: '200', dark: '700', type: 'COLOR' };
        if (key === 'action.secondary.active') return { category: 'gray', light: '300', dark: '600', type: 'COLOR' };
        if (key === 'action.secondary.disabled') return { category: 'gray', light: '100', dark: '900', type: 'COLOR' };
        if (key === 'action.secondary.text') return { category: 'gray', light: '900', dark: '50', type: 'COLOR' };

        // Status
        if (key.indexOf('status.') === 0) {
            var statusType = key.split('.')[1];
            if (key.endsWith('.text')) {
                // Contrast text for status
                return { category: 'gray', light: 'white', dark: '900', type: 'COLOR' };
            }
            return { category: statusType, light: '500', dark: '500', type: 'COLOR' };
        }

        // On-colors
        if (key.indexOf('on.') === 0) {
            return { category: 'gray', light: 'white', dark: '900', type: 'COLOR' };
        }

        // Floats
        if (key.indexOf('radius.') === 0) return { category: 'radius', light: key.split('.')[1], dark: key.split('.')[1], type: 'FLOAT' };
        if (key.indexOf('space.') === 0) return { category: 'spacing', light: key.split('.')[1], dark: key.split('.')[1], type: 'FLOAT' };
        if (key === 'font.size.base') return { category: 'typography', light: 'base', dark: 'base', type: 'FLOAT' };
        if (key === 'font.weight.base') return { category: 'typography', light: 'base', dark: 'base', type: 'FLOAT' };

        return null;
    }

    function getAvailableKeys(categoryObj) {
        if (!categoryObj) return [];
        return Object.keys(categoryObj).sort(function (a, b) {
            var na = parseInt(a);
            var nb = parseInt(b);
            if (!isNaN(na) && !isNaN(nb)) return na - nb;
            return 0;
        });
    }
}
```

**Étape 2 : Adapter `importTokensToFigma` pour utiliser la nouvelle structure**

```javascript
async function importTokensToFigma(tokens, naming, overwrite) {
    console.log('🔄 ENGINE SYNC: Starting importTokensToFigma (Refactored)');

    saveNamingToFile(naming);

    var primitiveMap = {};

    function registerPrimitive(category, key, variableId) {
        if (!primitiveMap[category]) primitiveMap[category] = {};
        primitiveMap[category][key] = variableId;
    }

    // --- PRIMITIVES SYNC (inchangé) ---
    if (tokens.brand) {
        var brandCollection = getOrCreateCollection("Brand Colors", overwrite);
        for (var key in tokens.brand) {
            if (!tokens.brand.hasOwnProperty(key)) continue;
            var varName = (naming === "mui") ? "primary/" + key : "primary-" + key;
            if (naming === "bootstrap") varName = key;

            var variable = await createOrUpdateVariable(brandCollection, varName, "COLOR", hexToRgb(tokens.brand[key]), "brand", overwrite, undefined);
            if (variable) registerPrimitive('brand', key, variable.id);
        }
    }

    // ... (autres primitives inchangées)

    // --- SEMANTICS SYNC (CORRIGÉ) ---
    if (tokens.semantic) {
        console.log("Processing Semantic Tokens (Engine Mode)...");
        var semanticCollection = getOrCreateCollection("Semantic", overwrite);

        // ✅ Ensure modes exist
        if (semanticCollection.modes.length === 1 && semanticCollection.modes[0].name === "Mode 1") {
            try { semanticCollection.renameMode(semanticCollection.modes[0].modeId, "Light"); } catch (e) { }
        }
        var lightMode = semanticCollection.modes.find(function (m) { return m.name === "Light"; });
        var darkMode = semanticCollection.modes.find(function (m) { return m.name === "Dark"; });

        if (!darkMode) {
            try { 
                semanticCollection.addMode("Dark"); 
                darkMode = semanticCollection.modes.find(function (m) { return m.name === "Dark"; });
            } catch (e) { 
                console.warn(e); 
            }
        }

        var aliasCount = 0;
        var rawCount = 0;

        // ✅ NOUVELLE LOGIQUE : Itérer sur les tokens, puis sur les modes
        for (var key in tokens.semantic) {
            if (!tokens.semantic.hasOwnProperty(key)) continue;

            var tokenData = tokens.semantic[key];
            var variableName = getSemanticVariableName(key, naming);
            var variableType = tokenData.type || SEMANTIC_TYPE_MAP[key] || "COLOR";

            // Create variable once (shared across modes)
            var variable = await createOrUpdateVariable(
                semanticCollection, 
                variableName, 
                variableType, 
                null,  // No initial value
                "semantic", 
                overwrite, 
                key
            );

            if (!variable) continue;

            // ✅ Apply values for each mode
            var modesToProcess = [
                { name: 'light', modeId: lightMode ? lightMode.modeId : null, data: tokenData.modes.light },
                { name: 'dark', modeId: darkMode ? darkMode.modeId : null, data: tokenData.modes.dark }
            ];

            for (var m = 0; m < modesToProcess.length; m++) {
                var modeInfo = modesToProcess[m];
                if (!modeInfo.modeId || !modeInfo.data) continue;

                var modeData = modeInfo.data;
                var resolvedValue = modeData.resolvedValue;
                var aliasRef = modeData.aliasRef;

                var valueToSet = null;

                // ✅ Try to create alias if ref exists
                if (aliasRef && primitiveMap[aliasRef.category] && primitiveMap[aliasRef.category][aliasRef.key]) {
                    var primitiveId = primitiveMap[aliasRef.category][aliasRef.key];
                    var primitiveVar = figma.variables.getVariableById(primitiveId);
                    if (primitiveVar) {
                        valueToSet = figma.variables.createVariableAlias(primitiveVar);
                        aliasCount++;
                        console.log(`✅ [ALIAS_SUCCESS] ${key} (${modeInfo.name}) -> ${aliasRef.category}.${aliasRef.key}`);
                    } else {
                        console.log(`❌ [ALIAS_FAIL] ${key} (${modeInfo.name}) -> primitive not found`);
                    }
                }

                // ✅ Fallback to raw value if no alias
                if (!valueToSet) {
                    if (variableType === 'COLOR') {
                        valueToSet = hexToRgb(resolvedValue);
                    } else {
                        valueToSet = normalizeFloatValue(resolvedValue);
                    }
                    rawCount++;
                    console.log(`⚠️ [RAW_FALLBACK] ${key} (${modeInfo.name}) -> ${resolvedValue}`);
                }

                // ✅ Apply value
                if (valueToSet) {
                    try {
                        variable.setValueForMode(modeInfo.modeId, valueToSet);
                    } catch (e) {
                        console.error(`Failed to set mode value for ${key} (${modeInfo.name}):`, e);
                    }
                }
            }
        }

        figma.notify(`✅ Sync Complete: ${aliasCount} aliases, ${rawCount} raw values`);
    }

    figma.ui.postMessage({ type: 'import-completed' });
}
```

---

## ✅ SOLUTION 2 : Garantir la Hiérarchie Background

### Problème
Les collisions dans la palette light ne sont pas correctement gérées.

### Solution : Validation et Fallback Intelligent

```javascript
function mapSemanticTokens(palettes, preset, options) {
    // ... (début inchangé)

    // ✅ NOUVELLE FONCTION : Valider la palette avant mapping
    function validatePalette(category, requiredKeys) {
        var available = Object.keys(palettes[category] || {});
        var missing = requiredKeys.filter(function(k) { return !available.includes(k); });
        
        if (missing.length > 0) {
            console.warn(`⚠️ Missing keys in ${category}:`, missing);
            console.log(`Available keys:`, available);
        }
        
        return { available: available, missing: missing };
    }

    // ✅ Valider la palette gray avant de commencer
    var grayValidation = validatePalette('gray', ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950']);
    var availableGrayKeys = grayValidation.available.sort(function(a, b) {
        var na = parseInt(a);
        var nb = parseInt(b);
        if (!isNaN(na) && !isNaN(nb)) return na - nb;
        return 0;
    });

    // ✅ NOUVELLE FONCTION : Trouver la clé la plus proche disponible
    function findClosestKey(target, available, direction) {
        // direction: 1 = forward (darker), -1 = backward (lighter)
        var targetNum = parseInt(target);
        if (isNaN(targetNum)) return target;

        var availableNums = available
            .map(function(k) { return parseInt(k); })
            .filter(function(n) { return !isNaN(n); })
            .sort(function(a, b) { return a - b; });

        if (availableNums.includes(targetNum)) return target;

        // Chercher la valeur la plus proche dans la direction spécifiée
        var candidates = direction > 0 
            ? availableNums.filter(function(n) { return n >= targetNum; })
            : availableNums.filter(function(n) { return n <= targetNum; }).reverse();

        return candidates.length > 0 ? String(candidates[0]) : String(availableNums[0]);
    }

    // ✅ MODIFIER getStandardMapping pour utiliser findClosestKey
    function getStandardMapping(key) {
        if (key === 'bg.canvas') {
            var lightKey = findClosestKey('50', availableGrayKeys, 1);
            var darkKey = findClosestKey('950', availableGrayKeys, -1);
            return { category: 'gray', light: lightKey, dark: darkKey, type: 'COLOR' };
        }
        if (key === 'bg.surface') {
            var lightKey = findClosestKey('100', availableGrayKeys, 1);
            var darkKey = findClosestKey('900', availableGrayKeys, -1);
            return { category: 'gray', light: lightKey, dark: darkKey, type: 'COLOR' };
        }
        if (key === 'bg.elevated') {
            var lightKey = findClosestKey('200', availableGrayKeys, 1);
            var darkKey = findClosestKey('800', availableGrayKeys, -1);
            return { category: 'gray', light: lightKey, dark: darkKey, type: 'COLOR' };
        }
        if (key === 'bg.muted') {
            var lightKey = findClosestKey('300', availableGrayKeys, 1);
            var darkKey = findClosestKey('700', availableGrayKeys, -1);
            return { category: 'gray', light: lightKey, dark: darkKey, type: 'COLOR' };
        }
        // ... (autres mappings similaires)
    }

    // ✅ AMÉLIORER la logique de collision
    Object.keys(hierarchyGroups).forEach(function (groupName) {
        var keys = hierarchyGroups[groupName];
        var familyUsedRefs = [];

        keys.forEach(function (semKey) {
            var mapDef = getStandardMapping(semKey);
            if (!mapDef) return;

            var category = mapDef.category;
            var preferredRef = isDark ? mapDef.dark : mapDef.light;

            var finalRef = preferredRef;
            var paletteCat = palettes[category];

            if (mapDef.type === 'COLOR' && category === 'gray') {
                var candidates = availableGrayKeys;  // Utiliser la liste validée
                var idx = candidates.indexOf(preferredRef);
                
                if (idx === -1) {
                    // ✅ Si la clé préférée n'existe pas, trouver la plus proche
                    console.warn(`⚠️ ${semKey}: preferred key ${preferredRef} not found, finding closest`);
                    preferredRef = findClosestKey(preferredRef, candidates, isDark ? -1 : 1);
                    idx = candidates.indexOf(preferredRef);
                }

                var direction = isDark ? -1 : 1;
                var currentIdx = idx;

                // ✅ Chercher une clé non utilisée
                var attempts = 0;
                while (
                    currentIdx >= 0 &&
                    currentIdx < candidates.length &&
                    familyUsedRefs.indexOf(candidates[currentIdx]) !== -1 &&
                    attempts < candidates.length  // Éviter les boucles infinies
                ) {
                    console.log(`⚠️ Hierarchy Collision (${mode}): ${semKey} wants ${candidates[currentIdx]} but occupied.`);
                    currentIdx += direction;
                    attempts++;
                }

                if (currentIdx >= 0 && currentIdx < candidates.length) {
                    finalRef = candidates[currentIdx];
                    console.log(`✅ ${semKey} (${mode}) -> ${finalRef}`);
                } else {
                    // ✅ Si on ne trouve rien dans la direction préférée, chercher dans l'autre
                    console.warn(`⚠️ ${semKey}: exhausted ${direction > 0 ? 'forward' : 'backward'} search, trying opposite direction`);
                    currentIdx = idx - direction;
                    while (
                        currentIdx >= 0 &&
                        currentIdx < candidates.length &&
                        familyUsedRefs.indexOf(candidates[currentIdx]) !== -1
                    ) {
                        currentIdx -= direction;
                    }
                    
                    if (currentIdx >= 0 && currentIdx < candidates.length) {
                        finalRef = candidates[currentIdx];
                        console.log(`✅ ${semKey} (${mode}) -> ${finalRef} (opposite direction)`);
                    } else {
                        console.error(`❌ CRITICAL: No available key for ${semKey} in ${mode} mode`);
                        finalRef = preferredRef;  // Fallback (will create collision)
                    }
                }

                familyUsedRefs.push(finalRef);
            }

            // ... (reste inchangé)
        });
    });
}
```

---

## ✅ SOLUTION 3 : Compléter la Palette Sémantique

### Mise à Jour des Constantes

```javascript
// ✅ Liste complète des tokens sémantiques
var SEMANTIC_TOKENS = [
    // Background (7 tokens)
    'bg.canvas', 'bg.surface', 'bg.elevated', 'bg.subtle', 'bg.muted', 'bg.accent', 'bg.inverse',
    
    // Text (8 tokens)
    'text.primary', 'text.secondary', 'text.muted', 'text.accent', 'text.link', 
    'text.inverse', 'text.on-inverse', 'text.disabled',
    
    // Border (4 tokens)
    'border.default', 'border.muted', 'border.accent', 'border.focus',
    
    // Action Primary (5 tokens)
    'action.primary.default', 'action.primary.hover', 'action.primary.active', 
    'action.primary.disabled', 'action.primary.text',
    
    // Action Secondary (5 tokens)
    'action.secondary.default', 'action.secondary.hover', 'action.secondary.active',
    'action.secondary.disabled', 'action.secondary.text',
    
    // Status (8 tokens)
    'status.success', 'status.success.text',
    'status.warning', 'status.warning.text',
    'status.error', 'status.error.text',
    'status.info', 'status.info.text',
    
    // On-colors (7 tokens)
    'on.primary', 'on.secondary', 'on.success', 'on.warning', 'on.error', 'on.info', 'on.inverse',
    
    // Floats (6 tokens)
    'radius.sm', 'radius.md', 'space.sm', 'space.md',
    'font.size.base', 'font.weight.base'
];

// ✅ Type map complet
var SEMANTIC_TYPE_MAP = {
    // Background
    'bg.canvas': 'COLOR', 'bg.surface': 'COLOR', 'bg.elevated': 'COLOR', 
    'bg.subtle': 'COLOR', 'bg.muted': 'COLOR', 'bg.accent': 'COLOR', 'bg.inverse': 'COLOR',
    
    // Text
    'text.primary': 'COLOR', 'text.secondary': 'COLOR', 'text.muted': 'COLOR', 
    'text.accent': 'COLOR', 'text.link': 'COLOR', 
    'text.inverse': 'COLOR', 'text.on-inverse': 'COLOR', 'text.disabled': 'COLOR',
    
    // Border
    'border.default': 'COLOR', 'border.muted': 'COLOR', 
    'border.accent': 'COLOR', 'border.focus': 'COLOR',
    
    // Action Primary
    'action.primary.default': 'COLOR', 'action.primary.hover': 'COLOR', 
    'action.primary.active': 'COLOR', 'action.primary.disabled': 'COLOR', 
    'action.primary.text': 'COLOR',
    
    // Action Secondary
    'action.secondary.default': 'COLOR', 'action.secondary.hover': 'COLOR',
    'action.secondary.active': 'COLOR', 'action.secondary.disabled': 'COLOR',
    'action.secondary.text': 'COLOR',
    
    // Status
    'status.success': 'COLOR', 'status.success.text': 'COLOR',
    'status.warning': 'COLOR', 'status.warning.text': 'COLOR',
    'status.error': 'COLOR', 'status.error.text': 'COLOR',
    'status.info': 'COLOR', 'status.info.text': 'COLOR',
    
    // On-colors
    'on.primary': 'COLOR', 'on.secondary': 'COLOR', 
    'on.success': 'COLOR', 'on.warning': 'COLOR', 
    'on.error': 'COLOR', 'on.info': 'COLOR', 'on.inverse': 'COLOR',
    
    // Floats
    'radius.sm': 'FLOAT', 'radius.md': 'FLOAT', 
    'space.sm': 'FLOAT', 'space.md': 'FLOAT',
    'font.size.base': 'FLOAT', 'font.weight.base': 'FLOAT'
};

// ✅ Name map complet pour Tailwind
var SEMANTIC_NAME_MAP = {
    tailwind: {
        // Background
        'bg.canvas': 'background/canvas',
        'bg.surface': 'background/surface',
        'bg.elevated': 'background/elevated',
        'bg.subtle': 'background/subtle',
        'bg.muted': 'background/muted',
        'bg.accent': 'background/accent',
        'bg.inverse': 'background/inverse',
        
        // Text
        'text.primary': 'text/primary',
        'text.secondary': 'text/secondary',
        'text.muted': 'text/muted',
        'text.accent': 'text/accent',
        'text.link': 'text/link',
        'text.inverse': 'text/inverse',
        'text.on-inverse': 'text/on-inverse',
        'text.disabled': 'text/disabled',
        
        // Border
        'border.default': 'border/default',
        'border.muted': 'border/muted',
        'border.accent': 'border/accent',
        'border.focus': 'border/focus',
        
        // Action Primary
        'action.primary.default': 'primary/default',
        'action.primary.hover': 'primary/hover',
        'action.primary.active': 'primary/active',
        'action.primary.disabled': 'primary/disabled',
        'action.primary.text': 'primary/text',
        
        // Action Secondary
        'action.secondary.default': 'secondary/default',
        'action.secondary.hover': 'secondary/hover',
        'action.secondary.active': 'secondary/active',
        'action.secondary.disabled': 'secondary/disabled',
        'action.secondary.text': 'secondary/text',
        
        // Status
        'status.success': 'success/default',
        'status.success.text': 'success/text',
        'status.warning': 'warning/default',
        'status.warning.text': 'warning/text',
        'status.error': 'destructive/default',
        'status.error.text': 'destructive/text',
        'status.info': 'info/default',
        'status.info.text': 'info/text',
        
        // On-colors
        'on.primary': 'on/primary',
        'on.secondary': 'on/secondary',
        'on.success': 'on/success',
        'on.warning': 'on/warning',
        'on.error': 'on/error',
        'on.info': 'on/info',
        'on.inverse': 'on/inverse',
        
        // Floats
        'radius.sm': 'radius/sm',
        'radius.md': 'radius/md',
        'space.sm': 'space/sm',
        'space.md': 'space/md',
        'font.size.base': 'font/size/base',
        'font.weight.base': 'font/weight/base'
    }
    // ... (autres libs à compléter de la même manière)
};
```

---

## 📊 Checklist de Validation

Avant de considérer la correction comme terminée, vérifier :

### ✅ Alias
- [ ] Les `aliasRef` sont présents dans tous les tokens sémantiques
- [ ] Les alias sont créés dans Figma (vérifier dans l'UI)
- [ ] Les alias pointent vers les bonnes primitives
- [ ] Pas de valeurs brutes (#FFFFFF, etc.) dans les tokens qui devraient avoir des alias

### ✅ Hiérarchie
- [ ] Pas de collisions dans la palette light
- [ ] Pas de collisions dans la palette dark
- [ ] L'ordre bg.canvas < bg.surface < bg.elevated < bg.muted est respecté
- [ ] Les valeurs manquantes ont un fallback intelligent

### ✅ Complétude
- [ ] Tous les tokens de `SEMANTIC_TOKENS` sont générés
- [ ] Tous les tokens ont un mapping dans `SEMANTIC_TYPE_MAP`
- [ ] Tous les tokens ont un nom Figma dans `SEMANTIC_NAME_MAP`
- [ ] Les tokens contrastText sont présents pour actions et status

### ✅ Standards
- [ ] La structure CSS est conforme (`:root` + `html[data-theme]`)
- [ ] Les alias CSS utilisent `var()` correctement
- [ ] Les noms de variables respectent les conventions de chaque lib

---

## 🎯 Ordre d'Implémentation Recommandé

1. **Jour 1 : Restructuration**
   - Modifier `mapSemanticTokens` pour retourner la nouvelle structure
   - Adapter `importTokensToFigma` pour utiliser cette structure
   - Tester la création d'alias dans Figma

2. **Jour 2 : Hiérarchie et Validation**
   - Implémenter `validatePalette` et `findClosestKey`
   - Améliorer la logique de collision
   - Tester avec différentes palettes (complètes et partielles)

3. **Jour 3 : Complétude et Export**
   - Ajouter les tokens manquants
   - Créer la fonction `generateCSSExport`
   - Tests finaux et validation

---

## 📝 Notes Importantes

### Compatibilité Ascendante

Les modifications proposées **cassent la compatibilité** avec les tokens existants. Il faut donc :

1. **Migrer les tokens existants** vers la nouvelle structure
2. **Avertir l'utilisateur** avant de regénérer
3. **Offrir une option de backup** avant migration

### Performance

La nouvelle structure avec modes imbriqués est **plus lourde** en mémoire. Pour optimiser :

1. Ne charger que le mode actif dans l'UI
2. Lazy-load les modes non utilisés
3. Compresser les données avant stockage

### Tests

Créer des tests unitaires pour :

1. `mapSemanticTokens` avec différentes palettes
2. `findClosestKey` avec différents scénarios
3. `validatePalette` avec palettes complètes et partielles
4. Création d'alias dans Figma (test d'intégration)
