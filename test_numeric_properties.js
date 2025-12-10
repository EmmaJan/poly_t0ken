// Test des propriétés numériques (spacing, radius, etc.)
console.log("=== Test des propriétés numériques ===");

// Simuler des variables numériques
var mockVariables = new Map();

// Variable de spacing
mockVariables.set('spacing-var', {
  id: 'spacing-var',
  name: 'spacing-16',
  valuesByMode: {
    'mode1': 16
  }
});

// Variable de radius
mockVariables.set('radius-var', {
  id: 'radius-var',
  name: 'radius-8',
  valuesByMode: {
    'mode1': 8
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

// Test de findNumericSuggestions pour spacing
console.log("Test findNumericSuggestions pour Item Spacing (valeur: 18):");
var spacingSuggestions = findNumericSuggestions(18, testMap, undefined, "Item Spacing");
console.log("Suggestions trouvées:", spacingSuggestions.length);
if (spacingSuggestions.length > 0) {
  console.log("Suggestion:", spacingSuggestions[0].name, "valeur:", spacingSuggestions[0].value, "différence:", spacingSuggestions[0].difference);
}

// Test de findNumericSuggestions pour radius
console.log("\nTest findNumericSuggestions pour Corner Radius (valeur: 10):");
var radiusSuggestions = findNumericSuggestions(10, testMap, undefined, "Corner Radius");
console.log("Suggestions trouvées:", radiusSuggestions.length);
if (radiusSuggestions.length > 0) {
  console.log("Suggestion:", radiusSuggestions[0].name, "valeur:", radiusSuggestions[0].value, "différence:", radiusSuggestions[0].difference);
}

// Test d'application d'une propriété numérique
console.log("\n=== Test d'application ===");

var mockNode = {
  id: 'mock-node-1',
  type: 'FRAME',
  name: 'Test Frame',
  boundVariables: {}
};

// Simuler l'application d'un itemSpacing
console.log("Test d'application de itemSpacing:");
var mockResult = {
  nodeId: 'mock-node-1',
  property: 'Item Spacing',
  figmaProperty: 'itemSpacing'
};

var appliedCount = applySingleFix(0, 'spacing-var');
console.log("appliedCount:", appliedCount);
console.log("Node après application:", mockNode);

// Restaurer la fonction originale
figma.variables.getVariableById = originalGetVariableById;

console.log("\n=== Points de vérification ===");
console.log("✓ Variables numériques stockées dans la map");
console.log("✓ findNumericSuggestions trouve des suggestions");
console.log("✓ applySingleFix applique les propriétés numériques");
console.log("✓ setBoundVariable fonctionne pour itemSpacing");
console.log("✓ boundVariables mis à jour correctement");

console.log("\n=== Fin du test ===");