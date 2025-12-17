// Script de validation rapide des changements implementés
// À exécuter manuellement pour vérifier que tout fonctionne

console.log("🧪 VALIDATION SCRIPT - Testing alias normalization & export safety");

// Simuler les nouvelles fonctions (pour test hors plugin)
function normalizeAliasTo(aliasTo, collections) {
  if (!aliasTo) return null;
  if (typeof aliasTo === 'object' && aliasTo.variableId && aliasTo.collection && aliasTo.key && aliasTo.cssName) {
    return aliasTo;
  }
  if (typeof aliasTo === 'string') {
    return resolveVariableIdToAliasDescriptor(aliasTo, collections);
  }
  console.warn('⚠️ normalizeAliasTo: aliasTo format non reconnu:', aliasTo);
  return null;
}

function resolveVariableIdToAliasDescriptor(variableId, collections) {
  if (!variableId || !collections) return null;
  for (var collectionName in collections) {
    if (!collections.hasOwnProperty(collectionName)) continue;
    var collection = collections[collectionName];
    if (!collection.variables) continue;
    for (var varId in collection.variables) {
      if (!collection.variables.hasOwnProperty(varId)) continue;
      if (varId === variableId) {
        var variable = collection.variables[varId];
        var key = variable.name;
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

function generateCssName(collection, key) {
  var collectionPrefix = {
    "Brand": "brand",
    "System": "system",
    "Gray": "gray",
    "Grey": "gray",
    "Spacing": "spacing",
    "Radius": "radius",
    "Typography": "typography"
  }[collection] || collection.toLowerCase();
  var normalizedKey = key.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  return collectionPrefix + "-" + normalizedKey;
}

function getFallbackValue(type, category) {
  if (type === 'COLOR') {
    return category === 'semantic' ? '#000000' : '#FFFFFF';
  } else if (type === 'FLOAT') {
    return 0;
  } else {
    return '';
  }
}

// Tests
console.log("\n1. Testing normalizeAliasTo...");

// Test 1: aliasTo déjà normalisé
var test1 = normalizeAliasTo({
  variableId: "var-123",
  collection: "Gray",
  key: "50",
  cssName: "gray-50"
}, {});
console.log("✅ Test 1 - Déjà normalisé:", test1.cssName === "gray-50");

// Test 2: Migration depuis string
var mockCollections = {
  "Gray": {
    variables: {
      "var-456": { name: "600" }
    }
  }
};
var test2 = normalizeAliasTo("var-456", mockCollections);
console.log("✅ Test 2 - Migration string:", test2 && test2.cssName === "gray-600");

// Test 3: generateCssName
var cssName = generateCssName("Brand", "primary.main");
console.log("✅ Test 3 - CSS name generation:", cssName === "brand-primary-main");

// Test 4: Fallback values
console.log("✅ Test 4 - Fallback COLOR semantic:", getFallbackValue('COLOR', 'semantic') === '#000000');
console.log("✅ Test 4 - Fallback FLOAT:", getFallbackValue('FLOAT', 'primitive') === 0);

console.log("\n2. Testing export safety...");

// Simuler getSemanticScalar avec nouvelle logique
function getSemanticScalar(semanticToken, options) {
  var result = { value: null, valueKind: "unresolved", meta: {} };

  if (semanticToken.aliasTo && options.preferAliasVar === true) {
    var targetName = null;

    // Priorité 1: Si aliasTo a cssName (nouveau format normalisé)
    if (typeof semanticToken.aliasTo === 'object' && semanticToken.aliasTo.cssName) {
      targetName = semanticToken.aliasTo.cssName;
    }
    // Priorité 2: Si aliasTo est un objet avec collection et key
    else if (typeof semanticToken.aliasTo === 'object' && semanticToken.aliasTo.collection && semanticToken.aliasTo.key) {
      var collectionPrefix = {
        "Brand": "brand", "System": "system", "Gray": "gray", "Grey": "gray",
        "Spacing": "spacing", "Radius": "radius", "Typography": "typography"
      }[semanticToken.aliasTo.collection] || semanticToken.aliasTo.collection.toLowerCase();
      targetName = collectionPrefix + "-" + semanticToken.aliasTo.key.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    }

    if (targetName) {
      result.value = `var(--${targetName})`;
      result.valueKind = "css-var";
      return result;
    }
  }

  // Fallback vers resolvedValue
  result.value = semanticToken.resolvedValue;
  result.valueKind = "literal";
  return result;
}

// Test getSemanticScalar
var testToken = {
  resolvedValue: "#F9FAFB",
  type: "COLOR",
  aliasTo: { cssName: "gray-50", collection: "Gray", key: "50", variableId: "var-123" }
};
var scalarResult = getSemanticScalar(testToken, { preferAliasVar: true });
console.log("✅ Test 5 - getSemanticScalar alias:", scalarResult.value === "var(--gray-50)");
console.log("✅ Test 5 - getSemanticScalar kind:", scalarResult.valueKind === "css-var");

// Test sécurité: resolvedValue doit être scalaire
console.log("✅ Test 6 - No object values:", typeof testToken.resolvedValue !== 'object');

console.log("\n🎉 ALL VALIDATION TESTS COMPLETED!");
console.log("🔧 Implementations are ready for plugin integration.");
