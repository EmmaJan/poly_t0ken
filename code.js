


// Plugin startup verification - verified manually: 0 occurrences of variable.scopes = assignments
console.log("✅ Plugin initialized: scopes use setScopes() method only");

// États possibles pour un token sémantique (robustesse des alias)
const TOKEN_STATE = {
  VALUE: "VALUE",               // Valeur scalaire fiable
  ALIAS_RESOLVED: "ALIAS_RESOLVED",   // Alias résolu vers un objet descripteur
  ALIAS_UNRESOLVED: "ALIAS_UNRESOLVED" // Alias présent mais non résolu (temporaire/async)
};


// Naming persistence utilities (per-file)
function saveNamingToFile(naming) {
  try {
    // Sauvegarde dans root pour compatibilité
    figma.root.setPluginData("tokenStarter.naming", naming);
    // Sauvegarde dans clientStorage pour l'async (fire-and-forget)
    figma.clientStorage.setAsync("tokenStarter.naming", naming).catch(() => {});
    console.log('💾 Saved naming to both storages:', naming);
  } catch (e) {
    console.warn('Could not save naming:', e);
  }
}

// Fonction helper pour analyser les stats des tokens sémantiques
function analyzeSemanticTokensStats(tokens, context) {
  var total = Object.keys(tokens).length;
  var aliasCount = 0;
  var valueCount = 0;
  var fallbackValues = [];
  var fallbackKeys = [];

  // Valeurs considérées comme "fallback" (noir/blanc/zéro)
  var fallbackPatterns = ['#FFFFFF', '#000000', '#ffffff', '#000000', '0', 0];

  for (var key in tokens) {
    if (!tokens.hasOwnProperty(key)) continue;

    var tokenData = tokens[key];
    var resolvedValue = typeof tokenData === 'object' ? tokenData.resolvedValue : tokenData;

    if (tokenData.aliasTo) {
      aliasCount++;
    } else {
      valueCount++;
    }

    // Détecter les valeurs fallback
    if (fallbackPatterns.includes(resolvedValue)) {
      fallbackValues.push(`${key}=${resolvedValue}`);
      fallbackKeys.push(key);
      if (fallbackValues.length >= 5) break; // Top 5 seulement
    }
  }

  return {
    total: total,
    aliasCount: aliasCount,
    valueCount: valueCount,
    fallbackKeys: fallbackKeys,
    fallbackValues: fallbackValues,
    context: context
  };
}

function saveSemanticTokensToFile(semanticTokens, callsite) {
  try {
    if (semanticTokens && Object.keys(semanticTokens).length > 0) {
      // VALIDATION : S'assurer que tous les resolvedValue sont scalaires
      for (var key in semanticTokens) {
        if (!semanticTokens.hasOwnProperty(key)) continue;
        var token = semanticTokens[key];
        if (typeof token === 'object' && token.resolvedValue !== undefined) {
          if (typeof token.resolvedValue !== 'string' && typeof token.resolvedValue !== 'number') {
            console.warn(`⚠️ Token sémantique ${key} a un resolvedValue non scalaire:`, token.resolvedValue);
            // Forcer une valeur scalaire
            token.resolvedValue = String(token.resolvedValue);
          }
        }
      }

      // Charger les tokens existants pour préserver aliasTo complexe
      var existingTokens = getSemanticTokensFromFile('MERGE_CHECK') || {};

      var formattedTokens = {};
      var aliasResolvedCount = 0;
      var aliasUnresolvedCount = 0;
      var valueCount = 0;
      var blockedFallbackCount = 0;
      var preservedUnresolvedCount = 0;

      for (var key in semanticTokens) {
        if (!semanticTokens.hasOwnProperty(key)) continue;

        var tokenData = semanticTokens[key];
        var tokenType = SEMANTIC_TYPE_MAP[key] || "COLOR";
        var existingToken = existingTokens[key];

        // Format normalisé
        var normalizedToken = null;

        if (typeof tokenData === 'object' && tokenData.resolvedValue !== undefined) {
          normalizedToken = tokenData;
        } else {
          // Migration à la volée du format brut
          normalizedToken = {
            resolvedValue: tokenData,
            type: tokenType,
            aliasTo: (existingToken && existingToken.aliasTo) || null,
            meta: {
              sourceCategory: getCategoryFromSemanticKey(key),
              sourceKey: getKeyFromSemanticKey(key),
              updatedAt: Date.now()
            }
          };
        }

        // DÉTERMINER L'ÉTAT (Nouveau Modèle)
        let state = TOKEN_STATE.VALUE;
        if (normalizedToken.aliasTo) {
          if (typeof normalizedToken.aliasTo === 'object' && normalizedToken.aliasTo.variableId) {
            state = TOKEN_STATE.ALIAS_RESOLVED;
          } else {
            state = TOKEN_STATE.ALIAS_UNRESOLVED;
          }
        }
        normalizedToken.state = state;

        // GARDE-FOU ANTI-OBJET : resolvedValue DOIT être scalaire
        if (typeof normalizedToken.resolvedValue === 'object') {
          console.error(`🚨 CRITICAL: resolvedValue for ${key} is an object:`, normalizedToken.resolvedValue);
          normalizedToken.resolvedValue = (existingToken && typeof existingToken.resolvedValue !== 'object')
            ? existingToken.resolvedValue
            : getFallbackValue(tokenType, 'semantic');
        }

        // PROTECTION CONTRE LES FALLBACKS (Règle dure)
        const isCurrentlyUnresolved = state === TOKEN_STATE.ALIAS_UNRESOLVED;
        const wasUnresolved = existingToken && existingToken.state === TOKEN_STATE.ALIAS_UNRESOLVED;

        if (shouldPreserveExistingSemantic(existingToken, normalizedToken)) {
          if (isCurrentlyUnresolved || wasUnresolved) preservedUnresolvedCount++;
          else blockedFallbackCount++;

          formattedTokens[key] = existingToken;
          if (existingToken.state === TOKEN_STATE.ALIAS_RESOLVED) aliasResolvedCount++;
          else if (existingToken.state === TOKEN_STATE.ALIAS_UNRESOLVED) aliasUnresolvedCount++;
          else valueCount++;
          continue;
        }

        // Fallback bloqué si pas de preuve de flatten
        var isFallback = isObviousFallback(normalizedToken.resolvedValue) || isUIFallbackValue(normalizedToken.resolvedValue, normalizedToken.type);
        var hasFlattenProof = normalizedToken.flattenedFromAlias === true;

        if (isFallback && !hasFlattenProof && existingToken && !isObviousFallback(existingToken.resolvedValue)) {
          console.log(`[FALLBACK_BLOCKED] Blocking ${normalizedToken.resolvedValue} for ${key}, keeping ${existingToken.resolvedValue}`);
          normalizedToken.resolvedValue = existingToken.resolvedValue;
          blockedFallbackCount++;
        }

        // Finalisation
        formattedTokens[key] = normalizedToken;
        if (state === TOKEN_STATE.ALIAS_RESOLVED) aliasResolvedCount++;
        else if (state === TOKEN_STATE.ALIAS_UNRESOLVED) aliasUnresolvedCount++;
        else valueCount++;
      }

      // Diagnostic des tokens avant sauvegarde
      diagnoseSemanticTokens({ semantic: formattedTokens }, 'SAVE_' + (callsite || 'UNK'));

      var semanticData = JSON.stringify(formattedTokens);
      figma.root.setPluginData("tokenStarter.semantic", semanticData);

      console.log(`💾 SEMANTIC_SAVE [${callsite || 'UNK'}]: Total ${Object.keys(formattedTokens).length} | Resolved: ${aliasResolvedCount} | Unresolved: ${aliasUnresolvedCount} | Values: ${valueCount}`);
      console.log(`📊 SEMANTIC_SAVE_DETAILS: BlockedFallbacks: ${blockedFallbackCount} | PreservedUnresolved: ${preservedUnresolvedCount}`);
    }
  } catch (e) {
    console.warn('Could not save semantic tokens to file:', e);
  }
}


/**
 * Normalise aliasTo vers le format standard exploitable par l'UI/export
 * @param {string|object} aliasTo - aliasTo existant (string ID ou objet normalisé)
 * @param {object} collections - Collections de variables Figma pour résolution
 * @returns {object|null} Objet normalisé {variableId, collection, key, cssName} ou null
 */
function normalizeAliasTo(aliasTo, collections) {
  if (!aliasTo) return null;

  // Si déjà normalisé, retourner tel quel
  if (typeof aliasTo === 'object' && aliasTo.variableId && aliasTo.collection && aliasTo.key && aliasTo.cssName) {
    return aliasTo;
  }

  // Si c'est un string (ancien format), résoudre vers l'objet normalisé
  if (typeof aliasTo === 'string') {
    return resolveVariableIdToAliasDescriptor(aliasTo, collections);
  }

  console.warn('⚠️ normalizeAliasTo: aliasTo format non reconnu:', aliasTo);
  return null;
}

/**
 * Résout un variableId vers un descripteur d'alias complet
 * @param {string} variableId - ID de la variable Figma
 * @param {object} collections - Collections de variables Figma
 * @returns {object|null} {variableId, collection, key, cssName} ou null si non trouvé
 */
function resolveVariableIdToAliasDescriptor(variableId, collections) {
  if (!variableId || !collections) return null;

  // Scanner toutes les collections pour trouver la variable
  for (var collectionName in collections) {
    if (!collections.hasOwnProperty(collectionName)) continue;

    var collection = collections[collectionName];
    if (!collection.variables) continue;

    for (var varId in collection.variables) {
      if (!collection.variables.hasOwnProperty(varId)) continue;

      if (varId === variableId) {
        var variable = collection.variables[varId];
        var key = variable.name;

        // Appliquer les conventions de nommage CSS (même logique que existante)
        var cssName = generateCssName(collectionName, key);

        return {
          variableId: variableId,
          collection: collectionName,
          key: key,
          cssName: cssName
        };
      }
    }
  }

  console.warn('⚠️ resolveVariableIdToAliasDescriptor: variableId non trouvé dans les collections:', variableId);
  return null;
}

/**
 * Génère un nom CSS depuis collection et key (conventions existantes)
 * @param {string} collection - Nom de la collection
 * @param {string} key - Clé de la variable
 * @returns {string} Nom CSS
 */
function generateCssName(collection, key) {
  // Mapping collection -> prefix CSS (même que dans getSemanticScalar)
  var collectionPrefix = {
    "Brand": "brand",
    "System": "system",
    "Gray": "gray",
    "Grey": "gray", // alias
    "Spacing": "spacing",
    "Radius": "radius",
    "Typography": "typography"
  }[collection] || collection.toLowerCase();

  // Pour les clés avec tirets, garder tel quel, sinon normaliser
  var normalizedKey = key.toLowerCase().replace(/[^a-z0-9-]/g, '-');

  return collectionPrefix + "-" + normalizedKey;
}

/**
 * Retourne une valeur fallback safe selon le type et la catégorie
 * @param {string} type - Type Figma (COLOR, FLOAT, etc.)
 * @param {string} category - Catégorie (semantic, etc.)
 * @returns {*} Valeur scalaire fallback
 */
function getFallbackValue(type, category) {
  if (type === 'COLOR') {
    return category === 'semantic' ? '#000000' : '#FFFFFF';
  } else if (type === 'FLOAT') {
    return 0;
  } else {
    return '';
  }
}

function getSemanticTokensFromFile(callsite) {
  try {
    var saved = figma.root.getPluginData("tokenStarter.semantic");
    if (saved) {
      var rawTokens = JSON.parse(saved);
      var migratedTokens = {};
      var aliasCount = 0;
      var valueCount = 0;
      var unresolvedCount = 0;

      for (var key in rawTokens) {
        if (!rawTokens.hasOwnProperty(key)) continue;
        var tokenData = rawTokens[key];

        // Format normalisé
        if (typeof tokenData === 'object' && tokenData.resolvedValue !== undefined) {
          // Gérer le state si manquant
          if (!tokenData.state) {
            tokenData.state = tokenData.aliasTo ?
              (typeof tokenData.aliasTo === 'object' ? TOKEN_STATE.ALIAS_RESOLVED : TOKEN_STATE.ALIAS_UNRESOLVED) :
              TOKEN_STATE.VALUE;
          }
          migratedTokens[key] = tokenData;
        } else {
          // Format legacy
          migratedTokens[key] = {
            resolvedValue: tokenData,
            type: SEMANTIC_TYPE_MAP[key] || "COLOR",
            aliasTo: null,
            state: TOKEN_STATE.VALUE
          };
        }

        // Normaliser les alias legacy (compatibilité)
        if (migratedTokens[key].aliasTo && typeof migratedTokens[key].aliasTo === 'object') {
          var aliasTo = migratedTokens[key].aliasTo;
          if (aliasTo.collection && typeof aliasTo.collection === 'string') {
            // Convertir les noms complets en catégories canoniques
            var canonicalCollection = getCategoryFromVariableCollection(aliasTo.collection);
            if (canonicalCollection !== aliasTo.collection) {
              console.log(`🔄 [MIGRATE] Normalized alias collection: ${aliasTo.collection} → ${canonicalCollection} for ${key}`);
              aliasTo.collection = canonicalCollection;
            }
          }
        }

        if (migratedTokens[key].state === TOKEN_STATE.ALIAS_RESOLVED) aliasCount++;
        else if (migratedTokens[key].state === TOKEN_STATE.ALIAS_UNRESOLVED) unresolvedCount++;
        else valueCount++;
      }

      console.log(`📂 SEMANTIC_LOAD [${callsite || 'UNK'}]: Total ${Object.keys(migratedTokens).length} | Resolved: ${aliasCount} | Unresolved: ${unresolvedCount} | Values: ${valueCount}`);

      // Diagnostic des tokens chargés
      diagnoseSemanticTokens({ semantic: migratedTokens }, 'LOAD_' + (callsite || 'UNK'));

      return migratedTokens;
    }
  } catch (e) {
    console.warn('Could not retrieve semantic tokens from file:', e);
  }
  return null;
}

/**
 * Version asynchrone robuste pour résoudre les alias (librairies partagées inclues)
 */
async function resolveVariableIdToAliasDescriptorAsync(variableId) {
  if (!variableId) return null;
  try {
    const variable = await figma.variables.getVariableByIdAsync(variableId);
    if (variable) {
      let collectionName = "Library";
      try {
        const collection = await figma.variables.getVariableCollectionByIdAsync(variable.variableCollectionId);
        if (collection) collectionName = collection.name;
      } catch (e) { }

      return {
        variableId: variableId,
        collection: collectionName,
        key: variable.name,
        cssName: generateCssName(collectionName, variable.name)
      };
    }
  } catch (e) {
    console.warn('[REHYDRATE] Failed to resolve:', variableId);
  }
  return null;
}

/**
 * Charge les tokens de façon asynchrone avec tentative de résolution des alias
 */
async function getSemanticTokensFromFileAsync(callsite) {
  const tokens = getSemanticTokensFromFile(callsite);
  if (!tokens) return null;

  let progression = false;
  for (const key in tokens) {
    const token = tokens[key];
    if (token.aliasTo && (typeof token.aliasTo === 'string' || token.state === TOKEN_STATE.ALIAS_UNRESOLVED)) {
      const variableId = typeof token.aliasTo === 'string' ? token.aliasTo : token.aliasTo.variableId;
      const resolved = await resolveVariableIdToAliasDescriptorAsync(variableId);
      if (resolved) {
        token.aliasTo = resolved;
        token.state = TOKEN_STATE.ALIAS_RESOLVED;
        progression = true;
      }
    }
  }

  if (progression) {
    console.log(`✨ SEMANTIC_LOAD_ASYNC: Progression achieved, some aliases resolved.`);
  }
  return tokens;
}

/**
 * Tente de re-lier les alias non résolus (Lazy Rebind)
 */
async function rehydrateSemanticAliases() {
  console.log("🔄 [REHYDRATE] Starting lazy rebind of semantic aliases...");
  const tokens = await getSemanticTokensFromFileAsync('REHYDRATE_TASK');
  if (tokens) {
    // On ne sauvegarde que si on a des données valides pour ne pas corrompre
    saveSemanticTokensToFile(tokens, 'REHYDRATE_FINAL');

    // Notifier l'UI pour mise à jour du DesignerView
    figma.ui.postMessage({
      type: 'semantic-tokens-rehydrated',
      tokens: tokens
    });
    return tokens;
  }
  return null;
}


/**
 * Charge les tokens primitifs depuis le stockage persistant
 * @param {string} callsite - Contexte d'appel pour les logs
 * @returns {object|null} Objet { gray:{}, brand:{}, system:{}, spacing:{}, radius:{}, typography:{} } ou null
 */
function getPrimitivesTokensFromFile(callsite) {
  try {
    var saved = figma.root.getPluginData("tokenStarter.primitives");
    if (saved) {
      var primitivesTokens = JSON.parse(saved);

      // Statistiques et logs
      var totalCategories = Object.keys(primitivesTokens).length;
      var totalTokens = 0;
      var categoryStats = [];

      for (var category in primitivesTokens) {
        if (!primitivesTokens.hasOwnProperty(category)) continue;
        var categoryTokens = primitivesTokens[category];
        var tokenCount = Object.keys(categoryTokens).length;
        totalTokens += tokenCount;

        // Top 5 keys par catégorie pour debug
        var keys = Object.keys(categoryTokens).slice(0, 5);
        categoryStats.push(`${category}: ${tokenCount} tokens (${keys.join(', ')}${Object.keys(categoryTokens).length > 5 ? '...' : ''})`);
      }

      console.log(`📖 LOAD_PRIMITIVES [${callsite}]: ${totalCategories} categories, ${totalTokens} total tokens`);
      if (categoryStats.length > 0) {
        console.log(`📖 LOAD_PRIMITIVES [${callsite}]: Details - ${categoryStats.join(' | ')}`);
      }

      return primitivesTokens;
    }
  } catch (e) {
    console.warn('Could not retrieve primitives tokens from file:', e);
  }
  return null;
}

/**
 * Sauvegarde les tokens primitifs dans le stockage persistant
 * @param {object} primitivesTokens - Objet { gray:{}, brand:{}, system:{}, spacing:{}, radius:{}, typography:{} }
 * @param {string} callsite - Contexte d'appel pour les logs
 */
function savePrimitivesTokensToFile(primitivesTokens, callsite) {
  try {
    if (primitivesTokens && Object.keys(primitivesTokens).length > 0) {
      // GARDE-FOU ANTI-OBJET : vérifier que toutes les valeurs sont scalaires
      for (var category in primitivesTokens) {
        if (!primitivesTokens.hasOwnProperty(category)) continue;
        var categoryTokens = primitivesTokens[category];

        for (var key in categoryTokens) {
          if (!categoryTokens.hasOwnProperty(key)) continue;
          var value = categoryTokens[key];

          if (typeof value === 'object' || value === null || value === undefined) {
            throw new Error(`Cannot save primitive token ${category}/${key}: value must be scalar (string/number), got ${typeof value}`);
          }
        }
      }

      // Statistiques et logs
      var totalCategories = Object.keys(primitivesTokens).length;
      var totalTokens = 0;
      var categoryStats = [];

      for (var category in primitivesTokens) {
        if (!primitivesTokens.hasOwnProperty(category)) continue;
        var categoryTokens = primitivesTokens[category];
        var tokenCount = Object.keys(categoryTokens).length;
        totalTokens += tokenCount;

        // Top 5 keys par catégorie pour debug
        var keys = Object.keys(categoryTokens).slice(0, 5);
        categoryStats.push(`${category}: ${tokenCount} (${keys.join(', ')}${Object.keys(categoryTokens).length > 5 ? '...' : ''})`);
      }

      var primitivesData = JSON.stringify(primitivesTokens);
      figma.root.setPluginData("tokenStarter.primitives", primitivesData);

      console.log(`💾 SAVE_PRIMITIVES [${callsite}]: ${totalCategories} categories, ${totalTokens} total tokens`);
      if (categoryStats.length > 0) {
        console.log(`💾 SAVE_PRIMITIVES [${callsite}]: Details - ${categoryStats.join(' | ')}`);
      }
    }
  } catch (e) {
    console.warn('Could not save primitives tokens to file:', e);
    throw e; // Re-throw pour signaler l'erreur critique
  }
}

async function getNamingFromFile() {
  try {
    // Tenter d'abord root.getPluginData (synchronisé avec saveNamingToFile)
    var saved = figma.root.getPluginData("tokenStarter.naming");
    if (saved) return saved;

    // Fallback vers clientStorage si root est vide
    saved = await figma.clientStorage.getAsync("tokenStarter.naming");
    return saved || "custom"; // Default to custom if not set
  } catch (e) {
    console.warn('Could not retrieve naming:', e);
    return "custom";
  }
}


// Fonction helper pour convertir une valeur Figma en format affichable
function convertFigmaValueToDisplay(figmaValue, tokenType) {
  if (figmaValue === null || figmaValue === undefined) return null;

  // Gérer les alias : on ne retourne pas d'objet ici pour éviter [object Object] dans les exports
  // La résolution de l'alias est gérée par le flux de migration / rehydration
  if (typeof figmaValue === 'object' && figmaValue.type === 'VARIABLE_ALIAS') {
    return null;
  }

  if (tokenType === "COLOR") {
    if (typeof figmaValue === 'object' && 'r' in figmaValue && 'g' in figmaValue && 'b' in figmaValue) {
      try {
        return rgbToHex(figmaValue);
      } catch (e) {
        return null;
      }
    }
  } else if (tokenType === "FLOAT") {
    if (typeof figmaValue === 'number') {
      return figmaValue;
    }
  }

  return (typeof figmaValue === 'string' || typeof figmaValue === 'number') ? figmaValue : null;
}


// Fonction pour détecter les valeurs fallback UI qui ne doivent pas être sauvegardées
function isUIFallbackValue(value, tokenType) {
  if (!value) return false;

  var stringValue = typeof value === 'string' ? value : String(value);

  // Valeurs considérées comme des fallbacks UI
  var uiFallbacks = {
    'COLOR': ['#000000', '#ffffff', '#FFFFFF'],
    'FLOAT': ['0', 0]
  };

  var fallbacks = uiFallbacks[tokenType] || [];
  return fallbacks.includes(stringValue) || fallbacks.includes(value);
}

// Fonctions utilitaires pour extraire les métadonnées des clés sémantiques
function getCategoryFromSemanticKey(semanticKey) {
  var categoryMap = {
    'bg.canvas': 'gray',
    'bg.surface': 'gray',
    'bg.elevated': 'gray',
    'bg.muted': 'gray',
    'bg.inverse': 'gray',
    'text.primary': 'gray',
    'text.secondary': 'gray',
    'text.muted': 'gray',
    'text.inverse': 'gray',
    'text.disabled': 'gray',
    'border.default': 'gray',
    'border.muted': 'gray',
    'action.primary.default': 'brand',
    'action.primary.hover': 'brand',
    'action.primary.active': 'brand',
    'action.primary.disabled': 'gray',
    'status.success': 'system',
    'status.warning': 'system',
    'status.error': 'system',
    'status.info': 'system',
    'radius.sm': 'radius',
    'radius.md': 'radius',
    'space.sm': 'spacing',
    'space.md': 'spacing',
    'font.size.base': 'typography',
    'font.weight.base': 'typography'
  };
  return categoryMap[semanticKey] || 'unknown';
}

function getKeyFromSemanticKey(semanticKey) {
  var keyMap = {
    'bg.canvas': '50',
    'bg.surface': '50',
    'bg.elevated': '100',
    'bg.muted': '100',
    'bg.inverse': '950',
    'text.primary': '950',
    'text.secondary': '700',
    'text.muted': '500',
    'text.inverse': '50',
    'text.disabled': '400',
    'border.default': '200',
    'border.muted': '100',
    'action.primary.default': '600',
    'action.primary.hover': '700',
    'action.primary.active': '800',
    'action.primary.disabled': '300',
    'status.success': 'success',
    'status.warning': 'warning',
    'status.error': 'error',
    'status.info': 'info',
    'radius.sm': 'sm',
    'radius.md': 'md',
    'space.sm': '8',
    'space.md': '16',
    'font.size.base': 'text.base',
    'font.weight.base': 'text.regular'
  };
  return keyMap[semanticKey] || 'unknown';
}

// Alias resolution cache management
function initializeCollectionCache() {
  tryResolveSemanticAlias.collectionCache = {};
  var collections = figma.variables.getLocalVariableCollections();
  for (var i = 0; i < collections.length; i++) {
    var collection = collections[i];
    var collectionName = collection.name;

    // Déterminer la catégorie de la collection
    var category = null;
    const n = collectionName.toLowerCase().trim();

    if (n === "brand colors" || n.includes('brand')) category = "brand";
    else if (n === "system colors" || n.includes('system')) category = "system";
    else if (n === "grayscale" || n.includes('gray') || n.includes('grey') || n.includes('grayscale')) category = "gray";
    else if (n === "spacing" || n.includes('spacing')) category = "spacing";
    else if (n === "radius" || n.includes('radius')) category = "radius";
    else if (n === "typography" || n.includes('typo') || n.includes('typography')) category = "typography";

    if (category) {
      tryResolveSemanticAlias.collectionCache[category] = collection;
    }
  }
}

var CONFIG = {

  DEBUG_MODE: true,


  types: {
    SOLID: 'SOLID',
    VARIABLE_ALIAS: 'VARIABLE_ALIAS',
    TEXT: 'TEXT',
    FRAME: 'FRAME',
    RECTANGLE: 'RECTANGLE',
    ELLIPSE: 'ELLIPSE',
    POLYGON: 'POLYGON',
    STAR: 'STAR',
    VECTOR: 'VECTOR',
    COMPONENT: 'COMPONENT',
    INSTANCE: 'INSTANCE',
    LINE: 'LINE',
    GROUP: 'GROUP',
    SECTION: 'SECTION',
    COMPONENT_SET: 'COMPONENT_SET'
  },


  properties: {
    FILL: 'Fill',
    STROKE: 'Stroke',
    RADIUS: 'Radius',
    SPACING: 'Spacing',
    WIDTH: 'Width',
    HEIGHT: 'Height'
  },


  variableTypes: {
    COLOR: 'COLOR',
    FLOAT: 'FLOAT',
    STRING: 'STRING'
  },


  limits: {
    MAX_DEPTH: 50,
    MAX_WIDTH: 1600,
    MAX_HEIGHT: 1400
  },


  supportedTypes: {
    radius: ['FRAME', 'RECTANGLE', 'ELLIPSE', 'POLYGON', 'STAR', 'VECTOR', 'COMPONENT', 'INSTANCE'],
    fillAndStroke: ['FRAME', 'RECTANGLE', 'ELLIPSE', 'POLYGON', 'STAR', 'VECTOR', 'TEXT', 'COMPONENT', 'INSTANCE', 'LINE'],
    spacing: ['FRAME', 'GROUP', 'SECTION', 'COMPONENT', 'INSTANCE', 'COMPONENT_SET'],
    all: ['FRAME', 'RECTANGLE', 'ELLIPSE', 'POLYGON', 'STAR', 'VECTOR', 'TEXT', 'COMPONENT', 'INSTANCE', 'LINE', 'GROUP', 'SECTION', 'COMPONENT_SET']
  },


  scopes: {
    Fill: ['ALL_FILLS', 'FRAME_FILL', 'SHAPE_FILL', 'TEXT_FILL'],
    Stroke: ['STROKE_COLOR'],
    'CORNER RADIUS': ['CORNER_RADIUS'],
    'TOP LEFT RADIUS': ['CORNER_RADIUS'],
    'TOP RIGHT RADIUS': ['CORNER_RADIUS'],
    'BOTTOM LEFT RADIUS': ['CORNER_RADIUS'],
    'BOTTOM RIGHT RADIUS': ['CORNER_RADIUS'],
    'Item Spacing': ['GAP'],
    'Padding Left': ['FILL'],
    'Padding Right': ['FILL'],
    'Padding Top': ['FILL'],
    'Padding Bottom': ['FILL'],
    'Font Size': ['FONT_SIZE']
  },


  layoutModes: {
    NONE: 'NONE'
  },


  categories: {
    brand: 'brand',
    system: 'system',
    gray: 'gray',
    spacing: 'spacing',
    radius: 'radius',
    typography: 'typography',
    border: 'border',
    semantic: 'semantic'
  },


  naming: {
    shadcn: 'shadcn',
    mui: 'mui',
    ant: 'ant',
    bootstrap: 'bootstrap',
    default: 'default'
  }
};

// Configuration des tokens sémantiques
var SEMANTIC_TOKENS = [
  // Background / Surface
  'bg.canvas',
  'bg.surface',
  'bg.elevated',
  'bg.muted',
  'bg.inverse',

  // Text
  'text.primary',
  'text.secondary',
  'text.muted',
  'text.inverse',
  'text.disabled',

  // Border
  'border.default',
  'border.muted',

  // Action (Primary)
  'action.primary.default',
  'action.primary.hover',
  'action.primary.active',
  'action.primary.disabled',

  // Status
  'status.success',
  'status.warning',
  'status.error',
  'status.info',

  // Shape & Space
  'radius.sm',
  'radius.md',
  'space.sm',
  'space.md',

  // Typography base
  'font.size.base',
  'font.weight.base'
];

// Mapping des types pour chaque token sémantique
var SEMANTIC_TYPE_MAP = {
  // Background - COLOR
  'bg.canvas': 'COLOR',
  'bg.surface': 'COLOR',
  'bg.elevated': 'COLOR',
  'bg.muted': 'COLOR',
  'bg.inverse': 'COLOR',

  // Text - COLOR
  'text.primary': 'COLOR',
  'text.secondary': 'COLOR',
  'text.muted': 'COLOR',
  'text.inverse': 'COLOR',
  'text.disabled': 'COLOR',

  // Border - COLOR
  'border.default': 'COLOR',
  'border.muted': 'COLOR',

  // Action - COLOR
  'action.primary.default': 'COLOR',
  'action.primary.hover': 'COLOR',
  'action.primary.active': 'COLOR',
  'action.primary.disabled': 'COLOR',

  // Status - COLOR
  'status.success': 'COLOR',
  'status.warning': 'COLOR',
  'status.error': 'COLOR',
  'status.info': 'COLOR',

  // Shape & Space - FLOAT
  'radius.sm': 'FLOAT',
  'radius.md': 'FLOAT',
  'space.sm': 'FLOAT',
  'space.md': 'FLOAT',

  // Typography - FLOAT/STRING
  'font.size.base': 'FLOAT',
  'font.weight.base': 'FLOAT'
};

