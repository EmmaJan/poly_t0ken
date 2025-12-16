// Test simple de la fonction extractVariableKey

function extractVariableKey(variable, collectionName) {
  if (!variable || !variable.name) return null;

  var name = variable.name;

  // Déterminer la catégorie selon le nom de collection
  var category = null;
  if (collectionName === "Brand Colors") {
    // Pour brand: "primary/600" -> "600", "primary" -> "500"
    if (name.startsWith("primary/")) {
      return name.replace("primary/", "");
    } else if (name === "primary") {
      return "500"; // default brand
    }
  } else if (collectionName === "System Colors") {
    // Pour system: nom direct ("success", "warning", etc.)
    return name;
  } else if (collectionName === "Grayscale") {
    // Pour gray: "gray-50" -> "50", "grey-100" -> "100"
    var grayMatch = name.match(/^(gray|grey)-(.+)$/);
    if (grayMatch) {
      return grayMatch[2];
    }
  } else if (collectionName === "Spacing") {
    // Pour spacing: "spacing-8" -> "8", "spacing-2" -> "2"
    if (name.startsWith("spacing-")) {
      return name.replace("spacing-", "").replace(/-/g, ".");
    }
  } else if (collectionName === "Radius") {
    // Pour radius: "radius-4" -> "4", "radius-sm" -> "sm"
    if (name.startsWith("radius-")) {
      return name.replace("radius-", "").replace(/-/g, ".");
    }
  } else if (collectionName === "Typography") {
    // Pour typography: "typo-base" -> "base", "typo-regular" -> "regular"
    if (name.startsWith("typo-")) {
      return name.replace("typo-", "").replace(/-/g, ".");
    }
  }

  return null;
}

console.log("🧪 Test extractVariableKey:");

// Test cases
const testCases = [
  { variable: { name: 'gray-50' }, collectionName: 'Grayscale', expected: '50' },
  { variable: { name: 'primary/600' }, collectionName: 'Brand Colors', expected: '600' },
  { variable: { name: 'success' }, collectionName: 'System Colors', expected: 'success' },
  { variable: { name: 'spacing-8' }, collectionName: 'Spacing', expected: '8' },
  { variable: { name: 'radius-4' }, collectionName: 'Radius', expected: '4' },
  { variable: { name: 'typo-base' }, collectionName: 'Typography', expected: 'base' }
];

testCases.forEach(testCase => {
  const result = extractVariableKey(testCase.variable, testCase.collectionName);
  const success = result === testCase.expected;
  console.log(`  ${testCase.collectionName} "${testCase.variable.name}" -> "${result}" (${success ? '✅' : '❌'} expected: "${testCase.expected}")`);
});

console.log("\n🏁 Test terminé!");

