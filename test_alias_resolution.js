// Test de la résolution des alias de variables
console.log("=== Test de la résolution des alias ===");

// Mock d'une structure de variables avec alias
var mockVariables = new Map();

// Variable principale (couleur de base)
mockVariables.set('var1', {
  id: 'var1',
  name: 'primary-500',
  valuesByMode: {
    'mode1': { r: 0.2, g: 0.5, b: 0.8 } // RGB pour #3366CC
  }
});

// Alias pointant vers la variable principale
mockVariables.set('var2', {
  id: 'var2',
  name: 'primary-main',
  valuesByMode: {
    'mode1': { type: 'VARIABLE_ALIAS', id: 'var1' }
  }
});

// Alias pointant vers un alias (chaîne de références)
mockVariables.set('var3', {
  id: 'var3',
  name: 'accent',
  valuesByMode: {
    'mode1': { type: 'VARIABLE_ALIAS', id: 'var2' }
  }
});

// Mock de figma.variables.getVariableById
var originalGetVariableById = figma.variables.getVariableById;
figma.variables.getVariableById = function(id) {
  return mockVariables.get(id) || null;
};

console.log("Test de résolution simple (alias direct):");
var aliasVar = mockVariables.get('var2');
var resolved = resolveVariableValue(aliasVar, 'mode1');
console.log("Résultat:", resolved);
console.log("Attendu: {r: 0.2, g: 0.5, b: 0.8}");

console.log("\nTest de résolution en chaîne (alias vers alias):");
var chainAliasVar = mockVariables.get('var3');
var chainResolved = resolveVariableValue(chainAliasVar, 'mode1');
console.log("Résultat:", chainResolved);
console.log("Attendu: {r: 0.2, g: 0.5, b: 0.8}");

console.log("\nTest de conversion hex:");
if (resolved && isColorValue(resolved)) {
  var hex = rgbToHex(resolved);
  console.log("Hex converti:", hex);
  console.log("Attendu: #3366CC");
}

// Restaurer la fonction originale
figma.variables.getVariableById = originalGetVariableById;

console.log("\n=== Fin du test ===");