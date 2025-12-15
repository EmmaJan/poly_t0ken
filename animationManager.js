/**
 * Animation Manager - Gestionnaire d'animations indépendant
 * Permet de gérer les animations de nettoyage de manière isolée
 */

const AnimationManager = {
  config: {
    cardAnimation: {
      successDuration: 400, // Temps du flash vert
      exitDuration: 300,    // Temps du slide out
      collapseDuration: 300, // Temps du repli de hauteur
      staggerDelay: 80      // Délai entre chaque carte (effet cascade)
    },
    buttonAnimation: {
      disabledText: { applyAll: 'Application...', step4: '⏳ ...' },
      successText: { applyAll: '✨ Terminé !', step4: 'Terminé' }
    }
  },

  /**
   * Anime une carte unique ou une liste
   */
  animateCardsDisappearance: function(cards, appliedCount, onComplete) {
    const config = this.config.cardAnimation;
    console.log('🚀 AnimationManager.animateCardsDisappearance appelée');

    // Convertir NodeList en Array si nécessaire
    const cardArray = Array.from(cards);
    console.log('📋 Nombre de cartes à animer:', cardArray.length);

    if (cardArray.length === 0) {
      console.log('⚠️ Aucune carte à animer');
      if (onComplete) onComplete(appliedCount);
      return;
    }

    // SOLUTION RADICALE: Forcer tous les styles directement
    console.log('🔧 Application des styles de base à toutes les cartes');
    cardArray.forEach((card, index) => {
      // Forcer display block et transitions
      card.style.display = 'block';
      card.style.transition =
        'transform 0.3s ease, ' +
        'opacity 0.3s ease, ' +
        'background-color 0.2s ease, ' +
        'border-color 0.2s ease, ' +
        'height 0.3s ease, ' +
        'margin-bottom 0.3s ease, ' +
        'padding-top 0.3s ease, ' +
        'padding-bottom 0.3s ease';
      card.style.overflow = 'hidden';
      card.style.opacity = '1';
      card.style.transform = 'translateX(0) scale(1)';
      console.log(`📋 Carte ${index + 1} préparée avec display: ${getComputedStyle(card).display}`);
    });

    // Compteur pour savoir quand TOUT est fini
    let finishedAnimations = 0;
    const totalCards = cardArray.length;

    cardArray.forEach((card, index) => {
      console.log(`🎴 Carte ${index + 1}:`, card.className, card.offsetHeight + 'px');
      // Calcul du délai pour l'effet "Cascade" (waterfall)
      const delay = index * config.staggerDelay;

      setTimeout(() => {
        // 1. Préparer la carte pour l'animation
        console.log(`🔧 Préparation carte ${index + 1} pour animation`);

        // SOLUTION RADICALE: Figer tous les styles de base
        const height = card.offsetHeight;
        console.log(`📏 Figer hauteur carte ${index + 1}: ${height}px`);

        // Styles de base (sans transitions pour éviter les conflits)
        card.style.height = height + 'px';
        card.style.minHeight = '0';
        card.style.display = 'block';
        card.style.overflow = 'hidden';
        card.style.opacity = '1';
        card.style.transform = 'translateX(0) scale(1)';
        card.style.backgroundColor = '';
        card.style.borderColor = '';
        card.style.marginBottom = '';
        card.style.paddingTop = '';
        card.style.paddingBottom = '';
        card.style.borderWidth = '';

        // Attendre que les styles soient appliqués
        setTimeout(() => {
            console.log(`🎨 État initial carte ${index + 1}:`, {
                height: getComputedStyle(card).height,
                opacity: getComputedStyle(card).opacity,
                transform: getComputedStyle(card).transform
            });

            // 2. État Succès - Appliquer transitions et styles
            console.log(`✨ État SUCCESS carte ${index + 1}`);
            card.style.transition = 'transform 0.3s ease, background-color 0.2s ease, border-color 0.2s ease';
            card.style.backgroundColor = 'rgba(22, 163, 74, 0.1)';
            card.style.borderColor = '#16A34A';
            card.style.transform = 'scale(1.02)';

            setTimeout(() => {
                console.log(`🎯 Styles après SUCCESS:`, {
                    backgroundColor: getComputedStyle(card).backgroundColor,
                    borderColor: getComputedStyle(card).borderColor,
                    transform: getComputedStyle(card).transform
                });
            }, 50);

            // 3. État Sortie (après un court instant pour voir le vert)
            setTimeout(() => {
              console.log(`🚀 État EXITING carte ${index + 1}`);
              card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
              card.style.opacity = '0';
              card.style.transform = 'translateX(50px) scale(0.95)';
              card.style.pointerEvents = 'none';

              setTimeout(() => {
                  console.log(`🎯 Styles après EXITING:`, {
                      opacity: getComputedStyle(card).opacity,
                      transform: getComputedStyle(card).transform
                  });
              }, 50);

              // 4. État Repli (Collapse) - commence légèrement avant la fin du slide
              setTimeout(() => {
                console.log(`📦 État COLLAPSED carte ${index + 1}`);
                card.style.transition = 'height 0.3s ease, margin-bottom 0.3s ease, padding-top 0.3s ease, padding-bottom 0.3s ease, border-width 0.3s ease';
                card.style.height = '0px';
                card.style.marginBottom = '0px';
                card.style.paddingTop = '0px';
                card.style.paddingBottom = '0px';
                card.style.borderWidth = '0px';

                setTimeout(() => {
                    console.log(`🎯 Styles après COLLAPSED:`, {
                        height: getComputedStyle(card).height,
                        marginBottom: getComputedStyle(card).marginBottom,
                        paddingTop: getComputedStyle(card).paddingTop
                    });
                }, 50);

            // 5. Nettoyage DOM final
            setTimeout(() => {
              console.log(`🧹 Nettoyage final carte ${index + 1}`);
              card.style.display = 'none';
              // Reset des classes pour si on réutilise la carte plus tard (ex: undo)
              card.classList.remove('is-exiting', 'is-collapsed');
              card.style.height = '';
              card.style.minHeight = '';
              card.style.overflow = '';
              // Ne pas reset display ici pour laisser la carte cachée

              finishedAnimations++;
              console.log(`📊 Animations terminées: ${finishedAnimations}/${totalCards}`);

              // Si c'est la dernière carte de l'animation visuelle
              if (finishedAnimations === totalCards) {
                console.log(`🎉 Toutes les animations terminées, appel du callback`);
                if (onComplete) onComplete(appliedCount);
              }
            }, config.collapseDuration);

          }, config.exitDuration * 0.6); // Le repli commence à 60% du slide out

        }, config.successDuration);

      }, delay);
    });
  },

  // ... (Garder disableButtons, enableButtons, updateConfig comme avant)

  disableButtons: function(buttons) {
    const config = this.config.buttonAnimation;

    if (buttons.applyAllAutoBtn) {
      buttons.applyAllAutoBtn.disabled = true;
      buttons.applyAllAutoBtn.textContent = config.disabledText.applyAll;
    }

    if (buttons.step4ApplyAll) {
      buttons.step4ApplyAll.disabled = true;
      buttons.step4ApplyAll.textContent = config.disabledText.step4;
    }
  },

  enableButtons: function(buttons) {
    const config = this.config.buttonAnimation;

    if (buttons.applyAllAutoBtn) {
      buttons.applyAllAutoBtn.disabled = false;
      buttons.applyAllAutoBtn.textContent = config.successText.applyAll;
    }

    if (buttons.step4ApplyAll) {
      buttons.step4ApplyAll.disabled = false;
      buttons.step4ApplyAll.textContent = config.successText.step4;
    }
  },

  updateConfig: function(newConfig) { this.config = { ...this.config, ...newConfig }; },
  getConfig: function() { return { ...this.config }; },

  animateAllFixesApplied: function(options) {
    const { cards, appliedCount, buttons, onComplete } = options;
    this.disableButtons(buttons);
    this.animateCardsDisappearance(cards, appliedCount, (count) => {
      // Délai avant de réactiver les boutons pour laisser l'utilisateur apprécier le vide
      setTimeout(() => {
        this.enableButtons(buttons);
        if (onComplete) onComplete(count);
      }, 300);
    });
  }
};

// Export pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AnimationManager;
} else if (typeof window !== 'undefined') {
  window.AnimationManager = AnimationManager;
}
