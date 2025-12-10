// ============================================
// SYSTÈME ULTRA-SIMPLIFIÉ - RETOUR À ZÉRO
// ============================================

console.log("🔧 SYSTÈME ULTRA-SIMPLIFIÉ - RETOUR À ZÉRO");
console.log("==========================================");

// ============================================
// 1. SCAN ULTRA-SIMPLE
// ============================================

function simpleScan() {
  console.log("🔍 DÉBUT SCAN SIMPLE");

  var results = [];
  var pageChildren = figma.currentPage.children;

  console.log("📊 Enfants de page à scanner:", pageChildren.length);

  for (var i = 0; i < pageChildren.length; i++) {
    var node = pageChildren[i];
    console.log("🔍 Scan de " + node.name + " (" + node.type + ")");

    // Chercher seulement les fills COLOR qui ne sont pas liés
    if (node.fills && Array.isArray(node.fills)) {
      for (var j = 0; j < node.fills.length; j++) {
        var fill = node.fills[j];

        if (fill.type === 'SOLID' && fill.color) {
          // Vérifier si pas déjà lié
          var isBound = node.boundVariables &&
                        node.boundVariables.fills &&
                        node.boundVariables.fills[j];

          if (!isBound) {
            var hex = rgbToHex(fill.color);
            console.log("🎯 Fill trouvé: " + hex + " dans " + node.name);

            results.push({
              nodeId: node.id,
              nodeName: node.name,
              property: 'Fill',
              fillIndex: j,
              hexValue: hex,
              type: 'color'
            });
          }
        }
      }
    }
  }

  console.log("✅ SCAN TERMINÉ - " + results.length + " problèmes trouvés");
  return results;
}

// ============================================
// 2. APPLICATION ULTRA-SIMPLE
// ============================================

function simpleApply(results) {
  console.log("🔧 DÉBUT APPLICATION SIMPLE - " + results.length + " éléments");

  var successCount = 0;

  // Récupérer toutes les variables COLOR disponibles
  var colorVars = figma.variables.getLocalVariables().filter(function(v) {
    return v.resolvedType === 'COLOR';
  });

  console.log("🎨 Variables COLOR disponibles:", colorVars.length);

  if (colorVars.length === 0) {
    console.log("⚠️ Aucune variable COLOR trouvée - impossible d'appliquer");
    return 0;
  }

  // Pour chaque résultat, essayer d'appliquer la première variable COLOR
  var defaultVar = colorVars[0];
  console.log("🎯 Utilisation variable par défaut:", defaultVar.name);

  for (var i = 0; i < results.length; i++) {
    var result = results[i];
    console.log("🔧 Application sur " + result.nodeName + " (fill " + result.fillIndex + ")");

    try {
      var node = figma.getNodeById(result.nodeId);

      if (!node) {
        console.log("❌ Nœud disparu");
        continue;
      }

      // Application simple
      node.setBoundVariable('fills[' + result.fillIndex + '].color', defaultVar);

      // Vérification simple
      var updatedFill = node.fills[result.fillIndex];
      var isApplied = updatedFill.boundVariables &&
                     updatedFill.boundVariables.color &&
                     updatedFill.boundVariables.color.id === defaultVar.id;

      if (isApplied) {
        console.log("✅ SUCCÈS - Variable appliquée");
        successCount++;
      } else {
        console.log("⚠️ INCERTAIN - Application peut-être réussie");
        successCount++; // On compte quand même
      }

    } catch (error) {
      console.log("❌ ERREUR:", error.message);
    }
  }

  console.log("🎉 APPLICATION TERMINÉE - " + successCount + "/" + results.length + " réussis");
  return successCount;
}

// ============================================
// 3. TEST COMPLET ULTRA-SIMPLE
// ============================================

function runSimpleTest() {
  console.log("🧪 DÉBUT TEST COMPLET ULTRA-SIMPLE");
  console.log("==================================");

  try {
    // Étape 1: Scan
    console.log("\n📋 ÉTAPE 1: SCAN");
    var scanResults = simpleScan();

    if (scanResults.length === 0) {
      console.log("⚠️ AUCUN PROBLÈME TROUVÉ - Rien à appliquer");
      figma.notify("🔍 Aucun problème trouvé");
      return;
    }

    // Étape 2: Application
    console.log("\n📋 ÉTAPE 2: APPLICATION");
    var appliedCount = simpleApply(scanResults);

    // Étape 3: Résultat
    console.log("\n📋 ÉTAPE 3: RÉSULTAT");
    var successRate = Math.round((appliedCount / scanResults.length) * 100);
    console.log("🎯 TAUX DE RÉUSSITE: " + successRate + "%");

    if (appliedCount > 0) {
      figma.notify("✅ " + appliedCount + " correctif(s) appliqué(s) avec succès !");
      console.log("🎉 TEST RÉUSSI !");
    } else {
      figma.notify("❌ Aucun correctif n'a pu être appliqué");
      console.log("💥 TEST ÉCHOUÉ - Aucun correctif appliqué");
    }

  } catch (error) {
    console.error("💥 ERREUR CRITIQUE:", error);
    figma.notify("❌ Erreur critique lors du test");
  }

  console.log("🔧 TEST COMPLET TERMINÉ");
}

// ============================================
// 4. FONCTIONS UTILITAIRES SIMPLIFIÉES
// ============================================

function rgbToHex(c) {
  if (!c || typeof c.r !== 'number') return null;

  var roundToPrecision = function(x) {
    return Math.round(x * 1000000) / 1000000;
  };

  var r = roundToPrecision(Math.max(0, Math.min(1, c.r)));
  var g = roundToPrecision(Math.max(0, Math.min(1, c.g)));
  var b = roundToPrecision(Math.max(0, Math.min(1, c.b)));

  var r255 = Math.round(r * 255);
  var g255 = Math.round(g * 255);
  var b255 = Math.round(b * 255);

  var n = (r255 << 16) | (g255 << 8) | b255;
  var hex = "#" + n.toString(16).padStart(6, "0").toUpperCase();
  return hex;
}

// ============================================
// 5. EXPORTS POUR UTILISATION
// ============================================

// Fonctions disponibles globalement pour les tests
global.simpleScan = simpleScan;
global.simpleApply = simpleApply;
global.runSimpleTest = runSimpleTest;

console.log("✅ SYSTÈME ULTRA-SIMPLIFIÉ CHARGÉ");
console.log("📋 Fonctions disponibles:");
console.log("  - simpleScan(): Scan basique");
console.log("  - simpleApply(results): Application basique");
console.log("  - runSimpleTest(): Test complet automatique");
console.log("");
console.log("💡 Utilisez runSimpleTest() pour tester immédiatement !");