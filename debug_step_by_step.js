// ============================================
// DEBUG ÉTAPE PAR ÉTAPE - RETOUR À LA BASE
// ============================================

console.log("🔧 DEBUG ÉTAPE PAR ÉTAPE - RETOUR À LA BASE");
console.log("============================================");

// Étape 1: Test de base - Figma est-il accessible ?
console.log("\n📋 ÉTAPE 1: Test d'accès à Figma");
try {
  console.log("✅ figma object exists:", typeof figma !== 'undefined');
  console.log("✅ figma.currentPage exists:", typeof figma.currentPage !== 'undefined');

  if (figma.currentPage) {
    console.log("✅ Page name:", figma.currentPage.name);
    console.log("✅ Children count:", figma.currentPage.children ? figma.currentPage.children.length : 'N/A');
  }

  console.log("🎉 ÉTAPE 1 RÉUSSIE - Figma accessible");
} catch (error) {
  console.error("❌ ÉTAPE 1 ÉCHEC - Problème d'accès Figma:", error);
  return;
}

// Étape 2: Test des variables
console.log("\n📋 ÉTAPE 2: Test d'accès aux variables");
try {
  var localVars = figma.variables.getLocalVariables();
  console.log("✅ Variables locales trouvées:", localVars.length);

  if (localVars.length > 0) {
    console.log("📋 Exemples de variables:");
    localVars.slice(0, 3).forEach(function(v, i) {
      console.log("  " + (i+1) + ". " + v.name + " (" + v.resolvedType + ") - ID: " + v.id);
    });
  } else {
    console.log("⚠️ Aucune variable locale trouvée");
  }

  console.log("🎉 ÉTAPE 2 RÉUSSIE - Variables accessibles");
} catch (error) {
  console.error("❌ ÉTAPE 2 ÉCHEC - Problème d'accès variables:", error);
  return;
}

// Étape 3: Test d'un scan minimal
console.log("\n📋 ÉTAPE 3: Test de scan minimal sur la page");
try {
  var pageChildren = figma.currentPage.children;
  console.log("✅ Enfants de page:", pageChildren.length);

  if (pageChildren.length > 0) {
    // Scanner seulement le premier élément pour test
    var firstChild = pageChildren[0];
    console.log("📋 Premier élément:", firstChild.name, "(" + firstChild.type + ")");

    // Test simple: chercher des fills
    if (firstChild.fills && Array.isArray(firstChild.fills)) {
      console.log("📋 Fills trouvés:", firstChild.fills.length);

      firstChild.fills.forEach(function(fill, index) {
        if (fill.type === 'SOLID' && fill.color) {
          var hex = rgbToHex(fill.color);
          console.log("  Fill " + index + ": " + hex + " (SOLID)");
        }
      });
    }

    console.log("🎉 ÉTAPE 3 RÉUSSIE - Scan minimal fonctionnel");
  } else {
    console.log("⚠️ Page vide - rien à scanner");
  }
} catch (error) {
  console.error("❌ ÉTAPE 3 ÉCHEC - Problème de scan:", error);
  return;
}

// Étape 4: Test de récupération d'une variable simple
console.log("\n📋 ÉTAPE 4: Test de récupération d'une variable");
try {
  var localVars = figma.variables.getLocalVariables();

  if (localVars.length > 0) {
    var firstVar = localVars[0];
    console.log("📋 Test récupération variable:", firstVar.name);

    // Test de récupération par ID
    var retrievedVar = figma.variables.getVariableById(firstVar.id);
    console.log("✅ Variable récupérée:", !!retrievedVar);

    if (retrievedVar) {
      console.log("📋 Détails:", {
        id: retrievedVar.id,
        name: retrievedVar.name,
        type: retrievedVar.resolvedType,
        scopes: retrievedVar.scopes
      });
    }

    console.log("🎉 ÉTAPE 4 RÉUSSIE - Récupération variable fonctionnelle");
  } else {
    console.log("⚠️ Aucune variable à tester");
  }
} catch (error) {
  console.error("❌ ÉTAPE 4 ÉCHEC - Problème récupération variable:", error);
  return;
}

// Étape 5: Test d'application sur un élément simple
console.log("\n📋 ÉTAPE 5: Test d'application sur élément simple");
try {
  var pageChildren = figma.currentPage.children;

  if (pageChildren.length > 0 && localVars.length > 0) {
    var firstChild = pageChildren[0];
    var firstVar = localVars[0];

    console.log("📋 Test application sur:", firstChild.name, "avec variable:", firstVar.name);

    // Vérifier si c'est applicable
    if (firstChild.fills && firstChild.fills.length > 0 && firstVar.resolvedType === 'COLOR') {
      console.log("✅ Conditions réunies pour test d'application");

      try {
        // Test d'application simple
        firstChild.setBoundVariable('fills[0].color', firstVar);
        console.log("🎉 APPLICATION RÉUSSIE !");

        // Vérifier que ça a marché
        var updatedFill = firstChild.fills[0];
        if (updatedFill.boundVariables && updatedFill.boundVariables.color) {
          console.log("✅ VÉRIFICATION RÉUSSIE - Variable liée correctement");
        } else {
          console.log("⚠️ VÉRIFICATION ÉCHEC - Variable pas liée");
        }

      } catch (applyError) {
        console.error("❌ APPLICATION ÉCHEC:", applyError.message);
        console.log("💡 Cause possible:", applyError.message.includes('scope') ? 'Problème de scopes' : 'Erreur technique');
      }

    } else {
      console.log("⚠️ Conditions non réunies:");
      console.log("  - Fills disponibles:", !!(firstChild.fills && firstChild.fills.length > 0));
      console.log("  - Variable COLOR:", firstVar.resolvedType === 'COLOR');
    }

    console.log("🎉 ÉTAPE 5 TERMINÉE");
  } else {
    console.log("⚠️ Pas assez d'éléments pour tester l'application");
  }
} catch (error) {
  console.error("❌ ÉTAPE 5 ÉCHEC - Problème d'application:", error);
  return;
}

// Résumé final
console.log("\n🎯 RÉSUMÉ FINAL");
console.log("==============");
console.log("Si toutes les étapes sont passées:");
console.log("✅ Figma fonctionne");
console.log("✅ Variables accessibles");
console.log("✅ Scan possible");
console.log("✅ Récupération variables OK");
console.log("✅ Application possible");
console.log("");
console.log("🎉 LE SYSTÈME DE BASE FONCTIONNE !");
console.log("");
console.log("Les problèmes viennent donc de:");
console.log("- La logique complexe du scan");
console.log("- La gestion des erreurs");
console.log("- La synchronisation des données");
console.log("- Les validations trop strictes");

console.log("\n💡 PROCHAINES ÉTAPES:");
console.log("1. Simplifier le scan (ne garder que l'essentiel)");
console.log("2. Supprimer les validations complexes");
console.log("3. Tester chaque fonctionnalité isolément");
console.log("4. Reconstruire progressivement");

console.log("\n🔧 DEBUG TERMINÉ");