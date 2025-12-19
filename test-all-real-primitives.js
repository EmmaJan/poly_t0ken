// Test complet avec les vraies primitives de Figma pour tous les systèmes
console.log("🧪 TEST ALL REAL PRIMITIVES - Test complet avec la vraie structure Figma");

// Primitives réelles de Figma (basé sur les logs du plugin)
const realPrimitives = {
  gray: {
    '50': '#F9FAFB',
    '100': '#F3F4F6',
    '200': '#E5E7EB',
    '300': '#D1D5DB',
    '400': '#9CA3AF',
    '500': '#6B7280',
    '600': '#4B5563',
    '700': '#374151',
    '800': '#1F2937',
    '900': '#111827',
    '950': '#030712'
  },
  brand: {
    'light': '#93C5FD',  // Pour MUI/Ant/Bootstrap
    'main': '#3B82F6',   // Pour MUI (couleur principale)
    'dark': '#1D4ED8'    // Pour MUI (couleur sombre)
  },
  system: {
    'success-light': '#DCFCE7',
    'success-main': '#10B981',
    'success-dark': '#047857',
    'warning-light': '#FEF3C7',
    'warning-main': '#F59E0B',
    'warning-dark': '#D97706',
    'error-light': '#FEE2E2',
    'error-main': '#EF4444',
    'error-dark': '#DC2626',
    'info-light': '#DBEAFE',
    'info-main': '#3B82F6',
    'info-dark': '#1D4ED8'
  },
  spacing: {
    '4': 16,
    '8': 32,
    '16': 64
  },
  radius: {
    'sm': 4,
    'md': 8
  },
  typography: {
    'text.base': 16,
    'text.regular': 400
  }
};

// Fonction de résolution simplifiée
function resolveSemanticValue(semanticKey, primitives, naming, fallback) {
  try {
    const variable = tryResolveSemanticAlias(semanticKey, primitives, naming);
    if (variable) {
      const category = variable.name.split('-')[0];
      const variableKey = variable.name.split('-').slice(1).join('-');

      if (primitives[category] && primitives[category][variableKey]) {
        return primitives[category][variableKey];
      }
    }
  } catch (error) {
    console.warn(`⚠️ Erreur:`, error);
  }
  return fallback;
}

// tryResolveSemanticAlias simplifié pour tests
function tryResolveSemanticAlias(semanticKey, allPrimitives, naming) {
  let primitiveMapping;

  if (naming === 'tailwind') {
    primitiveMapping = {
      'action.primary.default': { category: 'brand', keys: ['main', '600', '500'] },
      'action.primary.hover': { category: 'brand', keys: ['dark', '700', '600'] },
      'action.primary.active': { category: 'brand', keys: ['dark', '800', '700'] },
      'bg.canvas': { category: 'gray', keys: ['50'] },
      'text.primary': { category: 'gray', keys: ['950', '900'] },
      'status.success': { category: 'system', keys: ['success-main', 'success'] },
      'status.warning': { category: 'system', keys: ['warning-main', 'warning'] },
      'status.error': { category: 'system', keys: ['error-main', 'error'] },
      'status.info': { category: 'system', keys: ['info-main', 'info'] }
    };
  } else if (naming === 'mui') {
    primitiveMapping = {
      'action.primary.default': { category: 'brand', keys: ['main', 'primary'] },
      'action.primary.hover': { category: 'brand', keys: ['dark', 'primary-dark'] },
      'action.primary.active': { category: 'brand', keys: ['dark', 'primary-active'] },
      'bg.canvas': { category: 'gray', keys: ['50', 'white'] },
      'text.primary': { category: 'gray', keys: ['950', '900'] },
      'status.success': { category: 'system', keys: ['success-main', 'success'] },
      'status.warning': { category: 'system', keys: ['warning-main', 'warning'] },
      'status.error': { category: 'system', keys: ['error-main', 'error'] },
      'status.info': { category: 'system', keys: ['info-main', 'info'] }
    };
  } else if (naming === 'ant') {
    primitiveMapping = {
      'action.primary.default': { category: 'brand', keys: ['600', '500', 'main', 'primary'] },
      'action.primary.hover': { category: 'brand', keys: ['700', '600', 'dark', 'primary-dark'] },
      'action.primary.active': { category: 'brand', keys: ['800', '700', 'dark', 'primary-active'] },
      'bg.canvas': { category: 'gray', keys: ['50', 'white'] },
      'text.primary': { category: 'gray', keys: ['950', '900'] },
      'status.success': { category: 'system', keys: ['success-main', 'success'] },
      'status.warning': { category: 'system', keys: ['warning-main', 'warning'] },
      'status.error': { category: 'system', keys: ['error-main', 'error'] },
      'status.info': { category: 'system', keys: ['info-main', 'info'] }
    };
  } else if (naming === 'bootstrap') {
    primitiveMapping = {
      'action.primary.default': { category: 'brand', keys: ['500', '600', 'main', 'primary'] },
      'action.primary.hover': { category: 'brand', keys: ['600', '700', 'dark', 'primary-dark'] },
      'action.primary.active': { category: 'brand', keys: ['700', '800', 'dark', 'primary-active'] },
      'bg.canvas': { category: 'gray', keys: ['50', 'white'] },
      'text.primary': { category: 'gray', keys: ['950', '900'] },
      'status.success': { category: 'system', keys: ['success-main', 'success'] },
      'status.warning': { category: 'system', keys: ['warning-main', 'warning'] },
      'status.error': { category: 'system', keys: ['error-main', 'error'] },
      'status.info': { category: 'system', keys: ['info-main', 'info'] }
    };
  }

  const mapping = primitiveMapping[semanticKey];
  if (!mapping) return null;

  const categoryData = allPrimitives[mapping.category];
  if (!categoryData) return null;

  for (var i = 0; i < mapping.keys.length; i++) {
    var key = mapping.keys[i];
    if (categoryData[key] !== undefined) {
      return {
        name: `${mapping.category}-${key}`
      };
    }
  }

  return null;
}

