// Test de l'application des variables pour diagnostiquer le problème
console.log("=== Test de l'application des variables ===");

// Mock des fonctions Figma
var originalGetVariableByIdAsync = figma.variables.getVariableByIdAsync;
var originalGetNodeById = figma.getNodeById;
var originalLoadFontAsync = figma.loadFontAsync;

figma.variables.getVariableByIdAsync = function(id) {
  console.log("[MOCK] getVariableByIdAsync appelé avec ID:", id);
  return Promise.resolve({
    id: id,
    name: id === 'test-color-var' ? 'Primary Color' : 'Test Variable',
    modes: [{ modeId: 'default' }],
    valuesByMode: {
      'default': id === 'test-color-var' ? { r: 1, g: 0, b: 0 } : { r: 0, g: 1, b: 0 }
    }
  });
};

figma.loadFontAsync = function(fontName) {
  console.log("[MOCK] loadFontAsync appelé avec:", fontName);
  return Promise.resolve();
};

// Mock d'un nœud avec des fills
var mockNode = {
  id: 'test-node',
  type: 'FRAME',
  name: 'Test Frame',
  fills: [{
    type: 'SOLID',
    color: { r: 0.5, g: 0.5, b: 0.5 }
  }],
  boundVariables: {},
  fillStyleId: 'old-style-id'
};

figma.getNodeById = function(id) {
  console.log("[MOCK] getNodeById appelé avec:", id);
  if (id === 'test-node') return mockNode;
  return null;
};

// Test de applySingleFix
lastScanResults = [{
  nodeId: 'test-node',
  property: 'Fill',
  fillIndex: 0,
  suggestedVariableId: 'test-color-var'
}];

console.log("État initial du nœud:");
console.log("- fills[0].color:", mockNode.fills[0].color);
console.log("- boundVariables:", mockNode.boundVariables);
console.log("- fillStyleId:", mockNode.fillStyleId);

console.log("\nApplication de la correction...");

applySingleFix(0, 'test-color-var').then(function(result) {
  console.log("\nRésultat de applySingleFix:", result);

  console.log("État final du nœud:");
  console.log("- fills[0].color:", mockNode.fills[0].color);
  console.log("- fills[0].boundVariables:", mockNode.fills[0].boundVariables);
  console.log("- boundVariables:", mockNode.boundVariables);
  console.log("- fillStyleId:", mockNode.fillStyleId);

  // Vérifier que la variable a été appliquée
  var hasBoundVariable = mockNode.fills[0].boundVariables &&
                         mockNode.fills[0].boundVariables.color &&
                         mockNode.fills[0].boundVariables.color.type === 'VARIABLE_ALIAS' &&
                         mockNode.fills[0].boundVariables.color.id === 'test-color-var';

  console.log("\nTest réussi:", hasBoundVariable && !mockNode.fillStyleId);

  // Restaurer les fonctions originales
  figma.variables.getVariableByIdAsync = originalGetVariableByIdAsync;
  figma.getNodeById = originalGetNodeById;
  figma.loadFontAsync = originalLoadFontAsync;

  console.log("\n=== Fin du test ===");
}).catch(function(error) {
  console.error("Erreur lors du test:", error);
});