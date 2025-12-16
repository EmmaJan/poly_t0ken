// Test d'intégration rapide pour vérifier que generateSemanticTokens
// fonctionne avec les données de extractExistingTokens

// Simuler les données que extractExistingTokens retournerait
const mockExtractedData = {
  tokens: {
    brand: {
      "50": "#EFF6FF",
      "600": "#2563EB",
      "700": "#1D4ED8",
      "800": "#1E40AF",
      "300": "#93C5FD"
    },
    gray: {
      "50": "#FAFAFA",
      "100": "#F5F5F5",
      "200": "#E5E5E5",
      "300": "#D1D5DB",
      "400": "#A3A3A3",
      "500": "#737373",
      "700": "#404040",
      "950": "#0A0A0A"
    },
    system: {
      "success": "#16A34A",
      "warning": "#F59E0B",
      "error": "#DC2626",
      "info": "#2563EB"
    },
    spacing: {
      "8": "8px",
      "16": "16px"
    },
    radius: {
      "4": "4px",
      "8": "8px"
    },
    typography: {
      "base": "16px",
      "regular": "400"
    }
  },
  library: "tailwind"
};

// Test de l'intégration
try {
  console.log("🧪 Test d'intégration generateSemanticTokens");

  const primitiveTokens = mockExtractedData.tokens;
  const semanticTokens = generateSemanticTokens(primitiveTokens, { contrastCheck: true });

  console.log("✅ generateSemanticTokens fonctionne avec les données extraites");
  console.log("📊 Tokens générés:", Object.keys(semanticTokens).length);

  // Vérifier quelques valeurs clés
  console.log("🔍 Vérification des valeurs:");
  console.log("  bg.canvas:", semanticTokens['bg.canvas']);
  console.log("  text.primary:", semanticTokens['text.primary']);
  console.log("  action.primary.default:", semanticTokens['action.primary.default']);

} catch (error) {
  console.error("❌ Erreur:", error);
}

