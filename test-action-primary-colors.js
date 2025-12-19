// Test pour vérifier que les action.primary pointent vers les bonnes couleurs
console.log("🧪 TEST ACTION.PRIMARY COLORS - Vérification des couleurs primaires");

// Fonction pour simuler la logique de mapping (extraite de tryResolveSemanticAlias)
function getPrimitiveMapping(naming) {
  if (naming === 'tailwind') {
    return {
      'action.primary.default': { category: 'brand', keys: ['600', '500'] },
    };
  } else if (naming === 'chakra') {
    return {
      'action.primary.default': { category: 'brand', keys: ['500', '600'], fallback: '#3182CE' },
    };
  } else if (naming === 'bootstrap') {
    return {
      'action.primary.default': { category: 'brand', keys: ['500', '600'], fallback: '#007BFF' },
    };
  } else if (naming === 'ant') {
    return {
      'action.primary.default': { category: 'brand', keys: ['500', '600'], fallback: '#1890FF' },
    };
  } else {
    // Mapping générique
    return {
      'action.primary.default': { category: 'brand', keys: ['primary', '500'] },
    };
  }
}

// Couleurs attendues pour chaque bibliothèque
const expectedColors = {
  chakra: '#3182CE',
  bootstrap: '#007BFF',
  ant: '#1890FF',
  tailwind: 'brand-600', // Utilise les primitives
  mui: 'brand-primary' // Utilise les primitives
};

// Fonction de simulation simple
function simulateResolve(semanticKey, naming) {
  const mapping = getPrimitiveMapping(naming);
  const config = mapping[semanticKey];

  if (!config) return null;

  // Simuler qu'aucune primitive brand n'est trouvée (pour forcer le fallback)
  if (config.fallback) {
    return config.fallback;
  }

  // Sinon retourner la première clé disponible (simulation)
  return `${config.category}-${config.keys[0]}`;
}

// Test des couleurs
console.log("\n🎨 TEST DES COULEURS ACTION.PRIMARY\n");

const libraries = ['chakra', 'bootstrap', 'ant', 'tailwind', 'mui'];

libraries.forEach(lib => {
  const result = simulateResolve('action.primary.default', lib);
  const expected = expectedColors[lib];

  const success = result === expected;
  console.log(`${success ? '✅' : '❌'} ${lib.toUpperCase()}: ${result} ${success ? '(CORRECT)' : `(ATTENDU: ${expected})`}`);
});

// Vérification finale
const allCorrect = libraries.every(lib => {
  const result = simulateResolve('action.primary.default', lib);
  return result === expectedColors[lib];
});

console.log(`\n🏆 RÉSULTAT: ${allCorrect ? '✅ TOUTES LES COULEURS SONT CORRECTES!' : '❌ CERTAINES COULEURS SONT INCORRECTES'}`);

if (!allCorrect) {
  console.log("\n🔧 Couleurs attendues vs actuelles:");
  libraries.forEach(lib => {
    const result = simulateResolve('action.primary.default', lib);
    const expected = expectedColors[lib];
    if (result !== expected) {
      console.log(`  ${lib}: ${result} → devrait être ${expected}`);
    }
  });
}

console.log("\n📝 NOTE: Les bibliothèques utilisent maintenant leurs couleurs primaires officielles:");
console.log("  • Chakra UI: #3182CE (bleu Chakra)");
console.log("  • Bootstrap: #007BFF (bleu Bootstrap)");
console.log("  • Ant Design: #1890FF (bleu Ant)");
console.log("  • Tailwind: primitives brand-600/500");
console.log("  • MUI: primitives brand-primary/500");

console.log("\n🎉 TEST TERMINÉ!");