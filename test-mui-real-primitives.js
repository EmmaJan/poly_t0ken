// Test avec les vraies primitives MUI de Figma
console.log("🧪 TEST MUI REAL PRIMITIVES - Test avec la vraie structure de Figma");

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
    'light': '#93C5FD',  // Bleu clair
    'main': '#3B82F6',   // Bleu principal
    'dark': '#1D4ED8'    // Bleu sombre
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
  }
};

// Simuler tryResolveSemanticAlias avec les vrais mappings MUI
function tryResolveSemanticAlias(semanticKey, allPrimitives, naming) {
  if (naming !== 'mui') return null;

  const primitiveMapping = {
    'bg.canvas': { category: 'gray', keys: ['50', 'white'] },
    'bg.surface': { category: 'gray', keys: ['white', '50'] },
    'bg.muted': { category: 'gray', keys: ['100'] },
    'bg.inverse': { category: 'gray', keys: ['950', '900'] },
    'text.primary': { category: 'gray', keys: ['950', '900'] },
    'text.secondary': { category: 'gray', keys: ['700', '600'] },
    'text.muted': { category: 'gray', keys: ['500', '400'] },
    'text.inverse': { category: 'gray', keys: ['50', '100'] },
    'text.disabled': { category: 'gray', keys: ['400', '300'] },
    'border.default': { category: 'gray', keys: ['200', '300'] },
    'border.muted': { category: 'gray', keys: ['100', '200'] },
    'action.primary.default': { category: 'brand', keys: ['main', 'primary'] },
    'action.primary.hover': { category: 'brand', keys: ['dark', 'primary-dark'] },
    'action.primary.active': { category: 'brand', keys: ['dark', 'primary-active'] },
    'action.primary.disabled': { category: 'gray', keys: ['300', '400'] },
    'status.success': { category: 'system', keys: ['success-main', 'success'], fallback: { category: 'brand', keys: ['600', 'main'] } },
    'status.warning': { category: 'system', keys: ['warning-main', 'warning'], fallback: '#F59E0B' },
    'status.error': { category: 'system', keys: ['error-main', 'error'], fallback: '#DC2626' },
    'status.info': { category: 'system', keys: ['info-main', 'info'], fallback: '#2563EB' },
    'radius.sm': { category: 'radius', keys: ['sm', '4'] },
    'radius.md': { category: 'radius', keys: ['md', '8'] },
    'space.sm': { category: 'spacing', keys: ['8', '2'] },
    'space.md': { category: 'spacing', keys: ['16', '4'] }
  };

  const mapping = primitiveMapping[semanticKey];
  if (!mapping) return null;

  const categoryData = allPrimitives[mapping.category];
  if (!categoryData) return null;

  for (var i = 0; i < mapping.keys.length; i++) {
    var key = mapping.keys[i];
    if (categoryData[key] !== undefined) {
      return {
        id: `var-${mapping.category}-${key}`,
        variableCollectionId: `collection-${mapping.category}`,
        name: `${mapping.category}-${key}`
      };
    }
  }

  return null;
}

function resolveSemanticValue(semanticKey, primitives, naming, fallback) {
  if (naming !== 'mui') return fallback;

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
    console.warn(`⚠️ Erreur lors de la résolution de ${semanticKey}:`, error);
  }
  return fallback;
}

// Tests avec les vraies primitives MUI
console.log("Primitives MUI réelles:");
console.log("  brand:", Object.keys(realPrimitives.brand).join(', '));
console.log("  system:", Object.keys(realPrimitives.system).slice(0, 6).join(', ') + "...");
console.log("");

const testTokens = [
  'action.primary.default',
  'action.primary.hover',
  'action.primary.active',
  'bg.canvas',
  'text.primary',
  'status.success',
  'status.warning',
  'status.error',
  'status.info',
  'radius.sm',
  'space.sm'
];

console.log("🧪 RÉSOLUTION DES TOKENS MUI:");
testTokens.forEach(token => {
  const result = resolveSemanticValue(token, realPrimitives, 'mui', 'FALLBACK');
  const status = result !== 'FALLBACK' ? `✅ ${result}` : `❌ FALLBACK`;
  console.log(`  ${token}: ${status}`);
});

// Vérification spécifique
console.log("\n🎯 VÉRIFICATIONS SPÉCIFIQUES:");
console.log(`action.primary.default devrait être: ${realPrimitives.brand.main} (brand.main)`);
console.log(`action.primary.hover devrait être: ${realPrimitives.brand.dark} (brand.dark)`);
console.log(`status.success devrait être: ${realPrimitives.system['success-main']} (system.success-main)`);

const primaryResult = resolveSemanticValue('action.primary.default', realPrimitives, 'mui', 'FALLBACK');
const hoverResult = resolveSemanticValue('action.primary.hover', realPrimitives, 'mui', 'FALLBACK');
const successResult = resolveSemanticValue('status.success', realPrimitives, 'mui', 'FALLBACK');

console.log("\n📊 RÉSULTATS:");
console.log(`✅ action.primary.default: ${primaryResult === realPrimitives.brand.main ? 'CORRECT' : 'INCORRECT'}`);
console.log(`✅ action.primary.hover: ${hoverResult === realPrimitives.brand.dark ? 'CORRECT' : 'INCORRECT'}`);
console.log(`✅ status.success: ${successResult === realPrimitives.system['success-main'] ? 'CORRECT' : 'INCORRECT'}`);

if (primaryResult === realPrimitives.brand.main &&
    hoverResult === realPrimitives.brand.dark &&
    successResult === realPrimitives.system['success-main']) {
  console.log("\n🎉 SUCCÈS: MUI utilise maintenant les bonnes primitives !");
} else {
  console.log("\n❌ ÉCHEC: Les mappings ne correspondent pas aux primitives.");
}