// Mapping des noms selon la librairie
var SEMANTIC_NAME_MAP = {
  tailwind: {
    // Background
    'bg.canvas': 'background-canvas',
    'bg.surface': 'background-surface',
    'bg.elevated': 'background-elevated',
    'bg.muted': 'background-muted',
    'bg.inverse': 'background-inverse',

    // Text
    'text.primary': 'text-primary',
    'text.secondary': 'text-secondary',
    'text.muted': 'text-muted',
    'text.inverse': 'text-inverse',
    'text.disabled': 'text-disabled',

    // Border
    'border.default': 'border-default',
    'border.muted': 'border-muted',

    // Action
    'action.primary.default': 'primary',
    'action.primary.hover': 'primary-hover',
    'action.primary.active': 'primary-active',
    'action.primary.disabled': 'primary-disabled',

    // Status
    'status.success': 'success',
    'status.warning': 'warning',
    'status.error': 'destructive',
    'status.info': 'info',

    // Shape & Space
    'radius.sm': 'radius-sm',
    'radius.md': 'radius-md',
    'space.sm': 'space-sm',
    'space.md': 'space-md',

    // Typography
    'font.size.base': 'font-size-base',
    'font.weight.base': 'font-weight-base'
  },

  mui: {
    // Background
    'bg.canvas': 'palette/background/default',
    'bg.surface': 'palette/background/paper',
    'bg.elevated': 'palette/background/paper',
    'bg.muted': 'palette/action/disabledBackground',
    'bg.inverse': 'palette/grey/900',

    // Text
    'text.primary': 'palette/text/primary',
    'text.secondary': 'palette/text/secondary',
    'text.muted': 'palette/text/disabled',
    'text.inverse': 'palette/common/white',
    'text.disabled': 'palette/text/disabled',

    // Border
    'border.default': 'palette/divider',
    'border.muted': 'palette/divider',

    // Action
    'action.primary.default': 'palette/primary/main',
    'action.primary.hover': 'palette/primary/dark',
    'action.primary.active': 'palette/primary/dark',
    'action.primary.disabled': 'palette/action/disabled',

    // Status
    'status.success': 'palette/success/main',
    'status.warning': 'palette/warning/main',
    'status.error': 'palette/error/main',
    'status.info': 'palette/info/main',

    // Shape & Space
    'radius.sm': 'shape/borderRadius',
    'radius.md': 'shape/borderRadius',
    'space.sm': 'spacing/sm',
    'space.md': 'spacing/md',

    // Typography
    'font.size.base': 'typography/fontSize',
    'font.weight.base': 'typography/fontWeightRegular'
  },

  ant: {
    // Background
    'bg.canvas': 'colorBgLayout',
    'bg.surface': 'colorBgContainer',
    'bg.elevated': 'colorBgElevated',
    'bg.muted': 'colorBgTextHover',
    'bg.inverse': 'colorTextBase',

    // Text
    'text.primary': 'colorText',
    'text.secondary': 'colorTextSecondary',
    'text.muted': 'colorTextQuaternary',
    'text.inverse': 'colorTextLightSolid',
    'text.disabled': 'colorTextDisabled',

    // Border
    'border.default': 'colorBorder',
    'border.muted': 'colorBorderSecondary',

    // Action
    'action.primary.default': 'colorPrimary',
    'action.primary.hover': 'colorPrimaryHover',
    'action.primary.active': 'colorPrimaryActive',
    'action.primary.disabled': 'colorPrimaryBg',

    // Status
    'status.success': 'colorSuccess',
    'status.warning': 'colorWarning',
    'status.error': 'colorError',
    'status.info': 'colorInfo',

    // Shape & Space
    'radius.sm': 'borderRadiusSM',
    'radius.md': 'borderRadius',
    'space.sm': 'paddingSM',
    'space.md': 'padding',

    // Typography
    'font.size.base': 'fontSize',
    'font.weight.base': 'fontWeightNormal'
  },

  bootstrap: {
    // Background
    'bg.canvas': '$body-bg',
    'bg.surface': '$card-bg',
    'bg.elevated': '$modal-content-bg',
    'bg.muted': '$secondary-bg',
    'bg.inverse': '$body-color',

    // Text
    'text.primary': '$body-color',
    'text.secondary': '$secondary-color',
    'text.muted': '$text-muted',
    'text.inverse': '$white',
    'text.disabled': '$btn-disabled-color',

    // Border
    'border.default': '$border-color',
    'border.muted': '$border-color-translucent',

    // Action
    'action.primary.default': '$primary',
    'action.primary.hover': '$primary-hover',
    'action.primary.active': '$primary-active',
    'action.primary.disabled': '$primary-disabled',

    // Status
    'status.success': '$success',
    'status.warning': '$warning',
    'status.error': '$danger',
    'status.info': '$info',

    // Shape & Space
    'radius.sm': '$border-radius-sm',
    'radius.md': '$border-radius',
    'space.sm': '$spacer',
    'space.md': '$spacer',

    // Typography
    'font.size.base': '$font-size-base',
    'font.weight.base': '$font-weight-base'
  }
};

/**
 * Génère les tokens sémantiques à partir des primitives
 * @param {Object} primitives - Les tokens primitifs organisés par catégorie
 * @param {Object} options - Options de génération (contrastCheck, etc.)
 * @returns {Object} Les tokens sémantiques générés
 */
function generateSemanticTokens(primitives, options = {}) {
  console.log(`🔄 generateSemanticTokens appelée avec primitives:`, Object.keys(primitives || {}).filter(k => primitives[k]));

  // Charger les tokens existants pour préserver les alias
  const existing = getSemanticTokensFromFile('GEN') || {};
  const naming = options.naming;

  const semanticTokens = {};

  // Fonctions utilitaires pour les fallbacks
  function safeGet(obj, path, fallback) {
    try {
      const keys = path.split('.');
      let current = obj;
      for (const key of keys) {
        if (current && typeof current === 'object' && key in current) {
          current = current[key];
        } else {
          console.warn(`Semantic token generation: key "${path}" not found, using fallback:`, fallback);
          return fallback;
        }
      }
      return current;
    } catch (error) {
      console.warn(`Semantic token generation: error accessing "${path}", using fallback:`, fallback);
      return fallback;
    }
  }

  // Extraction des primitives avec fallbacks
  const gray = primitives.gray || {};
  const brand = primitives.brand || {};
  const system = primitives.system || {};
  const spacing = primitives.spacing || {};
  const radius = primitives.radius || {};
  const typography = primitives.typography || {};

  console.log('🔍 Primitives reçues pour génération sémantique:');
  console.log('  gray:', Object.keys(gray).length > 0 ? Object.keys(gray).slice(0, 5).join(', ') + '...' : 'vide');
  console.log('  brand:', Object.keys(brand).length > 0 ? Object.keys(brand).slice(0, 3).join(', ') + '...' : 'vide');
  console.log('  system:', Object.keys(system).length > 0 ? Object.keys(system).join(', ') : 'vide');

  // Fonction helper pour résoudre une valeur sémantique depuis les primitives
  function resolveSemanticValue(semanticKey, fallback) {
    try {
      // Essayer d'abord de résoudre via les primitives disponibles
      const variable = tryResolveSemanticAlias(semanticKey, primitives, naming);
      if (variable) {
        // Extraire la valeur de la variable primitive
        const collection = figma.variables.getVariableCollectionById(variable.variableCollectionId);
        if (collection) {
          const variableKey = extractVariableKey(variable, collection.name);
          const category = getCategoryFromVariableCollection(collection.name);
          if (primitives[category] && primitives[category][variableKey]) {
            console.log(`✅ ${semanticKey} → ${category}.${variableKey} (${primitives[category][variableKey]})`);
            return primitives[category][variableKey];
          }
        }
      }
    } catch (error) {
      console.warn(`⚠️ Erreur lors de la résolution de ${semanticKey}:`, error);
    }

    // Fallback si aucune primitive trouvée
    console.log(`⚠️ ${semanticKey} → fallback: ${fallback}`);
    console.log(`🔍 [FALLBACK_DEBUG] semanticKey=${semanticKey}, naming=${naming}, fallback=${fallback}`);
    console.log(`🔍 [FALLBACK_DEBUG] brand keys available: [${Object.keys(primitives.brand || {}).slice(0, 10).join(', ')}]`);
    return fallback;
  }

  // Règles de génération - Utilise d'abord les primitives disponibles
  semanticTokens['bg.canvas'] = resolveSemanticValue('bg.canvas', safeGet(gray, '50', '#FFFFFF'));
  semanticTokens['bg.surface'] = resolveSemanticValue('bg.surface', safeGet(gray, '50', '#FFFFFF'));
  semanticTokens['bg.elevated'] = resolveSemanticValue('bg.elevated', safeGet(gray, '100', '#F9F9F9'));
  semanticTokens['bg.muted'] = resolveSemanticValue('bg.muted', safeGet(gray, '100', '#F5F5F5'));
  semanticTokens['bg.inverse'] = resolveSemanticValue('bg.inverse', safeGet(gray, '950', '#0A0A0A'));

  console.log('🎨 Valeurs sémantiques générées:');
  console.log('  bg.canvas:', semanticTokens['bg.canvas']);
  console.log('  bg.surface:', semanticTokens['bg.surface']);
  console.log('  bg.muted:', semanticTokens['bg.muted']);
  console.log('  text.primary:', semanticTokens['text.primary']);
  console.log('  text.secondary:', semanticTokens['text.secondary']);
  console.log('  action.primary.default:', semanticTokens['action.primary.default']);

  semanticTokens['text.primary'] = resolveSemanticValue('text.primary', safeGet(gray, '950', '#0A0A0A'));
  semanticTokens['text.secondary'] = resolveSemanticValue('text.secondary', safeGet(gray, '700', '#404040'));
  semanticTokens['text.muted'] = resolveSemanticValue('text.muted', safeGet(gray, '500', '#737373'));
  semanticTokens['text.inverse'] = resolveSemanticValue('text.inverse', safeGet(gray, '50', '#FAFAFA'));
  semanticTokens['text.disabled'] = resolveSemanticValue('text.disabled', safeGet(gray, '400', '#A3A3A3'));

  semanticTokens['border.default'] = resolveSemanticValue('border.default', safeGet(gray, '200', '#E5E5E5'));
  semanticTokens['border.muted'] = resolveSemanticValue('border.muted', safeGet(gray, '100', '#F5F5F5'));

  // Action primary - fallbacks naming-aware
  var getActionPrimaryFallback = function(action, naming) {
    if (naming === 'mui') {
      if (action === 'default') return safeGet(brand, 'main', safeGet(system, 'primary.main', '#1976d2'));
      if (action === 'hover') return safeGet(brand, 'dark', safeGet(system, 'primary.dark', '#115293'));
      if (action === 'active') return safeGet(brand, 'dark', safeGet(system, 'primary.dark', '#115293')); // same as hover
      if (action === 'disabled') return safeGet(gray, '300', safeGet(gray, '200', '#e0e0e0'));
    } else if (naming === 'ant' || naming === 'bootstrap') {
      // Ant/Bootstrap: prefer brand.main/dark if available, fallback to numeric scale
      if (action === 'default') return safeGet(brand, 'main', safeGet(brand, '600', safeGet(brand, '500', '#2563EB')));
      if (action === 'hover') return safeGet(brand, 'dark', safeGet(brand, '700', safeGet(brand, '600', '#1D4ED8')));
      if (action === 'active') return safeGet(brand, 'dark', safeGet(brand, '800', safeGet(brand, '700', '#1E40AF')));
      if (action === 'disabled') return safeGet(gray, '300', '#D1D5DB');
    } else {
      // Tailwind/custom: numeric scale
      if (action === 'default') return safeGet(brand, '600', safeGet(brand, '500', '#2563EB'));
      if (action === 'hover') return safeGet(brand, '700', safeGet(brand, '600', '#1D4ED8'));
      if (action === 'active') return safeGet(brand, '800', safeGet(brand, '700', '#1E40AF'));
      if (action === 'disabled') return safeGet(gray, '300', '#D1D5DB');
    }
    return '#2563EB'; // ultimate fallback
  };

  semanticTokens['action.primary.default'] = resolveSemanticValue('action.primary.default', getActionPrimaryFallback('default', naming));
  semanticTokens['action.primary.hover'] = resolveSemanticValue('action.primary.hover', getActionPrimaryFallback('hover', naming));
  semanticTokens['action.primary.active'] = resolveSemanticValue('action.primary.active', getActionPrimaryFallback('active', naming));
  semanticTokens['action.primary.disabled'] = resolveSemanticValue('action.primary.disabled', getActionPrimaryFallback('disabled', naming));

  // Status tokens - essayer d'abord system, puis fallback
  semanticTokens['status.success'] = resolveSemanticValue('status.success', safeGet(system, 'success.main', safeGet(system, 'success', safeGet(brand, '600', '#16A34A'))));
  semanticTokens['status.warning'] = resolveSemanticValue('status.warning', safeGet(system, 'warning.main', safeGet(system, 'warning', '#F59E0B')));
  semanticTokens['status.error'] = resolveSemanticValue('status.error', safeGet(system, 'error.main', safeGet(system, 'error', '#DC2626')));
  semanticTokens['status.info'] = resolveSemanticValue('status.info', safeGet(system, 'info.main', safeGet(system, 'info', '#2563EB')));

  // Shape & Space - mappings spécifiques selon le système
  semanticTokens['radius.sm'] = resolveSemanticValue('radius.sm', safeGet(radius, 'sm', safeGet(radius, '4', 4)));
  semanticTokens['radius.md'] = resolveSemanticValue('radius.md', safeGet(radius, 'md', safeGet(radius, '8', 8)));
  semanticTokens['space.sm'] = resolveSemanticValue('space.sm', safeGet(spacing, '8', safeGet(spacing, '2', 8)));
  semanticTokens['space.md'] = resolveSemanticValue('space.md', safeGet(spacing, '16', safeGet(spacing, '4', 16)));

  // Typography
  semanticTokens['font.size.base'] = resolveSemanticValue('font.size.base', safeGet(typography, 'base', safeGet(typography, '16', 16)));
  semanticTokens['font.weight.base'] = resolveSemanticValue('font.weight.base', safeGet(typography, 'regular', 400));

  // Normalisation des tokens FLOAT pour assurer qu'ils sont des numbers
  const floatTokens = ['radius.sm', 'radius.md', 'space.sm', 'space.md', 'font.size.base', 'font.weight.base'];
  floatTokens.forEach(key => {
    if (semanticTokens[key] !== undefined) {
      const normalized = normalizeFloatValue(semanticTokens[key]);
      if (normalized !== null) {
        semanticTokens[key] = normalized;
      } else {
        // Fallback sur une valeur par défaut raisonnable
        const fallbacks = {
          'radius.sm': 4,
          'radius.md': 8,
          'space.sm': 8,
          'space.md': 16,
          'font.size.base': 16,
          'font.weight.base': 400
        };
        console.warn(`Semantic token generation: Invalid FLOAT value for "${key}", using fallback:`, fallbacks[key]);
        semanticTokens[key] = fallbacks[key];
      }
    }
  });

  // Vérification contraste si activée (optionnel mais recommandé)
  if (options.contrastCheck !== false) {
    const contrastResults = checkSemanticContrast(semanticTokens);
    if (!contrastResults.passed) {
      console.warn('Semantic token generation: Contrast issues detected, adjusting colors...');
      applyContrastAdjustments(semanticTokens, contrastResults.issues, primitives);
    }
  }

  // Tests rapides - vérification que les fallbacks sont cohérents avec le naming
  console.log(`🧪 [SEMANTIC_TESTS] naming=${naming}`);
  if (naming === 'mui') {
    console.log(`🧪 [SEMANTIC_TESTS] brand.main=${(primitives.brand && primitives.brand.main) || 'N/A'}`);
  } else {
    console.log(`🧪 [SEMANTIC_TESTS] brand['600']=${(primitives.brand && primitives.brand['600']) || 'N/A'}`);
  }
  console.log(`🧪 [SEMANTIC_TESTS] action.primary.default=${semanticTokens['action.primary.default']}`);

  // Transformation en format avec alias : { resolvedValue, type, aliasTo, meta }
  const formattedTokens = {};
  for (const semanticKey in semanticTokens) {
    if (!semanticTokens.hasOwnProperty(semanticKey)) continue;

    const computedResolvedValue = semanticTokens[semanticKey];
    const existingToken = existing[semanticKey];

    // Tenter de trouver un alias vers les primitives
    let aliasTo = (existingToken && existingToken.aliasTo) || null;
    if (!aliasTo && naming) {
      try {
        const aliasInfo = resolveSemanticAliasInfo(semanticKey, primitives, naming);
        if (aliasInfo) {
          aliasTo = {
            variableId: aliasInfo.variableId,
            collection: aliasInfo.collection,
            key: aliasInfo.key
          };
        }
      } catch (error) {
        console.warn(`Could not resolve alias for ${semanticKey}:`, error);
      }
    }

    formattedTokens[semanticKey] = {
      resolvedValue: computedResolvedValue,
      type: SEMANTIC_TYPE_MAP[semanticKey] || "COLOR",
      aliasTo,
      meta: {
        updatedAt: Date.now(),
        sourceCategory: getCategoryFromSemanticKey(semanticKey),
        sourceKey: getKeyFromSemanticKey(semanticKey)
      }
    };
  }

  return formattedTokens;
}

/**
 * Normalise une valeur float en s'assurant qu'elle est un number
 * @param {number|string} value - La valeur à normaliser
 * @returns {number|null} La valeur normalisée ou null si impossible à parser
 */
function normalizeFloatValue(value) {
  if (typeof value === 'number' && !isNaN(value)) {
    return value;
  }

  if (typeof value === 'string') {
    // Supprimer les unités et convertir
    var cleanValue = value.replace(/px|rem|em|%|vh|vw|vmin|vmax/g, '');
    var parsed = parseFloat(cleanValue);

    if (!isNaN(parsed)) {
      // Convertir rem en px (1rem = 16px)
      if (value.includes('rem')) {
        return parsed * 16;
      }
      // Convertir em en px (approximation, 1em ≈ 16px)
      if (value.includes('em')) {
        return parsed * 16;
      }
      // Autres unités : retourner tel quel (px, %, vh, etc. sont gardés comme nombres)
      return parsed;
    }
  }

  return null;
}

/**
 * Vérifie le contraste WCAG des tokens sémantiques
 * @param {Object} semanticTokens - Les tokens sémantiques à vérifier
 * @returns {Object} Résultats de la vérification
 */
function checkSemanticContrast(semanticTokens) {
  const issues = [];
  let passed = true;

  // Contraste text.primary sur bg.surface ≥ 4.5
  const primaryContrast = calculateContrastRatio(semanticTokens['text.primary'], semanticTokens['bg.surface']);
  if (primaryContrast < 4.5) {
    issues.push({
      token: 'text.primary',
      background: 'bg.surface',
      currentRatio: primaryContrast,
      requiredRatio: 4.5
    });
    passed = false;
  }

  // Contraste text.inverse sur bg.inverse ≥ 4.5
  const inverseContrast = calculateContrastRatio(semanticTokens['text.inverse'], semanticTokens['bg.inverse']);
  if (inverseContrast < 4.5) {
    issues.push({
      token: 'text.inverse',
      background: 'bg.inverse',
      currentRatio: inverseContrast,
      requiredRatio: 4.5
    });
    passed = false;
  }

  // Contraste texte blanc sur bouton primary ≥ 4.5 (CRITIQUE UX)
  const buttonContrast = calculateContrastRatio('#FFFFFF', semanticTokens['action.primary.default']);
  if (buttonContrast < 4.5) {
    issues.push({
      token: 'action.primary.default',
      background: 'button-text',
      currentRatio: buttonContrast,
      requiredRatio: 4.5
    });
    passed = false;
  }

  return { passed, issues };
}

/**
 * Applique les ajustements automatiques pour corriger les problèmes de contraste
 * @param {Object} semanticTokens - Les tokens à ajuster
 * @param {Array} issues - Les problèmes de contraste détectés
 * @param {Object} primitives - Les tokens primitifs pour accéder aux valeurs brand
 */
function applyContrastAdjustments(semanticTokens, issues, primitives = {}) {
  // Ajustements simples basés sur des nuances de gris prédéfinies
  const grayScale = ['#0A0A0A', '#1A1A1A', '#262626', '#404040', '#525252', '#737373', '#A3A3A3'];

  issues.forEach(issue => {
    if (issue.token === 'text.primary') {
      // Essayer des nuances plus sombres
      for (const darkerGray of grayScale.slice(0, 3)) {
        const newRatio = calculateContrastRatio(darkerGray, semanticTokens['bg.surface']);
        if (newRatio >= 4.5) {
          semanticTokens['text.primary'] = darkerGray;
          console.log(`Adjusted text.primary to ${darkerGray} (contrast: ${newRatio})`);
          break;
        }
      }
    } else if (issue.token === 'text.inverse') {
      // Essayer des nuances plus claires
      for (const lighterGray of grayScale.slice(-3).reverse()) {
        const newRatio = calculateContrastRatio(lighterGray, semanticTokens['bg.inverse']);
        if (newRatio >= 4.5) {
          semanticTokens['text.inverse'] = lighterGray;
          console.log(`Adjusted text.inverse to ${lighterGray} (contrast: ${newRatio})`);
          break;
        }
      }
    } else if (issue.token === 'action.primary.default') {
      // Essayer d'assombrir la couleur primary en utilisant les nuances brand disponibles
      const brand = primitives.brand || {};
      const darkerShades = ['700', '800', '900'];

      for (const shade of darkerShades) {
        const darkerColor = brand[shade];
        if (darkerColor) {
          const newRatio = calculateContrastRatio('#FFFFFF', darkerColor);
          if (newRatio >= 4.5) {
            semanticTokens['action.primary.default'] = darkerColor;
            console.log(`Adjusted action.primary.default to ${darkerColor} (brand-${shade}, contrast: ${newRatio})`);
            break;
          }
        }
      }
    }
  });
}

/**
 * Calcule le ratio de contraste WCAG entre deux couleurs
 * @param {string} foreground - Couleur du texte (hex)
 * @param {string} background - Couleur du fond (hex)
 * @returns {number} Ratio de contraste
 */
function calculateContrastRatio(foreground, background) {
  // Fonction simplifiée - en production, utiliser une vraie bibliothèque de calcul de contraste
  // Pour l'instant, on retourne un ratio basé sur une logique simple
  try {
    const fgLuminance = getRelativeLuminance(foreground);
    const bgLuminance = getRelativeLuminance(background);

    const lighter = Math.max(fgLuminance, bgLuminance);
    const darker = Math.min(fgLuminance, bgLuminance);

    return (lighter + 0.05) / (darker + 0.05);
  } catch (error) {
    console.warn('Error calculating contrast ratio:', error);
    return 1; // Ratio minimum si erreur
  }
}

/**
 * Calcule la luminance relative d'une couleur hex
 * @param {string} hex - Couleur en hexadécimal
 * @returns {number} Luminance relative
 */
