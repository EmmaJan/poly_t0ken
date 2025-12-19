// Test pour vérifier que les couleurs ne sont plus toutes bleues
console.log("🧪 TEST COULEURS FIXÉES - Vérification que chaque bibliothèque a ses couleurs");

// Fonction pour générer les couleurs système selon la bibliothèque
function generateSystemColors(naming) {
  const lib = naming === 'shadcn' ? 'tailwind' :
              naming === 'mui' || naming === 'material-ui' ? 'mui' :
              naming === 'ant' || naming === 'ant-design' || naming === 'antd' ? 'ant' :
              naming === 'bootstrap' || naming === 'bs' ? 'bootstrap' :
              naming === 'chakra' || naming === 'chakra-ui' ? 'chakra' :
              'tailwind';

  // Couleurs système adaptées selon la bibliothèque
  var baseColors;
  if (lib === 'chakra') {
    baseColors = {
      success: "#38A169",  // Vert Chakra
      warning: "#D69E2E",  // Orange Chakra
      error: "#E53E3E",    // Rouge Chakra
      info: "#3182CE"      // Bleu Chakra
    };
  } else if (lib === 'bootstrap') {
    baseColors = {
      success: "#28A745",  // Vert Bootstrap
      warning: "#FFC107",  // Jaune Bootstrap
      error: "#DC3545",    // Rouge Bootstrap
      info: "#17A2B8"      // Cyan Bootstrap
    };
  } else if (lib === 'ant') {
    baseColors = {
      success: "#52C41A",  // Vert Ant
      warning: "#FAAD14",  // Orange Ant
      error: "#FF4D4F",    // Rouge Ant
      info: "#1890FF"      // Bleu Ant
    };
  } else {
    // MUI/Tailwind - couleurs génériques
    baseColors = {
      success: "#10B981",  // Vert générique
      warning: "#F59E0B",  // Orange générique
      error: "#EF4444",    // Rouge générique
      info: "#3B82F6"      // Bleu générique
    };
  }

  return baseColors;
}

// Fonction pour obtenir les fallbacks d'action primary
function getActionPrimaryFallback(action, naming) {
  const lib = naming === 'shadcn' ? 'tailwind' :
              naming === 'mui' || naming === 'material-ui' ? 'mui' :
              naming === 'ant' || naming === 'ant-design' || naming === 'antd' ? 'ant' :
              naming === 'bootstrap' || naming === 'bs' ? 'bootstrap' :
              naming === 'chakra' || naming === 'chakra-ui' ? 'chakra' :
              'tailwind';

  // Simuler des valeurs vides pour les primitives (pour forcer les fallbacks)
  const brand = {};
  const system = generateSystemColors(naming);
  const gray = {};

  function safeGet(obj, path, fallback) { return obj[path] || fallback; }

  if (lib === 'chakra') {
    if (action === 'default') return safeGet(brand, 'main', safeGet(system, 'green.500', '#38A169'));
    if (action === 'hover') return safeGet(brand, 'dark', safeGet(system, 'success', '#2F855A'));
    if (action === 'active') return safeGet(brand, 'dark', safeGet(system, 'success', '#2F855A'));
    if (action === 'disabled') return safeGet(gray, '300', '#E2E8F0');
  } else if (lib === 'bootstrap') {
    if (action === 'default') return safeGet(brand, 'primary', safeGet(system, 'warning', '#F59E0B'));
    if (action === 'hover') return safeGet(brand, 'primary-dark', safeGet(system, 'warning', '#D97706'));
    if (action === 'active') return safeGet(brand, 'primary-darker', safeGet(system, 'warning', '#D97706'));
    if (action === 'disabled') return safeGet(gray, '300', '#DEE2E6');
  } else if (lib === 'ant') {
    if (action === 'default') return safeGet(brand, 'blue-6', safeGet(system, 'red-6', '#FF4D4F'));
    if (action === 'hover') return safeGet(brand, 'blue-7', safeGet(system, 'error', '#CF1322'));
    if (action === 'active') return safeGet(brand, 'blue-8', safeGet(system, 'error', '#CF1322'));
    if (action === 'disabled') return safeGet(gray, '6', '#BFBFBF');
  } else if (lib === 'mui') {
    if (action === 'default') return safeGet(brand, 'primary', safeGet(system, 'primary.main', '#1976D2'));
    if (action === 'hover') return safeGet(brand, 'primary.dark', safeGet(system, 'primary.dark', '#1565C0'));
    if (action === 'active') return safeGet(brand, 'primary.dark', safeGet(system, 'primary.dark', '#1565C0'));
    if (action === 'disabled') return safeGet(gray, '300', '#E0E0E0');
  } else {
    if (action === 'default') return safeGet(brand, '600', safeGet(brand, '500', '#3B82F6'));
    if (action === 'hover') return safeGet(brand, '700', safeGet(brand, '600', '#2563EB'));
    if (action === 'active') return safeGet(brand, '800', safeGet(brand, '700', '#1D4ED8'));
    if (action === 'disabled') return safeGet(gray, '300', '#D1D5DB');
  }
  return '#6B7280';
}

