#!/usr/bin/env node

/**
 * Script de vérification de compatibilité JavaScript pour plugin Figma
 * Vérifie l'absence de syntaxes modernes non supportées par Figma
 */

const fs = require('fs');
const path = require('path');

const MODERN_SYNTAX_PATTERNS = [
  { pattern: /\?\./g, name: 'Optional Chaining', example: 'obj?.property' },
  { pattern: /\?\?/g, name: 'Nullish Coalescing', example: 'obj ?? default' },
  { pattern: /=>/g, name: 'Arrow Functions', example: '() => {}' },
  { pattern: /\$\{.*\}/g, name: 'Template Literals interpolation', example: '`${variable}`' },
  { pattern: /class\s+\w+/g, name: 'ES6 Classes', example: 'class MyClass {}' },
  { pattern: /const\s+\w+\s*=/g, name: 'const declarations', example: 'const x = 1' },
  { pattern: /let\s+\w+\s*=/g, name: 'let declarations', example: 'let x = 1' },
  { pattern: /async\s+function/g, name: 'async/await', example: 'async function foo() {}' },
  { pattern: /import\s+.*from/g, name: 'ES6 imports', example: 'import x from "y"' },
  { pattern: /export\s+/g, name: 'ES6 exports', example: 'export default x' }
];

const ALLOWED_PATTERNS = [
  // Autoriser const/let dans les déclarations de fonctions (c'est du code moderne mais supporté)
  /const\s+\w+\s*=\s*function/g,
  /const\s+\w+\s*=\s*\(/g,
  /let\s+\w+\s*=\s*function/g,
  /let\s+\w+\s*=\s*\(/g,
  // Autoriser les classes dans le contexte HTML (mais pas dans code.js)
  /class\s*=/g  // Pour les attributs class HTML
];

function checkFile(filePath) {
  console.log(`🔍 Vérification de ${filePath}...`);

  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error(`❌ Impossible de lire ${filePath}: ${error.message}`);
    return false;
  }

  let hasErrors = false;

  MODERN_SYNTAX_PATTERNS.forEach(({ pattern, name, example }) => {
    const matches = content.match(pattern);
    if (matches) {
      // Vérifier si c'est un pattern autorisé
      const isAllowed = ALLOWED_PATTERNS.some(allowedPattern => allowedPattern.test(content));

      if (!isAllowed) {
        console.error(`❌ Syntaxe ${name} détectée dans ${filePath}:`);
        console.error(`   Exemple: ${example}`);
        console.error(`   Occurrences: ${matches.length}`);
        hasErrors = true;
      }
    }
  });

  if (!hasErrors) {
    console.log(`✅ ${filePath} est compatible`);
  }

  return !hasErrors;
}

function main() {
  const filesToCheck = [
    'code.js',
    'ui.html'
  ];

  console.log('🚀 Vérification de compatibilité JavaScript pour plugin Figma\n');

  let allValid = true;

  filesToCheck.forEach(file => {
    if (fs.existsSync(file)) {
      const isValid = checkFile(file);
      allValid = allValid && isValid;
    } else {
      console.warn(`⚠️ Fichier ${file} non trouvé`);
    }
  });

  console.log('\n' + '='.repeat(50));

  if (allValid) {
    console.log('🎉 Tous les fichiers sont compatibles !');
    process.exit(0);
  } else {
    console.log('❌ Des syntaxes incompatibles ont été détectées.');
    console.log('🔧 Consultez COMPATIBILITY.md pour les corrections.');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}


