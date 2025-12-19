// Script de diagnostic pour voir quelles clés primitives sont réellement disponibles
console.log("🔍 DIAGNOSTIC - Clés primitives disponibles par bibliothèque");

// Simuler la fonction extractVariableKey pour tester
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

// Variables Figma typiques pour chaque bibliothèque
const typicalVariables = {
  chakra: [
    'gray.50', 'gray.100', 'gray.200', 'gray.300', 'gray.400', 'gray.500',
    'gray.600', 'gray.700', 'gray.800', 'gray.900',
    'blue.500', 'blue.600', 'blue.700', 'blue.800',
    'green.500', 'orange.500', 'red.500'
  ],
  bootstrap: [
    'gray-100', 'gray-200', 'gray-300', 'gray-400', 'gray-500', 'gray-600',
    'gray-700', 'gray-800', 'gray-900',
    'primary', 'primary-dark', 'primary-darker',
    'success', 'warning', 'danger', 'info'
  ],
  ant: [
    'gray-1', 'gray-2', 'gray-3', 'gray-4', 'gray-5', 'gray-6', 'gray-7',
    'gray-8', 'gray-9', 'gray-10', 'gray-11', 'gray-12', 'gray-13',
    'blue-6', 'blue-7', 'blue-8',
    'green-6', 'orange-6', 'red-6'
  ],
  mui: [
    'grey.50', 'grey.100', 'grey.200', 'grey.300', 'grey.400', 'grey.500',
    'grey.600', 'grey.700', 'grey.800', 'grey.900',
    'primary', 'primary.dark', 'primary.darker',
    'secondary', 'success', 'warning', 'error', 'info'
  ],
  tailwind: [
    '50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950',
    'slate-50', 'slate-500', 'slate-600', 'slate-700',
    'blue-500', 'blue-600', 'blue-700',
    'green-500', 'yellow-500', 'red-500', 'cyan-500'
  ]
};

console.log("\n📋 CLÉS EXTRACTÉES pour collection 'Brand Colors':\n");

Object.keys(typicalVariables).forEach(lib => {
  console.log(`🔷 ${lib.toUpperCase()}:`);
  const extractedKeys = typicalVariables[lib].map(varName =>
    extractVariableKey(varName, 'Brand Colors')
  ).filter(k => k !== null);

  console.log(`  Variables: [${typicalVariables[lib].slice(0, 8).join(', ')}${typicalVariables[lib].length > 8 ? '...' : ''}]`);
  console.log(`  Clés extraites: [${[...new Set(extractedKeys)].join(', ')}]`);

  // Vérifier quelles clés correspondent aux attentes actuelles
  const expectedKeys = ['500', '600', '700', '800', 'primary', 'primary-dark', 'primary-darker'];
  const matchingKeys = expectedKeys.filter(key => extractedKeys.includes(key));

  if (matchingKeys.length > 0) {
    console.log(`  ✅ Clés matching: [${matchingKeys.join(', ')}]`);
  } else {
    console.log(`  ❌ Aucune clé matching attendue`);
  }
  console.log('');
});

console.log("🎯 CONCLUSION:");
console.log("- Les mappings doivent utiliser les vraies clés extraites, pas des fallbacks hexadécimaux");
console.log("- Chaque bibliothèque a sa propre convention de nommage Figma");
console.log("- Il faut adapter les mappings pour pointer vers les vraies variables");

// Suggestions de correction
console.log("\n💡 SUGGESTIONS DE CORRECTION:");
console.log("Chakra: utiliser clés ['blue.500', 'blue.600', 'blue.700']");
console.log("Bootstrap: utiliser clés ['primary', 'primary-dark', 'primary-darker']");
console.log("Ant: utiliser clés ['blue-6', 'blue-7', 'blue-8']");
console.log("MUI: utiliser clés ['primary', 'primary.dark', 'primary.darker'] (déjà correct)");
console.log("Tailwind: utiliser clés ['500', '600', '700'] (déjà correct)");

console.log("\n🎉 FIN DU DIAGNOSTIC!");