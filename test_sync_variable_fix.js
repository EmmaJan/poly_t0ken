// Test de la correction synchrone des variables
console.log("=== Test de la correction synchrone des variables ===");

// Mock des fonctions Figma pour simuler l'environnement
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
      if (id === 'test-node') {
        return {
          id: 'test-node',
          type: 'FRAME',
          name: 'Test Frame',
          fills: [{
            type: 'SOLID',
            color: { r: 0.5, g: 0.5, b: 0.5 }
          }],
          boundVariables: {},
          fillStyleId: 'old-style'
        };
      }
      return null;
    },
    loadFontAsync: function() {
      return Promise.resolve();
    }
  };
}

// Simuler lastScanResults
global.lastScanResults = [{
  nodeId: 'test-node',
  property: 'Fill',
  fillIndex: 0,
  suggestedVariableId: 'test-var'
}];

// Fonction applySingleFix corrigée (version synchrone)
function applySingleFix(index, selectedVariableId) {
  console.log('[DEBUG applySingleFix] Tentative d\'application pour index:', index, 'variableId:', selectedVariableId);

  if (!lastScanResults || lastScanResults.length === 0 || index < 0 || index >= lastScanResults.length) {
    console.error('[DEBUG applySingleFix] ERREUR: lastScanResults invalide ou index hors limites');
    return 0;
  }

  var result = lastScanResults[index];
  console.log('[DEBUG applySingleFix] Résultat trouvé:', result);

  var node = figma.getNodeById(result.nodeId);
  var variableId = selectedVariableId || result.suggestedVariableId;
  var variable = figma.variables.getVariableById(variableId); // Version synchrone

  if (!node || !variable) {
    console.log('[DEBUG applySingleFix] Nœud trouvé:', !!node, 'Variable trouvée:', !!variable, 'ID recherché:', variableId);
    return 0;
  }

  console.log('[DEBUG applySingleFix] Application d\'un Fill');
  if (node.fills && Array.isArray(node.fills) && node.fills[result.fillIndex]) {
    // Clonage profond nécessaire
    var clonedFills = JSON.parse(JSON.stringify(node.fills));

    // Initialisation de l'objet boundVariables s'il n'existe pas
    if (!clonedFills[result.fillIndex].boundVariables) {
      clonedFills[result.fillIndex].boundVariables = {};
    }

    // Application de l'alias
    clonedFills[result.fillIndex].boundVariables.color = {
      type: 'VARIABLE_ALIAS',
      id: variable.id
    };

    // ⚠️ DÉTACHER LE STYLE EXISTANT pour éviter les conflits
    if (node.fillStyleId) {
      console.log('[DEBUG applySingleFix] Détachement du style existant (fillStyleId)');
      node.fillStyleId = '';
    }

    node.fills = clonedFills;
    console.log('[DEBUG applySingleFix] SUCCÈS: Fill appliqué');
    return 1;
  }

  return 0;
}

// Test de la fonction corrigée
console.log("Test de applySingleFix avec version synchrone:");

var mockNode = figma.getNodeById('test-node');
console.log("État initial:");
console.log("- fillStyleId:", mockNode.fillStyleId);
console.log("- fills[0].boundVariables:", mockNode.fills[0].boundVariables);

var result = applySingleFix(0, 'test-var');

console.log("Résultat:", result);
console.log("État final:");
console.log("- fillStyleId:", mockNode.fillStyleId);
console.log("- fills[0].boundVariables:", mockNode.fills[0].boundVariables);

var success = result === 1 &&
             !mockNode.fillStyleId &&
             mockNode.fills[0].boundVariables.color &&
             mockNode.fills[0].boundVariables.color.type === 'VARIABLE_ALIAS' &&
             mockNode.fills[0].boundVariables.color.id === 'test-var';

console.log("Test réussi:", success);

console.log("\n=== Fin du test ===");