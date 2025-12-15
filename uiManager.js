/**
 * UI Manager - Gestionnaire d'interface unifié
 * Coordonne les animations et les pastilles de manière indépendante
 */

const UIManager = {
  // Références aux modules
  animationManager: null,
  pillManager: null,

  // État interne
  state: {
    buttons: {
      applyAllAutoBtn: null,
      step4ApplyAll: null
    },
    containers: {
      scanResults: null,
      unifiedCleaningList: null
    }
  },

  /**
   * Initialise le gestionnaire UI
   * @param {Object} options - Options d'initialisation
   */
  init: function(options = {}) {
    // Initialiser les modules
    this.animationManager = options.animationManager || (typeof AnimationManager !== 'undefined' ? AnimationManager : null);
    this.pillManager = options.pillManager || (typeof PillManager !== 'undefined' ? PillManager : null);

    // Initialiser les références DOM
    this.initDOMReferences();

    console.log('UIManager initialisé avec succès');
  },

  /**
   * Initialise les références aux éléments DOM
   */
  initDOMReferences: function() {
    this.state.buttons.applyAllAutoBtn = document.getElementById("applyAllAutoBtn");
    this.state.buttons.step4ApplyAll = document.getElementById("step4ApplyAll");
    this.state.containers.scanResults = document.getElementById("scanResults");
    this.state.containers.unifiedCleaningList = document.getElementById("unifiedCleaningList");
  },

  /**
   * Gère l'application de toutes les corrections avec animation
   * @param {Object} options - Options pour l'animation
   */
  handleAllFixesApplied: function(options = {}) {
    console.log('🔧 handleAllFixesApplied appelée avec options:', options);

    if (!this.animationManager) {
      console.warn('❌ AnimationManager non disponible');
      return;
    }

    const appliedCount = options.appliedCount || 0;
    const cards = options.cards || document.querySelectorAll('.cleaning-result-card');

    console.log('📊 Cartes trouvées:', cards.length);
    console.log('🎯 AnimationManager disponible:', !!this.animationManager);

    // Utiliser l'API d'animation unifiée
    this.animationManager.animateAllFixesApplied({
      cards: cards,
      appliedCount: appliedCount,
      buttons: this.state.buttons,
      onComplete: (count) => {
        console.log('✅ Animation terminée avec succès pour', count, 'corrections');
        this.showSuccessMessage(count);
      }
    });
  },

  /**
   * Affiche le message de succès
   * @param {number} appliedCount - Nombre de corrections appliquées
   */
  showSuccessMessage: function(appliedCount) {
    const container = this.state.containers.unifiedCleaningList;
    if (container) {
      container.innerHTML = `<div style="text-align: center; padding: 40px 20px; color: var(--poly-success);"><p>✅ ${appliedCount} correction(s) appliquée(s) avec succès !</p></div>`;
    }
  },

  /**
   * Rend les suggestions sous forme de pastilles
   * @param {Array} suggestions - Liste des suggestions
   * @param {string} property - Type de propriété
   * @param {Array} indices - Indices pour les callbacks
   * @returns {string} HTML des pastilles
   */
  renderSmartSuggestions: function(suggestions, property, indices) {
    if (!this.pillManager) {
      console.warn('PillManager non disponible');
      return '';
    }

    return this.pillManager.renderSmartSuggestions(suggestions, property, indices);
  },

  /**
   * Gère le clic sur une pastille
   * @param {HTMLElement} buttonElement - Élément bouton cliqué
   * @param {Array} indices - Indices de la correction
   * @param {string} variableId - ID de la variable
   * @param {string} variableName - Nom de la variable
   * @param {string} variableValue - Valeur de la variable
   */
  handleSmartPillClick: function(buttonElement, indices, variableId, variableName, variableValue) {
    if (!this.pillManager) {
      console.warn('PillManager non disponible');
      return;
    }

    this.pillManager.handlePillClick(buttonElement, indices, variableId, variableName, variableValue);
  },

  /**
   * Configure les animations
   * @param {Object} config - Configuration des animations
   */
  configureAnimations: function(config) {
    if (this.animationManager && this.animationManager.updateConfig) {
      this.animationManager.updateConfig(config);
    }
  },

  /**
   * Configure les pastilles
   * @param {Object} config - Configuration des pastilles
   */
  configurePills: function(config) {
    if (this.pillManager && this.pillManager.updateConfig) {
      this.pillManager.updateConfig(config);
    }
  },

  /**
   * Applique toutes les corrections (fonction publique)
   */
  applyAllFixes: function() {
    // Envoyer le message au plugin
    if (typeof parent !== 'undefined' && parent.postMessage) {
      parent.postMessage({
        pluginMessage: {
          type: "apply-all-fixes"
        }
      }, "*");
    }

    // Désactiver les boutons via le gestionnaire d'animation
    if (this.animationManager) {
      this.animationManager.disableButtons(this.state.buttons);
    }
  },

  /**
   * Obtient l'état actuel du gestionnaire
   * @returns {Object} État actuel
   */
  getState: function() {
    return { ...this.state };
  },

  /**
   * Met à jour l'état du gestionnaire
   * @param {Object} newState - Nouvel état
   */
  updateState: function(newState) {
    this.state = { ...this.state, ...newState };
  }
};

// Export pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UIManager;
} else if (typeof window !== 'undefined') {
  window.UIManager = UIManager;
}
