#!/usr/bin/env node

/**
 * Script de préparation pour la production - PolyToken by Emma
 * 
 * Ce script :
 * 1. Compte les console.log dans le code
 * 2. Crée des versions production (sans logs)
 * 3. Valide la structure du projet
 * 4. Génère un rapport de préparation
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Préparation pour la Production - PolyToken by Emma\n');
console.log('═══════════════════════════════════════════════════════════\n');

// Configuration
const DEBUG_MODE = false; // Mettre à true pour garder les logs en dev

// Fichiers à traiter
const files = {
    'code.js': { type: 'js', critical: true },
    'ui.html': { type: 'html', critical: true }
};

// Statistiques
let stats = {
    totalLogs: 0,
    filesProcessed: 0,
    filesCreated: 0,
    errors: []
};

/**
 * Compte les console.log dans un fichier
 */
function countConsoleLogs(content) {
    const matches = content.match(/console\.log\(/g);
    return matches ? matches.length : 0;
}

/**
 * Désactive les console.log (les remplace par une fonction vide)
 */
function disableConsoleLogs(content) {
    if (DEBUG_MODE) {
        return content;
    }

    // Remplacer console.log par une fonction vide
    // Garder console.error et console.warn
    return content.replace(/console\.log\(/g, '(function(){return function(){}})()&&console.log(');
}

/**
 * Traite un fichier pour la production
 */
function processFile(filename, config) {
    const filePath = path.join(__dirname, filename);

    if (!fs.existsSync(filePath)) {
        stats.errors.push(`Fichier non trouvé : ${filename}`);
        return;
    }

    console.log(`📝 Traitement de ${filename}...`);

    const content = fs.readFileSync(filePath, 'utf8');
    const logCount = countConsoleLogs(content);

    console.log(`   Taille : ${(content.length / 1024).toFixed(1)} KB`);
    console.log(`   Console.log trouvés : ${logCount}`);

    stats.totalLogs += logCount;
    stats.filesProcessed++;

    if (logCount > 0 && !DEBUG_MODE) {
        const modified = disableConsoleLogs(content);
        const prodFile = filename.replace(/\.(js|html)$/, '.prod.$1');
        const prodPath = path.join(__dirname, prodFile);

        fs.writeFileSync(prodPath, modified, 'utf8');
        console.log(`   ✅ Créé : ${prodFile}`);
        stats.filesCreated++;
    } else if (DEBUG_MODE) {
        console.log(`   ⚠️  Mode DEBUG - logs conservés`);
    } else {
        console.log(`   ✅ Aucun log à supprimer`);
    }

    console.log('');
}

/**
 * Valide la structure du projet
 */
function validateProjectStructure() {
    console.log('🔍 Validation de la structure du projet...\n');

    const requiredFiles = [
        { path: 'code.js', name: 'Code principal' },
        { path: 'ui.html', name: 'Interface utilisateur' },
        { path: 'README.md', name: 'Documentation' },
        { path: 'docs/PRODUCTION_READINESS.md', name: 'Rapport de production' },
        { path: 'docs/DEPLOYMENT_CHECKLIST.md', name: 'Checklist de déploiement' }
    ];

    let allPresent = true;

    requiredFiles.forEach(file => {
        const exists = fs.existsSync(path.join(__dirname, file.path));
        console.log(`   ${exists ? '✅' : '❌'} ${file.name} (${file.path})`);
        if (!exists) allPresent = false;
    });

    console.log('');
    return allPresent;
}

/**
 * Génère le rapport final
 */
function generateReport() {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📊 Rapport de Préparation\n');

    console.log(`Fichiers traités : ${stats.filesProcessed}`);
    console.log(`Fichiers créés : ${stats.filesCreated}`);
    console.log(`Total console.log trouvés : ${stats.totalLogs}`);
    console.log(`Mode DEBUG : ${DEBUG_MODE ? 'ACTIVÉ ⚠️' : 'DÉSACTIVÉ ✅'}`);

    if (stats.errors.length > 0) {
        console.log('\n⚠️  Erreurs rencontrées :');
        stats.errors.forEach(err => console.log(`   - ${err}`));
    }

    console.log('\n═══════════════════════════════════════════════════════════\n');
}

/**
 * Affiche les prochaines étapes
 */
function showNextSteps() {
    if (!DEBUG_MODE && stats.filesCreated > 0) {
        console.log('📝 Prochaines Étapes :\n');
        console.log('1. Vérifier les fichiers .prod.js et .prod.html');
        console.log('2. Tester dans Figma avec les fichiers de production');
        console.log('3. Si tout fonctionne, renommer :');
        console.log('   mv code.js code.dev.js');
        console.log('   mv code.prod.js code.js');
        console.log('   mv ui.html ui.dev.html');
        console.log('   mv ui.prod.html ui.html');
        console.log('\n4. (Optionnel) Minifier pour réduire la taille :');
        console.log('   npm install -g terser html-minifier');
        console.log('   terser code.js -o code.min.js -c -m');
        console.log('   html-minifier ui.html -o ui.min.html --collapse-whitespace\n');
    } else if (DEBUG_MODE) {
        console.log('⚠️  Mode DEBUG activé - aucun fichier de production créé\n');
        console.log('Pour créer les fichiers de production :');
        console.log('1. Ouvrir prepare-production.js');
        console.log('2. Changer DEBUG_MODE à false');
        console.log('3. Relancer : node prepare-production.js\n');
    }
}

// Exécution principale
console.log('🔧 Étape 1 : Traitement des fichiers\n');

Object.keys(files).forEach(filename => {
    processFile(filename, files[filename]);
});

console.log('🔍 Étape 2 : Validation de la structure\n');
const structureValid = validateProjectStructure();

console.log('📊 Étape 3 : Génération du rapport\n');
generateReport();

if (structureValid) {
    console.log('✅ Structure du projet validée !\n');
} else {
    console.log('⚠️  Certains fichiers requis sont manquants\n');
}

showNextSteps();

console.log('✨ Préparation terminée !\n');

// Code de sortie
process.exit(stats.errors.length > 0 ? 1 : 0);
