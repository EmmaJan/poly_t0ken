// Test de setBoundVariable pour les fills
console.log("=== Test de setBoundVariable ===");

// Mock d'un nœud avec setBoundVariable
var mockNode = {
  id: 'test-node',
  fills: [{
    type: 'SOLID',
    color: { r: 0.5, g: 0.5, b: 0.5 }
  }],
  boundVariables: {},
  setBoundVariable: function(path, variable) {
    console.log('[MOCK setBoundVariable] Appelé avec path:', path, 'variable:', variable.name);
    // Simuler l'application de la variable
    if (!this.boundVariables) this.boundVariables = {};
    if (path === 'fills[0].color') {
      if (!this.fills[0].boundVariables) this.fills[0].boundVariables = {};
      this.fills[0].boundVariables.color = {
        type: 'VARIABLE_ALIAS',
        id: variable.id
      };
      return true;
    }
    throw new Error('Invalid path');
  }
};

var mockVariable = {
  id: 'test-var',
  name: 'Test Variable'
};

// Test de setBoundVariable
console.log("Test de node.setBoundVariable('fills[0].color', variable):");

try {
  mockNode.setBoundVariable('fills[0].color', mockVariable);
  console.log("État après setBoundVariable:");
  console.log("- boundVariables:", mockNode.boundVariables);
  console.log("- fills[0].boundVariables:", mockNode.fills[0].boundVariables);

  var success = mockNode.fills[0].boundVariables &&
               mockNode.fills[0].boundVariables.color &&
               mockNode.fills[0].boundVariables.color.type === 'VARIABLE_ALIAS' &&
               mockNode.fills[0].boundVariables.color.id === 'test-var';

  console.log("Test réussi:", success);
} catch (error) {
  console.error("Erreur:", error);
}

console.log("\n=== Fin du test ===");