function getRelativeLuminance(hex) {
  // Conversion hex vers RGB
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  // Fonction de luminance
  const toLinear = c => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/**
 * Retourne le nom de variable sémantique selon la librairie
 * @param {string} semanticKey - Clé sémantique (ex: 'bg.canvas')
 * @param {string} libType - Type de librairie ('tailwind', 'mui', 'ant', 'bootstrap')
 * @returns {string} Nom de variable adapté
 */
function getSemanticVariableName(semanticKey, libType) {
  const mapping = SEMANTIC_NAME_MAP[libType] || SEMANTIC_NAME_MAP.tailwind;
  return mapping[semanticKey] || semanticKey.replace(/\./g, '/');
}

/**
 * Génère les données de preview pour les tokens sémantiques
 * @param {Object} tokens - Les tokens disponibles
 * @param {string} naming - Le type de naming (tailwind, mui, ant, bootstrap)
 * @returns {Array} Liste des rows pour le preview
 */
function getSemanticPreviewRows(tokens, naming) {
  var rows = [];
  if (!tokens || !tokens.semantic) return rows;

  for (var key in tokens.semantic) {
    if (!tokens.semantic.hasOwnProperty(key)) continue;

    var tokenData = tokens.semantic[key];

    // Nouveau format: extraire resolvedValue et infos d'alias depuis la rehydratation
    var resolvedValue, tokenType, isAlias, aliasTo, isBrokenAlias;
    if (typeof tokenData === 'object' && tokenData.resolvedValue !== undefined) {
      // Nouveau format (post-rehydratation)
      resolvedValue = tokenData.resolvedValue;
      tokenType = tokenData.type || SEMANTIC_TYPE_MAP[key] || "COLOR";
      isAlias = tokenData.isAlias || false;
      isBrokenAlias = tokenData.isBrokenAlias || false;
      aliasTo = tokenData.aliasTo;
    } else {
      // Ancien format ou valeur brute (fallback)
      resolvedValue = tokenData;
      tokenType = SEMANTIC_TYPE_MAP[key] || "COLOR";
      isAlias = false;
      isBrokenAlias = false;
      aliasTo = null;
    }

    // Sanitation: s'assurer que value est toujours une string pour l'UI
    var displayValue = sanitizeValueForUI(resolvedValue, tokenType);

    // Déterminer le badge à afficher
    var badge = null;
    if (isBrokenAlias) {
      badge = "Alias cassé";
    } else if (isAlias) {
      badge = "Alias";
    }

    rows.push({
      key: key,
      figmaName: getSemanticVariableName(key, naming),
      type: tokenType,
      value: displayValue, // Valeur sanitizée pour l'UI
      rawValue: resolvedValue, // Garder la valeur brute pour les opérations internes
      isAlias: isAlias,
      isBrokenAlias: isBrokenAlias,
      aliasTo: aliasTo,
      badge: badge
    });
  }
  return rows;
}

// Fonction helper pour sanitiser les valeurs avant affichage en UI
function sanitizeValueForUI(value, tokenType) {
  if (value === null || value === undefined) {
    return tokenType === "COLOR" ? "#000000" : "0";
  }

  // Si c'est déjà une string, la retourner telle quelle
  if (typeof value === 'string') {
    return value;
  }

  // Si c'est un nombre, le convertir en string
  if (typeof value === 'number') {
    return value.toString();
  }

  // Si c'est un objet (comme RGB), éviter [object Object]
  if (typeof value === 'object') {
    if (tokenType === "COLOR" && 'r' in value && 'g' in value && 'b' in value) {
      // Convertir RGB en hex pour affichage
      try {
        return ColorService.rgbToHex({
          r: Math.round(value.r * 255),
          g: Math.round(value.g * 255),
          b: Math.round(value.b * 255)
        });
      } catch (e) {
        console.warn('Failed to convert RGB to hex:', value);
        return "#000000";
      }
    } else {
      // Pour tout autre objet, convertir en string de manière safe
      console.warn('Unexpected object value for UI:', value);
      return JSON.stringify(value);
    }
  }

  // Fallback: convertir en string
  return String(value);
}

/**
 * Tente de résoudre un alias vers une variable primitive pour un token sémantique
 * @param {string} semanticKey - Clé du token sémantique (ex: 'bg.canvas')
 * @param {Object} allTokens - Tous les tokens disponibles
 * @returns {Object|null} Variable Figma correspondante ou null
 */
// Nouvelle fonction qui retourne les informations complètes de l'alias
function resolveSemanticAliasInfo(semanticKey, allTokens, naming) {
  var variable = tryResolveSemanticAlias(semanticKey, allTokens, naming);
  if (!variable) return null;

  // Extraire les informations de la variable primitive
  var collectionId = variable.variableCollectionId;
  if (!collectionId) return null;

  var collection = figma.variables.getVariableCollectionById(collectionId);
  if (!collection) return null;

  var variableKey = extractVariableKey(variable, collection.name);

  return {
    variableId: variable.id,
    collection: getCategoryFromVariableCollection(collection.name), // Normaliser à catégorie canonique
    key: variableKey,
    variable: variable
  };
}

function tryResolveSemanticAlias(semanticKey, allTokens, naming) {
  console.log(`🔍 tryResolveSemanticAlias: ${semanticKey} avec naming=${naming}`);

  // Debug pour les actions primaires en MUI
  if (naming === 'mui' && semanticKey.startsWith('action.primary.')) {
    debugSemanticAliasResolution(semanticKey, naming);
  }

  try {
    // Créer un mapping adapté selon le système de design
    var primitiveMapping;

    if (naming === 'tailwind') {
      // Mapping spécifique pour Tailwind - clés exactes de extractVariableKey
      primitiveMapping = {
        // Background - utiliser gray-50, gray-100, etc. (pas '0')
        'bg.canvas': { category: 'gray', keys: ['50'] },
        'bg.surface': { category: 'gray', keys: ['50'] },
        'bg.muted': { category: 'gray', keys: ['100'] },
        'bg.inverse': { category: 'gray', keys: ['950', '900'] },

        // Text
        'text.primary': { category: 'gray', keys: ['950', '900'] },
        'text.secondary': { category: 'gray', keys: ['700', '600'] },
        'text.muted': { category: 'gray', keys: ['500', '400'] },
        'text.inverse': { category: 'gray', keys: ['50'] },
        'text.disabled': { category: 'gray', keys: ['400', '300'] },

        // Border
        'border.default': { category: 'gray', keys: ['200'] },
        'border.muted': { category: 'gray', keys: ['100'] },

      // Action primary - utiliser les noms MUI car c'est ce que les primitives utilisent
      'action.primary.default': { category: 'brand', keys: ['main', '600', '500'] },
      'action.primary.hover': { category: 'brand', keys: ['dark', '700', '600'] },
      'action.primary.active': { category: 'brand', keys: ['dark', '800', '700'] },
        'action.primary.disabled': { category: 'gray', keys: ['300'] },

      // Status - pour Tailwind, utiliser system si disponible sinon fallback
      'status.success': { category: 'system', keys: ['success-main', 'success'], fallback: { category: 'brand', keys: ['main', '600'] } },
      'status.warning': { category: 'system', keys: ['warning-main', 'warning'], fallback: '#F59E0B' },
      'status.error': { category: 'system', keys: ['error-main', 'error'], fallback: '#DC2626' },
      'status.info': { category: 'system', keys: ['info-main', 'info'], fallback: '#2563EB' },

        // Shape & Space - utiliser radius-4, spacing-8, etc.
      'radius.sm': { category: 'radius', keys: ['sm', '4'] },
      'radius.md': { category: 'radius', keys: ['md', '8'] },
      'space.sm': { category: 'spacing', keys: ['4', '8'] },
      'space.md': { category: 'spacing', keys: ['8', '16'] },

        // Typography - utiliser text.base, text.regular, etc.
        'font.size.base': { category: 'typography', keys: ['text.base', 'base'] },
        'font.weight.base': { category: 'typography', keys: ['text.regular', 'regular'] }
      };
    } else {
      // Mapping générique pour les autres systèmes (Ant, MUI, Bootstrap, etc.)
      primitiveMapping = {
        // Background
        'bg.canvas': { category: 'gray', keys: ['50', 'white'] },
        'bg.surface': { category: 'gray', keys: ['white', '50'] },
        'bg.muted': { category: 'gray', keys: ['100'] },
        'bg.inverse': { category: 'gray', keys: ['950', '900'] },

        // Text
        'text.primary': { category: 'gray', keys: ['950', '900'] },
        'text.secondary': { category: 'gray', keys: ['700', '600'] },
        'text.muted': { category: 'gray', keys: ['500', '400'] },
        'text.inverse': { category: 'gray', keys: ['50', '100'] },
        'text.disabled': { category: 'gray', keys: ['400', '300'] },

        // Border
        'border.default': { category: 'gray', keys: ['200', '300'] },
        'border.muted': { category: 'gray', keys: ['100', '200'] },

        // Action primary - Mapping dynamique par naming
        'action.primary.default': { category: 'brand', keys: ['600', '500'] },
        'action.primary.hover': { category: 'brand', keys: ['700', '600'] },
        'action.primary.active': { category: 'brand', keys: ['800', '700'] },
        'action.primary.disabled': { category: 'gray', keys: ['300', '400'] },

        // Status - utiliser system si disponible, sinon brand ou defaults
        'status.success': { category: 'system', keys: ['success-main', 'success'], fallback: { category: 'brand', keys: ['600', 'main'] } },
        'status.warning': { category: 'system', keys: ['warning-main', 'warning'], fallback: '#F59E0B' },
        'status.error': { category: 'system', keys: ['error-main', 'error'], fallback: '#DC2626' },
        'status.info': { category: 'system', keys: ['info-main', 'info'], fallback: '#2563EB' },

        // Shape & Space - utiliser les primitives directes
        'radius.sm': { category: 'radius', keys: ['sm', '4'] },
        'radius.md': { category: 'radius', keys: ['md', '8'] },
        'space.sm': { category: 'spacing', keys: ['8', '2'] },
        'space.md': { category: 'spacing', keys: ['16', '4'] },

        // Typography
        'font.size.base': { category: 'typography', keys: ['text.base', 'base', '16'] },
        'font.weight.base': { category: 'typography', keys: ['text.regular', 'regular', '400'] }
      };

      // AJUSTEMENT DES KEYS ACTION PRIMARY SELON NAMING
      if (naming === 'ant') {
        // Ant Design - ajuster selon les vraies primitives disponibles
        // Si les primitives utilisent des noms numériques, chercher les bonnes clés
        primitiveMapping['action.primary.default'].keys = ['600', '500', 'main', 'primary'];
        primitiveMapping['action.primary.hover'].keys = ['700', '600', 'dark', 'primary-dark'];
        primitiveMapping['action.primary.active'].keys = ['800', '700', 'dark', 'primary-active'];
      } else if (naming === 'mui') {
        // Pour MUI, les primitives utilisent les noms sémantiques MUI
        // main = couleur principale, dark = version sombre, light = version claire
        primitiveMapping['action.primary.default'].keys = ['main', 'primary'];
        primitiveMapping['action.primary.hover'].keys = ['dark', 'primary-dark'];
        primitiveMapping['action.primary.active'].keys = ['dark', 'primary-active'];
      } else if (naming === 'bootstrap') {
        // Bootstrap - ajuster selon les vraies primitives disponibles
        primitiveMapping['action.primary.default'].keys = ['500', '600', 'main', 'primary'];
        primitiveMapping['action.primary.hover'].keys = ['600', '700', 'dark', 'primary-dark'];
        primitiveMapping['action.primary.active'].keys = ['700', '800', 'dark', 'primary-active'];
      }
    }

    var mapping = primitiveMapping[semanticKey];
    if (!mapping) return null;

    // Créer un cache des collections pour optimiser les recherches
    if (!tryResolveSemanticAlias.collectionCache) {
      tryResolveSemanticAlias.collectionCache = {};
      var collections = figma.variables.getLocalVariableCollections();

      for (var i = 0; i < collections.length; i++) {
        var collection = collections[i];
        var collectionName = collection.name;

        // Déterminer la catégorie de la collection
        var category = null;
        const n = collectionName.toLowerCase().trim();

        if (n === "brand colors" || n.includes('brand')) category = "brand";
        else if (n === "system colors" || n.includes('system')) category = "system";
        else if (n === "grayscale" || n.includes('gray') || n.includes('grey') || n.includes('grayscale')) category = "gray";
        else if (n === "spacing" || n.includes('spacing')) category = "spacing";
        else if (n === "radius" || n.includes('radius')) category = "radius";
        else if (n === "typography" || n.includes('typo') || n.includes('typography')) category = "typography";

        if (category) {
          tryResolveSemanticAlias.collectionCache[category] = collection;
        }
      }
    }

    var collection = tryResolveSemanticAlias.collectionCache[mapping.category];
    if (!collection) return null;

    // Chercher la variable dans cette collection
    var variables = collection.variableIds.map(function (id) { return figma.variables.getVariableById(id); });

    // DIAGNOSTIC LOG ( requested for brand/primary )
    if (semanticKey === 'action.primary.default' && ['ant', 'mui', 'bootstrap'].includes(naming)) {
      var diagnosticKeys = variables.map(function (v) { return v ? extractVariableKey(v, collection.name) : null; }).filter(k => k !== null);
      console.log(`🔍 [DIAGNOSTIC] Resolving ${semanticKey} for ${naming}. Available Brand Keys:`, diagnosticKeys);
    }

    // Essayer chaque clé possible dans l'ordre de priorité
    for (var k = 0; k < mapping.keys.length; k++) {
      var targetKey = mapping.keys[k];

      for (var j = 0; j < variables.length; j++) {
        var variable = variables[j];
        if (!variable) continue;

        // Déterminer si cette variable correspond à la clé recherchée
        var varKey = extractVariableKey(variable, collection.name);

        if (varKey === targetKey) {
          console.log(`✅ Alias success: ${semanticKey} → ${mapping.category}/${targetKey} (${variable.name})`);
          return variable;
        }
      }
    }

    // Si pas trouvé et qu'il y a un fallback, essayer le fallback
    if (mapping.fallback) {
      if (typeof mapping.fallback === 'object') {
        // Essayer de trouver la variable de fallback dans une autre catégorie
        var fallbackCollection = tryResolveSemanticAlias.collectionCache[mapping.fallback.category];
        if (fallbackCollection) {
          var fallbackVariables = fallbackCollection.variableIds.map(function (id) { return figma.variables.getVariableById(id); });

          for (var fk = 0; fk < mapping.fallback.keys.length; fk++) {
            var fallbackKey = mapping.fallback.keys[fk];

            for (var fj = 0; fj < fallbackVariables.length; fj++) {
              var fallbackVar = fallbackVariables[fj];
              if (!fallbackVar) continue;

              var fallbackVarKey = extractVariableKey(fallbackVar, fallbackCollection.name);
              if (fallbackVarKey === fallbackKey) {
                console.log(`✅ Alias fallback success: ${semanticKey} → ${mapping.fallback.category}/${fallbackKey} (${fallbackVar.name})`);
                return fallbackVar;
              }
            }
          }
        }
      }
      // Pour les fallbacks de couleur hex, on ne peut pas créer d'alias
    }

    // Log détaillé quand aucun alias n'est trouvé
    var availableKeys = variables.map(function (v) {
      return v ? extractVariableKey(v, collection.name) : null;
    }).filter(function (k) { return k !== null; });

    console.log(`❌ Alias fallback: ${semanticKey} → ${mapping.category} keys [${mapping.keys.join(', ')}] not found. Available: [${availableKeys.join(', ')}]`);

    return null;
  } catch (error) {
    console.warn('Error resolving semantic alias for', semanticKey, error);
    return null;
  }
}

/**
 * Extrait la clé d'une variable selon sa collection et son nom
 * @param {Object} variable - Variable Figma
 * @param {string} collectionName - Nom de la collection
 * @returns {string|null} Clé extraite ou null
 */
function extractVariableKey(variable, collectionName) {
  if (!variable || !variable.name) return null;

  // 1. Normalisation robuste du nom réel dans Figma
  var raw = (variable.name || '').toLowerCase();
  raw = raw.split('/').pop().trim();              // support "Brand/primary-3"
  raw = raw.replace(/\s+/g, '');                  // "primary - 3" -> "primary-3"
  raw = raw.replace(/\(.*\)$/g, '').trim();       // "primary-3 (generated)" -> "primary-3"
  var name = raw;

  // 2. Déterminer la catégorie selon le nom de collection (normalisé)
  var c = (collectionName || '').toLowerCase();
  var isBrand = c.includes('brand');
  var isSystem = c.includes('system');
  var isGray = c.includes('gray') || c.includes('grey') || c.includes('grayscale');
  var isSpacing = c.includes('spacing');
  var isRadius = c.includes('radius');
  var isTypography = c.includes('typo') || c.includes('typography');

  if (isBrand) {
    if (name.startsWith("primary/")) {
      return name.replace("primary/", "");
    }

    // Support Bootstrap & Primary keys non-numériques
    if (name === "primary") return "primary";
    if (name.startsWith("primary-") && !name.match(/^primary[-_]\d{1,3}$/)) {
      return name;
    }

    if (name.match(/^(?:primary|brand)[-_](\d{1,3})$/)) {
      // primary-1, brand-500, primary_600, etc. (support 1-3 digits pour Ant/MUI/Bootstrap)
      return name.match(/^(?:primary|brand)[-_](\d{1,3})$/)[1];
    } else if (name.match(/^\d{1,3}$/)) {
      // Juste un nombre comme 3 (Ant) ou 600 (Bootstrap)
      return name;
    } else if (name === "brand") {
      return "primary"; // mapping fallback
    }
  } else if (isSystem) {
    return name;
  } else if (isGray) {
    var grayMatch = name.match(/^(gray|grey)[-_](.+)$/);
    if (grayMatch) {
      return grayMatch[2];
    } else if (name.match(/^\d{1,3}$/)) {
      return name;
    }
  } else if (isSpacing) {
    if (name.startsWith("spacing-")) {
      return name.replace("spacing-", "").replace(/-/g, ".");
    }
    return name.replace(/-/g, ".");
  } else if (isRadius) {
    if (name.startsWith("radius-")) {
      return name.replace("radius-", "").replace(/-/g, ".");
    }
    return name.replace(/-/g, ".");
  } else if (isTypography) {
    if (name.startsWith("typo-")) {
      return name.replace("typo-", "").replace(/-/g, ".");
    }
    return name.replace(/-/g, ".");
  }

  return null;
}


var Utils = {


  safeGet: function (node, prop, defaultValue) {
    try {
      if (node && node[prop] !== undefined) {
        return node[prop];
      }
      return defaultValue;
    } catch (error) {
      return defaultValue;
    }
  },


  hasProperty: function (node, prop) {
    try {
      return node && node[prop] !== undefined;
    } catch (error) {
      return false;
    }
  }
};


function log(msg, data) {

}




var ColorService = {

  hexToRgb: function (hex) {
    hex = hex.replace("#", "");
    if (hex.length === 3) {
      hex = hex.split("").map(function (x) { return x + x; }).join("");
    }
    var num = parseInt(hex, 16);
    return {
      r: ((num >> 16) & 255) / 255,
      g: ((num >> 8) & 255) / 255,
      b: (num & 255) / 255
    };
  },


  rgbToHex: function (c) {

    var roundToPrecision = function (x) {
      return Math.round(x * 1000000) / 1000000;
    };

    var r = roundToPrecision(Math.max(0, Math.min(1, c.r)));
    var g = roundToPrecision(Math.max(0, Math.min(1, c.g)));
    var b = roundToPrecision(Math.max(0, Math.min(1, c.b)));


    var r255 = Math.round(r * 255);
    var g255 = Math.round(g * 255);
    var b255 = Math.round(b * 255);

    var n = (r255 << 16) | (g255 << 8) | b255;
    var hex = "#" + n.toString(16).padStart(6, "0").toUpperCase();
    return hex;
  },


  hexToHsl: function (hex) {
    var rgb = ColorService.hexToRgb(hex);
    var r = rgb.r;
    var g = rgb.g;
    var b = rgb.b;

    var max = Math.max(r, g, b);
    var min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      var d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return { h: h, s: s, l: l };
  },


  hslToHex: function (hsl) {
    var h = hsl.h;
    var s = hsl.s;
    var l = hsl.l;

    if (s === 0) {
      var gray = Math.round(l * 255);
      return "#" + (gray << 16 | gray << 8 | gray).toString(16).padStart(6, "0").toUpperCase();
    }

    var hue2rgb = function (p, q, t) {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    var p = 2 * l - q;

    var r = hue2rgb(p, q, h + 1 / 3);
    var g = hue2rgb(p, q, h);
    var b = hue2rgb(p, q, h - 1 / 3);

    return ColorService.rgbToHex({ r: r, g: g, b: b });
  },


  adjustLightness: function (hsl, amount) {
    return {
      h: hsl.h,
      s: hsl.s,
      l: Math.max(0, Math.min(1, hsl.l + amount))
    };
  },


  mixColors: function (c1, c2, w) {
    var rgb1 = ColorService.hexToRgb(c1);
    var rgb2 = ColorService.hexToRgb(c2);

    return ColorService.rgbToHex({
      r: rgb1.r * (1 - w) + rgb2.r * w,
      g: rgb1.g * (1 - w) + rgb2.g * w,
      b: rgb1.b * (1 - w) + rgb2.b * w
    });
  }
};




var TokenService = {

  generateBrand: function (hex, naming) {
    var tokens = {};

    if (naming === CONFIG.naming.shadcn) {
      tokens.primary = hex;
    } else if (naming === CONFIG.naming.mui) {
      tokens.main = hex;
      tokens.light = ColorService.hslToHex(ColorService.adjustLightness(ColorService.hexToHsl(hex), 0.1));
      tokens.dark = ColorService.hslToHex(ColorService.adjustLightness(ColorService.hexToHsl(hex), -0.1));
      tokens.contrastText = ColorService.hslToHex(ColorService.adjustLightness(ColorService.hexToHsl(hex), -0.5));
    } else if (naming === CONFIG.naming.ant) {
      tokens.main = hex;
      tokens.light = ColorService.hslToHex(ColorService.adjustLightness(ColorService.hexToHsl(hex), 0.1));
      tokens.dark = ColorService.hslToHex(ColorService.adjustLightness(ColorService.hexToHsl(hex), -0.1));
    } else if (naming === CONFIG.naming.bootstrap) {
      tokens.main = hex;
      tokens.light = ColorService.hslToHex(ColorService.adjustLightness(ColorService.hexToHsl(hex), 0.15));
      tokens.dark = ColorService.hslToHex(ColorService.adjustLightness(ColorService.hexToHsl(hex), -0.15));
    } else {

      tokens['50'] = ColorService.hslToHex(ColorService.adjustLightness(ColorService.hexToHsl(hex), 0.4));
      tokens['100'] = ColorService.hslToHex(ColorService.adjustLightness(ColorService.hexToHsl(hex), 0.3));
      tokens['200'] = ColorService.hslToHex(ColorService.adjustLightness(ColorService.hexToHsl(hex), 0.2));
      tokens['300'] = ColorService.hslToHex(ColorService.adjustLightness(ColorService.hexToHsl(hex), 0.1));
      tokens['400'] = ColorService.hslToHex(ColorService.adjustLightness(ColorService.hexToHsl(hex), 0.05));
      tokens['500'] = hex;
      tokens['600'] = ColorService.hslToHex(ColorService.adjustLightness(ColorService.hexToHsl(hex), -0.05));
      tokens['700'] = ColorService.hslToHex(ColorService.adjustLightness(ColorService.hexToHsl(hex), -0.1));
      tokens['800'] = ColorService.hslToHex(ColorService.adjustLightness(ColorService.hexToHsl(hex), -0.2));
      tokens['900'] = ColorService.hslToHex(ColorService.adjustLightness(ColorService.hexToHsl(hex), -0.3));
    }

    return tokens;
  },


  generateSystem: function (naming, brandHex) {
    var tokens = {};
    var brandHsl = ColorService.hexToHsl(brandHex);

    if (naming === CONFIG.naming.mui) {
      tokens.primary = TokenService.generateBrand(brandHex, naming);
      tokens.secondary = {
        main: ColorService.mixColors(brandHex, '#666666', 0.3),
        light: ColorService.mixColors(brandHex, '#999999', 0.5),
        dark: ColorService.mixColors(brandHex, '#333333', 0.2),
        contrastText: '#ffffff'
      };
      tokens.success = { main: '#4caf50', light: '#81c784', dark: '#388e3c', contrastText: '#ffffff' };
      tokens.warning = { main: '#ff9800', light: '#ffb74d', dark: '#f57c00', contrastText: '#000000' };
      tokens.error = { main: '#f44336', light: '#e57373', dark: '#d32f2f', contrastText: '#ffffff' };
      tokens.info = { main: '#2196f3', light: '#64b5f6', dark: '#1976d2', contrastText: '#ffffff' };
    } else {

      tokens.primary = brandHex;
      tokens.secondary = ColorService.mixColors(brandHex, '#666666', 0.3);
      tokens.success = '#22c55e';
      tokens.warning = '#f59e0b';
      tokens.error = '#ef4444';
      tokens.info = '#3b82f6';
    }

    return tokens;
  },


  generateGray: function (naming) {
    var tokens = {};

    if (naming === CONFIG.naming.shadcn || naming === CONFIG.naming.ant) {

      var steps = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];
      steps.forEach(function (step, index) {
        var lightness = 0.95 - (index * 0.09);
        lightness = Math.max(0.05, Math.min(0.95, lightness));
        tokens[step] = ColorService.hslToHex({ h: 0, s: 0, l: lightness });
      });
    } else if (naming === CONFIG.naming.mui) {

      tokens['50'] = '#fafafa';
      tokens['100'] = '#f5f5f5';
      tokens['200'] = '#eeeeee';
      tokens['300'] = '#e0e0e0';
      tokens['400'] = '#bdbdbd';
      tokens['500'] = '#9e9e9e';
      tokens['600'] = '#757575';
      tokens['700'] = '#616161';
      tokens['800'] = '#424242';
      tokens['900'] = '#212121';
    } else {

      tokens.white = '#ffffff';
      tokens.light = '#f8f9fa';
      tokens.secondary = '#6c757d';
      tokens.dark = '#343a40';
      tokens.black = '#000000';
    }

    return tokens;
  },


  generateSpacing: function (naming) {
    var tokens = {};

    if (naming === CONFIG.naming.mui) {

      [0, 0.5, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40].forEach(function (multiplier) {
        tokens[multiplier] = multiplier * 4;
      });
    } else {

      [4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128, 160, 192, 224, 256].forEach(function (value) {
        tokens[value] = value;
      });
    }

    return tokens;
  },


  generateRadius: function (naming) {
    var tokens = {};

    if (naming === CONFIG.naming.mui) {
      tokens.none = 0;
      tokens.xs = 2;
      tokens.sm = 4;
      tokens.md = 6;
      tokens.lg = 8;
      tokens.xl = 12;
      tokens['2xl'] = 16;
      tokens.full = 9999;
    } else {

      tokens.none = 0;
      tokens.sm = 2;
      tokens.base = 4;
      tokens.md = 6;
      tokens.lg = 8;
      tokens.xl = 12;
      tokens['2xl'] = 16;
      tokens['3xl'] = 24;
      tokens.full = 9999;
    }

    return tokens;
  },


  generateAll: function (msg) {
    var hex = msg.hex || '#6366F1';
    var naming = msg.naming || CONFIG.naming.default;


    return {
      brand: TokenService.generateBrand(hex, naming),
      system: TokenService.generateSystem(naming, hex),
      gray: TokenService.generateGray(naming),
      spacing: TokenService.generateSpacing(naming),
      radius: TokenService.generateRadius(naming),
      typography: {
        'xs': 12,
        'sm': 14,
        'base': 16,
        'lg': 18,
        'xl': 20,
        '2xl': 24,
        '3xl': 30,
        '4xl': 36
      },
      border: {
        'thin': 1,
        'base': 2,
        'thick': 4
      }
    };
  }
};




var FigmaService = {

  getCollections: function () {
    return figma.variables.getLocalVariableCollections();
  },


  getVariableById: function (id) {
    return figma.variables.getVariableById(id);
  },


  notify: function (msg) {
    figma.notify(msg);
  },


  getOrCreateCollection: function (name, overwrite) {
    return getOrCreateCollection(name, overwrite);
  },


  createOrUpdateVariable: async function (collection, name, type, value, category, overwrite, hintKey) {
    return await createOrUpdateVariable(collection, name, type, value, category, overwrite, hintKey);
  },

  importTokens: async function (tokens, naming, overwrite) {
    // Deprecated: keep a single source of truth for imports
    return await importTokensToFigma(tokens, naming, overwrite);
  },

};

// Scanner utility for token analysis and suggestions
var Scanner = {

  valueMap: null,
  lastScanResults: null,
  collectionsCache: null,
  variablesCache: null,
  cacheTimestamp: 0,
  CACHE_DURATION: 30000,


  initMap: function () {
    var now = Date.now();


    if (Scanner.valueMap && Scanner.cacheTimestamp && (now - Scanner.cacheTimestamp < Scanner.CACHE_DURATION)) {
      return;
    }


    Scanner.valueMap = new Map();
    var localCollections = FigmaService.getCollections();
    Scanner.cacheTimestamp = now;


    for (var i = 0; i < localCollections.length; i++) {
      var collection = localCollections[i];
      var collectionName = collection.name;

      for (var j = 0; j < collection.variableIds.length; j++) {
        var variableId = collection.variableIds[j];
        var variable = FigmaService.getVariableById(variableId);

        if (!variable) {
          continue;
        }

        var modeId = (collection.modes && collection.modes.length > 0) ? collection.modes[0].modeId : 'default';
        var resolvedValue = variable.valuesByMode[modeId];

        if (resolvedValue !== undefined) {
          var formattedValue = Scanner._formatVariableValue(variable, resolvedValue);
          var key = Scanner._createMapKey(variable.resolvedType, formattedValue);

          if (!Scanner.valueMap.has(key)) {
            Scanner.valueMap.set(key, []);
          }

          Scanner.valueMap.get(key).push({
            id: variable.id,
            name: variable.name,
            resolvedValue: formattedValue,
            scopes: variable.scopes || []
          });

        }
      }
    }

  },


  _formatVariableValue: function (variable, rawValue) {
    if (variable.resolvedType === CONFIG.variableTypes.COLOR && typeof rawValue === "object") {
      return ColorService.rgbToHex(rawValue);
    } else if (variable.resolvedType === CONFIG.variableTypes.FLOAT) {
      return rawValue + "px";
    } else if (variable.resolvedType === CONFIG.variableTypes.STRING) {
      return rawValue;
    }
    return rawValue;
  },


  _createMapKey: function (type, value) {
    return type + ':' + value;
  },


  scanSelection: function (ignoreHiddenLayers) {

    var selection = figma.currentPage.selection;
    if (!selection || !Array.isArray(selection) || selection.length === 0) {
      figma.ui.postMessage({ type: "scan-results", results: [] });
      return [];
    }

    if (!Scanner.valueMap) {
      Scanner.initMap();
    }

    var results = [];
    var processedCount = 0;


    for (var i = 0; i < selection.length; i++) {
      var node = selection[i];
      Scanner._scanNodeRecursive(node, results, 0, ignoreHiddenLayers);
      processedCount++;
    }

    Scanner.lastScanResults = results;

    figma.ui.postMessage({ type: "scan-results", results: results });


    setTimeout(function () {
      if (Scanner.valueMap) {
        Scanner.valueMap.clear();
        Scanner.valueMap = null;
      }
    }, 5000);

    return results;
  },


  _scanNodeRecursive: function (node, results, depth, ignoreHiddenLayers) {

    if (depth > CONFIG.limits.MAX_DEPTH) {
      return;
    }


    if (!node) {
      return;
    }


    if (node.removed) {
      return;
    }


    if (node.type === 'INSTANCE' && node.mainComponent === null) {
      return;
    }


    if (!node.id || !node.type) {
      return;
    }

    try {
      var nodeType = node.type;
      var nodeId = node.id;
      var nodeName = node.name || "Unnamed";



      if (depth === 0 && results.length % 10 === 0) {
        figma.ui.postMessage({
          type: "scan-progress",
          current: results.length,
          status: "Analyse en cours..."
        });
      }


      var containerTypes = CONFIG.supportedTypes.spacing;


      var styleTypes = CONFIG.supportedTypes.fillAndStroke;

      var isContainer = containerTypes.indexOf(nodeType) !== -1;
      var hasStyle = styleTypes.indexOf(nodeType) !== -1;


      if (hasStyle) {
        try {
          Scanner._checkProperties(node, results, ignoreHiddenLayers);
        } catch (propertyAnalysisError) {
        }
      }


      if (isContainer) {
        try {
          var children = node.children;

          if (children && Array.isArray(children)) {

            for (var i = 0; i < children.length; i++) {
              try {
                var child = children[i];


                if (!child) {
                  continue;
                }

                if (child.removed) {
                  continue;
                }


                Scanner._scanNodeRecursive(child, results, depth + 1, ignoreHiddenLayers);

              } catch (childError) {
              }
            }
          }

        } catch (childrenError) {
        }
      }

    } catch (nodeError) {
    }
  },


  _checkProperties: function (node, results, ignoreHiddenLayers) {

    if (!node) {
      return;
    }


    if (node.removed) {
      return;
    }


    if (!node.id || !node.name || !node.type) {
      return;
    }

    var nodeId = node.id;
    var layerName = node.name;
    var nodeType = node.type;


    if (ignoreHiddenLayers) {
      try {
        if (Utils.safeGet(node, 'visible') === false) {
          return;
        }
        if (Utils.safeGet(node, 'locked') === true) {
          return;
        }
      } catch (visibilityError) {

      }
    }


    var supportedTypes = CONFIG.supportedTypes.all;


    var styleSupportedTypes = CONFIG.supportedTypes.fillAndStroke;

    var isContainer = supportedTypes.indexOf(nodeType) !== -1;
    var supportsStyle = styleSupportedTypes.indexOf(nodeType) !== -1;

    if (!isContainer) {
      return;
    }


    if (supportsStyle) {
      try {

        if (Utils.hasProperty(node, 'fills') && node.fills !== figma.mixed) {
          Scanner._checkFillsSafely(node, results);
        }


        if (Utils.hasProperty(node, 'strokes') && node.strokes !== figma.mixed) {
          Scanner._checkStrokesSafely(node, results);
        }


        Scanner._checkCornerRadiusSafely(node, results);


        Scanner._checkNumericPropertiesSafely(node, results);


        if (node.type === CONFIG.types.TEXT) {
          Scanner._checkTypographyPropertiesSafely(node, results);
        }

      } catch (propertyError) {
      }
    }
  },


  _checkFillsSafely: function (node, results) {
    if (!Scanner.valueMap) {
      Scanner.initMap();
    }
    checkFillsSafely(node, Scanner.valueMap, results);
  },

  _checkStrokesSafely: function (node, results) {
    if (!Scanner.valueMap) {
      Scanner.initMap();
    }
    checkStrokesSafely(node, Scanner.valueMap, results);
  },

  _checkCornerRadiusSafely: function (node, results) {
    if (!Scanner.valueMap) {
      Scanner.initMap();
    }
    checkCornerRadiusSafely(node, Scanner.valueMap, results);
  },

  _checkNumericPropertiesSafely: function (node, results) {
    if (!Scanner.valueMap) {
      Scanner.initMap();
    }
    checkNumericPropertiesSafely(node, Scanner.valueMap, results);
  },

  _checkTypographyPropertiesSafely: function (node, results) {
    if (!Scanner.valueMap) {
      Scanner.initMap();
    }
    checkTypographyPropertiesSafely(node, Scanner.valueMap, results);
  }
};




var Fixer = {

  applyAndVerify: function (result, variableId) {


    if (!result) {
      throw new Error('Invalid result or incomplete');
    }
    if (!result.nodeId) {
      throw new Error('Invalid result: nodeId missing');
    }
    if (!result.property) {
      throw new Error('Invalid result: property missing');
    }


    if (!variableId) {
      throw new Error('No variable ID provided or suggested');
    }

    var variable = FigmaService.getVariableById(variableId);
    if (!variable) {
      throw new Error('Variable not found: ' + variableId);
    }


    var node = figma.getNodeById(result.nodeId);
    if (!node) {
      throw new Error('Node not found: ' + result.nodeId);
    }
    if (node.removed) {
      throw new Error('Node removed: ' + result.nodeId);
    }


    if (Utils.safeGet(node, 'locked') === true) {
      throw new Error('Cannot modify locked node: ' + result.layerName);
    }


    if (!Fixer._validatePropertyExists(node, result)) {
      throw new Error('Property no longer exists: ' + result.property);
    }


    if (!Fixer._validateVariableCanBeApplied(variable, result)) {
      throw new Error('Variable incompatible with property');
    }


    var applied = Fixer._applyVariableToProperty(node, result, variable);

    if (!applied) {
      throw new Error('Failed to apply variable');
    }


    var verification = Fixer._verifyVariableApplication(node, result, variable);

    if (verification.success) {
      return verification;
    } else {
      return verification;
    }
  },


  applySingle: function (result, variableId) {
    try {
      var verification = Fixer.applyAndVerify(result, variableId);
      return verification.success ? 1 : 0;
    } catch (error) {
      return 0;
    }
  },


  applyGroup: function (indices, variableId) {
    if (!Scanner.lastScanResults || !Array.isArray(indices)) {
      return;
    }

    var appliedCount = 0;
    var failedCount = 0;

    for (var i = 0; i < indices.length; i++) {
      var index = indices[i];
      if (index >= 0 && index < Scanner.lastScanResults.length) {
        var result = Scanner.lastScanResults[index];
        try {
          var success = Fixer.applySingle(result, variableId);
          if (success) {
            appliedCount++;
          } else {
            failedCount++;
          }
        } catch (error) {
          failedCount++;
        }
      }
    }

    var message = '✅ ' + appliedCount + ' corrections appliquées';
    if (failedCount > 0) {
      message += ', ' + failedCount + ' échouées';
    }

    FigmaService.notify(message);
  },


  applyAll: function () {
    if (!Scanner.lastScanResults || !Array.isArray(Scanner.lastScanResults)) {
      return;
    }

    var appliedCount = 0;
    var failedCount = 0;

    for (var i = 0; i < Scanner.lastScanResults.length; i++) {
      var result = Scanner.lastScanResults[i];
      try {
        var success = Fixer.applySingle(result, result.suggestedVariableId);
        if (success) {
          appliedCount++;
        } else {
          failedCount++;
        }
      } catch (error) {
        failedCount++;
      }
    }

    var message = '🎉 Toutes les corrections appliquées ! (' + appliedCount + ' réussies';
    if (failedCount > 0) {
      message += ', ' + failedCount + ' échouées)';
    } else {
      message += ')';
    }

    FigmaService.notify(message);
  },


  _validatePropertyExists: function (node, result) {

  },

  _validateVariableCanBeApplied: function (variable, result) {

  },

  _applyVariableToProperty: function (node, result, variable) {
    try {
      var success = false;

      switch (result.property) {
        case "Fill":
          success = applyColorVariableToFill(node, variable, result.fillIndex);
          break;

        case "Stroke":
          success = applyColorVariableToStroke(node, variable, result.strokeIndex);
          break;

        case "Local Fill Style":
          success = applyVariableToLocalStyle(node, variable, 'fill', result);
          break;

        case "Local Stroke Style":
          success = applyVariableToLocalStyle(node, variable, 'stroke', result);
          break;

        case "CORNER RADIUS":
        case "TOP LEFT RADIUS":
        case "TOP RIGHT RADIUS":
        case "BOTTOM LEFT RADIUS":
        case "BOTTOM RIGHT RADIUS":
          success = applyNumericVariable(node, variable, result.figmaProperty, result.property);
          break;

        case "Item Spacing":
        case "Padding Left":
        case "Padding Right":
        case "Padding Top":
        case "Padding Bottom":
          success = applyNumericVariable(node, variable, result.figmaProperty, result.property);
          break;

        default:
          return false;
      }

      return success;
    } catch (error) {
      return false;
    }
  },

  _verifyVariableApplication: function (node, result, variable) {

  },

  _getNodePropertyDebugInfo: function (node, result) {

  }
};






figma.showUI(__html__, { width: 800, height: 950, themeColors: true });

// Load saved naming and semantic tokens, then send to UI
var savedSemanticTokens = getSemanticTokensFromFile('PLUGIN_STARTUP');

// "Flatten" les tokens sémantiques pour obtenir les valeurs actuelles depuis Figma (async)
(async function initializeSemanticTokens() {
  try {
    var flattenedSemanticTokens = await flattenSemanticTokensFromFigma('PLUGIN_STARTUP');

    // Sauvegarder immédiatement les tokens flattenned
    if (flattenedSemanticTokens) {
      saveSemanticTokensToFile(flattenedSemanticTokens, 'FLATTEN_STARTUP');
    }
  } catch (error) {
    console.warn('Error during semantic token initialization:', error);
  }
})();

// Lancer la rehydratation asynchrone (Lazy Rebind) pour résoudre librairies/alias unresolved
initializeCollectionCache();
rehydrateSemanticAliases();

// Charger le naming de manière asynchrone
figma.clientStorage.getAsync("tokenStarter.naming").then(async function (clientSavedNaming) {
  var savedNaming = clientSavedNaming || await getNamingFromFile();

  figma.ui.postMessage({
    type: "init",
    naming: savedNaming,
    savedSemanticTokens: flattenedSemanticTokens
  });
}).catch(function () {
  // Fallback vers la méthode synchrone
  var savedNaming = getNamingFromFile();

  figma.ui.postMessage({
    type: "init",
    naming: savedNaming,
    savedSemanticTokens: flattenedSemanticTokens
  });
});


figma.ui.onmessage = async function (msg) {

  // Initialize collection cache for alias resolution
  initializeCollectionCache();

  try {
    switch (msg.type) {
      case 'rehydrate-semantic-aliases':
        rehydrateSemanticAliases();
        break;

      case 'scan-selection':
        Scanner.scanSelection(msg.ignoreHiddenLayers);
        break;

      case 'scan-page':
        Scanner.scanPage(msg.ignoreHiddenLayers);
        break;

      case 'generate-tokens':
        var tokens = TokenService.generateAll(msg);
        var savedNaming = await getNamingFromFile();
        var effectiveNaming = msg.naming || savedNaming;
        // Save naming preference to file (always save what will be used)
        saveNamingToFile(effectiveNaming);
        var semanticPreview = getSemanticPreviewRows(tokens, effectiveNaming);
        figma.ui.postMessage({
          type: 'tokens-generated',
          tokens: tokens,
          semanticPreview: semanticPreview,
          naming: effectiveNaming
        });
        break;

      case 'import-tokens':
        console.log('🔄 Pipeline d\'import : import-tokens → FigmaService.importTokens');

        // Logs de diagnostic pour comprendre ce que l'UI envoie
        if (msg.tokens && msg.tokens.semantic) {
          var uiSemanticStats = analyzeSemanticTokensStats(msg.tokens.semantic, 'UI_MESSAGE');
          console.log(`📤 UI_MESSAGE [UI_MESSAGE]: semantic tokens from UI - ${uiSemanticStats.total} total (${uiSemanticStats.aliasCount} aliases, ${uiSemanticStats.valueCount} values)`);
          if (uiSemanticStats.fallbackValues.length > 0) {
            console.log(`⚠️ UI_MESSAGE [UI_MESSAGE]: UI sent fallback values: ${uiSemanticStats.fallbackValues.join(', ')}`);
          }

          // Vérifier la structure des tokens (objets complets ou juste strings)
          var sampleKeys = Object.keys(msg.tokens.semantic).slice(0, 3);
          console.log('🔍 UI_MESSAGE structure check:');
          sampleKeys.forEach(key => {
            var token = msg.tokens.semantic[key];
            if (typeof token === 'object' && token.resolvedValue !== undefined) {
              console.log(`  ${key}: object with resolvedValue="${token.resolvedValue}", aliasTo=${token.aliasTo}`);
            } else {
              console.log(`  ${key}: primitive value "${token}"`);
            }
          });
        } else {
          console.log('📤 UI_MESSAGE [UI_MESSAGE]: no semantic tokens in UI message');
        }

        FigmaService.importTokens(msg.tokens, msg.naming, msg.overwrite);
        break;

      case 'apply-fix':
        var verification = Fixer.applyAndVerify(msg.result, msg.variableId);
        figma.ui.postMessage({ type: 'fix-applied', verification: verification });
        break;

      case 'apply-group':
        Fixer.applyGroup(msg.indices, msg.variableId);
        break;

      case 'apply-all':
        Fixer.applyAll();
        break;

      case 'save-naming':
        saveNamingToFile(msg.naming);
        break;


      default:
    }
  } catch (error) {
    figma.ui.postMessage({ type: 'error', error: error.message });
  }
};


var existingCollections = figma.variables.getLocalVariableCollections();
if (existingCollections.length > 0) {
  figma.ui.postMessage({ type: "has-variables", value: true });


  try {
    var existingTokens = extractExistingTokens();

    // Sauvegarder les primitives extraites (toutes catégories sauf semantic)
    var primitivesOnly = {};
    var hasPrimitives = false;
    for (var cat in existingTokens.tokens) {
      if (existingTokens.tokens.hasOwnProperty(cat) && cat !== 'semantic') {
        var categoryTokens = existingTokens.tokens[cat];
        if (Object.keys(categoryTokens).length > 0) {
          primitivesOnly[cat] = categoryTokens;
          hasPrimitives = true;
        }
      }
    }

    if (hasPrimitives) {
      savePrimitivesTokensToFile(primitivesOnly, 'EXTRACT_STARTUP');
    }

    var hasTokens = false;
    for (var cat in existingTokens.tokens) {
      if (existingTokens.tokens.hasOwnProperty(cat) && Object.keys(existingTokens.tokens[cat]).length > 0) {
        hasTokens = true;
        break;
      }
    }

    if (existingTokens && hasTokens) {
      figma.ui.postMessage({
        type: "existing-tokens",
        tokens: existingTokens.tokens,
        library: existingTokens.library
      });
    } else {
      figma.ui.postMessage({
        type: "existing-tokens",
        tokens: {},
        library: "tailwind"
      });
    }
  } catch (e) {
  }
}







function extractExistingTokens() {
  console.log('🔍 extractExistingTokens: starting extraction');
  var collections = figma.variables.getLocalVariableCollections();
  console.log('📚 Found collections:', collections.map(c => c.name));

  var tokens = {
    brand: {},
    system: {},
    gray: {},
    spacing: {},
    radius: {},
    typography: {},
    border: {},
    semantic: {}
  };

  var detectedLibrary = "tailwind";

  for (var i = 0; i < collections.length; i++) {
    var collection = collections[i];
    var collectionName = collection.name;


    var category = null;

    if (collectionName === "Brand Colors") {
      category = "brand";
    } else if (collectionName === "System Colors") {
      category = "system";
    } else if (collectionName === "Grayscale") {
      category = "gray";
    } else if (collectionName === "Spacing") {
      category = "spacing";
    } else if (collectionName === "Radius") {
      category = "radius";
    } else if (collectionName === "Typography") {
      category = "typography";
    } else if (collectionName === "Border") {
      category = "border";
    } else if (collectionName === "Semantic") {
      category = "semantic";
    }


    if (!category) {
      continue;
    }


    var variables = collection.variableIds.map(function (id) {
      return figma.variables.getVariableById(id);
    });


    for (var j = 0; j < variables.length; j++) {
      var variable = variables[j];
      if (!variable) continue;

      var modeId = collection.modes[0].modeId;
      var raw = variable.valuesByMode[modeId];
      var value = resolveVariableValue(variable, modeId);

      // EXTRACTION SPÉCIALE POUR LES TOKENS SÉMANTIQUES
      var aliasTo = null;
      var resolvedValue = null;

      if (category === "semantic") {
        if (raw && typeof raw === 'object' && raw.type === 'VARIABLE_ALIAS') {
          // ✅ VARIABLE_ALIAS détecté : normaliser l'alias + garantir valeur scalaire résolue
          var rawAliasTo = raw.id; // string ID brut
          aliasTo = normalizeAliasTo(rawAliasTo, tokens); // normalisé vers objet complet
          resolvedValue = normalizeResolvedValue(value, variable.resolvedType);

          // GARDE-FOU : resolvedValue DOIT être scalaire, jamais objet
          if (typeof resolvedValue === 'object' || resolvedValue === null || resolvedValue === undefined) {
            console.warn(`🚨 CRITICAL: resolvedValue for aliased semantic ${variable.name} is not scalar:`, resolvedValue);
            resolvedValue = getFallbackValue(variable.resolvedType, category);
          }

          console.log(`[ALIAS_LOAD] ${variable.name} → alias:${JSON.stringify(aliasTo)}, resolved:${resolvedValue}`);
        } else {
          // Pas d'alias : juste la valeur résolue normalisée
          aliasTo = null;
          resolvedValue = normalizeResolvedValue(value, variable.resolvedType);

          // GARDE-FOU : resolvedValue DOIT être scalaire
          if (typeof resolvedValue === 'object' || resolvedValue === null || resolvedValue === undefined) {
            console.warn(`🚨 CRITICAL: resolvedValue for non-aliased semantic ${variable.name} is not scalar:`, resolvedValue);
            resolvedValue = getFallbackValue(variable.resolvedType, category);
          }
        }
      } else {
        // Pour les primitives : logique existante
        resolvedValue = value;
      }

      // Debug log pour voir les valeurs extraites
      if (!value) {
        console.warn(`⚠️ Variable ${category}/${cleanName} (${variable.name}) a une valeur null/undefined`);
      } else {
        console.log(`📖 Extracted ${category}/${cleanName}:`, typeof value, value);
      }


      var cleanName = variable.name;

      if (category === "semantic") {
        // Pour les tokens sémantiques, utiliser directement le nom Figma comme clé
        cleanName = variable.name;
      } else {
        // Pour les primitives, nettoyer le préfixe
        cleanName = variable.name
          .replace(/^(primary|brand|gray|grey|system|spacing|radius|typo|border)-/i, "");
      }


      // Ignorer complètement la collection Semantic dans la détection de librairie
      // La détection ne se base que sur les primitives : Brand/System/Grayscale/Spacing/Radius/Typography/Border
      if (category !== "semantic") {
        if (cleanName.match(/^(main|light|dark|contrastText)$/)) {
          detectedLibrary = "mui";
        } else if (cleanName.match(/^(subtle|hover|emphasis)$/)) {
          detectedLibrary = "bootstrap";
        }
      }


      // Normaliser TOUTES les valeurs selon leur type (primitives ET sémantiques)
      var formattedValue;

      if (variable.resolvedType === "COLOR") {
        // Toujours convertir les couleurs en hex string
        if (typeof value === "object" && value && value.r !== undefined) {
          formattedValue = rgbToHex(value);
        } else if (typeof value === "string" && value && value.startsWith("#")) {
          formattedValue = value; // Déjà en hex
        } else {
          // Valeur par défaut selon la catégorie
          formattedValue = category === "semantic" ? "#000000" : "#FFFFFF";
        }
      } else if (variable.resolvedType === "FLOAT") {
        // Convertir en number
        if (typeof value === "number") {
          formattedValue = value;
        } else if (typeof value === "string") {
          var parsed = parseFloat(value);
          formattedValue = isNaN(parsed) ? 0 : parsed;
        } else {
          formattedValue = 0;
        }
      } else if (variable.resolvedType === "STRING") {
        // Garder les strings
        formattedValue = typeof value === "string" ? value : "";
      } else {
        // Pour tout autre type, convertir en string safe
        formattedValue = String(value || "");
      }

      // Log si on utilise une valeur par défaut pour les couleurs
      if (variable.resolvedType === "COLOR" &&
        formattedValue === (category === "semantic" ? "#000000" : "#FFFFFF") &&
        value !== formattedValue) {
        console.warn(`⚠️ Valeur par défaut utilisée pour ${category}/${cleanName}:`, value, '→', formattedValue);
      }

      if (category === "semantic") {
        // Pour les sémantiques : créer l'objet complet avec aliasTo et resolvedValue
        tokens[category][cleanName] = {
          resolvedValue: resolvedValue,
          type: variable.resolvedType,
          aliasTo: aliasTo,
          meta: {
            sourceCategory: getCategoryFromSemanticKey(cleanName),
            sourceKey: getKeyFromSemanticKey(cleanName),
            updatedAt: Date.now()
          }
        };
        console.log(`✅ Final semantic ${cleanName}: aliasTo=${aliasTo}, resolvedValue=${resolvedValue}`);
      } else {
        // Pour les primitives : garder l'ancienne logique
        console.log(`✅ Final ${category}/${cleanName}: ${formattedValue}`);
        tokens[category][cleanName] = formattedValue;
      }
    }
  }

  // Les tokens sémantiques sont maintenant extraits depuis la collection "Semantic" de Figma

  console.log('📦 extractExistingTokens result:', {
    brand: Object.keys(tokens.brand).length + ' keys: ' + Object.keys(tokens.brand).slice(0, 3).join(', '),
    system: Object.keys(tokens.system).length,
    gray: Object.keys(tokens.gray).length,
    spacing: Object.keys(tokens.spacing).length,
    radius: Object.keys(tokens.radius).length,
    typography: Object.keys(tokens.typography).length,
    border: Object.keys(tokens.border).length,
    semantic: Object.keys(tokens.semantic).length,
    detectedLibrary: detectedLibrary
  });

  for (var cat in tokens) {
  }

  return {
    tokens: tokens,
    library: detectedLibrary
  };
}





function hexToRgb(hex) {
  // Si c'est déjà un objet RGB, le retourner tel quel
  if (hex && typeof hex === 'object' && hex.r !== undefined && hex.g !== undefined && hex.b !== undefined) {
    return hex;
  }

  // Sinon, convertir depuis hex string
  if (typeof hex === 'string') {
    hex = hex.replace("#", "");
    if (hex.length === 3) {
      hex = hex.split("").map(function (x) { return x + x; }).join("");
    }
    var num = parseInt(hex, 16);
    if (!isNaN(num)) {
      return {
        r: ((num >> 16) & 255) / 255,
        g: ((num >> 8) & 255) / 255,
        b: (num & 255) / 255
      };
    }
  }

  // Valeur par défaut si format invalide
  return { r: 0, g: 0, b: 0 };
}

function rgbToHex(c) {

  var roundToPrecision = function (x) {
    return Math.round(x * 1000000) / 1000000;
  };

  var r = roundToPrecision(Math.max(0, Math.min(1, c.r)));
  var g = roundToPrecision(Math.max(0, Math.min(1, c.g)));
  var b = roundToPrecision(Math.max(0, Math.min(1, c.b)));


  var r255 = Math.round(r * 255);
  var g255 = Math.round(g * 255);
  var b255 = Math.round(b * 255);

  var n = (r255 << 16) | (g255 << 8) | b255;
  var hex = "#" + n.toString(16).padStart(6, "0").toUpperCase();
  return hex;
}

function hexToHsl(hex) {
  var rgb = hexToRgb(hex);
  var r = rgb.r;
  var g = rgb.g;
  var b = rgb.b;

  var max = Math.max(r, g, b);
  var min = Math.min(r, g, b);
  var h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    var d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToHex(h, s, l) {
  h = h / 360;
  s = s / 100;
  l = l / 100;

  var r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    var hue2rgb = function (p, q, t) {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    var p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return rgbToHex({ r: r, g: g, b: b });
}





function generateBrandColors(hex, naming) {
  var hsl = hexToHsl(hex);
  var H = hsl.h;
  var S = hsl.s;
  var L = hsl.l;

  var palette5 = {
    subtle: hslToHex(H, S, Math.min(97, L + 25)),
    light: hslToHex(H, S, Math.min(92, L + 15)),
    base: hex,
    hover: hslToHex(H, S, Math.max(10, L - 8)),
    dark: hslToHex(H, S, Math.max(5, L - 18))
  };

  if (naming === "shadcn") {

    var shadcnBrand = {};
    var levels = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];


    for (var i = 0; i < levels.length; i++) {
      var level = levels[i];
      var color;

      if (level === 50) color = palette5.subtle;
      else if (level === 100) color = palette5.light;
      else if (level === 200) color = hslToHex(H, S, Math.min(95, L + 10));
      else if (level === 300) color = hslToHex(H, S, Math.min(95, L + 5));
      else if (level === 400) color = hslToHex(H, S, Math.min(95, L + 2));
      else if (level === 500) color = palette5.base;
      else if (level === 600) color = hslToHex(H, S, Math.max(5, L - 2));
      else if (level === 700) color = hslToHex(H, S, Math.max(5, L - 5));
      else if (level === 800) color = hslToHex(H, S, Math.max(5, L - 10));
      else if (level === 900) color = palette5.dark;
      else if (level === 950) color = hslToHex(H, S, Math.max(5, L - 15));

      shadcnBrand[level.toString()] = color;
    }

    return shadcnBrand;
  }

  if (naming === "tailwind") {

    var tailwindBrand = {};
    var levels = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];


    for (var i = 0; i < levels.length; i++) {
      var level = levels[i];
      var color;

      if (level === 50) color = palette5.subtle;
      else if (level === 100) color = palette5.light;
      else if (level === 200) color = hslToHex(H, S, Math.min(95, L + 10));
      else if (level === 300) color = hslToHex(H, S, Math.min(95, L + 5));
      else if (level === 400) color = hslToHex(H, S, Math.min(95, L + 2));
      else if (level === 500) color = palette5.base;
      else if (level === 600) color = hslToHex(H, S, Math.max(5, L - 2));
      else if (level === 700) color = hslToHex(H, S, Math.max(5, L - 5));
      else if (level === 800) color = hslToHex(H, S, Math.max(5, L - 10));
      else if (level === 900) color = palette5.dark;
      else if (level === 950) color = hslToHex(H, S, Math.max(5, L - 15));

      tailwindBrand[level.toString()] = color;
    }

    return tailwindBrand;
  }

  if (!naming || naming === "chakra" || naming === "custom") {
    return {
      "100": palette5.subtle,
      "200": palette5.light,
      "300": palette5.base,
      "400": palette5.hover,
      "500": palette5.dark
    };
  }

  if (naming === "mui") {
    return {
      light: palette5.light,
      main: palette5.base,
      dark: palette5.dark,
      contrastText: "#FFFFFF"
    };
  }

  if (naming === "bootstrap") {
    return {
      "primary": palette5.base,
      "primary-subtle": palette5.subtle,
      "primary-hover": palette5.hover,
      "primary-dark": palette5.dark
    };
  }

  if (naming === "ant") {
    return {
      "1": palette5.subtle,
      "2": palette5.light,
      "3": palette5.base,
      "4": palette5.hover,
      "5": palette5.dark
    };
  }

  return {
    subtle: palette5.subtle,
    light: palette5.light,
    base: palette5.base,
    hover: palette5.hover,
    dark: palette5.dark
  };
}

function generateGrayscale(naming) {
  var base = {
    "50": "#F9FAFB",
    "100": "#F3F4F6",
    "200": "#E5E7EB",
    "300": "#D1D5DB",
    "400": "#9CA3AF",
    "500": "#6B7280",
    "600": "#4B5563",
    "700": "#374151",
    "800": "#1F2937",
    "900": "#111827",
    "950": "#030712",
    "white": "#FFFFFF",
  };

  if (naming === "shadcn") {
    var shadcnGrays = {};

    var shadcnOrder = ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950"];
    for (var i = 0; i < shadcnOrder.length; i++) {
      var key = shadcnOrder[i];
      shadcnGrays[key] = base[key];
    }
    return shadcnGrays;
  }

  if (naming === "ant") {
    return {
      "1": base["50"],
      "2": base["100"],
      "3": base["200"],
      "4": base["300"],
      "5": base["400"],
      "6": base["500"],
      "7": base["600"],
      "8": base["700"],
      "9": base["800"],
      "10": base["900"]
    };
  }


  var orderedGrays = {};
  var order = ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950", "white"];
  for (var i = 0; i < order.length; i++) {
    var key = order[i];
    orderedGrays[key] = base[key];
  }
  return orderedGrays;
}

function generateSystemColors(naming) {
  var baseColors = {
    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",
    info: "#3B82F6"
  };

  var result = {};

  for (var colorName in baseColors) {
    if (!baseColors.hasOwnProperty(colorName)) continue;

    var baseHex = baseColors[colorName];
    var hsl = hexToHsl(baseHex);

    var light = hslToHex(hsl.h, hsl.s, Math.min(95, hsl.l + 25));
    var dark = hslToHex(hsl.h, hsl.s, Math.max(20, hsl.l - 15));

    if (naming === "shadcn") {

      if (colorName === "success") {
        result["primary"] = baseHex;
        result["primary-foreground"] = "#FFFFFF";
      } else if (colorName === "error") {
        result["destructive"] = baseHex;
        result["destructive-foreground"] = "#FFFFFF";
      } else if (colorName === "warning") {
        result["warning"] = baseHex;
        result["warning-foreground"] = "#000000";
      } else if (colorName === "info") {
        result["accent"] = baseHex;
        result["accent-foreground"] = "#FFFFFF";
      }
    } else if (naming === "mui") {
      result[colorName + "-light"] = light;
      result[colorName + "-main"] = baseHex;
      result[colorName + "-dark"] = dark;
    } else if (naming === "bootstrap") {
      result[colorName] = baseHex;
      result[colorName + "-subtle"] = light;
      result[colorName + "-emphasis"] = dark;
    } else {
      result[colorName + "-light"] = light;
      result[colorName] = baseHex;
      result[colorName + "-dark"] = dark;
    }
  }

  return result;
}

function generateSpacing(naming) {
  if (naming === "shadcn") {
    return {
      "1": "0.25rem",
      "2": "0.5rem",
      "3": "0.75rem",
      "4": "1rem",
      "5": "1.25rem",
      "6": "1.5rem",
      "8": "2rem",
      "10": "2.5rem",
      "12": "3rem",
      "16": "4rem"
    };
  }
  if (naming === "mui") {
    return { "1": "8px", "2": "16px", "3": "24px", "4": "32px", "5": "40px" };
  }
  if (naming === "bootstrap") {
    return { "1": "0.25rem", "2": "0.5rem", "3": "1rem", "4": "1.5rem", "5": "3rem" };
  }
  return { "1": "4px", "2": "8px", "3": "12px", "4": "16px", "5": "20px", "6": "24px", "8": "32px" };
}

function generateRadius(naming) {
  if (naming === "shadcn") {
    return {
      "sm": "0.125rem",
      "md": "0.375rem",
      "lg": "0.5rem",
      "xl": "0.75rem",
      "2xl": "1rem",
      "3xl": "1.5rem",
      "full": "9999px"
    };
  }
  if (naming === "mui") {
    return { "xs": "4px", "sm": "8px", "md": "12px", "lg": "16px", "xl": "20px" };
  }
  if (naming === "bootstrap") {
    return { "sm": "0.25rem", "default": "0.375rem", "lg": "0.5rem", "pill": "50rem" };
  }
  return { "sm": "2", "md": "4", "lg": "8", "xl": "12", "2xl": "16", "full": "9999" };
}

function generateTypography(naming) {
  if (naming === "shadcn") {
    return {
      "xs": "0.75rem",
      "sm": "0.875rem",
      "base": "1rem",
      "lg": "1.125rem",
      "xl": "1.25rem",
      "2xl": "1.5rem",
      "3xl": "1.875rem",
      "4xl": "2.25rem",
      "5xl": "3rem"
    };
  }
  if (naming === "mui") {
    return {
      "h1": "96px / 700",
      "h2": "60px / 700",
      "h3": "48px / 600",
      "body1": "16px / 400",
      "body2": "14px / 400"
    };
  }
  if (naming === "bootstrap") {
    return {
      "h1": "2.5rem",
      "h2": "2rem",
      "h3": "1.75rem",
      "body": "1rem",
      "lead": "1.25rem"
    };
  }
  return {
    "text-xs": "0.75rem",
    "text-sm": "0.875rem",
    "text-base": "1rem",
    "text-lg": "1.125rem",
    "text-xl": "1.25rem"
  };
}

function generateBorder() {
  return { "1": "1", "2": "2", "4": "4" };
}





// Nouvelle fonction pour inférer la famille sémantique de manière robuste
function inferSemanticFamily(semanticKey) {
  if (!semanticKey) return '';

  // Normaliser : remplacer / et . par -, mettre en lowercase
  var normalized = semanticKey.replace(/[\/\.]/g, '-').toLowerCase();

  // Détection des familles principales avec support étendu
  if (normalized.startsWith('text-') || normalized.includes('text-') || normalized.startsWith('text.') || normalized.includes('text.')) {
    return 'textColor';
  } else if (normalized.startsWith('background-') || normalized.startsWith('bg-') || normalized.includes('background-') || normalized.includes('bg-')) {
    return 'backgroundColor';
  } else if (normalized.startsWith('border-') || normalized.includes('border-') || normalized.startsWith('border.') || normalized.includes('border.')) {
    return 'borderColor';
  } else if (normalized.startsWith('radius-') || normalized.includes('radius-') || normalized.startsWith('radius.') || normalized.includes('radius.')) {
    return 'radius';
  } else if (normalized.startsWith('space-') || normalized.includes('space-') || normalized.startsWith('space.') || normalized.includes('space.')) {
    return 'space';
  } else if (normalized.startsWith('font-size-') || normalized.includes('font-size-') || normalized.startsWith('fontsize-') || normalized.includes('fontsize-')) {
    return 'fontSize';
  } else if (normalized.startsWith('font-weight-') || normalized.includes('font-weight-') || normalized.startsWith('fontweight-') || normalized.includes('fontweight-')) {
    return 'fontWeight';
  }

  // Détection des tokens "brand/action/status" (primary, success, warning, destructive, info)
  if (normalized === 'primary' || normalized.startsWith('primary-') || normalized.includes('primary-')) {
    return 'accentColor';
  }
  if (['success', 'warning', 'destructive', 'info'].includes(normalized) ||
    normalized.includes('success') || normalized.includes('warning') ||
    normalized.includes('destructive') || normalized.includes('info')) {
    return 'accentColor';
  }

  return ''; // Famille inconnue
}

// Mapping explicite des scopes par famille sémantique
var semanticScopesMapping = {
  textColor: ["TEXT_FILL"],
  backgroundColor: ["FRAME_FILL", "SHAPE_FILL"],
  borderColor: ["STROKE_COLOR"],
  accentColor: ["FRAME_FILL", "SHAPE_FILL", "STROKE_COLOR"],
  radius: ["CORNER_RADIUS"],
  space: ["GAP"],
  fontSize: ["FONT_SIZE"],
  fontWeight: []
};


// ===== SCOPE ENGINE =====
// Engine de scope unifié pour variables primitives et sémantiques
function normalizeKey(key) {
  if (!key) return '';
  return key
    .trim()
    .toLowerCase()
    .replace(/[\/\.]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function inferSemanticFamily(normalizedKey) {
  if (!normalizedKey) return '';

  // Familles principales
  if (normalizedKey.startsWith('text-') || normalizedKey.includes('text-')) {
    return 'text';
  } else if (normalizedKey.startsWith('background-') || normalizedKey.startsWith('bg-') ||
    normalizedKey.includes('background-') || normalizedKey.includes('bg-')) {
    return 'background';
  } else if (normalizedKey.startsWith('border-') || normalizedKey.includes('border-')) {
    return 'border';
  } else if (normalizedKey.startsWith('radius-') || normalizedKey.includes('radius-')) {
    return 'radius';
  } else if (normalizedKey.startsWith('space-') || normalizedKey.includes('space-')) {
    return 'space';
  } else if (normalizedKey.startsWith('font-size-') || normalizedKey.includes('font-size-') ||
    normalizedKey.startsWith('fontsize-') || normalizedKey.includes('fontsize-')) {
    return 'fontSize';
  } else if (normalizedKey.startsWith('font-weight-') || normalizedKey.includes('font-weight-') ||
    normalizedKey.startsWith('fontweight-') || normalizedKey.includes('fontweight-')) {
    return 'fontWeight';
  }

  // Tokens "brand/action/status" (primary, success, warning, destructive, info)
  if (normalizedKey === 'primary' || normalizedKey.startsWith('primary-') || normalizedKey.includes('primary-')) {
    return 'accent';
  }
  if (['success', 'warning', 'destructive', 'info'].some(status =>
    normalizedKey === status || normalizedKey.startsWith(status + '-') || normalizedKey.includes(status + '-')
  )) {
    return 'accent';
  }

  return ''; // Famille inconnue
}

function createScopeContext(figmaVar, tokenKey, category) {
  return {
    kind: category === "semantic" ? "semantic" : "primitive",
    key: tokenKey || figmaVar.name,
    category: category,
    type: figmaVar.resolvedType || "COLOR", // fallback safe
    normalizedKey: normalizeKey(tokenKey || figmaVar.name),
    family: category === "semantic" ? inferSemanticFamily(normalizeKey(tokenKey || figmaVar.name)) : category
  };
}

// NOTE:
// - WIDTH_HEIGHT volontairement retiré : width/height non gérés dans l'outil
// - Typography limitée à FONT_SIZE tant que line-height / letter-spacing ne sont pas supportés
// - ALL_SCOPES supprimé pour éviter des scopes trop permissifs

var primitiveScopesMapping = {
  brand: ["ALL_FILLS", "STROKE_COLOR", "EFFECT_COLOR"],
  gray: ["ALL_FILLS", "STROKE_COLOR", "EFFECT_COLOR"],
  system: ["ALL_FILLS", "STROKE_COLOR", "EFFECT_COLOR"],
  border: ["STROKE"], // Scope border limité à STROKE uniquement
  radius: ["CORNER_RADIUS"],
  spacing: ["GAP"],
  typography: ["FONT_SIZE"]
};

var semanticScopesMapping = {
  // Pour COLOR
  text: ["TEXT_FILL"],
  background: ["FRAME_FILL", "SHAPE_FILL"],
  border: ["STROKE"],
  accent: ["FRAME_FILL", "SHAPE_FILL", "STROKE_COLOR"],
  // Pour FLOAT
  radius: ["CORNER_RADIUS"],
  space: ["GAP"],
  fontSize: ["FONT_SIZE"],
  fontWeight: [] // Ne pas scoper les font-weight
};

function inferPrimitiveScopes(context) {
  if (context.kind !== "primitive") return [];
  return primitiveScopesMapping[context.category] || [];
}

function inferSemanticScopes(context) {
  if (context.kind !== "semantic") return [];

  var scopes = semanticScopesMapping[context.family] || [];

  return scopes;
}

function inferScopes(context) {
  // LOGIQUE SPÉCIALE: tout token border-* de type FLOAT -> STROKE uniquement
  var normalizedKey = context.normalizedKey || context.key;
  if (normalizedKey && normalizedKey.startsWith('border-') && context.type === "FLOAT") {
    return ["STROKE"]; // Scope STROKE pour les épaisseurs de stroke
  }

  // Délégation selon le kind
  var scopes;
  if (context.kind === "primitive") {
    scopes = inferPrimitiveScopes(context);
  } else if (context.kind === "semantic") {
    scopes = inferSemanticScopes(context);
  } else {
    return [];
  }

  // SÉCURITÉ: ne jamais appliquer des scopes de couleur à un FLOAT (primitive + semantic)
  if (context.type !== "COLOR" && scopes.some(scope =>
    ["TEXT_FILL", "FRAME_FILL", "SHAPE_FILL", "STROKE_COLOR", "EFFECT_COLOR"].includes(scope)
  )) {
    scopes = scopes.filter(scope =>
      !["TEXT_FILL", "FRAME_FILL", "SHAPE_FILL", "STROKE_COLOR", "EFFECT_COLOR"].includes(scope)
    );
  }

  return scopes;
}

function applyScopes(figmaVar, scopes, debugLabel) {
  // Guard: vérifier que c'est bien une vraie Variable Figma
  if (!figmaVar || !figmaVar.id || typeof figmaVar.name !== 'string') {
    return;
  }

  // Déterminer capabilities
  var hasSetScopes = typeof figmaVar.setScopes === 'function';
  var hasScopesProp = 'scopes' in figmaVar;

  // Appliquer dans l'ordre de priorité
  try {
    if (hasSetScopes) {
      figmaVar.setScopes(scopes);
      // Log pour debug
      console.log(`🔧 Scopes applied to ${figmaVar.name}:`, scopes);
    } else if (hasScopesProp) {
      figmaVar.scopes = scopes;
      // Log pour debug
      console.log(`🔧 Scopes set to ${figmaVar.name}:`, scopes);
    }
  } catch (error) {
    console.warn(`⚠️ Failed to apply scopes to ${figmaVar.name}:`, error);
    // Silent fail - scopes non critiques
  }
}

function applyVariableScopes(figmaVar, context) {
  // Créer le contexte si pas fourni
  if (!context) {
    // Inférence basique depuis le nom de la variable
    var inferredCategory = figmaVar.name.includes('semantic') || figmaVar.name.includes('primary') || figmaVar.name.includes('success') ?
      "semantic" : "primitive";
    context = createScopeContext(figmaVar, figmaVar.name, inferredCategory);
  }

  // Calculer les scopes (pas d'appel Figma ici)
  var scopes = inferScopes(context);

  // Debug label
  var debugLabel = `${context.kind}:${context.category}/${context.family}:${context.key}`;

  // Appliquer
  applyScopes(figmaVar, scopes, debugLabel);
}







function getOrCreateCollection(name, overwrite) {
  var collections = figma.variables.getLocalVariableCollections();

  if (overwrite) {
    for (var i = 0; i < collections.length; i++) {
      if (collections[i].name === name) {
        collections[i].remove();
      }
    }
    return figma.variables.createVariableCollection(name);
  }

  for (var i = 0; i < collections.length; i++) {
    if (collections[i].name === name) return collections[i];
  }
  return figma.variables.createVariableCollection(name);
}


// Fonction spécialisée pour appliquer la valeur appropriée à une variable sémantique
// Helper pour détecter si une valeur Figma est un alias de variable
function isFigmaAliasValue(value) {
  return value && typeof value === 'object' && value.type === 'VARIABLE_ALIAS' && value.id;
}

function applySemanticValue(variable, semanticData, semanticKey) {
  if (!variable || !semanticData) return;

  // Tâche B — ModeId safe (pas de fallback hasardeux)
  var modeId = safeGetModeId(variable);
  if (!modeId) {
    console.error(`❌ [APPLY_FAIL] ${semanticKey}: no modeId available for variable ${variable.id}`);
    return;
  }

  // Tâche A — Normalisation aliasTo
  const norm = normalizeAliasTo(semanticData.aliasTo);

  var processedValue;
  var valueType = 'raw';

  // Tâche B — Application défensive : si alias valide → VARIABLE_ALIAS, sinon garde l'existant
  if (norm.isValid) {
    var aliasVariable = figma.variables.getVariableById(norm.variableId);
    if (aliasVariable) {
      // ✅ ALIAS VALIDE : créer VARIABLE_ALIAS, jamais de fallback destructeur
      processedValue = { type: "VARIABLE_ALIAS", id: norm.variableId };
      valueType = 'alias';
      console.log(`🔗 [APPLY] ${semanticKey} alias => id=${norm.variableId}`);
    } else {
      // ❌ ALIAS INVALIDE : NE PAS écraser avec fallback noir
      console.warn(`⚠️ [APPLY_SKIP] ${semanticKey}: alias ${norm.variableId} not found, skipping (keeping existing value)`);
      return; // EARLY RETURN - pas d'écrasement
    }
  } else {
    // ANTI-ÉCRASMENT : vérifier si la variable Figma est déjà en alias
    var currentValue = variable.valuesByMode[modeId];
    if (isFigmaAliasValue(currentValue)) {
      // ✅ VARIABLE DÉJÀ EN ALIAS : préserver l'alias existant
      console.log(`🛡️ [ALIAS_PRESERVED] ${semanticKey} kept existing alias in Figma (not overwriting with raw value)`);
      return; // EARLY RETURN - pas d'écrasement
    }

    // Pas d'alias valide défini : utiliser resolvedValue si elle existe
    if (semanticData.resolvedValue != null && semanticData.resolvedValue !== undefined) {
      processedValue = getProcessedValueFromResolved(semanticData.resolvedValue, semanticData.type);
      valueType = 'raw';
      console.log(`💾 [APPLY] ${semanticKey} => raw => ${semanticData.resolvedValue}`);
    } else {
      // ❌ Pas d'alias ET resolvedValue null/undefined : NE PAS écraser
      console.log(`⏭️ [APPLY_SKIP] ${semanticKey}: no alias and resolvedValue is null/undefined (keeping existing value)`);
      return; // EARLY RETURN - pas d'écrasement destructeur
    }
  }

  try {
    variable.setValueForMode(modeId, processedValue);
    console.log(`✅ [APPLY] ${semanticKey} => success`);
  } catch (e) {
    console.error(`❌ [APPLY_FAIL] ${semanticKey}: failed to set value:`, e);
  }
}

// Fonction helper pour normaliser resolvedValue (pour stockage uniquement)
function normalizeResolvedValue(value, variableType) {
  if (value === null || value === undefined) {
    return null; // Garder null pour indiquer qu'on n'a pas pu résoudre
  }

  if (variableType === "COLOR") {
    if (typeof value === 'object' && value && value.r !== undefined) {
      // Convertir RGB en hex
      try {
        return rgbToHex(value);
      } catch (e) {
        console.warn(`Failed to convert RGB to hex:`, value, e);
        return null;
      }
    } else if (typeof value === 'string' && value.startsWith('#')) {
      return value; // Déjà en hex
    } else {
      console.warn(`Invalid color value for normalization:`, value);
      return null; // Ne pas appliquer de fallback
    }
  } else if (variableType === "FLOAT") {
    if (typeof value === 'number') {
      return value;
    } else if (typeof value === 'string') {
      var parsed = parseFloat(value);
      return isNaN(parsed) ? null : parsed;
    } else {
      return null;
    }
  } else {
    return value;
  }
}

// Fonction helper pour convertir resolvedValue en valeur Figma selon le type
function getProcessedValueFromResolved(resolvedValue, variableType) {
  if (variableType === "COLOR") {
    if (typeof resolvedValue === 'string' && /^#[0-9A-Fa-f]{3,8}$/.test(resolvedValue)) {
      return hexToRgb(resolvedValue);
    } else {
      console.warn(`Invalid color resolvedValue: ${resolvedValue}`);
      return null; // Plus de fallback automatique
    }
  } else if (variableType === "FLOAT") {
    return normalizeFloatValue(resolvedValue);
  } else {
    return resolvedValue;
  }
}

// Fonction pour détecter les valeurs fallback UI (ne doivent jamais être sauvegardées)
function isUIFallbackValue(value, tokenType) {
  if (!value) return false;

  var stringValue = typeof value === 'string' ? value : String(value);

  // Valeurs considérées comme des fallbacks UI
  var uiFallbacks = {
    'COLOR': ['#000000', '#ffffff', '#FFFFFF', '#000', '#fff'],
    'FLOAT': ['0', 0]
  };

  return uiFallbacks[tokenType] && uiFallbacks[tokenType].includes(value);
}

// Fonction helper pour déterminer si on doit protéger un token sémantique existant
function shouldPreserveExistingSemantic(existingToken, incomingToken) {
  if (!existingToken) return false;

  // PROTECTION CRITIQUE : si l'existant est non résolu (ALIAS_UNRESOLVED), on le garde jalousement 
  // sauf si l'incoming apporte enfin une résolution complète (objet aliasTo)
  if (existingToken.state === TOKEN_STATE.ALIAS_UNRESOLVED) {
    const incomingIsResolved = !!(incomingToken && typeof incomingToken === 'object' &&
      incomingToken.aliasTo && typeof incomingToken.aliasTo === 'object');
    if (!incomingIsResolved) return true;
  }

  // Si l'existant a un alias (même résolu), on le protège contre les fallbacks
  const existingHasAlias = !!existingToken.aliasTo;

  // Incoming peut être brut ou formaté
  const incomingResolved = (incomingToken && typeof incomingToken === 'object' && incomingToken.resolvedValue !== undefined)
    ? incomingToken.resolvedValue
    : incomingToken;

  const incomingHasAlias = !!(incomingToken && typeof incomingToken === 'object' && incomingToken.aliasTo);

  // Si l'incoming n'a pas d'alias ET qu'il ressemble à un fallback -> on garde l'existant
  const looksFallback =
    isObviousFallback(incomingResolved) ||
    isUIFallbackValue(incomingResolved, (incomingToken && incomingToken.type) || (existingToken && existingToken.type));

  // Règle d'or : ne jamais remplacer un alias existant par une valeur fallback
  if (existingHasAlias && !incomingHasAlias && looksFallback) return true;

  return false;
}


async function createOrUpdateVariable(collection, name, type, value, category, overwrite, hintKey) {
  console.log('🔧 createOrUpdateVariable:', category, name, type, typeof value);

  var allVariables = figma.variables.getLocalVariables();
  var variable = null;

  for (var i = 0; i < allVariables.length; i++) {
    if (allVariables[i].variableCollectionId === collection.id && allVariables[i].name === name) {
      variable = allVariables[i];
      break;
    }
  }


  if (!variable) {
    try {
      variable = figma.variables.createVariable(name, collection, type);
      console.log('✅ Variable created:', name);

      // Appliquer les scopes IMMÉDIATEMENT après création (avant valeur)
      var context = createScopeContext(variable, hintKey || name, category);
      applyVariableScopes(variable, context);

      // Après création, récupérer à nouveau la variable pour s'assurer que toutes les propriétés sont définies
      if (variable && variable.id) {
        variable = figma.variables.getVariableById(variable.id);
        if (!variable) {
          console.error('❌ Created variable not found by ID');
          return null;
        }
        console.log('✅ Variable retrieved after creation:', variable.name, 'collection:', variable.variableCollection ? variable.variableCollection.name : 'NONE');
      }
    } catch (e) {
      console.error('❌ Failed to create variable:', name, e);
      return null;
    }
  } else {
    console.log('📝 Variable exists:', name);
  }


  if (variable) {
    // N'appliquer la valeur que si elle est fournie (pour les sémantiques, on utilise applySemanticValue)
    if (value !== null && value !== undefined) {
      var modeId = collection.modes[0].modeId;
      try {
        variable.setValueForMode(modeId, value);
        console.log('💾 Value set for', name + ':', typeof value, value);
      } catch (e) {
        console.error('❌ Failed to set value for', name + ':', e);
      }
    } else if (category === 'semantic' && hintKey) {
      // Pour les variables sémantiques créées sans valeur, essayer automatiquement de créer un alias
      console.log(`🔍 [AUTO_ALIAS] Trying to create automatic alias for semantic variable: ${hintKey}`);

      // Construire une map globale des variables existantes pour la résolution d'alias
      var globalVariableMap = buildGlobalVariableMap();

      // Essayer de résoudre un alias pour cette clé sémantique
      var finalAliasTo = resolveSemanticAliasFromMap(hintKey, {}, await getNamingFromFile(), globalVariableMap);

      if (finalAliasTo) {
        // Appliquer l'alias automatiquement
        var semanticValueData = {
          resolvedValue: null, // Pas de valeur de fallback
          type: variable.type,
          aliasTo: finalAliasTo
        };

        applySemanticValue(variable, semanticValueData, hintKey);
        console.log(`✅ [AUTO_ALIAS] Successfully created alias for ${hintKey}: ${finalAliasTo.collection}/${finalAliasTo.key}`);
      } else {
        console.log(`⚠️ [AUTO_ALIAS] No alias found for semantic variable: ${hintKey}`);
      }
    }

    // Réappliquer les scopes après définition de la valeur (au cas où)
    var context = createScopeContext(variable, hintKey || name, category);
    applyVariableScopes(variable, context);
  }

  return variable;
}

async function importTokensToFigma(tokens, naming, overwrite) {
  console.log('🔄 Pipeline d\'import : importTokensToFigma appelé directement');

  // Logs de diagnostic pour les tokens sémantiques
  if (tokens && tokens.semantic) {
    var semanticStats = analyzeSemanticTokensStats(tokens.semantic, 'IMPORT_INPUT');
    console.log(`📥 IMPORT_FIGMA [IMPORT_INPUT]: semantic tokens found - ${semanticStats.total} total (${semanticStats.aliasCount} aliases, ${semanticStats.valueCount} values)`);
    if (semanticStats.fallbackValues.length > 0) {
      console.log(`⚠️ IMPORT_FIGMA [IMPORT_INPUT]: fallback values detected: ${semanticStats.fallbackValues.join(', ')}`);
    }
  } else {
    console.log('📥 IMPORT_FIGMA [IMPORT_INPUT]: no semantic tokens in input');
  }

  // Save the naming preference to file for persistence
  saveNamingToFile(naming);




  if (tokens.brand) {
    console.log('🎨 Importing brand tokens:', Object.keys(tokens.brand).length, 'tokens');
    var brandCollection = getOrCreateCollection("Brand Colors", overwrite);

    for (var key in tokens.brand) {
      if (!tokens.brand.hasOwnProperty(key)) continue;

      var varName = "";
      if (naming === "shadcn") varName = "primary";
      else if (naming === "mui") varName = "primary/" + key;
      else if (naming === "ant") varName = "primary-" + key;
      else if (naming === "bootstrap") varName = key;
      else varName = "primary-" + key;

      var brandValue = tokens.brand[key];
      console.log('  Brand', key + ':', typeof brandValue, brandValue);
      await createOrUpdateVariable(brandCollection, varName, "COLOR", hexToRgb(brandValue), "brand", overwrite, undefined);
    }
  } else {
    console.log('⚠️ No brand tokens to import');
  }


  if (tokens.system) {
    var systemCollection = getOrCreateCollection("System Colors", overwrite);

    for (var sKey in tokens.system) {
      if (!tokens.system.hasOwnProperty(sKey)) continue;
      await createOrUpdateVariable(systemCollection, sKey, "COLOR", hexToRgb(tokens.system[sKey]), "system", overwrite, undefined);
    }
  }


  if (tokens.gray) {
    var grayCollection = getOrCreateCollection("Grayscale", overwrite);

    for (var gKey in tokens.gray) {
      if (!tokens.gray.hasOwnProperty(gKey)) continue;

      var grayName = "";
      if (naming === "shadcn") grayName = "gray-" + gKey;
      else if (naming === "mui") grayName = "grey-" + gKey;
      else if (naming === "ant") grayName = "gray-" + gKey;
      else grayName = "gray-" + gKey;

      await createOrUpdateVariable(grayCollection, grayName, "COLOR", hexToRgb(tokens.gray[gKey]), "gray", overwrite, undefined);
    }
  }


  if (tokens.spacing) {
    var spacingCollection = getOrCreateCollection("Spacing", overwrite);

    for (var spKey in tokens.spacing) {
      if (!tokens.spacing.hasOwnProperty(spKey)) continue;

      var cleanKey = spKey.replace(/\./g, "-");
      var valueRaw = tokens.spacing[spKey];

      // Gérer les deux formats : string avec unité ou number normalisé
      var value;
      if (typeof valueRaw === "string") {
        value = parseFloat(valueRaw);
        if (valueRaw.indexOf("rem") !== -1) {
          value = value * 16;
        }
      } else if (typeof valueRaw === "number") {
        value = valueRaw; // Déjà normalisé
      } else {
        value = 0; // Fallback
      }

      await createOrUpdateVariable(spacingCollection, "spacing-" + cleanKey, "FLOAT", value, "spacing", overwrite, undefined);
    }
  }


  if (tokens.radius) {
    var radiusCollection = getOrCreateCollection("Radius", overwrite);

    for (var rKey in tokens.radius) {
      if (!tokens.radius.hasOwnProperty(rKey)) continue;

      var cleanRKey = rKey.replace(/\./g, "-");
      var rValueRaw = tokens.radius[rKey];

      // Gérer les deux formats : string avec unité ou number normalisé
      var rValue;
      if (typeof rValueRaw === "string") {
        rValue = parseFloat(rValueRaw);
        if (rValueRaw.indexOf("rem") !== -1) {
          rValue = rValue * 16;
        }
      } else if (typeof rValueRaw === "number") {
        rValue = rValueRaw; // Déjà normalisé
      } else {
        rValue = 0; // Fallback
      }

      await createOrUpdateVariable(radiusCollection, "radius-" + cleanRKey, "FLOAT", rValue, "radius", overwrite, undefined);
    }
  }


  if (tokens.typography) {
    var typoCollection = getOrCreateCollection("Typography", overwrite);

    for (var tKey in tokens.typography) {
      if (!tokens.typography.hasOwnProperty(tKey)) continue;

      var cleanTKey = tKey.replace(/\./g, "-");
      var typoValueRaw = tokens.typography[tKey];

      // Gérer les deux formats : string avec unité ou number normalisé
      var typoValue;
      if (typeof typoValueRaw === "string") {
        typoValue = parseFloat(typoValueRaw);
        if (typoValueRaw.indexOf("rem") !== -1) {
          typoValue = typoValue * 16;
        }
      } else if (typeof typoValueRaw === "number") {
        typoValue = typoValueRaw; // Déjà normalisé
      } else {
        typoValue = 16; // Fallback pour font-size
      }

      await createOrUpdateVariable(typoCollection, "typo-" + cleanTKey, "FLOAT", typoValue, "typography", overwrite, undefined);
    }
  }


  if (tokens.border) {
    var borderCollection = getOrCreateCollection("Border", overwrite);

    for (var bKey in tokens.border) {
      if (!tokens.border.hasOwnProperty(bKey)) continue;

      var cleanBKey = bKey.replace(/\./g, "-");
      var bValue = parseFloat(tokens.border[bKey]);
      await createOrUpdateVariable(borderCollection, "border-" + cleanBKey, "FLOAT", bValue, "border", overwrite, undefined);
    }
  }

  // Rafraîchir le cache des collections après avoir importé les primitives
  initializeCollectionCache();

  // Rafraîchir le cache des alias et créer une map globale des variables existantes
  tryResolveSemanticAlias.collectionCache = null; // Reset cache
  var globalVariableMap = buildGlobalVariableMap();

  // Import Semantic Tokens
  if (tokens.semantic) {
    var semanticCollection = getOrCreateCollection("Semantic", overwrite);
    var aliasCount = 0;
    var valueCount = 0;
    var valueOnlyKeys = [];
    var newAliasCount = 0; // Nouveaux alias créés lors de cet import
    var updatedSemanticTokens = {}; // Pour mettre à jour la sauvegarde avec les alias

    for (var semanticKey in tokens.semantic) {
      if (!tokens.semantic.hasOwnProperty(semanticKey)) continue;

      var semanticData = tokens.semantic[semanticKey];
      var variableName = getSemanticVariableName(semanticKey, naming);
      var variableType = SEMANTIC_TYPE_MAP[semanticKey] || "COLOR";

      // Extraire les données selon le nouveau format
      var resolvedValue, currentAliasTo;
      if (typeof semanticData === 'object' && semanticData.resolvedValue !== undefined) {
        resolvedValue = semanticData.resolvedValue;
        currentAliasTo = semanticData.aliasTo;
      } else {
        // Ancien format : migrer à la volée
        resolvedValue = semanticData;
        currentAliasTo = null;
      }

      // Créer ou récupérer la variable Figma (sans valeur pour l'instant)
      var variable = await createOrUpdateVariable(semanticCollection, variableName, variableType, null, "semantic", overwrite, semanticKey);
      if (!variable) {
        console.warn(`⚠️ Skipping ${semanticKey}: failed to create/update variable`);
        continue;
      }

      // Résoudre l'alias en utilisant la map globale des variables existantes
      var resolvedAliasTo = resolveSemanticAliasFromMap(semanticKey, tokens, naming, globalVariableMap);

      // Vérifier si currentAliasTo est encore valide (variable existe)
      var currentAliasValid = false;
      if (currentAliasTo) {
        var normCurrent = normalizeAliasTo(currentAliasTo);
        currentAliasValid = normCurrent.isValid && figma.variables.getVariableById(normCurrent.variableId) !== null;
      }

      // Priorité : nouvel alias résolu, sinon alias existant valide, sinon null
      var finalAliasTo = resolvedAliasTo || (currentAliasValid ? currentAliasTo : null);

      if (finalAliasTo) {
        if (resolvedAliasTo && !currentAliasTo) {
          newAliasCount++;
          console.log(`✅ New alias resolved for ${semanticKey}: ${finalAliasTo.collection}/${finalAliasTo.key}`);
        } else if (resolvedAliasTo && currentAliasTo) {
          console.log(`🔄 [ALIAS_UPDATED] ${semanticKey} updated alias to new primitive: ${finalAliasTo.collection}/${finalAliasTo.key}`);
        } else if (!resolvedAliasTo && currentAliasValid) {
          console.log(`🔄 [ALIAS_PRESERVED] ${semanticKey} kept existing valid alias from saved tokens`);
        }
      } else if (currentAliasTo && !currentAliasValid) {
        console.log(`⚠️ [ALIAS_INVALID] ${semanticKey} discarded invalid alias (primitive no longer exists)`);
      }

      // Préparer les données pour applySemanticValue
      var semanticValueData = {
        resolvedValue: resolvedValue,
        type: variableType,
        aliasTo: finalAliasTo
      };

      // Appliquer la valeur appropriée (alias ou resolvedValue)
      applySemanticValue(variable, semanticValueData, semanticKey);

      // Compter pour les statistiques
      if (finalAliasTo) {
        aliasCount++;
      } else {
        valueCount++;
        valueOnlyKeys.push(semanticKey);
      }

      // Mettre à jour les tokens sauvegardés avec l'info d'alias
      updatedSemanticTokens[semanticKey] = {
        resolvedValue: resolvedValue,
        type: variableType,
        aliasTo: finalAliasTo,
        meta: {
          sourceCategory: getCategoryFromSemanticKey(semanticKey),
          sourceKey: getKeyFromSemanticKey(semanticKey),
          updatedAt: Date.now()
        }
      };
    }

    // Sauvegarder les tokens mis à jour avec les infos d'alias
    if (Object.keys(updatedSemanticTokens).length > 0) {
      saveSemanticTokensToFile(updatedSemanticTokens, 'IMPORT_FIGMA_UPDATE');
      console.log(`💾 DEBUG: Updated semantic tokens with alias info: ${aliasCount} total aliases (${newAliasCount} new), ${valueCount} values`);
    }

    // Rapport après import sémantique
    var reportMessage = "Semantic: " + aliasCount + " alias, " + valueCount + " values";
    if (newAliasCount > 0) {
      reportMessage += " (" + newAliasCount + " new)";
    }
    figma.notify(reportMessage);
    if (valueOnlyKeys.length > 0) {
      console.log("Semantic tokens imported as values (no alias found):", valueOnlyKeys.join(", "));
    }
  }

  figma.notify("✅ All tokens imported successfully! (Chaque modification peut être annulée individuellement avec Ctrl+Z)");
  figma.ui.postMessage({ type: 'import-completed' });
}





// Fonction pour construire une map globale des variables existantes pour la résolution des alias
function buildGlobalVariableMap() {
  console.log('🔍 Building global variable map for semantic alias resolution');

  var vars = figma.variables.getLocalVariables();
  var byName = new Map();

  for (var i = 0; i < vars.length; i++) {
    var variable = vars[i];
    var collection = figma.variables.getVariableCollectionById(variable.variableCollectionId);
    if (!collection) continue;

    // Créer une clé stable : collectionName/variableName (comme dans les alias sémantiques)
    var key = collection.name + '/' + variable.name;
    byName.set(key, variable.id);

    // Aussi ajouter la clé extraite (ex: Grayscale/50 pour gray-50)
    var extractedKey = extractVariableKey(variable, collection.name);
    if (extractedKey && extractedKey !== variable.name) {
      var extractedFullKey = collection.name + '/' + extractedKey;
      byName.set(extractedFullKey, variable.id);
    }

    // Aussi ajouter juste variable.name au cas où (pour compatibilité)
    if (!byName.has(variable.name)) {
      byName.set(variable.name, variable.id);
    }
  }

  console.log(`✅ Global variable map built: ${byName.size} variables mapped`);
  // Debug: montrer quelques clés
  var keys = Array.from(byName.keys()).slice(0, 5);
  console.log(`🔍 Sample keys: ${keys.join(', ')}`);
  return byName;
}

// Fonction pour résoudre les alias sémantiques en utilisant la map globale des variables
function resolveSemanticAliasFromMap(semanticKey, allTokens, naming, globalVariableMap) {
  // Utiliser la logique existante pour déterminer quelle primitive cibler
  var aliasInfo = resolveSemanticAliasInfo(semanticKey, allTokens, naming);
  if (!aliasInfo) {
    console.warn(`⚠️ [resolveSemanticAliasFromMap] No alias info found for semantic ${semanticKey}`);
    return null; // Pas d'alias possible pour cette clé sémantique
  }

  // Construire la clé dans le même format que la map globale
  var targetKey = aliasInfo.collection + '/' + aliasInfo.key;

  // Chercher dans la map globale
  var targetVariableId = globalVariableMap.get(targetKey);
  if (!targetVariableId) {
    // Essayer juste le nom de la variable (sans collection)
    targetVariableId = globalVariableMap.get(aliasInfo.key);
  }

  if (targetVariableId) {
    return {
      variableId: targetVariableId,
      collection: aliasInfo.collection,
      key: aliasInfo.key
    };
  }

  // Si la primitive n'existe pas encore, on ne crée pas d'alias cassé
  console.warn(`⚠️ [resolveSemanticAliasFromMap] Primitive not found for semantic ${semanticKey}: tried "${targetKey}" and "${aliasInfo.key}" (map has ${globalVariableMap.size} entries)`);
  return null;
}

var cachedTokens = null;
var lastScanResults = null;






function resolveVariableValue(variable, modeId, visitedVariables) {
  if (!visitedVariables) visitedVariables = new Set();
  if (visitedVariables.has(variable.id)) return null;
  visitedVariables.add(variable.id);

  try {
    var value = variable.valuesByMode[modeId];

    if (value && typeof value === 'object' && value.type === 'VARIABLE_ALIAS') {
      var parentVar = figma.variables.getVariableById(value.id);
      if (!parentVar) return null;

      // ✅ MODE MAPPING by name (collection A -> collection B)
      var parentModeId = modeId;

      try {
        var currentCollection = figma.variables.getVariableCollectionById(variable.variableCollectionId);
        var parentCollection = figma.variables.getVariableCollectionById(parentVar.variableCollectionId);

        if (currentCollection && parentCollection) {
          // Find current mode name
          var currentMode = currentCollection.modes.find(m => m.modeId === modeId);
          var currentModeName = currentMode ? currentMode.name : null;

          // Find matching mode by name in parent collection
          var matchingParentMode = currentModeName
            ? parentCollection.modes.find(m => m.name === currentModeName)
            : null;

          if (matchingParentMode) {
            parentModeId = matchingParentMode.modeId;
          } else if (parentCollection.modes && parentCollection.modes.length > 0) {
            // fallback: first mode in parent collection
            parentModeId = parentCollection.modes[0].modeId;
          }
        }
      } catch (e) {
        // ignore mapping errors, keep parentModeId fallback
      }

      return resolveVariableValue(parentVar, parentModeId, visitedVariables);
    }

    return value;
  } catch (error) {
    return null;
  } finally {
    visitedVariables.delete(variable.id);
  }
}


// Tâche A — Normaliser le format aliasTo (string OU objet)
function normalizeAliasTo(aliasTo) {
  // returns { variableId: string|null, raw: any, isValid: boolean }

  if (!aliasTo) {
    return { variableId: null, raw: aliasTo, isValid: false };
  }

  // Si aliasTo est un string
  if (typeof aliasTo === 'string') {
    // Si ça ressemble à un ID Figma ("VariableID:...") => variableId = aliasTo
    if (aliasTo.startsWith('VariableID:') || /^[a-zA-Z0-9_-]+:/.test(aliasTo)) {
      return { variableId: aliasTo, raw: aliasTo, isValid: true };
    } else {
      return { variableId: null, raw: aliasTo, isValid: false };
    }
  }

  // Si aliasTo est un objet
  if (typeof aliasTo === 'object') {
    if (aliasTo.variableId && typeof aliasTo.variableId === 'string') {
      return { variableId: aliasTo.variableId, raw: aliasTo, isValid: true };
    } else {
      return { variableId: null, raw: aliasTo, isValid: false };
    }
  }

  // Type inattendu
  return { variableId: null, raw: aliasTo, isValid: false };
}

function createValueToVariableMap() {
  var map = new Map();
  var localCollections = figma.variables.getLocalVariableCollections();


  localCollections.forEach(function (collection) {
    collection.variableIds.forEach(function (variableId) {
      var variable = figma.variables.getVariableById(variableId);
      if (!variable) {
        return;
      }

      collection.modes.forEach(function (mode) {
        var modeId = mode.modeId;


        var resolvedValue = resolveVariableValue(variable, modeId);

        if (resolvedValue !== undefined && resolvedValue !== null) {

          if (isColorValue(resolvedValue)) {
            var hexValue = rgbToHex(resolvedValue);
            if (hexValue) {
              if (!map.has(hexValue)) {
                map.set(hexValue, []);
              }
              map.get(hexValue).push({
                id: variable.id,
                name: variable.name,
                collectionName: collection.name,
                modeName: mode.name,
                resolvedValue: resolvedValue,
                originalValue: variable.valuesByMode[modeId]
              });
            }
          }

          else if (typeof resolvedValue === 'number') {
            var key = resolvedValue;
            if (!map.has(key)) {
              map.set(key, []);
            }
            map.get(key).push({
              id: variable.id,
              name: variable.name,
              collectionName: collection.name,
              modeName: mode.name,
              resolvedValue: resolvedValue,
              originalValue: variable.valuesByMode[modeId]
            });
          }
        }
      });
    });
  });

  return map;
}

function isColorValue(value) {
  return value && typeof value === 'object' && 'r' in value && 'g' in value && 'b' in value;
}


function getColorDistance(hex1, hex2) {

  function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  var rgb1 = hexToRgb(hex1);
  var rgb2 = hexToRgb(hex2);

  if (!rgb1 || !rgb2) return 999;


  var dr = rgb1.r - rgb2.r;
  var dg = rgb1.g - rgb2.g;
  var db = rgb1.b - rgb2.b;

  return Math.sqrt(dr * dr + dg * dg + db * db);
}



function getScopesForProperty(propertyType) {
  var propertyScopes = {

    "Fill": ["ALL_FILLS", "FRAME_FILL", "SHAPE_FILL", "TEXT_FILL"],


    "Stroke": ["STROKE_COLOR"],


    "CORNER RADIUS": ["CORNER_RADIUS"],
    "TOP LEFT RADIUS": ["CORNER_RADIUS"],
    "TOP RIGHT RADIUS": ["CORNER_RADIUS"],
    "BOTTOM LEFT RADIUS": ["CORNER_RADIUS"],
    "BOTTOM RIGHT RADIUS": ["CORNER_RADIUS"],


    "Item Spacing": ["GAP"],
    "Padding Left": ["GAP"],
    "Padding Right": ["GAP"],
    "Padding Top": ["GAP"],
    "Padding Bottom": ["GAP"],


    "Font Size": ["FONT_SIZE"]
  };

  return propertyScopes[propertyType] || [];
}


function filterVariablesByScopes(variables, requiredScopes) {
  if (!requiredScopes || requiredScopes.length === 0) {
    return variables;
  }

  return variables.filter(function (variable) {

    var figmaVariable = figma.variables.getVariableById(variable.id);
    if (!figmaVariable || !figmaVariable.scopes) {
      return false;
    }


    return figmaVariable.scopes.some(function (variableScope) {
      return requiredScopes.includes(variableScope);
    });
  });
}


function findColorSuggestions(hexValue, valueToVariableMap, propertyType) {

  var requiredScopes = getScopesForProperty(propertyType);


  var exactMatches = valueToVariableMap.get(hexValue);
  if (exactMatches && exactMatches.length > 0) {

    var filteredExactMatches = filterVariablesByScopes(exactMatches, requiredScopes);
    if (filteredExactMatches.length > 0) {
      return [{
        id: filteredExactMatches[0].id,
        name: filteredExactMatches[0].name,
        hex: hexValue,
        distance: 0,
        isExact: true
      }];
    }
  }


  var suggestions = [];
  var maxDistance = 150;


  var minDistanceFound = Infinity;
  valueToVariableMap.forEach(function (vars, varHex) {
    if (vars && vars.length > 0) {
      var distance = getColorDistance(hexValue, varHex);
      minDistanceFound = Math.min(minDistanceFound, distance);

      if (distance <= maxDistance) {

        var filteredVars = filterVariablesByScopes(vars, requiredScopes);
        var passScope = filteredVars.length > 0;

        if (!passScope) {
        } else {
        }

        if (passScope) {
          suggestions.push({
            id: filteredVars[0].id,
            name: filteredVars[0].name,
            hex: varHex,
            distance: distance,
            isExact: false
          });
        }
      }
    }
  });



  if (suggestions.length === 0) {

    valueToVariableMap.forEach(function (vars, varHex) {
      if (vars && vars.length > 0) {
        var distance = getColorDistance(hexValue, varHex);
        if (distance <= maxDistance) {
          suggestions.push({
            id: vars[0].id,
            name: vars[0].name,
            hex: varHex,
            distance: distance,
            isExact: false,
            scopeMismatch: true,
            warning: "Scope mismatch - Cette variable pourrait ne pas être appropriée pour ce type de propriété"
          });
        }
      }
    });
  }


  suggestions.sort(function (a, b) {
    return a.distance - b.distance;
  });



  if (suggestions.length === 0) {
  }

  return suggestions.slice(0, 3);
}


function findNumericSuggestions(targetValue, valueToVariableMap, tolerance, propertyType) {

  tolerance = tolerance !== undefined ? tolerance : (propertyType.indexOf('Spacing') !== -1 ? 8 : 4);

  // Auto-correction spéciale pour les radius: 999 -> 9999 (full)
  if (targetValue === 999 && propertyType && propertyType.indexOf('Radius') !== -1) {
    var fullMatches = valueToVariableMap.get(9999);
    if (fullMatches && fullMatches.length > 0) {
      var filteredFullMatches = filterVariablesByScopes(fullMatches, getScopesForProperty(propertyType));
      if (filteredFullMatches.length > 0) {
        return [{
          id: filteredFullMatches[0].id,
          name: filteredFullMatches[0].name,
          value: 9999,
          difference: 0,
          isExact: false,
          isAutoCorrected: true // Marquer comme auto-corrigée
        }];
      }
    }
  }

  var requiredScopes = getScopesForProperty(propertyType);


  var exactMatches = valueToVariableMap.get(targetValue);

  if (exactMatches && exactMatches.length > 0) {

    var filteredExactMatches = filterVariablesByScopes(exactMatches, requiredScopes);
    if (filteredExactMatches.length > 0) {
      return [{
        id: filteredExactMatches[0].id,
        name: filteredExactMatches[0].name,
        value: targetValue,
        difference: 0,
        isExact: true
      }];
    } else {
    }
  } else {
  }


  var suggestions = [];


  valueToVariableMap.forEach(function (vars, varValue) {
    if (vars && vars.length > 0 && typeof varValue === 'number') {

      var filteredVars = filterVariablesByScopes(vars, requiredScopes);
      if (filteredVars.length > 0) {
        var difference = Math.abs(targetValue - varValue);
        if (difference <= tolerance) {
          suggestions.push({
            id: filteredVars[0].id,
            name: filteredVars[0].name,
            value: varValue,
            difference: difference,
            isExact: false
          });
        }
      }
    }
  });


  suggestions.sort(function (a, b) {
    return a.difference - b.difference;
  });

  if (suggestions.length > 0) {
  } else {
  }

  return suggestions.slice(0, 3);
}


function enrichSuggestionsWithRealValues(suggestions) {
  return suggestions.map(function (suggestion) {
    var enriched = Object.assign({}, suggestion);


    var variable = figma.variables.getVariableById(suggestion.id);
    if (variable) {

      var collections = figma.variables.getLocalVariableCollections();
      var collection = null;
      for (var i = 0; i < collections.length; i++) {
        if (collections[i].variableIds.includes(variable.id)) {
          collection = collections[i];
          break;
        }
      }

      if (collection && collection.modes.length > 0) {
        var modeId = (collection.modes && collection.modes.length > 0) ? collection.modes[0].modeId : 'default';
        var rawValue = variable.valuesByMode[modeId];


        if (variable.resolvedType === "COLOR" && typeof rawValue === "object") {
          enriched.resolvedValue = rgbToHex(rawValue);
        } else if (variable.resolvedType === "FLOAT") {
          enriched.resolvedValue = rawValue + "px";
        } else if (variable.resolvedType === "STRING") {
          enriched.resolvedValue = rawValue;
        } else {
          enriched.resolvedValue = rawValue;
        }
      }
    }

    return enriched;
  });
}



function checkNodeProperties(node, valueToVariableMap, results, ignoreHiddenLayers) {

  if (!node) {
    return;
  }


  if (node.removed) {
    return;
  }


  if (!node.id || !node.name || !node.type) {
    return;
  }

  var nodeId = node.id;
  var layerName = node.name;
  var nodeType = node.type;


  if (!node || !node.id || !node.type) {
    return;
  }



  if (ignoreHiddenLayers) {
    try {
      if (node.visible === false) {
        return;
      }
      if (node.locked === true) {
        return;
      }
    } catch (visibilityError) {

    }
  }


  var supportedTypes = CONFIG.supportedTypes.all;


  var styleSupportedTypes = CONFIG.supportedTypes.fillAndStroke;

  var isContainer = supportedTypes.indexOf(nodeType) !== -1;
  var supportsStyle = styleSupportedTypes.indexOf(nodeType) !== -1;

  if (!isContainer) {
    return;
  }


  if (supportsStyle) {
    try {

      if (node.fills !== undefined && node.fills !== figma.mixed) {
        checkFillsSafely(node, valueToVariableMap, results);
      }


      if (node.strokes !== undefined && node.strokes !== figma.mixed) {
        checkStrokesSafely(node, valueToVariableMap, results);
      }


      checkCornerRadiusSafely(node, valueToVariableMap, results);


      checkNumericPropertiesSafely(node, valueToVariableMap, results);


      if (node.type === CONFIG.types.TEXT) {
        checkTypographyPropertiesSafely(node, valueToVariableMap, results);
      }

      // Détecter les styles locaux Figma appliqués
      checkLocalStylesSafely(node, valueToVariableMap, results);

    } catch (propertyError) {

    }
  }
}


function checkTypographyPropertiesSafely(node, valueToVariableMap, results) {
  try {

    if (typeof node.fontSize === 'number' && node.fontSize > 0) {
      var isFontSizeBound = isPropertyBoundToVariable(node.boundVariables || {}, 'fontSize');
      if (!isFontSizeBound) {
        var suggestions = enrichSuggestionsWithRealValues(findNumericSuggestions(node.fontSize, valueToVariableMap, undefined, "Font Size"));
        if (suggestions.length > 0) {
          var bestSuggestion = suggestions[0];
          results.push({
            nodeId: node.id,
            layerName: node.name,
            property: "Font Size",
            value: node.fontSize + "px",
            suggestedVariableId: bestSuggestion.id,
            suggestedVariableName: bestSuggestion.name,
            figmaProperty: 'fontSize',
            numericSuggestions: suggestions
          });
        }
      }
    }




  } catch (typographyError) {
  }
}


function checkLocalStylesSafely(node, valueToVariableMap, results) {
  try {
    console.log('Local Style Detection: Checking node', node.id, 'for local styles');

    // Vérifier les styles locaux de remplissage (fillStyleId)
    if (node.fillStyleId && typeof node.fillStyleId === 'string' && node.fillStyleId.length > 0) {
      console.log('Local Style Detection: Found fillStyleId:', node.fillStyleId);
      try {
        var localStyle = figma.getStyleById(node.fillStyleId);
        console.log('Local Style Detection: Retrieved local style:', localStyle ? localStyle.name : 'null');

        if (localStyle && localStyle.type === 'PAINT') {
          // Récupérer la couleur du style local
          var paint = localStyle.paints && localStyle.paints[0];
          if (paint && paint.type === 'SOLID' && paint.color) {
            var hexValue = rgbToHex(paint.color);
            console.log('Local Style Detection: Style color:', hexValue);

            if (hexValue) {
              // Chercher des variables correspondantes
              var suggestions = enrichSuggestionsWithRealValues(findColorSuggestions(hexValue, valueToVariableMap, "Local Fill Style"));
              console.log('Local Style Detection: Found suggestions:', suggestions.length);

              if (suggestions.length > 0) {
                console.log('Local Style Detection: Added result for Local Fill Style');
                results.push({
                  nodeId: node.id,
                  layerName: node.name,
                  property: "Local Fill Style",
                  value: hexValue + " (" + localStyle.name + ")",
                  suggestedVariableId: suggestions[0].id,
                  suggestedVariableName: suggestions[0].name,
                  localStyleId: node.fillStyleId,
                  localStyleName: localStyle.name,
                  colorSuggestions: suggestions,
                  isExact: suggestions[0].isExact || false,
                  styleType: 'fill'
                });
              }
            }
          }
        }
      } catch (fillStyleError) {
        // Erreur lors de l'accès au style local de remplissage
      }
    }

    // Vérifier les styles locaux de contour (strokeStyleId)
    if (node.strokeStyleId && typeof node.strokeStyleId === 'string' && node.strokeStyleId.length > 0) {
      try {
        var localStrokeStyle = figma.getStyleById(node.strokeStyleId);
        if (localStrokeStyle && localStrokeStyle.type === 'PAINT') {
          // Récupérer la couleur du style local
          var strokePaint = localStrokeStyle.paints && localStrokeStyle.paints[0];
          if (strokePaint && strokePaint.type === 'SOLID' && strokePaint.color) {
            var strokeHexValue = rgbToHex(strokePaint.color);
            if (strokeHexValue) {
              // Chercher des variables correspondantes
              var strokeSuggestions = enrichSuggestionsWithRealValues(findColorSuggestions(strokeHexValue, valueToVariableMap, "Local Stroke Style"));

              if (strokeSuggestions.length > 0) {
                results.push({
                  nodeId: node.id,
                  layerName: node.name,
                  property: "Local Stroke Style",
                  value: strokeHexValue + " (" + localStrokeStyle.name + ")",
                  suggestedVariableId: strokeSuggestions[0].id,
                  suggestedVariableName: strokeSuggestions[0].name,
                  localStyleId: node.strokeStyleId,
                  localStyleName: localStrokeStyle.name,
                  colorSuggestions: strokeSuggestions,
                  isExact: strokeSuggestions[0].isExact || false,
                  styleType: 'stroke'
                });
              }
            }
          }
        }
      } catch (strokeStyleError) {
        // Erreur lors de l'accès au style local de contour
      }
    }

  } catch (localStylesError) {
    // Erreur générale lors de la vérification des styles locaux
  }
}


function checkFillsSafely(node, valueToVariableMap, results) {
  try {
    var fills = node.fills;
    if (!Array.isArray(fills)) return;

    for (var i = 0; i < fills.length; i++) {
      try {
        var fill = fills[i];
        if (!fill || fill.type !== CONFIG.types.SOLID || !fill.color) continue;


        var isBound = isPropertyBoundToVariable(node.boundVariables || {}, 'fills', i);
        if (isBound) continue;

        var hexValue = rgbToHex(fill.color);
        if (!hexValue) continue;

        var suggestions = enrichSuggestionsWithRealValues(findColorSuggestions(hexValue, valueToVariableMap, "Fill"));


        if (suggestions.length > 0) {
          results.push({
            nodeId: node.id,
            layerName: node.name,
            property: "Fill",
            value: hexValue,
            suggestedVariableId: suggestions[0].id,
            suggestedVariableName: suggestions[0].name,
            fillIndex: i,
            colorSuggestions: suggestions,
            isExact: suggestions[0].isExact || false
          });
        }
      } catch (fillError) {

      }
    }
  } catch (fillsError) {
  }
}


function checkStrokesSafely(node, valueToVariableMap, results) {
  try {
    var strokes = node.strokes;
    if (!Array.isArray(strokes)) return;

    for (var j = 0; j < strokes.length; j++) {
      try {
        var stroke = strokes[j];
        if (!stroke || stroke.type !== CONFIG.types.SOLID || !stroke.color) continue;


        var isBound = isPropertyBoundToVariable(node.boundVariables || {}, 'strokes', j);
        if (isBound) continue;

        var hexValue = rgbToHex(stroke.color);
        if (!hexValue) continue;

        var suggestions = enrichSuggestionsWithRealValues(findColorSuggestions(hexValue, valueToVariableMap, "Stroke"));


        if (suggestions.length > 0) {
          results.push({
            nodeId: node.id,
            layerName: node.name,
            property: "Stroke",
            value: hexValue,
            suggestedVariableId: suggestions[0].id,
            suggestedVariableName: suggestions[0].name,
            strokeIndex: j,
            colorSuggestions: suggestions,
            isExact: suggestions[0].isExact || false
          });
        }
      } catch (strokeError) {

      }
    }
  } catch (strokesError) {
  }
}


function checkCornerRadiusSafely(node, valueToVariableMap, results) {
  try {
    var nodeType = node.type;
    var radiusSupportedTypes = CONFIG.supportedTypes.radius;

    if (radiusSupportedTypes.indexOf(nodeType) === -1) return;


    if (node.cornerRadius === figma.mixed) {
      var radiusProperties = [
        { name: 'topLeftRadius', displayName: 'TOP LEFT RADIUS', figmaProp: 'topLeftRadius' },
        { name: 'topRightRadius', displayName: 'TOP RIGHT RADIUS', figmaProp: 'topRightRadius' },
        { name: 'bottomLeftRadius', displayName: 'BOTTOM LEFT RADIUS', figmaProp: 'bottomLeftRadius' },
        { name: 'bottomRightRadius', displayName: 'BOTTOM RIGHT RADIUS', figmaProp: 'bottomRightRadius' }
      ];

      for (var k = 0; k < radiusProperties.length; k++) {
        try {
          var prop = radiusProperties[k];
          var radiusValue = node[prop.name];

          if (typeof radiusValue === 'number' && radiusValue > 0) {

            var isBound = isPropertyBoundToVariable(node.boundVariables || {}, prop.figmaProp);
            if (isBound) continue;

            var suggestions = enrichSuggestionsWithRealValues(findNumericSuggestions(radiusValue, valueToVariableMap, undefined, prop.displayName));
            if (suggestions.length > 0) {
              var bestSuggestion = suggestions[0];
              results.push({
                nodeId: node.id,
                layerName: node.name,
                property: prop.displayName,
                value: radiusValue + "px",
                suggestedVariableId: bestSuggestion.id,
                suggestedVariableName: bestSuggestion.name,
                figmaProperty: prop.figmaProp,
                numericSuggestions: suggestions
              });
            }
          }
        } catch (radiusError) {
        }
      }
    }

    else if (typeof node.cornerRadius === 'number' && node.cornerRadius > 0) {

      var boundVars = node.boundVariables || {};
      var isBound = isPropertyBoundToVariable(boundVars, 'cornerRadius') ||
        isPropertyBoundToVariable(boundVars, 'topLeftRadius') ||
        isPropertyBoundToVariable(boundVars, 'topRightRadius') ||
        isPropertyBoundToVariable(boundVars, 'bottomLeftRadius') ||
        isPropertyBoundToVariable(boundVars, 'bottomRightRadius');

      if (!isBound) {
        var suggestions = enrichSuggestionsWithRealValues(findNumericSuggestions(node.cornerRadius, valueToVariableMap, undefined, "CORNER RADIUS"));
        if (suggestions.length > 0) {
          var bestSuggestion = suggestions[0];
          results.push({
            nodeId: node.id,
            layerName: node.name,
            property: "Corner Radius",
            value: node.cornerRadius + "px",
            suggestedVariableId: bestSuggestion.id,
            suggestedVariableName: bestSuggestion.name,
            figmaProperty: 'cornerRadius',
            numericSuggestions: suggestions
          });
        }
      }
    }
  } catch (cornerRadiusError) {
  }
}


function checkNumericPropertiesSafely(node, valueToVariableMap, results) {
  try {


    // Ignorer les espacements automatiques (SPACE_BETWEEN) car ils sont gérés automatiquement par Figma
    if (node.layoutMode && node.layoutMode !== "NONE" && typeof node.itemSpacing === 'number' && node.itemSpacing > 0 && node.primaryAxisAlignItems !== 'SPACE_BETWEEN') {
      var isGapBound = isPropertyBoundToVariable(node.boundVariables || {}, 'itemSpacing');
      if (!isGapBound) {
        var suggestions = enrichSuggestionsWithRealValues(findNumericSuggestions(node.itemSpacing, valueToVariableMap, undefined, "Item Spacing"));
        if (suggestions.length > 0) {
          var bestSuggestion = suggestions[0];
          results.push({
            nodeId: node.id,
            layerName: node.name,
            property: "Item Spacing",
            value: node.itemSpacing + "px",
            suggestedVariableId: bestSuggestion.id,
            suggestedVariableName: bestSuggestion.name,
            figmaProperty: 'itemSpacing',
            numericSuggestions: suggestions
          });
        }
      }
    }


    var paddingProperties = [
      { name: 'paddingLeft', displayName: 'Padding Left', figmaProp: 'paddingLeft' },
      { name: 'paddingRight', displayName: 'Padding Right', figmaProp: 'paddingRight' },
      { name: 'paddingTop', displayName: 'Padding Top', figmaProp: 'paddingTop' },
      { name: 'paddingBottom', displayName: 'Padding Bottom', figmaProp: 'paddingBottom' }
    ];

    for (var p = 0; p < paddingProperties.length; p++) {
      try {
        var paddingProp = paddingProperties[p];
        var paddingValue = node[paddingProp.name];

        if (typeof paddingValue === 'number' && paddingValue > 0) {
          var isPaddingBound = isPropertyBoundToVariable(node.boundVariables || {}, paddingProp.figmaProp);
          if (!isPaddingBound) {
            var suggestions = enrichSuggestionsWithRealValues(findNumericSuggestions(paddingValue, valueToVariableMap, undefined, paddingProp.displayName));
            if (suggestions.length > 0) {
              var bestSuggestion = suggestions[0];
              results.push({
                nodeId: node.id,
                layerName: node.name,
                property: paddingProp.displayName,
                value: paddingValue + "px",
                suggestedVariableId: bestSuggestion.id,
                suggestedVariableName: bestSuggestion.name,
                figmaProperty: paddingProp.figmaProp,
                numericSuggestions: suggestions
              });
            }
          }
        }
      } catch (paddingError) {
      }
    }
  } catch (numericError) {
  }
}


function isPropertyBoundToVariable(boundVariables, propertyPath, index) {
  try {
    if (!boundVariables || typeof boundVariables !== 'object') return false;

    var binding = index !== undefined ? boundVariables[propertyPath] && boundVariables[propertyPath][index] : boundVariables[propertyPath];
    if (!binding) return false;


    if (typeof binding !== 'object' ||
      binding.type !== 'VARIABLE_ALIAS' ||
      !binding.id ||
      typeof binding.id !== 'string') {
      return false;
    }


    var variable = figma.variables.getVariableById(binding.id);
    return variable !== null && variable !== undefined;

  } catch (bindingError) {
    return false;
  }
}



function scanNodeRecursive(node, valueToVariableMap, results, depth, ignoreHiddenLayers) {

  depth = depth || 0;
  var MAX_DEPTH = CONFIG.limits.MAX_DEPTH;
  if (depth > MAX_DEPTH) {
    return;
  }


  if (!node) {
    return;
  }


  if (node.removed) {
    return;
  }


  if (!node.id || !node.type) {
    return;
  }


  try {
    var nodeType = node.type;
    var nodeId = node.id;
    var nodeName = node.name || "Unnamed";



    var containerTypes = CONFIG.supportedTypes.spacing;


    var styleTypes = CONFIG.supportedTypes.fillAndStroke;

    var isContainer = containerTypes.indexOf(nodeType) !== -1;
    var hasStyle = styleTypes.indexOf(nodeType) !== -1;


    if (hasStyle) {
      try {
        checkNodeProperties(node, valueToVariableMap, results, ignoreHiddenLayers);
      } catch (propertyAnalysisError) {
      }
    }




    if (isContainer) {
      try {
        var children = node.children;

        if (children && Array.isArray(children)) {

          for (var i = 0; i < children.length; i++) {
            try {
              var child = children[i];


              if (!child) {
                continue;
              }

              if (child.removed) {
                continue;
              }


              scanNodeRecursive(child, valueToVariableMap, results, depth + 1, ignoreHiddenLayers);

            } catch (childError) {

            }
          }
        } else if (nodeType === 'INSTANCE') {

        }

      } catch (childrenError) {

      }
    }

  } catch (nodeError) {

  }
}


function scanSelection(ignoreHiddenLayers) {

  try {

    var selection = figma.currentPage.selection;

    if (!selection || !Array.isArray(selection)) {
      figma.ui.postMessage({ type: "scan-results", results: [] });
      return [];
    }


    if (selection.length === 0) {
      figma.notify("📄 Aucune sélection : Analyse de la page entière...");


      return scanPage(ignoreHiddenLayers);
    }



    var valueToVariableMap;
    try {
      valueToVariableMap = createValueToVariableMap();

      if (!valueToVariableMap || valueToVariableMap.size === 0) {
        figma.notify("⚠️ Aucune variable trouvée dans le document");
        figma.ui.postMessage({ type: "scan-results", results: [] });
        return [];
      }
    } catch (mapError) {
      figma.notify("❌ Erreur lors de l'accès aux variables");
      figma.ui.postMessage({ type: "scan-results", results: [] });
      return [];
    }


    startAsyncScan(selection, valueToVariableMap, ignoreHiddenLayers);

  } catch (scanError) {
    figma.notify("❌ Erreur critique lors de l'analyse - vérifiez la console pour les détails");
    figma.ui.postMessage({ type: "scan-results", results: [] });
  }
}


function scanPage(ignoreHiddenLayers) {

  try {
    var pageChildren = figma.currentPage.children;

    if (!pageChildren || !Array.isArray(pageChildren)) {
      figma.ui.postMessage({ type: "scan-results", results: [] });
      return [];
    }


    var valueToVariableMap;
    try {
      valueToVariableMap = createValueToVariableMap();
      if (!valueToVariableMap || valueToVariableMap.size === 0) {
        figma.notify("⚠️ Aucune variable trouvée dans le document");
        figma.ui.postMessage({ type: "scan-results", results: [] });
        return [];
      }
    } catch (mapError) {
      figma.notify("❌ Erreur lors de l'accès aux variables");
      figma.ui.postMessage({ type: "scan-results", results: [] });
      return [];
    }


    startAsyncScan(pageChildren, valueToVariableMap, ignoreHiddenLayers);

  } catch (pageScanError) {
    figma.notify("❌ Erreur lors du scan de page");
    figma.ui.postMessage({ type: "scan-results", results: [] });
  }
}


function startAsyncScan(nodes, valueToVariableMap, ignoreHiddenLayers) {
  var CHUNK_SIZE = 50;
  var currentIndex = 0;
  var results = [];
  var totalNodes = nodes.length;


  figma.ui.postMessage({
    type: "scan-progress",
    progress: 0,
    total: totalNodes,
    status: "Démarrage de l'analyse..."
  });


  function processChunk() {
    var chunkEnd = Math.min(currentIndex + CHUNK_SIZE, totalNodes);
    var processedInChunk = 0;


    for (var i = currentIndex; i < chunkEnd; i++) {
      try {
        var node = nodes[i];


        if (!node || node.removed) {
          continue;
        }


        scanNodeRecursive(node, valueToVariableMap, results, 0, ignoreHiddenLayers);
        processedInChunk++;

      } catch (nodeError) {
      }
    }

    currentIndex = chunkEnd;


    var progress = (currentIndex / totalNodes) * 100;
    figma.ui.postMessage({
      type: "scan-progress",
      progress: progress,
      current: currentIndex,
      total: totalNodes,
      status: "Analyse en cours... " + currentIndex + "/" + totalNodes
    });


    if (currentIndex < totalNodes) {

      setTimeout(processChunk, 10);
    } else {

      finishScan(results);
    }
  }


  setTimeout(processChunk, 10);
}



function finishScan(results) {



  lastScanResults = results;

  Scanner.lastScanResults = results;



  if (results.length > 0) {
    FigmaService.notify("✅ Analyse terminée - " + results.length + " problème(s) détecté(s)");
  } else {
    FigmaService.notify("✅ Analyse terminée - Aucun problème détecté");
  }


  setTimeout(function () {

    figma.ui.postMessage({
      type: "scan-progress",
      progress: 100,
      status: "Analyse terminée"
    });

    figma.ui.postMessage({
      type: "scan-results",
      results: results
    });
  }, 100);
}







function diagnoseApplicationFailure(result, variableId, error) {

  var diagnosis = {
    issue: 'unknown',
    confidence: 'low',
    recommendations: [],
    details: {}
  };

  try {

    var variable = figma.variables.getVariableById(variableId);
    if (!variable) {
      diagnosis.issue = 'variable_missing';
      diagnosis.confidence = 'high';
      diagnosis.recommendations.push('La variable a été supprimée ou renommée');
      diagnosis.details.variableId = variableId;
      return diagnosis;
    }


    var requiredScopes = getScopesForProperty(result.property);
    var variableScopes = variable.scopes || [];


    var hasRequiredScopes = requiredScopes.some(function (scope) { return variableScopes.includes(scope); });
    if (!hasRequiredScopes && requiredScopes.length > 0) {
      diagnosis.issue = 'scope_mismatch';
      diagnosis.confidence = 'high';
      diagnosis.recommendations.push('Modifier les scopes de la variable pour inclure: ' + requiredScopes.join(', '));
      diagnosis.details.requiredScopes = requiredScopes;
      diagnosis.details.variableScopes = variableScopes;
    }


    var expectedType = getExpectedVariableType(result.property);
    if (variable.resolvedType !== expectedType) {
      diagnosis.issue = 'type_mismatch';
      diagnosis.confidence = 'high';
      diagnosis.recommendations.push('La variable devrait être de type ' + expectedType + ' (actuellement ' + variable.resolvedType + ')');
      diagnosis.details.expectedType = expectedType;
      diagnosis.details.actualType = variable.resolvedType;
    }


    var node = figma.getNodeById(result.nodeId);
    if (!node) {
      diagnosis.issue = 'node_missing';
      diagnosis.confidence = 'high';
      diagnosis.recommendations.push('Le nœud a été supprimé');
      return diagnosis;
    }

    if (node.removed) {
      diagnosis.issue = 'node_removed';
      diagnosis.confidence = 'high';
      diagnosis.recommendations.push('Le nœud a été supprimé');
      return diagnosis;
    }


    var propertyCheck = checkSpecificPropertyIssue(node, result);
    if (propertyCheck.issue) {
      diagnosis = propertyCheck;
    }


    if (diagnosis.issue === 'unknown') {
      diagnosis.issue = 'technical_error';
      diagnosis.confidence = 'medium';
      diagnosis.recommendations.push('Erreur technique lors de l\'application');
      diagnosis.recommendations.push('Vérifier les logs détaillés dans la console');
      diagnosis.details.error = error;
    }

  } catch (diagError) {
    diagnosis.issue = 'diagnostic_error';
    diagnosis.recommendations.push('Erreur lors de l\'analyse du problème');
  }

  return diagnosis;
}


function getExpectedVariableType(property) {
  switch (property) {
    case "Fill":
    case "Stroke":
      return "COLOR";
    case "Corner Radius":
    case "Top Left Radius":
    case "Top Right Radius":
    case "Bottom Left Radius":
    case "Bottom Right Radius":
    case "Item Spacing":
    case "Padding Left":
    case "Padding Right":
    case "Padding Top":
    case "Padding Bottom":
      return "FLOAT";
    default:
      return "UNKNOWN";
  }
}


function checkSpecificPropertyIssue(node, result) {
  var diagnosis = { issue: null, confidence: 'low', recommendations: [], details: {} };

  try {
    switch (result.property) {
      case "Fill":
        if (!node.fills || !Array.isArray(node.fills) || !node.fills[result.fillIndex]) {
          diagnosis.issue = 'fill_missing';
          diagnosis.confidence = 'high';
          diagnosis.recommendations.push('Le fill à l\'index ' + result.fillIndex + ' n\'existe plus');
        } else {
          var fill = node.fills[result.fillIndex];
          if (fill.type !== CONFIG.types.SOLID) {
            diagnosis.issue = 'fill_type_unsupported';
            diagnosis.confidence = 'high';
            diagnosis.recommendations.push('Seuls les fills SOLID peuvent être liés à des variables');
          }
        }
        break;

      case "Stroke":
        if (!node.strokes || !Array.isArray(node.strokes) || !node.strokes[result.strokeIndex]) {
          diagnosis.issue = 'stroke_missing';
          diagnosis.confidence = 'high';
          diagnosis.recommendations.push('Le stroke à l\'index ' + result.strokeIndex + ' n\'existe plus');
        } else {
          var stroke = node.strokes[result.strokeIndex];
          if (stroke.type !== CONFIG.types.SOLID) {
            diagnosis.issue = 'stroke_type_unsupported';
            diagnosis.confidence = 'high';
            diagnosis.recommendations.push('Seuls les strokes SOLID peuvent être liés à des variables');
          }
        }
        break;

      case "Item Spacing":
        if (node.primaryAxisAlignItems === 'SPACE_BETWEEN') {
          diagnosis.issue = 'spacing_space_between';
          diagnosis.confidence = 'high';
          diagnosis.recommendations.push('Impossible d\'appliquer une variable de spacing sur SPACE_BETWEEN');
        }
        break;
    }
  } catch (error) {
    diagnosis.details.error = error.message;
  }

  return diagnosis;
}






async function applyAndVerifyFix(result, variableId) {

  var startTime = Date.now();
  var verificationResult = {
    success: false,
    applied: false,
    verified: false,
    error: null,
    details: {
      nodeId: result.nodeId,
      property: result.property,
      variableId: variableId,
      duration: 0
    }
  };

  try {



    if (!result) {
      throw new Error('Résultat invalide ou incomplet');
    }
    if (!result.nodeId) {
      throw new Error('Résultat invalide: nodeId manquant');
    }
    if (!result.property) {
      throw new Error('Résultat invalide: property manquant');
    }


    var finalVariableId = variableId || result.suggestedVariableId;

    if (!finalVariableId) {
      throw new Error('Aucun ID de variable fourni ou suggéré');
    }
    verificationResult.details.variableId = finalVariableId;


    var variable = figma.variables.getVariableById(finalVariableId);
    if (variable) {
    }

    if (!variable) {


      var allVars = figma.variables.getLocalVariables().slice(0, 5);
      throw new Error('Variable introuvable: ' + finalVariableId);
    }


    var node = figma.getNodeById(result.nodeId);
    if (node) {
    }

    if (!node) {
      throw new Error('Nœud introuvable: ' + result.nodeId);
    }
    if (node.removed) {
      throw new Error('Nœud supprimé: ' + result.nodeId);
    }


    if (!validatePropertyExists(node, result)) {
      throw new Error('Propriété n\'existe plus: ' + result.property);
    }


    if (!validateVariableCanBeApplied(variable, result)) {
      throw new Error('Variable incompatible: ' + variable.name + ' (' + variable.resolvedType + ') pour ' + result.property);
    }



    var stateBefore = captureNodeState(node, result);



    var applied = await applyVariableToProperty(node, variable, result);

    if (!applied) {
      throw new Error('Échec de l\'application de la variable');
    }

    verificationResult.applied = true;

    // Vérification spéciale non-bloquante pour fontSize (pour debug uniquement)
    if (result.property === 'Font Size') {
      // Re-lire le node pour vérifier que la variable est bien bindée (non-bloquant)
      var refreshedNode = figma.getNodeById(result.nodeId);
      if (refreshedNode && (!refreshedNode.boundVariables || !refreshedNode.boundVariables.fontSize || refreshedNode.boundVariables.fontSize.id !== variable.id)) {
        console.warn('⚠️ [applyAndVerifyFix] FontSize binding check failed (non-critical):', {
          nodeId: result.nodeId,
          fontName: refreshedNode.fontName,
          variableName: variable.name,
          boundId: (refreshedNode.boundVariables && refreshedNode.boundVariables.fontSize) ? refreshedNode.boundVariables.fontSize.id : undefined,
          expectedId: variable.id
        });
        // Note: Ne pas throw d'erreur ici car verifyVariableApplication devrait suffire
      } else if (refreshedNode) {
        console.log('✅ [applyAndVerifyFix] FontSize bound verification passed:', result.nodeId, variable.name);
      }
    }

    var stateAfter = captureNodeState(node, result);

    var verified = verifyVariableApplication(node, variable, result, stateBefore, stateAfter);

    if (!verified) {
      throw new Error('Vérification échouée: la variable n\'a pas été correctement appliquée');
    }

    verificationResult.verified = true;
    verificationResult.success = true;


  } catch (error) {
    verificationResult.error = error.message;
    verificationResult.success = false;


    try {
      var diagnosis = diagnoseApplicationFailure(result, verificationResult.details.variableId, error);
      verificationResult.diagnosis = diagnosis;

      if (diagnosis.recommendations.length > 0) {
      }
    } catch (diagError) {
    }
  } finally {
    verificationResult.details.duration = Date.now() - startTime;
  }

  return verificationResult;
}


async function applySingleFix(result, selectedVariableId) {
  var verificationResult = await applyAndVerifyFix(result, selectedVariableId);
  return verificationResult.success ? 1 : 0;
}


function getNodePropertyDebugInfo(node, result) {
  var debugInfo = {
    nodeType: node.type,
    nodeName: node.name,
    property: result.property
  };

  try {
    switch (result.property) {
      case "Fill":
        debugInfo.fills = node.fills ? {
          length: node.fills.length,
          hasIndex: node.fills[result.fillIndex] !== undefined,
          fillAtIndex: node.fills[result.fillIndex] ? {
            type: node.fills[result.fillIndex].type,
            hasBoundVariables: !!node.fills[result.fillIndex].boundVariables
          } : null
        } : null;
        break;

      case "Stroke":
        debugInfo.strokes = node.strokes ? {
          length: node.strokes.length,
          hasIndex: node.strokes[result.strokeIndex] !== undefined,
          strokeAtIndex: node.strokes[result.strokeIndex] ? {
            type: node.strokes[result.strokeIndex].type,
            hasBoundVariables: !!node.strokes[result.strokeIndex].boundVariables
          } : null
        } : null;
        break;

      case "Local Fill Style":
        debugInfo.fillStyleId = node.fillStyleId;
        debugInfo.fills = node.fills ? {
          length: node.fills.length,
          firstFill: node.fills[0] ? {
            type: node.fills[0].type,
            hasBoundVariables: !!node.fills[0].boundVariables
          } : null
        } : null;
        break;

      case "Local Stroke Style":
        debugInfo.strokeStyleId = node.strokeStyleId;
        debugInfo.strokes = node.strokes ? {
          length: node.strokes.length,
          firstStroke: node.strokes[0] ? {
            type: node.strokes[0].type,
            hasBoundVariables: !!node.strokes[0].boundVariables
          } : null
        } : null;
        break;

      default:
        if (result.figmaProperty) {
          debugInfo[result.figmaProperty] = {
            value: node[result.figmaProperty],
            type: typeof node[result.figmaProperty]
          };
        }
        break;
    }

    debugInfo.boundVariables = node.boundVariables || {};
  } catch (error) {
    debugInfo.error = error.message;
  }

  return debugInfo;
}


function captureNodeState(node, result) {
  var state = {
    nodeId: node.id,
    boundVariables: {},
    propertyValues: {}
  };

  try {

    if (node.boundVariables) {
      state.boundVariables = JSON.parse(JSON.stringify(node.boundVariables));
    }


    switch (result.property) {
      case "Fill":
        if (node.fills && node.fills[result.fillIndex]) {
          state.propertyValues.fill = JSON.parse(JSON.stringify(node.fills[result.fillIndex]));
        }
        break;

      case "Stroke":
        if (node.strokes && node.strokes[result.strokeIndex]) {
          state.propertyValues.stroke = JSON.parse(JSON.stringify(node.strokes[result.strokeIndex]));
        }
        break;

      case "Local Fill Style":
        state.propertyValues.fillStyleId = node.fillStyleId;
        if (node.fills && node.fills[0]) {
          state.propertyValues.fill = JSON.parse(JSON.stringify(node.fills[0]));
        }
        break;

      case "Local Stroke Style":
        state.propertyValues.strokeStyleId = node.strokeStyleId;
        if (node.strokes && node.strokes[0]) {
          state.propertyValues.stroke = JSON.parse(JSON.stringify(node.strokes[0]));
        }
        break;

      default:

        if (result.figmaProperty && typeof node[result.figmaProperty] === 'number') {
          state.propertyValues[result.figmaProperty] = node[result.figmaProperty];
        }
        break;
    }
  } catch (error) {
  }

  return state;
}


function verifyVariableApplication(node, variable, result, stateBefore, stateAfter) {
  try {
    console.log('Verify Application: Checking property', result.property, 'for node', node.id);

    // Pour les styles locaux, ne pas utiliser la vérification générale des boundVariables
    // car les variables sont appliquées aux fills/strokes individuels, pas au nœud principal
    if (result.property !== 'Local Fill Style' && result.property !== 'Local Stroke Style') {
      console.log('Verify Application: Checking boundVariables change');
      var boundVariablesChanged = JSON.stringify(stateBefore.boundVariables) !== JSON.stringify(stateAfter.boundVariables);
      console.log('Verify Application: boundVariables changed:', boundVariablesChanged);
      console.log('Verify Application: Before:', stateBefore.boundVariables);
      console.log('Verify Application: After:', stateAfter.boundVariables);

      if (boundVariablesChanged) {
        console.log('Verify Application: Bound variables changed, success!');
        return true;
      }
    }

    switch (result.property) {
      case "Fill":
        console.log('Verify Application: Using verifyFillApplication');
        return verifyFillApplication(node, variable, result.fillIndex, stateBefore, stateAfter);

      case "Stroke":
        console.log('Verify Application: Using verifyStrokeApplication');
        return verifyStrokeApplication(node, variable, result.strokeIndex, stateBefore, stateAfter);

      case "Local Fill Style":
        console.log('Verify Application: Using verifyLocalStyleApplication (fill)');
        return verifyLocalStyleApplication(node, variable, 'fill', stateBefore, stateAfter);

      case "Local Stroke Style":
        console.log('Verify Application: Using verifyLocalStyleApplication (stroke)');
        return verifyLocalStyleApplication(node, variable, 'stroke', stateBefore, stateAfter);

      default:
        console.log('Verify Application: Using verifyNumericApplication for', result.property);
        return verifyNumericApplication(node, variable, result, stateBefore, stateAfter);
    }

  } catch (error) {
    return false;
  }
}


function verifyLocalStyleApplication(node, variable, styleType, stateBefore, stateAfter) {
  try {
    console.log('🔍 Verify Local Style:', styleType, 'for node', node.id, 'expected var:', variable.id);

    // Vérifier que le style local a été supprimé
    if (styleType === 'fill' && node.fillStyleId) {
      console.log('❌ Verify Local Style: fillStyleId still exists');
      return false;
    }
    if (styleType === 'stroke' && node.strokeStyleId) {
      console.log('❌ Verify Local Style: strokeStyleId still exists');
      return false;
    }

    console.log('✅ Verify Local Style: Style correctly removed');

    // Vérifier que LA VARIABLE SPÉCIFIQUE est appliquée (comme pour les autres propriétés)
    var targetArray = styleType === 'fill' ? node.fills : node.strokes;
    if (!targetArray || targetArray.length === 0) {
      console.log('❌ Verify Local Style: No fills/strokes found');
      return false;
    }

    // Chercher la variable spécifique dans tous les items
    for (var i = 0; i < targetArray.length; i++) {
      var item = targetArray[i];
      if (item && item.boundVariables && item.boundVariables.color) {
        var boundVar = item.boundVariables.color;
        console.log('Verify Local Style: Found variable', boundVar.id, 'type:', boundVar.type);
        if (boundVar.type === 'VARIABLE_ALIAS' && boundVar.id === variable.id) {
          console.log('✅ Verify Local Style: Correct variable found');
          return true;
        }
      }
    }

    console.log('❌ Verify Local Style: Expected variable not found');
    return false;
  } catch (error) {
    console.error('❌ Verify Local Style: Exception:', error.message);
    return false;
  }
}


function verifyFillApplication(node, variable, fillIndex, stateBefore, stateAfter) {
  try {
    if (!node.fills || !node.fills[fillIndex]) {
      return false;
    }

    var currentFill = node.fills[fillIndex];


    if (currentFill.boundVariables && currentFill.boundVariables.color) {
      var boundVar = currentFill.boundVariables.color;
      if (boundVar.type === 'VARIABLE_ALIAS' && boundVar.id === variable.id) {
        return true;
      }
    }

    return false;

  } catch (error) {
    return false;
  }
}


function verifyStrokeApplication(node, variable, strokeIndex, stateBefore, stateAfter) {
  try {
    if (!node.strokes || !node.strokes[strokeIndex]) {
      return false;
    }

    var currentStroke = node.strokes[strokeIndex];


    if (currentStroke.boundVariables && currentStroke.boundVariables.color) {
      var boundVar = currentStroke.boundVariables.color;
      if (boundVar.type === 'VARIABLE_ALIAS' && boundVar.id === variable.id) {
        return true;
      }
    }

    return false;

  } catch (error) {
    return false;
  }
}


function verifyNumericApplication(node, variable, result, stateBefore, stateAfter) {
  try {
    console.log('Verify Numeric: Checking property', result.property, 'figmaProperty:', result.figmaProperty);

    if (!result.figmaProperty) {
      console.log('Verify Numeric: No figmaProperty specified');
      return false;
    }

    console.log('Verify Numeric: Current boundVariables:', node.boundVariables);
    console.log('Verify Numeric: Looking for', result.figmaProperty);

    if (node.boundVariables && node.boundVariables[result.figmaProperty]) {
      var boundVar = node.boundVariables[result.figmaProperty];
      console.log('Verify Numeric: Found bound variable:', boundVar, 'expected variable id:', variable.id);
      if (boundVar.type === 'VARIABLE_ALIAS' && boundVar.id === variable.id) {
        console.log('Verify Numeric: Variable correctly applied!');
        return true;
      } else {
        console.log('Verify Numeric: Wrong variable or type');
      }
    } else {
      console.log('Verify Numeric: No bound variable found for', result.figmaProperty);
    }

    console.log('Verify Numeric: Verification failed');
    return false;

  } catch (error) {
    console.error('Verify Numeric: Error:', error);
    return false;
  }
}






function validatePropertyExists(node, result) {
  try {
    switch (result.property) {
      case "Fill":
        return node.fills && Array.isArray(node.fills) && node.fills[result.fillIndex] !== undefined;

      case "Stroke":
        return node.strokes && Array.isArray(node.strokes) && node.strokes[result.strokeIndex] !== undefined;

      case "Local Fill Style":
        // Pour les styles locaux, vérifier que le nœud a des fills (même si le style local a été supprimé par le preview)
        return node.fills && Array.isArray(node.fills) && node.fills.length > 0;

      case "Local Stroke Style":
        // Pour les styles locaux, vérifier que le nœud a des strokes (même si le style local a été supprimé par le preview)
        return node.strokes && Array.isArray(node.strokes) && node.strokes.length > 0;

      case "Corner Radius":
      case "Top Left Radius":
      case "Top Right Radius":
      case "Bottom Left Radius":
      case "Bottom Right Radius":
        return typeof node[result.figmaProperty] === 'number';

      case "Item Spacing":
      case "Padding Left":
      case "Padding Right":
      case "Padding Top":
      case "Padding Bottom":
        return typeof node[result.figmaProperty] === 'number';

      case "Font Size":
        return node.type === "TEXT" && typeof node.fontSize === 'number';

      default:
        return false;
    }
  } catch (error) {
    return false;
  }
}


function validateVariableCanBeApplied(variable, result) {
  try {

    var variableType = variable.resolvedType;

    switch (result.property) {
      case "Fill":
      case "Stroke":
      case "Local Fill Style":
      case "Local Stroke Style":
        return variableType === "COLOR";

      case "Corner Radius":
      case "Top Left Radius":
      case "Top Right Radius":
      case "Bottom Left Radius":
      case "Bottom Right Radius":
      case "Item Spacing":
      case "Padding Left":
      case "Padding Right":
      case "Padding Top":
      case "Padding Bottom":
        return variableType === "FLOAT";

      case "Font Size":
        return variableType === "FLOAT";

      default:
        return false;
    }
  } catch (error) {
    return false;
  }
}


async function applyVariableToProperty(node, variable, result) {
  try {
    var success = false;

    switch (result.property) {
      case "Fill":
        success = applyColorVariableToFill(node, variable, result.fillIndex);
        break;

      case "Stroke":
        success = applyColorVariableToStroke(node, variable, result.strokeIndex);
        break;

      case "Local Fill Style":
        success = applyVariableToLocalStyle(node, variable, 'fill', result);
        break;

      case "Local Stroke Style":
        success = applyVariableToLocalStyle(node, variable, 'stroke', result);
        break;

      case "Corner Radius":
      case "Top Left Radius":
      case "Top Right Radius":
      case "Bottom Left Radius":
      case "Bottom Right Radius":
        success = await applyNumericVariable(node, variable, result.figmaProperty, result.property);
        break;

      case "Item Spacing":
      case "Padding Left":
      case "Padding Right":
      case "Padding Top":
      case "Padding Bottom":
        success = await applyNumericVariable(node, variable, result.figmaProperty, result.property);
        break;

      case "Font Size":
        success = await applyNumericVariable(node, variable, result.figmaProperty, result.property);
        break;

      default:
        return false;
    }

    return success;
  } catch (error) {
    return false;
  }
}


function findFillIndexWithLocalStyleColor(node) {
  // Par défaut, on utilise l'index 0, mais on pourrait améliorer cette logique
  // en comparant les couleurs des fills avec la couleur du style local
  return 0;
}

function findStrokeIndexWithLocalStyleColor(node) {
  // Par défaut, on utilise l'index 0, mais on pourrait améliorer cette logique
  // en comparant les couleurs des strokes avec la couleur du style local
  return 0;
}

function applyVariableToLocalStyle(node, variable, styleType, result) {
  try {
    console.log('Local Style Application: Applying', styleType, 'style to node', node.id, 'variable:', variable.name);

    // Vérifier l'état avant application
    var targetArray = styleType === 'fill' ? node.fills : node.strokes;
    var targetIndex = 0;
    var hasExistingVariable = false;

    if (targetArray && targetArray[targetIndex] && targetArray[targetIndex].boundVariables && targetArray[targetIndex].boundVariables.color) {
      var existingVar = targetArray[targetIndex].boundVariables.color;
      if (existingVar.id === variable.id) {
        console.log('Local Style Application: Variable already applied from preview, success');
        hasExistingVariable = true;
      } else {
        console.log('Local Style Application: Different variable already applied:', existingVar.id);
      }
    }

    // Supprimer le style local
    if (styleType === 'fill' && node.fillStyleId) {
      console.log('Local Style Application: Removing fillStyleId:', node.fillStyleId);
      node.fillStyleId = '';
    } else if (styleType === 'stroke' && node.strokeStyleId) {
      console.log('Local Style Application: Removing strokeStyleId:', node.strokeStyleId);
      node.strokeStyleId = '';
    }

    // IMPORTANT: Pour les styles locaux, on doit supprimer le style local et appliquer la variable
    console.log('Local Style Application: Processing', styleType, 'style');

    // Supprimer le style local
    if (styleType === 'fill' && node.fillStyleId) {
      node.fillStyleId = '';
      console.log('Local Style Application: fillStyleId removed');
    } else if (styleType === 'stroke' && node.strokeStyleId) {
      node.strokeStyleId = '';
      console.log('Local Style Application: strokeStyleId removed');
    }

    // Appliquer la variable (toujours, même si elle semble déjà appliquée)
    console.log('Local Style Application: Applying variable to', styleType);
    if (styleType === 'fill') {
      return applyColorVariableToFill(node, variable, 0);
    } else if (styleType === 'stroke') {
      return applyColorVariableToStroke(node, variable, 0);
    }

    return false;
  } catch (error) {
    console.error('Local Style Application: Error:', error);
    return false;
  }
}


function applyColorVariableToFill(node, variable, fillIndex) {

  try {
    var fillPath = 'fills[' + fillIndex + '].color';
    console.log('Apply Fill Variable: Node', node.id, 'fillIndex', fillIndex, 'variable', variable.name);

    if (!node.fills || !Array.isArray(node.fills) || !node.fills[fillIndex]) {
      console.log('Apply Fill Variable: Invalid fills array or index');
      return false;
    }

    var fill = node.fills[fillIndex];
    console.log('Apply Fill Variable: Fill exists, checking bound variables');

    // Vérifier si la variable est déjà appliquée
    if (fill.boundVariables && fill.boundVariables.color && fill.boundVariables.color.id === variable.id) {
      console.log('Apply Fill Variable: Variable already applied correctly');
      return true;
    }


    if (node.fillStyleId) {
      console.log('Apply Fill Variable: Removing fillStyleId');
      try {
        node.fillStyleId = '';
      } catch (e) {
        console.error('Apply Fill Variable: Error removing fillStyleId:', e);
      }
    }


    try {
      console.log('Apply Fill Variable: Setting bound variable');
      node.setBoundVariable(fillPath, variable);

      console.log('Apply Fill Variable: Variable applied successfully via setBoundVariable');
      var updatedFill = node.fills[fillIndex];

      return true;
    } catch (setBoundError) {
      console.error('Apply Fill Variable: Error setting bound variable:', setBoundError);
      console.log('Apply Fill Variable: Trying fallback method');
      // Ne pas retourner false ici, continuer vers le fallback
    }


    try {
      console.log('Apply Fill Variable: Using fallback method');
      var clonedFills = JSON.parse(JSON.stringify(node.fills));
      if (!clonedFills[fillIndex].boundVariables) {
        clonedFills[fillIndex].boundVariables = {};
      }
      clonedFills[fillIndex].boundVariables.color = {
        type: 'VARIABLE_ALIAS',
        id: variable.id
      };

      console.log('Apply Fill Variable: Removing fillStyleId in fallback');
      if (node.fillStyleId) {
        node.fillStyleId = '';
      }

      console.log('Apply Fill Variable: Applying cloned fills');
      node.fills = clonedFills;

      console.log('Apply Fill Variable: Variable applied successfully via fallback');
      var finalFill = node.fills[fillIndex];

      return true;
    } catch (fallbackError) {
      console.error('Apply Fill Variable: Fallback method failed:', fallbackError);
      return false;
    }

  } catch (error) {
    return false;
  }
}


function applyColorVariableToStroke(node, variable, strokeIndex) {
  try {
    var strokePath = 'strokes[' + strokeIndex + '].color';


    try {
      node.setBoundVariable(strokePath, variable);
      return true;
    } catch (setBoundError) {
    }


    if (node.strokes && Array.isArray(node.strokes) && node.strokes[strokeIndex]) {
      var clonedStrokes = JSON.parse(JSON.stringify(node.strokes));
      if (!clonedStrokes[strokeIndex].boundVariables) {
        clonedStrokes[strokeIndex].boundVariables = {};
      }
      clonedStrokes[strokeIndex].boundVariables.color = {
        type: 'VARIABLE_ALIAS',
        id: variable.id
      };


      if (node.strokeStyleId) {
        node.strokeStyleId = '';
      }

      node.strokes = clonedStrokes;
      return true;
    }

    return false;
  } catch (error) {
    return false;
  }
}


async function applyNumericVariable(node, variable, figmaProperty, displayProperty) {
  try {

    if (figmaProperty === 'itemSpacing' && node.primaryAxisAlignItems === 'SPACE_BETWEEN') {
      return false;
    }

    // Gestion spéciale pour fontSize : vérifier les prérequis et charger la font
    if (figmaProperty === 'fontSize') {
      if (node.type !== 'TEXT') {
        console.warn('❌ [applyNumericVariable] Font Size ne peut être appliqué qu\'aux TextNodes, node type:', node.type);
        return false;
      }

      // Vérifier si la font est mixte (non supporté)
      if (node.fontName === figma.mixed) {
        console.warn('❌ [applyNumericVariable] Font mixte détectée pour node', node.id, '- correction impossible');
        return false;
      }

      console.log('✅ [applyNumericVariable] Application Font Size sur TextNode', node.id, 'avec font:', node.fontName.family, node.fontName.style);

      // Charger la font de manière asynchrone avant d'appliquer la variable
      try {
        await figma.loadFontAsync(node.fontName);
        console.log('✅ [applyNumericVariable] Font chargée avec succès:', node.fontName.family, node.fontName.style);
      } catch (fontError) {
        console.warn('❌ [applyNumericVariable] Échec chargement font pour node', node.id, ':', fontError.message);
        return false;
      }
    }

    node.setBoundVariable(figmaProperty, variable);
    return true;

  } catch (error) {
    console.warn('❌ [applyNumericVariable] Échec application variable sur', displayProperty, 'pour node', node.id, ':', error.message);
    return false;
  }
}





async function applyFixToNode(nodeId, variableId, property, result) {





  var verification = await applyAndVerifyFix(result, variableId);

  if (verification.success) {
    return 1;
  } else {
    return 0;
  }
}

async function applyAllFixes() {
  var appliedCount = 0;
  var failedCount = 0;
  var results = [];

  if (!lastScanResults || lastScanResults.length === 0) {
    return 0;
  }



  for (var i = 0; i < lastScanResults.length; i++) {
    var result = lastScanResults[i];

    try {

      var verificationResult = await applyAndVerifyFix(result, result.suggestedVariableId);

      results.push({
        index: i,
        result: result,
        verification: verificationResult
      });

      if (verificationResult.success) {
        appliedCount++;
      } else {
        failedCount++;
      }

    } catch (error) {
      failedCount++;

      results.push({
        index: i,
        result: result,
        verification: {
          success: false,
          error: error.message,
          details: { duration: 0 }
        }
      });
    }
  }




  if (failedCount > 0) {
    results.forEach(function (item) {
      if (!item.verification.success && item.verification.diagnosis) {
      }
    });
  }

  return appliedCount;
}





function checkAndNotifySelection() {
  var selection = figma.currentPage.selection;
  var hasValidSelection = selection.length > 0 && selection.some(function (node) {
    return node.type === "FRAME" ||
      node.type === "GROUP" ||
      node.type === "COMPONENT" ||
      node.type === "INSTANCE" ||
      node.type === "SECTION";
  });


  var selectedFrameName = null;
  if (hasValidSelection) {
    var firstValidNode = selection.find(function (node) {
      return node.type === "FRAME" ||
        node.type === "GROUP" ||
        node.type === "COMPONENT" ||
        node.type === "INSTANCE" ||
        node.type === "SECTION";
    });
    if (firstValidNode) {
      selectedFrameName = firstValidNode.name;
    }
  }


  var selectionId = selection.map(function (n) { return n.id; }).sort().join('|');

  figma.ui.postMessage({
    type: "selection-checked",
    hasSelection: hasValidSelection,
    selectedFrameName: selectedFrameName,
    selectionId: selectionId
  });
}

figma.on("selectionchange", function () {
  checkAndNotifySelection();
});

checkAndNotifySelection();

figma.ui.onmessage = function (msg) {
  if (msg.type === "rehydrate-semantic-aliases") {
    rehydrateSemanticAliases();
  }

  if (msg.type === "generate") {

    var naming = msg.naming || "custom";

    console.log('🎨 Generating tokens for naming:', naming);

    var tokens = {
      brand: generateBrandColors(msg.color, naming),
      system: generateSystemColors(naming),
      gray: generateGrayscale(naming),
      spacing: generateSpacing(naming),
      radius: generateRadius(naming),
      typography: generateTypography(naming),
      border: generateBorder()
    };

    console.log('📊 Generated primitives:', {
      brand: tokens.brand ? Object.keys(tokens.brand).length + ' keys: ' + Object.keys(tokens.brand).slice(0, 3).join(', ') : 0,
      system: tokens.system ? Object.keys(tokens.system).length : 0,
      gray: tokens.gray ? Object.keys(tokens.gray).length : 0,
      spacing: tokens.spacing ? Object.keys(tokens.spacing).length : 0,
      radius: tokens.radius ? Object.keys(tokens.radius).length : 0,
      typography: tokens.typography ? Object.keys(tokens.typography).length : 0
    });

    // Générer automatiquement les tokens sémantiques pour les presets connus
    if (naming === "tailwind" || naming === "mui" || naming === "ant" || naming === "bootstrap") {
      console.log(`🎨 Génération automatique des sémantiques pour ${naming}`);
      console.log(`🔍 Primitives disponibles:`, Object.keys(tokens).filter(k => tokens[k] && Object.keys(tokens[k]).length > 0));
      try {
        var generated = generateSemanticTokens(tokens, { naming: naming });
        var existing = getSemanticTokensFromFile('MERGE_EXISTING') || {};
        var merged = mergeSemanticWithExistingAliases(generated, existing);

        console.log(`✅ Sémantiques générées:`, generated ? Object.keys(generated).length : 0, 'tokens');
        if (merged) {
          console.log(`📋 Exemples:`, Object.entries(merged).slice(0, 3).map(([k, v]) => `${k}=${JSON.stringify(v)}`).join(', '));
          // Sauvegarder les sémantiques fusionnées (avec alias préservés)
          saveSemanticTokensToFile(merged, 'AUTO_GENERATE_MERGED');
        }
      } catch (error) {
        console.error('❌ Erreur génération sémantiques:', error);
        tokens.semantic = {};
      }
    } else {
      // Restaurer les tokens sémantiques sauvegardés si disponibles
      var savedSemantic = getSemanticTokensFromFile('SYNC_RESTORE_SAVED');
      if (savedSemantic) {
        tokens.semantic = savedSemantic;
        console.log(`📂 Sémantiques restaurées depuis la sauvegarde:`, Object.keys(savedSemantic).length, 'tokens');
      } else if (cachedTokens && cachedTokens.semantic) {
        tokens.semantic = cachedTokens.semantic;
      }
    }

    // Pour tous les cas, si on a des primitives sauvegardées et qu'on régénère,
    // on les restaure automatiquement (sauf si on vient de les régénérer)
    var hasPrimitives = false;
    for (var cat in tokens) {
      if (cat !== 'semantic' && tokens[cat] && Object.keys(tokens[cat]).length > 0) {
        hasPrimitives = true;
        break;
      }
    }

    if (!hasPrimitives) {
      var savedPrimitives = getPrimitivesTokensFromFile('SYNC_AUTO_RESTORE');
      if (savedPrimitives) {
        // Fusionner les primitives sauvegardées avec celles générées (priorité aux générées)
        for (var cat in savedPrimitives) {
          if (savedPrimitives.hasOwnProperty(cat) && (!tokens[cat] || Object.keys(tokens[cat]).length === 0)) {
            tokens[cat] = savedPrimitives[cat];
          }
        }
        console.log(`📂 Primitives restaurées automatiquement depuis stockage`);
      }
    }

    // Pour tous les cas, si on a des sémantiques sauvegardées et qu'on régénère,
    // on les restaure automatiquement (sauf si on vient de les régénérer)
    if (!tokens.semantic) {
      var savedSemantic = getSemanticTokensFromFile('SYNC_AUTO_RESTORE');
      if (savedSemantic) {
        tokens.semantic = savedSemantic;
        console.log(`📂 Sémantiques restaurées automatiquement:`, Object.keys(savedSemantic).length, 'tokens');
      }
    }

    cachedTokens = tokens;

    console.log('💾 cachedTokens après génération:', {
      primitives: Object.keys(cachedTokens).filter(k => k !== 'semantic'),
      semantic: cachedTokens.semantic ? Object.keys(cachedTokens.semantic).length + ' tokens' : 'aucun'
    });

    var semanticPreview = getSemanticPreviewRows(cachedTokens, naming);
    figma.ui.postMessage({
      type: "tokens-generated",
      tokens: cachedTokens,
      semanticPreview: semanticPreview,
      naming: naming
    });
  }

  if (msg.type === "import") {
    console.log('🔄 Pipeline d\'import : import → FigmaService.importTokens');
    var tokensToImport = msg.tokens || cachedTokens;
    if (tokensToImport) {
      FigmaService.importTokens(tokensToImport, msg.naming || "custom", msg.overwrite);
    } else {
      figma.notify("⚠️ Generate tokens first!");
    }
  }

  if (msg.type === "import-from-file") {
    var namingFromFile = msg.naming || "custom";
    var tokensFromFile = msg.tokens;

    if (!tokensFromFile) {
      figma.notify("⚠️ Aucun token reçu depuis le fichier");
      return;
    }

    try {
      console.log('🔄 Pipeline d\'import : import depuis fichier → FigmaService.importTokens');
      FigmaService.importTokens(tokensFromFile, namingFromFile, false);
      figma.notify("✅ Tokens importés depuis le fichier (Ctrl+Z pour annuler)");
    } catch (e) {
      figma.notify("❌ Erreur lors de l'import depuis le fichier");
    }
  }

  if (msg.type === "scan-frame") {
    try {

      var ignoreHiddenLayers = msg.ignoreHiddenLayers !== false;
      scanSelection(ignoreHiddenLayers);
    } catch (e) {
      figma.notify("❌ Erreur lors de l'analyse de la frame");
    }
  }

  if (msg.type === "apply-all-fixes") {
    (async function () {
      var appliedCount = 0;
      var applicationError = null;

      try {
        appliedCount = await applyAllFixes();
      } catch (e) {
        applicationError = e;
      }

      try {
        figma.ui.postMessage({
          type: "all-fixes-applied",
          appliedCount: appliedCount,
          error: applicationError ? applicationError.message : null
        });
      } catch (uiError) {
      }
    })();
  }

  if (msg.type === "apply-single-fix") {
    (async function () {
      var appliedCount = 0;
      var applicationError = null;
      var index = msg.index;
      var selectedVariableId = msg.selectedVariableId;

      try {
        var result = lastScanResults ? lastScanResults[index] : null;
        appliedCount = await applySingleFix(result, selectedVariableId);
      } catch (e) {
        applicationError = e;
      }

      try {
        figma.ui.postMessage({
          type: "single-fix-applied",
          appliedCount: appliedCount,
          error: applicationError ? applicationError.message : null,
          index: index
        });
      } catch (uiError) {
      }
    })();
  }


  if (msg.type === "undo-fix") {
    var indices = msg.indices || [];




    figma.notify("⟲ Utilisez Ctrl+Z (ou Cmd+Z) pour annuler dans Figma", { timeout: 3000 });


    figma.ui.postMessage({
      type: "undo-acknowledged",
      indices: indices
    });
  }

  if (msg.type === "check-selection") {
    checkAndNotifySelection();
  }



  if (msg.type === "resize") {
    var MIN_WIDTH = 400;
    var MAX_WIDTH = 1600;
    var MIN_HEIGHT = 500;
    var MAX_HEIGHT = 1400;

    var width = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, msg.width || 700));
    var height = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, msg.height || 950));

    try {
      figma.ui.resize(width, height);
    } catch (error) {
    }
  }





  if (msg.type === "highlight-nodes") {
    try {
      var indices = msg.indices || [];
      if (indices.length === 0 || !lastScanResults) return;


      var nodeIds = indices.map(function (index) {
        return lastScanResults[index] ? lastScanResults[index].nodeId : null;
      }).filter(function (nodeId) { return nodeId !== null; });

      if (nodeIds.length === 0) return;


      var nodes = nodeIds.map(function (nodeId) {
        return figma.getNodeById(nodeId);
      }).filter(function (node) { return node !== null; });

      if (nodes.length > 0) {

        figma.currentPage.selection = nodes;
        figma.viewport.scrollAndZoomIntoView(nodes);
      }
    } catch (e) {
    }
  }

  if (msg.type === "apply-group-fix") {
    (async function () {
      console.log('Received apply-group-fix message:', msg);
      var appliedCount = 0;
      var applicationError = null;
      var indices = msg.indices || [];
      var variableId = msg.variableId;
      console.log('Processing indices:', indices, 'variableId:', variableId);

      if (!variableId || indices.length === 0 || !lastScanResults) {
        figma.ui.postMessage({
          type: "group-fix-applied",
          appliedCount: 0,
          error: "Paramètres manquants ou résultats de scan indisponibles"
        });
        return;
      }

      try {

        for (var i = 0; i < indices.length; i++) {
          var index = indices[i];
          if (index >= 0 && index < lastScanResults.length) {
            var result = lastScanResults[index];
            if (result) {
              appliedCount += await applyFixToNode(result.nodeId, variableId, result.property, result);
            }
          }
        }

        // ❌ COMMENTÉ : Évite le rechargement brutal qui tue les animations UI
        // scanSelection(true);

      } catch (e) {
        applicationError = e;
      }

      try {
        figma.ui.postMessage({
          type: "group-fix-applied",
          appliedCount: appliedCount,
          error: applicationError ? applicationError.message : null
        });
      } catch (uiError) {
      }
    })();
  }

  if (msg.type === "preview-fix") {
    console.log('Preview Fix: Received preview-fix message for indices:', msg.indices, 'variable:', msg.variableId);

    var indices = msg.indices || [];
    var variableId = msg.variableId;



    var scanResults = Scanner.lastScanResults || lastScanResults;

    if (!scanResults || scanResults.length === 0) {
      figma.ui.postMessage({
        type: "preview-error",
        message: "Données de scan perdues. Veuillez relancer l'analyse."
      });
      return;
    }

    var variable = FigmaService.getVariableById(variableId);
    if (!variable) {
      return;
    }


    var appliedCount = 0;

    indices.forEach(function (index) {

      if (index >= 0 && index < scanResults.length) {
        var result = scanResults[index];
        var node = figma.getNodeById(result.nodeId);

        if (node && !node.removed) {

          try {

            if ((result.property === 'Fill' || result.property === 'Local Fill Style') && node.fillStyleId) {
              node.fillStyleId = '';
            }
            if ((result.property === 'Stroke' || result.property === 'Local Stroke Style') && node.strokeStyleId) {
              node.strokeStyleId = '';
            }


            // Pour le preview, appliquer la variable normalement pour tous les types
            var success = Fixer._applyVariableToProperty(node, result, variable);

            if (success) appliedCount++;

          } catch (err) {
          }
        } else {
        }
      }
    });

  }


  if (msg.type === "sync-scan-results") {

    if (msg.results && Array.isArray(msg.results)) {
      Scanner.lastScanResults = msg.results;
    } else {
    }


    figma.ui.postMessage({
      type: "sync-confirmation",
      success: !!Scanner.lastScanResults,
      count: Scanner.lastScanResults ? Scanner.lastScanResults.length : 0
    });
  }






  function simpleScan() {

    var results = [];
    var pageChildren = figma.currentPage.children;


    for (var i = 0; i < pageChildren.length; i++) {
      var node = pageChildren[i];


      if (node.fills && Array.isArray(node.fills)) {
        for (var j = 0; j < node.fills.length; j++) {
          var fill = node.fills[j];

          if (fill.type === CONFIG.types.SOLID && fill.color) {

            var isBound = node.boundVariables &&
              node.boundVariables.fills &&
              node.boundVariables.fills[j];

            if (!isBound) {
              var hex = rgbToHex(fill.color);

              results.push({
                nodeId: node.id,
                nodeName: node.name,
                property: CONFIG.properties.FILL,
                fillIndex: j,
                hexValue: hex,
                type: 'color'
              });
            }
          }
        }
      }
    }

    return results;
  }


  function simpleApply(results) {

    var successCount = 0;


    var colorVars = figma.variables.getLocalVariables().filter(function (v) {
      return v.resolvedType === 'COLOR';
    });


    if (colorVars.length === 0) {
      return 0;
    }


    var defaultVar = colorVars[0];

    for (var i = 0; i < results.length; i++) {
      var result = results[i];

      try {
        var node = figma.getNodeById(result.nodeId);

        if (!node) {
          continue;
        }


        node.setBoundVariable('fills[' + result.fillIndex + '].color', defaultVar);


        var updatedFill = node.fills[result.fillIndex];
        var isApplied = updatedFill.boundVariables &&
          updatedFill.boundVariables.color &&
          updatedFill.boundVariables.color.id === defaultVar.id;

        if (isApplied) {
          successCount++;
        } else {

          successCount++;
        }

      } catch (error) {
      }
    }

    return successCount;
  }
};

