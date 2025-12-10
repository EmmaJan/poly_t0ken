// Test du système de chunking corrigé
console.log("=== Test du système de chunking corrigé ===");

// Mock des fonctions Figma
if (typeof figma === 'undefined') {
  global.figma = {
    variables: {
      getVariableById: function(id) {
        console.log("[MOCK] getVariableById appelé avec:", id);
        return id === 'test-var' ? {
          id: 'test-var',
          name: 'Test Variable',
          modes: [{ modeId: 'default' }],
          valuesByMode: { 'default': { r: 1, g: 0, b: 0 } }
        } : null;
      }
    },
    getNodeById: function(id) {
      console.log("[MOCK] getNodeById appelé avec:", id);
      if (id === 'node1' || id === 'node2' || id === 'node3') {
        return {
          id: id,
          type: 'FRAME',
          name: 'Test Frame ' + id,
          fills: [{
            type: 'SOLID',
            color: { r: 0.5, g: 0.5, b: 0.5 }
          }],
          boundVariables: {},
          setBoundVariable: function(path, variable) {
            console.log('[MOCK setBoundVariable] Appelé pour', this.id, 'avec path:', path, 'variable:', variable.name);
            if (!this.fills[0].boundVariables) this.fills[0].boundVariables = {};
            this.fills[0].boundVariables.color = {
              type: 'VARIABLE_ALIAS',
              id: variable.id
            };
            return true;
          }
        };
      }
      return null;
    },
    ui: {
      postMessage: function(msg) {
        console.log('[MOCK ui.postMessage]', msg.type, msg);
      }
    },
    notify: function(msg) {
      console.log('[MOCK notify]', msg);
    }
  };
}

// Simuler lastScanResults avec plusieurs résultats
global.lastScanResults = [
  { nodeId: 'node1', property: 'Fill', fillIndex: 0, suggestedVariableId: 'test-var' },
  { nodeId: 'node2', property: 'Fill', fillIndex: 0, suggestedVariableId: 'test-var' },
  { nodeId: 'node3', property: 'Fill', fillIndex: 0, suggestedVariableId: 'test-var' }
];

// Test de applySingleFix avec le nouveau paramètre
console.log("Test de applySingleFix avec paramètre result:");

var result1 = lastScanResults[0];
var applied1 = applySingleFix(result1, 'test-var');
console.log("Application 1 - résultat:", applied1);

var result2 = lastScanResults[1];
var applied2 = applySingleFix(result2, 'test-var');
console.log("Application 2 - résultat:", applied2);

var result3 = lastScanResults[2];
var applied3 = applySingleFix(result3, 'test-var');
console.log("Application 3 - résultat:", applied3);

console.log("\nTest terminé. Total appliqué:", applied1 + applied2 + applied3);
console.log("Toutes les applications réussies:", (applied1 + applied2 + applied3) === 3);

console.log("\n=== Fin du test ===");