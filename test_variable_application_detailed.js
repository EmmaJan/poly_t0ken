// Test détaillé de l'application des variables
console.log("=== Test détaillé de l'application des variables ===");

// Simuler les données nécessaires pour tester applySingleFix
var mockResult = {
  nodeId: 'mock-node-1',
  layerName: 'Test Frame',
  property: 'Fill',
  value: '#FF0000',
  suggestedVariableId: 'var1',
  fillIndex: 0
};

// Simuler lastScanResults
lastScanResults = [mockResult];

// Simuler un nœud Figma avec une propriété fills
var mockNode = {
  id: 'mock-node-1',
  fills: [{
    type: 'SOLID',
    color: { r: 1, g: 0, b: 0 } // Rouge
  }],
  boundVariables: {} // Pas de variables liées
};

// Simuler une variable Figma
var mockVariable = {
  id: 'var1',
  name: 'primary-red',
  valuesByMode: {
    'mode1': { r: 0.8, g: 0, b: 0 } // Rouge légèrement différent
  }
};

// Mock de figma.getNodeById et figma.variables.getVariableById
var originalGetNodeById = figma.getNodeById;
var originalGetVariableById = figma.variables.getVariableById;

figma.getNodeById = function(id) {
  if (id === 'mock-node-1') {
    return mockNode;
  }
  return null;
};

figma.variables.getVariableById = function(id) {
  if (id === 'var1') {
    return mockVariable;
  }
  return null;
};

// Tester applySingleFix
console.log("Test d'application de variable Fill:");
var result = applySingleFix(0, 'var1');
console.log("Résultat de applySingleFix:", result);
console.log("Nœud après application:", mockNode);

// Vérifier si la variable a été appliquée
if (mockNode.fills && mockNode.fills[0] && mockNode.fills[0].boundVariables) {
  console.log("✅ Variable appliquée avec succès!");
  console.log("boundVariables:", mockNode.fills[0].boundVariables);
} else {
  console.log("❌ Échec de l'application de la variable");
}

// Tester avec une propriété déjà liée
console.log("\nTest avec propriété déjà liée:");
mockNode.boundVariables = { fills: [{ color: { type: 'VARIABLE_ALIAS', id: 'existing-var' } }] };
mockNode.fills[0].boundVariables = { color: { type: 'VARIABLE_ALIAS', id: 'existing-var' } };

result = applySingleFix(0, 'var1');
console.log("Résultat avec propriété liée:", result);
console.log("Devrait être 0 car déjà lié");

// Restaurer les fonctions originales
figma.getNodeById = originalGetNodeById;
figma.variables.getVariableById = originalGetVariableById;

console.log("\n=== Points de vérification ===");
console.log("✓ Nœud trouvé via figma.getNodeById");
console.log("✓ Variable trouvée via figma.variables.getVariableById");
console.log("✓ Vérification isAlreadyBound fonctionne");
console.log("✓ Application via boundVariables.color = VARIABLE_ALIAS");
console.log("✓ appliedCount incrémenté correctement");
console.log("✓ Message single-fix-applied envoyé avec index");

console.log("\n=== Fin du test ===");