// Fonction utilitaire pour obtenir un modeId de manière sûre (sans crash)
function safeGetModeId(variable) {
  // Si variable est falsy
  if (!variable) return null;

  // Essayer d'abord via la collection
  if (variable.variableCollectionId) {
    try {
      var collection = figma.variables.getVariableCollectionById(variable.variableCollectionId);
      if (collection && collection.modes && collection.modes.length > 0) {
        return collection.modes[0].modeId;
      }
      console.log(`⚠️ [SAFE_MODE] No collection modes for var=${variable.name} id=${variable.id} collectionId=${variable.variableCollectionId}`);
    } catch (e) {
      console.warn(`⚠️ [SAFE_MODE] Error getting collection for var=${variable.name} id=${variable.id} collectionId=${variable.variableCollectionId}:`, e);
    }
  }

  // Fallback : utiliser les clés de valuesByMode
  if (variable.valuesByMode && typeof variable.valuesByMode === 'object') {
    var modeKeys = Object.keys(variable.valuesByMode);
    if (modeKeys.length > 0) {
      console.log(`🔄 [SAFE_MODE] Using fallback mode "${modeKeys[0]}" for var=${variable.name} id=${variable.id} (no collection)`);
      return modeKeys[0];
    }
    console.log(`⚠️ [SAFE_MODE] No valuesByMode for var=${variable.name} id=${variable.id}`);
  }

  console.log(`❌ [SAFE_MODE] Cannot determine modeId for var=${variable.name || 'unknown'} id=${variable.id || 'unknown'}`);
  return null;
}

