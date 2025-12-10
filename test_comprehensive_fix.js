// Test complet de la solution robuste d'application des variables
console.log("=== TEST COMPLET DE LA SOLUTION ROBUSTE ===");

// Mock des fonctions Figma
if (typeof figma === 'undefined') {
  global.figma = {
    variables: {
      getVariableById: function(id) {
        console.log("[MOCK] getVariableById appelé avec:", id);
        if (id === 'color-var') {
          return {
            id: 'color-var',
            name: 'Primary Color',
            resolvedType: 'COLOR',
            modes: [{ modeId: 'default' }],
            valuesByMode: { 'default': { r: 1, g: 0, b: 0 } }
          };
        }
        if (id === 'spacing-var') {
          return {
            id: 'spacing-var',
            name: 'Spacing 16',
            resolvedType: 'FLOAT',
            modes: [{ modeId: 'default' }],
            valuesByMode: { 'default': 16 }
          };
        }
        return null;
      }
    },
    getNodeById: function(id) {
      console.log("[MOCK] getNodeById appelé avec:", id);

      // Nœud valide avec toutes les propriétés
      if (id === 'valid-node') {
        return {
          id: 'valid-node',
          type: 'FRAME',
          name: 'Valid Frame',
          fills: [{
            type: 'SOLID',
            color: { r: 0.5, g: 0.5, b: 0.5 }
          }],
          strokes: [{
            type: 'SOLID',
            color: { r: 0, g: 0, b: 0 }
          }],
          cornerRadius: 8,
          itemSpacing: 16,
          boundVariables: {},
          setBoundVariable: function(path, variable) {
            console.log('[MOCK setBoundVariable] Appliqué:', path, '->', variable.name);
            // Simuler l'application réussie
            return true;
          }
        };
      }

      // Nœud supprimé
      if (id === 'deleted-node') {
        return { id: 'deleted-node', removed: true };
      }

      // Nœud inexistant
      return null;
    }
  };
}

// Test 1: Application réussie sur un nœud valide
console.log("\n=== TEST 1: Application réussie ===");
var result1 = {
  nodeId: 'valid-node',
  property: 'Fill',
  fillIndex: 0,
  suggestedVariableId: 'color-var'
};

var applied1 = applySingleFix(result1, 'color-var');
console.log("Résultat test 1:", applied1, "(devrait être 1)");

// Test 2: Nœud supprimé
console.log("\n=== TEST 2: Nœud supprimé ===");
var result2 = {
  nodeId: 'deleted-node',
  property: 'Fill',
  fillIndex: 0,
  suggestedVariableId: 'color-var'
};

var applied2 = applySingleFix(result2, 'color-var');
console.log("Résultat test 2:", applied2, "(devrait être 0 - nœud supprimé)");

// Test 3: Nœud inexistant
console.log("\n=== TEST 3: Nœud inexistant ===");
var result3 = {
  nodeId: 'nonexistent-node',
  property: 'Fill',
  fillIndex: 0,
  suggestedVariableId: 'color-var'
};

var applied3 = applySingleFix(result3, 'color-var');
console.log("Résultat test 3:", applied3, "(devrait être 0 - nœud inexistant)");

// Test 4: Variable inexistante
console.log("\n=== TEST 4: Variable inexistante ===");
var result4 = {
  nodeId: 'valid-node',
  property: 'Fill',
  fillIndex: 0,
  suggestedVariableId: 'nonexistent-var'
};

var applied4 = applySingleFix(result4, 'nonexistent-var');
console.log("Résultat test 4:", applied4, "(devrait être 0 - variable inexistante)");

// Test 5: Variable ID null
console.log("\n=== TEST 5: Variable ID null ===");
var result5 = {
  nodeId: 'valid-node',
  property: 'Fill',
  fillIndex: 0,
  suggestedVariableId: null
};

var applied5 = applySingleFix(result5, null);
console.log("Résultat test 5:", applied5, "(devrait être 0 - pas de variable ID)");

// Test 6: Propriété numérique
console.log("\n=== TEST 6: Propriété numérique ===");
var result6 = {
  nodeId: 'valid-node',
  property: 'Item Spacing',
  figmaProperty: 'itemSpacing',
  suggestedVariableId: 'spacing-var'
};

var applied6 = applySingleFix(result6, 'spacing-var');
console.log("Résultat test 6:", applied6, "(devrait être 1 - propriété numérique)");

// Test 7: Validation des fonctions individuelles
console.log("\n=== TEST 7: Validation des fonctions ===");

var validNode = figma.getNodeById('valid-node');
var colorVar = figma.variables.getVariableById('color-var');

// Test validatePropertyExists
var propExists = validatePropertyExists(validNode, result1);
console.log("validatePropertyExists (Fill):", propExists, "(devrait être true)");

// Test validateVariableCanBeApplied
var varCompatible = validateVariableCanBeApplied(colorVar, result1);
console.log("validateVariableCanBeApplied (Color->Fill):", varCompatible, "(devrait être true)");

// Résumé des tests
console.log("\n=== RÉSUMÉ DES TESTS ===");
console.log("Test 1 (succès):", applied1 === 1 ? "✅" : "❌");
console.log("Test 2 (nœud supprimé):", applied2 === 0 ? "✅" : "❌");
console.log("Test 3 (nœud inexistant):", applied3 === 0 ? "✅" : "❌");
console.log("Test 4 (variable inexistante):", applied4 === 0 ? "✅" : "❌");
console.log("Test 5 (variable ID null):", applied5 === 0 ? "✅" : "❌");
console.log("Test 6 (propriété numérique):", applied6 === 1 ? "✅" : "❌");
console.log("Test 7 (validations):", propExists && varCompatible ? "✅" : "❌");

var allTestsPassed = applied1 === 1 && applied2 === 0 && applied3 === 0 &&
                     applied4 === 0 && applied5 === 0 && applied6 === 1 &&
                     propExists && varCompatible;

console.log("\nTOUS LES TESTS RÉUSSIS:", allTestsPassed ? "🎉 OUI !" : "❌ NON");

console.log("\n=== FIN DU TEST COMPLET ===");