// Test de la logique permissive des scopes
console.log("=== Test de la logique permissive des scopes ===");

// Test de getScopesForProperty pour différents types de propriétés
console.log("Scopes pour Fill:", getScopesForProperty("Fill"));
console.log("Attendu: ['ALL_FILLS', 'FRAME_FILL', 'SHAPE_FILL', 'TEXT_FILL', 'ALL_SCOPES']");

console.log("\nScopes pour Stroke:", getScopesForProperty("Stroke"));
console.log("Attendu: ['STROKE_COLOR', 'ALL_SCOPES']");

console.log("\nScopes pour Corner Radius:", getScopesForProperty("Corner Radius"));
console.log("Attendu: ['CORNER_RADIUS', 'ALL_SCOPES']");

console.log("\nScopes pour Item Spacing:", getScopesForProperty("Item Spacing"));
console.log("Attendu: ['GAP', 'ALL_SCOPES']");

console.log("\nScopes pour Padding Left:", getScopesForProperty("Padding Left"));
console.log("Attendu: ['GAP', 'ALL_SCOPES']");

// Test avec une propriété inconnue
console.log("\nScopes pour propriété inconnue:", getScopesForProperty("Unknown Property"));
console.log("Attendu: []");

// Simulation de filtrage avec variables de différents scopes
console.log("\n=== Simulation de filtrage ===");

// Mock de variables avec différents scopes
var mockVariables = [
  { id: 'var1', name: 'primary-color', scopes: ['ALL_FILLS'] },
  { id: 'var2', name: 'frame-bg', scopes: ['FRAME_FILL'] },
  { id: 'var3', name: 'shape-fill', scopes: ['SHAPE_FILL'] },
  { id: 'var4', name: 'text-color', scopes: ['TEXT_FILL'] },
  { id: 'var5', name: 'global-color', scopes: ['ALL_SCOPES'] },
  { id: 'var6', name: 'stroke-only', scopes: ['STROKE_COLOR'] },
  { id: 'var7', name: 'radius-var', scopes: ['CORNER_RADIUS'] },
  { id: 'var8', name: 'spacing-var', scopes: ['GAP'] }
];

// Mock de figma.variables.getVariableById
var originalGetVariableById = figma.variables.getVariableById;
figma.variables.getVariableById = function(id) {
  return mockVariables.find(function(v) { return v.id === id; }) || null;
};

// Test de filtrage pour Fill
console.log("Variables acceptées pour Fill:");
var fillScopes = getScopesForProperty("Fill");
mockVariables.forEach(function(v) {
  var accepted = v.scopes.some(function(scope) {
    return fillScopes.includes(scope);
  });
  if (accepted) {
    console.log("  ✓", v.name, "(scopes:", v.scopes.join(', '), ")");
  }
});

// Test de filtrage pour Stroke
console.log("\nVariables acceptées pour Stroke:");
var strokeScopes = getScopesForProperty("Stroke");
mockVariables.forEach(function(v) {
  var accepted = v.scopes.some(function(scope) {
    return strokeScopes.includes(scope);
  });
  if (accepted) {
    console.log("  ✓", v.name, "(scopes:", v.scopes.join(', '), ")");
  }
});

// Restaurer la fonction originale
figma.variables.getVariableById = originalGetVariableById;

console.log("\n=== Fin du test ===");