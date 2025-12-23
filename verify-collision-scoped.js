// 🧪 Script de Vérification : Collision Scoped
// À exécuter dans la console Figma après régénération des tokens

console.log('🧪 === TEST : Collision Scoped ===\n');

// 1. Récupérer toutes les collections sémantiques
const semanticCollections = figma.variables.getLocalVariableCollections()
    .filter(c => c.name.includes('Semantic'));

if (semanticCollections.length === 0) {
    console.error('❌ Aucune collection sémantique trouvée !');
} else {
    console.log(`✅ ${semanticCollections.length} collection(s) sémantique(s) trouvée(s)\n`);
}

// 2. Pour chaque collection, analyser les alias
semanticCollections.forEach(collection => {
    console.log(`\n📦 Collection: ${collection.name}`);
    console.log('─'.repeat(60));

    const variables = collection.variableIds
        .map(id => figma.variables.getVariableById(id))
        .filter(v => v !== null);

    // Grouper par scope
    const byScope = {};
    variables.forEach(v => {
        const scope = v.name.split('/')[0]; // ex: "bg", "text", "border"
        if (!byScope[scope]) byScope[scope] = [];
        byScope[scope].push(v);
    });

    // Pour chaque scope, vérifier les collisions
    Object.keys(byScope).forEach(scope => {
        console.log(`\n🎯 Scope: ${scope}`);

        const scopeVars = byScope[scope];
        const modeId = collection.modes[0].modeId; // Mode light

        // Map pour détecter les collisions : primitiveId -> [tokens]
        const primitiveUsage = new Map();

        scopeVars.forEach(v => {
            const value = v.valuesByMode[modeId];

            // Si c'est un alias
            if (value && typeof value === 'object' && value.type === 'VARIABLE_ALIAS') {
                const primitiveId = value.id;
                const primitive = figma.variables.getVariableById(primitiveId);

                if (primitive) {
                    const primitiveName = primitive.name;

                    if (!primitiveUsage.has(primitiveId)) {
                        primitiveUsage.set(primitiveId, []);
                    }
                    primitiveUsage.get(primitiveId).push(v.name);

                    console.log(`  ${v.name} → ${primitiveName}`);
                }
            } else {
                console.log(`  ${v.name} → ${JSON.stringify(value)} (RAW VALUE)`);
            }
        });

        // Détecter les collisions
        let hasCollision = false;
        primitiveUsage.forEach((tokens, primitiveId) => {
            if (tokens.length > 1) {
                hasCollision = true;
                const primitive = figma.variables.getVariableById(primitiveId);
                console.log(`\n  ❌ COLLISION DÉTECTÉE sur ${primitive.name}:`);
                tokens.forEach(t => console.log(`     - ${t}`));
            }
        });

        if (!hasCollision) {
            console.log(`  ✅ Aucune collision dans le scope '${scope}'`);
        }
    });
});

// 3. Vérifier les partages inter-scopes (ATTENDU)
console.log('\n\n🔍 === VÉRIFICATION : Partage Inter-Scopes ===');
console.log('(Ces partages sont NORMAUX et ATTENDUS)\n');

semanticCollections.forEach(collection => {
    const variables = collection.variableIds
        .map(id => figma.variables.getVariableById(id))
        .filter(v => v !== null);

    const modeId = collection.modes[0].modeId;

    // Map globale : primitiveId -> [tokens de différents scopes]
    const globalPrimitiveUsage = new Map();

    variables.forEach(v => {
        const value = v.valuesByMode[modeId];

        if (value && typeof value === 'object' && value.type === 'VARIABLE_ALIAS') {
            const primitiveId = value.id;
            const scope = v.name.split('/')[0];

            if (!globalPrimitiveUsage.has(primitiveId)) {
                globalPrimitiveUsage.set(primitiveId, []);
            }
            globalPrimitiveUsage.get(primitiveId).push({ name: v.name, scope });
        }
    });

    // Trouver les primitives partagées entre scopes
    globalPrimitiveUsage.forEach((tokens, primitiveId) => {
        const scopes = [...new Set(tokens.map(t => t.scope))];

        if (scopes.length > 1) {
            const primitive = figma.variables.getVariableById(primitiveId);
            console.log(`\n✅ ${primitive.name} partagé entre ${scopes.length} scopes:`);
            scopes.forEach(scope => {
                const scopeTokens = tokens.filter(t => t.scope === scope);
                console.log(`  📍 ${scope}: ${scopeTokens.map(t => t.name).join(', ')}`);
            });
        }
    });
});

console.log('\n\n🎉 === TEST TERMINÉ ===');
console.log('\nRésumé attendu :');
console.log('✅ Aucune collision DANS un même scope');
console.log('✅ Partages ENTRE scopes différents (normal)');
console.log('✅ Tous les tokens ont un alias (pas de RAW VALUE)');
