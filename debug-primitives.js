// Script de debug pour voir les primitives réelles dans Figma
console.log("🔍 DEBUG PRIMITIVES - Diagnostic des primitives Figma");

// Cette fonction simule ce qui se passe dans le vrai plugin
function debugPrimitives() {
  console.log("=== DIAGNOSTIC DES PRIMITIVES FIGMA ===\n");

  // Simuler la récupération des collections (ce que fait figma.variables.getLocalVariableCollections())
  const mockCollections = [
    {
      id: "collection-gray",
      name: "Gray Scale",
      variableIds: ["var-gray-50", "var-gray-100", "var-gray-200", "var-gray-300", "var-gray-400", "var-gray-500", "var-gray-600", "var-gray-700", "var-gray-800", "var-gray-900", "var-gray-950"]
    },
    {
      id: "collection-brand",
      name: "Brand Colors",
      variableIds: ["var-brand-50", "var-brand-100", "var-brand-200", "var-brand-300", "var-brand-400", "var-brand-500", "var-brand-600", "var-brand-700", "var-brand-800", "var-brand-900", "var-brand-950"]
    },
    {
      id: "collection-system",
      name: "System Colors",
      variableIds: ["var-system-success", "var-system-warning", "var-system-error", "var-system-info"]
    }
  ];

  // Simuler les variables (ce que fait figma.variables.getVariableById())
  const mockVariables = {
    // Gray scale
    "var-gray-50": { id: "var-gray-50", name: "50", valuesByMode: { "mode-default": "#F9FAFB" } },
    "var-gray-100": { id: "var-gray-100", name: "100", valuesByMode: { "mode-default": "#F3F4F6" } },
    "var-gray-200": { id: "var-gray-200", name: "200", valuesByMode: { "mode-default": "#E5E7EB" } },
    "var-gray-300": { id: "var-gray-300", name: "300", valuesByMode: { "mode-default": "#D1D5DB" } },
    "var-gray-400": { id: "var-gray-400", name: "400", valuesByMode: { "mode-default": "#9CA3AF" } },
    "var-gray-500": { id: "var-gray-500", name: "500", valuesByMode: { "mode-default": "#6B7280" } },
    "var-gray-600": { id: "var-gray-600", name: "600", valuesByMode: { "mode-default": "#4B5563" } },
    "var-gray-700": { id: "var-gray-700", name: "700", valuesByMode: { "mode-default": "#374151" } },
    "var-gray-800": { id: "var-gray-800", name: "800", valuesByMode: { "mode-default": "#1F2937" } },
    "var-gray-900": { id: "var-gray-900", name: "900", valuesByMode: { "mode-default": "#111827" } },
    "var-gray-950": { id: "var-gray-950", name: "950", valuesByMode: { "mode-default": "#030712" } },

    // Brand colors
    "var-brand-50": { id: "var-brand-50", name: "50", valuesByMode: { "mode-default": "#EFF6FF" } },
    "var-brand-100": { id: "var-brand-100", name: "100", valuesByMode: { "mode-default": "#DBEAFE" } },
    "var-brand-200": { id: "var-brand-200", name: "200", valuesByMode: { "mode-default": "#BFDBFE" } },
    "var-brand-300": { id: "var-brand-300", name: "300", valuesByMode: { "mode-default": "#93C5FD" } },
    "var-brand-400": { id: "var-brand-400", name: "400", valuesByMode: { "mode-default": "#60A5FA" } },
    "var-brand-500": { id: "var-brand-500", name: "500", valuesByMode: { "mode-default": "#3B82F6" } },
    "var-brand-600": { id: "var-brand-600", name: "600", valuesByMode: { "mode-default": "#2563EB" } },
    "var-brand-700": { id: "var-brand-700", name: "700", valuesByMode: { "mode-default": "#1D4ED8" } },
    "var-brand-800": { id: "var-brand-800", name: "800", valuesByMode: { "mode-default": "#1E40AF" } },
    "var-brand-900": { id: "var-brand-900", name: "900", valuesByMode: { "mode-default": "#1E3A8A" } },
    "var-brand-950": { id: "var-brand-950", name: "950", valuesByMode: { "mode-default": "#172554" } },

    // System colors
    "var-system-success": { id: "var-system-success", name: "success", valuesByMode: { "mode-default": "#10B981" } },
    "var-system-warning": { id: "var-system-warning", name: "warning", valuesByMode: { "mode-default": "#F59E0B" } },
    "var-system-error": { id: "var-system-error", name: "error", valuesByMode: { "mode-default": "#EF4444" } },
    "var-system-info": { id: "var-system-info", name: "info", valuesByMode: { "mode-default": "#3B82F6" } }
  };

  console.log("📂 COLLECTIONS DISPONIBLES:");
  mockCollections.forEach(collection => {
    console.log(`  ${collection.name} (${collection.variableIds.length} variables)`);
  });

  console.log("\n🎨 VARIABLES PAR CATÉGORIE:\n");

  // Grouper par catégorie
  const primitives = {};

  mockCollections.forEach(collection => {
    let categoryName = "unknown";
    const collectionName = collection.name.toLowerCase();

    if (collectionName.includes('gray')) categoryName = 'gray';
    else if (collectionName.includes('brand')) categoryName = 'brand';
    else if (collectionName.includes('system')) categoryName = 'system';
    else if (collectionName.includes('spacing')) categoryName = 'spacing';
    else if (collectionName.includes('radius')) categoryName = 'radius';

    if (!primitives[categoryName]) primitives[categoryName] = {};

    console.log(`📁 ${categoryName.toUpperCase()} (${collection.name}):`);

    collection.variableIds.forEach(varId => {
      const variable = mockVariables[varId];
      if (variable) {
        const value = variable.valuesByMode["mode-default"];
        const key = variable.name;
        primitives[categoryName][key] = value;
        console.log(`  ${key}: ${value}`);
      }
    });
    console.log("");
  });

  console.log("🔧 PRIMITIVES ORGANISÉES POUR LE CODE:");
  console.log(JSON.stringify(primitives, null, 2));

  return primitives;
}

