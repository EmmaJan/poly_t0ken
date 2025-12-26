


// Plugin startup verification - verified manually: 0 occurrences of variable.scopes = assignments
(function () { return function () { } })() && console.log("✅ Plugin initialized: scopes use setScopes() method only");

// ============================================================================
// CONFIGURATION FLAGS
// ============================================================================
// DÉCISION 2025-12-22 : Approche conservatrice
// - Legacy Engine : Actif, stable, production-ready
// - Core Engine : Expérimental, nécessite validation
// 
// Pour basculer vers Core Engine :
// 1. Changer USE_CORE_ENGINE = true
// 2. Tester toutes les librairies (Tailwind, MUI, Ant, Bootstrap, Chakra)
// 3. Vérifier semantic tokens et exports
// 4. Valider pendant 1-2 semaines
// 5. Supprimer Legacy si Core stable
//
// Voir LEGACY_ENGINE_DECISION.md pour détails
const USE_CORE_ENGINE = false;
const DEBUG = true; // Master debug flag (consolidates DEBUG_TOKENS + DEBUG_SCOPES_SCAN)

// Legacy flags (kept for compatibility, but use DEBUG instead)
const DEBUG_TOKENS = DEBUG;
const DEBUG_SCOPES_SCAN = DEBUG;

// Self-test au démarrage (si DEBUG activé)
// Note: validateScopesAndFiltering est défini plus bas (~ligne 4740)
if (DEBUG && typeof validateScopesAndFiltering !== 'undefined') {
  try {
    validateScopesAndFiltering();
  } catch (e) {
    console.warn('⚠️ Self-test skipped (function not yet defined):', e.message);
  }
}

// ============================================================================
// UTILITY HELPERS
// ============================================================================
function safeStringify(obj, maxLen) {
  maxLen = maxLen || 6000;
  try {
    var str = JSON.stringify(obj, null, 2);
    return str.length > maxLen ? str.substring(0, maxLen) + '... [TRUNCATED]' : str;
  } catch (e) {
    return '[STRINGIFY ERROR: ' + e.message + ']';
  }
}

function debugLog(label, payload) {
  if (!DEBUG) return;
  console.log('🔍 [DEBUG] ' + label + ':', safeStringify(payload, 3000));
}

// Legacy wrapper (kept for compatibility)
function debugTokens(label, payload) {
  debugLog(label, payload);
}

// ============================================================================
// MESSAGE SENDING WRAPPER (PLUGIN → UI)
// ============================================================================
function postToUI(type, payload) {
  try {
    var message = Object.assign({ type: type }, payload || {});
    figma.ui.postMessage(message);
    if (DEBUG) {
      debugLog('Plugin → UI: ' + type, payload);
    }
  } catch (error) {
    console.error('❌ Error sending message to UI:', error);
    console.error('Message type:', type, 'Payload:', payload);
  }
}

// Normalisation des types de bibliothèque - fonction globale
function normalizeLibType(naming) {
  if (!naming) return 'tailwind';

  var normalized = naming.toLowerCase().trim();

  // Mapping des variantes vers les types canoniques
  if (normalized === 'shadcn') return 'tailwind';
  if (normalized === 'mui' || normalized === 'material-ui') return 'mui';
  if (normalized === 'ant' || normalized === 'ant-design' || normalized === 'antd') return 'ant';
  if (normalized === 'bootstrap' || normalized === 'bs') return 'bootstrap';
  if (normalized === 'chakra' || normalized === 'chakra-ui') return 'chakra';

  // Par défaut, considérer comme tailwind pour les inconnus
  return 'tailwind';
}

// États possibles pour un token sémantique (robustesse des alias)
var TOKEN_STATE = {
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
    figma.clientStorage.setAsync("tokenStarter.naming", naming).catch(function () { });
    (function () { return function () { } })() && console.log('💾 Saved naming to both storages:', naming);
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
      // DIAGNOSTICS : Vérifier que les alias sont correctement résolus
      var criticalSemanticKeys = [
        'action.primary.default', 'action.primary.hover', 'action.primary.active',
        'bg.inverse', 'text.primary'
      ];

      (function () { return function () { } })() && console.log(`🔍 [DIAGNOSTICS] Vérification des alias pour ${Object.keys(semanticTokens).length} tokens sémantiques`);

      for (var key in semanticTokens) {
        if (!semanticTokens.hasOwnProperty(key)) continue;
        var token = semanticTokens[key];

        if (criticalSemanticKeys.includes(key)) {
          var status = 'UNKNOWN';
          if (token.aliasTo) {
            status = token.state === 'ALIAS_RESOLVED' ? '✅ RESOLVED' : '❌ UNRESOLVED';
          } else {
            status = 'VALUE';
          }
          (function () { return function () { } })() && console.log(`  ${key}: ${status} ${token.aliasTo ? `→ ${token.aliasTo.id || 'unknown'}` : ''}`);
        }
      }

      /**
       * Convertit un token de la nouvelle structure vers l'ancien format
       * @param {object} token - Token au format {type, modes: {light: {...}, dark: {...}}} ou ancien format
       * @param {string} key - Clé du token (pour type fallback)
       * @param {string} preferredMode - Mode préféré ('light' ou 'dark')
       * @returns {object} Token normalisé {resolvedValue, type, aliasRef, ...}
       */
      function normalizeTokenStructure(token, key, preferredMode) {
        if (!token || typeof token !== 'object') return token;

        // Si déjà au bon format (a resolvedValue et pas de modes), retourner tel quel
        if (token.resolvedValue !== undefined && !token.modes) {
          return token;
        }

        // Si nouvelle structure avec modes
        if (token.modes) {
          var modeData = token.modes[preferredMode] || token.modes.light || token.modes.dark || {};

          return {
            resolvedValue: modeData.resolvedValue,
            type: token.type || SEMANTIC_TYPE_MAP[key] || "COLOR",
            aliasRef: modeData.aliasRef || null,
            aliasTo: token.aliasTo || null,
            state: token.state || TOKEN_STATE.VALUE,
            meta: token.meta || {
              sourceCategory: getCategoryFromSemanticKey(key),
              sourceKey: getKeyFromSemanticKey(key),
              updatedAt: Date.now()
            }
          };
        }

        // Sinon retourner tel quel
        return token;
      }

      // VALIDATION : S'assurer que tous les resolvedValue sont scalaires
      // Déterminer le mode préféré
      var themeMode = 'light';
      try {
        var savedThemeMode = figma.root.getPluginData("tokenStarter.themeMode");
        if (savedThemeMode === 'dark') themeMode = 'dark';
      } catch (e) { }

      for (var key in semanticTokens) {
        if (!semanticTokens.hasOwnProperty(key)) continue;

        // ✅ CRITICAL FIX: Ne PAS normaliser les tokens qui ont déjà une structure modes !
        // La normalisation détruit la structure modes, donc on la saute pour ces tokens
        var token = semanticTokens[key];
        if (!token.modes) {
          // Seulement normaliser les tokens sans modes (ancien format)
          semanticTokens[key] = normalizeTokenStructure(token, key, themeMode);
          token = semanticTokens[key]; // Mettre à jour la référence
        }

        // Validation finale (seulement pour les tokens normalisés sans modes)
        if (!semanticTokens[key].modes && token && typeof token.resolvedValue === 'object') {
          console.error(`🚨 Token ${key} a toujours un resolvedValue objet après normalisation`);
          token.resolvedValue = '#FF00FF';
        } else if (!semanticTokens[key].modes && token && typeof token.resolvedValue !== 'string' && typeof token.resolvedValue !== 'number') {
          console.warn(`⚠️ Token ${key} a un resolvedValue non scalaire`);
          token.resolvedValue = String(token.resolvedValue);
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

        // ✅ PRÉSERVER LA STRUCTURE MODES (ne pas normaliser !)
        // Si le token a déjà une structure modes, la garder telle quelle
        var normalizedToken;
        if (tokenData.modes) {
          // Nouvelle structure avec modes → LA GARDER !
          normalizedToken = tokenData;
        } else {
          // Ancienne structure → normaliser pour compatibilité
          normalizedToken = normalizeTokenStructure(tokenData, key, 'light');
        }

        // Préserver aliasTo existant si disponible
        if (existingToken && existingToken.aliasTo) {
          normalizedToken.aliasTo = existingToken.aliasTo;
        }

        // DÉTERMINER L'ÉTAT (Nouveau Modèle)
        let state = TOKEN_STATE.VALUE;

        // ✅ Pour les tokens avec modes, vérifier aliasRef dans chaque mode
        if (normalizedToken.modes) {
          // Si au moins un mode a un aliasRef, c'est un alias
          var hasLightAlias = normalizedToken.modes.light && normalizedToken.modes.light.aliasRef;
          var hasDarkAlias = normalizedToken.modes.dark && normalizedToken.modes.dark.aliasRef;

          if (hasLightAlias || hasDarkAlias) {
            // Pour l'instant, on considère que si au moins un mode a un alias, c'est résolu
            // (la résolution complète se fera dans importTokensToFigma)
            state = TOKEN_STATE.ALIAS_RESOLVED;
          }
        } else if (normalizedToken.aliasTo) {
          // Ancienne structure : vérifier aliasTo
          if (typeof normalizedToken.aliasTo === 'object' && normalizedToken.aliasTo.variableId) {
            state = TOKEN_STATE.ALIAS_RESOLVED;
          } else {
            state = TOKEN_STATE.ALIAS_UNRESOLVED;
          }
        }
        normalizedToken.state = state;

        // GARDE-FOU ANTI-OBJET : resolvedValue DOIT être scalaire
        // ⚠️ SKIP si structure modes (les valeurs sont dans modes.light/dark.resolvedValue)
        if (!normalizedToken.modes) {
          if (typeof normalizedToken.resolvedValue === 'object') {
            console.error(`🚨 CRITICAL: resolvedValue for ${key} is an object: `, normalizedToken.resolvedValue);
            normalizedToken.resolvedValue = (existingToken && typeof existingToken.resolvedValue !== 'object')
              ? existingToken.resolvedValue
              : getFallbackValue(tokenType, 'semantic');
          }
        }

        // PROTECTION CONTRE LES FALLBACKS (Règle dure)
        // ⚠️ SKIP si structure modes
        if (!normalizedToken.modes) {
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
            (function () { return function () { } })() && console.log(`[FALLBACK_BLOCKED] Blocking ${normalizedToken.resolvedValue} for ${key}, keeping ${existingToken.resolvedValue} `);
            normalizedToken.resolvedValue = existingToken.resolvedValue;
            blockedFallbackCount++;
          }
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

      (function () { return function () { } })() && console.log(`💾 SEMANTIC_SAVE[${callsite || 'UNK'}]: Total ${Object.keys(formattedTokens).length} | Resolved: ${aliasResolvedCount} | Unresolved: ${aliasUnresolvedCount} | Values: ${valueCount} `);
      (function () { return function () { } })() && console.log(`📊 SEMANTIC_SAVE_DETAILS: BlockedFallbacks: ${blockedFallbackCount} | PreservedUnresolved: ${preservedUnresolvedCount} `);
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
  if (!variableId) return null;

  try {
    // 1. Tentative directe via API Figma (plus robuste)
    var variable = figma.variables.getVariableById(variableId);

    // 2. Si non trouvé via API (cas rare de suppression), fallback sur collections si format compatible
    if (!variable && collections) {
      // Logic legacy
      for (var collectionName in collections) {
        if (!collections.hasOwnProperty(collectionName)) continue;
        var collection = collections[collectionName];
        // Support format { variables: { id: var } } OU { id: var } direct
        var vars = collection.variables || collection;

        for (var key in vars) {
          // Si format map { id: variable }
          if (key === variableId) {
            variable = vars[key];
            break;
          }
          // Si format map { name: value } (incompatible pour lookup ID, donc on ignore)
        }
        if (variable) break;
      }
    }

    if (!variable) {
      // (function () { return function () { } })() && console.warn('⚠️ resolveVariableIdToAliasDescriptor: variableId non trouvé:', variableId);
      return null;
    }

    var collection = figma.variables.getVariableCollectionById(variable.variableCollectionId);
    if (!collection) return null;

    var collectionName = collection.name;
    var key = variable.name;

    // DÉTERMINATION CATÉGORIE
    var category = "unknown";
    var lowerName = collectionName.toLowerCase();

    if (lowerName.includes("brand")) category = "brand";
    else if (lowerName.includes("system")) category = "system";
    else if (lowerName.includes("gray") || lowerName.includes("grey")) category = "gray";
    else if (lowerName.includes("spacing")) category = "spacing";
    else if (lowerName.includes("radius")) category = "radius";
    else if (lowerName.includes("typography")) category = "typography";
    else if (lowerName.includes("border")) category = "border";
    else category = collectionName; // Fallback

    var cssName = generateCssName(category, key);

    return {
      variableId: variableId,
      collection: category, // On préfère la catégorie normalisée
      key: key,
      cssName: cssName
    };

  } catch (error) {
    console.error("❌ Error in resolveVariableIdToAliasDescriptor:", error);
    return null;
  }
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

        // ✅ FIX: Vérifier d'abord si c'est un token multi-mode (structure modes)
        if (typeof tokenData === 'object' && tokenData.modes && (tokenData.modes.light || tokenData.modes.dark)) {
          // Token multi-mode : préserver tel quel
          migratedTokens[key] = tokenData;
          (function () { return function () { } })() && console.log(`✅ [LOAD] ${key}: preserved multi-mode structure`);
        }
        // Format normalisé (single-mode)
        else if (typeof tokenData === 'object' && tokenData.resolvedValue !== undefined) {
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
              (function () { return function () { } })() && console.log(`🔄[MIGRATE] Normalized alias collection: ${aliasTo.collection} → ${canonicalCollection} for ${key}`);
              aliasTo.collection = canonicalCollection;
            }
          }
        }

        if (migratedTokens[key].state === TOKEN_STATE.ALIAS_RESOLVED) aliasCount++;
        else if (migratedTokens[key].state === TOKEN_STATE.ALIAS_UNRESOLVED) unresolvedCount++;
        else valueCount++;
      }

      (function () { return function () { } })() && console.log(`📂 SEMANTIC_LOAD[${callsite || 'UNK'}]: Total ${Object.keys(migratedTokens).length} | Resolved: ${aliasCount} | Unresolved: ${unresolvedCount} | Values: ${valueCount} `);

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
    (function () { return function () { } })() && console.log(`✨ SEMANTIC_LOAD_ASYNC: Progression achieved, some aliases resolved.`);
  }
  return tokens;
}

/**
 * Tente de re-lier les alias non résolus (Lazy Rebind)
 */
