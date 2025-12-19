// Script pour analyser quelles couleurs sont réellement disponibles dans les collections Figma
console.log("🔍 ANALYSE DES COULEURS RÉELLES DISPONIBLES");

// Simuler les collections Figma typiques avec leurs vraies couleurs
const figmaCollections = {
  'Brand Colors': {
    // Variables typiques dans une collection Brand
    'blue.500': '#3182CE',    // Bleu Chakra
    'blue.600': '#2C5282',
    'blue.700': '#2A4365',
    '500': '#3B82F6',         // Bleu générique
    '600': '#2563EB',
    '700': '#1D4ED8',
    'primary': '#007BFF',     // Bleu Bootstrap
    'primary-dark': '#0056B3',
    'primary-darker': '#004085',
    'blue-6': '#1890FF',      // Bleu Ant
    'blue-7': '#096DD9',
    'blue-8': '#003A8C',
    'main': '#1976D2',        // Bleu MUI
    'dark': '#1565C0'
  },
  'System Colors': {
    // Couleurs système diverses
    'success': '#10B981',     // Vert
    'warning': '#F59E0B',     // Orange
    'error': '#EF4444',       // Rouge
    'info': '#3B82F6',        // Bleu
    'green.500': '#38A169',  // Vert Chakra
    'orange.500': '#D69E2E', // Orange Chakra
    'red.500': '#E53E3E',    // Rouge Chakra
    'green-6': '#52C41A',    // Vert Ant
    'orange-6': '#FAAD14',   // Orange Ant
    'red-6': '#FF4D4F'       // Rouge Ant
  },
  'Gray Scale': {
    '50': '#F9FAFB',   // Très clair
    '100': '#F3F4F6', // Clair
    '200': '#E5E7EB', // Moyen-clair
    '300': '#D1D5DB', // Moyen
    '400': '#9CA3AF', // Moyen-foncé
    '500': '#6B7280', // Fonçé
    '600': '#4B5563', // Très foncé
    '700': '#374151',
    '800': '#1F2937',
    '900': '#111827'  // Noir
  }
};

// Fonction pour analyser les couleurs disponibles par catégorie
function analyzeColorsByCategory() {
  console.log("\n📊 COULEURS DISPONIBLES PAR CATÉGORIE\n");

  Object.keys(figmaCollections).forEach(collectionName => {
    console.log(`🏗️ ${collectionName}:`);
    const colors = figmaCollections[collectionName];
    const colorEntries = Object.entries(colors);

    // Grouper par teinte dominante
    const colorGroups = {
      '🔵 Bleu': [],
      '🟢 Vert': [],
      '🟠 Orange': [],
      '🔴 Rouge': [],
      '⚫ Gris/Noir': [],
      '⚪ Blanc/Gris clair': []
    };

    colorEntries.forEach(([key, hex]) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);

      if (b > r && b > g) {
        colorGroups['🔵 Bleu'].push(`${key}: ${hex}`);
      } else if (g > r && g > b) {
        colorGroups['🟢 Vert'].push(`${key}: ${hex}`);
      } else if (r > g && r > b) {
        colorGroups['🔴 Rouge'].push(`${key}: ${hex}`);
      } else if (Math.max(r, g, b) - Math.min(r, g, b) < 30) {
        // Couleurs grises (différence faible entre RGB)
        if ((r + g + b) / 3 < 128) {
          colorGroups['⚫ Gris/Noir'].push(`${key}: ${hex}`);
        } else {
          colorGroups['⚪ Blanc/Gris clair'].push(`${key}: ${hex}`);
        }
      } else {
        colorGroups['🟠 Orange'].push(`${key}: ${hex}`);
      }
    });

    Object.entries(colorGroups).forEach(([group, items]) => {
      if (items.length > 0) {
        console.log(`  ${group}: ${items.length} couleurs`);
        if (items.length <= 3) {
          items.forEach(item => console.log(`    ${item}`));
        } else {
          console.log(`    ${items.slice(0, 3).join(', ')}...`);
        }
      }
    });

    console.log(`  📈 Total: ${colorEntries.length} variables\n`);
  });
}

