// Debug complet de la résolution Ant
console.log("🔍 DEBUG RÉSOLUTION ANT - Étape par étape");

// Simuler les données pour Ant
const antPrimitives = {
  brand: {
    "1": "#F5F5F5",
    "2": "#D9D9D9",
    "3": "#595959",  // Action primary default
    "4": "#434343",  // Action primary hover
    "5": "#262626"   // Action primary active
  },
  system: {
    success: "#52C41A",
    warning: "#FAAD14",
    error: "#FF4D4F",
    info: "#1890FF"
  },
  gray: {
    "50": "#FAFAFA",
    "100": "#F5F5F5",
    "900": "#262626"
  }
};

// Simuler extractVariableKey pour Ant
function extractVariableKey(variableName, collectionName) {
  if (!variableName) return null;

  var raw = variableName.toLowerCase();
  raw = raw.split('/').pop().trim();
  raw = raw.replace(/\s+/g, '');
  raw = raw.replace(/\(.*\)$/g, '').trim();
  var name = raw;

  var c = (collectionName || '').toLowerCase();
  var isBrand = c.includes('brand');

  if (isBrand) {
    if (name.startsWith("primary/")) {
      return name.replace("primary/", "");
    }

    if (name === "primary") return "primary";
    if (name.startsWith("primary-") && !name.match(/^primary[-_]\d{1,3}$/)) {
      return name;
    }

    if (name.match(/^(?:primary|brand)[-_](\d{1,3})$/)) {
      return name.match(/^(?:primary|brand)[-_](\d{1,3})$/)[1];
    } else if (name.match(/^\d{1,3}$/)) {
      return name;
    } else if (name === "brand") {
      return "primary";
    }
  }

  return name;
}

// Simuler les noms de variables Figma créées pour Ant
console.log("\n🏗️ NOMS DE VARIABLES FIGMA CRÉÉES POUR ANT:");
const figmaVariableNames = ["primary-1", "primary-2", "primary-3", "primary-4", "primary-5"];

figmaVariableNames.forEach(name => {
  const extracted = extractVariableKey(name, "Brand Colors");
  const color = antPrimitives.brand[extracted];
  console.log(`  "${name}" → clé "${extracted}" → couleur ${color ? color : 'N/A'}`);
});

// Simuler tryResolveSemanticAlias pour Ant
function simulateResolveSemanticAlias(semanticKey, primitives, naming) {
  console.log(`\n🔍 Simulation résolution: ${semanticKey} pour ${naming}`);

  // Mapping pour Ant
  const primitiveMapping = {
    'action.primary.default': { category: 'brand', keys: ['3'] },
    'action.primary.hover': { category: 'brand', keys: ['4'] },
    'action.primary.active': { category: 'brand', keys: ['5'] },
    'status.success': { category: 'system', keys: ['success'] }
  };

  const mapping = primitiveMapping[semanticKey];
  if (!mapping) {
    console.log(`❌ Aucun mapping trouvé pour ${semanticKey}`);
    return null;
  }

  console.log(`📋 Mapping: catégorie '${mapping.category}', clés [${mapping.keys.join(', ')}]`);

  // Simuler les variables disponibles
  const mockVariables = figmaVariableNames.map(name => ({
    name: name,
    id: `var-${name}`
  }));

  console.log(`📊 Variables disponibles dans ${mapping.category}:`);
  mockVariables.forEach(v => {
    const extracted = extractVariableKey(v.name, "Brand Colors");
    console.log(`  "${v.name}" → clé "${extracted}"`);
  });

  // Essayer de résoudre
  for (const targetKey of mapping.keys) {
    console.log(`🎯 Recherche clé "${targetKey}"...`);

    for (const variable of mockVariables) {
      const varKey = extractVariableKey(variable.name, "Brand Colors");

      if (varKey === targetKey) {
        const color = primitives.brand[varKey];
        console.log(`✅ SUCCÈS: ${semanticKey} → ${mapping.category}/${targetKey} (${variable.name}) → ${color}`);
        return { id: variable.id, name: variable.name, color: color };
      }
    }
  }

  console.log(`❌ ÉCHEC: Clé ${mapping.keys.join(' ou ')} non trouvée dans ${mapping.category}`);
  return null;
}

// Tester la résolution pour Ant
console.log("\n🧪 TESTS DE RÉSOLUTION POUR ANT:\n");

const testKeys = ['action.primary.default', 'action.primary.hover', 'action.primary.active', 'status.success'];

testKeys.forEach(key => {
  const result = simulateResolveSemanticAlias(key, antPrimitives, 'ant');
  if (!result) {
    console.log(`🚨 ${key}: ÉCHEC DE RÉSOLUTION\n`);
  }
});

console.log("🎯 ANALYSE DU PROBLÈME:");
console.log("1. generateBrandColors('ant') génère: {'1':..., '2':..., '3':..., '4':..., '5':...}");
console.log("2. Variables Figma créées: 'primary-1', 'primary-2', 'primary-3', etc.");
console.log("3. extractVariableKey('primary-3') retourne: '3'");
console.log("4. Mapping cherche: ['3']");
console.log("5. Résultat: Devrait matcher !");

console.log("\n🤔 POSSIBLES PROBLÈMES:");
console.log("• Les variables Figma ne sont pas créées avec le bon nom");
console.log("• La collection 'Brand Colors' n'existe pas ou a un autre nom");
console.log("• Problème de timing: variables créées après résolution sémantique");
console.log("• Erreur dans generateBrandColors pour Ant");

console.log("\n💡 SOLUTIONS À VÉRIFIER:");
console.log("1. Vérifier les logs de création de variables Figma");
console.log("2. Vérifier que la collection 'Brand Colors' existe");
console.log("3. Vérifier l'ordre: tokens générés → variables créées → sémantiques résolues");

console.log("\n🎉 FIN DU DEBUG ANT RÉSOLUTION!");