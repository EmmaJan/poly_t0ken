// Test de la correction asynchrone des corrections en masse
console.log("=== Test de la correction asynchrone des corrections en masse ===");

// Mock des fonctions et variables nécessaires
var lastScanResults = [
  { nodeId: 'node1', property: 'Fill', fillIndex: 0, suggestedVariableId: 'var1' },
  { nodeId: 'node2', property: 'Stroke', strokeIndex: 0, suggestedVariableId: 'var2' },
  { nodeId: 'node3', property: 'Corner Radius', figmaProperty: 'cornerRadius', suggestedVariableId: 'var3' }
];

// Mock de selectedIndices
var selectedIndices = [0, 1, 2];

// Mock de applySingleFix pour simuler l'asynchrone
async function applySingleFix(index, variableId) {
  console.log(`[MOCK applySingleFix] Application pour index ${index}, variable ${variableId}`);

  // Simuler un délai asynchrone
  await new Promise(resolve => setTimeout(resolve, 10));

  // Retourner 1 pour simuler une correction réussie
  return 1;
}

// Mock des fonctions UI
function updateBulkActionsVisibility() {
  console.log('[MOCK] updateBulkActionsVisibility appelée');
}

function updateUILocally(indices) {
  console.log('[MOCK] updateUILocally appelée avec indices:', indices);
}

// Fonction corrigée applyBulkFixes
async function applyBulkFixes() {
  console.log('[applyBulkFixes] Application en masse pour', selectedIndices.length, 'éléments');

  var indicesToRemove = selectedIndices.slice(); // Copier les indices avant de les vider
  var appliedTotal = 0;

  // Traiter chaque correction de manière asynchrone
  for (var i = 0; i < selectedIndices.length; i++) {
    var index = selectedIndices[i];
    if (lastScanResults && lastScanResults[index]) {
      var result = lastScanResults[index];
      try {
        var appliedCount = await applySingleFix(index, result.suggestedVariableId);
        if (appliedCount > 0) {
          console.log('[applyBulkFixes] Correction appliquée pour index', index);
          appliedTotal += appliedCount;
        }
      } catch (error) {
        console.error('[applyBulkFixes] Erreur lors de l\'application pour index', index, ':', error);
      }
    }
  }

  // Vider la sélection après application
  selectedIndices = [];
  updateBulkActionsVisibility();

  // Mettre à jour l'UI localement
  updateUILocally(indicesToRemove);

  // Notification de succès
  if (appliedTotal > 0) {
    console.log('[applyBulkFixes] Total des corrections appliquées:', appliedTotal);
  }

  return appliedTotal; // Retourner le total pour le test
}

// Test de la fonction corrigée
console.log("Test de applyBulkFixes avec gestion asynchrone:");

applyBulkFixes().then(function(totalApplied) {
  console.log("Test terminé - Total appliqué:", totalApplied);
  console.log("selectedIndices après application:", selectedIndices);
  console.log("Test réussi:", totalApplied === 3 && selectedIndices.length === 0);

  console.log("\n=== Fin du test ===");
}).catch(function(error) {
  console.error("Erreur lors du test:", error);
});

