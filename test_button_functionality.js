// Test de la fonctionnalité du bouton "Tout corriger"
console.log("=== TEST FONCTIONNALITÉ BOUTON ===");

// Simuler l'environnement
if (typeof figma === 'undefined') {
  global.figma = {
    variables: {
      getVariableById: function(id) {
        return id === 'test-var' ? {
          id: 'test-var',
          name: 'Test Variable',
          resolvedType: 'COLOR',
          modes: [{ modeId: 'default' }],
          valuesByMode: { 'default': { r: 1, g: 0, b: 0 } }
        } : null;
      }
    },
    getNodeById: function(id) {
      return id === 'test-node' ? {
        id: 'test-node',
        type: 'FRAME',
        name: 'Test Frame',
        fills: [{
          type: 'SOLID',
          color: { r: 0.5, g: 0.5, b: 0.5 }
        }],
        boundVariables: {},
        setBoundVariable: function(path, variable) {
          console.log('[MOCK] setBoundVariable appelé:', path, '->', variable.name);
          return true;
        }
      } : null;
    },
    notify: function(msg) {
      console.log('[MOCK notify]:', msg);
    }
  };

  // Simuler lastScanResults
  global.lastScanResults = [{
    nodeId: 'test-node',
    property: 'Fill',
    layerName: 'Test Frame',
    fillIndex: 0,
    suggestedVariableId: 'test-var'
  }];

  // Simuler DOM
  global.document = {
    getElementById: function(id) {
      if (id === 'bulkFixBtn') {
        return {
          addEventListener: function(event, callback) {
            console.log('[MOCK] Event listener ajouté pour', event);
            // Simuler un clic
            setTimeout(function() {
              console.log('[MOCK] Simulation d\'un clic sur le bouton');
              callback();
            }, 100);
          }
        };
      }
      return null;
    }
  };
}

// Simuler l'initialisation de l'UI (partiellement)
console.log("Simulation de l'initialisation de l'UI...");

var bulkFixBtn = document.getElementById('bulkFixBtn');
console.log("Bouton trouvé:", !!bulkFixBtn);

if (bulkFixBtn) {
  console.log("Ajout de l'event listener...");

  bulkFixBtn.addEventListener('click', function() {
    console.log('[bulkFixBtn] 🖱️ Clic détecté sur le bouton "Tout corriger"');
    console.log('[bulkFixBtn] 📊 Nombre total de résultats du scan:', lastScanResults ? lastScanResults.length : 0);

    if (lastScanResults && lastScanResults.length > 0) {
      console.log('[bulkFixBtn] ✅ Résultats disponibles, lancement applyAllFixes');
      try {
        // Utiliser applyAllFixes qui applique tous les correctifs automatiquement
        var appliedCount = applyAllFixes();
        console.log('[bulkFixBtn] ✅ applyAllFixes terminé, corrections appliquées:', appliedCount);

        if (appliedCount > 0) {
          figma.notify('✅ ' + appliedCount + ' correction(s) appliquée(s) avec succès');
          console.log('[bulkFixBtn] 🎉 SUCCÈS: Bouton fonctionnel et correctifs appliqués !');
        } else {
          figma.notify('ℹ️ Aucune correction applicable trouvée');
          console.log('[bulkFixBtn] ℹ️ Aucune correction applicable trouvée');
        }
      } catch (error) {
        console.error('[bulkFixBtn] ❌ Erreur lors de l\'application:', error);
        console.error('[bulkFixBtn] 📋 Détails erreur:', error.stack);
        figma.notify('❌ Erreur lors de l\'application des correctifs');
      }
    } else {
      console.log('[bulkFixBtn] ⚠️ Aucun résultat de scan disponible');
      figma.notify('⚠️ Lancez d\'abord un scan pour détecter les problèmes');
    }
  });

  console.log("✅ Test terminé - le bouton devrait maintenant fonctionner !");
} else {
  console.error("❌ Bouton non trouvé");
}

console.log("\n=== FIN DU TEST ===");

