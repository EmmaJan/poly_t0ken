/**
 * Pill Manager - Gestionnaire des pastilles/smart-pills
 * Gère l'affichage et l'interaction des pastilles de suggestion
 */

var PillManager = {
  // Configuration des pastilles
  config: {
    displayLimit: 3,  // Nombre maximum de pastilles affichées
    icons: {
      color: '',      // Les couleurs utilisent un swatch coloré
      typography: '📏', // Pour la typographie
      spacing: '📏'     // Pour l'espacement et les radius
    }
  },

  /**
   * Génère le contenu visuel d'une pastille selon le type de propriété
   * @param {Object} suggestion - Suggestion de variable
   * @param {string} property - Type de propriété (Fill, Stroke, 'Font Size', etc.)
   * @returns {string} HTML du contenu visuel
   */
  generateVisualContent: function(suggestion, property) {
    if (property === 'Fill' || property === 'Stroke') {
      // Pastille colorée
      const color = suggestion.hex || suggestion.value;
      return `<div class="pill-swatch" style="background-color: ${color}"></div>`;
    } else if (property === 'Font Size') {
      // Aperçu typographique
      const size = parseFloat(suggestion.value);
      const displaySize = Math.min(size, 20); // Limiter la taille d'affichage
      return `<span class="pill-preview-text" style="font-size: ${displaySize}px">Ag</span>`;
    } else {
      // Icône générique pour espacement/rayon
      return `<span class="pill-icon">${this.config.icons.spacing}</span>`;
    }
  },

  /**
   * Détermine la classe CSS pour une pastille selon le type de propriété
   * @param {string} property - Type de propriété
   * @returns {string} Classe CSS de base pour la pastille
   */
  getPillClass: function(property) {
    var pillClass = 'smart-pill';

    if (property === 'Fill' || property === 'Stroke') {
      pillClass += ' pill-color';
    } else if (property === 'Font Size') {
      pillClass += ' pill-typo';
    } else {
      pillClass += ' pill-metric';
    }

    return pillClass;
  },

  /**
   * Gère le clic sur une pastille
   * @param {HTMLElement} buttonElement - Élément bouton cliqué
   * @param {Array} indices - Indices de la correction
   * @param {string} variableId - ID de la variable
   * @param {string} variableName - Nom de la variable
   * @param {string} variableValue - Valeur de la variable
   */
  handlePillClick: function(buttonElement, indices, variableId, variableName, variableValue) {
    const card = buttonElement.closest('.cleaning-result-card');

    // Preview de la correction
    if (typeof sendPreviewFix === 'function') {
      sendPreviewFix(indices, variableId);
    }

    // Stocker la sélection sur la carte
    card.setAttribute('data-selected-variable', variableId);
    card._selectedVariableId = variableId;

    // Activer le bouton Appliquer
    const applyBtn = card.querySelector('button[data-action="apply"]');
    if (applyBtn) {
      applyBtn.disabled = false;
      applyBtn.classList.remove('btn-outline');
      applyBtn.classList.add('btn-primary');
      applyBtn.title = 'Appliquer ' + variableName;
    }

    // Marquer visuellement la pastille sélectionnée
    this.markPillAsSelected(buttonElement);
  },

  /**
   * Marque une pastille comme sélectionnée
   * @param {HTMLElement} pillElement - Élément pastille à marquer
   */
  markPillAsSelected: function(pillElement) {
    const pillRow = pillElement.closest('.smart-suggestions-row');
    if (pillRow) {
      pillRow.querySelectorAll('.smart-pill').forEach(function(pill) {
        pill.classList.remove('selected');
      });
      pillElement.classList.add('selected');
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
    if (!suggestions || suggestions.length === 0) {
      return '';
    }

    var html = '<div class="smart-suggestions-row">';

    const visibleSuggestions = suggestions.slice(0, this.config.displayLimit);

    visibleSuggestions.forEach(function(s) {
      const visualContent = this.generateVisualContent(s, property);
      const pillClass = this.getPillClass(property);

      // Échapper les apostrophes dans les valeurs
      const safeName = String(s.name || '').replace(/'/g, "\\'");
      const safeValue = String(s.resolvedValue || s.value || '').replace(/'/g, "\\'");

      html += `
        <button class="${pillClass}"
                data-indices='${JSON.stringify(indices)}'
                onclick="PillManager.handlePillClick(this, ${JSON.stringify(indices)}, '${s.id}', '${safeName}', '${safeValue}')"
                title="${s.name} (${s.value})">
          ${visualContent}
          <div class="pill-info">
            <span class="pill-name">${s.name}</span>
            <span class="pill-value">${s.resolvedValue || s.value}</span>
          </div>
        </button>
      `;
    });

    // Bouton "Plus" si nécessaire
    if (suggestions.length > this.config.displayLimit) {
      html += `
        <button class="smart-pill pill-more" onclick="PillManager.toggleCustomDropdown(this.closest('.cleaning-result-card').querySelector('.custom-select-container'))">
          +${suggestions.length - this.config.displayLimit}
        </button>
      `;
    }

    html += '</div>';
    return html;
  },

  /**
   * Bascule l'affichage du dropdown personnalisé
   * @param {HTMLElement} container - Conteneur du dropdown
   */
  toggleCustomDropdown: function(container) {
    if (container) {
      // Cette fonction peut être étendue selon les besoins
      // Pour l'instant, on peut utiliser la logique existante
      if (typeof toggleCustomDropdown === 'function') {
        toggleCustomDropdown(container);
      }
    }
  },

  /**
   * Met à jour la configuration des pastilles
   * @param {Object} newConfig - Nouvelle configuration
   */
  updateConfig: function(newConfig) {
    this.config = { ...this.config, ...newConfig };
  },

  /**
   * Obtient la configuration actuelle
   * @returns {Object} Configuration actuelle
   */
  getConfig: function() {
    return { ...this.config };
  }
};

// Export pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PillManager;
} else if (typeof window !== 'undefined') {
  window.PillManager = PillManager;
}