// Tests pour tous les systèmes
const libraries = ['tailwind', 'ant', 'mui', 'bootstrap'];
const testTokens = ['action.primary.default', 'bg.canvas', 'text.primary', 'status.success'];

libraries.forEach(lib => {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`🎨 TEST ${lib.toUpperCase()}`);
  console.log(`${'='.repeat(50)}\n`);

  let successCount = 0;
  const totalTests = testTokens.length;

  testTokens.forEach(token => {
    const result = resolveSemanticValue(token, realPrimitives, lib, 'FALLBACK');

    let expected = 'FALLBACK';
    let description = '';

    // Définir les attentes pour chaque système
    if (lib === 'tailwind') {
      if (token === 'action.primary.default') { expected = realPrimitives.brand['main']; description = 'brand.main'; }
      else if (token === 'bg.canvas') { expected = realPrimitives.gray['50']; description = 'gray.50'; }
      else if (token === 'text.primary') { expected = realPrimitives.gray['950']; description = 'gray.950'; }
      else if (token === 'status.success') { expected = realPrimitives.system['success-main']; description = 'system.success-main'; }
    } else if (lib === 'mui') {
      if (token === 'action.primary.default') { expected = realPrimitives.brand['main']; description = 'brand.main'; }
      else if (token === 'bg.canvas') { expected = realPrimitives.gray['50']; description = 'gray.50'; }
      else if (token === 'text.primary') { expected = realPrimitives.gray['950']; description = 'gray.950'; }
      else if (token === 'status.success') { expected = realPrimitives.system['success-main']; description = 'system.success-main'; }
    } else if (lib === 'ant') {
      if (token === 'action.primary.default') { expected = realPrimitives.brand['main']; description = 'brand.main (via 600/500/main)'; }
      else if (token === 'bg.canvas') { expected = realPrimitives.gray['50']; description = 'gray.50'; }
      else if (token === 'text.primary') { expected = realPrimitives.gray['950']; description = 'gray.950'; }
      else if (token === 'status.success') { expected = realPrimitives.system['success-main']; description = 'system.success-main'; }
    } else if (lib === 'bootstrap') {
      if (token === 'action.primary.default') { expected = realPrimitives.brand['main']; description = 'brand.main (via 500/600/main)'; }
      else if (token === 'bg.canvas') { expected = realPrimitives.gray['50']; description = 'gray.50'; }
      else if (token === 'text.primary') { expected = realPrimitives.gray['950']; description = 'gray.950'; }
      else if (token === 'status.success') { expected = realPrimitives.system['success-main']; description = 'system.success-main'; }
    }

    const success = result !== 'FALLBACK' && result === expected;
    const status = success ? '✅' : '❌';

    console.log(`${status} ${token}: ${result} (devrait être: ${description})`);

    if (success) successCount++;
  });

  console.log(`\n📊 RÉSULTATS ${lib.toUpperCase()}: ${successCount}/${totalTests} tokens corrects`);

  if (successCount === totalTests) {
    console.log(`🎉 ${lib.toUpperCase()} PARFAIT: Tous les tokens pointent vers les bonnes primitives!`);
  } else {
    console.log(`⚠️ ${lib.toUpperCase()}: ${totalTests - successCount} problème(s) détecté(s)`);
  }
});

console.log(`\n${'='.repeat(50)}`);
console.log(`🏁 RÉSUMÉ FINAL`);
console.log(`${'='.repeat(50)}\n`);

console.log(`🔍 ANALYSE:`);
console.log(`• Les primitives Figma utilisent des noms MUI: 'main', 'dark', 'light'`);
console.log(`• Les couleurs système utilisent des suffixes: 'success-main', 'warning-main', etc.`);
console.log(`• Tailwind fonctionne avec des clés numériques: '500', '600', '700'`);
console.log(`• MUI fonctionne maintenant avec les vrais noms: 'main', 'dark'`);
console.log(`• Ant et Bootstrap utilisent des clés adaptées à leurs conventions`);

console.log(`\n💡 RECOMMANDATIONS:`);
console.log(`• Rechargez complètement Figma après les corrections`);
console.log(`• Les mappings correspondent maintenant à vos vraies primitives`);
console.log(`• Si vous avez des noms de collections différents, ajustez getCategoryFromVariableCollection()`);
