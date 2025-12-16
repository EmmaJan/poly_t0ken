// Test de la persistance des tokens sémantiques

console.log("🧪 Test de persistance des tokens sémantiques");

// Simuler cachedTokens avec des tokens sémantiques
const mockCachedTokens = {
  brand: { "600": "#2563EB" },
  gray: { "50": "#FAFAFA", "950": "#0A0A0A" },
  semantic: {
    'bg.canvas': '#FAFAFA',
    'text.primary': '#0A0A0A',
    'action.primary.default': '#2563EB'
  }
};

// Simuler la fonction extractExistingTokens modifiée
function extractExistingTokens() {
  // Simuler l'extraction des tokens primitifs (normalement depuis Figma)
  const tokens = {
    brand: mockCachedTokens.brand,
    gray: mockCachedTokens.gray
  };

  // Inclure les tokens sémantiques du cache s'ils existent
  if (mockCachedTokens && mockCachedTokens.semantic) {
    tokens.semantic = mockCachedTokens.semantic;
  }

  return {
    tokens: tokens,
    library: "tailwind"
  };
}

// Simuler la génération de tokens primitifs
function simulateGeneratePrimitives() {
  const tokens = {
    brand: { "600": "#2563EB" },
    gray: { "50": "#FAFAFA", "950": "#0A0A0A" },
    spacing: { "8": "8px" },
    radius: { "4": "4px" }
  };

  // Préserver les tokens sémantiques existants
  if (mockCachedTokens && mockCachedTokens.semantic) {
    tokens.semantic = mockCachedTokens.semantic;
  }

  return tokens;
}

// Test 1: extractExistingTokens inclut les tokens sémantiques
console.log("\n📥 Test extractExistingTokens:");
const extracted = extractExistingTokens();
console.log("Tokens extraits:", Object.keys(extracted.tokens));
console.log("Tokens sémantiques présents:", !!extracted.tokens.semantic);
console.log("Nombre de tokens sémantiques:", extracted.tokens.semantic ? Object.keys(extracted.tokens.semantic).length : 0);

// Test 2: generatePrimitives préserve les tokens sémantiques
console.log("\n🔄 Test génération primitives avec préservation sémantique:");
const newTokens = simulateGeneratePrimitives();
console.log("Nouveaux tokens:", Object.keys(newTokens));
console.log("Tokens sémantiques préservés:", !!newTokens.semantic);
console.log("Nombre de tokens sémantiques préservés:", newTokens.semantic ? Object.keys(newTokens.semantic).length : 0);

// Test 3: Vérifier les valeurs
if (newTokens.semantic) {
  console.log("\n📊 Vérification des valeurs:");
  console.log("bg.canvas:", newTokens.semantic['bg.canvas']);
  console.log("text.primary:", newTokens.semantic['text.primary']);
  console.log("action.primary.default:", newTokens.semantic['action.primary.default']);
}

console.log("\n🏁 Tests terminés!");

