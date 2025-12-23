// 🧪 Script de Diagnostic : Dark Mode Alias Loss
// À exécuter dans la console Figma APRÈS régénération des tokens

console.log('🧪 === DIAGNOSTIC : Dark Mode Alias Loss ===\n');

// 1. Vérifier les collections sémantiques
const semanticCollections = figma.variables.getLocalVariableCollections()
    .filter(c => c.name.includes('Semantic'));

if (semanticCollections.length === 0) {
    console.error('❌ Aucune collection sémantique trouvée !');
} else {
    console.log(`✅ ${semanticCollections.length} collection(s) sémantique(s) trouvée(s)\n`);
}

// 2. Pour chaque collection, analyser les modes
semanticCollections.forEach(collection => {
    console.log(`\n📦 Collection: ${collection.name}`);
    console.log('─'.repeat(60));

    const lightMode = collection.modes.find(m => m.name === 'Light');
    const darkMode = collection.modes.find(m => m.name === 'Dark');

    if (!lightMode) {
        console.error('❌ Mode Light non trouvé !');
        return;
    }
    if (!darkMode) {
        console.error('❌ Mode Dark non trouvé !');
        return;
    }

    console.log(`✅ Light Mode ID: ${lightMode.modeId}`);
    console.log(`✅ Dark Mode ID: ${darkMode.modeId}\n`);

    const variables = collection.variableIds
        .map(id => figma.variables.getVariableById(id))
        .filter(v => v !== null);

    let lightAliasCount = 0;
    let lightRawCount = 0;
    let darkAliasCount = 0;
    let darkRawCount = 0;
    let darkWhiteCount = 0;
    let darkZeroCount = 0;

    const problematicTokens = [];

    variables.forEach(v => {
        const lightValue = v.valuesByMode[lightMode.modeId];
        const darkValue = v.valuesByMode[darkMode.modeId];

        // Analyser Light Mode
        if (lightValue && typeof lightValue === 'object' && lightValue.type === 'VARIABLE_ALIAS') {
            lightAliasCount++;
        } else {
            lightRawCount++;
            if (v.resolvedType === 'COLOR' && lightValue && (lightValue.r === 1 && lightValue.g === 1 && lightValue.b === 1)) {
                problematicTokens.push({ name: v.name, mode: 'light', issue: 'white', value: '#FFFFFF' });
            }
        }

        // Analyser Dark Mode
        if (darkValue && typeof darkValue === 'object' && darkValue.type === 'VARIABLE_ALIAS') {
            darkAliasCount++;
        } else {
            darkRawCount++;
            if (v.resolvedType === 'COLOR') {
                if (darkValue && darkValue.r === 1 && darkValue.g === 1 && darkValue.b === 1) {
                    darkWhiteCount++;
                    problematicTokens.push({ name: v.name, mode: 'dark', issue: 'white', value: '#FFFFFF' });
                }
            } else if (v.resolvedType === 'FLOAT') {
                if (darkValue === 0) {
                    darkZeroCount++;
                    problematicTokens.push({ name: v.name, mode: 'dark', issue: 'zero', value: 0 });
                }
            }
        }
    });

    console.log('📊 Statistiques Light Mode:');
    console.log(`  ✅ Alias: ${lightAliasCount}`);
    console.log(`  ⚠️  Raw values: ${lightRawCount}`);

    console.log('\n📊 Statistiques Dark Mode:');
    console.log(`  ✅ Alias: ${darkAliasCount}`);
    console.log(`  ⚠️  Raw values: ${darkRawCount}`);
    console.log(`  ❌ White (#FFFFFF): ${darkWhiteCount}`);
    console.log(`  ❌ Zero (0): ${darkZeroCount}`);

    if (problematicTokens.length > 0) {
        console.log('\n❌ Tokens Problématiques:');
        problematicTokens.forEach(t => {
            console.log(`  - ${t.name} (${t.mode}): ${t.issue} → ${t.value}`);
        });
    } else {
        console.log('\n✅ Aucun token problématique détecté !');
    }
});

// 3. Vérifier les primitives system
console.log('\n\n🔍 === VÉRIFICATION : Primitives System ===');
const systemCollections = figma.variables.getLocalVariableCollections()
    .filter(c => c.name.toLowerCase().includes('system'));

if (systemCollections.length === 0) {
    console.warn('⚠️ Aucune collection "system" trouvée. Status tokens ne pourront pas s\'aliaser.');
} else {
    systemCollections.forEach(collection => {
        console.log(`\n📦 Collection: ${collection.name}`);
        const variables = collection.variableIds
            .map(id => figma.variables.getVariableById(id))
            .filter(v => v !== null);

        console.log(`  Variables: ${variables.map(v => v.name).join(', ')}`);
    });
}

console.log('\n\n🎉 === DIAGNOSTIC TERMINÉ ===');
console.log('\nProblèmes attendus à corriger :');
console.log('1. Dark mode → #FFFFFF au lieu d\'alias vers gray primitives');
console.log('2. Status tokens → #000000 au lieu d\'alias vers system primitives');
console.log('3. bg.subtle, bg.accent → #FFFFFF au lieu d\'alias');