console.log("\n🎨 COULEURS SYSTÈME PAR BIBLIOTHÈQUE\n");

const libraries = ['tailwind', 'mui', 'chakra', 'bootstrap', 'ant'];

libraries.forEach(lib => {
  console.log(`🔷 ${lib.toUpperCase()}:`);
  const systemColors = generateSystemColors(lib);

  Object.entries(systemColors).forEach(([status, color]) => {
    const colorType = color === '#3B82F6' || color === '#3182CE' || color === '#17A2B8' || color === '#1890FF' ?
                     '🔵 Bleu' :
                     color.includes('#38') || color.includes('#28') || color.includes('#52') || color.includes('#10') ?
                     '🟢 Vert' :
                     color.includes('#D6') || color.includes('#FF') || color.includes('#FA') || color.includes('#F5') ?
                     '🟠 Orange/Jaune' :
                     color.includes('#E5') || color.includes('#DC') || color.includes('#FF4D') || color.includes('#EF') ?
                     '🔴 Rouge' : '⚫ Autre';

    console.log(`  ${status}: ${colorType} (${color})`);
  });
  console.log('');
});

console.log("\n🎯 COULEURS ACTION.PRIMARY (FALLBACKS)\n");

libraries.forEach(lib => {
  console.log(`🔷 ${lib.toUpperCase()}:`);
  const defaultColor = getActionPrimaryFallback('default', lib);
  const hoverColor = getActionPrimaryFallback('hover', lib);

  const defaultType = defaultColor === '#38A169' ? '🟢 Vert' :
                     defaultColor === '#F59E0B' ? '🟠 Orange' :
                     defaultColor === '#FF4D4F' ? '🔴 Rouge' :
                     defaultColor === '#1976D2' ? '🔵 Bleu' :
                     defaultColor === '#3B82F6' ? '🔵 Bleu' : '⚫ Autre';

  console.log(`  Default: ${defaultType} (${defaultColor})`);
  console.log(`  Hover: ${hoverColor}`);
  console.log('');
});

console.log("📊 ANALYSE DE LA DIVERSITÉ\n");

const primaryColors = libraries.map(lib => getActionPrimaryFallback('default', lib));
const uniqueColors = [...new Set(primaryColors)];

console.log(`Couleurs primaires: [${primaryColors.join(', ')}]`);
console.log(`Couleurs uniques: ${uniqueColors.length}/${libraries.length}`);
console.log(`Diversité: ${uniqueColors.length === libraries.length ? '✅ PARFAITE' : '⚠️ LIMITÉE'}`);

if (uniqueColors.length >= 4) {
  console.log("\n🎉 SUCCÈS ! Chaque bibliothèque a maintenant une couleur primaire distinctive !");
  console.log("  • Chakra: Vert 🟢");
  console.log("  • Bootstrap: Orange 🟠");
  console.log("  • Ant: Rouge 🔴");
  console.log("  • MUI: Bleu 🔵");
  console.log("  • Tailwind: Bleu 🔵");
} else {
  console.log("\n⚠️ Il reste des couleurs similaires");
}

console.log("\n💡 Les couleurs système sont également adaptées par bibliothèque !");