// Analyser les mappings actuels et voir quelles couleurs ils utilisent
function analyzeCurrentMappings() {
  console.log("🎨 ANALYSE DES MAPPINGS ACTUELS\n");

  const currentMappings = {
    chakra: {
      'action.primary.default': { category: 'Brand Colors', keys: ['blue.500', '500'] },
      'status.success': { category: 'System Colors', keys: ['green.500', 'success'] },
      'status.warning': { category: 'System Colors', keys: ['orange.500', 'warning'] },
      'status.error': { category: 'System Colors', keys: ['red.500', 'error'] }
    },
    bootstrap: {
      'action.primary.default': { category: 'Brand Colors', keys: ['primary', '500'] },
      'status.success': { category: 'System Colors', keys: ['success', 'green'] },
      'status.warning': { category: 'System Colors', keys: ['warning', 'yellow'] },
      'status.error': { category: 'System Colors', keys: ['danger', 'red'] }
    },
    ant: {
      'action.primary.default': { category: 'Brand Colors', keys: ['blue-6', '6'] },
      'status.success': { category: 'System Colors', keys: ['green-6', 'success'] },
      'status.warning': { category: 'System Colors', keys: ['orange-6', 'warning'] },
      'status.error': { category: 'System Colors', keys: ['red-6', 'error'] }
    }
  };

  Object.keys(currentMappings).forEach(lib => {
    console.log(`🔷 ${lib.toUpperCase()}:`);
    const mappings = currentMappings[lib];

    Object.entries(mappings).forEach(([semantic, config]) => {
      const categoryColors = figmaCollections[config.category];
      if (!categoryColors) {
        console.log(`  ❌ ${semantic}: catégorie '${config.category}' introuvable`);
        return;
      }

      // Trouver la première clé qui existe
      let resolvedColor = null;
      let resolvedKey = null;

      for (const key of config.keys) {
        if (categoryColors[key]) {
          resolvedColor = categoryColors[key];
          resolvedKey = key;
          break;
        }
      }

      if (resolvedColor) {
        // Déterminer la couleur
        const r = parseInt(resolvedColor.slice(1, 3), 16);
        const g = parseInt(resolvedColor.slice(3, 5), 16);
        const b = parseInt(resolvedColor.slice(5, 7), 16);

        let colorType = '⚫ Autre';
        if (b > r && b > g) colorType = '🔵 Bleu';
        else if (g > r && g > b) colorType = '🟢 Vert';
        else if (r > g && r > b) colorType = '🔴 Rouge';
        else if (Math.max(r, g, b) - Math.min(r, g, b) < 30) colorType = '⚪ Gris';

        console.log(`  ✅ ${semantic}: ${colorType} (${resolvedKey} → ${resolvedColor})`);
      } else {
        console.log(`  ❌ ${semantic}: aucune clé trouvée dans [${config.keys.join(', ')}]`);
      }
    });
    console.log('');
  });
}

// Proposer des corrections pour avoir plus de diversité
function suggestCorrections() {
  console.log("💡 SUGGESTIONS POUR PLUS DE DIVERSITÉ\n");

  console.log("🔧 Problème identifié:");
  console.log("  - Les mappings 'brand' pointent tous vers des variables bleues");
  console.log("  - Il faut utiliser d'autres catégories ou créer des variables colorées\n");

  console.log("✅ Solutions possibles:");
  console.log("  1. Créer des variables 'brand' non-bleues dans Figma");
  console.log("  2. Pointer vers la catégorie 'System Colors' pour plus de variété");
  console.log("  3. Créer une catégorie 'Semantic Colors' avec des couleurs diverses\n");

  console.log("🎨 Exemple de mapping diversifié:");
  console.log("  Chakra:");
  console.log("    action.primary → System Colors / green.500 (#38A169) 🟢");
  console.log("    status.success → System Colors / orange.500 (#D69E2E) 🟠");
  console.log("  Bootstrap:");
  console.log("    action.primary → System Colors / success (#10B981) 🟢");
  console.log("    status.success → System Colors / warning (#F59E0B) 🟠");
  console.log("  Ant:");
  console.log("    action.primary → System Colors / red-6 (#FF4D4F) 🔴");
  console.log("    status.success → System Colors / orange-6 (#FAAD14) 🟠");
}

// Exécuter les analyses
analyzeColorsByCategory();
analyzeCurrentMappings();
suggestCorrections();

console.log("\n🎯 CONCLUSION:");
console.log("- Les mappings actuels pointent vers des variables bleues dans 'Brand Colors'");
console.log("- Pour plus de diversité, il faut utiliser 'System Colors' ou créer des variables colorées");
console.log("- Chaque bibliothèque devrait avoir des couleurs primaires différentes");

console.log("\n🎉 FIN DE L'ANALYSE!");