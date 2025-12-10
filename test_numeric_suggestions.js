// Test des suggestions numériques avec filtrage par scopes
console.log("=== Test des suggestions numériques ===");

// Mock des variables avec différents scopes
var mockVariables = [
  { id: 'var1', name: 'spacing-4', scopes: ['GAP'], valuesByMode: { mode1: 16 } },
  { id: 'var2', name: 'spacing-8', scopes: ['GAP'], valuesByMode: { mode1: 32 } },
  { id: 'var3', name: 'width-100', scopes: ['WIDTH_HEIGHT'], valuesByMode: { mode1: 100 } },
  { id: 'var4', name: 'radius-4', scopes: ['CORNER_RADIUS'], valuesByMode: { mode1: 16 } },
];

var mockValueToVariableMap = new Map();
mockVariables.forEach(function(v) {
  mockValueToVariableMap.set(v.valuesByMode.mode1, [v]);
});

// Test pour Item Spacing (devrait trouver spacing-4 et spacing-8)
console.log("Test Item Spacing (target: 20):");
var suggestions = findNumericSuggestions(20, mockValueToVariableMap, 4, "Item Spacing");
console.log("Suggestions trouvées:", suggestions.length);
suggestions.forEach(function(s) { console.log(" -", s.name, "=", s.value); });

// Test pour Corner Radius (devrait trouver radius-4)
console.log("\nTest Corner Radius (target: 18):");
suggestions = findNumericSuggestions(18, mockValueToVariableMap, 4, "Corner Radius");
console.log("Suggestions trouvées:", suggestions.length);
suggestions.forEach(function(s) { console.log(" -", s.name, "=", s.value); });

console.log("\n=== Fin du test ===");