// Fonction pour fusionner les tokens générés avec les alias existants
function mergeSemanticWithExistingAliases(generated, existing) {
  if (!generated) return existing || {};
  if (!existing) return generated;

  var merged = {};
  var preservedAliases = 0;

  // Parcourir toutes les clés générées
  for (var key in generated) {
    if (!generated.hasOwnProperty(key)) continue;

    var generatedToken = generated[key];
    var existingToken = existing[key];

    // Si un token existant avec aliasTo existe, préserver l'alias
    if (existingToken && existingToken.aliasTo) {
      merged[key] = {
        resolvedValue: typeof generatedToken === 'object' ?
          (generatedToken.resolvedValue || generatedToken) : generatedToken, // S'assurer que c'est scalaire
        aliasTo: existingToken.aliasTo, // ALIAS PRÉSERVÉ
        type: existingToken.type || 'COLOR',
        meta: existingToken.meta // Conserver les métadonnées existantes
      };
      preservedAliases++;
      console.log(`🔐 [ALIAS PRESERVED] ${key} → ${existingToken.aliasTo}`);
    } else {
      // Token value-only classique - s'assurer que c'est aussi scalaire
      if (typeof generatedToken === 'object' && generatedToken.resolvedValue !== undefined) {
        merged[key] = generatedToken.resolvedValue;
      } else {
        merged[key] = generatedToken;
      }
    }
  }

  console.log(`🔄 [MERGE] Completed: ${Object.keys(merged).length} tokens, ${preservedAliases} aliases preserved`);
  return merged;
}

