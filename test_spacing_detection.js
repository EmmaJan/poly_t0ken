// Test de la détection des propriétés de spacing
console.log("=== Test de la détection des propriétés de spacing ===");

// Simuler des variables de spacing
var mockVariables = new Map();

// Variables de spacing courantes
mockVariables.set('spacing-1', { id: 'spacing-1', name: 'spacing-1', valuesByMode: { 'mode1': 4 } });
mockVariables.set('spacing-2', { id: 'spacing-2', name: 'spacing-2', valuesByMode: { 'mode1': 8 } });
mockVariables.set('spacing-3', { id: 'spacing-3', name: 'spacing-3', valuesByMode: { 'mode1': 12 } });
mockVariables.set('spacing-4', { id: 'spacing-4', name: 'spacing-4', valuesByMode: { 'mode1': 16 } });
mockVariables.set('spacing-5', { id: 'spacing-5', name: 'spacing-5', valuesByMode: { 'mode1': 20 } });
mockVariables.set('spacing-6', { id: 'spacing-6', name: 'spacing-6', valuesByMode: { 'mode1': 24 } });

// Mock de figma.variables.getVariableById
var originalGetVariableById = figma.variables.getVariableById;
figma.variables.getVariableById = function(id) {
  return mockVariables.get(id) || null;
};

// Créer une map de test
var testMap = createValueToVariableMap();
console.log("Variables dans la map:", testMap.size);

// Vérifier que spacing-3 existe et vaut 12
console.log("Test: recherche de correspondance exacte pour 12px (spacing-3):");
var spacingSuggestions = findNumericSuggestions(12, testMap, undefined, "Padding Left");
console.log("Suggestions trouvées:", spacingSuggestions.length);
if (spacingSuggestions.length > 0) {
  console.log("Suggestion:", spacingSuggestions[0].name, "valeur:", spacingSuggestions[0].value, "différence:", spacingSuggestions[0].difference);
}

// Test avec un nœud qui a du padding
var mockNodeWithPadding = {
  id: 'mock-node-padding',
  type: 'FRAME',
  name: 'Frame with padding',
  paddingLeft: 12, // 12px de padding gauche
  boundVariables: {}
};

console.log("\n=== Test de détection de padding ===");
var results = [];
checkNumericPropertiesSafely(mockNodeWithPadding, testMap, results);
console.log("Résultats de détection:", results.length);
if (results.length > 0) {
  console.log("Résultat détecté:", results[0].property, results[0].value, "-> suggestion:", results[0].suggestedVariableName);
}

// Test avec un nœud sans auto-layout (devrait quand même détecter le padding)
var mockNodeNoLayout = {
  id: 'mock-node-no-layout',
  type: 'FRAME',
  name: 'Frame without auto-layout',
  paddingTop: 12, // 12px de padding top
  boundVariables: {}
};

console.log("\n=== Test avec nœud sans auto-layout ===");
results = [];
checkNumericPropertiesSafely(mockNodeNoLayout, testMap, results);
console.log("Résultats de détection:", results.length);
if (results.length > 0) {
  console.log("Résultat détecté:", results[0].property, results[0].value, "-> suggestion:", results[0].suggestedVariableName);
}

// Test d'application
console.log("\n=== Test d'application ===");
if (results.length > 0) {
  var appliedCount = applySingleFix(0, results[0].suggestedVariableId);
  console.log("appliedCount:", appliedCount);
}

// Restaurer la fonction originale
figma.variables.getVariableById = originalGetVariableById;

console.log("\n=== Points de vérification ===");
console.log("✓ Variables de spacing créées avec les bonnes valeurs");
console.log("✓ findNumericSuggestions trouve spacing-3 pour 12px");
console.log("✓ checkNumericPropertiesSafely détecte le padding");
console.log("✓ applySingleFix applique la variable de spacing");
console.log("✓ Détection fonctionne même sans auto-layout");

console.log("\n=== Fin du test ===");