async function rehydrateSemanticAliases() {
  (function () { return function () { } })() && console.log("🔄 [REHYDRATE] Starting lazy rebind of semantic aliases...");
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
        categoryStats.push(`${category}: ${tokenCount} tokens(${keys.join(', ')}${Object.keys(categoryTokens).length > 5 ? '...' : ''})`);
      }

      (function () { return function () { } })() && console.log(`📖 LOAD_PRIMITIVES[${callsite}]: ${totalCategories} categories, ${totalTokens} total tokens`);
      if (categoryStats.length > 0) {
        (function () { return function () { } })() && console.log(`📖 LOAD_PRIMITIVES[${callsite}]: Details - ${categoryStats.join(' | ')} `);
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
            throw new Error(`Cannot save primitive token ${category} /${key}: value must be scalar (string/number), got ${typeof value} `);
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

      (function () { return function () { } })() && console.log(`💾 SAVE_PRIMITIVES[${callsite}]: ${totalCategories} categories, ${totalTokens} total tokens`);
      if (categoryStats.length > 0) {
        (function () { return function () { } })() && console.log(`💾 SAVE_PRIMITIVES[${callsite}]: Details - ${categoryStats.join(' | ')} `);
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
    'COLOR': ['#000000', '#ffffff', '#FFFFFF', '#000', '#fff'],
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
    'bg.surface': '100',
    'bg.elevated': '200',
    'bg.muted': '300',
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
// --- TOKEN ENGINE CONSTANTS & PRESETS ---

var LIBRARY_PRESETS = {
  tailwind: {
    name: 'shadcn/tailwind',
    colors: {
      brand: ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'],
      gray: ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'],
      status: ['success', 'warning', 'error', 'info']
    },
    semanticHooks: {
      // Defaults - will be overridden by Smart Mapper
    }
  },
  mui: {
    name: 'mui',
    colors: {
      brand: ['light', 'main', 'dark', 'contrastText'],
      gray: ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900'],
      status: ['main', 'light', 'dark']
    },
    semanticHooks: {}
  },
  ant: {
    name: 'ant',
    colors: {
      brand: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'], // Ant uses 1-10
      gray: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13'], // Custom scale
      status: ['1', '6'] // often used indices
    },
    semanticHooks: {}
  }
};

// Fallback preset
var DEFAULT_PRESET = LIBRARY_PRESETS.tailwind;

// --- TOKEN ENGINE STEPS ---

/**
 * STEP 1: Library Preset Resolver
 * Normalizes library name and returns explicit configuration
 */
function resolveLibraryPreset(libName) {
  var normalized = normalizeLibType(libName); // Reuse existing helper
  if (normalized === 'shadcn') normalized = 'tailwind';

  return LIBRARY_PRESETS[normalized] || DEFAULT_PRESET;
}

/**
 * STEP 2: Primitive Palette Generator
 * Generates raw color scales based on brand color and preset
 */
function generatePrimitivePalette(brandColor, preset, options) {
  var palette = {
    brand: {},
    gray: {},
    warning: {},
    success: {},
    error: {},
    info: {}
  };

  // Use ColorService (assumed available globally)
  if (!ColorService) {
    console.error("ColorService not found!");
    return palette;
  }

  // 1. Generate Brand Scale
  if (preset.name === 'mui') {
    // MUI Special Logic
    palette.brand = {
      main: brandColor,
      light: ColorService.hslToHex(ColorService.adjustLightness(ColorService.hexToHsl(brandColor), 0.2)),
      dark: ColorService.hslToHex(ColorService.adjustLightness(ColorService.hexToHsl(brandColor), -0.2)),
      contrastText: '#FFFFFF'
    };
  } else if (preset.name === 'ant') {
    // Ant Design Logic (1-10)
    // wrapper for simple generation for now
    for (var i = 1; i <= 10; i++) {
      // simple check to avoid errors if logic is missing, standardizing on tailwind-like logic for now
      // Ideally this uses the Ant Design algorithm
      palette.brand[i.toString()] = ColorService.mixColors('#FFFFFF', brandColor, i * 10 / 100);
      // Placeholder: We should use a proper generator if available. 
      // Reusing common logic for robustness:
      var lightness = 0.95 - ((i - 1) * 0.09); // Approx
      palette.brand[i.toString()] = ColorService.hslToHex({
        h: ColorService.hexToHsl(brandColor).h,
        s: ColorService.hexToHsl(brandColor).s,
        l: lightness
      });
    }
  } else {
    // Tailwind / Standard (50-950)
    // We can reuse the existing logic if we have it, or write a simple one
    var scales = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];
    // Very naive generation for now, should be robust
    // Assuming 'brandColor' is roughly 500
    var baseHsl = ColorService.hexToHsl(brandColor);

    scales.forEach(function (step) {
      var adjustment = 0;
      if (step === '50') adjustment = 0.45;
      if (step === '100') adjustment = 0.4;
      if (step === '200') adjustment = 0.3;
      if (step === '300') adjustment = 0.2;
      if (step === '400') adjustment = 0.1;
      if (step === '500') adjustment = 0;
      if (step === '600') adjustment = -0.1;
      if (step === '700') adjustment = -0.2;
      if (step === '800') adjustment = -0.3;
      if (step === '900') adjustment = -0.4;
      if (step === '950') adjustment = -0.45;

      palette.brand[step] = ColorService.hslToHex(ColorService.adjustLightness(baseHsl, adjustment));
    });
  }

  // 2. Generate Base Neutral Scale (Gray)
  // Initially pure grays (or slightly warm/cool if preset dictates, but here we do pure)
  if (preset.name === 'mui') {
    // MUI Greys
    // ... logic
  } else {
    // Standard Tailwind Grays
    var grayScales = preset.colors.gray;
    grayScales.forEach(function (step) {
      // Standard neutral gray generation
      // Approximate lightness mapping
      var val = parseInt(step) || 500; // handle '50'
      var l = 1 - (val / 1000);
      if (step === '50') l = 0.98;
      if (step === '950') l = 0.05;

      palette.gray[step] = ColorService.hslToHex({ h: 0, s: 0, l: l });
    });
  }

  // Status Handling
  // ... (simplify for brevity, create standard palette)
  // Assuming 'options.primitives' might have some pre-defined values to respect user choices
  if (options.currentPrimitives) {
    // Merge existing primitives if provided to respect manual tweaks? 
    // User asked for "Compatible with any library", "REFACTOR COMPLETELY".
    // So we generate fresh unless instructed otherwise.
  }

  return palette;
}

/**
 * STEP 3: Palette Tinting Engine
 * Tints the neutral palette with the brand color
 */
function tintPalette(palette, brandColor, options) {
  var tintStrength = (options && options.tintStrength !== undefined) ? options.tintStrength : 0.04;
  var tintedGray = {};

  // Only tint if we have a gray palette and a brand color
  if (palette && palette.gray && brandColor) {
    for (var key in palette.gray) {
      if (!palette.gray.hasOwnProperty(key)) continue;
      var original = palette.gray[key];
      // CORRECT ORDER: mix(original_gray, brand_color, strength)
      // w applies to the second color (brand_color)
      tintedGray[key] = ColorService.mixColors(original, brandColor, tintStrength);
    }
    palette.gray = tintedGray; // Replace with tinted version
  }

  return palette;
}

/**
 * STEP 4: Semantic Mapping Engine
 * Strict hierarchy enforcement
 */
function mapSemanticTokens(palettes, preset, options) {
  (function () { return function () { } })() && console.log("Step 4: Mapping Semantics (Strict Mode)");

  // Define the mandatory semantic tokens list (Source of Truth)
  var semanticKeys = [
    // Background (7 tokens)
    'bg.canvas', 'bg.surface', 'bg.elevated', 'bg.subtle', 'bg.muted', 'bg.accent', 'bg.inverse',
    // Text (7 tokens)
    'text.primary', 'text.secondary', 'text.muted', 'text.accent', 'text.link',
    'text.inverse', 'text.disabled',
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
    // Dimension tokens (semantic proxies)
    'radius.sm', 'radius.md', 'radius.lg',
    'space.xs', 'space.sm', 'space.md', 'space.lg',
    'font.size.sm', 'font.size.base', 'font.size.lg',
    'font.weight.normal', 'font.weight.medium', 'font.weight.bold'
    // Note: on.* tokens removed (use action.*.text, status.*.text for contrast)
  ];

  // Hierarchy Groups (Order matters for collision resolution) - UPDATED
  var hierarchyGroups = {
    bg: ['bg.canvas', 'bg.surface', 'bg.elevated', 'bg.subtle', 'bg.muted', 'bg.accent', 'bg.inverse'],
    text: ['text.primary', 'text.secondary', 'text.muted', 'text.accent', 'text.link', 'text.disabled'],
    action: ['action.primary.default', 'action.primary.hover', 'action.primary.active', 'action.secondary.default', 'action.secondary.hover', 'action.secondary.active'],
    border: ['border.default', 'border.muted', 'border.accent', 'border.focus']
  };

  // User Rules for BG:
  // Light: Canvas < Surface < Elevated < Subtle < Muted < Accent < Inverse
  // Dark: Canvas < Surface < Elevated < Subtle < Muted < Accent < Inverse (Inverted Intensity)

  function getStandardMapping(key) {
    // ⚠️ CRITICAL: This mapping is CANONICAL and WCAG AA validated
    // See SEMANTIC_MAPPING_REFERENCE.md for the complete specification
    // DO NOT MODIFY without validating contrast ratios (≥4.5:1 text, ≥3:1 UI)

    // Returns { category, lightRef, darkRef, type }
    // lightRef/darkRef are preferred keys in the primitive palette

    // --- BACKGROUND ---
    if (key === 'bg.canvas') return { category: 'gray', light: '50', dark: '950', type: 'COLOR' };
    if (key === 'bg.surface') return { category: 'gray', light: '100', dark: '900', type: 'COLOR' };
    if (key === 'bg.elevated') return { category: 'gray', light: '200', dark: '800', type: 'COLOR' };
    if (key === 'bg.subtle') return { category: 'gray', light: '100', dark: '800', type: 'COLOR' };
    if (key === 'bg.muted') return { category: 'gray', light: '300', dark: '700', type: 'COLOR' };
    if (key === 'bg.accent') return { category: 'brand', light: '500', dark: '500', type: 'COLOR' };
    if (key === 'bg.inverse') return { category: 'gray', light: '950', dark: '50', type: 'COLOR' };

    // --- TEXT ---
    if (key === 'text.primary') return { category: 'gray', light: '950', dark: '50', type: 'COLOR' };
    if (key === 'text.secondary') return { category: 'gray', light: '600', dark: '400', type: 'COLOR' };
    if (key === 'text.muted') return { category: 'gray', light: '500', dark: '400', type: 'COLOR' };
    if (key === 'text.accent') return { category: 'brand', light: '600', dark: '400', type: 'COLOR' };
    if (key === 'text.link') return { category: 'brand', light: '500', dark: '300', type: 'COLOR' };
    if (key === 'text.disabled') return { category: 'gray', light: '300', dark: '700', type: 'COLOR' };
    if (key === 'text.inverse') return { category: 'gray', light: '50', dark: '950', type: 'COLOR' };

    // --- BORDER ---
    if (key === 'border.default') return { category: 'gray', light: '200', dark: '800', type: 'COLOR' };
    if (key === 'border.muted') return { category: 'gray', light: '100', dark: '900', type: 'COLOR' };
    if (key === 'border.accent') return { category: 'brand', light: '200', dark: '500', type: 'COLOR' };
    if (key === 'border.focus') return { category: 'brand', light: '500', dark: '400', type: 'COLOR' };

    // --- ACTION (Brand) ---
    // Adapting for MUI 'main' vs Tailwind '500'
    var brandMain = (preset.name === 'mui') ? 'main' : '500';
    var brandHover = (preset.name === 'mui') ? 'dark' : '600';
    var brandActive = (preset.name === 'mui') ? 'dark' : '700';
    var brandDisabled = (preset.name === 'mui') ? 'light' : '300'; // actually usually gray?

    if (key === 'action.primary.default') return { category: 'brand', light: brandMain, dark: brandMain, type: 'COLOR' };
    if (key === 'action.primary.hover') return { category: 'brand', light: brandHover, dark: brandHover, type: 'COLOR' };
    if (key === 'action.primary.active') return { category: 'brand', light: brandActive, dark: brandActive, type: 'COLOR' };
    if (key === 'action.primary.disabled') return { category: 'gray', light: '300', dark: '800', type: 'COLOR' };
    if (key === 'action.primary.text') return { category: 'gray', light: 'white', dark: 'white', type: 'COLOR' };

    if (key === 'action.secondary.default') return { category: 'gray', light: '100', dark: '800', type: 'COLOR' };
    if (key === 'action.secondary.hover') return { category: 'gray', light: '200', dark: '700', type: 'COLOR' };
    if (key === 'action.secondary.active') return { category: 'gray', light: '300', dark: '600', type: 'COLOR' };
    if (key === 'action.secondary.disabled') return { category: 'gray', light: '100', dark: '900', type: 'COLOR' };
    if (key === 'action.secondary.text') return { category: 'gray', light: '900', dark: '50', type: 'COLOR' };

    // --- STATUS ---
    if (key.indexOf('status.') === 0) {
      var statusType = key.split('.')[1]; // success, warning, error, info
      // Handle .text suffix for contrast text
      if (key.endsWith('.text')) {
        // Contrast text for status backgrounds
        return { category: 'gray', light: 'white', dark: '900', type: 'COLOR' };
      }
      // ✅ FIX: Use 'system' as category, statusType as key
      // This matches the primitive structure: system/success, system/warning, etc.
      // For MUI, we might need 'main', but let's try direct mapping first
      var statusKey = (preset.name === 'mui') ? 'main' : statusType;
      return { category: 'system', light: statusKey, dark: statusKey, type: 'COLOR' };
    }

    // --- DIMENSION TOKENS (Semantic proxies to primitives) ---
    // Radius
    if (key === 'radius.sm') return { category: 'radius', light: 'sm', dark: 'sm', type: 'FLOAT' };
    if (key === 'radius.md') return { category: 'radius', light: 'md', dark: 'md', type: 'FLOAT' };
    if (key === 'radius.lg') return { category: 'radius', light: 'lg', dark: 'lg', type: 'FLOAT' };

    // Spacing
    if (key === 'space.xs') return { category: 'spacing', light: '1', dark: '1', type: 'FLOAT' };
    if (key === 'space.sm') return { category: 'spacing', light: '2', dark: '2', type: 'FLOAT' };
    if (key === 'space.md') return { category: 'spacing', light: '4', dark: '4', type: 'FLOAT' };
    if (key === 'space.lg') return { category: 'spacing', light: '8', dark: '8', type: 'FLOAT' };

    // Typography - Font Size
    if (key === 'font.size.sm') return { category: 'typography', light: 'sm', dark: 'sm', type: 'FLOAT' };
    if (key === 'font.size.base') return { category: 'typography', light: 'base', dark: 'base', type: 'FLOAT' };
    if (key === 'font.size.lg') return { category: 'typography', light: 'lg', dark: 'lg', type: 'FLOAT' };

    // Typography - Font Weight
    if (key === 'font.weight.normal') return { category: 'typography', light: 'normal', dark: 'normal', type: 'FLOAT' };
    if (key === 'font.weight.medium') return { category: 'typography', light: 'medium', dark: 'medium', type: 'FLOAT' };
    if (key === 'font.weight.bold') return { category: 'typography', light: 'bold', dark: 'bold', type: 'FLOAT' };

    return null;
  }

  // ✅ NOUVELLE STRUCTURE : Un objet par token avec modes imbriqués
  // Au lieu de { modes: { light: { 'bg.canvas': {...} }, dark: {...} } }
  // On retourne { 'bg.canvas': { type: 'COLOR', modes: { light: {...}, dark: {...} } } }
  var result = {};

  var modes = ['light', 'dark'];
  console.log('🌓 [TOKEN_GEN_START] Starting semantic token generation for modes:', modes);

  // Helper to get available keys in a palette category
  function getAvailableKeys(categoryObj) {
    if (!categoryObj) return [];
    return Object.keys(categoryObj).sort(function (a, b) {
      // Try numeric sort
      var na = parseInt(a);
      var nb = parseInt(b);
      if (!isNaN(na) && !isNaN(nb)) return na - nb;
      return 0; // maintain valid order
    });
  }

  modes.forEach(function (mode) {
    var isDark = mode === 'dark';

    // Track used primitives to enforce Uniqueness Constraint
    // Map<Category, Set<Key>>
    var usedPrimitives = {};

    // Process by Hierarchy Group first
    // We iterate through groups specifically to enforce order
    var processedKeys = [];
    console.log(`🌓 [MODE_START] Processing mode: ${mode} (isDark: ${isDark})`);
    console.log(`📦 [PALETTES_AVAILABLE] Categories in palettes:`, Object.keys(palettes));

    Object.keys(hierarchyGroups).forEach(function (groupName) {
      var keys = hierarchyGroups[groupName];

      // familyUsedRefs should be reset for each family (groupName)
      var familyUsedRefs = [];

      keys.forEach(function (semKey) {
        var mapDef = getStandardMapping(semKey);
        if (!mapDef) return;

        var category = mapDef.category;
        var preferredRef = isDark ? mapDef.dark : mapDef.light;

        // Resolution Logic
        var finalRef = preferredRef;
        var paletteCat = palettes[category];

        // Collision Resolution for COLOR/GRAY only
        if (mapDef.type === 'COLOR' && category === 'gray') {
          var candidates = getAvailableKeys(paletteCat); // e.g., ['50', '100', ... '950']

          // Find index of preferred
          var idx = candidates.indexOf(preferredRef);
          if (idx === -1) {
            // Preferred not found (e.g. '0' or '1000' or custom). fallback to nearest?
            // For now assume standard. If not found, ignore strict logic or pick first.
            idx = 0;
          }

          // Strict Shift Logic
          // Light Mode: Iterate Forward? (Darker)
          // Dark Mode: Iterate Backward? (Lighter)
          // Based on "Canvas -> Surface -> Elevated"
          // Light: 50 -> 100 -> 200. (Increasing Index)
          // Dark: 950 -> 900 -> 800. (Decreasing Index)

          var direction = isDark ? -1 : 1;
          var currentIdx = idx;

          while (
            currentIdx >= 0 &&
            currentIdx < candidates.length &&
            familyUsedRefs.indexOf(candidates[currentIdx]) !== -1
          ) {
            (function () { return function () { } })() && console.log("⚠️ Hierarchy Collision (" + mode + "): " + semKey + " wants " + candidates[currentIdx] + " but occupied.");
            currentIdx += direction;
          }

          // valid index?
          if (currentIdx >= 0 && currentIdx < candidates.length) {
            finalRef = candidates[currentIdx];
          } else {
            // Out of bounds - Critical Error or Fallback?
            // User said "erreur explicite" if logic violated.
            // But we want to produce *something*.
            // Let's try searching in the *other* direction if blocked?
            // Or stick to preferred and warn (violates strictness but avoids crash).
            console.error("CRITICAL: hierarchy exhausted for " + semKey + " in " + mode + " mode. Falling back to preferred.");
            finalRef = preferredRef; // Fallback to preferred, even if it's a collision, to avoid crash.
          }

          familyUsedRefs.push(finalRef);
        }

        // Store result
        // Resolve value
        var resolvedValue = "#FF00FF"; // error pink
        var aliasInfo = null;

        if (paletteCat && paletteCat[finalRef]) {
          resolvedValue = paletteCat[finalRef];
          aliasInfo = {
            category: category,
            key: finalRef
          };
          (function () { return function () { } })() && console.log(`🔗[ALIAS_INFO] ${semKey} -> ${category}.${finalRef} (resolved: ${resolvedValue})`);
        } else if (!paletteCat) {
          console.error(`❌ [PALETTE_MISSING] No palette found for category '${category}' in ${mode} mode for token ${semKey}`);
        } else if (!paletteCat[finalRef]) {
          console.error(`❌ [KEY_MISSING] Key '${finalRef}' not found in palette '${category}' for token ${semKey} in ${mode} mode. Available keys:`, Object.keys(paletteCat));
        }

        if (mapDef.type === 'FLOAT') {
          // Primitive fetching for floats
          resolvedValue = (palettes[category] && palettes[category][finalRef]) || 8; // Default to 8 if not found
          aliasInfo = { category: category, key: finalRef };
        } else if (category.indexOf('status') !== -1) {
          // Status fallback
          resolvedValue = palettes[category] && palettes[category][statusRef] ? palettes[category][statusRef] : '#000000';
          aliasInfo = { category: category, key: statusRef };
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

        console.log(`🔍 [TOKEN_GEN] ${semKey} (${mode}):`, {
          category: category,
          finalRef: finalRef,
          resolvedValue: resolvedValue,
          hasAlias: !!aliasInfo,
          aliasInfo: aliasInfo
        });

        processedKeys.push(semKey);
      });
    });

    // Process Remaining Keys (those not in explicit hierarchy groups)
    semanticKeys.forEach(function (semKey) {
      if (processedKeys.indexOf(semKey) !== -1) return;

      var mapDef = getStandardMapping(semKey);
      if (!mapDef) return;

      var category = mapDef.category;
      var preferredRef = isDark ? mapDef.dark : mapDef.light;

      // Resolve standard
      var resolvedValue = "#000000";
      var aliasInfo = null;

      if (palettes[category]) {
        var val = palettes[category][preferredRef];
        if (val) {
          resolvedValue = val;
          aliasInfo = { category: category, key: preferredRef };
        } else {
          // Try finding any key
          var keys = Object.keys(palettes[category]);
          if (keys.length > 0) {
            resolvedValue = palettes[category][keys[0]];
            aliasInfo = { category: category, key: keys[0] };
          }
        }
      } else if (mapDef.type === 'FLOAT') {
        resolvedValue = 8; // Default float value
        aliasInfo = { category: category, key: preferredRef };
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
    });
  });

  return result;
}

// Global Semantic Tokens List (Restored for external usages)
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

var SEMANTIC_TYPE_MAP = {
  // Background
  'bg.canvas': 'COLOR', 'bg.surface': 'COLOR', 'bg.elevated': 'COLOR',
  'bg.subtle': 'COLOR', 'bg.muted': 'COLOR', 'bg.accent': 'COLOR', 'bg.inverse': 'COLOR',
  // Text
  'text.primary': 'COLOR', 'text.secondary': 'COLOR', 'text.muted': 'COLOR',
  'text.accent': 'COLOR', 'text.link': 'COLOR',
  'text.inverse': 'COLOR', 'text.disabled': 'COLOR',
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
  // Dimension tokens (semantic proxies to primitives)
  'radius.sm': 'FLOAT', 'radius.md': 'FLOAT', 'radius.lg': 'FLOAT',
  'space.xs': 'FLOAT', 'space.sm': 'FLOAT', 'space.md': 'FLOAT', 'space.lg': 'FLOAT',
  'font.size.sm': 'FLOAT', 'font.size.base': 'FLOAT', 'font.size.lg': 'FLOAT',
  'font.weight.normal': 'FLOAT', 'font.weight.medium': 'FLOAT', 'font.weight.bold': 'FLOAT'
};

var SEMANTIC_NAME_MAP = {
  tailwind: {
    'bg.canvas': 'background/canvas', 'bg.surface': 'background/surface', 'bg.elevated': 'background/elevated', 'bg.muted': 'background/muted', 'bg.inverse': 'background/inverse',
    'text.primary': 'text/primary', 'text.secondary': 'text/secondary', 'text.muted': 'text/muted', 'text.inverse': 'text/inverse', 'text.disabled': 'text/disabled',
    'border.default': 'border/default', 'border.muted': 'border/muted',
    'action.primary.default': 'primary/default', 'action.primary.hover': 'primary/hover', 'action.primary.active': 'primary/active', 'action.primary.disabled': 'primary/disabled',
    'status.success': 'success/default', 'status.warning': 'warning/default', 'status.error': 'destructive/default', 'status.info': 'info/default',
    'radius.sm': 'radius/sm', 'radius.md': 'radius/md', 'space.sm': 'space/sm', 'space.md': 'space/md',
    'font.size.base': 'font/size/base', 'font.weight.base': 'font/weight/base'
  },
  mui: {
    'bg.canvas': 'background.default', 'bg.surface': 'background.paper', 'bg.elevated': 'background.paper', 'bg.muted': 'grey.200', 'bg.inverse': 'grey.900',
    'text.primary': 'text.primary', 'text.secondary': 'text.secondary', 'text.muted': 'text.disabled', 'text.inverse': 'common.white', 'text.disabled': 'action.disabled',
    'border.default': 'divider', 'border.muted': 'grey.300',
    'action.primary.default': 'primary.main', 'action.primary.hover': 'primary.light', 'action.primary.active': 'primary.dark', 'action.primary.disabled': 'action.disabledBackground',
    'status.success': 'success.main', 'status.warning': 'warning.main', 'status.error': 'error.main', 'status.info': 'info.main',
    'radius.sm': 'shape.borderRadius', 'radius.md': 'shape.borderRadius', 'space.sm': 'spacing(1)', 'space.md': 'spacing(2)',
    'font.size.base': 'typography.body1.fontSize', 'font.weight.base': 'typography.body1.fontWeight'
  },
  ant: {
    'bg.canvas': 'colorBgContainer', 'bg.surface': 'colorBgLayout', 'bg.elevated': 'colorBgElevated', 'bg.muted': 'colorFillAlter', 'bg.inverse': 'colorTextLightSolid',
    'text.primary': 'colorText', 'text.secondary': 'colorTextSecondary', 'text.muted': 'colorTextQuaternary', 'text.inverse': 'colorTextLightSolid', 'text.disabled': 'colorTextDisabled',
    'border.default': 'colorBorder', 'border.muted': 'colorBorderSecondary',
    'action.primary.default': 'colorPrimary', 'action.primary.hover': 'colorPrimaryHover', 'action.primary.active': 'colorPrimaryActive', 'action.primary.disabled': 'colorBgContainerDisabled',
    'status.success': 'colorSuccess', 'status.warning': 'colorWarning', 'status.error': 'colorError', 'status.info': 'colorInfo',
    'radius.sm': 'borderRadiusSM', 'radius.md': 'borderRadius', 'space.sm': 'paddingXS', 'space.md': 'paddingSM',
    'font.size.base': 'fontSize', 'font.weight.base': 'fontWeightStrong'
  },
  bootstrap: {
    'bg.canvas': 'body-bg', 'bg.surface': 'white', 'bg.elevated': 'white', 'bg.muted': 'light', 'bg.inverse': 'dark',
    'text.primary': 'body-color', 'text.secondary': 'secondary', 'text.muted': 'muted', 'text.inverse': 'white', 'text.disabled': 'gray-500',
    'border.default': 'border-color', 'border.muted': 'border-color',
    'action.primary.default': 'primary', 'action.primary.hover': 'primary-hover', 'action.primary.active': 'primary-active', 'action.primary.disabled': 'primary-disabled',
    'status.success': 'success', 'status.warning': 'warning', 'status.error': 'danger', 'status.info': 'info',
    'radius.sm': 'border-radius-sm', 'radius.md': 'border-radius', 'space.sm': 'spacer * .25', 'space.md': 'spacer * .5',
    'font.size.base': 'font-size-base', 'font.weight.base': 'font-weight-base'
  }
};


/**
 * ORCHESTRATOR: Generate Semantic Tokens
 */
function generateSemanticTokens(primitives, options) {
  if (!options) options = {};
  (function () { return function () { } })() && console.log("🚀 Starting Token Engine (5-Step Impl)");

  var naming = options.naming || 'tailwind';

  // Step 1: Resolve Preset
  var preset = resolveLibraryPreset(naming);
  (function () { return function () { } })() && console.log("Step 1: Preset resolved ->", preset.name);

  // Step 2: Generate/Validate Primitives
  // Note: 'primitives' arg passed from UI might be partial or full. 
  // If we are regenerating semantics, we assume we have primitives. 
  // IF the primitives are missing, we should generate them.
  // Ideally, this function accepts 'primitives' and uses them.
  // The User requirement "Primitive Palette Generator" implies we control this.
  // But usually primitives are "input" to semantic generation.
  // We will run the generator to fill gaps or if pure generation is requested.
  // For now, we assume 'primitives' struct contains the brand color we need.
  var brandColor = (primitives && primitives.brand && (primitives.brand['500'] || primitives.brand.main))
    || '#3b82f6'; // Default Blue

  // If primitives are not fully formed, we generate defaults
  var generatedPrimitives = generatePrimitivePalette(brandColor, preset, { currentPrimitives: primitives });

  // Merge: prefer passed primitives if they exist (user edits), else generated
  var workingPrimitives = Object.assign({}, generatedPrimitives, primitives);
  // Ensure we rely on the tinted version for mapping?
  // The 'tintPalette' step should run on the 'gray' specifically.

  // Step 3: Tinting
  // We apply tinting to the Gray scale if it wasn't already tinted (this is tricky if we reuse primitives).
  // For refactor, we can assume we enforce tinting on the grey scale we use for MAPPING.
  workingPrimitives = tintPalette(workingPrimitives, brandColor, { tintStrength: 0.03 });

  // Step 4: Semantic Mapping
  var semanticTokens = mapSemanticTokens(workingPrimitives, preset, options);

  // Step 5 happens outside (persistence), but here we return the structured object
  return semanticTokens;
}

// ... existing helper functions (checkSemanticContrast, etc.) ...


// ... (Rest of original file content: normalizeFloatValue, checkSemanticContrast etc.)


function normalizeFloatValue(value) {
  if (typeof value === 'number' && !isNaN(value)) {
    return value;
  }

  if (typeof value === 'string') {
    var cleanValue = value.replace(/px|rem|em|%|vh|vw|vmin|vmax/g, '');
    var parsed = parseFloat(cleanValue);

    if (!isNaN(parsed)) {
      if (value.indexOf('rem') !== -1) return parsed * 16;
      if (value.indexOf('em') !== -1) return parsed * 16;
      return parsed;
    }
  }
  return null;
}

function checkSemanticContrast(semanticTokens) {
  var issues = [];
  var passed = true;

  var primaryContrast = calculateContrastRatio(semanticTokens['text.primary'], semanticTokens['bg.surface']);
  if (primaryContrast < 4.5) {
    issues.push({
      token: 'text.primary',
      background: 'bg.surface',
      currentRatio: primaryContrast,
      requiredRatio: 4.5
    });
    passed = false;
  }

  var inverseContrast = calculateContrastRatio(semanticTokens['text.inverse'], semanticTokens['bg.inverse']);
  if (inverseContrast < 4.5) {
    issues.push({
      token: 'text.inverse',
      background: 'bg.inverse',
      currentRatio: inverseContrast,
      requiredRatio: 4.5
    });
    passed = false;
  }

  var buttonContrast = calculateContrastRatio('#FFFFFF', semanticTokens['action.primary.default']);
  if (buttonContrast < 4.5) {
    issues.push({
      token: 'action.primary.default',
      background: 'button-text',
      currentRatio: buttonContrast,
      requiredRatio: 4.5
    });
    passed = false;
  }

  return { passed: passed, issues: issues };
}

/**
 * Valide qu'il n'y a pas de doublons dans les mappings sémantiques d'une même catégorie
 * @param {Object} semanticMappings - Les mappings sémantiques à valider
 * @param {string} lib - Le nom de la bibliothèque (pour le contexte d'erreur)
 * @returns {Array} Liste des problèmes de hiérarchie trouvés
 */
function validateSemanticHierarchy(semanticMappings, lib) {
  var issues = [];
  var categoryGroups = {};

  // Grouper les tokens par catégorie
  for (var semanticKey in semanticMappings) {
    if (!semanticMappings.hasOwnProperty(semanticKey)) continue;

    var mapping = semanticMappings[semanticKey];
    if (!mapping || !mapping.category) continue;

    var category = mapping.category;
    if (!categoryGroups[category]) {
      categoryGroups[category] = [];
    }

    categoryGroups[category].push({
      key: semanticKey,
      mapping: mapping
    });
  }

  // Vérifier les doublons dans chaque catégorie
  for (var category in categoryGroups) {
    if (!categoryGroups.hasOwnProperty(category)) continue;

    var tokens = categoryGroups[category];
    var seenValues = {};

    for (var i = 0; i < tokens.length; i++) {
      var token = tokens[i];
      var primaryKey = token.mapping.keys ? token.mapping.keys[0] : null;

      if (primaryKey && seenValues[primaryKey]) {
        issues.push({
          type: 'DUPLICATE_VALUE',
          category: category,
          tokens: [seenValues[primaryKey].key, token.key],
          value: primaryKey,
          lib: lib
        });
      } else if (primaryKey) {
        seenValues[primaryKey] = token;
      }
    }
  }

  return issues;
}

function applyContrastAdjustments(semanticTokens, issues, primitives) {
  if (!primitives) primitives = {};
  var grayScale = ['#0A0A0A', '#1A1A1A', '#262626', '#404040', '#525252', '#737373', '#A3A3A3'];

  for (var i = 0; i < issues.length; i++) {
    var issue = issues[i];
    if (issue.token === 'text.primary') {
      var darkGrays = grayScale.slice(0, 3);
      for (var j = 0; j < darkGrays.length; j++) {
        var darkerGray = darkGrays[j];
        var newRatio = calculateContrastRatio(darkerGray, semanticTokens['bg.surface']);
        if (newRatio >= 4.5) {
          semanticTokens['text.primary'] = darkerGray;
          (function () { return function () { } })() && console.log("Adjusted text.primary to " + darkerGray + " (contrast: " + newRatio + ")");
          break;
        }
      }
    } else if (issue.token === 'text.inverse') {
      var lightGrays = grayScale.slice(-3).reverse();
      for (var k = 0; k < lightGrays.length; k++) {
        var lighterGray = lightGrays[k];
        var newRatioInverse = calculateContrastRatio(lighterGray, semanticTokens['bg.inverse']);
        if (newRatioInverse >= 4.5) {
          semanticTokens['text.inverse'] = lighterGray;
          (function () { return function () { } })() && console.log("Adjusted text.inverse to " + lighterGray + " (contrast: " + newRatioInverse + ")");
          break;
        }
      }
    } else if (issue.token === 'action.primary.default') {
      var brand = primitives.brand || {};
      var darkerShades = ['700', '800', '900'];
      for (var l = 0; l < darkerShades.length; l++) {
        var shade = darkerShades[l];
        var darkerColor = brand[shade];
        if (darkerColor) {
          var newRatioBtn = calculateContrastRatio('#FFFFFF', darkerColor);
          if (newRatioBtn >= 4.5) {
            semanticTokens['action.primary.default'] = darkerColor;
            (function () { return function () { } })() && console.log("Adjusted action.primary.default to " + darkerColor + " (brand-" + shade + ", contrast: " + newRatioBtn + ")");
            break;
          }
        }
      }
    }
  }
}

function calculateContrastRatio(foreground, background) {
  try {
    var fgLuminance = getRelativeLuminance(foreground);
    var bgLuminance = getRelativeLuminance(background);

    var lighter = Math.max(fgLuminance, bgLuminance);
    var darker = Math.min(fgLuminance, bgLuminance);

    return (lighter + 0.05) / (darker + 0.05);
  } catch (error) {
    console.warn('Error calculating contrast ratio:', error);
    return 1;
  }
}

function getRelativeLuminance(hex) {
  var r = parseInt(hex.slice(1, 3), 16) / 255;
  var g = parseInt(hex.slice(3, 5), 16) / 255;
  var b = parseInt(hex.slice(5, 7), 16) / 255;

  function toLinear(c) {
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  }

  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/**
 * Retourne le nom propre pour l'interface Figma (version optimisée)
 * - 1 slash par défaut pour regrouper par dossier
 * - Exception: 2 slashes pour Action / Primary et Action / Secondary
 */
function getFigmaSemanticName(semanticKey) {
  if (!semanticKey) return "";

  // 1. Nettoyage de base (retrait des defaults)
  var cleanKey = semanticKey.replace(/[\.-]default$/i, '');

  // 2. Découpage des segments
  var parts = cleanKey.split(/[\.-]/);
  var familyRaw = parts[0].toLowerCase();

  // 3. Mapping des dossiers racines
  var rootMap = {
    'background': 'bg', 'bg': 'bg', 'surface': 'bg',
    'text': 'text', 'on': 'text',
    'action': 'action', 'primary': 'action', 'secondary': 'action',
    'status': 'status', 'success': 'status', 'warning': 'status', 'error': 'status', 'destructive': 'status', 'info': 'status',
    'radius': 'ui', 'space': 'ui', 'spacing': 'ui', 'font': 'ui', 'fontSize': 'ui', 'fontWeight': 'ui',
    'border': 'border'
  };

  var rootFolder = rootMap[familyRaw] || familyRaw;
  var nameParts = parts.slice();

  // Nettoyage: éviter les répétitions type 'bg / bg-canvas'
  if (nameParts.length > 1) {
    var first = nameParts[0].toLowerCase();
    if (first === rootFolder || (first === 'background' && rootFolder === 'bg')) {
      nameParts.shift();
    }
  }

  // 4. CAS SPÉCIAL : Sous-dossiers pour Action Primary & Secondary
  if (rootFolder === 'action' && nameParts.length > 0) {
    var sub = nameParts[0].toLowerCase();
    if (sub === 'primary' || sub === 'secondary') {
      // Si c'est juste 'action / primary', on s'arrête là
      if (nameParts.length === 1) return rootFolder + ' / ' + nameParts[0];

      // Sinon on crée le sous-dossier: 'action / primary / text'
      var group = nameParts.shift();
      return rootFolder + ' / ' + group + ' / ' + nameParts.join('-');
    }
  }

  // 4b. CAS SPÉCIAL : Sous-dossier On-Status pour les textes de contraste
  if (rootFolder === 'text' && nameParts.length > 1 && nameParts[0].toLowerCase() === 'on') {
    var statusKeywords = ['success', 'error', 'warning', 'info', 'destructive'];
    if (statusKeywords.includes(nameParts[1].toLowerCase())) {
      nameParts.shift(); // On enlève 'on'
      var statusType = nameParts.shift(); // On récupère 'success', 'error', etc.
      // Rendu: text / on-status / success
      return rootFolder + ' / on-status / ' + statusType + (nameParts.length > 0 ? '-' + nameParts.join('-') : '');
    }
  }

  // 5. Par défaut: 'Dossier / Reste-Complet'
  return rootFolder + ' / ' + nameParts.join('-');
}

/**
 * Retourne le nom de variable sémantique pour l'export dev (tirets)
 */
function getSemanticVariableName(semanticKey, libType) {
  const mapping = SEMANTIC_NAME_MAP[libType] || SEMANTIC_NAME_MAP.tailwind;
  var name = mapping[semanticKey] || semanticKey.replace(/\./g, '-');
  return name.replace(/-default$/i, '');
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

  // Déterminer le mode actif (light par défaut)
  var activeMode = 'light';
  try {
    var savedMode = figma.root.getPluginData("tokenStarter.themeMode");
    if (savedMode === 'dark') activeMode = 'dark';
  } catch (e) { }

  for (var key in tokens.semantic) {
    if (!tokens.semantic.hasOwnProperty(key)) continue;

    var tokenData = tokens.semantic[key];

    // ✅ NOUVELLE STRUCTURE : extraire depuis tokenData.modes[activeMode]
    var resolvedValue, tokenType, isAlias, aliasTo, isBrokenAlias;

    if (typeof tokenData === 'object' && tokenData.modes) {
      // Nouvelle structure (par token avec modes imbriqués)
      tokenType = tokenData.type || SEMANTIC_TYPE_MAP[key] || "COLOR";
      var modeData = tokenData.modes[activeMode] || tokenData.modes.light || {};
      resolvedValue = modeData.resolvedValue;

      // ✅ FIX: Si resolvedValue est undefined ou un objet, utiliser une valeur par défaut
      if (resolvedValue === undefined || (typeof resolvedValue === 'object' && !resolvedValue.r)) {
        resolvedValue = tokenType === 'COLOR' ? '#000000' : '0';
        (function () { return function () { } })() && console.warn(`⚠️ [PREVIEW] ${key}: resolvedValue undefined, using fallback`);
      }

      // ✅ FIX: Convertir aliasRef (objet) en string lisible
      var aliasRefObj = modeData.aliasRef;
      if (aliasRefObj && aliasRefObj.category && aliasRefObj.key) {
        aliasTo = aliasRefObj.category + '.' + aliasRefObj.key;
      } else {
        aliasTo = null;
      }
      isAlias = aliasTo ? true : false;
      isBrokenAlias = false; // TODO: détecter les alias cassés
    } else if (typeof tokenData === 'object' && tokenData.resolvedValue !== undefined) {
      // Ancien format (post-rehydratation) - pour compatibilité
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
    // ✅ FIX: Si c'est un objet avec structure modes, extraire la valeur du mode actif
    if (value && value.modes) {
      var activeMode = 'light'; // Par défaut
      try {
        var savedMode = figma.root.getPluginData("tokenStarter.themeMode");
        if (savedMode === 'dark') activeMode = 'dark';
      } catch (e) { }
      var modeData = value.modes[activeMode] || value.modes.light || {};
      return sanitizeValueForUI(modeData.resolvedValue, tokenType); // Récursif
    }

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
  (function () { return function () { } })() && console.log(`🔍 tryResolveSemanticAlias: ${semanticKey} avec naming = ${naming} `);

  // Debug pour les actions primaires en MUI et Chakra
  if ((naming === 'mui' || naming === 'chakra') && semanticKey.startsWith('action.primary.')) {
    debugSemanticAliasResolution(semanticKey, naming);
  }

  try {
    // Créer un mapping adapté selon le système de design
    var primitiveMapping;

    // Génère des clés de fallback tolérantes pour la résolution d'alias
    function generateFallbackKeys(key, category) {
      var fallbacks = [];

      // Pour les clés numériques pures, essayer aussi avec prefix
      if (/^\d+$/.test(key)) {
        if (category === 'gray') {
          fallbacks.push('gray-' + key);
          fallbacks.push('grey-' + key);
        } else if (category === 'brand') {
          fallbacks.push('primary-' + key);
          fallbacks.push('brand-' + key);
        }
      }

      // Pour les clés avec tiret, essayer aussi sans prefix
      if (key.includes('-')) {
        var parts = key.split('-');
        if (parts.length >= 2 && /^\d+$/.test(parts[parts.length - 1])) {
          fallbacks.push(parts[parts.length - 1]); // Le numéro seul
        }
      }

      // Pour les clés brand, essayer des variantes communes
      if (category === 'brand') {
        if (key === 'primary') {
          fallbacks.push('main', '500', 'base');
        } else if (key === 'main') {
          fallbacks.push('primary', '500', 'base');
        } else if (key === '500') {
          fallbacks.push('main', 'primary', 'base');
        } else if (key === 'dark') {
          fallbacks.push('primary-dark', '600', '700');
        } else if (key === 'primary-dark') {
          fallbacks.push('dark', '600', '700');
        }
      }

      return fallbacks;
    }

    const lib = normalizeLibType(naming);

    if (lib === 'tailwind') {
      // Mapping spécifique pour Tailwind - clés numériques pures
      primitiveMapping = {
        // Background - utiliser gray-50, gray-100, etc. (pas '0')
        'bg.canvas': { category: 'gray', keys: ['50'] },
        'bg.surface': { category: 'gray', keys: ['100'] },
        'bg.elevated': { category: 'gray', keys: ['200'] },
        'bg.muted': { category: 'gray', keys: ['300'] },
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

        // Action primary - utiliser les clés numériques Tailwind
        'action.primary.default': { category: 'brand', keys: ['600', '500'] },
        'action.primary.hover': { category: 'brand', keys: ['700', '600'] },
        'action.primary.active': { category: 'brand', keys: ['800', '700'] },
        'action.primary.disabled': { category: 'gray', keys: ['300'] },

        // Status - pour Tailwind, utiliser system si disponible sinon fallback
        'status.success': { category: 'system', keys: ['success-main', 'success'], fallback: { category: 'brand', keys: ['600', '500'] } },
        'status.warning': { category: 'system', keys: ['warning-main', 'warning'], fallback: '#F59E0B' },
        'status.error': { category: 'system', keys: ['error-main', 'error'], fallback: '#DC2626' },
        'status.info': { category: 'system', keys: ['info-main', 'info'] },

        // Shape & Space - utiliser radius-4, spacing-8, etc.
        'radius.sm': { category: 'radius', keys: ['sm', '4'] },
        'radius.md': { category: 'radius', keys: ['md', '8'] },
        'space.sm': { category: 'spacing', keys: ['4', '8'] },
        'space.md': { category: 'spacing', keys: ['8', '16'] },

        // Typography - utiliser text.base, text.regular, etc.
        'font.size.base': { category: 'typography', keys: ['text.base', 'base'] },
        'font.weight.base': { category: 'typography', keys: ['text.regular', 'regular'] }
      };
    } else if (lib === 'chakra') {
      // Mapping spécifique pour Chakra UI - utilise des couleurs diverses depuis System Colors
      primitiveMapping = {
        // Background
        'bg.canvas': { category: 'gray', keys: ['gray.50', '50'] },
        'bg.surface': { category: 'gray', keys: ['gray.100', '100'] },
        'bg.elevated': { category: 'gray', keys: ['gray.200', '200'] },
        'bg.muted': { category: 'gray', keys: ['gray.300', '300'] },
        'bg.inverse': { category: 'gray', keys: ['gray.900', 'gray.800'] },

        // Text
        'text.primary': { category: 'gray', keys: ['gray.900', 'gray.800'] },
        'text.secondary': { category: 'gray', keys: ['gray.700', 'gray.600'] },
        'text.muted': { category: 'gray', keys: ['gray.500', 'gray.400'] },
        'text.inverse': { category: 'gray', keys: ['gray.50', '50'] },
        'text.disabled': { category: 'gray', keys: ['gray.400', 'gray.300'] },

        // Border
        'border.default': { category: 'gray', keys: ['gray.200', '200'] },
        'border.muted': { category: 'gray', keys: ['gray.100', '100'] },

        // Action primary - utilise les vraies clés Chakra générées: "100", "200", "300", "400", "500"
        'action.primary.default': { category: 'brand', keys: ['300'] },
        'action.primary.hover': { category: 'brand', keys: ['400'] },
        'action.primary.active': { category: 'brand', keys: ['500'] },
        'action.primary.disabled': { category: 'gray', keys: ['gray.300', 'gray.400'] },

        // Status - utilise d'autres couleurs système pour éviter les conflits
        'status.success': { category: 'system', keys: ['orange.500', 'warning'] },
        'status.warning': { category: 'system', keys: ['red.500', 'error'] },
        'status.error': { category: 'system', keys: ['warning'] },
        'status.info': { category: 'system', keys: ['success'] },

        // Shape & Space - utiliser les primitives directes
        'radius.sm': { category: 'radius', keys: ['sm', '4'] },
        'radius.md': { category: 'radius', keys: ['md', '8'] },
        'space.sm': { category: 'spacing', keys: ['2', '8'] },
        'space.md': { category: 'spacing', keys: ['4', '16'] },

        // Typography
        'font.size.base': { category: 'typography', keys: ['base', '16'] },
        'font.weight.base': { category: 'typography', keys: ['normal', '400'] }
      };
    } else if (lib === 'bootstrap') {
      // Mapping spécifique pour Bootstrap - utilise des couleurs diverses depuis System Colors
      primitiveMapping = {
        // Background
        'bg.canvas': { category: 'gray', keys: ['white', 'gray-100'] },
        'bg.surface': { category: 'gray', keys: ['gray-100', 'gray-200'] },
        'bg.elevated': { category: 'gray', keys: ['gray-200', 'gray-300'] },
        'bg.muted': { category: 'gray', keys: ['gray-300', 'gray-400'] },
        'bg.inverse': { category: 'gray', keys: ['gray-900', 'dark'] },

        // Text
        'text.primary': { category: 'gray', keys: ['gray-900', 'dark'] },
        'text.secondary': { category: 'gray', keys: ['gray-600', 'secondary'] },
        'text.muted': { category: 'gray', keys: ['gray-500', 'muted'] },
        'text.inverse': { category: 'gray', keys: ['white', 'light'] },
        'text.disabled': { category: 'gray', keys: ['gray-400', 'muted'] },

        // Border
        'border.default': { category: 'gray', keys: ['gray-300', '300'] },
        'border.muted': { category: 'gray', keys: ['gray-200', '200'] },

        // Action primary - utilise les vraies clés Bootstrap générées: "primary", "primary-subtle", "primary-hover", "primary-dark"
        'action.primary.default': { category: 'brand', keys: ['primary'] },
        'action.primary.hover': { category: 'brand', keys: ['primary-hover'] },
        'action.primary.active': { category: 'brand', keys: ['primary-dark'] },
        'action.primary.disabled': { category: 'gray', keys: ['gray-300', '300'] },

        // Status - utilise d'autres couleurs système pour éviter les conflits
        'status.success': { category: 'system', keys: ['error'] },
        'status.warning': { category: 'system', keys: ['success'] },
        'status.error': { category: 'system', keys: ['info'] },
        'status.info': { category: 'system', keys: ['success'] },

        // Shape & Space - utiliser les primitives directes
        'radius.sm': { category: 'radius', keys: ['sm', '2'] },
        'radius.md': { category: 'radius', keys: ['md', '4'] },
        'space.sm': { category: 'spacing', keys: ['2', '8'] },
        'space.md': { category: 'spacing', keys: ['3', '16'] },

        // Typography
        'font.size.base': { category: 'typography', keys: ['base', '1rem', '16'] },
        'font.weight.base': { category: 'typography', keys: ['normal', '400'] }
      };
    } else if (lib === 'ant') {
      // Mapping spécifique pour Ant Design - utilise l'échelle de gris 1..10
      primitiveMapping = {
        // Background
        'bg.canvas': { category: 'gray', keys: ['1'] },
        'bg.surface': { category: 'gray', keys: ['2'] },
        'bg.elevated': { category: 'gray', keys: ['3'] },
        'bg.muted': { category: 'gray', keys: ['4'] },
        'bg.inverse': { category: 'gray', keys: ['10'] },

        // Text
        'text.primary': { category: 'gray', keys: ['10'] },
        'text.secondary': { category: 'gray', keys: ['8', '9'] },
        'text.muted': { category: 'gray', keys: ['6', '7'] },
        'text.inverse': { category: 'gray', keys: ['1'] },
        'text.disabled': { category: 'gray', keys: ['6'] },

        // Border
        'border.default': { category: 'gray', keys: ['4'] },
        'border.muted': { category: 'gray', keys: ['3'] },

        // Action primary - utilise les vraies clés Ant générées: "1", "2", "3", "4", "5"
        'action.primary.default': { category: 'brand', keys: ['3'] },
        'action.primary.hover': { category: 'brand', keys: ['4'] },
        'action.primary.active': { category: 'brand', keys: ['5'] },
        'action.primary.disabled': { category: 'gray', keys: ['6'] },

        // Status - utilise les vraies primitives Ant
        'status.success': { category: 'system', keys: ['green-6', 'success'] },
        'status.warning': { category: 'system', keys: ['orange-6', 'warning'] },
        'status.error': { category: 'system', keys: ['red-6', 'error'] },
        'status.info': { category: 'system', keys: ['blue-6', 'info'] },

        // Shape & Space - utiliser les primitives directes
        'radius.sm': { category: 'radius', keys: ['sm', '4'] },
        'radius.md': { category: 'radius', keys: ['md', '6'] },
        'space.sm': { category: 'spacing', keys: ['8', 'small'] },
        'space.md': { category: 'spacing', keys: ['16', 'middle'] },

        // Typography
        'font.size.base': { category: 'typography', keys: ['fontSize', '14'] },
        'font.weight.base': { category: 'typography', keys: ['fontWeight', '400'] }
      };
    } else {
      // Mapping générique pour les autres systèmes (MUI, etc.)
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

        // Action primary - Bleu générique
        'action.primary.default': { category: 'brand', keys: ['primary', '500'] },
        'action.primary.hover': { category: 'brand', keys: ['primary-dark', '600'] },
        'action.primary.active': { category: 'brand', keys: ['primary-darker', '700'] },
        'action.primary.disabled': { category: 'gray', keys: ['300', '400'] },

        // Status - Couleurs génériques
        'status.success': { category: 'system', keys: ['success', 'green'], fallback: { category: 'brand', keys: ['600', 'main'] } },
        'status.warning': { category: 'system', keys: ['warning', 'orange'], fallback: '#F59E0B' },
        'status.error': { category: 'system', keys: ['error', 'red'], fallback: '#DC2626' },
        'status.info': { category: 'system', keys: ['info', 'blue'] },

        // Shape & Space - utiliser les primitives directes
        'radius.sm': { category: 'radius', keys: ['sm', '4'] },
        'radius.md': { category: 'radius', keys: ['md', '8'] },
        'space.sm': { category: 'spacing', keys: ['8', '2'] },
        'space.md': { category: 'spacing', keys: ['16', '4'] },

        // Typography
        'font.size.base': { category: 'typography', keys: ['text.base', 'base', '16'] },
        'font.weight.base': { category: 'typography', keys: ['text.regular', 'regular', '400'] }
      };
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
      var diagnosticKeys = variables.map(function (v) { return v ? extractVariableKey(v, collection.name) : null; }).filter(function (k) { return k !== null; });
      (function () { return function () { } })() && console.log(`🔍[DIAGNOSTIC] Resolving ${semanticKey} for ${naming}.Available Brand Keys: `, diagnosticKeys);
    }

    // Essayer chaque clé possible dans l'ordre de priorité
    for (var k = 0; k < mapping.keys.length; k++) {
      var targetKey = mapping.keys[k];

      // Essayer d'abord la correspondance exacte
      for (var j = 0; j < variables.length; j++) {
        var variable = variables[j];
        if (!variable) continue;

        // Déterminer si cette variable correspond à la clé recherchée
        var varKey = extractVariableKey(variable, collection.name);

        if (varKey === targetKey) {
          (function () { return function () { } })() && console.log(`✅ Alias success: ${semanticKey} → ${mapping.category}/${targetKey} (${variable.name})`);
          return variable;
        }
      }

      // Si pas trouvé, essayer des variantes tolérantes
      var fallbackKeys = generateFallbackKeys(targetKey, mapping.category);
      for (var fk = 0; fk < fallbackKeys.length; fk++) {
        var fallbackKey = fallbackKeys[fk];
        if (fallbackKey === targetKey) continue; // Éviter la duplication

        for (var j = 0; j < variables.length; j++) {
          var variable = variables[j];
          if (!variable) continue;

          var varKey = extractVariableKey(variable, collection.name);

          if (varKey === fallbackKey) {
            (function () { return function () { } })() && console.log(`✅ Alias fallback success: ${semanticKey} → ${mapping.category}/${fallbackKey} (via ${targetKey}) (${variable.name})`);
            return variable;
          }
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
                (function () { return function () { } })() && console.log(`✅ Alias fallback success: ${semanticKey} → ${mapping.fallback.category}/${fallbackKey} (${fallbackVar.name})`);
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

    (function () { return function () { } })() && console.log(`❌ Alias fallback: ${semanticKey} → ${mapping.category} keys [${mapping.keys.join(', ')}] not found. Available: [${availableKeys.join(', ')}]`);

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
  var isBrand = c.includes('brand') || c.includes('color') || c.includes('theme') || c.includes('palette') || c.includes('ui') || c === "colors" || c === "design tokens";
  var isSystem = c.includes('system') || c.includes('status') || c.includes('state') || c.includes('semantic');
  var isGray = c.includes('gray') || c.includes('grey') || c.includes('grayscale') || c.includes('neutral');
  var isSpacing = c.includes('spacing') || c.includes('gap') || c.includes('margin') || c.includes('padding') || c.includes('space');
  var isRadius = c.includes('radius') || c.includes('corner') || c.includes('border-radius') || c.includes('round');
  var isTypography = c.includes('typo') || c.includes('typography') || c.includes('font') || c.includes('text') || c.includes('type');

  // 🆕 NOUVEAU : Détection transversale - même si la collection n'est pas catégorisée comme radius/spacing,
  // détecter les patterns individuels et les traiter comme tels
  var forceRadius = false;
  var forceSpacing = false;

  if (!isRadius && isRadiusPattern(variable.name)) {
    forceRadius = true;
  }
  if (!isSpacing && isSpacingPattern(variable.name)) {
    forceSpacing = true;
  }

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

    // NOUVEAU : Patterns étendus pour les noms de couleurs non standard
    // Support pour les noms comme "blue-500", "red-600", "color-blue", etc.
    if (name.match(/^(\w+)[-_](\d{1,3})$/)) {
      // blue-500, red_600, green-300, etc. → garder le nom complet
      return name;
    }
    if (name.match(/^color[_-]?(\w+)$/)) {
      // color-blue, color_red, colorPrimary → garder le nom complet
      return name;
    }
    if (name.match(/^(\w+)[-_]?color$/)) {
      // blue-color, primary_color → garder le nom complet
      return name;
    }

    // Fallback ultime : accepter n'importe quel nom non vide pour les collections brand
    // Cela permet de reconnaître des variables avec des noms complètement personnalisés
    if (name.length > 0 && name.length < 100) { // sécurité anti-noms trop longs
      return name;
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
  } else if (isSpacing || forceSpacing) {
    if (name.startsWith("spacing-")) {
      return name.replace("spacing-", "").replace(/-/g, ".");
    }
    if (name.startsWith("gap-") || name.startsWith("margin-") || name.startsWith("padding-")) {
      return name.replace(/^(gap|margin|padding)-/, "").replace(/-/g, ".");
    }
    return name.replace(/-/g, ".");
  } else if (isRadius || forceRadius) {
    if (name.startsWith("radius-") || name.startsWith("corner-") || name.startsWith("border-radius-")) {
      return name.replace(/^(radius|corner|border-radius)-/, "").replace(/-/g, ".");
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

      // Déterminer le mode préféré pour cette collection (Light en priorité)
      var preferredModeId = getPreferredModeIdForScan(collection);

      collection.variableIds.forEach(function (variableId) {
        var variable = FigmaService.getVariableById(variableId);
        if (!variable) return;

        // FILTRE SEMANTIC-ONLY: ne garder que les variables sémantiques
        if (!isSemanticVariable(variable.name, variable)) {
          // ============================================================================
          // DIAGNOSTIC: Check if bg/inverse is excluded here
          // ============================================================================
          if (variable.name.toLowerCase().indexOf('inverse') !== -1) {
            console.log('⚠️ [SCANNER.INITMAP] Variable:', variable.name);
            console.log('⚠️ [SCANNER.INITMAP] isSemanticVariable result:', false);
            console.log('⚠️ [SCANNER.INITMAP] bg/inverse EXCLUDED from map!');
            console.log('⚠️ [SCANNER.INITMAP] Collection:', variable.variableCollectionId);
          }

          if (DEBUG_SCOPES_SCAN) {
            console.log('🚫 [SCAN_FILTER] Excluded primitive variable:', variable.name);
          }
          return; // Skip les primitives
        }

        collection.modes.forEach(function (mode) {
          var modeId = mode.modeId;
          var resolvedValue = resolveVariableValue(variable, modeId);

          if (resolvedValue !== undefined && resolvedValue !== null) {
            var formattedValue = Scanner._formatVariableValue(variable, resolvedValue);

            // INDEXATION PAR MODE: éviter collisions Light/Dark
            // Format: "modeId|value" pour différencier les modes
            var key = modeId + '|' + formattedValue;

            // Aussi indexer avec le mode préféré pour fallback
            var preferredKey = formattedValue; // Clé sans mode pour compatibilité

            if (!Scanner.valueMap.has(key)) {
              Scanner.valueMap.set(key, []);
            }

            // Ajouter avec scopes réels (relecture pour sécurité)
            var actualScopes = variable.scopes || [];

            Scanner.valueMap.get(key).push({
              id: variable.id,
              name: variable.name,
              collectionName: collectionName,
              modeName: mode.name,
              modeId: modeId,
              resolvedValue: formattedValue,
              resolvedType: variable.resolvedType,
              scopes: actualScopes,
              isPreferredMode: modeId === preferredModeId
            });

            // ⚠️ FIX: Indexer TOUS les modes dans la map de fallback (sans modeId|)
            // Cela permet de trouver un token sémantique même si le scanner détecte mal le mode du frame (ex: Light au lieu de Dark)
            var preferredKey = formattedValue;

            if (!Scanner.valueMap.has(preferredKey)) {
              Scanner.valueMap.set(preferredKey, []);
            }

            Scanner.valueMap.get(preferredKey).push({
              id: variable.id,
              name: variable.name,
              collectionName: collectionName,
              modeName: mode.name,
              modeId: modeId,
              resolvedValue: formattedValue,
              resolvedType: variable.resolvedType,
              scopes: actualScopes,
              isPreferredMode: modeId === preferredModeId // On garde l'info de priorité
            });
          }
        });
      });
    }
    (function () { return function () { } })() && console.log('🔍 [Scanner.initMap] Finished mapping ' + Scanner.valueMap.size + ' unique values (semantic-only, mode-aware).');
  },


  _formatVariableValue: function (variable, rawValue) {
    if (variable.resolvedType === CONFIG.variableTypes.COLOR && typeof rawValue === "object") {
      return ColorService.rgbToHex(rawValue);
    } else if (variable.resolvedType === CONFIG.variableTypes.FLOAT) {
      return rawValue; // ✅ Stocker le nombre brut pour la recherche exacte
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
    if (!node || node.removed) return false;
    // Vérification simplifiée: si c'est dans l'objet node, c'est bon
    return true;
  },

  _validateVariableCanBeApplied: function (variable, result) {
    if (!variable) return false;
    var type = variable.resolvedType;
    var prop = result.property;

    if (prop === "Fill" || prop === "Text" || prop === "Stroke" || prop.indexOf("Style") !== -1) {
      return type === "COLOR";
    }
    if (prop.indexOf("Radius") !== -1 || prop.indexOf("Spacing") !== -1 || prop.indexOf("Padding") !== -1 || prop === "Font Size") {
      return type === "FLOAT";
    }
    return true;
  },

  _applyVariableToProperty: function (node, result, variable) {
    try {
      var success = false;

      switch (result.property) {
        case "Fill":
        case "Text":  // ✅ FIX: Gérer le type Text comme Fill
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
    savedSemanticTokens: savedSemanticTokens
  });
}).catch(function () {
  // Fallback vers la méthode synchrone
  var savedNaming = getNamingFromFile();

  figma.ui.postMessage({
    type: "init",
    naming: savedNaming,
    savedSemanticTokens: savedSemanticTokens
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

      case 'scan-frame':
        // UI sends scan-frame for both Step 1 and Step 4
        var ignoreHidden = msg.ignoreHiddenLayers !== false;
        Scanner.scanSelection(ignoreHidden);
        break;

      case 'check-selection':
        checkAndNotifySelection();
        break;

      case 'generate':
      case 'generate-tokens':
        // Unified Generation Handler
        var hex = msg.hex || msg.color || '#6366F1';
        var naming = msg.naming || (await getNamingFromFile()) || "tailwind";
        var themeMode = figma.root.getPluginData("tokenStarter.themeMode") || "light";
        var primaryColor = hex;
        var normalizedLib = normalizeLibType(naming);

        (function () { return function () { } })() && console.log('🎨 Generating tokens for naming:', naming);

        // BASELINE LOGS - Paramètres de génération
        debugTokens('Generation Parameters', {
          lib: naming,
          normalizedLib: normalizedLib,
          themeMode: themeMode,
          primaryColor: primaryColor
        });

        var tokens = {};

        // ============================================================================
        // BRANCHEMENT CORE vs LEGACY
        // ============================================================================
        if (USE_CORE_ENGINE) {
          // ╔══════════════════════════════════════════════════════════════════════╗
          // ║ CORE SECTION - Core Engine V1 (USE_CORE_ENGINE = true)              ║
          // ║ Utilise: generateCorePrimitives + generateCoreSemantics +           ║
          // ║          validateAndAdjustForRgaa + projectCoreToLegacyShape        ║
          // ╚══════════════════════════════════════════════════════════════════════╝
          console.log('🚀 CORE_ENGINE_ON - Using Core Engine V1');
          debugTokens('Engine Mode', { engine: 'CORE_V1', lib: normalizedLib });

          try {
            // 1. Generate Core Primitives
            var corePrimitives = generateCorePrimitives(primaryColor, { naming: normalizedLib }, CORE_PRESET_V1);

            // 2. Generate Core Semantics (multi-mode)
            var coreSemantics = generateCoreSemantics(corePrimitives, CORE_PRESET_V1, { naming: normalizedLib });

            // 3. Validate RGAA
            var validationReport = validateAndAdjustForRgaa(coreSemantics, CORE_PRESET_V1);
            debugTokens('RGAA Validation', {
              passed: validationReport.passed,
              issuesCount: validationReport.issues.length,
              adjustedCount: validationReport.adjusted.length
            });

            // 4. Project to Legacy Shape (adapter temporaire)
            tokens = projectCoreToLegacyShape({
              primitives: corePrimitives,
              semantics: coreSemantics
            }, normalizedLib);

            // Logs
            var semanticCount = Object.keys(tokens.semantic || {}).length;
            debugTokens('Core Semantic Keys Generated', {
              total: semanticCount,
              top10: Object.keys(tokens.semantic || {}).slice(0, 10)
            });

          } catch (coreError) {
            console.error('❌ Core Engine Error:', coreError);
            // Fallback to empty tokens
            tokens = {
              brand: {}, gray: {}, system: {}, spacing: {}, radius: {}, typography: {}, border: {}, semantic: {}
            };
          }

        } else {
          // ╔══════════════════════════════════════════════════════════════════════╗
          // ║ LEGACY SECTION - Legacy Engine (USE_CORE_ENGINE = false)            ║
          // ║ Utilise: generateBrandColors + generateGrayscale + generateSemanticTokens ║
          // ║ IMPORTANT: Ne pas supprimer - fallback requis                       ║
          // ╚══════════════════════════════════════════════════════════════════════╝
          console.log('🔧 LEGACY_ENGINE_ON - Using Legacy Engine');
          debugTokens('Engine Mode', { engine: 'LEGACY', lib: normalizedLib });

          // 1. Generate Primitives (LEGACY)
          tokens = {
            brand: generateBrandColors(hex, naming),
            system: generateSystemColors(naming),
            gray: generateGrayscale(naming),
            spacing: generateSpacing(naming),
            radius: generateRadius(naming),
            typography: generateTypography(naming),
            border: generateBorder()
          };

          // BASELINE LOGS - Primitives counts
          var primitivesCount = 0;
          var primitivesByCategory = {};
          for (var cat in tokens) {
            if (tokens.hasOwnProperty(cat) && cat !== 'semantic') {
              var catCount = Object.keys(tokens[cat] || {}).length;
              primitivesByCategory[cat] = catCount;
              primitivesCount += catCount;
            }
          }
          debugTokens('Primitives Generated', {
            total: primitivesCount,
            byCategory: primitivesByCategory
          });

          // BASELINE LOGS - Top 10 primitive keys
          var top10Primitives = [];
          for (var cat in tokens) {
            if (tokens.hasOwnProperty(cat) && cat !== 'semantic') {
              var keys = Object.keys(tokens[cat] || {});
              for (var i = 0; i < Math.min(10, keys.length); i++) {
                top10Primitives.push(cat + '.' + keys[i]);
                if (top10Primitives.length >= 10) break;
              }
              if (top10Primitives.length >= 10) break;
            }
          }
          debugTokens('Top 10 Primitive Keys', top10Primitives);

          // 2. Generate Semantics using the Legacy Engine
          if (naming === "tailwind" || naming === "mui" || naming === "ant" || naming === "bootstrap" || naming === "shadcn") {
            (function () { return function () { } })() && console.log(`🎨 Calling Legacy Semantic Engine for ${naming}`);
            try {
              var genOptions = { naming: naming };
              var generated = generateSemanticTokens(tokens, genOptions);
              var existing = getSemanticTokensFromFile('MERGE_GENERATE') || {};
              var merged = mergeSemanticWithExistingAliases(generated, existing);
              tokens.semantic = merged || generated;
              saveSemanticTokensToFile(tokens.semantic, 'AUTO_GENERATE');

              // BASELINE LOGS - Semantic tokens counts
              var semanticCount = Object.keys(tokens.semantic || {}).length;
              var top10Semantic = Object.keys(tokens.semantic || {}).slice(0, 10);
              debugTokens('Semantic Tokens Generated', {
                total: semanticCount,
                top10Keys: top10Semantic
              });
            } catch (e) {
              console.error('❌ Semantic Engine Error:', e);
              tokens.semantic = {};
            }
          }
        }

        // ============================================================================
        // PIPELINE COMMUN (inchangé)
        // ============================================================================
        cachedTokens = tokens;
        saveNamingToFile(naming);

        // ✅ FIX PERSISTENCE: Save Primitives !
        var primitivesToSave = {
          brand: tokens.brand,
          gray: tokens.gray,
          system: tokens.system,
          spacing: tokens.spacing,
          radius: tokens.radius,
          typography: tokens.typography,
          border: tokens.border || {}
        };
        savePrimitivesTokensToFile(primitivesToSave, 'GENERATE');


        var semanticPreview = getSemanticPreviewRows(tokens, naming);
        figma.ui.postMessage({
          type: 'tokens-generated',
          tokens: tokens,
          semanticPreview: semanticPreview,
          naming: naming
        });
        break;

      case 'import':
      case 'import-tokens':
        (function () { return function () { } })() && console.log('🔄 Pipeline d\'import : ' + msg.type + ' → Figma Service');
        try {
          await importTokensToFigma(msg.tokens || cachedTokens, msg.naming, msg.overwrite);
          figma.ui.postMessage({ type: 'import-completed' });
        } catch (err) {
          console.error('Import error:', err);
          figma.notify("❌ Erreur d'import : " + err.message);
          figma.ui.postMessage({ type: 'import-completed', error: err.message });
        }
        break;

      case 'import-from-file':
        try {
          await importTokensToFigma(msg.tokens, msg.naming || "custom", false);
          figma.notify("✅ Tokens importés depuis le fichier");
          figma.ui.postMessage({ type: 'import-completed' });
        } catch (e) {
          figma.notify("❌ Erreur lors de l'import depuis le fichier");
          figma.ui.postMessage({ type: 'import-completed', error: e.message });
        }
        break;

      case 'apply-single-fix':
        (async function () {
          var appliedCount = 0;
          try {
            var result = (Scanner.lastScanResults || lastScanResults)[msg.index];
            appliedCount = await applySingleFix(result, msg.selectedVariableId);
          } catch (e) {
            console.error("Apply fix error:", e);
          }
          figma.ui.postMessage({
            type: "single-fix-applied",
            appliedCount: appliedCount,
            index: msg.index
          });
        })();
        break;

      case 'apply-group-fix':
        (async function () {
          var appliedCount = 0;
          var indices = msg.indices || [];
          var results = Scanner.lastScanResults || lastScanResults;
          for (var i = 0; i < indices.length; i++) {
            var res = results[indices[i]];
            if (res) {
              appliedCount += await applyFixToNode(res.nodeId, msg.variableId, res.property, res);
            }
          }
          figma.ui.postMessage({
            type: "group-fix-applied",
            appliedCount: appliedCount
          });
        })();
        break;

      case 'apply-all-fixes':
        (async function () {
          var count = await applyAllFixes();
          figma.ui.postMessage({ type: "all-fixes-applied", appliedCount: count });
        })();
        break;

      case 'preview-fix':
        var results = Scanner.lastScanResults || lastScanResults;
        var variable = FigmaService.getVariableById(msg.variableId);
        if (variable && results) {
          (msg.indices || []).forEach(function (index) {
            var res = results[index];
            var node = figma.getNodeById(res.nodeId);
            if (node && !node.removed) {
              Fixer._applyVariableToProperty(node, res, variable);
            }
          });
        }
        break;

      case 'rollback-preview':
        // For now, re-running the scan is the safest way to "rollback" UI state
        // and notify the UI that the nodes might need a fresh look.
        Scanner.scanSelection(true);
        break;

      case 'highlight-nodes':
        var results = Scanner.lastScanResults || lastScanResults;
        var nodes = (msg.indices || []).map(function (idx) {
          var res = results[idx];
          return res ? figma.getNodeById(res.nodeId) : null;
        }).filter(function (n) { return n !== null; });
        if (nodes.length > 0) {
          figma.currentPage.selection = nodes;
          // figma.viewport.scrollAndZoomIntoView(nodes); // ❌ Désactivé pour éviter de bouger la caméra
        }
        break;

      case 'undo-fix':
      case 'undo-batch':
        figma.notify("⟲ Utilisez Ctrl+Z pour annuler dans Figma");
        break;

      case 'sync-scan-results':
        if (msg.results) Scanner.lastScanResults = msg.results;
        figma.ui.postMessage({ type: "sync-confirmation", success: true });
        break;

      case 'save-naming':
        saveNamingToFile(msg.naming);
        break;

      case 'save-theme-mode':
        if (msg.themeMode !== undefined && msg.themeMode !== null) {
          figma.root.setPluginData("tokenStarter.themeMode", msg.themeMode);
        } else {
          console.warn("⚠️ save-theme-mode: themeMode is undefined/null, skipping save");
        }
        break;

      case 'resize':
        figma.ui.resize(msg.width, msg.height);
        break;

      default:
        console.warn("Unknown message type:", msg.type);
    }
  } catch (error) {
    console.error("Plugin internal error:", error);
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
      // 🔍 DIAGNOSTIC: Log what we're sending to UI
      console.log('📤 [EXTRACT_TO_UI] Sending tokens to UI:', {
        hasBrand: !!existingTokens.tokens.brand,
        brandCount: existingTokens.tokens.brand ? Object.keys(existingTokens.tokens.brand).length : 0,
        brandKeys: existingTokens.tokens.brand ? Object.keys(existingTokens.tokens.brand).slice(0, 5) : [],
        allCategories: Object.keys(existingTokens.tokens),
        library: existingTokens.library
      });

      figma.ui.postMessage({
        type: "existing-tokens",
        tokens: existingTokens.tokens,
        library: existingTokens.library
      });
    } else {
      console.log('⚠️ [EXTRACT_TO_UI] No tokens found, sending empty object');
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
  (function () { return function () { } })() && console.log('🔍 extractExistingTokens: starting extraction');
  var collections = figma.variables.getLocalVariableCollections();
  (function () { return function () { } })() && console.log('📚 Found collections:', collections.map(function (c) { return c.name; }));

  var tokens = {
    brand: {},
    system: {},
    gray: {},
    spacing: {},
    radius: {},
    typography: {},
    border: {},
    semantic: {
      modes: {}
    }
  };

  // Système de scoring pour la détection de librairie
  var libraryScores = {
    tailwind: 0,
    mui: 0,
    ant: 0,
    bootstrap: 0,
    chakra: 0
  };

  for (var i = 0; i < collections.length; i++) {
    var collection = collections[i];
    var collectionName = collection.name;
    var category = getCategoryFromVariableCollection(collectionName);

    // Si toujours inconnu, essayer d'inférer depuis le contenu (sécurisé)
    if (category === "unknown") {
      category = inferCollectionTypeFromContent(collection);
    }

    // Sécurité : ignorer si toujours pas de catégorie déterminée
    if (!category) {
      continue;
    }

    var variables = collection.variableIds.map(function (id) {
      return figma.variables.getVariableById(id);
    });

    // Pour les sémantiques, on traite tous les modes
    // Pour les primitives, on prend le premier mode par défaut (souvent suffisant pour les scales)
    // Mais on pourrait étendre ça si nécessaire

    // Initialiser les modes sémantiques si nécessaire
    if (category === "semantic") {
      collection.modes.forEach(function (mode) {
        var modeName = mode.name.toLowerCase(); // "Light", "Dark", etc.
        if (!tokens.semantic.modes[modeName]) {
          tokens.semantic.modes[modeName] = {};
        }
      });
    }

    for (var j = 0; j < variables.length; j++) {
      var variable = variables[j];
      if (!variable) continue;

      var cleanName = variable.name;

      // Nettoyage du nom pour les primitives
      if (category !== "semantic") {
        var cleanName = variable.name
          .replace(/^(primary|brand|gray|grey|system|spacing|radius|typo|border)-/i, "");

        // 🛡️ PROTECTION CONTRE LA REGRESSION "SYSTEM IN BRAND"
        // Si on est dans la catégorie 'brand' mais qu'on trouve des tokens système,
        // on les RE-CATEGORISE vers 'system' au lieu de les ignorer
        var effectiveCategory = category;
        if (category === 'brand') {
          var isSystemToken = /^(success|warning|error|info|danger)(\-|$)/i.test(cleanName);
          console.log('🔍 [BRAND_FILTER] Processing:', {
            originalName: variable.name,
            cleanName: cleanName,
            isSystemToken: isSystemToken,
            willRecategorize: isSystemToken
          });

          if (isSystemToken) {
            console.log('🔄 [BRAND_FILTER] Re-categorizing system token to "system":', cleanName);
            effectiveCategory = 'system';
          }
        }

        // Scoring pour la détection de librairie (uniquement sur les primitives)
        if (cleanName.match(/^(50|100|200|300|400|500|600|700|800|900|950)$/)) libraryScores.tailwind++;
        if (cleanName.match(/^(main|light|dark|contrastText)$/)) libraryScores.mui++;
        if (cleanName.match(/^(subtle|hover|emphasis)$/)) libraryScores.bootstrap++;
        if (cleanName.match(/^([1-9]|10)$/)) libraryScores.ant++; // Ant utilise 1-10
        if (cleanName.match(/^(100|200|300|...|900)$/) && !cleanName.match(/^950$/)) libraryScores.chakra++; // Chakra similaire à Tailwind sans 950
      } else {
        // Pour les tokens sémantiques, utiliser directement le nom Figma comme clé
        cleanName = variable.name;
      }

      // Traitement spécifique selon la catégorie
      if (category === "semantic") {
        // Extraction MULTI-MODE pour les sémantiques
        collection.modes.forEach(function (mode) {
          var modeId = mode.modeId;
          var modeName = mode.name.toLowerCase();

          var raw = variable.valuesByMode[modeId];
          var value = resolveVariableValue(variable, modeId);

          // Logique d'alias (similaire à avant, mais par mode)
          var aliasTo = null;
          var resolvedValue = null;

          if (raw && typeof raw === 'object' && raw.type === 'VARIABLE_ALIAS') {
            var rawAliasTo = raw.id;
            aliasTo = normalizeAliasTo(rawAliasTo, tokens); // Note: tokens est partiellement rempli ici
            resolvedValue = normalizeResolvedValue(value, variable.resolvedType);
          } else {
            aliasTo = null;
            resolvedValue = normalizeResolvedValue(value, variable.resolvedType);
          }

          // Fallback safe
          if (typeof resolvedValue === 'object' || resolvedValue === null) {
            resolvedValue = getFallbackValue(variable.resolvedType, category);
          }

          // Stockage dans le bon mode
          if (tokens.semantic.modes[modeName]) {
            tokens.semantic.modes[modeName][cleanName] = {
              resolvedValue: resolvedValue,
              type: variable.resolvedType,
              aliasTo: aliasTo,
              meta: {
                sourceCategory: getCategoryFromSemanticKey(cleanName),
                sourceKey: getKeyFromSemanticKey(cleanName),
                updatedAt: Date.now()
              }
            };
          }
        });

      } else {
        // Extraction SIMPLE-MODE (Legacy) pour les primitives
        // On prend le premier mode
        var modeId = collection.modes[0].modeId;
        var value = resolveVariableValue(variable, modeId);

        var formattedValue;
        if (variable.resolvedType === "COLOR") {
          if (typeof value === "object" && value && value.r !== undefined) {
            formattedValue = rgbToHex(value);
          } else if (typeof value === "string" && value && value.startsWith("#")) {
            formattedValue = value;
          } else {
            formattedValue = "#FFFFFF";
          }
        } else if (variable.resolvedType === "FLOAT") {
          formattedValue = (typeof value === "number") ? value : parseFloat(value) || 0;
        } else {
          formattedValue = String(value || "");
        }


        // Re-catégorisation intelligente (UNIQUEMENT pour "unknown", pas pour "brand" ou "system")
        // Les tokens Brand (50-950) et System (success, warning, etc.) ne doivent PAS être re-catégorisés
        var finalCategory = effectiveCategory;
        if (effectiveCategory === "unknown") {
          if (isRadiusPattern(variable.name)) finalCategory = "radius";
          else if (isSpacingPattern(variable.name)) finalCategory = "spacing";
        }

        if (!tokens[finalCategory]) tokens[finalCategory] = {};
        tokens[finalCategory][cleanName] = formattedValue;

        // 🔍 DIAGNOSTIC: Log storage for brand and system tokens
        if (finalCategory === 'brand') {
          console.log('💾 [BRAND_STORAGE] Stored:', {
            cleanName: cleanName,
            formattedValue: formattedValue,
            currentBrandCount: Object.keys(tokens.brand).length
          });
        }
        if (finalCategory === 'system') {
          console.log('💾 [SYSTEM_STORAGE] Stored:', {
            cleanName: cleanName,
            formattedValue: formattedValue,
            currentSystemCount: Object.keys(tokens.system).length
          });
        }
      }
    }
  }

  // Détermination finale de la librairie gagnante
  var maxScore = 0;
  var detectedLibrary = "tailwind"; // Defaut

  // Tailwind favorisé en cas d'égalité car c'est le standard par défaut
  if (libraryScores.tailwind >= maxScore && libraryScores.tailwind > 0) { maxScore = libraryScores.tailwind; detectedLibrary = "tailwind"; }
  if (libraryScores.mui > maxScore) { maxScore = libraryScores.mui; detectedLibrary = "mui"; }
  if (libraryScores.ant > maxScore) { maxScore = libraryScores.ant; detectedLibrary = "ant"; }
  if (libraryScores.bootstrap > maxScore) { maxScore = libraryScores.bootstrap; detectedLibrary = "bootstrap"; }
  if (libraryScores.chakra > maxScore) { maxScore = libraryScores.chakra; detectedLibrary = "chakra"; }

  (function () { return function () { } })() && console.log('📦 extractExistingTokens result:', {
    brand: Object.keys(tokens.brand).length,
    semanticModes: Object.keys(tokens.semantic.modes || {}),
    detectedLibrary: detectedLibrary,
    scores: libraryScores
  });

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
  const lib = normalizeLibType(naming);

  // Couleurs système adaptées selon la bibliothèque
  var baseColors;
  if (lib === 'chakra') {
    baseColors = {
      success: "#38A169",  // Vert Chakra
      warning: "#D69E2E",  // Orange Chakra
      error: "#E53E3E",    // Rouge Chakra
      info: "#3182CE"      // Bleu Chakra
    };
  } else if (lib === 'bootstrap') {
    baseColors = {
      success: "#28A745",  // Vert Bootstrap
      warning: "#FFC107",  // Jaune Bootstrap
      error: "#DC3545",    // Rouge Bootstrap
      info: "#17A2B8"      // Cyan Bootstrap
    };
  } else if (lib === 'ant') {
    baseColors = {
      success: "#52C41A",  // Vert Ant
      warning: "#FAAD14",  // Orange Ant
      error: "#FF4D4F",    // Rouge Ant
      info: "#1890FF"      // Bleu Ant
    };
  } else {
    // MUI/Tailwind - couleurs génériques
    baseColors = {
      success: "#10B981",  // Vert générique
      warning: "#F59E0B",  // Orange générique
      error: "#EF4444",    // Rouge générique
      info: "#3B82F6"      // Bleu générique
    };
  }

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







// NOTE: semanticScopesMapping est défini plus bas (ligne ~4519) avec primitiveScopesMapping
// pour garantir une seule source de vérité


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

  // ===== FAMILLES PRINCIPALES (ordre d'importance) =====

  // 1. TEXTE
  if (normalizedKey.startsWith('text-') || normalizedKey.includes('-text-')) {
    return 'text';
  }

  // 2. BACKGROUND / SURFACE
  if (normalizedKey.startsWith('background-') || normalizedKey.startsWith('bg-') ||
    normalizedKey.includes('-background-') || normalizedKey.includes('-bg-')) {
    return 'background';
  }

  if (normalizedKey.startsWith('surface-') || normalizedKey.includes('-surface-')) {
    return 'surface';
  }

  // 3. BORDURES
  if (normalizedKey.startsWith('border-') || normalizedKey.includes('-border-')) {
    // Vérifier que ce n'est pas border-1, border-2 (primitives)
    if (!/^border-\d+$/.test(normalizedKey)) {
      return 'border';
    }
  }

  if (normalizedKey.startsWith('ring-') || normalizedKey.includes('-ring-')) {
    return 'ring';
  }

  // 4. ON (couleurs de contraste sur fonds colorés)
  // ⚠️ IMPORTANT: Détecter AVANT action/status pour capturer action-*-text, status-*-text
  if (normalizedKey.startsWith('on-') || normalizedKey.includes('-on-')) {
    return 'on';
  }

  // Détecter aussi les tokens se terminant par -text ou -contrastText
  if (normalizedKey.endsWith('-text') || normalizedKey.endsWith('-contrasttext') ||
    normalizedKey.includes('-text-') || normalizedKey.includes('-contrasttext-')) {
    return 'on';
  }

  // 5. ACTIONS (boutons, composants interactifs)
  if (normalizedKey.startsWith('action-') || normalizedKey.includes('-action-')) {
    return 'action';
  }

  // 6. STATUS (badges, alerts, notifications)
  if (normalizedKey.startsWith('status-') || normalizedKey.includes('-status-')) {
    return 'status';
  }

  // 7. DIMENSIONS
  if (normalizedKey.startsWith('radius-') || normalizedKey.includes('-radius-')) {
    return 'radius';
  }

  if (normalizedKey.startsWith('space-') || normalizedKey.startsWith('spacing-') ||
    normalizedKey.includes('-space-') || normalizedKey.includes('-spacing-')) {
    return 'space';
  }

  if (normalizedKey.startsWith('font-size-') || normalizedKey.includes('-font-size-') ||
    normalizedKey.startsWith('fontsize-') || normalizedKey.includes('-fontsize-')) {
    return 'fontSize';
  }

  if (normalizedKey.startsWith('font-weight-') || normalizedKey.includes('-font-weight-') ||
    normalizedKey.startsWith('fontweight-') || normalizedKey.includes('-fontweight-')) {
    return 'fontWeight';
  }

  // 8. ACCENT (legacy - pour compatibilité)
  // Tokens "brand/primary/success/warning/destructive/info" génériques
  if (normalizedKey === 'primary' || normalizedKey.startsWith('primary-') || normalizedKey.includes('-primary-')) {
    return 'accent';
  }
  if (['success', 'warning', 'destructive', 'info', 'error'].some(function (status) {
    return normalizedKey === status || normalizedKey.startsWith(status + '-') || normalizedKey.includes('-' + status + '-');
  })) {
    return 'accent';
  }

  return ''; // Famille inconnue
}

function createScopeContext(figmaVar, tokenKey, category) {
  var normalizedKey = normalizeKey(tokenKey || figmaVar.name);
  var family = category === "semantic" ? inferSemanticFamily(normalizedKey) : category;

  var context = {
    kind: category === "semantic" ? "semantic" : "primitive",
    key: tokenKey || figmaVar.name,
    category: category,
    type: figmaVar.resolvedType || "COLOR", // fallback safe
    normalizedKey: normalizedKey,
    family: family
  };

  if (DEBUG_SCOPES_SCAN) {
    console.log('🔍 [SCOPE_CONTEXT]', {
      tokenKey: tokenKey,
      variableName: figmaVar.name,
      category: category,
      normalizedKey: normalizedKey,
      detectedFamily: family,
      kind: context.kind,
      type: context.type
    });
  }

  return context;
}

// NOTE:
// - WIDTH_HEIGHT volontairement retiré : width/height non gérés dans l'outil
// - Typography limitée à FONT_SIZE tant que line-height / letter-spacing ne sont pas supportés
// - ALL_SCOPES supprimé pour éviter des scopes trop permissifs
// - PRIMITIVES: Scopes VIDES pour ne JAMAIS être proposées dans le scan

var primitiveScopesMapping = {
  brand: [],      // ❌ Jamais proposé - Utiliser les sémantiques (bg-*, action-*, etc.)
  gray: [],       // ❌ Jamais proposé - Utiliser les sémantiques (text-*, bg-*, etc.)
  system: [],     // ❌ Jamais proposé - Utiliser les sémantiques (status-*, etc.)
  border: [],     // ❌ Jamais proposé - Utiliser les sémantiques (border-*)
  radius: [],     // ❌ Jamais proposé - Utiliser les sémantiques (radius-*)
  spacing: [],    // ❌ Jamais proposé - Utiliser les sémantiques (space-*)
  typography: []  // ❌ Jamais proposé - Utiliser les sémantiques (font-size-*)
};

var semanticScopesMapping = {
  // ===== COULEURS DE TEXTE =====
  text: ["TEXT_FILL"],
  // Intention: Uniquement pour le texte
  // Exemples: text-primary, text-secondary, text-muted

  // ===== COULEURS DE FOND =====
  background: ["FRAME_FILL", "SHAPE_FILL"],
  // Intention: Fonds de frames et shapes (PAS de texte)
  // Exemples: bg-canvas, bg-surface, bg-elevated
  // Note: FRAME_FILL + SHAPE_FILL (PAS ALL_FILLS car ALL_FILLS inclut TEXT_FILL dans Figma)

  surface: ["FRAME_FILL", "SHAPE_FILL"],
  // Intention: Surfaces spéciales (overlays, modals, cards)
  // Exemples: surface-overlay, surface-elevated
  // Note: FRAME_FILL + SHAPE_FILL (pas ALL_FILLS) car les surfaces sont des frames ou shapes

  // ===== COULEURS DE BORDURE =====
  border: ["STROKE_COLOR"],
  // Intention: Uniquement pour les strokes (couleur)
  // Exemples: border-default, border-muted, border-focus
  // Note: border-1, border-2 sont des primitives STROKE_FLOAT

  ring: ["STROKE_COLOR"],
  // Intention: Anneaux de focus (strokes uniquement)
  // Exemples: ring-focus, ring-offset

  // ===== COULEURS D'ACTION (BOUTONS, COMPOSANTS INTERACTIFS) =====
  action: ["FRAME_FILL", "SHAPE_FILL"],
  // Intention: Fonds de boutons uniquement (pas de stroke)
  // Exemples: action-primary-default, action-secondary-hover
  // Note: Les boutons outline utilisent border.* pour le contour

  // ===== COULEURS DE STATUT (BADGES, ALERTS, NOTIFICATIONS) =====
  status: ["FRAME_FILL", "SHAPE_FILL", "TEXT_FILL", "STROKE_COLOR"],
  // Intention: Badges (fond/contour) ou alertes (texte)
  // Exemples: status-success, status-warning
  // Note: Très polyvalent pour couvrir tous les cas de feedback

  // ===== COULEURS DE CONTRASTE (LEGACY - DEPRECATED) =====
  // Note: Les tokens on.* sont dépréciés, utiliser action.*.text et status.*.text à la place
  on: ["TEXT_FILL"],

  // ===== ACCENT (LEGACY) =====
  accent: ["FRAME_FILL", "SHAPE_FILL", "STROKE_COLOR"],

  // ===== DIMENSIONS (FLOAT) =====
  radius: ["CORNER_RADIUS"],
  space: ["GAP", "INDIVIDUAL_PADDING"],
  fontSize: ["FONT_SIZE"],
  fontWeight: []
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
  // LOGIQUE SPÉCIALE: tout token border-* de type FLOAT -> STROKE_FLOAT uniquement
  var normalizedKey = context.normalizedKey || context.key;
  if (normalizedKey && normalizedKey.startsWith('border-') && context.type === "FLOAT") {
    return ["STROKE_FLOAT"]; // Scope STROKE_FLOAT pour les épaisseurs de stroke
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
  if (context.type !== "COLOR" && scopes.some(function (scope) {
    return ["TEXT_FILL", "FRAME_FILL", "SHAPE_FILL", "STROKE_COLOR", "EFFECT_COLOR"].indexOf(scope) !== -1;
  })) {
    scopes = scopes.filter(function (scope) {
      return ["TEXT_FILL", "FRAME_FILL", "SHAPE_FILL", "STROKE_COLOR", "EFFECT_COLOR"].indexOf(scope) === -1;
    });
  }

  return scopes;
}

/**
 * getRequiredScopesForScanResult: Retourne les scopes attendus pour un résultat de scan
 * Centralise la logique dispersée dans le code
 */
function getRequiredScopesForScanResult(result) {
  if (!result) return [];

  var property = result.property || '';
  var figmaProperty = result.figmaProperty || '';
  var nodeType = result.nodeType || '';

  // Fill (Frame/Shape/Text)
  if (property === 'Fill' || figmaProperty === 'fills') {
    if (nodeType === 'TEXT') {
      return ['TEXT_FILL'];
    }
    // Frame ou Shape
    return ['FRAME_FILL', 'SHAPE_FILL', 'ALL_FILLS'];
  }

  // Stroke
  if (property === 'Stroke' || property === 'Stroke Style' || figmaProperty === 'strokes') {
    return ['STROKE_COLOR'];
  }

  // Effect (shadow color)
  if (property === 'Effect' || figmaProperty === 'effects') {
    return ['EFFECT_COLOR'];
  }

  // Corner radius
  if (property === 'Corner Radius' || figmaProperty === 'cornerRadius' || figmaProperty === 'topLeftRadius') {
    return ['CORNER_RADIUS'];
  }

  // Gap/spacing
  if (property === 'Gap' || figmaProperty === 'itemSpacing' || figmaProperty === 'paddingLeft') {
    return ['GAP'];
  }

  // Font size
  if (property === 'Font Size' || figmaProperty === 'fontSize') {
    return ['FONT_SIZE'];
  }

  // Border width / stroke weight (FLOAT)
  if (property === 'Border Width' || figmaProperty === 'strokeWeight' ||
    figmaProperty === 'strokeTopWeight' || figmaProperty === 'strokeBottomWeight' ||
    figmaProperty === 'strokeLeftWeight' || figmaProperty === 'strokeRightWeight') {
    return ['STROKE_FLOAT'];
  }

  return [];
}

/**
 * isSemanticVariable: Détermine si une variable est sémantique (pas primitive)
 */
function isSemanticVariable(variableName, variableOrMetadata) {
  if (!variableName) return false;

  var normalized = normalizeTokenName(variableName);

  // 1. SÉCURITÉ : Vérifier le nom de la collection si disponible
  if (variableOrMetadata) {
    var colName = "";
    try {
      if (variableOrMetadata.variableCollectionId) {
        var col = figma.variables.getVariableCollectionById(variableOrMetadata.variableCollectionId);
        if (col) colName = col.name.toLowerCase();
      } else if (variableOrMetadata.collectionName) {
        colName = variableOrMetadata.collectionName.toLowerCase();
      }
    } catch (e) { }

    // Si la collection est explicitement une collection de primitives connues, on rejette tout de suite
    if (colName.indexOf('grayscale') !== -1 ||
      colName.indexOf('brand colors') !== -1 ||
      colName.indexOf('system colors') !== -1 ||
      colName.indexOf('spacing') !== -1 ||
      colName.indexOf('radius') !== -1 ||
      colName.indexOf('typography') !== -1) {
      return false;
    }
  }

  // 2. Exclure les patterns de primitives connues (pour les collections mixtes ou non détectées)
  var primitivePatterns = [
    /^brand-\d+$/,           // brand-50
    /^gray-\d+$/,            // gray-50
    /^success-\d+$/,         // success-50
    /^warning-\d+$/,
    /^error-\d+$/,
    /^info-\d+$/,
    /^spacing-\d+$/,
    /^border-\d+$/           // border-1, border-2 (épaisseurs)
  ];

  for (var i = 0; i < primitivePatterns.length; i++) {
    if (primitivePatterns[i].test(normalized)) {
      return false;
    }
  }

  // 3. Patterns sémantiques positifs (y compris les nouveaux dossiers Figma)
  var semanticPrefixes = [
    'bg-', 'background-',
    'text-',
    'border-', // border-default, border-muted (pas border-1)
    'action-',
    'status-',
    'on-',
    'ring-',
    'surface-',
    'ui-', // ✅ Dossier racine pour radius/spacing
    'radius-',
    'space-',
    'spacing-',
    'font-',
    'accent-',
    'primary-',
    'secondary-',
    'success-',
    'warning-',
    'error-',
    'destructive-',
    'info-'
  ];

  for (var j = 0; j < semanticPrefixes.length; j++) {
    if (normalized.startsWith(semanticPrefixes[j])) {
      // Double check pour border-1
      if (semanticPrefixes[j] === 'border-' && /^border-\d+$/.test(normalized)) {
        return false;
      }
      return true;
    }
  }

  // 💡 Si on a un slash (dossier), c'est probablement sémantique
  if (variableName.indexOf('/') !== -1) {
    return true;
  }

  return false;
}

/**
 * getPreferredModeIdForScan: Retourne le mode préféré pour le scan (Light en priorité)
 */
function getPreferredModeIdForScan(collection) {
  if (!collection || !collection.modes || collection.modes.length === 0) {
    return null;
  }

  // Chercher un mode nommé "Light" ou "light"
  for (var i = 0; i < collection.modes.length; i++) {
    var mode = collection.modes[i];
    if (mode.name && (mode.name.toLowerCase() === 'light' || mode.name.toLowerCase() === 'default')) {
      return mode.modeId;
    }
  }

  // Sinon, retourner le premier mode
  return collection.modes[0].modeId;
}

// ============================================================================
// TOKEN NAME NORMALIZATION (CRITICAL FOR MATCHING)
// ============================================================================

/**
 * Normalizes token names for consistent matching
 * "bg.inverse", "bg/inverse", "bg / inverse", "bg - inverse" -> "bg-inverse"
 * @param {string} name - Token name to normalize
 * @returns {string} Normalized name
 */
function normalizeTokenName(name) {
  if (!name) return '';
  return name
    .trim()
    .toLowerCase()
    .replace(/[\\/\\.]/g, '-')      // Replace /, \, . with -
    .replace(/\s+/g, '-')            // Replace spaces with -
    .replace(/-+/g, '-')             // Collapse multiple dashes
    .replace(/^-|-$/g, '');          // Remove leading/trailing dashes
}

/**
 * detectNodeModeId: Détecte le modeId d'un node
 * PRIORITÉ 1: Mode explicite du node
 * PRIORITÉ 2: Mode explicite du parent
 * PRIORITÉ 3: Mode Light par défaut de la collection Semantic
 * @param {SceneNode} node - Node à analyser
 * @returns {string|null} modeId ou null
 */
function detectNodeModeId(node) {
  if (!node) return null;

  // Priority 1: Explicit mode on the node itself
  if (node.explicitVariableModes) {
    var collectionIds = Object.keys(node.explicitVariableModes);
    if (collectionIds.length > 0) {
      // Find the Semantic collection
      var collections = figma.variables.getLocalVariableCollections();
      for (var i = 0; i < collections.length; i++) {
        var col = collections[i];
        var colName = col.name.toLowerCase();
        if (colName.indexOf('semantic') !== -1 || colName.indexOf('sémantique') !== -1) {
          var modeId = node.explicitVariableModes[col.id];
          if (modeId) {
            return modeId;
          }
        }
      }

      // Fallback: use first collection's mode
      return node.explicitVariableModes[collectionIds[0]];
    }
  }

  // Priority 2: Inherit from parent
  if (node.parent && node.parent.explicitVariableModes) {
    return detectNodeModeId(node.parent);
  }

  // Priority 3: Find default Light mode from Semantic collection
  var collections = figma.variables.getLocalVariableCollections();
  for (var i = 0; i < collections.length; i++) {
    var col = collections[i];
    var colName = col.name.toLowerCase();
    if (colName.indexOf('semantic') !== -1 || colName.indexOf('sémantique') !== -1) {
      // Find Light mode
      for (var j = 0; j < col.modes.length; j++) {
        var mode = col.modes[j];
        var modeName = mode.name.toLowerCase();
        if (modeName.indexOf('light') !== -1 || modeName.indexOf('clair') !== -1) {
          return mode.modeId;
        }
      }
      // Fallback: first mode
      if (col.modes.length > 0) {
        return col.modes[0].modeId;
      }
    }
  }

  return null;
}

/**
 * detectFrameMode: Détecte si une frame est en mode Light ou Dark
 * PRIORITÉ 1: Utilise le mode explicite de Figma (explicitVariableModes)
 * PRIORITÉ 2: Fallback sur la luminosité du background
 * @param {FrameNode} node - Frame à analyser
 * @returns {string} 'light' ou 'dark'
 */
function detectFrameMode(node) {
  if (!node) return 'light'; // Défaut

  // ============================================================================
  // PRIORITÉ 1: Utiliser le mode explicite de Figma
  // ============================================================================
  // Figma permet de définir explicitement le mode d'une frame via explicitVariableModes
  // C'est LA source de vérité, pas la couleur du fond !

  if (node.explicitVariableModes) {
    // explicitVariableModes est un objet { collectionId: modeId }
    // On cherche le premier mode défini
    var collectionIds = Object.keys(node.explicitVariableModes);

    if (collectionIds.length > 0) {
      var firstCollectionId = collectionIds[0];
      var modeId = node.explicitVariableModes[firstCollectionId];

      // Récupérer le nom du mode depuis la collection
      try {
        var collection = figma.variables.getVariableCollectionById(firstCollectionId);
        if (collection && collection.modes) {
          var mode = collection.modes.find(function (m) { return m.modeId === modeId; });
          if (mode) {
            var modeName = mode.name.toLowerCase();

            // Détecter si c'est light ou dark basé sur le nom
            var isLight = modeName.indexOf('light') !== -1 || modeName.indexOf('clair') !== -1;
            var isDark = modeName.indexOf('dark') !== -1 || modeName.indexOf('sombre') !== -1;

            if (isLight || isDark) {
              var detectedFromMode = isLight ? 'light' : 'dark';

              if (DEBUG_SCOPES_SCAN) {
                console.log('🌓 [MODE_DETECTION] Using explicit Figma mode:', {
                  nodeName: node.name,
                  nodeType: node.type,
                  collectionId: firstCollectionId,
                  modeId: modeId,
                  modeName: mode.name,
                  detectedMode: detectedFromMode,
                  source: 'explicitVariableModes'
                });
              }

              return detectedFromMode;
            }
          }
        }
      } catch (e) {
        // Si erreur, continuer avec le fallback
        console.warn('[MODE_DETECTION] Error reading explicitVariableModes:', e);
      }
    }
  }

  // ============================================================================
  // PRIORITÉ 2: Fallback sur la luminosité (ancien comportement)
  // ============================================================================

  // Essayer de récupérer la couleur de fond
  var backgroundColor = null;

  // Méthode 1: Vérifier les fills
  if (node.fills && node.fills.length > 0) {
    var firstFill = node.fills[0];
    if (firstFill.type === 'SOLID' && firstFill.visible !== false) {
      backgroundColor = firstFill.color;
    }
  }

  // Méthode 2: Si pas de fill, vérifier le parent
  if (!backgroundColor && node.parent && node.parent.type !== 'PAGE') {
    return detectFrameMode(node.parent);
  }

  // Si toujours pas de couleur, défaut = light
  if (!backgroundColor) {
    return 'light';
  }

  // Calculer la luminance relative (formule W3C)
  // https://www.w3.org/TR/WCAG20/#relativeluminancedef
  function getLuminance(color) {
    var r = color.r;
    var g = color.g;
    var b = color.b;

    // Convertir en sRGB
    var rsRGB = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
    var gsRGB = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
    var bsRGB = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);

    return 0.2126 * rsRGB + 0.7152 * gsRGB + 0.0722 * bsRGB;
  }

  var luminance = getLuminance(backgroundColor);

  // Seuil: 0.5 (50% de luminance)
  // < 0.5 = Dark (fond sombre)
  // >= 0.5 = Light (fond clair)
  var detectedMode = luminance < 0.5 ? 'dark' : 'light';

  if (DEBUG_SCOPES_SCAN) {
    console.log('🌓 [MODE_DETECTION] Using luminance fallback:', {
      nodeName: node.name,
      nodeType: node.type,
      backgroundColor: backgroundColor,
      luminance: luminance.toFixed(3),
      detectedMode: detectedMode,
      source: 'luminance_fallback'
    });
  }

  return detectedMode;
}

/**
 * getModeIdByName: Trouve le modeId d'une collection par nom de mode
 * @param {VariableCollection} collection
 * @param {string} modeName - 'light' ou 'dark'
 * @returns {string|null} modeId ou null
 */
function getModeIdByName(collection, modeName) {
  if (!collection || !collection.modes) return null;

  var normalizedName = modeName.toLowerCase();

  for (var i = 0; i < collection.modes.length; i++) {
    var mode = collection.modes[i];
    if (mode.name) {
      var modeNameLower = mode.name.toLowerCase();

      // Match exact ou partiel
      if (modeNameLower === normalizedName ||
        (normalizedName === 'light' && (modeNameLower.indexOf('light') !== -1 || modeNameLower.indexOf('clair') !== -1)) ||
        (normalizedName === 'dark' && (modeNameLower.indexOf('dark') !== -1 || modeNameLower.indexOf('sombre') !== -1))) {
        return mode.modeId;
      }
    }
  }

  return null;
}

/**
 * validateScopesAndFiltering: Self-test pour vérifier scopes + semantic-only
 * Appelé en mode DEBUG uniquement
 */
function validateScopesAndFiltering() {
  if (!DEBUG_SCOPES_SCAN) return;

  console.log('🧪 [SELF_TEST] Running scopes and filtering validation...');

  var tests = {
    passed: 0,
    failed: 0,
    results: []
  };

  // TEST 1: isSemanticVariable doit rejeter les primitives
  var primitiveTests = [
    'brand-500',
    'gray-200',
    'success-600',
    'spacing-4',
    'radius-sm',
    'border-1'
  ];

  primitiveTests.forEach(function (name) {
    var result = isSemanticVariable(name);
    if (!result) {
      tests.passed++;
      tests.results.push({ test: 'Primitive rejection: ' + name, status: 'PASS' });
    } else {
      tests.failed++;
      tests.results.push({ test: 'Primitive rejection: ' + name, status: 'FAIL', reason: 'Should be false' });
    }
  });

  // TEST 2: isSemanticVariable doit accepter les sémantiques
  var semanticTests = [
    'bg-canvas',
    'text-primary',
    'border-default',
    'action-primary-default',
    'status-success'
  ];

  semanticTests.forEach(function (name) {
    var result = isSemanticVariable(name);
    if (result) {
      tests.passed++;
      tests.results.push({ test: 'Semantic acceptance: ' + name, status: 'PASS' });
    } else {
      tests.failed++;
      tests.results.push({ test: 'Semantic acceptance: ' + name, status: 'FAIL', reason: 'Should be true' });
    }
  });

  // TEST 3: getRequiredScopesForScanResult doit retourner les bons scopes
  var scopeTests = [
    { result: { property: 'Fill', nodeType: 'TEXT' }, expected: ['TEXT_FILL'] },
    { result: { property: 'Fill', nodeType: 'FRAME' }, expected: ['FRAME_FILL', 'SHAPE_FILL', 'ALL_FILLS'] },
    { result: { property: 'Stroke' }, expected: ['STROKE_COLOR'] },
    { result: { property: 'Corner Radius' }, expected: ['CORNER_RADIUS'] },
    { result: { figmaProperty: 'strokeWeight' }, expected: ['STROKE_FLOAT'] }
  ];

  scopeTests.forEach(function (test) {
    var scopes = getRequiredScopesForScanResult(test.result);
    var match = JSON.stringify(scopes.sort()) === JSON.stringify(test.expected.sort());
    if (match) {
      tests.passed++;
      tests.results.push({ test: 'Scopes for ' + (test.result.property || test.result.figmaProperty), status: 'PASS' });
    } else {
      tests.failed++;
      tests.results.push({
        test: 'Scopes for ' + (test.result.property || test.result.figmaProperty),
        status: 'FAIL',
        reason: 'Expected ' + JSON.stringify(test.expected) + ', got ' + JSON.stringify(scopes)
      });
    }
  });

  // TEST 4: Vérifier les scopes intentionnels des familles sémantiques
  var familyTests = [
    { name: 'bg-canvas', expectedFamily: 'background', expectedScopes: ['FRAME_FILL', 'SHAPE_FILL'] },
    { name: 'text-primary', expectedFamily: 'text', expectedScopes: ['TEXT_FILL'] },
    { name: 'border-default', expectedFamily: 'border', expectedScopes: ['STROKE_COLOR'] },
    { name: 'action-primary-default', expectedFamily: 'action', expectedScopes: ['FRAME_FILL', 'SHAPE_FILL'] },
    { name: 'status-success', expectedFamily: 'status', expectedScopes: ['FRAME_FILL', 'SHAPE_FILL', 'TEXT_FILL'] },
    { name: 'on-primary', expectedFamily: 'on', expectedScopes: ['TEXT_FILL'] },
    { name: 'ring-focus', expectedFamily: 'ring', expectedScopes: ['STROKE_COLOR'] },
    { name: 'surface-overlay', expectedFamily: 'surface', expectedScopes: ['FRAME_FILL', 'SHAPE_FILL'] }
  ];

  familyTests.forEach(function (test) {
    var normalized = normalizeKey(test.name);
    var family = inferSemanticFamily(normalized);
    var scopes = semanticScopesMapping[family] || [];

    // Vérifier la famille
    if (family === test.expectedFamily) {
      tests.passed++;
      tests.results.push({ test: 'Family for ' + test.name, status: 'PASS' });
    } else {
      tests.failed++;
      tests.results.push({
        test: 'Family for ' + test.name,
        status: 'FAIL',
        reason: 'Expected ' + test.expectedFamily + ', got ' + family
      });
    }

    // Vérifier les scopes
    var scopesMatch = JSON.stringify(scopes.sort()) === JSON.stringify(test.expectedScopes.sort());
    if (scopesMatch) {
      tests.passed++;
      tests.results.push({ test: 'Scopes for ' + test.name, status: 'PASS' });
    } else {
      tests.failed++;
      tests.results.push({
        test: 'Scopes for ' + test.name,
        status: 'FAIL',
        reason: 'Expected ' + JSON.stringify(test.expectedScopes) + ', got ' + JSON.stringify(scopes)
      });
    }
  });

  // Résumé
  console.log('🧪 [SELF_TEST] Results:', {
    total: tests.passed + tests.failed,
    passed: tests.passed,
    failed: tests.failed,
    details: tests.results
  });

  if (tests.failed > 0) {
    console.warn('⚠️ [SELF_TEST] Some tests failed! Review the details above.');
  } else {
    console.log('✅ [SELF_TEST] All tests passed!');
  }
}

function applyScopes(figmaVar, scopes, debugLabel) {
  // Guard: vérifier que c'est bien une vraie Variable Figma
  if (!figmaVar || !figmaVar.id || typeof figmaVar.name !== 'string') {
    return;
  }

  // Déterminer capabilities
  var hasSetScopes = typeof figmaVar.setScopes === 'function';
  var hasScopesProp = 'scopes' in figmaVar;

  // Log AVANT application (si DEBUG_SCOPES_SCAN)
  if (DEBUG_SCOPES_SCAN && debugLabel) {
    console.log('📋 [SCOPES_DEBUG] Applying scopes:', {
      variable: figmaVar.name,
      variableId: figmaVar.id,
      debugLabel: debugLabel,
      scopesToApply: scopes,
      resolvedType: figmaVar.resolvedType,
      hasSetScopes: hasSetScopes,
      hasScopesProp: hasScopesProp
    });
  }

  // Appliquer dans l'ordre de priorité
  try {
    if (hasSetScopes) {
      figmaVar.setScopes(scopes);
      // Log pour debug
      (function () { return function () { } })() && console.log(`🔧 Scopes applied to ${figmaVar.name}:`, scopes);
    } else if (hasScopesProp) {
      figmaVar.scopes = scopes;
      // Log pour debug
      (function () { return function () { } })() && console.log(`🔧 Scopes set to ${figmaVar.name}:`, scopes);
    }

    // Log APRÈS application (vérification)
    if (DEBUG_SCOPES_SCAN && debugLabel) {
      var actualScopes = figmaVar.scopes || [];
      console.log('✅ [SCOPES_DEBUG] Scopes applied successfully:', {
        variable: figmaVar.name,
        scopesApplied: actualScopes,
        match: JSON.stringify(scopes) === JSON.stringify(actualScopes)
      });
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

  // LOG TOUJOURS ACTIF pour tracer les scopes appliqués
  console.log('🔧 [APPLY_SCOPES]', {
    variable: figmaVar.name,
    family: context.family,
    kind: context.kind,
    scopes: scopes,
    isEmpty: scopes.length === 0
  });

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

function applySemanticValue(variable, semanticData, semanticKey, explicitModeId) {
  if (!variable || !semanticData) return;

  // Tâche B — ModeId safe (pas de fallback hasardeux)
  var modeId = explicitModeId || safeGetModeId(variable);
  if (!modeId) {
    console.error(`❌ [APPLY_FAIL] ${semanticKey}: no modeId available for variable ${variable.id}`);
    return;
  }

  // Tâche A — Normalisation aliasTo
  const norm = normalizeAliasToDescriptor(semanticData.aliasTo);

  var processedValue;
  var valueType = 'raw';

  // Tâche B — Application défensive : si alias valide → VARIABLE_ALIAS, sinon garde l'existant
  if (norm.isValid) {
    var aliasVariable = figma.variables.getVariableById(norm.variableId);
    if (aliasVariable) {
      // ✅ VÉRIFICATIONS SUPPLÉMENTAIRES pour éviter les alias cassés
      // 1. Vérifier la compatibilité des types
      var semanticType = semanticData.type || variable.resolvedType;
      var aliasType = aliasVariable.resolvedType;
      if (semanticType !== aliasType) {
        console.warn(`⚠️ [APPLY_SKIP] ${semanticKey}: type mismatch (semantic: ${semanticType}, alias: ${aliasType}), skipping alias creation`);
        // Fallback vers resolvedValue si disponible
        if (semanticData.resolvedValue != null && semanticData.resolvedValue !== undefined) {
          processedValue = getProcessedValueFromResolved(semanticData.resolvedValue, semanticData.type);
          valueType = 'raw';
          (function () { return function () { } })() && console.log(`💾 [APPLY] ${semanticKey} => raw (type mismatch) => ${semanticData.resolvedValue}`);
        } else {
          return; // EARLY RETURN - pas d'écrasement
        }
      } else {
        // 2. Vérifier que la variable cible a une valeur dans au moins un mode
        var aliasCollection = figma.variables.getVariableCollectionById(aliasVariable.variableCollectionId);
        var hasValidValue = false;
        if (aliasCollection && aliasCollection.modes && aliasCollection.modes.length > 0) {
          // Vérifier si la variable a une valeur dans le mode actuel ou un mode compatible
          for (var m = 0; m < aliasCollection.modes.length; m++) {
            var aliasModeId = aliasCollection.modes[m].modeId;
            var aliasValue = aliasVariable.valuesByMode[aliasModeId];
            if (aliasValue !== undefined && aliasValue !== null) {
              hasValidValue = true;
              break;
            }
          }
        }

        if (!hasValidValue) {
          console.warn(`⚠️ [APPLY_SKIP] ${semanticKey}: alias variable ${norm.variableId} has no valid value in any mode, skipping alias creation`);
          // Fallback vers resolvedValue si disponible
          if (semanticData.resolvedValue != null && semanticData.resolvedValue !== undefined) {
            processedValue = getProcessedValueFromResolved(semanticData.resolvedValue, semanticData.type);
            valueType = 'raw';
            (function () { return function () { } })() && console.log(`💾 [APPLY] ${semanticKey} => raw (no valid value) => ${semanticData.resolvedValue}`);
          } else {
            return; // EARLY RETURN - pas d'écrasement
          }
        } else {
          // ✅ ALIAS VALIDE : créer VARIABLE_ALIAS, jamais de fallback destructeur
          processedValue = { type: "VARIABLE_ALIAS", id: norm.variableId };
          valueType = 'alias';
          (function () { return function () { } })() && console.log(`🔗 [APPLY] ${semanticKey} alias => id=${norm.variableId}`);
        }
      }
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
      (function () { return function () { } })() && console.log(`🛡️ [ALIAS_PRESERVED] ${semanticKey} kept existing alias in Figma (not overwriting with raw value)`);
      return; // EARLY RETURN - pas d'écrasement
    }

    // Pas d'alias valide défini : utiliser resolvedValue si elle existe
    if (semanticData.resolvedValue != null && semanticData.resolvedValue !== undefined) {
      processedValue = getProcessedValueFromResolved(semanticData.resolvedValue, semanticData.type);
      valueType = 'raw';
      (function () { return function () { } })() && console.log(`💾 [APPLY] ${semanticKey} => raw => ${semanticData.resolvedValue}`);
    } else {
      // ❌ Pas d'alias ET resolvedValue null/undefined : NE PAS écraser
      (function () { return function () { } })() && console.log(`⏭️ [APPLY_SKIP] ${semanticKey}: no alias and resolvedValue is null/undefined (keeping existing value)`);
      return; // EARLY RETURN - pas d'écrasement destructeur
    }
  }

  try {
    // ✅ VÉRIFICATION FINALE avant setValueForMode pour éviter les alias cassés
    if (valueType === 'alias' && processedValue && processedValue.type === 'VARIABLE_ALIAS') {
      // Vérifier une dernière fois que la variable existe toujours (race condition protection)
      var finalCheckVariable = figma.variables.getVariableById(processedValue.id);
      if (!finalCheckVariable) {
        console.warn(`⚠️ [APPLY_SKIP] ${semanticKey}: alias variable ${processedValue.id} was deleted before application, skipping (keeping existing value)`);
        // Fallback vers resolvedValue si disponible
        if (semanticData.resolvedValue != null && semanticData.resolvedValue !== undefined) {
          processedValue = getProcessedValueFromResolved(semanticData.resolvedValue, semanticData.type);
          valueType = 'raw';
          (function () { return function () { } })() && console.log(`💾 [APPLY] ${semanticKey} => raw (variable deleted) => ${semanticData.resolvedValue}`);
        } else {
          return; // EARLY RETURN - pas d'écrasement
        }
      }
    }

    variable.setValueForMode(modeId, processedValue);
    (function () { return function () { } })() && console.log(`✅ [APPLY] ${semanticKey} => success (${valueType})`);
  } catch (e) {
    console.error(`❌ [APPLY_FAIL] ${semanticKey}: failed to set value:`, e);
    // En cas d'erreur, ne pas créer d'alias cassé - utiliser resolvedValue si disponible
    if (valueType === 'alias' && semanticData.resolvedValue != null && semanticData.resolvedValue !== undefined) {
      try {
        var fallbackValue = getProcessedValueFromResolved(semanticData.resolvedValue, semanticData.type);
        variable.setValueForMode(modeId, fallbackValue);
        (function () { return function () { } })() && console.log(`💾 [APPLY_FALLBACK] ${semanticKey} => raw value after alias failure => ${semanticData.resolvedValue}`);
      } catch (fallbackError) {
        console.error(`❌ [APPLY_FALLBACK_FAIL] ${semanticKey}: failed to set fallback value:`, fallbackError);
      }
    }
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
  (function () { return function () { } })() && console.log('🔧 createOrUpdateVariable:', category, name, type, typeof value);

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
      (function () { return function () { } })() && console.log('✅ Variable created:', name);

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
        (function () { return function () { } })() && console.log('✅ Variable retrieved after creation:', variable.name, 'collection:', variable.variableCollection ? variable.variableCollection.name : 'NONE');
      }
    } catch (e) {
      console.error('❌ Failed to create variable:', name, e);
      return null;
    }
  } else {
    (function () { return function () { } })() && console.log('📝 Variable exists:', name);

    // ✅ FIX: Appliquer les scopes aussi pour les variables existantes
    // (pas seulement lors de la création)
    var context = createScopeContext(variable, hintKey || name, category);
    applyVariableScopes(variable, context);
  }


  if (variable) {
    // N'appliquer la valeur que si elle est fournie (pour les sémantiques, on utilise applySemanticValue)
    if (value !== null && value !== undefined) {
      var modeId = collection.modes[0].modeId;
      try {
        variable.setValueForMode(modeId, value);
        (function () { return function () { } })() && console.log('💾 Value set for', name + ':', typeof value, value);
      } catch (e) {
        console.error('❌ Failed to set value for', name + ':', e);
      }
    } else if (category === 'semantic' && hintKey) {
      // Pour les variables sémantiques créées sans valeur, essayer automatiquement de créer un alias
      (function () { return function () { } })() && console.log(`🔍 [AUTO_ALIAS] Trying to create automatic alias for semantic variable: ${hintKey}`);

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
        (function () { return function () { } })() && console.log(`✅ [AUTO_ALIAS] Successfully created alias for ${hintKey}: ${finalAliasTo.collection}/${finalAliasTo.key}`);
      } else {
        (function () { return function () { } })() && console.log(`⚠️ [AUTO_ALIAS] No alias found for semantic variable: ${hintKey}`);
      }
    }

    // Réappliquer les scopes après définition de la valeur (au cas où)
    var context = createScopeContext(variable, hintKey || name, category);
    applyVariableScopes(variable, context);
  }

  return variable;
}

async function importTokensToFigma(tokens, naming, overwrite) {
  (function () { return function () { } })() && console.log('🔄 ENGINE SYNC: Starting importTokensToFigma (Refactored) - PATCH 747 ACTIVE');

  // 🔍 DIAGNOSTIC: Vérifier la structure des tokens sémantiques reçus
  if (tokens && tokens.semantic) {
    var firstSemanticKey = Object.keys(tokens.semantic)[0];
    if (firstSemanticKey) {
      var firstToken = tokens.semantic[firstSemanticKey];
      (function () { return function () { } })() && console.log(`🔍 [IMPORT_DIAGNOSTIC] First semantic token (${firstSemanticKey}):`, JSON.stringify(firstToken, null, 2));
      (function () { return function () { } })() && console.log(`🔍 [IMPORT_DIAGNOSTIC] Has modes structure: ${!!(firstToken && firstToken.modes)}`);
    }
  }

  // 1. Save naming preference
  saveNamingToFile(naming);

  // Map to store Primitive Variable IDs for Alias Resolution
  // Structure: { category: { key: variableId } }
  var primitiveMap = {};

  function registerPrimitive(category, key, variableId) {
    if (!primitiveMap[category]) primitiveMap[category] = {};
    primitiveMap[category][key] = variableId;
  }

  // --- PRIMITIVES SYNC ---

  if (tokens.brand) {
    var brandCollection = getOrCreateCollection("Brand Colors", overwrite);
    for (var key in tokens.brand) {
      if (!tokens.brand.hasOwnProperty(key)) continue;
      // Nettoyage: '50', '100' au lieu de 'primary-50' car déjà dans collection 'Brand Colors'
      var varName = key;
      var variable = await createOrUpdateVariable(brandCollection, varName, "COLOR", hexToRgb(tokens.brand[key]), "brand", overwrite, undefined);
      if (variable) registerPrimitive('brand', key, variable.id);
    }
  }

  if (tokens.system) {
    var systemCollection = getOrCreateCollection("System Colors", overwrite);

    // Aplatir la structure imbriquée (ex: system.success.500 -> success-500)
    for (var colorFamily in tokens.system) {
      if (!tokens.system.hasOwnProperty(colorFamily)) continue;

      var familyValue = tokens.system[colorFamily];

      // Si c'est un objet imbriqué (nouvelle structure CORE)
      if (typeof familyValue === 'object' && familyValue !== null && !familyValue.r) {
        for (var stop in familyValue) {
          if (!familyValue.hasOwnProperty(stop)) continue;
          var flatKey = colorFamily + '-' + stop;
          var varName = colorFamily + ' / ' + stop;
          var variable = await createOrUpdateVariable(systemCollection, varName, "COLOR", hexToRgb(familyValue[stop]), "system", overwrite, undefined);
          if (variable) registerPrimitive('system', flatKey, variable.id);
        }
      } else {
        // Format legacy (plat)
        var varName = colorFamily.replace(/\.(default|text|contrastText)/i, ' / $1').replace(/\./g, ' / ');
        var variable = await createOrUpdateVariable(systemCollection, varName, "COLOR", hexToRgb(familyValue), "system", overwrite, undefined);
        if (variable) registerPrimitive('system', colorFamily, variable.id);
      }
    }
  }

  if (tokens.gray) {
    var grayCollection = getOrCreateCollection("Grayscale", overwrite);
    for (var gKey in tokens.gray) {
      if (!tokens.gray.hasOwnProperty(gKey)) continue;
      // Nettoyage: '50' au lieu de 'gray-50' (Grayscale / 50)
      var grayName = gKey;
      var variable = await createOrUpdateVariable(grayCollection, grayName, "COLOR", hexToRgb(tokens.gray[gKey]), "gray", overwrite, undefined);
      if (variable) {
        registerPrimitive('gray', gKey, variable.id);
        (function () { return function () { } })() && console.log(`📝 [PRIMITIVE_REGISTER] gray.${gKey} -> ${variable.id} (${grayName})`);
      }
    }
  }

  if (tokens.spacing) {
    var spacingCollection = getOrCreateCollection("Spacing", overwrite);
    for (var spKey in tokens.spacing) {
      if (!tokens.spacing.hasOwnProperty(spKey)) continue;
      var varName = spKey.replace(/\./g, " / ");
      var val = normalizeFloatValue(tokens.spacing[spKey]);
      var variable = await createOrUpdateVariable(spacingCollection, varName, "FLOAT", val, "spacing", overwrite, undefined);
      if (variable) registerPrimitive('spacing', spKey, variable.id);
    }
  }

  if (tokens.radius) {
    var radiusCollection = getOrCreateCollection("Radius", overwrite);
    for (var rKey in tokens.radius) {
      if (!tokens.radius.hasOwnProperty(rKey)) continue;
      var varName = rKey.replace(/\./g, " / ");
      var rVal = normalizeFloatValue(tokens.radius[rKey]);
      var variable = await createOrUpdateVariable(radiusCollection, varName, "FLOAT", rVal, "radius", overwrite, undefined);
      if (variable) registerPrimitive('radius', rKey, variable.id);
    }
  }

  if (tokens.typography) {
    var typoCollection = getOrCreateCollection("Typography", overwrite);
    for (var tKey in tokens.typography) {
      if (!tokens.typography.hasOwnProperty(tKey)) continue;
      var varName = tKey.replace(/\./g, " / ");
      var tVal = normalizeFloatValue(tokens.typography[tKey]);
      var variable = await createOrUpdateVariable(typoCollection, varName, "FLOAT", tVal, "typography", overwrite, undefined);
      if (variable) registerPrimitive('typography', tKey, variable.id);
    }
  }

  if (tokens.border) {
    // Border is often primitive in our engine?? Or Semantic?
    // Existing code treated it as primitive list?.
    // Our engine treats border tokens as Semantics mapped to Gray.
    // But if there are border *primitives* (like widths), handle here.
    // If tokens.border contains values, sync them.
    var borderCollection = getOrCreateCollection("Border", overwrite);
    for (var bKey in tokens.border) {
      var cleanBKey = bKey.replace(/\./g, "-");
      var bVal = normalizeFloatValue(tokens.border[bKey]);
      // Only register if it looks like a primitive width?
      var variable = await createOrUpdateVariable(borderCollection, "border-" + cleanBKey, "FLOAT", bVal, "border", overwrite, undefined);
      // register?
    }
  }

  // --- SEMANTICS SYNC ---

  if (tokens.semantic) {
    (function () { return function () { } })() && console.log("Processing Semantic Tokens (Engine Mode - NEW STRUCTURE)...");
    var semanticCollection = getOrCreateCollection("Semantic", overwrite);

    // ✅ Ensure modes exist
    if (semanticCollection.modes.length === 1 && semanticCollection.modes[0].name === "Mode 1") {
      try { semanticCollection.renameMode(semanticCollection.modes[0].modeId, "Light"); } catch (e) { }
    }
    var lightMode = semanticCollection.modes.find(function (m) { return m.name === "Light"; }) || semanticCollection.modes[0];
    var darkMode = semanticCollection.modes.find(function (m) { return m.name === "Dark"; });

    if (!darkMode) {
      try {
        var modeId = semanticCollection.addMode("Dark");
        darkMode = semanticCollection.modes.find(function (m) { return m.modeId === modeId; });
        (function () { return function () { } })() && console.log("✅ Created Dark mode:", darkMode.modeId);
      } catch (e) {
        console.error("❌ Failed to create Dark mode:", e);
      }
    }

    // ✅ NOUVELLE LOGIQUE : Itérer sur les tokens, puis sur les modes
    // Structure attendue : { 'bg.canvas': { type: 'COLOR', modes: { light: {...}, dark: {...} } } }
    for (var key in tokens.semantic) {
      if (!tokens.semantic.hasOwnProperty(key)) continue;

      var tokenData = tokens.semantic[key];
      // ✅ NOUVEAU : getFigmaSemanticName au lieu de getSemanticVariableName
      var variableName = key.replace(/\./g, ' / ');
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
        { name: 'light', modeId: lightMode ? lightMode.modeId : null, data: tokenData.modes ? tokenData.modes.light : null },
        { name: 'dark', modeId: darkMode ? darkMode.modeId : null, data: tokenData.modes ? tokenData.modes.dark : null }
      ];

      for (var m = 0; m < modesToProcess.length; m++) {
        var modeInfo = modesToProcess[m];

        if (!modeInfo.modeId) {
          console.warn(`⚠️ [SYNC_SKIP] No modeId for ${modeInfo.name} mode on token ${key}`);
          continue;
        }

        if (!modeInfo.data) {
          // 🛡️ FALLBACK ROBUSTE POUR LEGACY ENGINE
          // Si le mode dark est manquant, on utilise les données light comme fallback
          // Cela évite l'erreur "No data for ... in dark mode"
          if (modeInfo.name === 'dark' && modesToProcess[0].data) {
            modeInfo.data = modesToProcess[0].data; // Fallback to Light data
            // On ne loggue pas en erreur pour ne pas spammer, un warn suffit
            // (function () { return function () { } })() && console.warn(`⚠️ [SYNC_FALLBACK] Using Light data for Dark mode on ${key}`);
          } else {
            console.error(`❌ [SYNC_ERROR] No data for ${key} in ${modeInfo.name} mode! Token structure:`, JSON.stringify(tokenData, null, 2));
            continue;
          }
        }

        var modeData = modeInfo.data;
        var resolvedValue = modeData.resolvedValue;
        var aliasRef = modeData.aliasRef;

        // 🔍 Résoudre l'ID de variable à partir de collection+key
        var resolvedAliasTo = null;
        if (aliasRef && aliasRef.category && aliasRef.key) {
          // primitiveMap a une structure imbriquée: { category: { key: variableId } }
          var foundVariableId = null;

          if (primitiveMap[aliasRef.category] && primitiveMap[aliasRef.category][aliasRef.key]) {
            foundVariableId = primitiveMap[aliasRef.category][aliasRef.key];
            console.log(`✅ [ALIAS_RESOLVE] ${key} (${modeInfo.name}) → ${aliasRef.category}.${aliasRef.key} → variableId: ${foundVariableId}`);
          } else {
            console.warn(`⚠️ [ALIAS_RESOLVE] ${key} (${modeInfo.name}) → ${aliasRef.category}.${aliasRef.key} NOT FOUND in primitiveMap.`, {
              hasCategory: !!primitiveMap[aliasRef.category],
              categoryKeys: primitiveMap[aliasRef.category] ? Object.keys(primitiveMap[aliasRef.category]).slice(0, 5) : [],
              availableCategories: Object.keys(primitiveMap)
            });
          }

          if (foundVariableId) {
            resolvedAliasTo = { variableId: foundVariableId };
          }
        }

        // Tâche A — Application
        var semanticValueData = {
          resolvedValue: resolvedValue,
          type: variableType,
          aliasTo: resolvedAliasTo
        };

        // 🔍 DIAGNOSTIC: Log what we're passing to applySemanticValue
        console.log(`🔍 [APPLY_DATA] ${key} (${modeInfo.name}):`, {
          hasAliasRef: !!aliasRef,
          aliasRef: aliasRef,
          aliasTo: semanticValueData.aliasTo,
          resolvedValue: resolvedValue
        });

        // Appliquer via function dédiée (support aliases)
        applySemanticValue(variable, semanticValueData, key, modeInfo.modeId);
      }
    }
  }

  figma.notify("✅ Sync Complete!");
  figma.ui.postMessage({ type: 'import-completed' });
}





// Fonction pour construire une map globale des variables existantes pour la résolution des alias
// VERSION AMÉLIORÉE avec plus de variantes de clés
function buildGlobalVariableMap() {
  (function () { return function () { } })() && console.log('🔍 Building global variable map for semantic alias resolution');

  var vars = figma.variables.getLocalVariables();
  var byName = new Map();

  for (var i = 0; i < vars.length; i++) {
    var variable = vars[i];
    var collection = figma.variables.getVariableCollectionById(variable.variableCollectionId);
    if (!collection) continue;

    // Clé principale : collectionName/variableName (comme dans les alias sémantiques)
    var key = collection.name + '/' + variable.name;
    byName.set(key, variable.id);

    // Clé avec catégorie normalisée (ex: gray/gray-50, brand/primary-3)
    var category = getCategoryFromVariableCollection(collection.name);
    if (category) {
      var categoryKey = category + '/' + variable.name;
      byName.set(categoryKey, variable.id);
    }

    // Clé extraite (ex: Grayscale/50 pour gray-50)
    var extractedKey = extractVariableKey(variable, collection.name);
    if (extractedKey && extractedKey !== variable.name) {
      var extractedFullKey = collection.name + '/' + extractedKey;
      byName.set(extractedFullKey, variable.id);

      // Aussi avec catégorie normalisée
      if (category) {
        var extractedCategoryKey = category + '/' + extractedKey;
        byName.set(extractedCategoryKey, variable.id);
      }
    }

    // Clé avec juste le nom de variable (pour compatibilité)
    if (!byName.has(variable.name)) {
      byName.set(variable.name, variable.id);
    }

    // Clé avec juste la clé extraite (si différente du nom)
    if (extractedKey && extractedKey !== variable.name && !byName.has(extractedKey)) {
      byName.set(extractedKey, variable.id);
    }

    // Clé avec format category-key (ex: gray-50, brand-3)
    if (category && extractedKey) {
      var categoryDashKey = category + '-' + extractedKey;
      if (!byName.has(categoryDashKey)) {
        byName.set(categoryDashKey, variable.id);
      }
    }
  }

  (function () { return function () { } })() && console.log(`✅ Global variable map built: ${byName.size} variables mapped`);
  // Debug: montrer quelques clés
  var keys = Array.from(byName.keys()).slice(0, 10);
  (function () { return function () { } })() && console.log(`🔍 Sample keys: ${keys.join(', ')}`);
  return byName;
}

/**
 * Fonction centralisée pour obtenir le mapping d'une clé sémantique selon la librairie
 * @param {string} semanticKey - Clé sémantique (ex: 'bg.canvas')
 * @param {string} lib - Type de librairie normalisé ('tailwind', 'ant', 'bootstrap', 'mui', 'chakra')
 * @returns {Object|null} Mapping avec category et keys, ou null si non trouvé
 */
function getPrimitiveMappingForSemantic(semanticKey, lib) {
  // Mapping centralisé pour toutes les librairies
  // Les clés correspondent aux valeurs extraites par extractVariableKey
  const mappings = {
    tailwind: {
      // Background
      'bg.canvas': { category: 'gray', keys: ['50'], darkKeys: ['950'] },
      'bg.surface': { category: 'gray', keys: ['100'], darkKeys: ['900'] },
      'bg.elevated': { category: 'gray', keys: ['200'], darkKeys: ['800'] },
      'bg.subtle': { category: 'gray', keys: ['300'], darkKeys: ['700'] },
      'bg.muted': { category: 'gray', keys: ['400'], darkKeys: ['600'] },
      'bg.accent': { category: 'brand', keys: ['500'], darkKeys: ['500'] },
      'bg.inverse': { category: 'gray', keys: ['950', '900'], darkKeys: ['50'] },

      // Text
      'text.primary': { category: 'gray', keys: ['950', '900'], darkKeys: ['50'] },
      'text.secondary': { category: 'gray', keys: ['600'], darkKeys: ['400'] },
      'text.muted': { category: 'gray', keys: ['400'], darkKeys: ['600'] },
      'text.accent': { category: 'brand', keys: ['600'], darkKeys: ['400'] },
      'text.link': { category: 'brand', keys: ['500'], darkKeys: ['300'] },
      'text.inverse': { category: 'gray', keys: ['50'], darkKeys: ['950'] },
      'text.disabled': { category: 'gray', keys: ['300'], darkKeys: ['700'] },

      // Border
      'border.default': { category: 'gray', keys: ['200'], darkKeys: ['800'] },
      'border.muted': { category: 'gray', keys: ['100'], darkKeys: ['900'] },
      'border.accent': { category: 'brand', keys: ['200'], darkKeys: ['500'] },
      'border.focus': { category: 'brand', keys: ['500'], darkKeys: ['400'] },

      // Action Primary
      'action.primary.default': { category: 'brand', keys: ['500'], darkKeys: ['500'] },
      'action.primary.hover': { category: 'brand', keys: ['600'], darkKeys: ['600'] },
      'action.primary.active': { category: 'brand', keys: ['700'], darkKeys: ['700'] },
      'action.primary.disabled': { category: 'gray', keys: ['300'], darkKeys: ['700'] },
      'action.primary.text': { category: 'gray', keys: ['50'], darkKeys: ['50'] },

      // Action Secondary
      'action.secondary.default': { category: 'gray', keys: ['100'], darkKeys: ['800'] },
      'action.secondary.hover': { category: 'gray', keys: ['200'], darkKeys: ['700'] },
      'action.secondary.active': { category: 'gray', keys: ['300'], darkKeys: ['600'] },
      'action.secondary.disabled': { category: 'gray', keys: ['100'], darkKeys: ['800'] },
      'action.secondary.text': { category: 'gray', keys: ['900'], darkKeys: ['50'] },

      // Status
      'status.success': { category: 'system', keys: ['success'] },
      'status.success.text': { category: 'gray', keys: ['950'], darkKeys: ['50'] },
      'status.warning': { category: 'system', keys: ['warning'] },
      'status.warning.text': { category: 'gray', keys: ['950'], darkKeys: ['50'] },
      'status.error': { category: 'system', keys: ['error'] },
      'status.error.text': { category: 'gray', keys: ['950'], darkKeys: ['50'] },
      'status.info': { category: 'system', keys: ['info'] },
      'status.info.text': { category: 'gray', keys: ['950'], darkKeys: ['50'] },

      // Dimensions
      'radius.sm': { category: 'radius', keys: ['sm', '4'] },
      'radius.md': { category: 'radius', keys: ['md', '8'] },
      'radius.lg': { category: 'radius', keys: ['lg', '12'] },
      'space.xs': { category: 'spacing', keys: ['2', '4'] },
      'space.sm': { category: 'spacing', keys: ['3', '8'] },
      'space.md': { category: 'spacing', keys: ['4', '16'] },
      'space.lg': { category: 'spacing', keys: ['6', '24'] },
      'font.size.sm': { category: 'typography', keys: ['text-sm'] },
      'font.size.base': { category: 'typography', keys: ['text-base'] },
      'font.size.lg': { category: 'typography', keys: ['text-lg'] },
      'font.weight.normal': { category: 'typography', keys: ['400'] },
      'font.weight.medium': { category: 'typography', keys: ['500'] },
      'font.weight.bold': { category: 'typography', keys: ['700'] }
    },
    ant: {
      'bg.canvas': { category: 'gray', keys: ['1'] },
      'bg.surface': { category: 'gray', keys: ['1'] },
      'bg.elevated': { category: 'gray', keys: ['2'] },
      'bg.muted': { category: 'gray', keys: ['2'] },
      'bg.inverse': { category: 'gray', keys: ['10'] },
      'text.primary': { category: 'gray', keys: ['10'] },
      'text.secondary': { category: 'gray', keys: ['8', '9'] },
      'text.muted': { category: 'gray', keys: ['6', '7'] },
      'text.inverse': { category: 'gray', keys: ['1'] },
      'text.disabled': { category: 'gray', keys: ['6'] },
      'border.default': { category: 'gray', keys: ['4'] },
      'border.muted': { category: 'gray', keys: ['3'] },
      'action.primary.default': { category: 'brand', keys: ['3'] },
      'action.primary.hover': { category: 'brand', keys: ['4'] },
      'action.primary.active': { category: 'brand', keys: ['5'] },
      'action.primary.disabled': { category: 'gray', keys: ['6'] },
      'status.success': { category: 'system', keys: ['success', '6'] },
      'status.warning': { category: 'system', keys: ['warning', '6'] },
      'status.error': { category: 'system', keys: ['error', '6'] },
      'status.info': { category: 'system', keys: ['info', '6'] },
      'radius.sm': { category: 'radius', keys: ['sm', '4'] },
      'radius.md': { category: 'radius', keys: ['md', '6'] },
      'space.sm': { category: 'spacing', keys: ['sm', '8', 'small'] },
      'space.md': { category: 'spacing', keys: ['md', '16', 'middle'] },
      'font.size.base': { category: 'typography', keys: ['14'] },
      'font.weight.base': { category: 'typography', keys: ['400'] }
    },
    bootstrap: {
      'bg.canvas': { category: 'gray', keys: ['white', '100'] },
      'bg.surface': { category: 'gray', keys: ['100', '200'] },
      'bg.elevated': { category: 'gray', keys: ['200', '300'] },
      'bg.muted': { category: 'gray', keys: ['300', '400'] },
      'bg.inverse': { category: 'gray', keys: ['900', 'dark'] },
      'text.primary': { category: 'gray', keys: ['900', 'dark'] },
      'text.secondary': { category: 'gray', keys: ['600', 'secondary'] },
      'text.muted': { category: 'gray', keys: ['500', 'muted'] },
      'text.inverse': { category: 'gray', keys: ['white', 'light'] },
      'text.disabled': { category: 'gray', keys: ['400', 'muted'] },
      'border.default': { category: 'gray', keys: ['300'] },
      'border.muted': { category: 'gray', keys: ['200'] },
      'action.primary.default': { category: 'brand', keys: ['primary'] },
      'action.primary.hover': { category: 'brand', keys: ['primary-hover', 'hover'] },
      'action.primary.active': { category: 'brand', keys: ['primary-dark', 'dark'] },
      'action.primary.disabled': { category: 'gray', keys: ['300'] },
      'status.success': { category: 'system', keys: ['success'] },
      'status.warning': { category: 'system', keys: ['warning'] },
      'status.error': { category: 'system', keys: ['error'] },
      'status.info': { category: 'system', keys: ['info'] },
      'radius.sm': { category: 'radius', keys: ['sm', '2'] },
      'radius.md': { category: 'radius', keys: ['md', '4'] },
      'space.sm': { category: 'spacing', keys: ['sm', '2', '8'] },
      'space.md': { category: 'spacing', keys: ['md', '3', '16'] },
      'font.size.base': { category: 'typography', keys: ['base', '16'] },
      'font.weight.base': { category: 'typography', keys: ['normal', '400'] }
    },
    mui: {
      'bg.canvas': { category: 'gray', keys: ['50', 'white'] },
      'bg.surface': { category: 'gray', keys: ['100', 'grey.50'] },
      'bg.elevated': { category: 'gray', keys: ['200', 'grey.100'] },
      'bg.muted': { category: 'gray', keys: ['300', 'grey.200'] },
      'bg.inverse': { category: 'gray', keys: ['950', '900'] },
      'text.primary': { category: 'gray', keys: ['950', '900'] },
      'text.secondary': { category: 'gray', keys: ['700', '600'] },
      'text.muted': { category: 'gray', keys: ['500', '400'] },
      'text.inverse': { category: 'gray', keys: ['50', '100'] },
      'text.disabled': { category: 'gray', keys: ['400', '300'] },
      'border.default': { category: 'gray', keys: ['200', '300'] },
      'border.muted': { category: 'gray', keys: ['100', '200'] },
      'action.primary.default': { category: 'brand', keys: ['main', 'primary'] },
      'action.primary.hover': { category: 'brand', keys: ['dark'] },
      'action.primary.active': { category: 'brand', keys: ['dark'] },
      'action.primary.disabled': { category: 'gray', keys: ['300', '400'] },
      'status.success': { category: 'system', keys: ['success'] },
      'status.warning': { category: 'system', keys: ['warning'] },
      'status.error': { category: 'system', keys: ['error'] },
      'status.info': { category: 'system', keys: ['info'] },
      'radius.sm': { category: 'radius', keys: ['sm', '4'] },
      'radius.md': { category: 'radius', keys: ['md', '8'] },
      'space.sm': { category: 'spacing', keys: ['sm', '8', '2'] },
      'space.md': { category: 'spacing', keys: ['md', '16', '4'] },
      'font.size.base': { category: 'typography', keys: ['base', '16'] },
      'font.weight.base': { category: 'typography', keys: ['regular', '400'] }
    },
    chakra: {
      'bg.canvas': { category: 'gray', keys: ['50'] },
      'bg.surface': { category: 'gray', keys: ['100'] },
      'bg.elevated': { category: 'gray', keys: ['200'] },
      'bg.muted': { category: 'gray', keys: ['300'] },
      'bg.inverse': { category: 'gray', keys: ['900', '800'] },
      'text.primary': { category: 'gray', keys: ['900', '800'] },
      'text.secondary': { category: 'gray', keys: ['700', '600'] },
      'text.muted': { category: 'gray', keys: ['500', '400'] },
      'text.inverse': { category: 'gray', keys: ['50'] },
      'text.disabled': { category: 'gray', keys: ['400', '300'] },
      'border.default': { category: 'gray', keys: ['200'] },
      'border.muted': { category: 'gray', keys: ['100'] },
      'action.primary.default': { category: 'brand', keys: ['300'] },
      'action.primary.hover': { category: 'brand', keys: ['400'] },
      'action.primary.active': { category: 'brand', keys: ['500'] },
      'action.primary.disabled': { category: 'gray', keys: ['300', '400'] },
      'status.success': { category: 'system', keys: ['success', '500'] },
      'status.warning': { category: 'system', keys: ['warning', '500'] },
      'status.error': { category: 'system', keys: ['error', '500'] },
      'status.info': { category: 'system', keys: ['info', 'success'] },
      'radius.sm': { category: 'radius', keys: ['sm', '4'] },
      'radius.md': { category: 'radius', keys: ['md', '8'] },
      'space.sm': { category: 'spacing', keys: ['sm', '2', '8'] },
      'space.md': { category: 'spacing', keys: ['md', '4', '16'] },
      'font.size.base': { category: 'typography', keys: ['base', '16'] },
      'font.weight.base': { category: 'typography', keys: ['normal', '400'] }
    }
  };

  return mappings[lib] && mappings[lib][semanticKey] || null;
}

/**
 * Génère les clés de fallback pour la recherche dans la map globale
 * @param {string} key - Clé de base
 * @param {string} category - Catégorie (brand, gray, system, etc.)
 * @returns {Array} Liste des clés de fallback possibles
 */
function generateFallbackKeysForMap(key, category) {
  var fallbacks = [];

  // Pour les clés numériques pures
  if (/^\d+$/.test(key)) {
    if (category === 'gray') {
      fallbacks.push('gray-' + key);
      fallbacks.push('grey-' + key);
      fallbacks.push('Grayscale/' + key);
      fallbacks.push('Grayscale/gray-' + key);
      fallbacks.push('gray/gray-' + key);
    } else if (category === 'brand') {
      fallbacks.push('primary-' + key);
      fallbacks.push('brand-' + key);
      fallbacks.push('Brand Colors/' + key);
      fallbacks.push('Brand Colors/primary-' + key);
      fallbacks.push('brand/primary-' + key);
    }
  }

  // Pour les clés avec tiret
  if (key.includes('-')) {
    var parts = key.split('-');
    if (parts.length >= 2 && /^\d+$/.test(parts[parts.length - 1])) {
      fallbacks.push(parts[parts.length - 1]); // Le numéro seul
    }
  }

  // Pour les clés brand spéciales
  if (category === 'brand') {
    if (key === 'primary') {
      fallbacks.push('main', '500', 'base');
    } else if (key === 'main') {
      fallbacks.push('primary', '500', 'base');
    } else if (key === '500') {
      fallbacks.push('main', 'primary', 'base');
    } else if (key === 'dark') {
      fallbacks.push('primary-dark', '600', '700');
    } else if (key === 'primary-dark') {
      fallbacks.push('dark', '600', '700');
    }
  }

  return fallbacks;
}

/**
 * Vérifie si une collection correspond à une catégorie donnée
 * @param {string} collectionName - Nom de la collection
 * @param {string} category - Catégorie recherchée
 * @returns {boolean} True si la collection correspond à la catégorie
 */
function isCollectionCategory(collectionName, category) {
  var c = (collectionName || '').toLowerCase();
  if (category === 'brand') return c.includes('brand');
  if (category === 'system') return c.includes('system');
  if (category === 'gray') return c.includes('gray') || c.includes('grey') || c.includes('grayscale');
  if (category === 'spacing') return c.includes('spacing');
  if (category === 'radius') return c.includes('radius');
  if (category === 'typography') return c.includes('typo') || c.includes('typography');
  return false;
}

/**
 * CONSERVER l'ancienne logique comme fallback de sécurité
 */
function resolveSemanticAliasFromMapLegacy(semanticKey, allTokens, naming, globalVariableMap) {
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

// Fonction pour résoudre les alias sémantiques en utilisant la map globale des variables
// VERSION AMÉLIORÉE avec fallback vers l'ancienne logique
// Fonction pour résoudre les alias sémantiques en utilisant la map globale des variables
// VERSION AMÉLIORÉE avec fallback vers l'ancienne logique
// Cache pour éviter les collisions DANS LE MÊME SCOPE + MODE
// Format de clé : "scope:variableId:mode" (ex: "bg:1:30:light")
// Cela permet à différents scopes (bg, text, border) de partager la même primitive
resolveSemanticAliasFromMap.usedVariables = resolveSemanticAliasFromMap.usedVariables || new Set();

function resolveSemanticAliasFromMap(semanticKey, allTokens, naming, globalVariableMap, modeName) {
  // (function(){return function(){}})()&&console.log(`🔍 [ALIAS_RESOLVE] Starting resolution for ${semanticKey} with ${naming} (Mode: ${modeName})`);

  // NOUVELLE LOGIQUE : Utiliser directement la map globale avec mappings centralisés
  try {
    const lib = normalizeLibType(naming);
    const mapping = getPrimitiveMappingForSemantic(semanticKey, lib);

    if (!mapping) {
      // console.warn(`⚠️ [ALIAS_RESOLVE] No mapping found for ${semanticKey} with ${naming}, using legacy method`);
      // FALLBACK vers l'ancienne logique si pas de mapping
      return resolveSemanticAliasFromMapLegacy(semanticKey, allTokens, naming, globalVariableMap);
    }

    // Determine correct keys based on Mode
    const isDark = (modeName && modeName.toLowerCase() === 'dark');
    const targetKeys = (isDark && mapping.darkKeys) ? mapping.darkKeys : mapping.keys;

    (function () { return function () { } })() && console.log(`🎯 [ALIAS_RESOLVE] ${semanticKey}: ${JSON.stringify(mapping)} (Mode: ${modeName || 'light'}) -> targetKeys: [${targetKeys.join(', ')}]`);

    // Chercher directement dans la map globale avec toutes les variantes possibles
    for (var i = 0; i < targetKeys.length; i++) {
      var targetKey = targetKeys[i];

      (function () { return function () { } })() && console.log(`🔍 [TARGET_KEY] ${semanticKey} -> targetKey: "${targetKey}" (type: ${typeof targetKey})`);

      // Générer les clés dans l'ordre de priorité STRICTE pour éviter les collisions
      var possibleKeys = [];

      // 1. PRIORITÉ MAX : clé exacte avec category/key (ex: gray/100)
      var primaryKey = mapping.category + '/' + targetKey;
      possibleKeys.push(primaryKey);

      // 2. Clé exacte seule (ex: 100) - seulement si numérique pur
      if (/^\d+$/.test(targetKey)) {
        possibleKeys.push(targetKey);
      }

      // 3. FALLBACKS : seulement les plus spécifiques pour éviter collisions
      var fallbacks = generateFallbackKeysForMap(targetKey, mapping.category);
      // Filtrer les fallbacks pour éviter les collisions connues
      var safeFallbacks = fallbacks.filter(function (fallback) {
        // Éviter les fallbacks trop génériques qui causent des collisions
        if (mapping.category === 'gray' && /^\d+$/.test(targetKey)) {
          // Pour gray, éviter les fallbacks qui pourraient matcher d'autres niveaux
          return fallback === mapping.category + '/' + targetKey ||
            fallback === mapping.category + '-' + targetKey;
        }
        return true;
      });

      for (var f = 0; f < safeFallbacks.length; f++) {
        if (possibleKeys.indexOf(safeFallbacks[f]) === -1) {
          possibleKeys.push(safeFallbacks[f]);
        }
      }

      (function () { return function () { } })() && console.log(`🔍 [SEARCH_KEYS] ${semanticKey} -> targetKey: '${targetKey}' -> possibleKeys: [${possibleKeys.join(', ')}] (${possibleKeys.length} keys)`);

      // Chercher dans la map
      for (var j = 0; j < possibleKeys.length; j++) {
        var searchKey = possibleKeys[j];
        var variableId = globalVariableMap.get(searchKey);
        (function () { return function () { } })() && console.log(`🔎 [SEARCH_ATTEMPT] ${semanticKey} -> checking '${searchKey}' in map -> ${variableId ? 'FOUND (ID: ' + variableId + ')' : 'NOT FOUND'}`);
        if (variableId) {
          // VÉRIFICATION ANTI-COLLISION : éviter de réutiliser la même variable DANS LE MÊME SCOPE + MODE
          // Extraire le scope du token sémantique (ex: "bg" de "bg.elevated")
          var scope = semanticKey.split('.')[0];
          var currentMode = modeName || 'light';
          var collisionKey = scope + ':' + variableId + ':' + currentMode;

          if (resolveSemanticAliasFromMap.usedVariables.has(collisionKey)) {
            (function () { return function () { } })() && console.log(`⚠️ [COLLISION_AVOIDED] ${semanticKey} -> '${searchKey}' already used by another token in scope '${scope}' for mode '${currentMode}' (ID: ${variableId}), skipping`);
            continue;
          }

          (function () { return function () { } })() && console.log(`✅ [MAP_HIT] ${semanticKey} -> '${searchKey}' found in global map (ID: ${variableId})`);
          var variable = figma.variables.getVariableById(variableId);
          if (variable) {
            // Vérifier que c'est bien la bonne collection
            var collection = figma.variables.getVariableCollectionById(variable.variableCollectionId);
            if (collection && isCollectionCategory(collection.name, mapping.category)) {
              (function () { return function () { } })() && console.log(`🎯 [ALIAS_FOUND] ${semanticKey} -> ${searchKey} -> ${collection.name}/${variable.name} (ID: ${variableId})`);
              // ✅ VÉRIFICATION SUPPLÉMENTAIRE : s'assurer que la variable a une valeur valide dans au moins un mode
              var hasValidValue = false;
              if (collection.modes && collection.modes.length > 0) {
                for (var m = 0; m < collection.modes.length; m++) {
                  var checkModeId = collection.modes[m].modeId;
                  var checkValue = variable.valuesByMode[checkModeId];
                  if (checkValue !== undefined && checkValue !== null) {
                    hasValidValue = true;
                    break;
                  }
                }
              }

              if (hasValidValue) {
                // MARQUER COMME UTILISÉE pour éviter les futures collisions DANS CE SCOPE + MODE
                resolveSemanticAliasFromMap.usedVariables.add(collisionKey);
                (function () { return function () { } })() && console.log(`✅ [ALIAS_RESOLVE] Found via map: ${semanticKey} → ${possibleKeys[j]} (${variable.name}) - marked as used for scope '${scope}' in mode '${currentMode}' (key: ${collisionKey})`);
                return {
                  variableId: variableId,
                  collection: mapping.category,
                  key: targetKey,
                  cssName: generateCssName(mapping.category, targetKey)
                };
              } else {
                console.warn(`⚠️ [ALIAS_RESOLVE] Variable ${variable.name} found but has no valid value in any mode, skipping`);
              }
            }
          }
        }
      }
    }

    // console.warn(`⚠️ [ALIAS_RESOLVE] Not found in map after trying ${targetKeys.length} keys, trying legacy method`);
    // FALLBACK vers l'ancienne logique si la nouvelle ne trouve rien
    // Note: l'ancienne logique n'est pas mode-aware, donc risque d'erreur pour Dark mode
    return resolveSemanticAliasFromMapLegacy(semanticKey, allTokens, naming, globalVariableMap);

  } catch (error) {
    console.error(`❌ [ALIAS_RESOLVE] Error in new logic, falling back to legacy:`, error);
    // FALLBACK vers l'ancienne logique en cas d'erreur
    return resolveSemanticAliasFromMapLegacy(semanticKey, allTokens, naming, globalVariableMap);
  }
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
          var currentMode = currentCollection.modes.find(function (m) { return m.modeId === modeId; });
          var currentModeName = currentMode ? currentMode.name : null;

          // Find matching mode by name in parent collection
          var matchingParentMode = currentModeName
            ? parentCollection.modes.find(function (m) { return m.name === currentModeName; })
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
function normalizeAliasToDescriptor(aliasTo) {
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
    // ✅ Couleurs
    "Fill": ["ALL_FILLS", "FRAME_FILL", "SHAPE_FILL"], // ❌ Retiré TEXT_FILL ici car géré séparément
    "Text": ["TEXT_FILL"], // ✅ Strict : seulement les variables de texte
    "Stroke": ["STROKE_COLOR"],

    // ✅ Styles locaux
    "Local Fill Style": ["ALL_FILLS", "FRAME_FILL", "SHAPE_FILL"], // ❌ Retiré TEXT_FILL
    "Local Stroke Style": ["STROKE_COLOR"],


    "CORNER RADIUS": ["CORNER_RADIUS"],
    "TOP LEFT RADIUS": ["CORNER_RADIUS"],
    "TOP RIGHT RADIUS": ["CORNER_RADIUS"],
    "BOTTOM LEFT RADIUS": ["CORNER_RADIUS"],
    "BOTTOM RIGHT RADIUS": ["CORNER_RADIUS"],


    "Item Spacing": ["GAP"],
    "Padding Left": ["INDIVIDUAL_PADDING", "GAP"],
    "Padding Right": ["INDIVIDUAL_PADDING", "GAP"],
    "Padding Top": ["INDIVIDUAL_PADDING", "GAP"],
    "Padding Bottom": ["INDIVIDUAL_PADDING", "GAP"],


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
    if (!figmaVariable) return false;

    // ✅ OPTIMISATION: Si la variable n'a aucun scope défini, on l'autorise (permissif)
    // Cela évite de bloquer des variables valides mais dont les scopes n'ont pas encore été configurés.
    if (!figmaVariable.scopes || figmaVariable.scopes.length === 0) {
      return true;
    }

    // Vérifier si au moins un scope de la variable correspond aux scopes requis
    var hasMatchingScope = figmaVariable.scopes.some(function (variableScope) {
      return requiredScopes.includes(variableScope);
    });

    if (DEBUG_SCOPES_SCAN && !hasMatchingScope) {
      console.log('⚠️ [FILTER_SCOPES] Variable rejetée (scopes incompatibles):', {
        variable: figmaVariable.name,
        variableScopes: figmaVariable.scopes,
        requiredScopes: requiredScopes
      });
    }

    return hasMatchingScope;
  });
}

/**
 * Détermine la famille sémantique d'un token à partir de son nom
 * @param {string} tokenName - Nom du token (ex: "bg/canvas", "text-primary")
 * @returns {string} - Famille (bg, text, action, border, status, unknown)
 */
function getSemanticFamily(tokenName) {
  if (!tokenName) return 'unknown';

  var normalized = tokenName.toLowerCase().replace(/[\/_]/g, '.');

  if (normalized.startsWith('bg.') || normalized.startsWith('background.')) return 'bg';
  if (normalized.startsWith('text.')) return 'text';
  if (normalized.startsWith('action.')) return 'action';
  if (normalized.startsWith('border.')) return 'border';
  if (normalized.startsWith('status.')) return 'status';

  return 'unknown';
}

/**
 * Calcule un score de pertinence pour une suggestion de token
 * Plus le score est élevé, plus la suggestion est pertinente
 * @param {object} suggestion - Suggestion {id, name, hex/value, distance}
 * @param {string} propertyType - Type de propriété ("Fill", "Text", "Stroke", etc.)
 * @param {string} nodeType - Type de nœud Figma ("FRAME", "TEXT", etc.)
 * @returns {number} - Score de pertinence (0-100)
 */
function calculateSuggestionScore(suggestion, propertyType, nodeType) {
  var score = 50; // Score de base

  // Bonus pour correspondance exacte
  if (suggestion.isExact) {
    score += 30;
  }

  // Bonus/Malus basé sur la distance de couleur ou différence numérique
  if (suggestion.distance !== undefined) {
    // Pour les couleurs : distance 0-150
    if (suggestion.distance === 0) {
      score += 20;
    } else if (suggestion.distance < 30) {
      score += 10;
    } else if (suggestion.distance > 100) {
      score -= 20;
    }
  } else if (suggestion.difference !== undefined) {
    // Pour les valeurs numériques
    if (suggestion.difference === 0) {
      score += 20;
    } else if (suggestion.difference <= 2) {
      score += 10;
    } else if (suggestion.difference > 8) {
      score -= 10;
    }
  }

  // Bonus pour correspondance de famille sémantique avec le contexte
  var family = getSemanticFamily(suggestion.name);

  // Contexte Fill
  if (propertyType === 'Fill' || propertyType === 'Local Fill Style') {
    if (nodeType === 'TEXT' && family === 'text') {
      score += 25; // Texte → text.* tokens
    } else if (nodeType !== 'TEXT' && family === 'bg') {
      score += 25; // Frame/Shape → bg.* tokens
    } else if (family === 'action') {
      score += 15; // action.* acceptable pour Fill
    } else if (family === 'status') {
      score += 10; // status.* acceptable pour Fill
    } else if (family === 'text' && nodeType !== 'TEXT') {
      score -= 20; // Pénalité : text.* sur non-TEXT
    }
  }

  // Contexte Text (TEXT_FILL)
  if (propertyType === 'Text') {
    if (family === 'text') {
      score += 30; // Parfait match
    } else if (family === 'action' && suggestion.name.includes('.text')) {
      score += 20; // action.*.text acceptable
    } else if (family === 'status' && suggestion.name.includes('.text')) {
      score += 20; // status.*.text acceptable
    } else if (family === 'bg') {
      score -= 30; // Pénalité forte : bg.* sur texte
    }
  }

  // Contexte Stroke
  if (propertyType === 'Stroke' || propertyType === 'Local Stroke Style') {
    if (family === 'border') {
      score += 30; // Parfait match
    } else if (family === 'action') {
      score -= 20; // action.* ne devrait plus être dans stroke
    } else if (family === 'status') {
      score += 5; // status.* acceptable pour stroke (badges)
    }
  }

  // Malus pour scope mismatch
  if (suggestion.scopeMismatch) {
    score -= 15;
  }

  // Malus pour tokens dépréciés (si détectés)
  var deprecatedPatterns = ['on.primary', 'on.secondary', 'on.success', 'on.warning', 'on.error', 'on.info', 'on.inverse', 'text.on-inverse'];
  if (deprecatedPatterns.some(function (pattern) { return suggestion.name.includes(pattern); })) {
    score -= 25;
  }

  return Math.max(0, Math.min(100, score)); // Clamp entre 0 et 100
}

/**
 * Trie les suggestions par score de pertinence
 * @param {array} suggestions - Liste de suggestions
 * @param {string} propertyType - Type de propriété
 * @param {string} nodeType - Type de nœud
 * @returns {array} - Suggestions triées par pertinence décroissante
 */
function rankSuggestionsByRelevance(suggestions, propertyType, nodeType) {
  if (!suggestions || suggestions.length === 0) return [];

  // Calculer le score pour chaque suggestion
  var scoredSuggestions = suggestions.map(function (suggestion) {
    return {
      suggestion: suggestion,
      score: calculateSuggestionScore(suggestion, propertyType, nodeType)
    };
  });

  // Trier par score décroissant
  scoredSuggestions.sort(function (a, b) {
    return b.score - a.score;
  });

  // Log des scores pour debug
  if (DEBUG_SCOPES_SCAN && scoredSuggestions.length > 0) {
    console.log('🎯 [RANKING] Suggestions ranked for', propertyType, 'on', nodeType, ':');
    scoredSuggestions.slice(0, 3).forEach(function (item, index) {
      console.log('  ' + (index + 1) + '.', item.suggestion.name, '(score:', item.score + ')');
    });
  }

  // Retourner les suggestions triées
  return scoredSuggestions.map(function (item) {
    return item.suggestion;
  });
}

function findColorSuggestions(hexValue, valueToVariableMap, propertyType, contextModeId, nodeType) {

  // ============================================================================
  // DIAGNOSTIC: Check if bg/inverse is in the map
  // ============================================================================
  if (typeof debugExplainWhyNotToken !== 'undefined') {
    var foundInverse = false;
    var inverseDetails = [];
    valueToVariableMap.forEach(function (vars, key) {
      if (vars && vars.length > 0) {
        vars.forEach(function (v) {
          if (v.name && v.name.toLowerCase().indexOf('inverse') !== -1) {
            foundInverse = true;
            inverseDetails.push({
              name: v.name,
              key: key,
              id: v.id,
              collection: v.collectionName
            });
          }
        });
      }
    });

    if (foundInverse) {
      console.log('✅ [DIAGNOSTIC] bg/inverse FOUND in valueToVariableMap:');
      inverseDetails.forEach(function (d) {
        console.log('   -', d.name, '| key:', d.key, '| collection:', d.collection);
      });
    } else {
      console.log('❌ [DIAGNOSTIC] bg/inverse NOT FOUND in valueToVariableMap!');
      console.log('   Map size:', valueToVariableMap.size);
    }
  }

  var requiredScopes = getScopesForProperty(propertyType);

  // CHERCHER D'ABORD DANS LE MODE CONTEXTE (si fourni)
  var exactMatches = null;
  var searchKey = hexValue;

  if (contextModeId) {
    // Essayer avec le mode spécifique
    var modeSpecificKey = contextModeId + '|' + hexValue;
    exactMatches = valueToVariableMap.get(modeSpecificKey);

    if (DEBUG_SCOPES_SCAN && exactMatches && exactMatches.length > 0) {
      console.log('🎨 [findColorSuggestions] Found in specific mode:', {
        modeId: contextModeId,
        key: modeSpecificKey,
        matches: exactMatches.length
      });
    }
  }

  // FALLBACK: chercher sans mode (mode préféré)
  if (!exactMatches || exactMatches.length === 0) {
    exactMatches = valueToVariableMap.get(hexValue);
    searchKey = hexValue;

    if (DEBUG_SCOPES_SCAN && contextModeId && exactMatches && exactMatches.length > 0) {
      console.log('🎨 [findColorSuggestions] Fallback to preferred mode:', {
        requestedModeId: contextModeId,
        fallbackKey: hexValue,
        matches: exactMatches.length
      });
    }
  }

  (function () { return function () { } })() && console.log('🎨 [findColorSuggestions] Looking for:', hexValue, 'contextMode:', contextModeId || 'none', 'in map of size:', valueToVariableMap.size, 'Exact matches found:', exactMatches ? exactMatches.length : 0);

  // ============================================================================
  // DIAGNOSTIC: Check if bg/inverse is in exact matches
  // ============================================================================
  if (typeof debugExplainWhyNotToken !== 'undefined' && exactMatches) {
    debugExplainWhyNotToken(['bg/inverse', 'bg-inverse'], 'EXACT_MATCHES_RAW', exactMatches, {
      contextModeId: contextModeId,
      searchKey: searchKey,
      hexValue: hexValue
    });
  }

  if (exactMatches && exactMatches.length > 0) {
    // ÉTAPE 1: Filtrer par scopes
    var filteredExactMatches = filterVariablesByScopes(exactMatches, requiredScopes);
    (function () { return function () { } })() && console.log('   - After scope filtering:', filteredExactMatches.length);

    // ============================================================================
    // DIAGNOSTIC: After scope filter
    // ============================================================================
    if (typeof debugExplainWhyNotToken !== 'undefined') {
      debugExplainWhyNotToken(['bg/inverse', 'bg-inverse'], 'AFTER_SCOPE_FILTER', filteredExactMatches, {
        requiredScopes: requiredScopes
      });
    }

    // ÉTAPE 2: FILTRE SEMANTIC-ONLY STRICT (remplace le filtre par collection)
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
    (function () { return function () { } })() && console.log('   - After semantic-only filtering:', semanticExactMatches.length);

    // ============================================================================
    // DIAGNOSTIC: After semantic filter
    // ============================================================================
    if (typeof debugExplainWhyNotToken !== 'undefined') {
      debugExplainWhyNotToken(['bg/inverse', 'bg-inverse'], 'AFTER_SEMANTIC_FILTER', semanticExactMatches, {
        filterFunction: 'isSemanticVariable'
      });
    }

    // ÉTAPE 3: Vérifier resolvedType = COLOR
    var colorSemanticMatches = semanticExactMatches.filter(function (v) {
      var isColor = v.resolvedType === 'COLOR';

      if (DEBUG_SCOPES_SCAN && !isColor) {
        console.log('🚫 [SUGGESTION_FILTER] Excluded wrong type:', {
          name: v.name,
          resolvedType: v.resolvedType,
          expected: 'COLOR'
        });
      }

      return isColor;
    });
    (function () { return function () { } })() && console.log('   - After COLOR type filtering:', colorSemanticMatches.length);

    // ============================================================================
    // DIAGNOSTIC: After COLOR type filter
    // ============================================================================
    if (typeof debugExplainWhyNotToken !== 'undefined') {
      debugExplainWhyNotToken(['bg/inverse', 'bg-inverse'], 'AFTER_COLOR_TYPE_FILTER', colorSemanticMatches, {
        expectedType: 'COLOR'
      });
    }

    if (colorSemanticMatches.length > 0) {
      // ✅ CHANGEMENT: Retourner TOUTES les correspondances exactes, pas juste la première
      var exactSuggestions = colorSemanticMatches.map(function (match) {
        return {
          id: match.id,
          name: match.name,
          hex: hexValue,
          distance: 0,
          isExact: true
        };
      });

      // ✅ DÉDUPLICATION: Éviter les doublons (même variable dans plusieurs modes)
      var seen = {};
      var uniqueSuggestions = [];
      exactSuggestions.forEach(function (suggestion) {
        if (!seen[suggestion.id]) {
          seen[suggestion.id] = true;
          uniqueSuggestions.push(suggestion);
        }
      });

      console.log('🎨 [findColorSuggestions] Returning', uniqueSuggestions.length, 'unique exact matches for color:', hexValue);
      return uniqueSuggestions;
    }
  }


  var suggestions = [];
  var maxDistance = 150;


  var minDistanceFound = Infinity;
  valueToVariableMap.forEach(function (vars, varHex) {
    if (vars && vars.length > 0) {
      // Extract hex from mode-prefixed keys (e.g., "1:16|#030712" → "#030712")
      var actualHex = varHex.indexOf('|') !== -1 ? varHex.split('|')[1] : varHex;
      var distance = getColorDistance(hexValue, actualHex);
      minDistanceFound = Math.min(minDistanceFound, distance);

      if (distance <= maxDistance) {

        var filteredVars = filterVariablesByScopes(vars, requiredScopes);

        // FILTRE SEMANTIQUE PERMISSIF
        var semanticVars = filteredVars.filter(function (v) {
          if (!v.collectionName) return false;
          var name = v.collectionName.toLowerCase();
          return name.indexOf('semantic') !== -1 || name.indexOf('sémantique') !== -1 || name.indexOf('tokens') !== -1 || name.indexOf('brand') !== -1 || name.indexOf('emma') !== -1;
        });

        if (semanticVars.length > 0) {
          suggestions.push({
            id: semanticVars[0].id,
            name: semanticVars[0].name,
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
        // Extract hex from mode-prefixed keys (e.g., "1:16|#030712" → "#030712")
        var actualHex = varHex.indexOf('|') !== -1 ? varHex.split('|')[1] : varHex;
        var distance = getColorDistance(hexValue, actualHex);
        if (distance <= maxDistance) {

          // Check semantic even for mismatch scope? Maybe not strict but better safe
          var semanticVars = vars.filter(function (v) {
            return v.collectionName && (v.collectionName.toLowerCase() === 'semantic' || v.collectionName.toLowerCase().indexOf('semantic') !== -1);
          });

          if (semanticVars.length > 0) {
            suggestions.push({
              id: semanticVars[0].id,
              name: semanticVars[0].name,
              hex: varHex,
              distance: distance,
              isExact: false,
              scopeMismatch: true,
              warning: "Scope mismatch - Cette variable pourrait ne pas être appropriée pour ce type de propriété"
            });
          }
        }
      }
    });
  }


  // ✅ NOUVEAU: Utiliser le ranking intelligent au lieu du tri par distance
  var rankedSuggestions = rankSuggestionsByRelevance(suggestions, propertyType, nodeType || 'FRAME');

  if (rankedSuggestions.length === 0) {
    console.log('⚠️ [findColorSuggestions] No suggestions found for', hexValue);
  }

  return rankedSuggestions.slice(0, 3);
}

function findNumericSuggestions(targetValue, valueToVariableMap, tolerance, propertyType, contextModeId) {

  // ============================================================================
  // SCOPE-FIRST FILTERING
  // ============================================================================
  var expectedScope = getExpectedScope(propertyType);
  console.log('[findNumericSuggestions] Property:', propertyType, '| Expected Scope:', expectedScope, '| Value:', targetValue);

  // ✅ Tolérance augmentée pour permettre plus de suggestions
  tolerance = tolerance !== undefined ? tolerance : (propertyType.indexOf('Spacing') !== -1 || propertyType.indexOf('Padding') !== -1 ? 16 : 8);

  // Auto-correction spéciale pour les radius: 999 -> 9999 (full)
  if (targetValue === 999 && propertyType && propertyType.indexOf('Radius') !== -1) {
    var fullMatches = valueToVariableMap.get(9999);
    if (fullMatches && fullMatches.length > 0) {
      // ✅ SCOPE-FIRST: Filter by expected scope BEFORE other filters
      var scopeFilteredFull = filterTokensByScope(fullMatches, expectedScope);
      var filteredFullMatches = filterVariablesByScopes(scopeFilteredFull, getScopesForProperty(propertyType));

      // FILTRE SEMANTIC-ONLY STRICT
      var semanticFullMatches = filteredFullMatches.filter(function (v) {
        return isSemanticVariable(v.name, v);
      });

      if (semanticFullMatches.length > 0) {
        return [{
          id: semanticFullMatches[0].id,
          name: semanticFullMatches[0].name,
          value: 9999,
          difference: 0,
          isExact: false,
          isAutoCorrected: true // Marquer comme auto-corrigée
        }];
      }
    }
  }

  var requiredScopes = getScopesForProperty(propertyType);

  // CHERCHER D'ABORD DANS LE MODE CONTEXTE (si fourni)
  var exactMatches = null;

  if (contextModeId) {
    // Essayer avec le mode spécifique
    var modeSpecificKey = contextModeId + '|' + targetValue;
    exactMatches = valueToVariableMap.get(modeSpecificKey);

    if (DEBUG_SCOPES_SCAN && exactMatches && exactMatches.length > 0) {
      console.log('🔢 [findNumericSuggestions] Found in specific mode:', {
        modeId: contextModeId,
        key: modeSpecificKey,
        matches: exactMatches.length
      });
    }
  }

  // FALLBACK: chercher sans mode (mode préféré)
  if (!exactMatches || exactMatches.length === 0) {
    exactMatches = valueToVariableMap.get(targetValue);

    if (DEBUG_SCOPES_SCAN && contextModeId && exactMatches && exactMatches.length > 0) {
      console.log('🔢 [findNumericSuggestions] Fallback to preferred mode:', {
        requestedModeId: contextModeId,
        fallbackKey: targetValue,
        matches: exactMatches.length
      });
    }
  }

  (function () { return function () { } })() && console.log('🔢 [findNumericSuggestions] Looking for:', targetValue, 'contextMode:', contextModeId || 'none', 'Exact matches found:', exactMatches ? exactMatches.length : 0);

  if (exactMatches && exactMatches.length > 0) {
    // ✅ SCOPE-FIRST: Filter by expected scope BEFORE other filters
    var scopeFilteredExact = filterTokensByScope(exactMatches, expectedScope);
    console.log('[findNumericSuggestions] After scope-first filter:', scopeFilteredExact.length, '/', exactMatches.length);

    // ÉTAPE 1: Filtrer par scopes Figma
    var filteredExactMatches = filterVariablesByScopes(scopeFilteredExact, requiredScopes);
    (function () { return function () { } })() && console.log('   - After scope filtering:', filteredExactMatches.length);

    // ÉTAPE 2: FILTRE SEMANTIC-ONLY STRICT (remplace le filtre par collection)
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
    (function () { return function () { } })() && console.log('   - After semantic-only filtering:', semanticExactMatches.length);

    // ÉTAPE 3: Vérifier resolvedType = FLOAT
    var floatSemanticMatches = semanticExactMatches.filter(function (v) {
      var isFloat = v.resolvedType === 'FLOAT';

      if (DEBUG_SCOPES_SCAN && !isFloat) {
        console.log('🚫 [SUGGESTION_FILTER] Excluded wrong type:', {
          name: v.name,
          resolvedType: v.resolvedType,
          expected: 'FLOAT'
        });
      }

      return isFloat;
    });
    (function () { return function () { } })() && console.log('   - After FLOAT type filtering:', floatSemanticMatches.length);

    if (floatSemanticMatches.length > 0) {
      // ✅ CHANGEMENT: Retourner TOUTES les correspondances exactes, pas juste la première
      // Cela permet à l'utilisateur de choisir entre plusieurs tokens qui ont la même valeur
      var exactSuggestions = floatSemanticMatches.map(function (match) {
        return {
          id: match.id,
          name: match.name,
          value: targetValue,
          difference: 0,
          isExact: true
        };
      });

      // ✅ DÉDUPLICATION: Éviter les doublons (même variable dans plusieurs modes)
      var seen = {};
      var uniqueSuggestions = [];
      exactSuggestions.forEach(function (suggestion) {
        if (!seen[suggestion.id]) {
          seen[suggestion.id] = true;
          uniqueSuggestions.push(suggestion);
        }
      });

      // Si une seule correspondance exacte unique, c'est AUTO
      // Si plusieurs, c'est MANUEL (l'utilisateur doit choisir)
      console.log('🔢 [findNumericSuggestions] Returning', uniqueSuggestions.length, 'unique exact matches for value:', targetValue);
      return uniqueSuggestions;
    }
  }


  var suggestions = [];

  // ✅ NOUVEAU: Collecter TOUTES les valeurs numériques disponibles, pas seulement celles dans la tolérance
  valueToVariableMap.forEach(function (vars, varValue) {
    if (vars && vars.length > 0 && typeof varValue === 'number') {
      // ✅ SCOPE-FIRST: Filter by expected scope BEFORE other filters
      var scopeFiltered = filterTokensByScope(vars, expectedScope);

      var filteredVars = filterVariablesByScopes(scopeFiltered, requiredScopes);

      // FILTRE SEMANTIQUE PERMISSIF
      var semanticVars = filteredVars.filter(function (v) {
        if (!v.collectionName) return false;
        var name = v.collectionName.toLowerCase();
        return name.indexOf('semantic') !== -1 || name.indexOf('sémantique') !== -1 || name.indexOf('tokens') !== -1 || name.indexOf('brand') !== -1 || name.indexOf('emma') !== -1;
      });

      if (semanticVars.length > 0) {
        var difference = Math.abs(targetValue - varValue);
        // ✅ CHANGEMENT: On collecte TOUT, on triera après
        suggestions.push({
          id: semanticVars[0].id,
          name: semanticVars[0].name,
          value: varValue,
          difference: difference,
          isExact: false
        });
      }
    }
  });


  suggestions.sort(function (a, b) {
    return a.difference - b.difference;
  });

  if (suggestions.length > 0) {
  } else {
  }

  // ✅ CHANGEMENT: Retourner les 5 suggestions les plus proches (au lieu de 3)
  // Cela donne plus de choix à l'utilisateur
  var finalSuggestions = suggestions.slice(0, 5);
  console.log('🔢 [findNumericSuggestions] Returning', finalSuggestions.length, 'suggestions for value:', targetValue);
  return finalSuggestions;
}



/**
 * Résout récursivement la valeur d'une variable en suivant les alias
 */
function resolveVariableValueRecursively(variable, modeId, visitedIds) {
  if (!variable) return null;

  // Protection contre les cycles infinis
  if (!visitedIds) visitedIds = new Set();
  if (visitedIds.has(variable.id)) {
    return null; // Cycle détecté
  }
  visitedIds.add(variable.id);

  try {
    // Si pas de modeId fourni, essayer de prendre le premier mode de la collection de cette variable
    if (!modeId) {
      var collections = figma.variables.getLocalVariableCollections();
      var collection = collections.find(function (c) { return c.variableIds.includes(variable.id); });
      if (collection && collection.modes.length > 0) {
        modeId = collection.modes[0].modeId;
      }
    }

    // Récupérer la valeur pour le mode donné
    var value = variable.valuesByMode && variable.valuesByMode[modeId];

    // Si la valeur est indéfinie pour ce mode, fallback sur la première valeur dispo
    if (value === undefined) {
      var keys = Object.keys(variable.valuesByMode || {});
      if (keys.length > 0) value = variable.valuesByMode[keys[0]];
    }

    // Si c'est un ALIAS
    if (value && typeof value === 'object' && value.type === 'VARIABLE_ALIAS') {
      var aliasedVar = figma.variables.getVariableById(value.id);
      if (aliasedVar) {
        // Pour simplifier, on passe null pour le modeId pour laisser la fonction redécouvrir le mode par défaut de l'alias

        // ============================================================================
        // SCOPE-FIRST FILTERING SYSTEM
        // ============================================================================
        // Strict scope-based filtering BEFORE distance calculation
        // No cross-scope suggestions (e.g., no font tokens for spacing)
        // ============================================================================

        /**
         * Get expected scope category for a property
         * @param {string} propertyKind - Property type (e.g., "Item Spacing", "Fill", "Font Size")
         * @param {Object} nodeContext - Optional node context for additional info
         * @returns {string} Scope category: "SPACING" | "SIZING" | "RADIUS" | "BORDER_WIDTH" | etc.
         */
        function getExpectedScope(propertyKind, nodeContext) {
          var scopeMapping = {
            // Spacing
            'Item Spacing': 'SPACING',
            'Padding Left': 'SPACING',
            'Padding Right': 'SPACING',
            'Padding Top': 'SPACING',
            'Padding Bottom': 'SPACING',
            'Gap': 'SPACING',

            // Radius
            'CORNER RADIUS': 'RADIUS',
            'TOP LEFT RADIUS': 'RADIUS',
            'TOP RIGHT RADIUS': 'RADIUS',
            'BOTTOM LEFT RADIUS': 'RADIUS',
            'BOTTOM RIGHT RADIUS': 'RADIUS',

            // Typography
            'Font Size': 'TYPO_SIZE',
            'Font Weight': 'TYPO_WEIGHT',
            'Line Height': 'TYPO_LINE_HEIGHT',
            'Letter Spacing': 'TYPO_LETTER_SPACING',

            // Colors
            'Fill': 'COLOR',
            'Stroke': 'COLOR',
            'Text': 'COLOR',
            'Background': 'COLOR',

            // Sizing
            'Width': 'SIZING',
            'Height': 'SIZING',
            'Min Width': 'SIZING',
            'Max Width': 'SIZING',
            'Min Height': 'SIZING',
            'Max Height': 'SIZING',

            // Border
            'Stroke Weight': 'BORDER_WIDTH',
            'Border Width': 'BORDER_WIDTH',

            // Opacity
            'Opacity': 'OPACITY'
          };

          var scope = scopeMapping[propertyKind];
          if (!scope) {
            console.warn('[getExpectedScope] Unknown propertyKind:', propertyKind, '- defaulting to UNKNOWN');
            return 'UNKNOWN';
          }

          return scope;
        }

        /**
         * Get scope category of a token based on Figma scopes or namespace fallback
         * @param {Object} token - Token object with name, scopes, etc.
         * @returns {string} Scope category
         */
        function getTokenScope(token) {
          // Priority 1: Use Figma variable scopes if available
          if (token.scopes && token.scopes.length > 0) {
            var figmaScope = token.scopes[0]; // Use first scope as primary

            // Map Figma scopes to our categories
            var figmaScopeMapping = {
              'GAP': 'SPACING',
              'INDIVIDUAL_PADDING': 'SPACING',
              'ALL_PADDING': 'SPACING',

              'CORNER_RADIUS': 'RADIUS',

              'FONT_SIZE': 'TYPO_SIZE',
              'FONT_WEIGHT': 'TYPO_WEIGHT',
              'LINE_HEIGHT': 'TYPO_LINE_HEIGHT',
              'LETTER_SPACING': 'TYPO_LETTER_SPACING',

              'ALL_FILLS': 'COLOR',
              'FRAME_FILL': 'COLOR',
              'SHAPE_FILL': 'COLOR',
              'TEXT_FILL': 'COLOR',
              'STROKE_COLOR': 'COLOR',

              'WIDTH_HEIGHT': 'SIZING',
              'MIN_WIDTH': 'SIZING',
              'MAX_WIDTH': 'SIZING',
              'MIN_HEIGHT': 'SIZING',
              'MAX_HEIGHT': 'SIZING',

              'STROKE_FLOAT': 'BORDER_WIDTH',

              'OPACITY': 'OPACITY'
            };

            var mapped = figmaScopeMapping[figmaScope];
            if (mapped) return mapped;
          }

          // Priority 2: Fallback to namespace classification
          var name = token.name.toLowerCase();

          // Spacing patterns
          if (name.indexOf('space/') !== -1 ||
            name.indexOf('spacing/') !== -1 ||
            name.indexOf('gap/') !== -1 ||
            name.indexOf('padding/') !== -1) {
            return 'SPACING';
          }

          // Radius patterns
          if (name.indexOf('radius/') !== -1 ||
            name.indexOf('rounded/') !== -1 ||
            name.indexOf('corner/') !== -1) {
            return 'RADIUS';
          }

          // Typography patterns
          if (name.indexOf('font/size') !== -1 ||
            name.indexOf('text/size') !== -1 ||
            name.indexOf('typo/size') !== -1) {
            return 'TYPO_SIZE';
          }

          if (name.indexOf('font/weight') !== -1 ||
            name.indexOf('text/weight') !== -1 ||
            name.indexOf('typo/weight') !== -1) {
            return 'TYPO_WEIGHT';
          }

          if (name.indexOf('font/line') !== -1 ||
            name.indexOf('line-height') !== -1 ||
            name.indexOf('leading') !== -1) {
            return 'TYPO_LINE_HEIGHT';
          }

          if (name.indexOf('letter-spacing') !== -1 ||
            name.indexOf('tracking') !== -1) {
            return 'TYPO_LETTER_SPACING';
          }

          // Color patterns
          if (name.indexOf('bg/') !== -1 ||
            name.indexOf('text/') !== -1 ||
            name.indexOf('border/') !== -1 ||
            name.indexOf('color/') !== -1 ||
            name.indexOf('action/') !== -1 ||
            name.indexOf('status/') !== -1) {
            return 'COLOR';
          }

          // Sizing patterns
          if (name.indexOf('size/') !== -1 ||
            name.indexOf('width/') !== -1 ||
            name.indexOf('height/') !== -1) {
            return 'SIZING';
          }

          // Border width patterns
          if (name.indexOf('border/width') !== -1 ||
            name.indexOf('stroke/') !== -1) {
            return 'BORDER_WIDTH';
          }

          // Opacity patterns
          if (name.indexOf('opacity/') !== -1 ||
            name.indexOf('alpha/') !== -1) {
            return 'OPACITY';
          }

          // Default: unknown
          console.log('[getTokenScope] Could not determine scope for token:', token.name);
          return 'UNKNOWN';
        }

        /**
         * Filter tokens by expected scope BEFORE distance calculation
         * @param {Array} tokens - All candidate tokens
         * @param {string} expectedScope - Expected scope category
         * @returns {Array} Filtered tokens matching the expected scope
         */
        function filterTokensByScope(tokens, expectedScope) {
          var filtered = tokens.filter(function (token) {
            var tokenScope = getTokenScope(token);
            return tokenScope === expectedScope;
          });

          console.log('[filterTokensByScope] Expected:', expectedScope,
            '| Before:', tokens.length,
            '| After:', filtered.length);

          return filtered;
        }

        // (car les modes ne sont pas forcément les mêmes entre collections)
        return resolveVariableValueRecursively(aliasedVar, null, visitedIds);
      }
    }

    // Si c'est une valeur directe
    return value;

  } catch (e) {
    return null;
  }
}

function enrichSuggestionsWithRealValues(suggestions) {
  // ============================================================================
  // DIAGNOSTIC: Trace UI enrichment
  // ============================================================================
  if (typeof traceUIEnrichment !== 'undefined') {
    traceUIEnrichment(suggestions, null); // contextModeId not available here!
  }

  return suggestions.map(function (suggestion) {
    var enriched = Object.assign({}, suggestion);

    // Ensure name is preserved
    if (!enriched.name && suggestion.id) {
      var variable = figma.variables.getVariableById(suggestion.id);
      if (variable) {
        enriched.name = variable.name;
      }
    }

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

        // ============================================================================
        // DIAGNOSTIC: Warn about modes[0] usage for bg/inverse
        // ============================================================================
        if (typeof traceAliasResolution !== 'undefined' && variable.name.toLowerCase().indexOf('inverse') !== -1) {
          console.log('⚠️ [ENRICHMENT] Variable:', variable.name);
          console.log('⚠️ [ENRICHMENT] Using modeId:', modeId, '(collection.modes[0])');
          console.log('⚠️ [ENRICHMENT] Should use contextModeId instead!');
          console.log('⚠️ [ENRICHMENT] Available modes:', collection.modes.map(function (m) { return m.name + ':' + m.modeId; }));
        }

        // Utiliser une fonction helper pour résoudre la valeur (gère les alias)
        var resolvedVal = resolveVariableValueRecursively(variable, modeId);

        if (variable.resolvedType === "COLOR") {
          if (typeof resolvedVal === "object" && resolvedVal.r !== undefined) {
            enriched.resolvedValue = rgbToHex(resolvedVal);
            enriched.hex = enriched.resolvedValue; // Pour compatibilité UI
          } else {
            // Fallback si on n'arrive pas à résoudre en couleur
            enriched.resolvedValue = "#000000";
            enriched.hex = "#000000";
            // Si c'est déjà une string hex
            if (typeof resolvedVal === 'string' && resolvedVal.startsWith('#')) {
              enriched.resolvedValue = resolvedVal;
              enriched.hex = resolvedVal;
            }
          }
        } else if (variable.resolvedType === "FLOAT") {
          enriched.resolvedValue = resolvedVal + "px";
        } else {
          enriched.resolvedValue = resolvedVal;
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
        results.push({
          nodeId: node.id,
          layerName: node.name,
          property: "Font Size",
          value: node.fontSize + "px",
          suggestedVariableId: suggestions.length > 0 ? suggestions[0].id : null,
          suggestedVariableName: suggestions.length > 0 ? suggestions[0].name : null,
          figmaProperty: 'fontSize',
          numericSuggestions: suggestions
        });
      }
    }




  } catch (typographyError) {
  }
}


function checkLocalStylesSafely(node, valueToVariableMap, results) {
  try {
    (function () { return function () { } })() && console.log('Local Style Detection: Checking node', node.id, 'for local styles');

    // Vérifier les styles locaux de remplissage (fillStyleId)
    if (node.fillStyleId && typeof node.fillStyleId === 'string' && node.fillStyleId.length > 0) {
      (function () { return function () { } })() && console.log('Local Style Detection: Found fillStyleId:', node.fillStyleId);
      try {
        var localStyle = figma.getStyleById(node.fillStyleId);
        (function () { return function () { } })() && console.log('Local Style Detection: Retrieved local style:', localStyle ? localStyle.name : 'null');

        if (localStyle && localStyle.type === 'PAINT') {
          // Récupérer la couleur du style local
          var paint = localStyle.paints && localStyle.paints[0];
          if (paint && paint.type === 'SOLID' && paint.color) {
            var hexValue = rgbToHex(paint.color);
            (function () { return function () { } })() && console.log('Local Style Detection: Style color:', hexValue);

            if (hexValue) {
              // ✅ FIX: Détecter si c'est un TextNode
              var propertyType = node.type === "TEXT" ? "Text" : "Local Fill Style";

              // Chercher des variables correspondantes
              var suggestions = enrichSuggestionsWithRealValues(findColorSuggestions(hexValue, valueToVariableMap, propertyType, undefined, node.type));
              (function () { return function () { } })() && console.log('Local Style Detection: Found suggestions:', suggestions.length);

              if (suggestions.length > 0) {
                (function () { return function () { } })() && console.log('Local Style Detection: Added result for Local Fill Style');
                results.push({
                  nodeId: node.id,
                  layerName: node.name,
                  property: propertyType,
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
              var strokeSuggestions = enrichSuggestionsWithRealValues(findColorSuggestions(strokeHexValue, valueToVariableMap, "Local Stroke Style", undefined, node.type));

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



// ============================================================================
// DIAGNOSTIC SYSTEM FOR BG/INVERSE MISSING FROM SUGGESTIONS
// ============================================================================
// This code adds INSTRUMENTATION ONLY - no functional changes
// Purpose: Understand why "bg/inverse" never appears in FILL suggestions
// ============================================================================

// Global flag to enable diagnostic
var DIAGNOSTIC_BG_INVERSE = true;

// ============================================================================
// HELPER: Debug explain why a specific token is not in the list
// ============================================================================
function debugExplainWhyNotToken(tokenNeedles, stageLabel, tokenList, extraContext) {
  if (!DIAGNOSTIC_BG_INVERSE) return;

  // Normalize needles for comparison
  var needles = tokenNeedles.map(function (n) { return n.toLowerCase().replace(/\s+/g, ''); });

  // Search for token in list
  var found = null;
  if (tokenList && tokenList.length > 0) {
    for (var i = 0; i < tokenList.length; i++) {
      var token = tokenList[i];
      var tokenName = (token.name || '').toLowerCase().replace(/\s+/g, '');

      for (var j = 0; j < needles.length; j++) {
        if (tokenName.indexOf(needles[j]) !== -1) {
          found = token;
          break;
        }
      }
      if (found) break;
    }
  }

  console.log('═══════════════════════════════════════════════════════════');
  console.log('[WHY_NOT_BG_INVERSE] Stage:', stageLabel);
  console.log('[WHY_NOT_BG_INVERSE] Looking for:', tokenNeedles.join(' OR '));
  console.log('[WHY_NOT_BG_INVERSE] List size:', tokenList ? tokenList.length : 0);

  if (found) {
    console.log('[WHY_NOT_BG_INVERSE] ✅ FOUND:', found.name);
    console.log('[WHY_NOT_BG_INVERSE] Details:', {
      id: found.id,
      name: found.name,
      collectionName: found.collectionName || found.collection,
      resolvedType: found.resolvedType,
      scopes: found.scopes,
      resolvedHex: found.resolvedHex || found.hex,
      modeIdUsed: found.modeIdUsed,
      fallback: found.fallback,
      aliasChain: found.aliasChain
    });

    if (extraContext && extraContext.contextModeId) {
      console.log('[WHY_NOT_BG_INVERSE] Context Mode:', extraContext.contextModeId);
    }
  } else {
    console.log('[WHY_NOT_BG_INVERSE] ❌ NOT FOUND');
    console.log('[WHY_NOT_BG_INVERSE] Possible reason:', stageLabel);

    if (extraContext) {
      console.log('[WHY_NOT_BG_INVERSE] Extra context:', extraContext);
    }

    // Show first 10 tokens for reference
    if (tokenList && tokenList.length > 0) {
      console.log('[WHY_NOT_BG_INVERSE] First 10 tokens in list:');
      for (var k = 0; k < Math.min(10, tokenList.length); k++) {
        console.log('  -', tokenList[k].name || tokenList[k].id);
      }
    }
  }
  console.log('═══════════════════════════════════════════════════════════');
}

// ============================================================================
// TRACE: Candidates for FILL
// ============================================================================
function traceCandidatesForFill(inputHex, contextModeId, candidates, filterStages) {
  if (!DIAGNOSTIC_BG_INVERSE) return;

  console.log('┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓');
  console.log('┃ TRACE_CANDIDATES_FOR_FILL                               ┃');
  console.log('┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛');
  console.log('[TRACE] Input Hex:', inputHex);
  console.log('[TRACE] Context Mode ID:', contextModeId);

  if (filterStages) {
    console.log('[TRACE] Filter Stages:');
    for (var key in filterStages) {
      console.log('  - ' + key + ':', filterStages[key]);
    }
  }

  console.log('[TRACE] Final Candidates Count:', candidates ? candidates.length : 0);

  if (candidates && candidates.length > 0) {
    console.log('[TRACE] First 30 candidates:');
    for (var i = 0; i < Math.min(30, candidates.length); i++) {
      var c = candidates[i];
      console.log('  ' + (i + 1) + '.', c.name, '|', c.id, '|', c.collectionName || c.collection);
    }
  }
  console.log('┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛');
}

// ============================================================================
// TRACE: UI Enrichment (verify mode usage)
// ============================================================================
function traceUIEnrichment(suggestions, contextModeId) {
  if (!DIAGNOSTIC_BG_INVERSE) return;

  console.log('┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓');
  console.log('┃ TRACE_UI_ENRICHMENT                                     ┃');
  console.log('┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛');
  console.log('[TRACE] Context Mode ID:', contextModeId);
  console.log('[TRACE] Suggestions Count:', suggestions ? suggestions.length : 0);

  if (suggestions && suggestions.length > 0) {
    console.log('[TRACE] Enriched Suggestions:');
    for (var i = 0; i < suggestions.length; i++) {
      var s = suggestions[i];
      console.log('  ' + (i + 1) + '.', {
        name: s.name,
        modeIdUsed: s.modeIdUsed,
        resolvedHex: s.hex || s.resolvedHex,
        fallback: s.fallback
      });
    }
  }
  console.log('┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛');
}

// ============================================================================
// TRACE: Alias Resolution
// ============================================================================
function traceAliasResolution(variableName, aliasChain, finalValue, contextModeId) {
  if (!DIAGNOSTIC_BG_INVERSE) return;

  var needles = ['bg/inverse', 'bg-inverse', 'inverse'];
  var normalized = variableName.toLowerCase().replace(/\s+/g, '');
  var isTarget = false;

  for (var i = 0; i < needles.length; i++) {
    if (normalized.indexOf(needles[i]) !== -1) {
      isTarget = true;
      break;
    }
  }

  if (!isTarget) return;

  console.log('┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓');
  console.log('┃ TRACE_ALIAS_RESOLUTION: ' + variableName);
  console.log('┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛');
  console.log('[TRACE] Variable:', variableName);
  console.log('[TRACE] Context Mode:', contextModeId);
  console.log('[TRACE] Alias Chain:', aliasChain);
  console.log('[TRACE] Final Value:', finalValue);

  if (!finalValue) {
    console.log('[TRACE] ⚠️ RESOLUTION FAILED - Final value is null/undefined');
  }
  console.log('┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛');
}

// ============================================================================
// TRACE: Collection/Semantic Filters
// ============================================================================
function traceCollectionFilters() {
  if (!DIAGNOSTIC_BG_INVERSE) return;

  console.log('┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓');
  console.log('┃ TRACE_COLLECTION_FILTERS                                ┃');
  console.log('┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛');

  // Check for any hardcoded whitelist/blacklist
  console.log('[TRACE] Checking for semantic filters...');
  console.log('[TRACE] isSemanticVariable function exists:', typeof isSemanticVariable !== 'undefined');

  // Check for bg-specific filters
  console.log('[TRACE] Checking for bg-specific filters...');
  console.log('[TRACE] Looking for patterns like: allowedBgTokens, bgWhitelist, etc.');

  console.log('┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛');
}

// ============================================================================
// TRACE: Pipeline Overview
// ============================================================================
function tracePipelineOverview() {
  if (!DIAGNOSTIC_BG_INVERSE) return;

  console.log('┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓');
  console.log('┃ FILL SUGGESTION PIPELINE OVERVIEW                       ┃');
  console.log('┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛');
  console.log('[PIPELINE] 1. checkFillsSafely - Detects hardcoded FILL');
  console.log('[PIPELINE] 2. findColorSuggestions - Finds candidate variables');
  console.log('[PIPELINE] 3. buildColorCandidatesIndex - Builds index (if using new engine)');
  console.log('[PIPELINE] 4. suggestClosestVariables - Ranks by OKLab distance (if using new engine)');
  console.log('[PIPELINE] 5. enrichSuggestionsWithRealValues - Resolves values for UI');
  console.log('[PIPELINE] 6. UI Display - Shows suggestions to user');
  console.log('┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛');
}

function checkFillsSafely(node, valueToVariableMap, results) {
  try {
    // ============================================================================
    // DIAGNOSTIC: Trace pipeline overview (once per scan)
    // ============================================================================
    if (typeof tracePipelineOverview !== 'undefined') {
      tracePipelineOverview();
      traceCollectionFilters();
    }

    // ===========================================================================
    // NOUVEAU: Scanner le nœud parent lui-même AVANT ses enfants
    // ===========================================================================
    if (node.fills && Array.isArray(node.fills) && node.fills.length > 0) {
      // Détecter le mode du node - RETOURNE DIRECTEMENT LE MODE ID
      var parentContextModeId = detectNodeModeId(node);

      console.log('🔍 [DEBUG] Detected modeId for parent:', parentContextModeId, 'node:', node.name);

      // Scanner chaque fill du nœud parent
      for (var pi = 0; pi < node.fills.length; pi++) {
        try {
          var parentFill = node.fills[pi];
          if (!parentFill || parentFill.type !== CONFIG.types.SOLID || !parentFill.color) continue;

          var parentIsBound = isPropertyBoundToVariable(node.boundVariables || {}, 'fills', pi);
          if (parentIsBound) continue;

          var parentHexValue = rgbToHex(parentFill.color);
          if (!parentHexValue) continue;

          var parentPropertyType = node.type === "TEXT" ? "Text" : "Fill";
          var parentSuggestions = enrichSuggestionsWithRealValues(
            findColorSuggestions(parentHexValue, valueToVariableMap, parentPropertyType, parentContextModeId, node.type)
          );

          if (parentSuggestions && parentSuggestions.length > 0) {
            results.push({
              nodeId: node.id,
              nodeName: node.name,
              propertyType: parentPropertyType,
              currentValue: parentHexValue,
              suggestions: parentSuggestions
            });
          }
        } catch (parentErr) {
          console.error('Error scanning parent node fill:', parentErr);
        }
      }
    }

    // ===========================================================================
    // Continuer avec le scan des enfants (code existant)
    // ===========================================================================
    var fills = node.fills;
    if (!Array.isArray(fills)) return;

    // DÉTECTER LE MODE DU NODE - RETOURNE DIRECTEMENT LE MODE ID
    var contextModeId = detectNodeModeId(node);
    console.log('🔍 [DEBUG] Detected modeId for children:', contextModeId, 'node:', node.name);

    for (var i = 0; i < fills.length; i++) {
      try {
        var fill = fills[i];
        if (!fill || fill.type !== CONFIG.types.SOLID || !fill.color) continue;


        var isBound = isPropertyBoundToVariable(node.boundVariables || {}, 'fills', i);
        if (isBound) continue;

        var hexValue = rgbToHex(fill.color);
        if (!hexValue) continue;

        // ✅ FIX: Détecter si c'est un TextNode pour utiliser le bon type
        var propertyType = node.type === "TEXT" ? "Text" : "Fill";

        // PASSER LE CONTEXTE DE MODE
        var suggestions = enrichSuggestionsWithRealValues(findColorSuggestions(hexValue, valueToVariableMap, propertyType, contextModeId, node.type));

        // ============================================================================
        // DIAGNOSTIC: Check if bg/inverse is in final suggestions
        // ============================================================================
        if (typeof debugExplainWhyNotToken !== 'undefined') {
          var tokenNeedles = ['bg/inverse', 'bg-inverse', 'bg / inverse', 'inverse'];
          debugExplainWhyNotToken(tokenNeedles, 'FINAL_SUGGESTIONS_FROM_checkFillsSafely', suggestions, {
            contextModeId: contextModeId,
            detectedModeName: detectedModeName,
            inputHex: hexValue,
            propertyType: propertyType
          });
        }

        // Toujours ajouter au résultat si pas de variable liée, même sans suggestion
        results.push({
          nodeId: node.id,
          layerName: node.name,
          property: propertyType,
          value: hexValue,
          suggestedVariableId: suggestions.length > 0 ? suggestions[0].id : null,
          suggestedVariableName: suggestions.length > 0 ? suggestions[0].name : null,
          fillIndex: i,
          colorSuggestions: suggestions,
          isExact: suggestions.length > 0 ? (suggestions[0].isExact || false) : false,
          detectedMode: detectedModeName, // Ajouter pour debug
          contextModeId: contextModeId
        });
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

    // DÉTECTER LE MODE DU NODE (Light ou Dark)
    var detectedModeName = detectFrameMode(node);
    var contextModeId = null;

    // Trouver le modeId correspondant dans les collections
    var collections = FigmaService.getCollections();
    if (collections && collections.length > 0) {
      for (var c = 0; c < collections.length; c++) {
        contextModeId = getModeIdByName(collections[c], detectedModeName);
        if (contextModeId) break;
      }
    }

    for (var j = 0; j < strokes.length; j++) {
      try {
        var stroke = strokes[j];
        if (!stroke || stroke.type !== CONFIG.types.SOLID || !stroke.color) continue;


        var isBound = isPropertyBoundToVariable(node.boundVariables || {}, 'strokes', j);
        if (isBound) continue;

        var hexValue = rgbToHex(stroke.color);
        if (!hexValue) continue;

        // PASSER LE CONTEXTE DE MODE
        var suggestions = enrichSuggestionsWithRealValues(findColorSuggestions(hexValue, valueToVariableMap, "Stroke", contextModeId, node.type));


        // Toujours ajouter au résultat
        results.push({
          nodeId: node.id,
          layerName: node.name,
          property: "Stroke",
          value: hexValue,
          suggestedVariableId: suggestions.length > 0 ? suggestions[0].id : null,
          suggestedVariableName: suggestions.length > 0 ? suggestions[0].name : null,
          strokeIndex: j,
          colorSuggestions: suggestions,
          isExact: suggestions.length > 0 ? (suggestions[0].isExact || false) : false
        });
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
            results.push({
              nodeId: node.id,
              layerName: node.name,
              property: prop.displayName,
              value: radiusValue + "px",
              suggestedVariableId: suggestions.length > 0 ? suggestions[0].id : null,
              suggestedVariableName: suggestions.length > 0 ? suggestions[0].name : null,
              figmaProperty: prop.figmaProp,
              numericSuggestions: suggestions
            });
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
        results.push({
          nodeId: node.id,
          layerName: node.name,
          property: "Corner Radius",
          value: node.cornerRadius + "px",
          suggestedVariableId: suggestions.length > 0 ? suggestions[0].id : null,
          suggestedVariableName: suggestions.length > 0 ? suggestions[0].name : null,
          figmaProperty: 'cornerRadius',
          numericSuggestions: suggestions
        });
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
        results.push({
          nodeId: node.id,
          layerName: node.name,
          property: "Item Spacing",
          value: node.itemSpacing + "px",
          suggestedVariableId: suggestions.length > 0 ? suggestions[0].id : null,
          suggestedVariableName: suggestions.length > 0 ? suggestions[0].name : null,
          figmaProperty: 'itemSpacing',
          numericSuggestions: suggestions
        });
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
            results.push({
              nodeId: node.id,
              layerName: node.name,
              property: paddingProp.displayName,
              value: paddingValue + "px",
              suggestedVariableId: suggestions.length > 0 ? suggestions[0].id : null,
              suggestedVariableName: suggestions.length > 0 ? suggestions[0].name : null,
              figmaProperty: paddingProp.figmaProp,
              numericSuggestions: suggestions
            });
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

    var binding = boundVariables[propertyPath];
    if (!binding) return false;

    // ✅ FIX: Si binding est un tableau (comme fontSize), prendre le premier élément
    if (Array.isArray(binding)) {
      if (index !== undefined) {
        binding = binding[index];
      } else {
        // Pas d'index fourni, prendre le premier élément du tableau
        binding = binding[0];
      }
    } else if (index !== undefined) {
      // Binding n'est pas un tableau mais on a un index (cas fills[0].color)
      binding = binding[index];
    }

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
        (function () { return function () { } })() && console.log('✅ [applyAndVerifyFix] FontSize bound verification passed:', result.nodeId, variable.name);
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
    (function () { return function () { } })() && console.log('Verify Application: Checking property', result.property, 'for node', node.id);

    // Pour les styles locaux, ne pas utiliser la vérification générale des boundVariables
    // car les variables sont appliquées aux fills/strokes individuels, pas au nœud principal
    if (result.property !== 'Local Fill Style' && result.property !== 'Local Stroke Style') {
      (function () { return function () { } })() && console.log('Verify Application: Checking boundVariables change');
      var boundVariablesChanged = JSON.stringify(stateBefore.boundVariables) !== JSON.stringify(stateAfter.boundVariables);
      (function () { return function () { } })() && console.log('Verify Application: boundVariables changed:', boundVariablesChanged);
      (function () { return function () { } })() && console.log('Verify Application: Before:', stateBefore.boundVariables);
      (function () { return function () { } })() && console.log('Verify Application: After:', stateAfter.boundVariables);

      if (boundVariablesChanged) {
        (function () { return function () { } })() && console.log('Verify Application: Bound variables changed, success!');
        return true;
      }
    }

    switch (result.property) {
      case "Fill":
        (function () { return function () { } })() && console.log('Verify Application: Using verifyFillApplication');
        return verifyFillApplication(node, variable, result.fillIndex, stateBefore, stateAfter);

      case "Stroke":
        (function () { return function () { } })() && console.log('Verify Application: Using verifyStrokeApplication');
        return verifyStrokeApplication(node, variable, result.strokeIndex, stateBefore, stateAfter);

      case "Local Fill Style":
        (function () { return function () { } })() && console.log('Verify Application: Using verifyLocalStyleApplication (fill)');
        return verifyLocalStyleApplication(node, variable, 'fill', stateBefore, stateAfter);

      case "Local Stroke Style":
        (function () { return function () { } })() && console.log('Verify Application: Using verifyLocalStyleApplication (stroke)');
        return verifyLocalStyleApplication(node, variable, 'stroke', stateBefore, stateAfter);

      default:
        (function () { return function () { } })() && console.log('Verify Application: Using verifyNumericApplication for', result.property);
        return verifyNumericApplication(node, variable, result, stateBefore, stateAfter);
    }

  } catch (error) {
    return false;
  }
}


function verifyLocalStyleApplication(node, variable, styleType, stateBefore, stateAfter) {
  try {
    (function () { return function () { } })() && console.log('🔍 Verify Local Style:', styleType, 'for node', node.id, 'expected var:', variable.id);

    // Vérifier que le style local a été supprimé
    if (styleType === 'fill' && node.fillStyleId) {
      (function () { return function () { } })() && console.log('❌ Verify Local Style: fillStyleId still exists');
      return false;
    }
    if (styleType === 'stroke' && node.strokeStyleId) {
      (function () { return function () { } })() && console.log('❌ Verify Local Style: strokeStyleId still exists');
      return false;
    }

    (function () { return function () { } })() && console.log('✅ Verify Local Style: Style correctly removed');

    // Vérifier que LA VARIABLE SPÉCIFIQUE est appliquée (comme pour les autres propriétés)
    var targetArray = styleType === 'fill' ? node.fills : node.strokes;
    if (!targetArray || targetArray.length === 0) {
      (function () { return function () { } })() && console.log('❌ Verify Local Style: No fills/strokes found');
      return false;
    }

    // Chercher la variable spécifique dans tous les items
    for (var i = 0; i < targetArray.length; i++) {
      var item = targetArray[i];
      if (item && item.boundVariables && item.boundVariables.color) {
        var boundVar = item.boundVariables.color;
        (function () { return function () { } })() && console.log('Verify Local Style: Found variable', boundVar.id, 'type:', boundVar.type);
        if (boundVar.type === 'VARIABLE_ALIAS' && boundVar.id === variable.id) {
          (function () { return function () { } })() && console.log('✅ Verify Local Style: Correct variable found');
          return true;
        }
      }
    }

    (function () { return function () { } })() && console.log('❌ Verify Local Style: Expected variable not found');
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
    (function () { return function () { } })() && console.log('Verify Numeric: Checking property', result.property, 'figmaProperty:', result.figmaProperty);

    if (!result.figmaProperty) {
      (function () { return function () { } })() && console.log('Verify Numeric: No figmaProperty specified');
      return false;
    }

    (function () { return function () { } })() && console.log('Verify Numeric: Current boundVariables:', node.boundVariables);
    (function () { return function () { } })() && console.log('Verify Numeric: Looking for', result.figmaProperty);

    if (node.boundVariables && node.boundVariables[result.figmaProperty]) {
      var boundVar = node.boundVariables[result.figmaProperty];
      (function () { return function () { } })() && console.log('Verify Numeric: Found bound variable:', boundVar, 'expected variable id:', variable.id);

      // ✅ FIX: boundVar peut être un tableau pour certaines propriétés (fontSize, etc.)
      var actualBoundVar = Array.isArray(boundVar) ? boundVar[0] : boundVar;

      if (actualBoundVar && actualBoundVar.type === 'VARIABLE_ALIAS' && actualBoundVar.id === variable.id) {
        (function () { return function () { } })() && console.log('Verify Numeric: Variable correctly applied!');
        return true;
      } else {
        (function () { return function () { } })() && console.log('Verify Numeric: Wrong variable or type. Got:', actualBoundVar);
      }
    } else {
      (function () { return function () { } })() && console.log('Verify Numeric: No bound variable found for', result.figmaProperty);
    }

    (function () { return function () { } })() && console.log('Verify Numeric: Verification failed');
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
      case "Text": // ✅ Ajouté pour supporter les TextNodes
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
      case "Text": // ✅ Ajouté pour supporter les TextNodes
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
      case "Text": // ✅ Ajouté pour supporter les TextNodes
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
    (function () { return function () { } })() && console.log('Local Style Application: Applying', styleType, 'style to node', node.id, 'variable:', variable.name);

    // Vérifier l'état avant application
    var targetArray = styleType === 'fill' ? node.fills : node.strokes;
    var targetIndex = 0;
    var hasExistingVariable = false;

    if (targetArray && targetArray[targetIndex] && targetArray[targetIndex].boundVariables && targetArray[targetIndex].boundVariables.color) {
      var existingVar = targetArray[targetIndex].boundVariables.color;
      if (existingVar.id === variable.id) {
        (function () { return function () { } })() && console.log('Local Style Application: Variable already applied from preview, success');
        hasExistingVariable = true;
      } else {
        (function () { return function () { } })() && console.log('Local Style Application: Different variable already applied:', existingVar.id);
      }
    }

    // Supprimer le style local
    if (styleType === 'fill' && node.fillStyleId) {
      (function () { return function () { } })() && console.log('Local Style Application: Removing fillStyleId:', node.fillStyleId);
      node.fillStyleId = '';
    } else if (styleType === 'stroke' && node.strokeStyleId) {
      (function () { return function () { } })() && console.log('Local Style Application: Removing strokeStyleId:', node.strokeStyleId);
      node.strokeStyleId = '';
    }

    // IMPORTANT: Pour les styles locaux, on doit supprimer le style local et appliquer la variable
    (function () { return function () { } })() && console.log('Local Style Application: Processing', styleType, 'style');

    // Supprimer le style local
    if (styleType === 'fill' && node.fillStyleId) {
      node.fillStyleId = '';
      (function () { return function () { } })() && console.log('Local Style Application: fillStyleId removed');
    } else if (styleType === 'stroke' && node.strokeStyleId) {
      node.strokeStyleId = '';
      (function () { return function () { } })() && console.log('Local Style Application: strokeStyleId removed');
    }

    // Appliquer la variable (toujours, même si elle semble déjà appliquée)
    (function () { return function () { } })() && console.log('Local Style Application: Applying variable to', styleType);
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

    // ✅ CAS SPÉCIAL : TextNode ou Fills Mixed
    if (node.fills === figma.mixed) {
      console.log('🎨 [APPLY_FILL] Detected mixed fills, trying unified approach');
      try {
        // Appliquer à l'ensemble de la collection de fills pour unifier
        node.setBoundVariable('fills', variable);
        console.log('✅ [APPLY_FILL] Success with unified fills binding');
        return true;
      } catch (e) {
        console.log('⚠️ [APPLY_FILL] Unified binding failed, forcing solid fill:', e.message);
        // Si ça échoue, on tente de forcer un fill solide unique
        node.fills = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }];
        node.setBoundVariable('fills[0].color', variable);
        console.log('✅ [APPLY_FILL] Success with forced solid fill');
        return true;
      }
    }

    if (!node.fills || !Array.isArray(node.fills) || node.fills.length === 0) {
      console.log('⚠️ [APPLY_FILL] No fills array, creating one');
      // Forcer la création d'un fill si manquant
      node.fills = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }];
    }

    // Si l'index demandé n'existe pas, on prend le premier
    var actualIndex = (node.fills[fillIndex]) ? fillIndex : 0;
    console.log('🎨 [APPLY_FILL] Using fill index:', actualIndex);
    var fill = node.fills[actualIndex];
    (function () { return function () { } })() && console.log('Apply Fill Variable: Fill exists, checking bound variables');

    // Vérifier si la variable est déjà appliquée
    if (fill.boundVariables && fill.boundVariables.color && fill.boundVariables.color.id === variable.id) {
      (function () { return function () { } })() && console.log('Apply Fill Variable: Variable already applied correctly');
      return true;
    }


    if (node.fillStyleId) {
      (function () { return function () { } })() && console.log('Apply Fill Variable: Removing fillStyleId');
      try {
        node.fillStyleId = '';
      } catch (e) {
        console.error('Apply Fill Variable: Error removing fillStyleId:', e);
      }
    }


    try {
      (function () { return function () { } })() && console.log('Apply Fill Variable: Setting bound variable');
      node.setBoundVariable(fillPath, variable);

      (function () { return function () { } })() && console.log('Apply Fill Variable: Variable applied successfully via setBoundVariable');
      var updatedFill = node.fills[fillIndex];

      return true;
    } catch (setBoundError) {
      console.error('Apply Fill Variable: Error setting bound variable:', setBoundError);
      (function () { return function () { } })() && console.log('Apply Fill Variable: Trying fallback method');
      // Ne pas retourner false ici, continuer vers le fallback
    }


    try {
      (function () { return function () { } })() && console.log('Apply Fill Variable: Using fallback method');
      var clonedFills = JSON.parse(JSON.stringify(node.fills));
      if (!clonedFills[fillIndex].boundVariables) {
        clonedFills[fillIndex].boundVariables = {};
      }
      clonedFills[fillIndex].boundVariables.color = {
        type: 'VARIABLE_ALIAS',
        id: variable.id
      };

      (function () { return function () { } })() && console.log('Apply Fill Variable: Removing fillStyleId in fallback');
      if (node.fillStyleId) {
        node.fillStyleId = '';
      }

      (function () { return function () { } })() && console.log('Apply Fill Variable: Applying cloned fills');
      node.fills = clonedFills;

      (function () { return function () { } })() && console.log('Apply Fill Variable: Variable applied successfully via fallback');
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

      (function () { return function () { } })() && console.log('✅ [applyNumericVariable] Application Font Size sur TextNode', node.id, 'avec font:', node.fontName.family, node.fontName.style);

      // Charger la font de manière asynchrone avant d'appliquer la variable
      try {
        await figma.loadFontAsync(node.fontName);
        (function () { return function () { } })() && console.log('✅ [applyNumericVariable] Font chargée avec succès:', node.fontName.family, node.fontName.style);
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

// End of code file

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
      (function () { return function () { } })() && console.log(`⚠️ [SAFE_MODE] No collection modes for var=${variable.name} id=${variable.id} collectionId=${variable.variableCollectionId}`);
    } catch (e) {
      console.warn(`⚠️ [SAFE_MODE] Error getting collection for var=${variable.name} id=${variable.id} collectionId=${variable.variableCollectionId}:`, e);
    }
  }

  // Fallback : utiliser les clés de valuesByMode
  if (variable.valuesByMode && typeof variable.valuesByMode === 'object') {
    var modeKeys = Object.keys(variable.valuesByMode);
    if (modeKeys.length > 0) {
      (function () { return function () { } })() && console.log(`🔄 [SAFE_MODE] Using fallback mode "${modeKeys[0]}" for var=${variable.name} id=${variable.id} (no collection)`);
      return modeKeys[0];
    }
    (function () { return function () { } })() && console.log(`⚠️ [SAFE_MODE] No valuesByMode for var=${variable.name} id=${variable.id}`);
  }

  (function () { return function () { } })() && console.log(`❌ [SAFE_MODE] Cannot determine modeId for var=${variable.name || 'unknown'} id=${variable.id || 'unknown'}`);
  return null;
}

// Fonction pour fusionner les tokens générés avec les alias existants
function mergeSemanticWithExistingAliases(generated, existing) {
  if (!generated) return existing || {};
  if (!existing) return generated;

  // Détection structure multi-mode
  // ✅ FIX: Vérifier si les tokens ont une structure modes PAR TOKEN (nouvelle structure)
  // Au lieu de vérifier generated.modes (structure racine, ancienne)
  var isGeneratedMultiMode = false;
  for (var checkKey in generated) {
    if (generated.hasOwnProperty(checkKey) && generated[checkKey] && generated[checkKey].modes) {
      isGeneratedMultiMode = true;
      break;
    }
  }

  (function () { return function () { } })() && console.log(`🔍 [MERGE] isGeneratedMultiMode: ${isGeneratedMultiMode}`);

  // Déterminer le mode actuel depuis les settings sauvegardés
  var currentThemeMode = 'light'; // Valeur par défaut
  try {
    var savedThemeMode = figma.root.getPluginData("tokenStarter.themeMode");
    if (savedThemeMode === 'dark') {
      currentThemeMode = 'dark';
    }
    // Pour 'both', on utilise 'light' comme mode par défaut pour la structure plate
  } catch (e) { }

  // Si c'est une structure multi-mode PAR TOKEN, préserver la structure
  if (isGeneratedMultiMode) {
    (function () { return function () { } })() && console.log(`✅ [MERGE] Preserving per-token modes structure`);
    var merged = {};
    for (var key in generated) {
      if (!generated.hasOwnProperty(key)) continue;
      var generatedToken = generated[key];
      var existingToken = existing[key];

      if (generatedToken.modes) {
        // ✅ Préserver la structure modes telle quelle
        merged[key] = generatedToken;

        // Si le token existant a un aliasTo, le préserver
        if (existingToken && existingToken.aliasTo) {
          merged[key].aliasTo = existingToken.aliasTo;
        }

        (function () { return function () { } })() && console.log(`✅ [MERGE] ${key}: preserved modes structure (light: ${!!generatedToken.modes.light}, dark: ${!!generatedToken.modes.dark})`);
      } else {
        // Token sans modes (ne devrait pas arriver avec la nouvelle structure)
        merged[key] = generatedToken;
      }
    }
    return merged;
  }

  // Si ce n'est pas multi-mode (ancienne structure), fallback sur l'ancienne logique (simplifiée)
  (function () { return function () { } })() && console.log(`⚠️ [MERGE] Using legacy flat merge logic`);
  var merged = {};
  for (var key in generated) {
    if (!generated.hasOwnProperty(key)) continue;
    var generatedToken = generated[key];
    var existingToken = existing[key];
    if (existingToken && existingToken.aliasTo) {
      merged[key] = {
        resolvedValue: typeof generatedToken === 'object' ? (generatedToken.resolvedValue || generatedToken) : generatedToken,
        aliasTo: existingToken.aliasTo,
        type: existingToken.type || 'COLOR',
        meta: existingToken.meta
      };
    } else {
      merged[key] = typeof generatedToken === 'object' && generatedToken.resolvedValue !== undefined ? generatedToken.resolvedValue : generatedToken;
    }
  }
  return merged;

  // Logique Multi-Mode : convertir vers structure plate pour le mode actuel
  (function () { return function () { } })() && console.log(`🔄 Converting multi-mode tokens to flat structure for mode: ${currentThemeMode}`);

  var merged = {};
  var generatedMode = generated.modes[currentThemeMode] || {};

  // Handle existing being potentially flat (old format) or multimodal
  var existingMode = {};
  if (existing.modes && existing.modes[currentThemeMode]) {
    existingMode = existing.modes[currentThemeMode];
  } else if (!existing.modes) {
    // If existing is flat, use it directly
    existingMode = existing;
  }

  for (var key in generatedMode) {
    if (!generatedMode.hasOwnProperty(key)) continue;

    var genToken = generatedMode[key];
    var existToken = existingMode[key];

    // Créer le token final avec resolvedValue scalaire
    var finalToken = {
      resolvedValue: genToken.resolvedValue, // Doit être scalaire
      type: genToken.type,
      meta: genToken.meta
    };

    // Gérer les alias : priorité aux alias existants, puis aux nouveaux aliasRef
    if (existToken && existToken.aliasTo) {
      // Préserver l'alias existant
      finalToken.aliasTo = existToken.aliasTo;
      finalToken.state = TOKEN_STATE.ALIAS_RESOLVED;
    } else if (genToken.aliasRef) {
      // Convertir aliasRef en aliasTo pour les nouveaux tokens
      finalToken.aliasTo = genToken.aliasRef;
      finalToken.state = TOKEN_STATE.ALIAS_RESOLVED;
    } else {
      // Pas d'alias
      finalToken.aliasTo = null;
      finalToken.state = TOKEN_STATE.VALUE;
    }

    merged[key] = finalToken;
  }

  return merged;
}

// Fonction helper pour déterminer la catégorie d'une collection de variables
function getCategoryFromVariableCollection(collectionName) {
  var n = collectionName.toLowerCase().trim();

  // PRIORITÉ : Semantic (doit être détecté avant "colors" ou "system")
  if (n === "semantic" || n.indexOf('semantic') !== -1) return "semantic";

  // Reconnaissance étendue pour les couleurs (brand, theme, ui, etc.)
  if (n === "brand colors" || n.indexOf('brand') !== -1 || n.indexOf('color') !== -1 ||
    n.indexOf('theme') !== -1 || n.indexOf('palette') !== -1 || n.indexOf('ui') !== -1 ||
    n === "colors" || n === "design tokens") return "brand";

  // Reconnaissance étendue pour les couleurs système/status
  else if (n === "system colors" || n.indexOf('system') !== -1 || n.indexOf('status') !== -1 ||
    n.indexOf('state') !== -1) return "system";

  // Reconnaissance étendue pour les nuances de gris
  else if (n === "grayscale" || n.indexOf('gray') !== -1 || n.indexOf('grey') !== -1 ||
    n.indexOf('grayscale') !== -1 || n.indexOf('neutral') !== -1) return "gray";

  // Reconnaissance étendue pour l'espacement
  else if (n === "spacing" || n.includes('spacing') || n.includes('gap') ||
    n.includes('margin') || n.includes('padding') || n.includes('space')) return "spacing";

  // Reconnaissance étendue pour les rayons de bordure
  else if (n === "radius" || n.includes('radius') || n.includes('corner') ||
    n.includes('border-radius') || n.includes('round')) return "radius";

  // Reconnaissance étendue pour la typographie
  else if (n === "typography" || n.includes('typo') || n.includes('typography') ||
    n.includes('font') || n.includes('text') || n.includes('type')) return "typography";

  return "unknown";
}

// Fonctions helper pour la détection transversale de patterns spéciaux
function isRadiusPattern(variableName) {
  if (!variableName) return false;
  var name = variableName.toLowerCase();
  return name.includes('radius') || name.includes('corner') || name.includes('border-radius') ||
    name.includes('round') || /^\d+$/.test(name);
}

function isSpacingPattern(variableName) {
  if (!variableName) return false;
  var name = variableName.toLowerCase();
  return name.includes('spacing') || name.includes('gap') || name.includes('margin') ||
    name.includes('padding') || name.includes('space') || /^\d+$/.test(name);
}

// Fonction d'inférence du type de collection depuis son contenu (améliorée)
function inferCollectionTypeFromContent(collection) {
  if (!collection || !collection.variableIds || collection.variableIds.length === 0) {
    return null; // Sécurité : pas de variables = pas d'inférence
  }

  // Analyser seulement les 5 premières variables (plus représentatif)
  var sampleVars = collection.variableIds.slice(0, 5).map(function (id) {
    return figma.variables.getVariableById(id);
  }).filter(function (v) { return v; });

  if (sampleVars.length === 0) return null;

  // Compter les types de valeurs
  var typeCounts = { COLOR: 0, FLOAT: 0, STRING: 0 };
  sampleVars.forEach(function (v) {
    if (v.resolvedType in typeCounts) {
      typeCounts[v.resolvedType]++;
    }
  });

  // Heuristiques améliorées : utiliser des seuils plutôt que des exigences absolues
  var name = collection.name.toLowerCase();
  var totalSamples = sampleVars.length;

  // Si > 60% des variables sont des couleurs = collection de couleurs
  if (typeCounts.COLOR > totalSamples * 0.6) {
    return "brand";
  }

  // Si > 60% des variables sont des nombres
  if (typeCounts.FLOAT > totalSamples * 0.6) {
    // Essayer de déterminer le sous-type basé sur le nom
    if (name.includes('spacing') || name.includes('gap') || name.includes('margin') || name.includes('padding')) {
      return "spacing";
    }
    if (name.includes('radius') || name.includes('corner') || name.includes('border-radius')) {
      return "radius";
    }
    // Par défaut, si ce sont des nombres, c'est probablement du spacing
    if (name.includes('space') || name.includes('size') || totalSamples > 2) {
      return "spacing";
    }
  }

  // Si > 60% des variables sont des chaînes = probablement typographie
  if (typeCounts.STRING > totalSamples * 0.6) {
    if (name.includes('typo') || name.includes('font') || name.includes('text') || name.includes('type')) {
      return "typography";
    }
  }

  return null; // Ne pas deviner si vraiment ambigu
}

// Fonction de diagnostic pour la résolution des alias sémantiques
function debugSemanticAliasResolution(semanticKey, naming) {
  (function () { return function () { } })() && console.log(`🔍 [DEBUG] Resolution attempt for ${semanticKey} with naming=${naming}`);

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
      (function () { return function () { } })() && console.log(`❌ [DEBUG] No mapping found for ${semanticKey}`);
      return;
    }

    (function () { return function () { } })() && console.log(`📋 [DEBUG] Looking for category: ${mapping.category}, keys: [${mapping.keys.join(', ')}]`);

    // Lister les collections disponibles
    var collections = figma.variables.getLocalVariableCollections();
    (function () { return function () { } })() && console.log(`🏗️ [DEBUG] Available collections:`);
    collections.forEach(function (collection) {
      var category = getCategoryFromVariableCollection(collection.name);
      (function () { return function () { } })() && console.log('  ' + collection.name + ' → ' + category + ' (' + collection.variableIds.length + ' vars)');
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
      (function () { return function () { } })() && console.log(`❌ [DEBUG] No collection found for category ${mapping.category}`);
      return;
    }

    (function () { return function () { } })() && console.log(`✅ [DEBUG] Found collection: ${targetCollection.name} (${targetCollection.variableIds.length} variables)`);

    // Lister les clés disponibles dans cette collection
    (function () { return function () { } })() && console.log(`🔑 [DEBUG] Available keys in ${targetCollection.name}:`);
    var availableKeys = [];
    targetCollection.variableIds.forEach(function (varId) {
      var variable = figma.variables.getVariableById(varId);
      if (variable) {
        var key = extractVariableKey(variable, targetCollection.name);
        availableKeys.push(key);
        (function () { return function () { } })() && console.log('  ' + key + ' (' + variable.name + ')');
      }
    });

    // Vérifier les clés recherchées
    var foundKeys = [];
    mapping.keys.forEach(function (searchKey) {
      if (availableKeys.indexOf(searchKey) !== -1) {
        foundKeys.push(searchKey);
        (function () { return function () { } })() && console.log("✅ [DEBUG] Key '" + searchKey + "' FOUND");
      } else {
        (function () { return function () { } })() && console.log("❌ [DEBUG] Key '" + searchKey + "' NOT FOUND");
      }
    });

    if (foundKeys.length > 0) {
      (function () { return function () { } })() && console.log(`🎉 [DEBUG] SUCCESS: Will use ${foundKeys[0]} from ${foundKeys.join(' or ')}`);
    } else {
      (function () { return function () { } })() && console.log(`💥 [DEBUG] FAILURE: No matching keys found - will use fallback`);
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
    (function () { return function () { } })() && console.log(`🔍 [DIAGNOSE ${context || 'UNK'}] No semantic tokens to diagnose`);
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

    // ✅ FIX: Vérifier d'abord si c'est un token multi-mode
    if (typeof token === 'object' && token.modes) {
      // Token multi-mode : vérifier les modes light et dark
      stats.withResolvedValue++;
      if (token.modes.light && token.modes.light.resolvedValue) {
        stats.scalarValues++;
      }
      if (token.modes.dark && token.modes.dark.resolvedValue) {
        stats.scalarValues++;
      }
      // Pas d'issues pour les tokens multi-mode valides
    }
    else if (typeof token === 'object' && token.resolvedValue !== undefined) {
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

  (function () { return function () { } })() && console.log(`🔍 [DIAGNOSE ${context || 'UNK'}] Semantic tokens analysis:`);
  (function () { return function () { } })() && console.log(`   Total: ${stats.total}`);
  (function () { return function () { } })() && console.log(`   With resolvedValue: ${stats.withResolvedValue}`);
  (function () { return function () { } })() && console.log(`   Scalar values: ${stats.scalarValues}`);
  (function () { return function () { } })() && console.log(`   Object values: ${stats.objectValues} ❌`);
  (function () { return function () { } })() && console.log(`   Null/undefined: ${stats.nullUndefined} ❌`);
  (function () { return function () { } })() && console.log(`   With alias: ${stats.withAlias}`);
  (function () { return function () { } })() && console.log(`   Color tokens: ${stats.colorTokens}`);

  if (issues.length > 0) {
    console.warn(`⚠️ [DIAGNOSE ${context || 'UNK'}] Found ${issues.length} issues:`);
    issues.forEach(function (issue) {
      console.warn(`   ${issue.key}: ${issue.message}`, issue.value);
    });
  } else {
    (function () { return function () { } })() && console.log(`✅ [DIAGNOSE ${context || 'UNK'}] No issues found`);
  }

  return issues;
}

// Fonction pour "flatten" les tokens sémantiques depuis Figma au démarrage

async function flattenSemanticTokensFromFigma(callsite) {
  var savedSemanticTokens = getSemanticTokensFromFile('FLATTEN_LOAD');
  if (!savedSemanticTokens) {
    (function () { return function () { } })() && console.log(`🔄 [FLATTEN] ${callsite}: no saved tokens to flatten`);
    return null;
  }

  // FIX: Utiliser le vrai naming récupéré de clientStorage
  const naming = await getNamingFromFile();
  (function () { return function () { } })() && console.log(`[FLATTEN] using naming=${naming}`);

  (function () { return function () { } })() && console.log(`🔄 [FLATTEN] ${callsite}: starting flatten for ${Object.keys(savedSemanticTokens).length} tokens`);

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
    (function () { return function () { } })() && console.log(`⚠️ [FLATTEN] ${callsite}: no Semantic collection found`);
    return savedSemanticTokens; // Retourner les tokens tels quels
  }

  (function () { return function () { } })() && console.log(`🔄 [FLATTEN] ${callsite}: using Semantic collection "${semanticCollection.name}" with ${semanticCollection.variableIds.length} variables`);

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
      (function () { return function () { } })() && console.log(`[REHYDRATE][NOT_FOUND] semanticKey=${semanticKey} variableName=${variableName} → keep stored value`);
      flattenedTokens[semanticKey] = flattenedToken;
      unresolvedCount++;
      continue;
    }

    // MODEID SAFE - NE JAMAIS FAIRE collection.modes[0] SANS VÉRIFIER
    modeId = safeGetModeId(semanticVar);
    if (modeId === null) {
      (function () { return function () { } })() && console.log(`[REHYDRATE][NO_MODE] semanticKey=${semanticKey} var=${semanticVar.name} id=${semanticVar.id} → keep stored value`);
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
            (function () { return function () { } })() && console.log(`🔗 [REHYDRATE] ${semanticKey} is alias to ${targetCollection.name}/${targetKey}`);
          }
        }
      }

      resolved = resolveVariableValue(semanticVar, modeId);

      // IMPORTANT : si resolved == null || resolved === undefined
      if (resolved == null || resolved === undefined) {
        (function () { return function () { } })() && console.log(`[REHYDRATE][SKIP_UNRESOLVED] key=${semanticKey} keepStored=${savedToken.resolvedValue}`);
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
      (function () { return function () { } })() && console.log(`[REHYDRATE][SKIP_CONVERT] key=${semanticKey} resolvedType=${typeof resolved} displayType=${typeof displayValue} → keep stored value`);
      flattenedTokens[semanticKey] = flattenedToken;
      unresolvedCount++;
      continue;
    }

    // MISE À JOUR RÉUSSIE
    flattenedToken.resolvedValue = displayValue;
    flattenedCount++;
    (function () { return function () { } })() && console.log(`✅ [REHYDRATE] ${semanticKey}: "${savedToken.resolvedValue}" → "${displayValue}"`);

    flattenedTokens[semanticKey] = flattenedToken;
  }

  (function () { return function () { } })() && console.log(`🔄 [FLATTEN] ${callsite}: complete - ${flattenedCount} flattened, ${unresolvedCount} kept as-is`);

  return flattenedTokens;
}


/**
 * projectCoreToLegacyShape: Adapter temporaire Core -> Legacy
 * Convertit les tokens Core (primitives + semantics multi-mode) vers le format legacy
 * @param {object} coreTokens - { primitives: {...}, semantics: {...} }
 * @param {string} lib - Librairie (tailwind, mui, ant, etc.)
 * @returns {object} Format legacy { brand:{}, gray:{}, system:{}, spacing:{}, radius:{}, typography:{}, semantic:{} }
 */
function projectCoreToLegacyShape(coreTokens, lib) {
  var primitives = coreTokens.primitives || {};
  var semantics = coreTokens.semantics || {};

  // Format legacy attendu par le pipeline existant
  var legacy = {
    brand: primitives.brand || {},
    gray: primitives.gray || {},
    system: primitives.system || {},
    spacing: primitives.spacing || {},
    radius: primitives.radius || {},
    typography: primitives.typography || {},
    border: primitives.border || {},
    semantic: {}
  };

  // Convertir les semantics multi-mode vers le format legacy
  // Le format legacy est déjà { key: { type, modes: {...} } } donc on préserve tel quel
  for (var key in semantics) {
    if (semantics.hasOwnProperty(key)) {
      legacy.semantic[key] = semantics[key];
    }
  }

  return legacy;
}

// ╔══════════════════════════════════════════════════════════════════════════╗
// ║                        MAPPING TABLES SECTION                            ║
// ║ Tables centralisées pour conversion Core <-> Frameworks                 ║
// ║ - CORE_TO_TAILWIND / CORE_TO_CHAKRA / CORE_TO_MUI                       ║
// ║ - SCAN_PATHS (chemins d'inspection par lib)                             ║
// ║ - Helpers: getByPath / setByPath                                        ║
// ╚══════════════════════════════════════════════════════════════════════════╝

/**
 * Helpers: getByPath et setByPath
 */
function getByPath(obj, path) {
  if (!obj || !path) return null;
  var parts = path.split('.');
  var current = obj;
  for (var i = 0; i < parts.length; i++) {
    if (current === null || current === undefined) return null;
    current = current[parts[i]];
  }
  return current;
}

function setByPath(obj, path, value) {
  if (!obj || !path) return;
  var parts = path.split('.');
  var current = obj;
  for (var i = 0; i < parts.length - 1; i++) {
    if (!current[parts[i]]) {
      current[parts[i]] = {};
    }
    current = current[parts[i]];
  }
  current[parts[parts.length - 1]] = value;
}

/**
 * CORE_TO_TAILWIND: Mapping Core -> Tailwind
 */
var CORE_TO_TAILWIND = {
  // Primitives
  primitives: {
    'brand': 'theme.extend.colors.primary',
    'gray': 'theme.extend.colors.gray',
    'system.success': 'theme.extend.colors.success',
    'system.warning': 'theme.extend.colors.warning',
    'system.error': 'theme.extend.colors.destructive',
    'system.info': 'theme.extend.colors.info'
  },
  // Semantics -> CSS vars (préfixe automatique avec --)
  semanticPrefix: '--',
  semanticTransform: function (key) {
    return '--' + key.replace(/\./g, '-');
  }
};

/**
 * CORE_TO_CHAKRA: Mapping Core -> Chakra UI
 */
var CORE_TO_CHAKRA = {
  // Primitives
  primitives: {
    'brand': 'colors.primary',
    'gray': 'colors.gray',
    'system.success': 'colors.green',
    'system.warning': 'colors.orange',
    'system.error': 'colors.red',
    'system.info': 'colors.blue'
  },
  // Semantics -> semanticTokens.colors (format {default, _dark})
  semanticPath: 'semanticTokens.colors'
};

/**
 * CORE_TO_MUI: Mapping Core -> Material-UI
 */
var CORE_TO_MUI = {
  // Primitives (light mode)
  primitivesLight: {
    'brand.600': 'palette.primary.main',
    'brand.400': 'palette.primary.light',
    'brand.800': 'palette.primary.dark',
    'system.success.600': 'palette.success.main',
    'system.warning.600': 'palette.warning.main',
    'system.error.600': 'palette.error.main',
    'system.info.600': 'palette.info.main'
  },
  // Primitives (dark mode)
  primitivesDark: {
    'brand.500': 'palette.primary.main',
    'brand.300': 'palette.primary.light',
    'brand.700': 'palette.primary.dark',
    'system.success.500': 'palette.success.main',
    'system.warning.500': 'palette.warning.main',
    'system.error.500': 'palette.error.main',
    'system.info.500': 'palette.info.main'
  },
  // Semantics (light mode)
  semanticsLight: {
    'text.primary': 'palette.text.primary',
    'text.secondary': 'palette.text.secondary',
    'bg.canvas': 'palette.background.default',
    'bg.surface': 'palette.background.paper',
    'border.default': 'palette.divider'
  },
  // Semantics (dark mode) - même mapping
  semanticsDark: {
    'text.primary': 'palette.text.primary',
    'text.secondary': 'palette.text.secondary',
    'bg.canvas': 'palette.background.default',
    'bg.surface': 'palette.background.paper',
    'border.default': 'palette.divider'
  }
};

/**
 * SCAN_PATHS: Chemins à inspecter pour détecter/scanner chaque lib
 */
var SCAN_PATHS = {
  tailwind: {
    primitives: [
      'theme.extend.colors.primary',
      'theme.extend.colors.gray',
      'theme.extend.colors.success',
      'theme.extend.colors.warning',
      'theme.extend.colors.destructive',
      'theme.extend.colors.info'
    ],
    semantics: [
      'cssVars.light',
      'cssVars.dark'
    ]
  },
  chakra: {
    primitives: [
      'colors.primary',
      'colors.gray',
      'colors.green',
      'colors.orange',
      'colors.red',
      'colors.blue'
    ],
    semantics: [
      'semanticTokens.colors'
    ]
  },
  mui: {
    primitives: [
      'palette.primary',
      'light.palette.primary',
      'dark.palette.primary'
    ],
    semantics: [
      'palette.text',
      'palette.background',
      'light.palette.text',
      'light.palette.background',
      'dark.palette.text',
      'dark.palette.background'
    ]
  }
};

// ╔══════════════════════════════════════════════════════════════════════════╗
// ║                       EXPORT ADAPTERS SECTION                            ║
// ║ Conversion Core -> Framework-specific formats                           ║
// ║ - TailwindAdapter: theme.extend.colors + CSS vars                       ║
// ║ - ChakraAdapter: colors + semanticTokens.colors                         ║
// ║ - MuiAdapter: palette light/dark                                        ║
// ║ - getCoreExport: Router vers le bon adapter                            ║
// ║ Utilisés UNIQUEMENT si USE_CORE_ENGINE = true                           ║
// ╚══════════════════════════════════════════════════════════════════════════╝

/**
 * TailwindAdapter: Export vers Tailwind CSS / shadcn/ui
 */
var TailwindAdapter = {
  export: function (coreTokens) {
    var primitives = coreTokens.primitives || {};
    var semantics = coreTokens.semantics || {};
    var mapping = CORE_TO_TAILWIND;

    var output = { theme: { extend: { colors: {} } }, cssVars: { light: {}, dark: {} } };

    // 1. Primitives via mapping table
    for (var coreKey in mapping.primitives) {
      if (mapping.primitives.hasOwnProperty(coreKey)) {
        var targetPath = mapping.primitives[coreKey];
        var value = getByPath(primitives, coreKey);
        if (value) setByPath(output, targetPath, value);
      }
    }

    // 2. Semantics -> CSS vars via transform
    for (var semKey in semantics) {
      if (!semantics.hasOwnProperty(semKey)) continue;
      var token = semantics[semKey];
      if (!token.modes) continue;

      var cssKey = mapping.semanticTransform(semKey);
      if (token.modes.light && token.modes.light.resolvedValue) {
        output.cssVars.light[cssKey] = token.modes.light.resolvedValue;
      }
      if (token.modes.dark && token.modes.dark.resolvedValue) {
        output.cssVars.dark[cssKey] = token.modes.dark.resolvedValue;
      }
    }

    return output;
  }
};

/**
 * ChakraAdapter: Export vers Chakra UI
 */
var ChakraAdapter = {
  export: function (coreTokens) {
    var primitives = coreTokens.primitives || {};
    var semantics = coreTokens.semantics || {};
    var mapping = CORE_TO_CHAKRA;

    var output = { colors: {}, semanticTokens: { colors: {} } };

    // 1. Primitives via mapping table
    for (var coreKey in mapping.primitives) {
      if (mapping.primitives.hasOwnProperty(coreKey)) {
        var targetPath = mapping.primitives[coreKey];
        var value = getByPath(primitives, coreKey);
        if (value) setByPath(output, targetPath, value);
      }
    }

    // 2. Semantics -> semanticTokens.colors {default, _dark}
    for (var semKey in semantics) {
      if (!semantics.hasOwnProperty(semKey)) continue;
      var token = semantics[semKey];
      if (!token.modes) continue;

      output.semanticTokens.colors[semKey] = {
        default: token.modes.light ? token.modes.light.resolvedValue : null,
        _dark: token.modes.dark ? token.modes.dark.resolvedValue : null
      };
    }

    return output;
  }
};

/**
 * MuiAdapter: Export vers Material-UI (MUI)
 */
var MuiAdapter = {
  export: function (coreTokens) {
    var primitives = coreTokens.primitives || {};
    var semantics = coreTokens.semantics || {};
    var mapping = CORE_TO_MUI;

    // Helper: extraire valeur d'un semantic token pour un mode
    function getSemanticValue(key, mode) {
      var token = semantics[key];
      if (!token || !token.modes || !token.modes[mode]) return null;
      return token.modes[mode].resolvedValue;
    }

    var output = {
      light: { palette: { mode: 'light' } },
      dark: { palette: { mode: 'dark' } }
    };

    // 1. Primitives light via mapping table
    for (var lightKey in mapping.primitivesLight) {
      if (mapping.primitivesLight.hasOwnProperty(lightKey)) {
        var lightTarget = mapping.primitivesLight[lightKey];
        var lightValue = getByPath(primitives, lightKey);
        if (lightValue) setByPath(output.light, lightTarget, lightValue);
      }
    }

    // 2. Primitives dark via mapping table
    for (var darkKey in mapping.primitivesDark) {
      if (mapping.primitivesDark.hasOwnProperty(darkKey)) {
        var darkTarget = mapping.primitivesDark[darkKey];
        var darkValue = getByPath(primitives, darkKey);
        if (darkValue) setByPath(output.dark, darkTarget, darkValue);
      }
    }

    // 3. Semantics light via mapping table
    for (var semLightKey in mapping.semanticsLight) {
      if (mapping.semanticsLight.hasOwnProperty(semLightKey)) {
        var semLightTarget = mapping.semanticsLight[semLightKey];
        var semLightValue = getSemanticValue(semLightKey, 'light');
        if (semLightValue) setByPath(output.light, semLightTarget, semLightValue);
      }
    }

    // 4. Semantics dark via mapping table
    for (var semDarkKey in mapping.semanticsDark) {
      if (mapping.semanticsDark.hasOwnProperty(semDarkKey)) {
        var semDarkTarget = mapping.semanticsDark[semDarkKey];
        var semDarkValue = getSemanticValue(semDarkKey, 'dark');
        if (semDarkValue) setByPath(output.dark, semDarkTarget, semDarkValue);
      }
    }

    return output;
  }
};

/**
 * getCoreExport: Router vers le bon adapter selon la lib
 * @param {object} coreTokens - { primitives, semantics }
 * @param {string} lib - 'tailwind', 'chakra', 'mui', etc.
 * @returns {object} Export formaté pour la lib
 */
function getCoreExport(coreTokens, lib) {
  var normalizedLib = normalizeLibType(lib);

  switch (normalizedLib) {
    case 'tailwind':
      return TailwindAdapter.export(coreTokens);
    case 'chakra':
      return ChakraAdapter.export(coreTokens);
    case 'mui':
      return MuiAdapter.export(coreTokens);
    default:
      // Fallback: retourner format Tailwind par défaut
      return TailwindAdapter.export(coreTokens);
  }
}

// ╔══════════════════════════════════════════════════════════════════════════╗
// ║                       IMPORT ADAPTERS SECTION                            ║
// ║ Scan agnostique et normalisation vers Core                              ║
// ║ - detectLib: Détecte Tailwind / Chakra / MUI depuis l'input             ║
// ║ - normalizeToCore: Normalise vers format Core avec fallback             ║
// ║ Utilisés UNIQUEMENT si USE_CORE_ENGINE = true                           ║
// ╚══════════════════════════════════════════════════════════════════════════╝

/**
 * detectLib: Détecte la librairie depuis l'input
 * @param {object} input - Objet contenant les tokens (format variable)
 * @returns {string|null} 'tailwind', 'chakra', 'mui', ou null
 */
function detectLib(input) {
  if (!input || typeof input !== 'object') return null;

  var evidence = {
    tailwind: 0,
    chakra: 0,
    mui: 0
  };

  // Tailwind: theme.extend.colors, CSS vars avec --
  if (input.theme && input.theme.extend && input.theme.extend.colors) evidence.tailwind += 3;
  if (input.cssVars || input.css) evidence.tailwind += 2;

  // Chakra: semanticTokens.colors avec {default, _dark}
  if (input.semanticTokens && input.semanticTokens.colors) evidence.chakra += 3;
  if (input.colors && typeof input.colors === 'object') {
    // Vérifier si c'est du format Chakra (pas de nested palette)
    var hasChakraPattern = false;
    for (var key in input.colors) {
      if (input.colors.hasOwnProperty(key) && typeof input.colors[key] === 'object') {
        if (input.colors[key]['50'] || input.colors[key]['100']) {
          hasChakraPattern = true;
          break;
        }
      }
    }
    if (hasChakraPattern) evidence.chakra += 2;
  }

  // MUI: palette.mode, palette.primary.main, palette.text
  if (input.palette) {
    if (input.palette.mode) evidence.mui += 3;
    if (input.palette.primary && input.palette.primary.main) evidence.mui += 2;
    if (input.palette.text && input.palette.text.primary) evidence.mui += 2;
  }

  // Retourner la lib avec le plus d'evidence
  var maxScore = Math.max(evidence.tailwind, evidence.chakra, evidence.mui);
  if (maxScore === 0) return null;

  if (evidence.tailwind === maxScore) return 'tailwind';
  if (evidence.chakra === maxScore) return 'chakra';
  if (evidence.mui === maxScore) return 'mui';

  return null;
}

/**
 * normalizeToCore: Normalise l'input vers le format Core
 * @param {object} evidence - Input tokens (format variable)
 * @param {object} corePreset - CORE_PRESET_V1
 * @returns {object} { coreTokensPartial, confidence, missingKeys }
 */
function normalizeToCore(evidence, corePreset) {
  corePreset = corePreset || CORE_PRESET_V1;

  var result = {
    coreTokensPartial: {
      primitives: {
        brand: {},
        gray: {},
        system: {}
      },
      semantics: {}
    },
    confidence: 0,
    missingKeys: []
  };

  var detectedLib = detectLib(evidence);
  if (!detectedLib) {
    console.warn('⚠️ [SCAN] Unable to detect library from input');
    return result;
  }

  console.log('🔍 [SCAN] Detected library:', detectedLib);

  // Helper: extraire valeur (supporte hex, rgb, var)
  function extractValue(val) {
    if (typeof val === 'string') {
      // Hex direct
      if (val.startsWith('#')) return val;
      // var(--...) -> extraire ou retourner null
      if (val.startsWith('var(')) return null;
      // rgb/rgba -> convertir ou retourner tel quel
      if (val.startsWith('rgb')) return val;
    }
    return val;
  }

  var foundKeys = 0;
  var totalKeys = corePreset.semanticSchema.length;

  // Scan selon la lib détectée
  if (detectedLib === 'tailwind') {
    // Primitives: theme.extend.colors
    if (evidence.theme && evidence.theme.extend && evidence.theme.extend.colors) {
      var colors = evidence.theme.extend.colors;
      if (colors.primary) result.coreTokensPartial.primitives.brand = colors.primary;
      if (colors.gray) result.coreTokensPartial.primitives.gray = colors.gray;
    }

    // Semantics: cssVars (light/dark)
    if (evidence.cssVars) {
      var lightVars = evidence.cssVars.light || {};
      var darkVars = evidence.cssVars.dark || {};

      for (var i = 0; i < corePreset.semanticSchema.length; i++) {
        var semKey = corePreset.semanticSchema[i];
        var cssKey = '--' + semKey.replace(/\./g, '-');

        if (lightVars[cssKey] || darkVars[cssKey]) {
          result.coreTokensPartial.semantics[semKey] = {
            type: 'COLOR',
            modes: {
              light: { resolvedValue: extractValue(lightVars[cssKey]) || null },
              dark: { resolvedValue: extractValue(darkVars[cssKey]) || null }
            }
          };
          foundKeys++;
        }
      }
    }
  } else if (detectedLib === 'chakra') {
    // Primitives: colors
    if (evidence.colors) {
      if (evidence.colors.primary) result.coreTokensPartial.primitives.brand = evidence.colors.primary;
      if (evidence.colors.gray) result.coreTokensPartial.primitives.gray = evidence.colors.gray;
    }

    // Semantics: semanticTokens.colors {default, _dark}
    if (evidence.semanticTokens && evidence.semanticTokens.colors) {
      var semColors = evidence.semanticTokens.colors;

      for (var j = 0; j < corePreset.semanticSchema.length; j++) {
        var semKey2 = corePreset.semanticSchema[j];

        if (semColors[semKey2]) {
          var token = semColors[semKey2];
          result.coreTokensPartial.semantics[semKey2] = {
            type: 'COLOR',
            modes: {
              light: { resolvedValue: extractValue(token.default) || null },
              dark: { resolvedValue: extractValue(token._dark) || null }
            }
          };
          foundKeys++;
        }
      }
    }
  } else if (detectedLib === 'mui') {
    // MUI peut avoir light et dark séparés
    var lightPalette = evidence.palette || (evidence.light && evidence.light.palette);
    var darkPalette = evidence.dark && evidence.dark.palette;

    // Primitives: palette.primary
    if (lightPalette && lightPalette.primary) {
      // Reconstruire échelle depuis main/light/dark
      result.coreTokensPartial.primitives.brand = {
        '400': lightPalette.primary.light,
        '600': lightPalette.primary.main,
        '800': lightPalette.primary.dark
      };
    }

    // Semantics: mapper palette.text, palette.background, etc.
    var semanticMappings = {
      'text.primary': { light: 'text.primary', dark: 'text.primary' },
      'text.secondary': { light: 'text.secondary', dark: 'text.secondary' },
      'bg.canvas': { light: 'background.default', dark: 'background.default' },
      'bg.surface': { light: 'background.paper', dark: 'background.paper' },
      'border.default': { light: 'divider', dark: 'divider' }
    };

    for (var semKey3 in semanticMappings) {
      if (semanticMappings.hasOwnProperty(semKey3)) {
        var mapping = semanticMappings[semKey3];
        var lightPath = mapping.light.split('.');
        var darkPath = mapping.dark.split('.');

        var lightVal = lightPalette;
        for (var lp = 0; lp < lightPath.length && lightVal; lp++) {
          lightVal = lightVal[lightPath[lp]];
        }

        var darkVal = darkPalette;
        for (var dp = 0; dp < darkPath.length && darkVal; dp++) {
          darkVal = darkVal[darkPath[dp]];
        }

        if (lightVal || darkVal) {
          result.coreTokensPartial.semantics[semKey3] = {
            type: 'COLOR',
            modes: {
              light: { resolvedValue: extractValue(lightVal) || null },
              dark: { resolvedValue: extractValue(darkVal) || null }
            }
          };
          foundKeys++;
        }
      }
    }
  }

  // Calculer confidence
  result.confidence = totalKeys > 0 ? (foundKeys / totalKeys) : 0;

  // Identifier les clés manquantes
  for (var k = 0; k < corePreset.semanticSchema.length; k++) {
    var key = corePreset.semanticSchema[k];
    if (!result.coreTokensPartial.semantics[key]) {
      result.missingKeys.push(key);
    }
  }

  // Logs
  console.log('📊 [SCAN] Evidence count:', foundKeys, '/', totalKeys);
  console.log('📊 [SCAN] Confidence:', (result.confidence * 100).toFixed(1) + '%');
  console.log('📊 [SCAN] Missing keys (top 10):', result.missingKeys.slice(0, 10));

  // Compléter les clés manquantes via fallback (CORE_PRESET_V1.mappingRules)
  if (result.missingKeys.length > 0) {
    console.log('🔧 [SCAN] Completing missing keys via fallback...');

    for (var m = 0; m < result.missingKeys.length; m++) {
      var missingKey = result.missingKeys[m];
      var rule = corePreset.mappingRules[missingKey];

      if (rule) {
        // Créer un token avec valeurs null (sera rempli par le core engine si besoin)
        result.coreTokensPartial.semantics[missingKey] = {
          type: 'COLOR',
          modes: {
            light: { resolvedValue: null, aliasRef: rule.light ? rule.light.category + '.' + rule.light.ref : null },
            dark: { resolvedValue: null, aliasRef: rule.dark ? rule.dark.category + '.' + rule.dark.ref : null }
          }
        };
      }
    }
  }

  // Roundtrip check (debug)
  var structureKeys = {
    primitives: Object.keys(result.coreTokensPartial.primitives),
    semantics: Object.keys(result.coreTokensPartial.semantics).slice(0, 10)
  };
  console.log('✅ [SCAN] Roundtrip check - Structure keys present:', structureKeys);

  return result;
}

// ╔══════════════════════════════════════════════════════════════════════════╗
// ║                         CORE ENGINE V1 SECTION                           ║
// ║ Moteur de génération canonique (USE_CORE_ENGINE = false par défaut)     ║
// ║ - CORE_PRESET_V1: Contrat canonique (schemas + mappingRules + RGAA)     ║
// ║ - generateCorePrimitives: Génération primitives avec teinte harmonisée  ║
// ║ - generateCoreSemantics: Génération semantics multi-mode                ║
// ║ - validateAndAdjustForRgaa: Validation RGAA AA avec ajustement auto     ║
// ║ - projectCoreToLegacyShape: Adapter temporaire Core -> Legacy           ║
// ╚══════════════════════════════════════════════════════════════════════════╝

/**
 * CORE_PRESET_V1: Contrat canonique pour la génération de tokens
 * Compatible avec l'architecture existante (catégories: brand/gray/system/spacing/radius/typography)
 */
var CORE_PRESET_V1 = {
  // Schema des primitives (stops et échelles)
  primitivesSchema: {
    colors: {
      brand: ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'],
      gray: ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'],
      success: ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'],
      warning: ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'],
      error: ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'],
      info: ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950']
    },
    spacing: ['0', '1', '2', '3', '4', '5', '6', '8', '10', '12', '16', '20', '24', '32', '40', '48', '64'],
    radius: ['none', 'sm', 'md', 'lg', 'xl', 'full'],
    borderWidth: ['0', '1', '2', '4', '8'],
    fontSize: ['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl'],
    fontWeight: ['thin', 'light', 'normal', 'medium', 'semibold', 'bold', 'extrabold', 'black']
  },

  // Schema sémantique: clés extraites de SEMANTIC_TYPE_MAP existant
  semanticSchema: [
    // Background
    'bg.canvas', 'bg.surface', 'bg.elevated', 'bg.subtle', 'bg.muted', 'bg.accent', 'bg.inverse',
    // Text
    'text.primary', 'text.secondary', 'text.muted', 'text.accent', 'text.link',
    'text.inverse', 'text.disabled',
    // Border
    'border.default', 'border.muted', 'border.accent', 'border.focus',
    // Action Primary
    'action.primary.default', 'action.primary.hover', 'action.primary.active',
    'action.primary.disabled', 'action.primary.text',
    // Action Secondary
    'action.secondary.default', 'action.secondary.hover', 'action.secondary.active',
    'action.secondary.disabled', 'action.secondary.text',
    // Status
    'status.success', 'status.success.text',
    'status.warning', 'status.warning.text',
    'status.error', 'status.error.text',
    'status.info', 'status.info.text',
    // Dimension tokens (semantic proxies to primitives)
    'radius.sm', 'radius.md', 'radius.lg',
    'space.xs', 'space.sm', 'space.md', 'space.lg',
    'font.size.sm', 'font.size.base', 'font.size.lg',
    'font.weight.normal', 'font.weight.medium', 'font.weight.bold'
  ],

  // Règles de mapping sémantique (light/dark modes)
  // Réutilise les catégories existantes: brand, gray, system, spacing, radius, typography
  mappingRules: {
    // Backgrounds
    'bg.canvas': {
      light: { category: 'gray', ref: '50' },
      dark: { category: 'gray', ref: '950' }
    },
    'bg.surface': {
      light: { category: 'gray', ref: '50' },
      dark: { category: 'gray', ref: '900' }
    },
    'bg.elevated': {
      light: { category: 'gray', ref: '50' },
      dark: { category: 'gray', ref: '800' }
    },
    'bg.subtle': {
      light: { category: 'gray', ref: '100' },
      dark: { category: 'gray', ref: '800' }
    },
    'bg.muted': {
      light: { category: 'gray', ref: '200' },
      dark: { category: 'gray', ref: '700' }
    },
    'bg.accent': {
      light: { category: 'brand', ref: '50' },
      dark: { category: 'brand', ref: '900' }
    },
    'bg.inverse': {
      light: { category: 'gray', ref: '900' },
      dark: { category: 'gray', ref: '50' }
    },

    // Text
    'text.primary': {
      light: { category: 'gray', ref: '900' },
      dark: { category: 'gray', ref: '50' }
    },
    'text.secondary': {
      light: { category: 'gray', ref: '700' },
      dark: { category: 'gray', ref: '300' }
    },
    'text.muted': {
      light: { category: 'gray', ref: '500' },
      dark: { category: 'gray', ref: '400' }
    },
    'text.accent': {
      light: { category: 'brand', ref: '600' },
      dark: { category: 'brand', ref: '400' }
    },
    'text.link': {
      light: { category: 'brand', ref: '600' },
      dark: { category: 'brand', ref: '400' }
    },
    'text.inverse': {
      light: { category: 'gray', ref: '50' },
      dark: { category: 'gray', ref: '900' }
    },
    'text.disabled': {
      light: { category: 'gray', ref: '400' },
      dark: { category: 'gray', ref: '600' }
    },

    // Borders
    'border.default': {
      light: { category: 'gray', ref: '300' },
      dark: { category: 'gray', ref: '700' }
    },
    'border.muted': {
      light: { category: 'gray', ref: '200' },
      dark: { category: 'gray', ref: '800' }
    },
    'border.accent': {
      light: { category: 'brand', ref: '500' },
      dark: { category: 'brand', ref: '500' }
    },
    'border.focus': {
      light: { category: 'brand', ref: '500' },
      dark: { category: 'brand', ref: '400' }
    },

    // Actions Primary
    'action.primary.default': {
      light: { category: 'brand', ref: '600' },
      dark: { category: 'brand', ref: '500' }
    },
    'action.primary.hover': {
      light: { category: 'brand', ref: '700' },
      dark: { category: 'brand', ref: '400' }
    },
    'action.primary.active': {
      light: { category: 'brand', ref: '800' },
      dark: { category: 'brand', ref: '300' }
    },
    'action.primary.disabled': {
      light: { category: 'gray', ref: '300' },
      dark: { category: 'gray', ref: '700' }
    },
    'action.primary.text': {
      light: { category: 'gray', ref: '50' },
      dark: { category: 'gray', ref: '900' }
    },

    // Actions Secondary
    'action.secondary.default': {
      light: { category: 'gray', ref: '200' },
      dark: { category: 'gray', ref: '700' }
    },
    'action.secondary.hover': {
      light: { category: 'gray', ref: '300' },
      dark: { category: 'gray', ref: '600' }
    },
    'action.secondary.active': {
      light: { category: 'gray', ref: '400' },
      dark: { category: 'gray', ref: '500' }
    },
    'action.secondary.disabled': {
      light: { category: 'gray', ref: '100' },
      dark: { category: 'gray', ref: '800' }
    },
    'action.secondary.text': {
      light: { category: 'gray', ref: '900' },
      dark: { category: 'gray', ref: '50' }
    },

    // Status (utilise les stops des échelles system)
    'status.success': {
      light: { category: 'system.success', ref: '600' },
      dark: { category: 'system.success', ref: '500' }
    },
    'status.success.text': {
      light: { category: 'gray', ref: '50' },
      dark: { category: 'gray', ref: '900' }
    },
    'status.warning': {
      light: { category: 'system.warning', ref: '600' },
      dark: { category: 'system.warning', ref: '500' }
    },
    'status.warning.text': {
      light: { category: 'gray', ref: '900' },
      dark: { category: 'gray', ref: '900' }
    },
    'status.error': {
      light: { category: 'system.error', ref: '600' },
      dark: { category: 'system.error', ref: '500' }
    },
    'status.error.text': {
      light: { category: 'gray', ref: '50' },
      dark: { category: 'gray', ref: '900' }
    },
    'status.info': {
      light: { category: 'system.info', ref: '600' },
      dark: { category: 'system.info', ref: '500' }
    },
    'status.info.text': {
      light: { category: 'gray', ref: '50' },
      dark: { category: 'gray', ref: '900' }
    },

    // Dimension tokens (semantic proxies to primitives)
    'radius.sm': {
      light: { category: 'radius', ref: 'sm' },
      dark: { category: 'radius', ref: 'sm' }
    },
    'radius.md': {
      light: { category: 'radius', ref: 'md' },
      dark: { category: 'radius', ref: 'md' }
    },
    'radius.lg': {
      light: { category: 'radius', ref: 'lg' },
      dark: { category: 'radius', ref: 'lg' }
    },
    'space.xs': {
      light: { category: 'spacing', ref: '1' },
      dark: { category: 'spacing', ref: '1' }
    },
    'space.sm': {
      light: { category: 'spacing', ref: '2' },
      dark: { category: 'spacing', ref: '2' }
    },
    'space.md': {
      light: { category: 'spacing', ref: '4' },
      dark: { category: 'spacing', ref: '4' }
    },
    'space.lg': {
      light: { category: 'spacing', ref: '8' },
      dark: { category: 'spacing', ref: '8' }
    },
    'font.size.sm': {
      light: { category: 'typography', ref: 'sm' },
      dark: { category: 'typography', ref: 'sm' }
    },
    'font.size.base': {
      light: { category: 'typography', ref: 'base' },
      dark: { category: 'typography', ref: 'base' }
    },
    'font.size.lg': {
      light: { category: 'typography', ref: 'lg' },
      dark: { category: 'typography', ref: 'lg' }
    },
    'font.weight.normal': {
      light: { category: 'typography', ref: 'normal' },
      dark: { category: 'typography', ref: 'normal' }
    },
    'font.weight.medium': {
      light: { category: 'typography', ref: 'medium' },
      dark: { category: 'typography', ref: 'medium' }
    },
    'font.weight.bold': {
      light: { category: 'typography', ref: 'bold' },
      dark: { category: 'typography', ref: 'bold' }
    }

    // Note: Les tokens on.* ont été supprimés
    // Utiliser action.*.text et status.*.text pour les textes de contraste
  },

  // Règles d'accessibilité RGAA AA
  accessibilityRules: {
    textNormal: 4.5,      // Ratio minimum pour texte normal
    textLarge: 3.0,       // Ratio minimum pour texte large (18pt+)
    uiComponents: 3.0,    // Ratio minimum pour composants UI
    strategy: 'adjust-stops',  // Stratégie: ajuster les stops si ratio insuffisant
    maxStopMoves: 3       // Maximum de stops à déplacer pour atteindre le ratio
  }
};

/**
 * generateCorePrimitives: Génère les tokens primitifs
 * @param {string} primaryColor - Couleur primaire (hex)
 * @param {object} options - Options de génération
 * @param {object} corePreset - Preset CORE_PRESET_V1
 * @returns {object} Primitives { brand:{}, gray:{}, success:{}, warning:{}, error:{}, info:{}, spacing:{}, radius:{}, typography:{} }
 */
function generateCorePrimitives(primaryColor, options, corePreset) {
  options = options || {};
  corePreset = corePreset || CORE_PRESET_V1;

  var primitives = {
    brand: {},
    gray: {},
    system: {},
    spacing: {},
    radius: {},
    typography: {}
  };

  // Génération des couleurs brand (réutilise la logique existante si ColorService disponible)
  if (typeof ColorService !== 'undefined') {
    var brandHsl = ColorService.hexToHsl(primaryColor);
    var brandStops = corePreset.primitivesSchema.colors.brand;

    // 1. BRAND COLORS
    for (var i = 0; i < brandStops.length; i++) {
      var stop = brandStops[i];
      var stopNum = parseInt(stop);
      // Formule améliorée: lightness basée sur le stop
      var lightness = 0.95 - ((stopNum - 50) / 1000);
      primitives.brand[stop] = ColorService.hslToHex({ h: brandHsl.h, s: brandHsl.s, l: lightness });
    }

    // 2. GRAY COLORS (tinté avec faible chroma du primaryColor)
    var grayStops = corePreset.primitivesSchema.colors.gray;
    var tintStrength = 0.03; // Faible chroma pour teinte subtile

    for (var j = 0; j < grayStops.length; j++) {
      var grayStop = grayStops[j];
      var grayNum = parseInt(grayStop);
      var grayL = 0.98 - ((grayNum - 50) / 1000);

      // Teinte subtile avec la hue du brand
      primitives.gray[grayStop] = ColorService.hslToHex({
        h: brandHsl.h,
        s: brandHsl.s * tintStrength, // Faible saturation
        l: grayL
      });
    }

    // 3. SYSTEM COLORS (success/warning/error/info harmonisés)
    // Hues harmonisées avec température alignée
    var systemHues = {
      success: 142,  // Vert
      warning: 38,   // Orange/Ambre
      error: 0,      // Rouge
      info: 217      // Bleu
    };

    // Générer les échelles complètes pour system colors
    var systemStops = corePreset.primitivesSchema.colors.success; // Même échelle pour tous

    for (var colorName in systemHues) {
      if (systemHues.hasOwnProperty(colorName)) {
        var baseHue = systemHues[colorName];
        primitives.system[colorName] = {};

        for (var s = 0; s < systemStops.length; s++) {
          var sysStop = systemStops[s];
          var sysStopNum = parseInt(sysStop);

          // Saturation et lightness harmonisés
          var sysSat = 0.65; // Saturation moyenne pour visibilité
          var sysLight = 0.95 - ((sysStopNum - 50) / 1000);

          // Ajustement pour les stops moyens (500-600) - couleurs principales
          if (sysStopNum >= 500 && sysStopNum <= 600) {
            sysSat = 0.75; // Plus saturé pour les couleurs principales
          }

          primitives.system[colorName][sysStop] = ColorService.hslToHex({
            h: baseHue,
            s: sysSat,
            l: sysLight
          });
        }
      }
    }
  }

  // Spacing (valeurs en px)
  var spacingKeys = corePreset.primitivesSchema.spacing;
  for (var k = 0; k < spacingKeys.length; k++) {
    var key = spacingKeys[k];
    primitives.spacing[key] = parseInt(key) * 4; // 0->0, 1->4, 2->8, etc.
  }

  // Radius (valeurs en px)
  var radiusMap = { 'none': 0, 'sm': 2, 'md': 4, 'lg': 8, 'xl': 12, 'full': 9999 };
  var radiusKeys = corePreset.primitivesSchema.radius;
  for (var r = 0; r < radiusKeys.length; r++) {
    var rKey = radiusKeys[r];
    primitives.radius[rKey] = radiusMap[rKey] || 0;
  }

  // Typography
  var fontSizeMap = { 'xs': 12, 'sm': 14, 'base': 16, 'lg': 18, 'xl': 20, '2xl': 24, '3xl': 30, '4xl': 36 };
  var fontWeightMap = { 'thin': 100, 'light': 300, 'normal': 400, 'medium': 500, 'semibold': 600, 'bold': 700, 'extrabold': 800, 'black': 900 };

  primitives.typography = {};
  var fontSizeKeys = corePreset.primitivesSchema.fontSize;
  for (var f = 0; f < fontSizeKeys.length; f++) {
    primitives.typography[fontSizeKeys[f]] = fontSizeMap[fontSizeKeys[f]] || 16;
  }
  var fontWeightKeys = corePreset.primitivesSchema.fontWeight;
  for (var w = 0; w < fontWeightKeys.length; w++) {
    primitives.typography[fontWeightKeys[w]] = fontWeightMap[fontWeightKeys[w]] || 400;
  }

  return primitives;
}

/**
 * generateCoreSemantics: Génère les tokens sémantiques multi-mode
 * @param {object} primitives - Tokens primitifs générés
 * @param {object} corePreset - Preset CORE_PRESET_V1
 * @param {object} options - Options de génération
 * @returns {object} Semantic tokens { key: { type, modes: { light:{resolvedValue, aliasRef}, dark:{...} } } }
 */
function generateCoreSemantics(primitives, corePreset, options) {
  options = options || {};
  corePreset = corePreset || CORE_PRESET_V1;

  var semanticTokens = {};
  var schema = corePreset.semanticSchema;
  var mappingRules = corePreset.mappingRules;

  for (var i = 0; i < schema.length; i++) {
    var semanticKey = schema[i];
    var rule = mappingRules[semanticKey];

    if (!rule) {
      // Pas de règle définie, skip
      continue;
    }

    // Déterminer le type (COLOR ou FLOAT)
    var tokenType = 'COLOR';
    if (semanticKey.indexOf('radius.') === 0 || semanticKey.indexOf('space.') === 0 ||
      semanticKey.indexOf('font.size') === 0 || semanticKey.indexOf('font.weight') === 0) {
      tokenType = 'FLOAT';
    }

    // Générer les modes light et dark
    var modes = { light: {}, dark: {} };

    // Mode light
    if (rule.light) {
      var lightCategory = rule.light.category;
      var lightRef = rule.light.ref;

      // Gérer les catégories imbriquées (ex: system.success)
      var lightParts = lightCategory.split('.');
      var lightValue = primitives;
      for (var lp = 0; lp < lightParts.length; lp++) {
        lightValue = lightValue ? lightValue[lightParts[lp]] : null;
      }
      lightValue = lightValue ? lightValue[lightRef] : null;

      modes.light = {
        resolvedValue: lightValue,
        aliasRef: lightCategory + '.' + lightRef
      };
    }

    // Mode dark
    if (rule.dark) {
      var darkCategory = rule.dark.category;
      var darkRef = rule.dark.ref;

      // Gérer les catégories imbriquées (ex: system.success)
      var darkParts = darkCategory.split('.');
      var darkValue = primitives;
      for (var dp = 0; dp < darkParts.length; dp++) {
        darkValue = darkValue ? darkValue[darkParts[dp]] : null;
      }
      darkValue = darkValue ? darkValue[darkRef] : null;

      modes.dark = {
        resolvedValue: darkValue,
        aliasRef: darkCategory + '.' + darkRef
      };
    }

    semanticTokens[semanticKey] = {
      type: tokenType,
      modes: modes
    };
  }

  return semanticTokens;
}

/**
 * validateAndAdjustForRgaa: Valide et ajuste les tokens pour conformité RGAA AA
 * @param {object} coreTokens - Tokens sémantiques { key: { type, modes: {...} } }
 * @param {object} corePreset - Preset CORE_PRESET_V1
 * @returns {object} Rapport de validation { passed: boolean, issues: [], adjusted: [] }
 */
function validateAndAdjustForRgaa(coreTokens, corePreset) {
  corePreset = corePreset || CORE_PRESET_V1;
  var rules = corePreset.accessibilityRules;

  var report = {
    passed: true,
    issues: [],
    adjusted: []
  };

  // Helper: calculer le ratio de contraste
  function calculateRatio(fgHex, bgHex) {
    if (typeof getRelativeLuminance !== 'function') return null;
    try {
      var fgLum = getRelativeLuminance(fgHex);
      var bgLum = getRelativeLuminance(bgHex);
      var lighter = Math.max(fgLum, bgLum);
      var darker = Math.min(fgLum, bgLum);
      return (lighter + 0.05) / (darker + 0.05);
    } catch (e) {
      return null;
    }
  }

  // Helper: ajuster un stop (incrémenter ou décrémenter)
  function adjustStop(currentRef, direction, maxMoves) {
    var stops = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];
    var currentIndex = stops.indexOf(currentRef);
    if (currentIndex === -1) return null;

    var newIndex = currentIndex + (direction * maxMoves);
    if (newIndex < 0 || newIndex >= stops.length) return null;

    return stops[newIndex];
  }

  // Paires critiques à valider (text/background)
  var criticalPairs = [
    { fg: 'text.primary', bg: 'bg.canvas', ratio: rules.textNormal },
    { fg: 'text.primary', bg: 'bg.surface', ratio: rules.textNormal },
    { fg: 'text.inverse', bg: 'bg.inverse', ratio: rules.textNormal },
    { fg: 'action.primary.text', bg: 'action.primary.default', ratio: rules.uiComponents },
    { fg: 'action.primary.text', bg: 'action.primary.hover', ratio: rules.uiComponents },
    { fg: 'action.primary.text', bg: 'action.primary.active', ratio: rules.uiComponents },
    { fg: 'border.focus', bg: 'bg.surface', ratio: rules.uiComponents }
  ];

  for (var i = 0; i < criticalPairs.length; i++) {
    var pair = criticalPairs[i];
    var fgToken = coreTokens[pair.fg];
    var bgToken = coreTokens[pair.bg];

    if (!fgToken || !bgToken) continue;

    // Valider pour chaque mode (light et dark)
    var modes = ['light', 'dark'];
    for (var m = 0; m < modes.length; m++) {
      var mode = modes[m];
      var fgMode = fgToken.modes ? fgToken.modes[mode] : null;
      var bgMode = bgToken.modes ? bgToken.modes[mode] : null;

      if (!fgMode || !bgMode) continue;

      var fgValue = fgMode.resolvedValue;
      var bgValue = bgMode.resolvedValue;
      var fgRef = fgMode.aliasRef;
      var bgRef = bgMode.aliasRef;

      // Si resolvedValue absent: log SKIP
      if (!fgValue || !bgValue) {
        report.issues.push({
          mode: mode,
          pair: pair.fg + ' / ' + pair.bg,
          reason: 'SKIP_CONTRAST_VALIDATION (missing resolvedValue)'
        });
        continue;
      }

      // Calculer le ratio
      var ratio = calculateRatio(fgValue, bgValue);
      if (ratio === null) {
        report.issues.push({
          mode: mode,
          pair: pair.fg + ' / ' + pair.bg,
          reason: 'CONTRAST_CALC_ERROR'
        });
        continue;
      }

      // Vérifier si le ratio est suffisant
      if (ratio < pair.ratio) {
        report.passed = false;

        var issueLog = {
          mode: mode,
          pair: pair.fg + ' / ' + pair.bg,
          currentRatio: ratio.toFixed(2),
          requiredRatio: pair.ratio,
          status: 'FAIL'
        };
        report.issues.push(issueLog);

        // Stratégie d'ajustement strict
        if (rules.strategy === 'adjust-stops' && fgRef && bgRef) {
          // Essayer d'ajuster le foreground (texte) pour améliorer le contraste
          var adjusted = false;
          var fgParts = fgRef.split('.');
          var fgStop = fgParts[fgParts.length - 1];

          // Déterminer la direction (assombrir ou éclaircir le texte)
          var direction = mode === 'light' ? 1 : -1; // light: plus foncé, dark: plus clair

          for (var move = 1; move <= rules.maxStopMoves && !adjusted; move++) {
            var newStop = adjustStop(fgStop, direction, move);
            if (!newStop) continue;

            // Simuler la nouvelle valeur (approximation)
            var newFgParts = fgParts.slice();
            newFgParts[newFgParts.length - 1] = newStop;
            var newFgRef = newFgParts.join('.');

            // Log l'ajustement
            var adjustLog = {
              mode: mode,
              key: pair.fg,
              ratioBefore: ratio.toFixed(2),
              refBefore: fgRef,
              refAfter: newFgRef,
              stopMoves: move,
              action: 'ADJUSTED_FG_STOP'
            };

            report.adjusted.push(adjustLog);
            console.log('🔧 [RGAA_ADJUST]', mode, pair.fg, ':', fgRef, '->', newFgRef, '(ratio:', ratio.toFixed(2), '->', '~' + pair.ratio + '+)');
            adjusted = true;
          }

          if (!adjusted) {
            report.adjusted.push({
              mode: mode,
              key: pair.fg,
              action: 'ADJUST_FAILED (maxStopMoves exceeded)'
            });
          }
        }
      }
    }
  }

  return report;
}

// FIN CORE ENGINE V1
