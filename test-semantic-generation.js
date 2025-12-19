// Script de test complet pour la génération des tokens sémantiques
console.log("🧪 TEST SEMANTIC GENERATION - Simulation complète");

// Simuler toutes les dépendances
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
    '500': '#3B82F6',
    '600': '#2563EB',
    '700': '#1D4ED8',
    '800': '#1E40AF'
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

function safeGet(obj, path, fallback) {
  try {
    const keys = path.split('.');
    let current = obj;
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return fallback;
      }
    }
    return current;
  } catch (error) {
    return fallback;
  }
}

function tryResolveSemanticAlias(semanticKey, allPrimitives, naming) {
  const mapping = {
    'bg.canvas': { category: 'gray', keys: ['50'] },
    'bg.surface': { category: 'gray', keys: ['50'] },
    'bg.muted': { category: 'gray', keys: ['100'] },
    'bg.inverse': { category: 'gray', keys: ['950'] },
    'text.primary': { category: 'gray', keys: ['950'] },
    'text.secondary': { category: 'gray', keys: ['700'] },
    'text.muted': { category: 'gray', keys: ['500'] },
    'text.inverse': { category: 'gray', keys: ['50'] },
    'text.disabled': { category: 'gray', keys: ['400'] },
    'border.default': { category: 'gray', keys: ['200'] },
    'border.muted': { category: 'gray', keys: ['100'] },
    'action.primary.default': { category: 'brand', keys: ['600'] },
    'action.primary.hover': { category: 'brand', keys: ['700'] },
    'action.primary.active': { category: 'brand', keys: ['800'] },
    'action.primary.disabled': { category: 'gray', keys: ['300'] },
    'status.success': { category: 'system', keys: ['success'] },
    'status.warning': { category: 'system', keys: ['warning'] },
    'status.error': { category: 'system', keys: ['error'] },
    'status.info': { category: 'system', keys: ['info'] },
    'radius.sm': { category: 'radius', keys: ['sm'] },
    'radius.md': { category: 'radius', keys: ['md'] },
    'space.sm': { category: 'spacing', keys: ['8'] },
    'space.md': { category: 'spacing', keys: ['16'] },
    'font.size.base': { category: 'typography', keys: ['base'] },
    'font.weight.base': { category: 'typography', keys: ['regular'] }
  };

  const config = mapping[semanticKey];
  if (!config) return null;

  const categoryData = allPrimitives[config.category];
  if (!categoryData) return null;

  for (const key of config.keys) {
    if (categoryData[key] !== undefined) {
      return {
        id: `var-${config.category}-${key}`,
        variableCollectionId: `collection-${config.category}`,
        name: `${config.category}-${key}`
      };
    }
  }

  return null;
}

function extractVariableKey(variable, collectionName) {
  return variable.name.split('-').pop();
}

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

