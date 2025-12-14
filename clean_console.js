// Script pour nettoyer la console des avertissements Figma
// À ajouter temporairement dans ui.html pour le développement

(function() {
  // Sauvegarder les méthodes console originales
  const originalWarn = console.warn;
  const originalError = console.error;

  // Filtrer les avertissements de préchargement Figma
  console.warn = function(...args) {
    const message = args.join(' ');
    if (message.includes('was preloaded using link preload but not used') ||
        message.includes('figma.com/api/') ||
        message.includes('static.figma.com/')) {
      return; // Ignorer ces avertissements
    }
    originalWarn.apply(console, args);
  };

  // Optionnel : filtrer aussi les erreurs similaires
  console.error = function(...args) {
    const message = args.join(' ');
    if (message.includes('was preloaded using link preload but not used')) {
      return; // Ignorer
    }
    originalError.apply(console, args);
  };

  console.log('🧹 Console nettoyée des avertissements Figma de préchargement');
})();