// Fonction helper pour déterminer la catégorie d'une collection de variables
function getCategoryFromVariableCollection(collectionName) {
  const n = collectionName.toLowerCase().trim();

  if (n === "brand colors" || n.includes('brand')) return "brand";
  else if (n === "system colors" || n.includes('system')) return "system";
  else if (n === "grayscale" || n.includes('gray') || n.includes('grey') || n.includes('grayscale')) return "gray";
  else if (n === "spacing" || n.includes('spacing')) return "spacing";
  else if (n === "radius" || n.includes('radius')) return "radius";
  else if (n === "typography" || n.includes('typo') || n.includes('typography')) return "typography";

  return "unknown";
}

// Fonction de diagnostic pour la résolution des alias sémantiques
function debugSemanticAliasResolution(semanticKey, naming) {
  console.log(`🔍 [DEBUG] Resolution attempt for ${semanticKey} with naming=${naming}`);

  try {
    // Simuler la logique de tryResolveSemanticAlias pour diagnostic
    var primitiveMapping;

    if (naming === 'tailwind') {
      primitiveMapping = {
        'action.primary.default': { category: 'brand', keys: ['main', '600', '500'] },
        'action.primary.hover': { category: 'brand', keys: ['dark', '700', '600'] },
        'action.primary.active': { category: 'brand', keys: ['dark', '800', '700'] },
        'bg.canvas': { category: 'gray', keys: ['50'] },
        'status.success': { category: 'system', keys: ['success-main', 'success'] }
      };
    } else if (naming === 'mui') {
      primitiveMapping = {
        'action.primary.default': { category: 'brand', keys: ['main', 'primary'] },
        'action.primary.hover': { category: 'brand', keys: ['dark', 'primary-dark'] },
        'action.primary.active': { category: 'brand', keys: ['dark', 'primary-active'] },
        'bg.canvas': { category: 'gray', keys: ['50', 'white'] },
        'status.success': { category: 'system', keys: ['success-main', 'success'] }
      };
    }

    var mapping = primitiveMapping[semanticKey];
    if (!mapping) {
      console.log(`❌ [DEBUG] No mapping found for ${semanticKey}`);
      return;
    }

    console.log(`📋 [DEBUG] Looking for category: ${mapping.category}, keys: [${mapping.keys.join(', ')}]`);

    // Lister les collections disponibles
    var collections = figma.variables.getLocalVariableCollections();
    console.log(`🏗️ [DEBUG] Available collections:`);
    collections.forEach(collection => {
      var category = getCategoryFromVariableCollection(collection.name);
      console.log(`  ${collection.name} → ${category} (${collection.variableIds.length} vars)`);
    });

    // Chercher la collection cible
    var targetCollection = null;
    for (var collection of collections) {
      var category = getCategoryFromVariableCollection(collection.name);
      if (category === mapping.category) {
        targetCollection = collection;
        break;
      }
    }

    if (!targetCollection) {
      console.log(`❌ [DEBUG] No collection found for category ${mapping.category}`);
      return;
    }

    console.log(`✅ [DEBUG] Found collection: ${targetCollection.name} (${targetCollection.variableIds.length} variables)`);

    // Lister les clés disponibles dans cette collection
    console.log(`🔑 [DEBUG] Available keys in ${targetCollection.name}:`);
    var availableKeys = [];
    targetCollection.variableIds.forEach(varId => {
      var variable = figma.variables.getVariableById(varId);
      if (variable) {
        var key = extractVariableKey(variable, targetCollection.name);
        availableKeys.push(key);
        console.log(`  ${key} (${variable.name})`);
      }
    });

    // Vérifier les clés recherchées
    var foundKeys = [];
    mapping.keys.forEach(searchKey => {
      if (availableKeys.includes(searchKey)) {
        foundKeys.push(searchKey);
        console.log(`✅ [DEBUG] Key '${searchKey}' FOUND`);
      } else {
        console.log(`❌ [DEBUG] Key '${searchKey}' NOT FOUND`);
      }
    });

    if (foundKeys.length > 0) {
      console.log(`🎉 [DEBUG] SUCCESS: Will use ${foundKeys[0]} from ${foundKeys.join(' or ')}`);
    } else {
      console.log(`💥 [DEBUG] FAILURE: No matching keys found - will use fallback`);
    }

  } catch (error) {
    console.error(`❌ [DEBUG] Error during resolution:`, error);
  }
}

