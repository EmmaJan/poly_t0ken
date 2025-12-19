// Test des nouveaux fallbacks naming-aware pour MUI
console.log("🧪 TEST MUI NAMING-AWARE FALLBACKS");

// Simuler les primitives MUI
const primitives = {
  brand: {
    light: '#93C5FD',  // Bleu clair
    main: '#3B82F6',   // Bleu principal (devrait être utilisé)
    dark: '#1D4ED8'    // Bleu sombre
  },
  gray: {
    300: '#D1D5DB'
  },
  system: {
    'primary.main': '#1976d2',
    'primary.dark': '#115293'
  }
};

// Simuler la fonction getActionPrimaryFallback
function getActionPrimaryFallback(action, naming) {
  const brand = primitives.brand || {};
  const system = primitives.system || {};
  const gray = primitives.gray || {};

  if (naming === 'mui') {
    if (action === 'default') return brand.main || system['primary.main'] || '#1976d2';
    if (action === 'hover') return brand.dark || system['primary.dark'] || '#115293';
    if (action === 'active') return brand.dark || system['primary.dark'] || '#115293';
    if (action === 'disabled') return gray['300'] || gray['200'] || '#e0e0e0';
  } else {
    // Autres namings
    if (action === 'default') return brand['600'] || brand['500'] || '#2563EB';
    if (action === 'hover') return brand['700'] || brand['600'] || '#1D4ED8';
    if (action === 'active') return brand['800'] || brand['700'] || '#1E40AF';
    if (action === 'disabled') return gray['300'] || '#D1D5DB';
  }
  return '#2563EB';
}

// Tests
console.log("Primitives disponibles:");
console.log("  brand.main:", primitives.brand.main);
console.log("  brand.dark:", primitives.brand.dark);
console.log("");

console.log("Tests pour MUI:");
console.log("  action.primary.default:", getActionPrimaryFallback('default', 'mui'), "← devrait être brand.main (#3B82F6)");
console.log("  action.primary.hover:", getActionPrimaryFallback('hover', 'mui'), "← devrait être brand.dark (#1D4ED8)");
console.log("  action.primary.active:", getActionPrimaryFallback('active', 'mui'), "← devrait être brand.dark (#1D4ED8)");
console.log("  action.primary.disabled:", getActionPrimaryFallback('disabled', 'mui'), "← devrait être gray.300");

console.log("");
console.log("Comparaison avec Tailwind:");
console.log("  action.primary.default:", getActionPrimaryFallback('default', 'tailwind'), "← utilise la scale numérique");

const muiDefault = getActionPrimaryFallback('default', 'mui');
const tailwindDefault = getActionPrimaryFallback('default', 'tailwind');

console.log("");
console.log("Résultats:");
console.log(`✅ MUI utilise brand.main: ${muiDefault === '#3B82F6'}`);
console.log(`✅ Tailwind utilise scale numérique: ${tailwindDefault !== '#3B82F6'}`);
console.log(`🎉 MUI et Tailwind ont des fallbacks différents: ${muiDefault !== tailwindDefault}`);
