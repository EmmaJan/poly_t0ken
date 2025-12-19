// Test pour comprendre le problème de nommage Ant
console.log("🔍 DEBUG NOMENCLATURE ANT");

// Simuler generateBrandColors pour Ant
function generateBrandColorsAnt() {
  // Simuler les valeurs HSL
  const palette5 = {
    subtle: "#F5F5F5",
    light: "#D9D9D9",
    base: "#595959",    // Couleur principale Ant
    hover: "#434343",
    dark: "#262626"
  };

  return {
    "1": palette5.subtle,
    "2": palette5.light,
    "3": palette5.base,
    "4": palette5.hover,
    "5": palette5.dark
  };
}

// Simuler extractVariableKey pour différents formats de noms
function extractVariableKey(variableName, collectionName) {
  if (!variableName) return null;

  var raw = variableName.toLowerCase();
  raw = raw.split('/').pop().trim();
  raw = raw.replace(/\s+/g, '');
  raw = raw.replace(/\(.*\)$/g, '').trim();
  var name = raw;

  var c = (collectionName || '').toLowerCase();
  var isBrand = c.includes('brand');

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
  }

  return name;
}

// Tester différents formats de noms de variables Figma pour Ant
console.log("\n📋 TESTS DE NOMS DE VARIABLES FIGMA POUR ANT\n");

const possibleVariableNames = [
  "1", "2", "3", "4", "5",           // Format simple
  "ant-1", "ant-2", "ant-3",         // Avec prefix
  "brand-1", "brand-2", "brand-3",   // Format brand
  "primary-1", "primary-2", "primary-3", // Format primary
  "ant/1", "ant/2", "ant/3",         // Avec slash
  "Brand Colors/ant-1", "Brand Colors/ant-2" // Format complet
];

console.log("Format des noms de variables Figma → Clé extraite:");
possibleVariableNames.forEach(name => {
  const extracted = extractVariableKey(name, "Brand Colors");
  const status = ["1", "2", "3", "4", "5"].includes(extracted) ? "✅ MATCH" : "❌ NO MATCH";
  console.log(`  "${name}" → "${extracted}" ${status}`);
});

// Simuler les variables générées
console.log("\n🏗️ VARIABLES GÉNÉRÉES PAR generateBrandColors('ant'):");
const generatedBrand = generateBrandColorsAnt();
Object.entries(generatedBrand).forEach(([key, color]) => {
  console.log(`  "${key}": "${color}"`);
});

// Tester la correspondance
console.log("\n🎯 CORRESPONDANCE MAPPING → GÉNÉRATION:");
const antMappings = {
  'action.primary.default': ['3'],
  'action.primary.hover': ['4'],
  'action.primary.active': ['5']
};

Object.entries(antMappings).forEach(([semantic, keys]) => {
  console.log(`\n${semantic}:`);
  keys.forEach(key => {
    const exists = generatedBrand[key] !== undefined;
    const color = generatedBrand[key] || "N/A";
    console.log(`  "${key}" → ${exists ? "✅ Existe" : "❌ N'existe pas"} (${color})`);
  });
});

// Diagnostic du problème potentiel
console.log("\n🔍 DIAGNOSTIC DU PROBLÈME POTENTIEL:");
console.log("Si les variables Figma sont nommées 'ant-1', 'ant-2', etc.:");
console.log("  → extractVariableKey('ant-1') = 'ant-1' (pas '1')");
console.log("  → Le mapping cherche '3' mais trouve 'ant-3'");
console.log("  → ÉCHEC de correspondance !");

console.log("\n💡 SOLUTIONS POSSIBLES:");
console.log("1. Renommer les variables Figma générées pour Ant (de 'ant-1' vers '1')");
console.log("2. Modifier extractVariableKey pour reconnaître 'ant-1' → '1'");
console.log("3. Adapter le mapping Ant pour utiliser 'ant-3', 'ant-4', 'ant-5'");

console.log("\n🎯 CONCLUSION:");
console.log("Il faut vérifier comment les variables Figma sont réellement nommées pour Ant !");

console.log("\n🎉 FIN DU DEBUG ANT!");