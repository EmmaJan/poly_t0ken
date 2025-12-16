// Script de test pour les tokens sémantiques
console.log("🧪 Test des tokens sémantiques");

// Données de test pour les primitives
const testPrimitives = {
  gray: {
    "50": "#FAFAFA",
    "100": "#F5F5F5",
    "200": "#E5E5E5",
    "300": "#D1D5DB",
    "400": "#A3A3A3",
    "500": "#737373",
    "600": "#525252",
    "700": "#404040",
    "800": "#262626",
    "900": "#171717",
    "950": "#0A0A0A"
  },
  brand: {
    "50": "#EFF6FF",
    "100": "#DBEAFE",
    "200": "#BFDBFE",
    "300": "#93C5FD",
    "400": "#60A5FA",
    "500": "#3B82F6",
    "600": "#2563EB",
    "700": "#1D4ED8",
    "800": "#1E40AF",
    "900": "#1E3A8A",
    "950": "#172554"
  },
  system: {
    success: "#16A34A",
    warning: "#F59E0B",
    error: "#DC2626",
    info: "#2563EB"
  },
  spacing: {
    "2": "2",
    "4": "4",
    "8": "8",
    "16": "16"
  },
  radius: {
    "4": "4",
    "8": "8"
  },
  typography: {
    "base": "16",
    "regular": "400"
  }
};

// Test de generateSemanticTokens
try {
  const semanticTokens = generateSemanticTokens(testPrimitives, { contrastCheck: true });
  console.log("✅ generateSemanticTokens fonctionne");
  console.log("📊 Nombre de tokens générés:", Object.keys(semanticTokens).length);

  // Vérifier que tous les 26 tokens sont présents
  const expectedTokens = [
    'bg.canvas', 'bg.surface', 'bg.elevated', 'bg.muted', 'bg.inverse',
    'text.primary', 'text.secondary', 'text.muted', 'text.inverse', 'text.disabled',
    'border.default', 'border.muted',
    'action.primary.default', 'action.primary.hover', 'action.primary.active', 'action.primary.disabled',
    'status.success', 'status.warning', 'status.error', 'status.info',
    'radius.sm', 'radius.md', 'space.sm', 'space.md',
    'font.size.base', 'font.weight.base'
  ];

  const missingTokens = expectedTokens.filter(token => !(token in semanticTokens));
  if (missingTokens.length === 0) {
    console.log("✅ Tous les 26 tokens sémantiques sont présents");
  } else {
    console.error("❌ Tokens manquants:", missingTokens);
  }

  // Test des mappings de nommage
  console.log("\n🧭 Test des mappings de nommage:");
  const libs = ['tailwind', 'mui', 'ant', 'bootstrap'];
  libs.forEach(lib => {
    const name = getSemanticVariableName('bg.canvas', lib);
    console.log(`  ${lib}: bg.canvas → ${name}`);
  });

  // Test de la vérification contraste
  console.log("\n🎨 Test vérification contraste:");
  const contrastResults = checkSemanticContrast(semanticTokens);
  console.log(`  Résultat: ${contrastResults.passed ? 'PASSÉ' : 'ÉCHEC'}`);
  if (!contrastResults.passed) {
    console.log(`  Problèmes: ${contrastResults.issues.length}`);
  }

} catch (error) {
  console.error("❌ Erreur dans generateSemanticTokens:", error);
}

// Test des fallbacks
console.log("\n🔄 Test des fallbacks:");
try {
  const incompletePrimitives = {
    gray: { "50": "#FAFAFA" }, // Seulement une valeur
    brand: {}, // Vide
    spacing: { "8": "8" }
  };

  const fallbackTokens = generateSemanticTokens(incompletePrimitives, { contrastCheck: false });
  console.log("✅ Les fallbacks fonctionnent correctement");
  console.log("📊 Tokens générés avec fallbacks:", Object.keys(fallbackTokens).length);

} catch (error) {
  console.error("❌ Erreur avec les fallbacks:", error);
}

// Test de extractVariableKey
console.log("\n🔍 Test de extractVariableKey:");

try {
  // Test des différents formats
  const testCases = [
    { name: "primary/600", category: "Brand Colors", expected: "600", description: "Format Tailwind/MUI" },
    { name: "primary-600", category: "Brand Colors", expected: "600", description: "Format Ant" },
    { name: "600", category: "Brand Colors", expected: "600", description: "Format Bootstrap" },
    { name: "primary", category: "Brand Colors", expected: "500", description: "Primary seul" },
    { name: "gray/50", category: "Grayscale", expected: "50", description: "Gray avec slash" },
    { name: "gray-50", category: "Grayscale", expected: "50", description: "Gray avec tiret" },
    { name: "50", category: "Grayscale", expected: "50", description: "Gray juste nombre" },
    { name: "success", category: "System Colors", expected: "success", description: "System color" },
    { name: "spacing-8", category: "Spacing", expected: "8", description: "Spacing" },
    { name: "radius-4", category: "Radius", expected: "4", description: "Radius" },
    { name: "typo-base", category: "Typography", expected: "base", description: "Typography" }
  ];

  // Mock d'une variable Figma pour les tests
  const mockVariable = function(name) {
    return { name: name };
  };

  testCases.forEach(testCase => {
    const result = extractVariableKey(mockVariable(testCase.name), testCase.category);
    const success = result === testCase.expected;
    console.log(`  ${success ? '✅' : '❌'} ${testCase.name} (${testCase.category}) → ${result} (expected: ${testCase.expected}) - ${testCase.description}`);
  });

} catch (error) {
  console.error("❌ Erreur dans extractVariableKey:", error);
}

