// Extraction du JavaScript de ui.html pour test de syntaxe
const fs = require('fs');

try {
  const html = fs.readFileSync('ui.html', 'utf8');
  const scriptMatch = html.match(/<script[^>]*>([\s\S]*?)<\/script>/);
  if (scriptMatch) {
    const jsCode = scriptMatch[1];

    // Créer un contexte avec des variables globales simulées
    const context = `
      // Variables globales simulées
      var document = { querySelector: () => ({}), addEventListener: () => ({}), body: {} };
      var window = { onmessage: null };
      var parent = { postMessage: () => ({}) };
      var console = { log: () => ({}), error: () => ({}) };
      var initFilterSystem = () => ({});
      var initVariableSelectors = () => ({});

      // Code à tester (sans redéclaration d'ICONS)
      ${jsCode.replace(/const ICONS = \{[\s\S]*?\};/, '// ICONS already declared in context')}
    `;

    console.log('Testing JavaScript syntax...');
    new Function(context);
    console.log('✅ Syntaxe JavaScript OK');
  } else {
    console.log('❌ Aucun script trouvé');
  }
} catch (error) {
  console.log('❌ Erreur de syntaxe:', error.message);

  // Essayer d'extraire la ligne problématique
  const stackLines = error.stack.split('\n');
  for (let line of stackLines) {
    if (line.includes('test_syntax.js') && line.includes('<anonymous>:')) {
      const match = line.match(/<anonymous>:(\d+):(\d+)/);
      if (match) {
        const lineNum = parseInt(match[1]);
        console.log('Erreur vers la ligne:', lineNum);
        // Afficher le contexte autour de cette ligne
        const lines = context.split('\n');
        const start = Math.max(0, lineNum - 3);
        const end = Math.min(lines.length, lineNum + 3);
        console.log('Contexte:');
        for (let i = start; i < end; i++) {
          console.log(`${i+1}: ${lines[i]}`);
        }
      }
      break;
    }
  }
}