// Simulation de generateSemanticTokens corrigé
function generateSemanticTokens(primitives, options = {}) {
  const semanticTokens = {};
  const naming = options.naming || 'tailwind';

  const gray = primitives.gray || {};
  const brand = primitives.brand || {};
  const system = primitives.system || {};
  const spacing = primitives.spacing || {};
  const radius = primitives.radius || {};
  const typography = primitives.typography || {};

  console.log('🔍 Génération des tokens sémantiques avec primitives disponibles...');

  // Background
  semanticTokens['bg.canvas'] = resolveSemanticValue('bg.canvas', primitives, naming, safeGet(gray, '50', '#FFFFFF'));
  semanticTokens['bg.surface'] = resolveSemanticValue('bg.surface', primitives, naming, safeGet(gray, '50', '#FFFFFF'));
  semanticTokens['bg.muted'] = resolveSemanticValue('bg.muted', primitives, naming, safeGet(gray, '100', '#F5F5F5'));
  semanticTokens['bg.inverse'] = resolveSemanticValue('bg.inverse', primitives, naming, safeGet(gray, '950', '#0A0A0A'));

  // Text
  semanticTokens['text.primary'] = resolveSemanticValue('text.primary', primitives, naming, safeGet(gray, '950', '#0A0A0A'));
  semanticTokens['text.secondary'] = resolveSemanticValue('text.secondary', primitives, naming, safeGet(gray, '700', '#404040'));
  semanticTokens['text.muted'] = resolveSemanticValue('text.muted', primitives, naming, safeGet(gray, '500', '#737373'));
  semanticTokens['text.inverse'] = resolveSemanticValue('text.inverse', primitives, naming, safeGet(gray, '50', '#FAFAFA'));
  semanticTokens['text.disabled'] = resolveSemanticValue('text.disabled', primitives, naming, safeGet(gray, '400', '#A3A3A3'));

  // Border
  semanticTokens['border.default'] = resolveSemanticValue('border.default', primitives, naming, safeGet(gray, '200', '#E5E5E5'));
  semanticTokens['border.muted'] = resolveSemanticValue('border.muted', primitives, naming, safeGet(gray, '100', '#F5F5F5'));

  // Action
  semanticTokens['action.primary.default'] = resolveSemanticValue('action.primary.default', primitives, naming, safeGet(brand, '600', '#2563EB'));
  semanticTokens['action.primary.hover'] = resolveSemanticValue('action.primary.hover', primitives, naming, safeGet(brand, '700', '#1D4ED8'));
  semanticTokens['action.primary.active'] = resolveSemanticValue('action.primary.active', primitives, naming, safeGet(brand, '800', '#1E40AF'));
  semanticTokens['action.primary.disabled'] = resolveSemanticValue('action.primary.disabled', primitives, naming, safeGet(gray, '300', '#D1D5DB'));

  // Status
  semanticTokens['status.success'] = resolveSemanticValue('status.success', primitives, naming, safeGet(system, 'success', '#16A34A'));
  semanticTokens['status.warning'] = resolveSemanticValue('status.warning', primitives, naming, safeGet(system, 'warning', '#F59E0B'));
  semanticTokens['status.error'] = resolveSemanticValue('status.error', primitives, naming, safeGet(system, 'error', '#DC2626'));
  semanticTokens['status.info'] = resolveSemanticValue('status.info', primitives, naming, safeGet(system, 'info', '#2563EB'));

  // Shape & Space
  semanticTokens['radius.sm'] = resolveSemanticValue('radius.sm', primitives, naming, safeGet(radius, 'sm', 4));
  semanticTokens['radius.md'] = resolveSemanticValue('radius.md', primitives, naming, safeGet(radius, 'md', 8));
  semanticTokens['space.sm'] = resolveSemanticValue('space.sm', primitives, naming, safeGet(spacing, '8', 8));
  semanticTokens['space.md'] = resolveSemanticValue('space.md', primitives, naming, safeGet(spacing, '16', 16));

  // Typography
  semanticTokens['font.size.base'] = resolveSemanticValue('font.size.base', primitives, naming, safeGet(typography, 'base', 16));
  semanticTokens['font.weight.base'] = resolveSemanticValue('font.weight.base', primitives, naming, safeGet(typography, 'regular', 400));

  return semanticTokens;
}

// Test de génération complète
console.log("\n1. Génération des tokens sémantiques...");
const generatedTokens = generateSemanticTokens(primitives, { naming: 'tailwind' });

console.log("\n2. Vérification que les valeurs correspondent aux primitives...");

// Vérifications
const checks = [
  { key: 'bg.canvas', expected: '#F9FAFB', primitive: 'gray.50' },
  { key: 'bg.surface', expected: '#F9FAFB', primitive: 'gray.50' },
  { key: 'bg.muted', expected: '#F3F4F6', primitive: 'gray.100' },
  { key: 'bg.inverse', expected: '#030712', primitive: 'gray.950' },
  { key: 'text.primary', expected: '#030712', primitive: 'gray.950' },
  { key: 'text.secondary', expected: '#374151', primitive: 'gray.700' },
  { key: 'action.primary.default', expected: '#2563EB', primitive: 'brand.600' },
  { key: 'border.default', expected: '#E5E7EB', primitive: 'gray.200' },
  { key: 'status.success', expected: '#10B981', primitive: 'system.success' },
  { key: 'space.sm', expected: 32, primitive: 'spacing.8' },
  { key: 'radius.sm', expected: 4, primitive: 'radius.sm' },
  { key: 'font.size.base', expected: 16, primitive: 'typography.base' }
];

let passed = 0;
let total = checks.length;

checks.forEach(check => {
  const actual = generatedTokens[check.key];
  const success = actual === check.expected;
  console.log(`${success ? '✅' : '❌'} ${check.key}: ${actual} (${success ? 'USES ' + check.primitive : 'ERROR'})`);
  if (success) passed++;
});

console.log(`\n📊 Résultat: ${passed}/${total} tokens utilisent les bonnes primitives`);

if (passed === total) {
  console.log("🎉 SUCCÈS: Tous les tokens sémantiques s'appuient sur les primitives disponibles!");
} else {
  console.log("⚠️ ATTENTION: Certains tokens n'utilisent pas les primitives.");
}

console.log("\n3. Test avec primitives partielles...");
const partialPrimitives = {
  gray: { '50': '#F9FAFB' }, // Seulement gray.50 disponible
  brand: {}
};

const partialTokens = generateSemanticTokens(partialPrimitives, { naming: 'tailwind' });
console.log("bg.canvas avec primitives partielles:", partialTokens['bg.canvas'], partialTokens['bg.canvas'] === '#F9FAFB' ? "(USES PRIMITIVE)" : "(USES FALLBACK)");
console.log("action.primary.default avec primitives partielles:", partialTokens['action.primary.default'], partialTokens['action.primary.default'] === '#2563EB' ? "(USES FALLBACK)" : "(ERROR)");