// Test de applySemanticScopes
console.log("\n🎯 Test de applySemanticScopes:");

try {
  // Mock d'une variable Figma
  const mockVariable = {
    scopes: [],
    set scopes(value) {
      this._scopes = value;
      console.log(`  Scopes appliqués: [${value.join(', ')}]`);
    },
    get scopes() {
      return this._scopes || [];
    }
  };

  // Tests des différentes familles
  const testCases = [
    { key: 'bg.canvas', expectedScopes: ['ALL_FILLS', 'STROKE_COLOR', 'EFFECT_COLOR'], description: 'Background (color)' },
    { key: 'text.primary', expectedScopes: ['ALL_FILLS', 'STROKE_COLOR', 'EFFECT_COLOR'], description: 'Text (color)' },
    { key: 'action.primary.default', expectedScopes: ['ALL_FILLS', 'STROKE_COLOR', 'EFFECT_COLOR'], description: 'Action (color)' },
    { key: 'status.success', expectedScopes: ['ALL_FILLS', 'STROKE_COLOR', 'EFFECT_COLOR'], description: 'Status (color)' },
    { key: 'border.default', expectedScopes: ['STROKE_COLOR'], description: 'Border (stroke)' },
    { key: 'radius.sm', expectedScopes: ['CORNER_RADIUS'], description: 'Radius (corner)' },
    { key: 'space.sm', expectedScopes: ['GAP', 'WIDTH_HEIGHT'], description: 'Space (spacing)' },
    { key: 'font.size.base', expectedScopes: ['FONT_SIZE', 'LINE_HEIGHT', 'LETTER_SPACING', 'TEXT_CONTENT'], description: 'Font size (typography)' },
    { key: 'font.weight.base', expectedScopes: [], description: 'Font weight (no scopes)' }
  ];

  testCases.forEach(testCase => {
    console.log(`  Testing: ${testCase.key} (${testCase.description})`);
    applySemanticScopes(mockVariable, testCase.key, 'COLOR');

    const appliedScopes = mockVariable.scopes;
    const scopesMatch = JSON.stringify(appliedScopes.sort()) === JSON.stringify(testCase.expectedScopes.sort());

    if (scopesMatch) {
      console.log(`    ✅ Correct scopes applied`);
    } else {
      console.log(`    ❌ Wrong scopes. Expected: [${testCase.expectedScopes.join(', ')}], Got: [${appliedScopes.join(', ')}]`);
    }
  });

  // Test de normalisation des clés
  console.log(`\n  Testing key normalization:`);
  applySemanticScopes(mockVariable, 'bg/canvas', 'COLOR'); // clé avec /
  const normalizedScopes = mockVariable.scopes;
  const normalizedMatch = JSON.stringify(normalizedScopes.sort()) === JSON.stringify(['ALL_FILLS', 'STROKE_COLOR', 'EFFECT_COLOR'].sort());
  console.log(`    bg/canvas normalized: ${normalizedMatch ? '✅' : '❌'}`);

} catch (error) {
  console.error("❌ Erreur dans applySemanticScopes:", error);
}

// Test de getSemanticPreviewRows
console.log("\n📋 Test de getSemanticPreviewRows:");

try {
  const testTokens = {
    semantic: {
      'bg.canvas': {
        resolvedValue: '#FFFFFF',
        type: 'COLOR',
        aliasTo: null,
        meta: { sourceCategory: 'gray', sourceKey: '50', updatedAt: Date.now() }
      },
      'text.primary': {
        resolvedValue: '#000000',
        type: 'COLOR',
        aliasTo: 'primitive.gray.950',
        meta: { sourceCategory: 'gray', sourceKey: '950', updatedAt: Date.now() }
      },
      'action.primary.default': {
        resolvedValue: '#2563EB',
        type: 'COLOR',
        aliasTo: null,
        meta: { sourceCategory: 'brand', sourceKey: '600', updatedAt: Date.now() }
      }
    }
  };

  const previewRows = getSemanticPreviewRows(testTokens, 'tailwind');

  console.log(`  ✅ Généré ${previewRows.length} rows de preview`);

  previewRows.forEach(row => {
    console.log(`    ${row.key} → ${row.figmaName} (${row.type})`);
  });

} catch (error) {
  console.error("❌ Erreur dans getSemanticPreviewRows:", error);
}

console.log("\n🏁 Tests terminés!");

