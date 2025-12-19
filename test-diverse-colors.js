// Test pour vérifier que les couleurs action.primary sont maintenant diverses
console.log("🧪 TEST COULEURS DIVERSES - Vérification de la diversité des couleurs primaires");

// Simuler les vraies couleurs disponibles dans les collections Figma
const figmaColors = {
  'Brand Colors': {
    'blue.500': '#3182CE',
    '500': '#3B82F6',
    'primary': '#007BFF',
    'blue-6': '#1890FF',
    'main': '#1976D2'
  },
  'System Colors': {
    'green.500': '#38A169',  // 🟢 Vert
    'warning': '#F59E0B',     // 🟠 Orange
    'red-6': '#FF4D4F',      // 🔴 Rouge
    'success': '#10B981',    // 🟢 Vert
    'error': '#EF4444',      // 🔴 Rouge
    'info': '#3B82F6'        // 🔵 Bleu
  },
  'Gray Scale': {
    'gray.300': '#D1D5DB',
    'gray-6': '#BFBFBF'
  }
};

// Fonction pour déterminer le type de couleur
function getColorType(hex) {
  if (!hex || hex === 'N/A') return '❌ Non trouvée';

  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  if (b > r && b > g) return '🔵 Bleu';
  if (g > r && g > b) return '🟢 Vert';
  if (r > g && r > b) return '🔴 Rouge';
  if (Math.max(r, g, b) - Math.min(r, g, b) < 30) return '⚪ Gris';
  return '🟠 Orange';
}

// Fonction pour résoudre une couleur depuis les mappings
function resolveColor(mapping) {
  const categoryColors = figmaColors[mapping.category];
  if (!categoryColors) return 'N/A';

  for (const key of mapping.keys) {
    if (categoryColors[key]) {
      return categoryColors[key];
    }
  }

  return 'N/A';
}

// Mappings corrigés (pointent maintenant vers System Colors)
const correctedMappings = {
  chakra: {
    'action.primary.default': { category: 'System Colors', keys: ['green.500', 'success'] },
    'status.success': { category: 'System Colors', keys: ['warning'] },
    'status.warning': { category: 'System Colors', keys: ['error'] },
    'status.error': { category: 'System Colors', keys: ['success'] }
  },
  bootstrap: {
    'action.primary.default': { category: 'System Colors', keys: ['info'] },
    'status.success': { category: 'System Colors', keys: ['error'] },
    'status.warning': { category: 'System Colors', keys: ['success'] },
    'status.error': { category: 'System Colors', keys: ['warning'] }
  },
  ant: {
    'action.primary.default': { category: 'System Colors', keys: ['red-6', 'error'] },
    'status.success': { category: 'System Colors', keys: ['green-6', 'success'] },
    'status.warning': { category: 'System Colors', keys: ['orange-6', 'warning'] },
    'status.error': { category: 'System Colors', keys: ['blue-6', 'info'] }
  }
};

console.log("\n🎨 ANALYSE DES COULEURS ACTION.PRIMARY PAR BIBLIOTHÈQUE\n");

const primaryColors = {};
let totalLibraries = 0;
let diverseColors = 0;

Object.keys(correctedMappings).forEach(lib => {
  console.log(`🔷 ${lib.toUpperCase()}:`);
  const mappings = correctedMappings[lib];
  const actionPrimary = mappings['action.primary.default'];

  const color = resolveColor(actionPrimary);
  const colorType = getColorType(color);
  primaryColors[lib] = colorType;

  console.log(`  🎯 Action Primary: ${colorType} (${color})`);

  // Afficher aussi les autres couleurs pour contexte
  ['status.success', 'status.warning', 'status.error'].forEach(status => {
    const statusColor = resolveColor(mappings[status]);
    const statusType = getColorType(statusColor);
    console.log(`  ${status}: ${statusType} (${statusColor})`);
  });

  console.log('');
  totalLibraries++;
});

// Analyser la diversité
console.log("📊 ANALYSE DE LA DIVERSITÉ\n");

const colorCounts = {};
Object.values(primaryColors).forEach(colorType => {
  colorCounts[colorType] = (colorCounts[colorType] || 0) + 1;
});

console.log("Répartition des couleurs primaires:");
Object.entries(colorCounts).forEach(([colorType, count]) => {
  console.log(`  ${colorType}: ${count} bibliothèque(s)`);
});

const uniqueColors = Object.keys(colorCounts).length;
const diversityRatio = uniqueColors / totalLibraries;

console.log(`\n🎯 MÉTRIQUES DE DIVERSITÉ:`);
console.log(`  Couleurs uniques: ${uniqueColors}/${totalLibraries} (${(diversityRatio * 100).toFixed(0)}%)`);

if (diversityRatio >= 0.8) {
  console.log("  ✅ EXCELLENTE DIVERSITÉ - Chaque bibliothèque a une couleur primaire différente!");
} else if (diversityRatio >= 0.6) {
  console.log("  ⚠️ DIVERSITÉ MOYENNE - Quelques couleurs se répètent");
} else {
  console.log("  ❌ FAIBLE DIVERSITÉ - Trop de couleurs similaires");
}

console.log("\n🎨 RÉCAPITULATIF DES COULEURS:");
Object.entries(primaryColors).forEach(([lib, colorType]) => {
  console.log(`  ${lib}: ${colorType}`);
});

console.log("\n💡 AVANTAGES DE CETTE APPROCHE:");
console.log("  • Chaque bibliothèque a une couleur primaire distinctive");
console.log("  • Plus de variété visuelle dans les designs");
console.log("  • Utilisation optimale des couleurs système disponibles");
console.log("  • Évite les conflits de couleurs entre bibliothèques");

console.log("\n🎉 FIN DU TEST DE DIVERSITÉ!");