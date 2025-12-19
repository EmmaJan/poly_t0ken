// Script de diagnostic pour la console Figma
// Copiez-collez ce code dans la console développeur de Figma pour diagnostiquer les primitives

console.log("🔍 DIAGNOSTIC FIGMA - Primitives et sémantiques");

// Fonction principale de diagnostic
function diagnoseFigmaPrimitives() {
  console.log("=== DIAGNOSTIC DES PRIMITIVES FIGMA ===\n");

  try {
    // 1. Lister toutes les collections
    const collections = figma.variables.getLocalVariableCollections();
    console.log(`📂 ${collections.length} collections trouvées:`);

    collections.forEach(collection => {
      console.log(`  ${collection.name} (ID: ${collection.id})`);
    });

    // 2. Analyser chaque collection
    const primitives = {};

    collections.forEach(collection => {
      let category = "unknown";
      const collectionName = collection.name.toLowerCase().trim();

      // Déterminer la catégorie (même logique que dans le code)
      if (collectionName === "brand colors" || collectionName.includes('brand')) category = "brand";
      else if (collectionName === "system colors" || collectionName.includes('system')) category = "system";
      else if (collectionName === "grayscale" || collectionName.includes('gray') || collectionName.includes('grey') || collectionName.includes('grayscale')) category = "gray";
      else if (collectionName === "spacing" || collectionName.includes('spacing')) category = "spacing";
      else if (collectionName === "radius" || collectionName.includes('radius')) category = "radius";
      else if (collectionName === "typography" || collectionName.includes('typo') || collectionName.includes('typography')) category = "typography";

      if (!primitives[category]) primitives[category] = {};

      console.log(`\n📁 ${category.toUpperCase()} (${collection.name}):`);

      // Lister les variables de cette collection
      collection.variableIds.forEach(varId => {
        try {
          const variable = figma.variables.getVariableById(varId);
          if (variable) {
            // Prendre la valeur par défaut (premier mode disponible)
            const modeId = Object.keys(variable.valuesByMode)[0];
            const value = variable.valuesByMode[modeId];
            const key = variable.name;

            primitives[category][key] = value;
            console.log(`  ${key}: ${value}`);
          }
        } catch (error) {
          console.warn(`  Erreur avec variable ${varId}:`, error);
        }
      });
    });

    // 3. Tester la résolution des sémantiques
    console.log("\n🧪 TEST RÉSOLUTION SÉMANTIQUE:");

    const libraries = ['tailwind', 'ant', 'mui', 'bootstrap'];
    const testTokens = ['action.primary.default', 'bg.canvas', 'text.primary', 'status.success'];

    libraries.forEach(lib => {
      console.log(`\n🎨 ${lib.toUpperCase()}:`);

      testTokens.forEach(token => {
        let resolved = null;

        // Simuler la logique de résolution pour chaque lib
        if (lib === 'tailwind') {
          if (token === 'action.primary.default') resolved = primitives.brand?.['600'];
          else if (token === 'bg.canvas') resolved = primitives.gray?.['50'];
          else if (token === 'text.primary') resolved = primitives.gray?.['950'];
          else if (token === 'status.success') resolved = primitives.system?.['success'];
        } else if (lib === 'mui') {
          if (token === 'action.primary.default') resolved = primitives.brand?.['500'];
          else if (token === 'bg.canvas') resolved = primitives.gray?.['50'];
          else if (token === 'text.primary') resolved = primitives.gray?.['950'];
          else if (token === 'status.success') resolved = primitives.system?.['success'];
        } else if (lib === 'ant') {
          if (token === 'action.primary.default') resolved = primitives.brand?.['600'];
          else if (token === 'bg.canvas') resolved = primitives.gray?.['50'];
          else if (token === 'text.primary') resolved = primitives.gray?.['950'];
          else if (token === 'status.success') resolved = primitives.system?.['success'];
        } else if (lib === 'bootstrap') {
          if (token === 'action.primary.default') resolved = primitives.brand?.['500'];
          else if (token === 'bg.canvas') resolved = primitives.gray?.['50'];
          else if (token === 'text.primary') resolved = primitives.gray?.['950'];
          else if (token === 'status.success') resolved = primitives.system?.['success'];
        }

        const status = resolved ? `✅ ${resolved}` : `❌ NON RÉSOLU`;
        console.log(`  ${token}: ${status}`);
      });
    });

    // 4. Résumé
    console.log("\n📊 RÉSUMÉ:");
    console.log(`Collections: ${collections.length}`);
    console.log(`Catégories trouvées: ${Object.keys(primitives).join(', ')}`);

    const hasBrand = primitives.brand && Object.keys(primitives.brand).length > 0;
    const hasGray = primitives.gray && Object.keys(primitives.gray).length > 0;
    const hasSystem = primitives.system && Object.keys(primitives.system).length > 0;

    console.log(`Brand colors: ${hasBrand ? '✅' : '❌'} (${hasBrand ? Object.keys(primitives.brand).length : 0} variables)`);
    console.log(`Gray scale: ${hasGray ? '✅' : '❌'} (${hasGray ? Object.keys(primitives.gray).length : 0} variables)`);
    console.log(`System colors: ${hasSystem ? '✅' : '❌'} (${hasSystem ? Object.keys(primitives.system).length : 0} variables)`);

    if (!hasBrand || !hasGray || !hasSystem) {
      console.log("\n⚠️ PROBLÈME: Certaines catégories de primitives sont manquantes!");
      console.log("Vérifiez que vos variables Figma sont organisées dans des collections avec ces noms:");
      console.log("- 'Brand Colors' ou contenant 'brand'");
      console.log("- 'Gray Scale' ou contenant 'gray/grey/grayscale'");
      console.log("- 'System Colors' ou contenant 'system'");
    }

    return primitives;

  } catch (error) {
    console.error("❌ Erreur lors du diagnostic:", error);
    console.log("\n💡 Ce script doit être exécuté dans la console développeur de Figma");
    console.log("Ouvrez Figma → Menu → Plugins → Développement → Ouvrir console développeur");
  }
}

// Exécuter le diagnostic
const result = diagnoseFigmaPrimitives();

// Exposer le résultat pour inspection
window.figmaPrimitives = result;
