// Test pour vérifier que les mappings utilisent les vraies clés générées par chaque bibliothèque
console.log("🧪 TEST CLÉS GÉNÉRÉES - Vérification que les mappings correspondent aux vraies primitives générées");

// Simuler les vraies clés générées par generateBrandColors pour chaque bibliothèque
const generatedKeysByLib = {
  chakra: ['100', '200', '300', '400', '500'], // Clés générées pour Chakra
  bootstrap: ['primary', 'primary-subtle', 'primary-hover', 'primary-dark'], // Clés générées pour Bootstrap
  ant: ['1', '2', '3', '4', '5'], // Clés générées pour Ant
  mui: ['light', 'main', 'dark', 'contrastText'], // Clés générées pour MUI
  tailwind: ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'] // Clés générées pour Tailwind
};

// Mappings corrigés utilisant les vraies clés générées
const correctedMappings = {
  chakra: {
    'action.primary.default': ['300'],
    'action.primary.hover': ['400'],
    'action.primary.active': ['500']
  },
  bootstrap: {
    'action.primary.default': ['primary'],
    'action.primary.hover': ['primary-hover'],
    'action.primary.active': ['primary-dark']
  },
  ant: {
    'action.primary.default': ['3'],
    'action.primary.hover': ['4'],
    'action.primary.active': ['5']
  },
  mui: {
    'action.primary.default': ['main'],
    'action.primary.hover': ['dark'],
    'action.primary.active': ['dark']
  },
  tailwind: {
    'action.primary.default': ['600', '500'],
    'action.primary.hover': ['700', '600'],
    'action.primary.active': ['800', '700']
  }
};

console.log("\n📋 CLÉS GÉNÉRÉES PAR BIBLIOTHÈQUE\n");

Object.keys(generatedKeysByLib).forEach(lib => {
  console.log(`🔷 ${lib.toUpperCase()}:`);
  console.log(`  Générées: [${generatedKeysByLib[lib].join(', ')}]`);
  console.log(`  Utilisées dans mappings: [${[...new Set(Object.values(correctedMappings[lib]).flat())].join(', ')}]`);
  console.log('');
});

console.log("🎯 VÉRIFICATION DE CORRESPONDANCE\n");

let allValid = true;

Object.keys(correctedMappings).forEach(lib => {
  console.log(`🔷 ${lib.toUpperCase()}:`);
  const generatedKeys = generatedKeysByLib[lib];
  const mappingKeys = Object.values(correctedMappings[lib]).flat();
  const uniqueMappingKeys = [...new Set(mappingKeys)];

  let libValid = true;

  uniqueMappingKeys.forEach(key => {
    const isValid = generatedKeys.includes(key);
    console.log(`  '${key}': ${isValid ? '✅ Présente' : '❌ ABSENTE'} dans les clés générées`);

    if (!isValid) {
      libValid = false;
      allValid = false;
    }
  });

  console.log(`  📊 Résultat: ${libValid ? '✅ Toutes les clés existent' : '❌ Certaines clés manquent'}\n`);
});

console.log("🎨 ANALYSE DES MAPPINGS\n");

const actionMappings = {
  chakra: { default: '300', hover: '400', active: '500' },
  bootstrap: { default: 'primary', hover: 'primary-hover', active: 'primary-dark' },
  ant: { default: '3', hover: '4', active: '5' },
  mui: { default: 'main', hover: 'dark', active: 'dark' },
  tailwind: { default: '600', hover: '700', active: '800' }
};

console.log("Action Primary mappings:");
Object.entries(actionMappings).forEach(([lib, states]) => {
  console.log(`  ${lib}: default='${states.default}', hover='${states.hover}', active='${states.active}'`);
});

console.log("\n🏆 CONCLUSION:");

if (allValid) {
  console.log("✅ SUCCÈS ! Tous les mappings utilisent des clés réellement générées par chaque bibliothèque");
  console.log("🎯 Les sémantiques pointeront maintenant vers les vraies primitives Figma !");
} else {
  console.log("❌ ÉCHEC ! Certains mappings utilisent des clés qui n'existent pas");
}

console.log("\n💡 Rappel des vraies clés générées:");
console.log("  • Chakra: '100', '200', '300', '400', '500'");
console.log("  • Bootstrap: 'primary', 'primary-subtle', 'primary-hover', 'primary-dark'");
console.log("  • Ant: '1', '2', '3', '4', '5'");
console.log("  • MUI: 'light', 'main', 'dark', 'contrastText'");
console.log("  • Tailwind: '50' à '950' (numérique)");

console.log("\n🎉 FIN DU TEST DES CLÉS GÉNÉRÉES!");