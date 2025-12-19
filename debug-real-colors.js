// Script pour diagnostiquer les vraies couleurs des primitives Figma
console.log("🔍 DIAGNOSTIC DES VRAIES COULEURS FIGMA");

// Script à copier-coller dans la console développeur de Figma
const diagnosticScript = `
// Copiez-collez ce code dans : Menu → Plugins → Développement → Ouvrir console développeur

console.log("=== DIAGNOSTIC DES COULEURS PRIMITIVES FIGMA ===");

try {
  const collections = figma.variables.getLocalVariableCollections();

  collections.forEach(collection => {
    let category = "unknown";
    const collectionName = collection.name.toLowerCase().trim();

    // Même logique que dans le code
    if (collectionName === "brand colors" || collectionName.includes('brand')) category = "brand";
    else if (collectionName === "system colors" || collectionName.includes('system')) category = "system";
    else if (collectionName === "grayscale" || collectionName.includes('gray') || collectionName.includes('grey')) category = "gray";

    if (category === "brand" || category === "system") {
      console.log(\`\\n📁 \${category.toUpperCase()} (\${collection.name}):\`);

      collection.variableIds.forEach(varId => {
        try {
          const variable = figma.variables.getVariableById(varId);
          if (variable) {
            const modeId = Object.keys(variable.valuesByMode)[0];
            const value = variable.valuesByMode[modeId];
            const key = variable.name;

            // Afficher seulement les couleurs importantes
            if (category === "brand" && (key === "main" || key === "light" || key === "dark")) {
              console.log(\`  \${key}: \${value} ← COULEUR BRAND IMPORTANTE\`);
            } else if (category === "system" && key.includes("main")) {
              console.log(\`  \${key}: \${value}\`);
            }
          }
        } catch (error) {
          console.warn(\`  Erreur avec variable \${varId}:\`, error);
        }
      });
    }
  });

  console.log("\\n🎯 TEST RAPIDE DES SÉMANTIQUES CRITIQUES:");

  // Tester quelques résolutions clés
  const testCases = [
    { token: 'action.primary.default', system: 'mui', expectedKey: 'main' },
    { token: 'action.primary.default', system: 'tailwind', expectedKey: 'main' },
    { token: 'status.success', system: 'mui', expectedKey: 'success-main' }
  ];

  testCases.forEach(testCase => {
    console.log(\`\\n🧪 \${testCase.system.toUpperCase()} - \${testCase.token}:\`);

    // Simuler la logique de résolution (simplifiée)
    let foundColor = null;
    let foundKey = null;

    try {
      const collections = figma.variables.getLocalVariableCollections();

      for (const collection of collections) {
        let category = "unknown";
        const collectionName = collection.name.toLowerCase().trim();

        if (collectionName === "brand colors" || collectionName.includes('brand')) category = "brand";
        else if (collectionName === "system colors" || collectionName.includes('system')) category = "system";

        if ((testCase.token.startsWith('action.') && category === 'brand') ||
            (testCase.token.startsWith('status.') && category === 'system')) {

          for (const varId of collection.variableIds) {
            const variable = figma.variables.getVariableById(varId);
            if (variable && variable.name === testCase.expectedKey) {
              const modeId = Object.keys(variable.valuesByMode)[0];
              foundColor = variable.valuesByMode[modeId];
              foundKey = variable.name;
              break;
            }
          }
        }

        if (foundColor) break;
      }
    } catch (error) {
      console.error("Erreur lors du test:", error);
    }

    if (foundColor) {
      console.log(\`  ✅ Trouvé: \${foundColor} (via \${foundKey})\`);
    } else {
      console.log(\`  ❌ Non trouvé: \${testCase.expectedKey}\`);
    }
  });

  console.log("\\n💡 INSTRUCTIONS:");
  console.log("1. Copiez les couleurs BRAND affichées ci-dessus");
  console.log("2. Vérifiez si elles correspondent à ce que vous voyez dans votre tableau");
  console.log("3. Si les couleurs sont bonnes mais pas affichées, rechargez Figma");
  console.log("4. Si les couleurs sont mauvaises, vos primitives utilisent des noms différents");

} catch (error) {
  console.error("❌ Erreur:", error);
}
`;

console.log("📋 SCRIPT À COPIER DANS LA CONSOLE FIGMA:");
console.log("=".repeat(60));
console.log(diagnosticScript);
console.log("=".repeat(60));

console.log("\n🎯 UNE FOIS EXÉCUTÉ, L'UTILISATEUR DEVRA ME DIRE:");
console.log("• Quelle est la couleur brand.main affichée");
console.log("• Quelle est la couleur brand.light affichée");
console.log("• Quelle est la couleur brand.dark affichée");
console.log("• Les résultats des tests rapides");
