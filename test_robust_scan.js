// Test du scan robuste avec filtrage des calques invisibles/verrouillés
console.log("=== Test du scan robuste ===");

// Mock des nœuds avec différents états
var mockNodes = [
  { id: 'node1', name: 'Visible Frame', type: 'FRAME', visible: true, locked: false, fills: [], strokes: [] },
  { id: 'node2', name: 'Hidden Frame', type: 'FRAME', visible: false, locked: false, fills: [], strokes: [] },
  { id: 'node3', name: 'Locked Frame', type: 'FRAME', visible: true, locked: true, fills: [], strokes: [] },
  { id: 'node4', name: 'Visible Rectangle', type: 'RECTANGLE', visible: true, locked: false, fills: [{ type: 'SOLID', color: { r: 1, g: 0, b: 0 } }], strokes: [] },
];

var mockValueToVariableMap = new Map();
var results = [];

console.log("Test avec ignoreHiddenLayers = true:");
mockNodes.forEach(function(node, index) {
  console.log("Traitement de", node.name, "- visible:", node.visible, "locked:", node.locked);
  checkNodeProperties(node, mockValueToVariableMap, results, true); // ignoreHiddenLayers = true
});

console.log("Résultats (devrait ignorer node2 et node3):", results.length, "nœuds traités");

results = [];
console.log("\nTest avec ignoreHiddenLayers = false:");
mockNodes.forEach(function(node, index) {
  console.log("Traitement de", node.name, "- visible:", node.visible, "locked:", node.locked);
  checkNodeProperties(node, mockValueToVariableMap, results, false); // ignoreHiddenLayers = false
});

console.log("Résultats (devrait traiter tous les nœuds):", results.length, "nœuds traités");

console.log("\n=== Fin du test ===");