// Fonction pour tester la résolution des sémantiques
function testSemanticResolution(primitives) {
  console.log("\n🧪 TEST RÉSOLUTION SÉMANTIQUE:");

  const libraries = ['tailwind', 'ant', 'mui', 'bootstrap'];

  libraries.forEach(lib => {
    console.log(`\n🎨 ${lib.toUpperCase()}:`);

    // Tester les tokens critiques
    const testTokens = [
      'action.primary.default',
      'bg.canvas',
      'text.primary',
      'status.success'
    ];

    testTokens.forEach(token => {
      // Simuler la logique de résolution (simplifiée)
      let resolved = null;

      if (lib === 'tailwind') {
        if (token === 'action.primary.default') resolved = primitives.brand['600'];
        else if (token === 'bg.canvas') resolved = primitives.gray['50'];
        else if (token === 'text.primary') resolved = primitives.gray['950'];
        else if (token === 'status.success') resolved = primitives.system['success'];
      } else if (lib === 'mui') {
        if (token === 'action.primary.default') resolved = primitives.brand['500'];
        else if (token === 'bg.canvas') resolved = primitives.gray['50'];
        else if (token === 'text.primary') resolved = primitives.gray['950'];
        else if (token === 'status.success') resolved = primitives.system['success'];
      } else if (lib === 'ant') {
        if (token === 'action.primary.default') resolved = primitives.brand['600'];
        else if (token === 'bg.canvas') resolved = primitives.gray['50'];
        else if (token === 'text.primary') resolved = primitives.gray['950'];
        else if (token === 'status.success') resolved = primitives.system['success'];
      } else if (lib === 'bootstrap') {
        if (token === 'action.primary.default') resolved = primitives.brand['500'];
        else if (token === 'bg.canvas') resolved = primitives.gray['50'];
        else if (token === 'text.primary') resolved = primitives.gray['950'];
        else if (token === 'status.success') resolved = primitives.system['success'];
      }

      console.log(`  ${token}: ${resolved || 'NON RÉSOLU'}`);
    });
  });
}

// Exécuter le diagnostic
const primitives = debugPrimitives();
testSemanticResolution(primitives);

console.log("\n💡 INSTRUCTIONS:");
console.log("1. Rechargez complètement le plugin Figma (fermez/reouvrez)");
console.log("2. Vérifiez que vos variables Figma correspondent à cette structure");
console.log("3. Si les noms de collections sont différents, ajustez getCategoryFromVariableCollection()");
console.log("4. Les primitives doivent avoir des clés numériques (50, 100, 200, etc.) ou nommées (success, warning, etc.)");
