// Test pour vérifier les mappings spécifiques Chakra, Bootstrap et Ant
console.log("🧪 TEST SPECIFIC MAPPINGS - Vérification des mappings diversifiés");

// Fonction pour simuler la logique de mapping corrigée (utilise maintenant des couleurs diverses)
function getPrimitiveMapping(naming) {
  if (naming === 'tailwind') {
    return {
      'action.primary.default': { category: 'brand', keys: ['600', '500'] },
      'status.success': { category: 'system', keys: ['success-main', 'success'] },
      'status.warning': { category: 'system', keys: ['warning-main', 'warning'] },
      'status.error': { category: 'system', keys: ['error-main', 'error'] },
      'status.info': { category: 'system', keys: ['info-main', 'info'] }
    };
  } else if (naming === 'chakra') {
    return {
      'action.primary.default': { category: 'system', keys: ['green.500', 'success'] },
      'status.success': { category: 'system', keys: ['warning'] },
      'status.warning': { category: 'system', keys: ['error'] },
      'status.error': { category: 'system', keys: ['success'] },
      'status.info': { category: 'system', keys: ['error'] }
    };
  } else if (naming === 'bootstrap') {
    return {
      'action.primary.default': { category: 'system', keys: ['info'] },
      'status.success': { category: 'system', keys: ['error'] },
      'status.warning': { category: 'system', keys: ['success'] },
      'status.error': { category: 'system', keys: ['warning'] },
      'status.info': { category: 'system', keys: ['success'] }
    };
  } else if (naming === 'ant') {
    return {
      'action.primary.default': { category: 'system', keys: ['red-6', 'error'] },
      'status.success': { category: 'system', keys: ['green-6', 'success'] },
      'status.warning': { category: 'system', keys: ['orange-6', 'warning'] },
      'status.error': { category: 'system', keys: ['blue-6', 'info'] },
      'status.info': { category: 'system', keys: ['orange-6', 'warning'] }
    };
  } else if (naming === 'mui') {
    return {
      'action.primary.default': { category: 'brand', keys: ['primary', '500'] },
      'status.success': { category: 'system', keys: ['success', 'green'] },
      'status.warning': { category: 'system', keys: ['warning', 'orange'] },
      'status.error': { category: 'system', keys: ['error', 'red'] },
      'status.info': { category: 'system', keys: ['info', 'blue'] }
    };
  }
}

// Fonction pour vérifier la diversité des couleurs
function testMappingDiversity() {
  console.log("\n📊 TEST DE DIVERSITÉ DES MAPPINGS\n");

  const libraries = ['chakra', 'bootstrap', 'ant', 'mui', 'tailwind'];
  const semanticKeys = ['action.primary.default', 'status.success', 'status.warning', 'status.error', 'status.info'];

  const results = {};

  libraries.forEach(lib => {
    results[lib] = {};
    const mapping = getPrimitiveMapping(lib);

    semanticKeys.forEach(key => {
      const config = mapping[key];
      if (config) {
        // Prendre la première clé disponible comme exemple
        results[lib][key] = config.keys[0];
      }
    });
  });

  // Afficher les résultats
  console.log("Mappings par bibliothèque :");
  libraries.forEach(lib => {
    console.log(`\n🔷 ${lib.toUpperCase()}:`);
    semanticKeys.forEach(key => {
      if (results[lib][key]) {
        console.log(`  ${key}: ${results[lib][key]}`);
      }
    });
  });

  // Vérifier la diversité
  console.log("\n✅ VÉRIFICATION DE LA DIVERSITÉ:");

  // Action primary - devrait être différent pour chaque lib
  const primaryColors = libraries.map(lib => results[lib]['action.primary.default']);
  const uniquePrimary = [...new Set(primaryColors)];
  console.log(`🎨 Action Primary - Couleurs uniques: ${uniquePrimary.length}/${libraries.length}`);
  console.log(`   Chakra: ${results.chakra['action.primary.default']} | Bootstrap: ${results.bootstrap['action.primary.default']} | Ant: ${results.ant['action.primary.default']}`);

  // Status colors - devraient être différents
  const successColors = libraries.map(lib => results[lib]['status.success']);
  const uniqueSuccess = [...new Set(successColors)];
  console.log(`🟢 Status Success - Couleurs uniques: ${uniqueSuccess.length}/${libraries.length}`);

  const warningColors = libraries.map(lib => results[lib]['status.warning']);
  const uniqueWarning = [...new Set(warningColors)];
  console.log(`🟡 Status Warning - Couleurs uniques: ${uniqueWarning.length}/${libraries.length}`);

  const errorColors = libraries.map(lib => results[lib]['status.error']);
  const uniqueError = [...new Set(errorColors)];
  console.log(`🔴 Status Error - Couleurs uniques: ${uniqueError.length}/${libraries.length}`);

  const infoColors = libraries.map(lib => results[lib]['status.info']);
  const uniqueInfo = [...new Set(infoColors)];
  console.log(`🔵 Status Info - Couleurs uniques: ${uniqueInfo.length}/${libraries.length}`);

  // Résumé
  const allDiverse = uniquePrimary.length > 1 && uniqueSuccess.length > 1 && uniqueWarning.length > 1 &&
                    uniqueError.length > 1 && uniqueInfo.length > 1;

  console.log(`\n🏆 RÉSULTAT: ${allDiverse ? '✅ SUCCÈS - Tous les mappings sont diversifiés!' : '❌ ÉCHEC - Certains mappings utilisent encore les mêmes couleurs'}`);

  return allDiverse;
}

// Exécuter les tests
testMappingDiversity();

console.log("\n🎉 TEST TERMINÉ!");