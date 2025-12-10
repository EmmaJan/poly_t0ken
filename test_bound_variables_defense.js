// Test de la gestion défensive des boundVariables
console.log("=== Test de la gestion défensive des boundVariables ===");

// Test avec différents types de nœuds
var mockNodes = [
  // Nœud normal avec boundVariables
  {
    id: 'node1',
    type: 'FRAME',
    name: 'Normal Frame',
    boundVariables: {
      fills: [{ type: 'VARIABLE_ALIAS', id: 'var1' }],
      cornerRadius: { type: 'VARIABLE_ALIAS', id: 'var2' }
    }
  },
  // Nœud sans boundVariables
  {
    id: 'node2',
    type: 'RECTANGLE',
    name: 'Rectangle sans boundVariables'
  },
  // Nœud avec boundVariables undefined
  {
    id: 'node3',
    type: 'ELLIPSE',
    name: 'Ellipse avec boundVariables undefined',
    boundVariables: undefined
  },
  // Nœud avec boundVariables null
  {
    id: 'node4',
    type: 'POLYGON',
    name: 'Polygon avec boundVariables null',
    boundVariables: null
  }
];

// Mock de figma.variables.getVariableById
var originalGetVariableById = figma.variables.getVariableById;
figma.variables.getVariableById = function(id) {
  return id === 'var1' || id === 'var2' ? { id: id, name: 'Mock Variable' } : null;
};

console.log("Test de isPropertyBoundToVariable avec différents scénarios:");

// Test avec nœud normal
var result1 = isPropertyBoundToVariable(mockNodes[0].boundVariables, 'fills', 0);
console.log("Nœud normal - fills[0] lié:", result1);

// Test avec nœud sans boundVariables
var result2 = isPropertyBoundToVariable(mockNodes[1].boundVariables, 'fills', 0);
console.log("Nœud sans boundVariables - fills[0] lié:", result2);

// Test avec boundVariables undefined
var result3 = isPropertyBoundToVariable(mockNodes[2].boundVariables, 'cornerRadius');
console.log("Nœud avec boundVariables undefined - cornerRadius lié:", result3);

// Test avec boundVariables null
var result4 = isPropertyBoundToVariable(mockNodes[3].boundVariables, 'fills', 0);
console.log("Nœud avec boundVariables null - fills[0] lié:", result4);

console.log("\n=== Test des fonctions de vérification ===");

// Test checkFillsSafely avec différents nœuds
var testMap = new Map();
var results = [];

console.log("Test checkFillsSafely avec nœud sans boundVariables:");
checkFillsSafely(mockNodes[1], testMap, results);
console.log("Résultats après checkFillsSafely:", results.length);

console.log("Test checkFillsSafely avec nœud boundVariables null:");
results = [];
checkFillsSafely(mockNodes[3], testMap, results);
console.log("Résultats après checkFillsSafely:", results.length);

// Restaurer la fonction originale
figma.variables.getVariableById = originalGetVariableById;

console.log("\n=== Fin du test ===");