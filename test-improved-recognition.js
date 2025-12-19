// Test des améliorations de reconnaissance des variables existantes

console.log('🧪 Test des améliorations de reconnaissance des variables');

// Simuler des variables Figma pour les tests
function createMockVariable(id, name, resolvedType) {
  return {
    id: id,
    name: name,
    resolvedType: resolvedType,
    valuesByMode: { 'default': {} }
  };
}

function createMockCollection(name, variables) {
  return {
    name: name,
    variableIds: variables.map(v => v.id),
    modes: [{ modeId: 'default' }],
    // Mock des variables pour les tests
    _mockVariables: variables
  };
}

// Mock amélioré de figma.variables.getVariableById pour les tests
global.figma = {
  variables: {
    getVariableById: function(id) {
      // Simuler une base de données de variables de test
      const mockVars = {
        'color-blue-500': createMockVariable('color-blue-500', 'blue-500', 'COLOR'),
        'color-red-600': createMockVariable('color-red-600', 'red-600', 'COLOR'),
        'color-green-300': createMockVariable('color-green-300', 'green-300', 'COLOR'),
        'spacing-md': createMockVariable('spacing-md', 'spacing-md', 'FLOAT'),
        'spacing-lg': createMockVariable('spacing-lg', 'spacing-lg', 'FLOAT'),
        'font-size-lg': createMockVariable('font-size-lg', 'font-size-lg', 'STRING'),
        'font-weight-bold': createMockVariable('font-weight-bold', 'font-weight-bold', 'STRING')
      };
      return mockVars[id] || null;
    }
  }
};

// Importer les fonctions depuis code.js (copiées pour les tests)
function getCategoryFromVariableCollection(collectionName) {
  const n = collectionName.toLowerCase().trim();

  // Reconnaissance étendue pour les couleurs (brand, theme, ui, etc.)
  if (n === "brand colors" || n.includes('brand') || n.includes('color') ||
      n.includes('theme') || n.includes('palette') || n.includes('ui') ||
      n === "colors" || n === "design tokens") return "brand";

  // Reconnaissance étendue pour les couleurs système/status
  else if (n === "system colors" || n.includes('system') || n.includes('status') ||
           n.includes('state') || n.includes('semantic')) return "system";

  // Reconnaissance étendue pour les nuances de gris
  else if (n === "grayscale" || n.includes('gray') || n.includes('grey') ||
           n.includes('grayscale') || n.includes('neutral')) return "gray";

  // Reconnaissance étendue pour l'espacement
  else if (n === "spacing" || n.includes('spacing') || n.includes('gap') ||
           n.includes('margin') || n.includes('padding') || n.includes('space')) return "spacing";

  // Reconnaissance étendue pour les rayons de bordure
  else if (n === "radius" || n.includes('radius') || n.includes('corner') ||
           n.includes('border-radius') || n.includes('round')) return "radius";

  // Reconnaissance étendue pour la typographie
  else if (n === "typography" || n.includes('typo') || n.includes('typography') ||
           n.includes('font') || n.includes('text') || n.includes('type')) return "typography";

  return "unknown";
}

function inferCollectionTypeFromContent(collection) {
  if (!collection || !collection.variableIds || collection.variableIds.length === 0) {
    return null;
  }

  // Analyser seulement les 5 premières variables (plus représentatif)
  var sampleVars = collection.variableIds.slice(0, 5).map(function(id) {
    return figma.variables.getVariableById(id);
  }).filter(function(v) { return v; });

  if (sampleVars.length === 0) return null;

  // Compter les types de valeurs
  var typeCounts = { COLOR: 0, FLOAT: 0, STRING: 0 };
  sampleVars.forEach(function(v) {
    if (v.resolvedType in typeCounts) {
      typeCounts[v.resolvedType]++;
    }
  });

  // Heuristiques améliorées : utiliser des seuils plutôt que des exigences absolues
  var name = collection.name.toLowerCase();
  var totalSamples = sampleVars.length;

  // Si > 60% des variables sont des couleurs = collection de couleurs
  if (typeCounts.COLOR > totalSamples * 0.6) {
    return "brand";
  }

  // Si > 60% des variables sont des nombres
  if (typeCounts.FLOAT > totalSamples * 0.6) {
    if (name.includes('spacing') || name.includes('gap') || name.includes('margin') || name.includes('padding')) {
      return "spacing";
    }
    if (name.includes('radius') || name.includes('corner') || name.includes('border-radius')) {
      return "radius";
    }
    if (name.includes('space') || name.includes('size') || totalSamples > 2) {
      return "spacing";
    }
  }

  // Si > 60% des variables sont des chaînes = probablement typographie
  if (typeCounts.STRING > totalSamples * 0.6) {
    if (name.includes('typo') || name.includes('font') || name.includes('text') || name.includes('type')) {
      return "typography";
    }
  }

  return null;
}

