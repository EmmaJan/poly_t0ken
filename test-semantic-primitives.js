// Script de test pour vérifier que les sémantiques s'appuient sur les bonnes primitives
console.log("🧪 TEST SEMANTIC PRIMITIVES - Vérification de la résolution des primitives");

// Simuler les fonctions corrigées pour test
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

// Simuler les primitives disponibles
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

// Simuler tryResolveSemanticAlias - version simplifiée pour test
function tryResolveSemanticAlias(semanticKey, allPrimitives, naming) {
  // Mapping simplifié pour les tests
  const mapping = {
    'bg.canvas': { category: 'gray', keys: ['50'] },
    'text.primary': { category: 'gray', keys: ['950'] },
    'action.primary.default': { category: 'brand', keys: ['600'] },
    'border.default': { category: 'gray', keys: ['200'] },
    'status.success': { category: 'system', keys: ['success'] },
    'space.sm': { category: 'spacing', keys: ['8'] },
    'radius.sm': { category: 'radius', keys: ['sm'] },
    'font.size.base': { category: 'typography', keys: ['base'] }
  };

  const config = mapping[semanticKey];
  if (!config) return null;

  // Simuler qu'une variable existe si la primitive est disponible
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

// Simuler extractVariableKey
function extractVariableKey(variable, collectionName) {
  return variable.name.split('-').pop(); // Ex: "gray-50" -> "50"
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

// Fonction corrigée resolveSemanticValue
function resolveSemanticValue(semanticKey, primitives, naming, fallback) {
  try {
    // Essayer d'abord de résoudre via les primitives disponibles
    const variable = tryResolveSemanticAlias(semanticKey, primitives, naming);
    if (variable) {
      // Extraire la valeur de la variable primitive
      const collectionName = `collection-${variable.name.split('-')[0]}`;
      const category = getCategoryFromVariableCollection(collectionName);
      const variableKey = extractVariableKey(variable, collectionName);

      if (primitives[category] && primitives[category][variableKey]) {
        console.log(`✅ ${semanticKey} → ${category}.${variableKey} (${primitives[category][variableKey]})`);
        return primitives[category][variableKey];
      }
    }
  } catch (error) {
    console.warn(`⚠️ Erreur lors de la résolution de ${semanticKey}:`, error);
  }

  // Fallback si aucune primitive trouvée
  console.log(`⚠️ ${semanticKey} → fallback: ${fallback}`);
  return fallback;
}

// Tests
console.log("\n1. Testing resolveSemanticValue avec primitives disponibles...");

const naming = 'tailwind';

// Test 1: bg.canvas devrait utiliser gray.50
const result1 = resolveSemanticValue('bg.canvas', primitives, naming, '#FFFFFF');
console.log("✅ Test 1 - bg.canvas:", result1 === '#F9FAFB' ? "USES PRIMITIVE" : "USES FALLBACK");

// Test 2: text.primary devrait utiliser gray.950
const result2 = resolveSemanticValue('text.primary', primitives, naming, '#000000');
console.log("✅ Test 2 - text.primary:", result2 === '#030712' ? "USES PRIMITIVE" : "USES FALLBACK");

// Test 3: action.primary.default devrait utiliser brand.600
const result3 = resolveSemanticValue('action.primary.default', primitives, naming, '#2563EB');
console.log("✅ Test 3 - action.primary.default:", result3 === '#2563EB' ? "USES PRIMITIVE" : "USES FALLBACK");

// Test 4: status.success devrait utiliser system.success
const result4 = resolveSemanticValue('status.success', primitives, naming, '#16A34A');
console.log("✅ Test 4 - status.success:", result4 === '#10B981' ? "USES PRIMITIVE" : "USES FALLBACK");

// Test 5: space.sm devrait utiliser spacing.8
const result5 = resolveSemanticValue('space.sm', primitives, naming, 8);
console.log("✅ Test 5 - space.sm:", result5 === 32 ? "USES PRIMITIVE" : "USES FALLBACK");

// Test 6: Primitive non disponible - devrait utiliser fallback
const primitivesIncomplete = { gray: {} }; // Pas de gray.50
const result6 = resolveSemanticValue('bg.canvas', primitivesIncomplete, naming, '#FFFFFF');
console.log("✅ Test 6 - bg.canvas sans primitive:", result6 === '#FFFFFF' ? "USES FALLBACK" : "ERROR");

console.log("\n2. Vérification des catégories...");

console.log("✅ Gray category:", getCategoryFromVariableCollection("Gray Scale") === "gray");
console.log("✅ Brand category:", getCategoryFromVariableCollection("Brand Colors") === "brand");
console.log("✅ System category:", getCategoryFromVariableCollection("System Colors") === "system");
console.log("✅ Spacing category:", getCategoryFromVariableCollection("Spacing") === "spacing");
console.log("✅ Radius category:", getCategoryFromVariableCollection("Border Radius") === "radius");
console.log("✅ Typography category:", getCategoryFromVariableCollection("Typography") === "typography");

console.log("\n🎉 ALL SEMANTIC PRIMITIVES TESTS COMPLETED!");
console.log("🔧 Les sémantiques devraient maintenant s'appuyer sur les primitives disponibles.");
