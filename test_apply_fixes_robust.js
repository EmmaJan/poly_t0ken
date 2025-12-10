// Test de l'application robuste des corrections
console.log("=== Test de l'application robuste des corrections ===");

// Mock de figma.loadFontAsync
var originalLoadFontAsync = figma.loadFontAsync;
figma.loadFontAsync = function(fontName) {
  console.log("Mock loadFontAsync appelé pour:", fontName);
  return Promise.resolve();
};

// Mock de figma.variables.getVariableByIdAsync
var originalGetVariableByIdAsync = figma.variables.getVariableByIdAsync;
figma.variables.getVariableByIdAsync = function(id) {
  console.log("Mock getVariableByIdAsync appelé pour:", id);
  return Promise.resolve({
    id: id,
    name: id === 'color-var' ? 'Primary Color' : 'Spacing 12',
    modes: [{ modeId: 'mode1' }],
    valuesByMode: {
      'mode1': id === 'color-var' ? { r: 1, g: 0, b: 0 } : 12
    }
  });
};

// Mock de nœuds avec différents types
var mockTextNode = {
  id: 'text-node',
  type: 'TEXT',
  name: 'Text Node',
  fontName: { family: 'Inter', style: 'Regular' },
  fills: [{
    type: 'SOLID',
    color: { r: 0, g: 0, b: 0 }
  }],
  boundVariables: {},
  fillStyleId: 'old-style-id' // Style existant à détacher
};

var mockFrameNode = {
  id: 'frame-node',
  type: 'FRAME',
  name: 'Frame Node',
  fills: [{
    type: 'SOLID',
    color: { r: 0.5, g: 0.5, b: 0.5 }
  }],
  boundVariables: {},
  fillStyleId: 'old-fill-style' // Style existant
};

var mockSpacingNode = {
  id: 'spacing-node',
  type: 'FRAME',
  name: 'Spacing Node',
  layoutMode: 'HORIZONTAL',
  primaryAxisAlignItems: 'MIN', // Pas SPACE_BETWEEN
  boundVariables: {}
};

// Mock de figma.getNodeById
var originalGetNodeById = figma.getNodeById;
figma.getNodeById = function(id) {
  if (id === 'text-node') return mockTextNode;
  if (id === 'frame-node') return mockFrameNode;
  if (id === 'spacing-node') return mockSpacingNode;
  return null;
};

// Test 1: Application sur un nœud texte (avec chargement de police)
console.log("\n=== Test 1: Application sur texte ===");
lastScanResults = [{
  nodeId: 'text-node',
  property: 'Fill',
  fillIndex: 0,
  suggestedVariableId: 'color-var'
}];

applySingleFix(0, 'color-var').then(function(result) {
  console.log("Résultat application texte:", result);
  console.log("Style détaché:", !mockTextNode.fillStyleId);
  console.log("Variable liée:", !!mockTextNode.fills[0].boundVariables.color);
});

// Test 2: Application sur un frame (avec détachement de style)
console.log("\n=== Test 2: Application sur frame ===");
lastScanResults = [{
  nodeId: 'frame-node',
  property: 'Fill',
  fillIndex: 0,
  suggestedVariableId: 'color-var'
}];

setTimeout(function() {
  applySingleFix(0, 'color-var').then(function(result) {
    console.log("Résultat application frame:", result);
    console.log("Style détaché:", !mockFrameNode.fillStyleId);
    console.log("Variable liée:", !!mockFrameNode.fills[0].boundVariables.color);
  });
}, 100);

// Test 3: Application de spacing (propriété numérique)
console.log("\n=== Test 3: Application de spacing ===");
lastScanResults = [{
  nodeId: 'spacing-node',
  property: 'Item Spacing',
  figmaProperty: 'itemSpacing',
  suggestedVariableId: 'spacing-var'
}];

// Attendre que les tests précédents se terminent
setTimeout(function() {
  applySingleFix(0, 'spacing-var').then(function(result) {
    console.log("Résultat application spacing:", result);

    // Restaurer les fonctions originales
    figma.loadFontAsync = originalLoadFontAsync;
    figma.variables.getVariableByIdAsync = originalGetVariableByIdAsync;
    figma.getNodeById = originalGetNodeById;

    console.log("\n=== Fin du test ===");
  });
}, 200);