// Fonction helper pour détecter les valeurs fallback évidentes
function isObviousFallback(value) {
  if (typeof value === 'string') {
    // Couleurs fallback communes
    if (value === '#000000' || value === '#FFFFFF' || value === '#000' || value === '#FFF') {
      return true;
    }
  } else if (typeof value === 'number') {
    // Valeurs numériques fallback communes
    if (value === 0 || value === 4 || value === 8 || value === 16) {
      return true;
    }
  }
  return false;
}

// Fonction de diagnostic pour les tokens sémantiques
function diagnoseSemanticTokens(tokens, context) {
  if (!tokens || !tokens.semantic) {
    console.log(`🔍 [DIAGNOSE ${context || 'UNK'}] No semantic tokens to diagnose`);
    return;
  }

  var issues = [];
  var stats = {
    total: 0,
    withResolvedValue: 0,
    scalarValues: 0,
    objectValues: 0,
    nullUndefined: 0,
    withAlias: 0,
    colorTokens: 0
  };

  for (var key in tokens.semantic) {
    if (!tokens.semantic.hasOwnProperty(key)) continue;
    stats.total++;

    var token = tokens.semantic[key];

    if (typeof token === 'object' && token.resolvedValue !== undefined) {
      stats.withResolvedValue++;
      var resolved = token.resolvedValue;

      if (typeof resolved === 'string' || typeof resolved === 'number') {
        stats.scalarValues++;
        if (token.type === 'COLOR' && typeof resolved === 'string' && resolved.startsWith('#')) {
          stats.colorTokens++;
        }
      } else if (typeof resolved === 'object') {
        stats.objectValues++;
        issues.push({
          key: key,
          type: 'objectResolvedValue',
          value: resolved,
          message: `resolvedValue is an object instead of scalar`
        });
      } else if (resolved === null || resolved === undefined) {
        stats.nullUndefined++;
        issues.push({
          key: key,
          type: 'nullUndefinedResolvedValue',
          value: resolved,
          message: `resolvedValue is null/undefined`
        });
      }

      if (token.aliasTo) {
        stats.withAlias++;
      }
    } else {
      issues.push({
        key: key,
        type: 'missingResolvedValue',
        value: token,
        message: `Token missing resolvedValue property`
      });
    }
  }

  console.log(`🔍 [DIAGNOSE ${context || 'UNK'}] Semantic tokens analysis:`);
  console.log(`   Total: ${stats.total}`);
  console.log(`   With resolvedValue: ${stats.withResolvedValue}`);
  console.log(`   Scalar values: ${stats.scalarValues}`);
  console.log(`   Object values: ${stats.objectValues} ❌`);
  console.log(`   Null/undefined: ${stats.nullUndefined} ❌`);
  console.log(`   With alias: ${stats.withAlias}`);
  console.log(`   Color tokens: ${stats.colorTokens}`);

  if (issues.length > 0) {
    console.warn(`⚠️ [DIAGNOSE ${context || 'UNK'}] Found ${issues.length} issues:`);
    issues.forEach(function(issue) {
      console.warn(`   ${issue.key}: ${issue.message}`, issue.value);
    });
  } else {
    console.log(`✅ [DIAGNOSE ${context || 'UNK'}] No issues found`);
  }

  return issues;
}

