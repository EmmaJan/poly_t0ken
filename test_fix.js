// Test rapide pour vérifier la correction
const mockExtractedData = {
  tokens: {
    gray: { "50": "#FAFAFA", "950": "#0A0A0A" },
    brand: { "600": "#2563EB" }
  },
  library: "tailwind"
};

console.log("🧪 Test de la correction");

// Simuler ce qui se passe dans le code
const extractedData = mockExtractedData;
const primitiveTokens = extractedData.tokens;

console.log("primitiveTokens:", primitiveTokens);
console.log("primitiveTokens.gray:", primitiveTokens.gray);

// Test de generateSemanticTokens
try {
  const semanticTokens = generateSemanticTokens(primitiveTokens);
  console.log("✅ generateSemanticTokens fonctionne maintenant !");
  console.log("Nombre de tokens générés:", Object.keys(semanticTokens).length);
} catch (error) {
  console.error("❌ Erreur:", error);
}

