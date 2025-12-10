// Test de la fonctionnalité de sélection des cards
console.log("=== Test de la sélection des cards ===");

// Simuler la création d'une card
var mockGroup = {
  property: 'Fill',
  value: '#FF0000',
  originalIndices: [0, 1, 2],
  suggestions: [{ id: 'var1', name: 'primary-500' }]
};

// Simuler le rendu HTML d'une card
console.log("Card mockée avec indices:", mockGroup.originalIndices);
console.log("Doit avoir un attribut data-indices avec les indices");
console.log("Doit avoir un curseur pointer et un title");
console.log("Doit avoir un event listener qui appelle selectNodesInFigma avec les indices");

// Simuler l'appel à selectNodesInFigma
function selectNodesInFigma(indices) {
  console.log("selectNodesInFigma appelée avec indices:", indices);
  console.log("Doit envoyer un message highlight-nodes au plugin");
}

// Test de l'appel
selectNodesInFigma(mockGroup.originalIndices);

console.log("=== Fin du test ===");