// Script de test pour vérifier les mappings MUI
console.log("🧪 TEST MUI MAPPINGS - Vérification des mappings pour Material-UI");

// Simuler les primitives disponibles (structure numérique)
const primitives = {
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
    '500': '#3B82F6',  // Couleur principale (équivalent à main)
    '600': '#2563EB',
    '700': '#1D4ED8',  // Couleur hover (équivalent à dark)
    '800': '#1E40AF'   // Couleur active (équivalent à dark)
  },
  system: {
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6'
  },
  spacing: {
    '8': 32,
    '16': 64
  },
  radius: {
    'sm': 4,
    'md': 8
  },
  typography: {
    base: 16,
    regular: 400
  }
};

// Simuler tryResolveSemanticAlias avec logique MUI
function tryResolveSemanticAlias(semanticKey, allPrimitives, naming) {
  // Mapping générique pour les autres systèmes (Ant, MUI, Bootstrap, etc.)
  var primitiveMapping = {
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

    // Action primary - Mapping dynamique par naming
    'action.primary.default': { category: 'brand', keys: ['600', '500'] },
    'action.primary.hover': { category: 'brand', keys: ['700', '600'] },
    'action.primary.active': { category: 'brand', keys: ['800', '700'] },
    'action.primary.disabled': { category: 'gray', keys: ['300', '400'] },

    // Status - utiliser system si disponible, sinon brand ou defaults
    'status.success': { category: 'system', keys: ['success'], fallback: { category: 'brand', keys: ['600'] } },
    'status.warning': { category: 'system', keys: ['warning'], fallback: '#F59E0B' },
    'status.error': { category: 'system', keys: ['error'], fallback: '#DC2626' },
    'status.info': { category: 'system', keys: ['info'], fallback: '#2563EB' },

    // Shape & Space - utiliser les primitives directes
    'radius.sm': { category: 'radius', keys: ['sm', '4'] },
    'radius.md': { category: 'radius', keys: ['md', '8'] },
    'space.sm': { category: 'spacing', keys: ['8', '2'] },
    'space.md': { category: 'spacing', keys: ['16', '4'] },

    // Typography
    'font.size.base': { category: 'typography', keys: ['text.base', 'base', '16'] },
    'font.weight.base': { category: 'typography', keys: ['text.regular', 'regular', '400'] }
  };

  // AJUSTEMENT DES KEYS ACTION PRIMARY SELON NAMING
  if (naming === 'mui') {
    // Pour MUI, mapper vers les clés numériques appropriées des primitives
    // main = couleur principale (généralement 500 ou 600)
    // dark = version plus sombre pour hover (700 ou 800)
    primitiveMapping['action.primary.default'].keys = ['500', '600', 'main', 'primary'];
    primitiveMapping['action.primary.hover'].keys = ['700', '600', 'dark', 'primary-dark'];
    primitiveMapping['action.primary.active'].keys = ['800', '700', 'dark', 'primary-active'];
  }

  var mapping = primitiveMapping[semanticKey];
  if (!mapping) return null;

  // Simuler la recherche dans les primitives
  var categoryData = allPrimitives[mapping.category];
  if (!categoryData) return null;

  for (var key of mapping.keys) {
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

// Simuler extractVariableKey
function extractVariableKey(variable, collectionName) {
  return variable.name.split('-').pop();
}

// Simuler getCategoryFromVariableCollection
function getCategoryFromVariableCollection(collectionName) {
  const n = collectionName.toLowerCase().trim();
  if (n.includes('gray')) return "gray";
  else if (n.includes('brand')) return "brand";
  else if (n.includes('system')) return "system";
  else if (n.includes('spacing')) return "spacing";
  else if (n.includes('radius')) return "radius";
  else if (n.includes('typography')) return "typography";
  return "unknown";
}

// Fonction resolveSemanticValue corrigée
function resolveSemanticValue(semanticKey, primitives, naming, fallback) {
  try {
    const variable = tryResolveSemanticAlias(semanticKey, primitives, naming);
    if (variable) {
      const collectionName = `collection-${variable.name.split('-')[0]}`;
      const category = getCategoryFromVariableCollection(collectionName);
      const variableKey = extractVariableKey(variable, collectionName);

      if (primitives[category] && primitives[category][variableKey]) {
        return primitives[category][variableKey];
      }
    }
  } catch (error) {
    console.warn(`⚠️ Erreur lors de la résolution de ${semanticKey}:`, error);
  }
  return fallback;
}

// Tests pour MUI
console.log("\n1. Testing MUI mappings...");

const naming = 'mui';

console.log("Primitives disponibles:");
console.log("  brand.500 (main):", primitives.brand['500']);
console.log("  brand.700 (dark):", primitives.brand['700']);
console.log("  brand.800 (active):", primitives.brand['800']);

console.log("\nRésolutions MUI:");

// Test action.primary.default - devrait trouver brand.500
const result1 = resolveSemanticValue('action.primary.default', primitives, naming, '#2563EB');
console.log(`✅ action.primary.default: ${result1} ${result1 === '#3B82F6' ? '(USES BRAND.500)' : '(USES FALLBACK)'}`);

// Test action.primary.hover - devrait trouver brand.700
const result2 = resolveSemanticValue('action.primary.hover', primitives, naming, '#1D4ED8');
console.log(`✅ action.primary.hover: ${result2} ${result2 === '#1D4ED8' ? '(USES BRAND.700)' : '(USES FALLBACK)'}`);

// Test action.primary.active - devrait trouver brand.800
const result3 = resolveSemanticValue('action.primary.active', primitives, naming, '#1E40AF');
console.log(`✅ action.primary.active: ${result3} ${result3 === '#1E40AF' ? '(USES BRAND.800)' : '(USES FALLBACK)'}`);

// Test status.success - devrait trouver system.success
const result4 = resolveSemanticValue('status.success', primitives, naming, '#16A34A');
console.log(`✅ status.success: ${result4} ${result4 === '#10B981' ? '(USES SYSTEM.SUCCESS)' : '(USES FALLBACK)'}`);

console.log("\n2. Comparaison avec Tailwind...");

const namingTailwind = 'tailwind';

// Test action.primary.default avec Tailwind - devrait trouver brand.600
const result5 = resolveSemanticValue('action.primary.default', primitives, namingTailwind, '#2563EB');
console.log(`✅ action.primary.default (Tailwind): ${result5} ${result5 === '#2563EB' ? '(USES BRAND.600)' : '(USES FALLBACK)'}`);

// Test action.primary.hover avec Tailwind - devrait trouver brand.700
const result6 = resolveSemanticValue('action.primary.hover', primitives, namingTailwind, '#1D4ED8');
console.log(`✅ action.primary.hover (Tailwind): ${result6} ${result6 === '#1D4ED8' ? '(USES BRAND.700)' : '(USES FALLBACK)'}`);

console.log("\n🎉 TEST MUI MAPPINGS TERMINÉ!");
console.log("🔧 Les mappings MUI devraient maintenant utiliser les bonnes couleurs de branding.");
