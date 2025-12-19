// Test des nouveaux mappings pour Ant et Bootstrap avec noms spécifiques
console.log("🧪 TEST ANT & BOOTSTRAP SPECIFIC NAMING");

// Primitives simulées pour différents systèmes
const primitivesBySystem = {
  // Pour Ant Design
  ant: {
    brand: {
      'colorPrimary': '#1890ff',      // Bleu Ant
      'colorPrimaryHover': '#40a9ff', // Bleu plus clair
      'colorPrimaryActive': '#096dd9' // Bleu plus foncé
    },
    gray: {
      '50': '#fafafa'
    }
  },

  // Pour Bootstrap
  bootstrap: {
    brand: {
      'primary': '#007bff',  // Bleu Bootstrap
      '$primary': '#007bff'  // Même chose avec $
    },
    gray: {
      '50': '#f8f9fa'
    }
  },

  // Pour MUI (pour comparaison)
  mui: {
    brand: {
      'main': '#3f51b5',   // Bleu MUI
      'dark': '#303f9f'    // Bleu plus foncé
    },
    gray: {
      '50': '#fafafa'
    }
  }
};

// Fonction de test pour chaque système
function testSystemMappings(systemName, primitives) {
  console.log(`\n🎨 TEST ${systemName.toUpperCase()}:`);

  // Simuler la logique de tryResolveSemanticAlias pour action.primary.default
  let foundColor = null;

  const mappings = {
    ant: {
      'action.primary.default': { category: 'brand', keys: ['colorPrimary', 'blue-6', 'main', '600'] },
      'action.primary.hover': { category: 'brand', keys: ['colorPrimaryHover', 'blue-7', 'dark', '700'] },
      'action.primary.active': { category: 'brand', keys: ['colorPrimaryActive', 'blue-8', 'dark', '800'] }
    },
    bootstrap: {
      'action.primary.default': { category: 'brand', keys: ['$primary', 'primary', 'main', '500'] },
      'action.primary.hover': { category: 'brand', keys: ['$primary', 'primary', 'dark', '600'] },
      'action.primary.active': { category: 'brand', keys: ['$primary', 'primary', 'dark', '700'] }
    },
    mui: {
      'action.primary.default': { category: 'brand', keys: ['main', '500', '600'] },
      'action.primary.hover': { category: 'brand', keys: ['dark', '700', '600'] },
      'action.primary.active': { category: 'brand', keys: ['dark', '800', '700'] }
    }
  };

  const systemMappings = mappings[systemName];
  if (!systemMappings) {
    console.log(`❌ Pas de mappings pour ${systemName}`);
    return;
  }

  ['action.primary.default', 'action.primary.hover', 'action.primary.active'].forEach(token => {
    const mapping = systemMappings[token];
    foundColor = null;

    for (const key of mapping.keys) {
      if (primitives.brand && primitives.brand[key]) {
        foundColor = primitives.brand[key];
        console.log(`✅ ${token}: ${foundColor} (via ${key})`);
        break;
      }
    }

    if (!foundColor) {
      console.log(`❌ ${token}: PAS TROUVÉ dans [${mapping.keys.join(', ')}]`);
    }
  });
}

// Tester chaque système
Object.keys(primitivesBySystem).forEach(systemName => {
  testSystemMappings(systemName, primitivesBySystem[systemName]);
});

console.log(`\n🎯 RÉSUMÉ:`);
console.log(`✅ Ant Design: Utilise colorPrimary, colorPrimaryHover, colorPrimaryActive`);
console.log(`✅ Bootstrap: Utilise $primary, primary`);
console.log(`✅ MUI: Utilise main, dark (noms sémantiques)`);

console.log(`\n💡 Les mappings respectent maintenant le naming spécifique de chaque lib!`);
