// Test de la détection des couleurs orphelines (sans variables correspondantes)
console.log("=== Test de la détection des couleurs orphelines ===");

// Mock de variables existantes (seulement quelques-unes)
var mockVariables = new Map();

// Variable existante pour les tests
mockVariables.set('var1', {
  id: 'var1',
  name: 'primary-500',
  valuesByMode: {
    'mode1': { r: 0.2, g: 0.5, b: 0.8 } // #3366CC
  }
});

// Mock de figma.variables.getVariableById
var originalGetVariableById = figma.variables.getVariableById;
figma.variables.getVariableById = function(id) {
  return mockVariables.get(id) || null;
};

// Créer une map de test
var testMap = createValueToVariableMap();
console.log("Variables dans la map:", testMap.size);

// Test avec une couleur qui a une correspondance
var suggestions1 = findColorSuggestions("#3366CC", testMap, "Fill");
console.log("Suggestions pour #3366CC (devrait en trouver):", suggestions1.length);

// Test avec une couleur orpheline (sans correspondance)
var suggestions2 = findColorSuggestions("#FF0000", testMap, "Fill");
console.log("Suggestions pour #FF0000 (devrait être orpheline):", suggestions2.length);

// Test du mode orphan report - simulation d'un nœud avec couleur en dur
console.log("\n=== Simulation de scan avec couleur orpheline ===");

var mockNode = {
  id: 'node1',
  name: 'Test Frame',
  fills: [{ type: 'SOLID', color: { r: 1, g: 0, b: 0 } }], // #FF0000 - couleur orpheline
  boundVariables: {}
};

var results = [];
checkFillsSafely(mockNode, testMap, results);

console.log("Résultats du scan:", results.length);
if (results.length > 0) {
  console.log("Premier résultat:", {
    property: results[0].property,
    value: results[0].value,
    isOrphan: results[0].isOrphan,
    suggestionsCount: results[0].colorSuggestions ? results[0].colorSuggestions.length : 0
  });
}

// Test de distance minimum
console.log("\nDistance minimum trouvée devrait être affichée dans les logs ci-dessus");

// Restaurer la fonction originale
figma.variables.getVariableById = originalGetVariableById;

console.log("\n=== Fin du test ===");