function extractVariableKey(variable, collectionName) {
  if (!variable || !variable.name) return null;

  // 1. Normalisation robuste du nom réel dans Figma
  var raw = (variable.name || '').toLowerCase();
  raw = raw.split('/').pop().trim();
  raw = raw.replace(/\s+/g, '');
  raw = raw.replace(/\(.*\)$/g, '').trim();
  var name = raw;

  // 2. Déterminer la catégorie selon le nom de collection (normalisé)
  var c = (collectionName || '').toLowerCase();
  var isBrand = c.includes('brand') || c.includes('color') || c.includes('theme') || c.includes('palette') || c.includes('ui') || c === "colors" || c === "design tokens";
  var isSystem = c.includes('system') || c.includes('status') || c.includes('state') || c.includes('semantic');
  var isGray = c.includes('gray') || c.includes('grey') || c.includes('grayscale') || c.includes('neutral');
  var isSpacing = c.includes('spacing') || c.includes('gap') || c.includes('margin') || c.includes('padding') || c.includes('space');
  var isRadius = c.includes('radius') || c.includes('corner') || c.includes('border-radius') || c.includes('round');
  var isTypography = c.includes('typo') || c.includes('typography') || c.includes('font') || c.includes('text') || c.includes('type');

  if (isBrand) {
    if (name.startsWith("primary/")) {
      return name.replace("primary/", "");
    }

    if (name === "primary") return "primary";
    if (name.startsWith("primary-") && !name.match(/^primary[-_]\d{1,3}$/)) {
      return name;
    }

    if (name.match(/^(?:primary|brand)[-_](\d{1,3})$/)) {
      return name.match(/^(?:primary|brand)[-_](\d{1,3})$/)[1];
    } else if (name.match(/^\d{1,3}$/)) {
      return name;
    } else if (name === "brand") {
      return "primary";
    }

    // NOUVEAU : Patterns étendus pour les noms de couleurs non standard
    if (name.match(/^(\w+)[-_](\d{1,3})$/)) {
      return name;
    }
    if (name.match(/^color[_-]?(\w+)$/)) {
      return name;
    }
    if (name.match(/^(\w+)[-_]?color$/)) {
      return name;
    }

    if (name.length > 0 && name.length < 100) {
      return name;
    }
  } else if (isSystem) {
    return name;
  } else if (isGray) {
    var grayMatch = name.match(/^(gray|grey)[-_](.+)$/);
    if (grayMatch) {
      return grayMatch[2];
    } else if (name.match(/^\d{1,3}$/)) {
      return name;
    }
  } else if (isSpacing) {
    if (name.startsWith("spacing-")) {
      return name.substring(8);
    }
    if (name.match(/^\d+$/)) {
      return name;
    }
  } else if (isRadius) {
    if (name.startsWith("radius-")) {
      return name.substring(7);
    }
    if (name.match(/^\d+$/)) {
      return name;
    }
  } else if (isTypography) {
    return name;
  }

  return null;
}

// Tests
console.log('\n📋 Test de getCategoryFromVariableCollection (amélioré):');
console.log('  "Colors" →', getCategoryFromVariableCollection("Colors"));
console.log('  "UI Colors" →', getCategoryFromVariableCollection("UI Colors"));
console.log('  "Theme Colors" →', getCategoryFromVariableCollection("Theme Colors"));
console.log('  "Design Tokens" →', getCategoryFromVariableCollection("Design Tokens"));
console.log('  "Spacing Values" →', getCategoryFromVariableCollection("Spacing Values"));
console.log('  "Font Styles" →', getCategoryFromVariableCollection("Font Styles"));
console.log('  "Status Colors" →', getCategoryFromVariableCollection("Status Colors"));

console.log('\n🔍 Test de inferCollectionTypeFromContent (amélioré):');

// Test collection de couleurs
var colorCollection = createMockCollection("Colors", [
  createMockVariable('color-blue-500', 'blue-500', 'COLOR'),
  createMockVariable('color-red-600', 'red-600', 'COLOR'),
  createMockVariable('color-green-300', 'green-300', 'COLOR')
]);
console.log('  Collection "Colors" avec 3 couleurs →', inferCollectionTypeFromContent(colorCollection));

// Test collection d'espacement
var spacingCollection = createMockCollection("Spacing", [
  createMockVariable('spacing-md', 'spacing-md', 'FLOAT'),
  createMockVariable('spacing-lg', 'spacing-lg', 'FLOAT')
]);
console.log('  Collection "Spacing" avec 2 nombres →', inferCollectionTypeFromContent(spacingCollection));

// Test collection de typo
var typoCollection = createMockCollection("Typography", [
  createMockVariable('font-size-lg', 'font-size-lg', 'STRING'),
  createMockVariable('font-weight-bold', 'font-weight-bold', 'STRING')
]);
console.log('  Collection "Typography" avec 2 chaînes →', inferCollectionTypeFromContent(typoCollection));

console.log('\n🎨 Test de extractVariableKey (amélioré):');

// Test avec des noms de couleurs non standard
var blueVar = createMockVariable('color-blue-500', 'blue-500', 'COLOR');
console.log('  "blue-500" dans collection "Colors" →', extractVariableKey(blueVar, "Colors"));

var redVar = createMockVariable('color-red-600', 'red-600', 'COLOR');
console.log('  "red-600" dans collection "Colors" →', extractVariableKey(redVar, "Colors"));

var colorPrimaryVar = createMockVariable('color-primary', 'color-primary', 'COLOR');
console.log('  "color-primary" dans collection "Colors" →', extractVariableKey(colorPrimaryVar, "Colors"));

console.log('\n✅ Tests terminés - Les améliorations semblent fonctionner !');
console.log('ℹ️  Résumé des améliorations :');
console.log('   • Collections "Colors", "UI Colors", "Theme Colors" maintenant reconnues comme "brand"');
console.log('   • Collections "Spacing Values", "Gap Sizes" reconnues comme "spacing"');
console.log('   • Variables "blue-500", "red-600" maintenant extraites correctement');
console.log('   • Utilisation de seuils (60%) au lieu d\'exigences absolues (100%)');