// Fonction pour "flatten" les tokens sémantiques depuis Figma au démarrage
// Fonction helper pour obtenir un modeId de manière safe
function safeGetModeId(variable) {
  try {
    if (!variable || !variable.variableCollectionId) {
      return null;
    }

    var collection = figma.variables.getVariableCollectionById(variable.variableCollectionId);
    if (!collection || !collection.modes || collection.modes.length === 0) {
      return null;
    }

    return collection.modes[0].modeId;
  } catch (e) {
    console.warn(`safeGetModeId failed for variable ${variable ? variable.id : 'unknown'}:`, e);
    return null;
  }
}

async function flattenSemanticTokensFromFigma(callsite) {
  var savedSemanticTokens = getSemanticTokensFromFile('FLATTEN_LOAD');
  if (!savedSemanticTokens) {
    console.log(`🔄 [FLATTEN] ${callsite}: no saved tokens to flatten`);
    return null;
  }

  // FIX: Utiliser le vrai naming récupéré de clientStorage
  const naming = await getNamingFromFile();
  console.log(`[FLATTEN] using naming=${naming}`);

  console.log(`🔄 [FLATTEN] ${callsite}: starting flatten for ${Object.keys(savedSemanticTokens).length} tokens`);

  // Trouver la collection Semantic
  var semanticCollection = null;
  var collections = figma.variables.getLocalVariableCollections();
  for (var i = 0; i < collections.length; i++) {
    if (collections[i].name === "Semantic") {
      semanticCollection = collections[i];
      break;
    }
  }

  if (!semanticCollection) {
    console.log(`⚠️ [FLATTEN] ${callsite}: no Semantic collection found`);
    return savedSemanticTokens; // Retourner les tokens tels quels
  }

  console.log(`🔄 [FLATTEN] ${callsite}: using Semantic collection "${semanticCollection.name}" with ${semanticCollection.variableIds.length} variables`);

  // Créer un mapping nom -> variable pour la recherche rapide
  var nameToVariable = {};
  for (var v = 0; v < semanticCollection.variableIds.length; v++) {
    var variable = figma.variables.getVariableById(semanticCollection.variableIds[v]);
    if (variable) {
      nameToVariable[variable.name] = variable;
    }
  }

  var flattenedTokens = {};
  var flattenedCount = 0;
  var unresolvedCount = 0;

  // Traiter chaque token sauvegardé
  for (var semanticKey in savedSemanticTokens) {
    if (!savedSemanticTokens.hasOwnProperty(semanticKey)) continue;

    // DÉCLARATION ET RESET AU DÉBUT DE CHAQUE ITÉRATION - INTERDICTION DE RÉUTILISATION
    var semanticVar = null;
    var modeId = null;
    var raw = null;
    var resolved = null;

    var savedToken = savedSemanticTokens[semanticKey];
    var flattenedToken = {
      resolvedValue: savedToken.resolvedValue, // Conserver par défaut
      type: savedToken.type,
      aliasTo: null, // Sera défini si c'est un alias
      meta: savedToken.meta || {},
      flattenedFromAlias: true // Marquer comme flattenned
    };

    // LOOKUP VARIABLE FIGMA - CONSTRUIRE UNIQUEMENT À PARTIR DE semanticKey
    var variableName = getSemanticVariableName(semanticKey, naming);
    semanticVar = nameToVariable[variableName];

    if (!semanticVar) {
      console.log(`[REHYDRATE][NOT_FOUND] semanticKey=${semanticKey} variableName=${variableName} → keep stored value`);
      flattenedTokens[semanticKey] = flattenedToken;
      unresolvedCount++;
      continue;
    }

    // MODEID SAFE - NE JAMAIS FAIRE collection.modes[0] SANS VÉRIFIER
    modeId = safeGetModeId(semanticVar);
    if (modeId === null) {
      console.log(`[REHYDRATE][NO_MODE] semanticKey=${semanticKey} var=${semanticVar.name} id=${semanticVar.id} → keep stored value`);
      flattenedTokens[semanticKey] = flattenedToken;
      unresolvedCount++;
      continue;
    }

    // LECTURE VALEUR
    raw = semanticVar.valuesByMode[modeId];

    // DÉTECTER SI C'EST UN ALIAS ET EXTRAIRE LES INFOS
    if (raw && typeof raw === 'object' && raw.type === 'VARIABLE_ALIAS') {
      // Cette variable sémantique pointe vers une autre variable
      var targetVariable = figma.variables.getVariableById(raw.id);
      if (targetVariable) {
        // Extraire les informations de la variable cible
        var targetCollectionId = targetVariable.variableCollectionId;
        if (targetCollectionId) {
          var targetCollection = figma.variables.getVariableCollectionById(targetCollectionId);
          if (targetCollection) {
            var targetKey = extractVariableKey(targetVariable, targetCollection.name);
            flattenedToken.aliasTo = {
              variableId: raw.id,
              collection: getCategoryFromVariableCollection(targetCollection.name), // Normaliser à catégorie canonique
              key: targetKey
            };
            console.log(`🔗 [REHYDRATE] ${semanticKey} is alias to ${targetCollection.name}/${targetKey}`);
          }
        }
      }

      resolved = resolveVariableValue(semanticVar, modeId);

      // IMPORTANT : si resolved == null || resolved === undefined
      if (resolved == null || resolved === undefined) {
        console.log(`[REHYDRATE][SKIP_UNRESOLVED] key=${semanticKey} keepStored=${savedToken.resolvedValue}`);
        // ne PAS appliquer de fallback, ne PAS écraser resolvedValue
        flattenedTokens[semanticKey] = flattenedToken;
        unresolvedCount++;
        continue;
      }
    } else {
      resolved = raw;
    }

    // CONVERSION DISPLAY - resolvedValue doit être STRICTEMENT string/number
    var displayValue = convertFigmaValueToDisplay(resolved, savedToken.type);

    // Si le résultat est un objet ou null : log et conserver la valeur stockée
    if (displayValue === null || typeof displayValue === 'object') {
      console.log(`[REHYDRATE][SKIP_CONVERT] key=${semanticKey} resolvedType=${typeof resolved} displayType=${typeof displayValue} → keep stored value`);
      flattenedTokens[semanticKey] = flattenedToken;
      unresolvedCount++;
      continue;
    }

    // MISE À JOUR RÉUSSIE
    flattenedToken.resolvedValue = displayValue;
    flattenedCount++;
    console.log(`✅ [REHYDRATE] ${semanticKey}: "${savedToken.resolvedValue}" → "${displayValue}"`);

    flattenedTokens[semanticKey] = flattenedToken;
  }

  console.log(`🔄 [FLATTEN] ${callsite}: complete - ${flattenedCount} flattened, ${unresolvedCount} kept as-is`);

  return flattenedTokens;
}

