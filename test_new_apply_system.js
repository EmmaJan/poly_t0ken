// Test du nouveau système d'application avec vérification
console.log("=== TEST DU NOUVEAU SYSTÈME D'APPLICATION ===");

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
            if (path === 'fills[0].color') {
              if (!this.fills[0].boundVariables) this.fills[0].boundVariables = {};
              this.fills[0].boundVariables.color = {
                type: 'VARIABLE_ALIAS',
                id: variable.id
              };
            } else if (path === 'itemSpacing') {
              if (!this.boundVariables) this.boundVariables = {};
              this.boundVariables.itemSpacing = {
                type: 'VARIABLE_ALIAS',
                id: variable.id
              };
            }
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
    },
    notify: function(msg) {
      console.log('[MOCK notify]', msg);
    }
  };
}

// Tests du nouveau système
console.log("\n=== TESTS INDIVIDUELS ===");

// Test 1: Application réussie
console.log("\n--- Test 1: Application réussie ---");
var result1 = {
  nodeId: 'valid-node',
  property: 'Fill',
  layerName: 'Valid Frame',
  fillIndex: 0,
  suggestedVariableId: 'color-var'
};

var verification1 = applyAndVerifyFix(result1, 'color-var');
console.log("Résultat:", verification1.success ? "SUCCÈS" : "ÉCHEC");
console.log("Détails:", verification1);

// Test 2: Nœud supprimé
console.log("\n--- Test 2: Nœud supprimé ---");
var result2 = {
  nodeId: 'deleted-node',
  property: 'Fill',
  layerName: 'Deleted Frame',
  fillIndex: 0,
  suggestedVariableId: 'color-var'
};

var verification2 = applyAndVerifyFix(result2, 'color-var');
console.log("Résultat:", verification2.success ? "SUCCÈS" : "ÉCHEC");
console.log("Erreur:", verification2.error);

// Test 3: Variable inexistante
console.log("\n--- Test 3: Variable inexistante ---");
var result3 = {
  nodeId: 'valid-node',
  property: 'Fill',
  layerName: 'Valid Frame',
  fillIndex: 0,
  suggestedVariableId: 'nonexistent-var'
};

var verification3 = applyAndVerifyFix(result3, 'nonexistent-var');
console.log("Résultat:", verification3.success ? "SUCCÈS" : "ÉCHEC");
console.log("Erreur:", verification3.error);

// Test 4: Propriété numérique
console.log("\n--- Test 4: Propriété numérique ---");
var result4 = {
  nodeId: 'valid-node',
  property: 'Item Spacing',
  layerName: 'Valid Frame',
  figmaProperty: 'itemSpacing',
  suggestedVariableId: 'spacing-var'
};

var verification4 = applyAndVerifyFix(result4, 'spacing-var');
console.log("Résultat:", verification4.success ? "SUCCÈS" : "ÉCHEC");
console.log("Détails:", verification4);

// Test de compatibilité avec l'ancien système
console.log("\n=== TEST DE COMPATIBILITÉ ===");
var oldResult1 = applySingleFix(result1, 'color-var');
var oldResult2 = applySingleFix(result2, 'color-var');
console.log("Ancien système - Test 1:", oldResult1, "(devrait être 1)");
console.log("Ancien système - Test 2:", oldResult2, "(devrait être 0)");

// Résumé
console.log("\n=== RÉSUMÉ ===");
console.log("Nouveau système:");
console.log("  - Test 1 (succès):", verification1.success ? "✅" : "❌");
console.log("  - Test 2 (nœud supprimé):", !verification2.success ? "✅" : "❌");
console.log("  - Test 3 (variable inexistante):", !verification3.success ? "✅" : "❌");
console.log("  - Test 4 (propriété numérique):", verification4.success ? "✅" : "❌");

console.log("Compatibilité ancien système:");
console.log("  - Test 1:", oldResult1 === 1 ? "✅" : "❌");
console.log("  - Test 2:", oldResult2 === 0 ? "✅" : "❌");

var allTestsPassed = verification1.success && !verification2.success && !verification3.success &&
                     verification4.success && oldResult1 === 1 && oldResult2 === 0;

console.log("\nTOUS LES TESTS RÉUSSIS:", allTestsPassed ? "🎉 OUI !" : "❌ NON");

console.log("\n=== FIN DU TEST ===");