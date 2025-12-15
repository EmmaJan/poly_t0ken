/**
 * Modules Loader - Chargeur de modules pour le plugin
 * Charge tous les modules de manière organisée et les initialise
 */

// Charger les modules dans l'ordre de dépendance
(function() {
  'use strict';

  // Liste des modules à charger
  const modules = [
    'animationManager.js',
    'pillManager.js',
    'uiManager.js'
  ];

  // État du chargement
  let loadedModules = 0;
  const totalModules = modules.length;

  /**
   * Charge un module JavaScript
   * @param {string} modulePath - Chemin vers le module
   * @returns {Promise} Promise résolue quand le module est chargé
   */
  function loadModule(modulePath) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = modulePath;
      script.onload = () => {
        loadedModules++;
        console.log(`Module chargé: ${modulePath} (${loadedModules}/${totalModules})`);
        resolve();
      };
      script.onerror = () => {
        reject(new Error(`Échec du chargement du module: ${modulePath}`));
      };
      document.head.appendChild(script);
    });
  }

  /**
   * Initialise tous les modules une fois chargés
   */
  function initModules() {
    console.log('Initialisation des modules...');

    // Initialiser l'UI Manager avec les autres modules
    if (typeof UIManager !== 'undefined') {
      UIManager.init({
        animationManager: typeof AnimationManager !== 'undefined' ? AnimationManager : null,
        pillManager: typeof PillManager !== 'undefined' ? PillManager : null
      });
    }

    console.log('Tous les modules initialisés avec succès');
  }

  /**
   * Charge tous les modules séquentiellement
   */
  async function loadAllModules() {
    try {
      for (const modulePath of modules) {
        await loadModule(modulePath);
      }
      initModules();
    } catch (error) {
      console.error('Erreur lors du chargement des modules:', error);
    }
  }

  // Démarrer le chargement quand le DOM est prêt
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadAllModules);
  } else {
    loadAllModules();
  }

})();
