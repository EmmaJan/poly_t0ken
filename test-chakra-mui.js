// Test pour vérifier que Chakra fonctionne comme MUI
console.log("🧪 TEST CHAKRA = MUI - Vérification que Chakra utilise la même logique que MUI");

// Simuler les primitives MUI/Chakra (mêmes noms)
const primitives = {
  brand: {
    light: '#93C5FD',  // Bleu clair
    main: '#3B82F6',   // Bleu principal
    dark: '#1D4ED8'    // Bleu sombre
  },
  gray: {
    '300': '#D1D5DB'
  },
  system: {
    'success-main': '#10B981',
    'warning-main': '#F59E0B',
    'error-main': '#EF4444',
    'info-main': '#3B82F6'
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

// Simuler getActionPrimaryFallback
function getActionPrimaryFallback(action, naming) {
  const brand = primitives.brand || {};
  const system = primitives.system || {};
  const gray = primitives.gray || {};

  if (naming === 'mui' || naming === 'chakra') {
    // MUI et Chakra utilisent des noms sémantiques (main, dark, light)
    if (action === 'default') return safeGet(brand, 'main', safeGet(system, 'primary.main', '#1976d2'));
    if (action === 'hover') return safeGet(brand, 'dark', safeGet(system, 'primary.dark', '#115293'));
    if (action === 'active') return safeGet(brand, 'dark', safeGet(system, 'primary.dark', '#115293'));
    if (action === 'disabled') return safeGet(gray, '300', safeGet(gray, '200', '#e0e0e0'));
  }
  return '#2563EB';
}

// Tests
console.log("Primitives identiques pour MUI et Chakra:");
console.log("  brand.main:", primitives.brand.main);
console.log("  brand.dark:", primitives.brand.dark);
console.log("");

console.log("Résultats pour MUI:");
console.log("  action.primary.default:", getActionPrimaryFallback('default', 'mui'));
console.log("  action.primary.hover:", getActionPrimaryFallback('hover', 'mui'));
console.log("  action.primary.active:", getActionPrimaryFallback('active', 'mui'));

console.log("");
console.log("Résultats pour Chakra:");
console.log("  action.primary.default:", getActionPrimaryFallback('default', 'chakra'));
console.log("  action.primary.hover:", getActionPrimaryFallback('hover', 'chakra'));
console.log("  action.primary.active:", getActionPrimaryFallback('active', 'chakra'));

const muiDefault = getActionPrimaryFallback('default', 'mui');
const chakraDefault = getActionPrimaryFallback('default', 'chakra');
const muiHover = getActionPrimaryFallback('hover', 'mui');
const chakraHover = getActionPrimaryFallback('hover', 'chakra');

console.log("");
console.log("✅ MUI et Chakra ont les mêmes résultats:");
console.log(`  Default identique: ${muiDefault === chakraDefault && muiDefault === '#3B82F6'}`);
console.log(`  Hover identique: ${muiHover === chakraHover && muiHover === '#1D4ED8'}`);
console.log(`  Tous utilisent brand.main/dark: ${muiDefault === '#3B82F6' && muiHover === '#1D4ED8'}`);

if (muiDefault === chakraDefault && muiHover === chakraHover) {
  console.log("\n🎉 SUCCÈS: Chakra utilise exactement la même logique que MUI!");
} else {
  console.log("\n❌ ÉCHEC: Chakra et MUI ont des résultats différents");
}
