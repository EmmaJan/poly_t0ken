// 🔍 Script de diagnostic pour vérifier l'état des collections Figma
// À exécuter dans la console développeur Figma (Cmd+Option+I)

console.log('🔍 === DIAGNOSTIC DES COLLECTIONS FIGMA ===');

// 1. Lister toutes les collections
const collections = figma.variables.getLocalVariableCollections();
console.log(`\n📚 Collections trouvées : ${collections.length}`);

collections.forEach((col, idx) => {
    console.log(`\n${idx + 1}. ${col.name}`);
    console.log(`   - ID: ${col.id}`);
    console.log(`   - Modes: ${col.modes.map(m => m.name).join(', ')}`);
    console.log(`   - Variables: ${col.variableIds.length}`);

    // Afficher les 5 premières variables
    const vars = col.variableIds.slice(0, 5).map(id => {
        const v = figma.variables.getVariableById(id);
        return v ? v.name : 'unknown';
    });

    if (vars.length > 0) {
        console.log(`   - Exemples: ${vars.join(', ')}${col.variableIds.length > 5 ? '...' : ''}`);
    }
});

// 2. Vérifier les collections critiques
console.log('\n\n🎯 === VÉRIFICATION DES COLLECTIONS CRITIQUES ===');

const criticalCollections = [
    'Brand Colors',
    'Grayscale',
    'System Colors',
    'Spacing',
    'Radius',
    'Typography',
    'Semantic'
];

criticalCollections.forEach(name => {
    const found = collections.find(c => c.name === name);
    if (found) {
        console.log(`✅ ${name}: ${found.variableIds.length} variables`);
    } else {
        console.log(`❌ ${name}: MANQUANT`);
    }
});

// 3. Vérifier les variables primitives clés
console.log('\n\n🔑 === VÉRIFICATION DES VARIABLES CLÉS ===');

const keyVariables = [
    'primary-500',
    'gray-900',
    'gray-50',
    'white',
    'success',
    'warning',
    'error',
    'info'
];

const allVars = figma.variables.getLocalVariables();
console.log(`\n📊 Total de variables locales : ${allVars.length}`);

keyVariables.forEach(name => {
    const found = allVars.find(v =>
        v.name === name ||
        v.name === `gray-${name}` ||
        v.name === `primary-${name}` ||
        v.name === `system-${name}`
    );

    if (found) {
        const col = figma.variables.getVariableCollectionById(found.variableCollectionId);
        const modeId = col.modes[0].modeId;
        const value = found.valuesByMode[modeId];
        console.log(`✅ ${name}: ${found.name} (${typeof value === 'object' && value.r !== undefined ? 'RGB' : value})`);
    } else {
        console.log(`❌ ${name}: MANQUANT`);
    }
});

// 4. Construire la globalVariableMap (comme dans le code)
console.log('\n\n🗺️ === CONSTRUCTION DE LA GLOBAL VARIABLE MAP ===');

const globalMap = new Map();

allVars.forEach(variable => {
    const collection = figma.variables.getVariableCollectionById(variable.variableCollectionId);
    if (!collection) return;

    const category = collection.name.toLowerCase().replace(/\s+/g, '');
    const varName = variable.name.toLowerCase();

    // Générer les clés possibles
    const keys = [
        variable.name,
        varName,
        `${category}/${variable.name}`,
        `${category}-${variable.name}`,
        `${category}/${varName}`,
        `${category}-${varName}`
    ];

    keys.forEach(key => {
        if (!globalMap.has(key)) {
            globalMap.set(key, variable.id);
        }
    });
});

console.log(`✅ GlobalVariableMap construite : ${globalMap.size} entrées`);

// Afficher quelques exemples
console.log('\n📋 Exemples d\'entrées dans la map :');
let count = 0;
for (const [key, id] of globalMap.entries()) {
    if (count >= 10) break;
    const v = figma.variables.getVariableById(id);
    console.log(`   ${key} → ${v ? v.name : 'unknown'}`);
    count++;
}

// 5. Tester la résolution d'alias pour un token sémantique
console.log('\n\n🧪 === TEST DE RÉSOLUTION D\'ALIAS ===');

const testSemanticKeys = [
    'action.primary.default',
    'bg.canvas',
    'text.primary',
    'border.default'
];

testSemanticKeys.forEach(semanticKey => {
    console.log(`\n🔍 Test: ${semanticKey}`);

    // Simuler la recherche (simplifié)
    const expectedPrimitive = {
        'action.primary.default': 'primary-500',
        'bg.canvas': 'gray-50',
        'text.primary': 'gray-900',
        'border.default': 'gray-200'
    }[semanticKey];

    const found = globalMap.has(expectedPrimitive) ||
        globalMap.has(`brand/${expectedPrimitive}`) ||
        globalMap.has(`gray/${expectedPrimitive}`);

    if (found) {
        console.log(`   ✅ Primitive trouvée : ${expectedPrimitive}`);
    } else {
        console.log(`   ❌ Primitive MANQUANTE : ${expectedPrimitive}`);
        console.log(`   Recherché dans : ${expectedPrimitive}, brand/${expectedPrimitive}, gray/${expectedPrimitive}`);
    }
});

console.log('\n\n✅ === DIAGNOSTIC TERMINÉ ===');
console.log('Copiez ces résultats pour analyse.');
