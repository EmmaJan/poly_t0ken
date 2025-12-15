// Script de débogage détaillé pour la génération de tokens
// À exécuter dans la console du plugin Figma

console.log('=== DEBUG: Génération de tokens ===');

// Test de chaque fonction individuellement
function testFunction(name, fn, ...args) {
    try {
        console.log(`🔍 Testing ${name}(${args.join(', ')})...`);
        const result = fn(...args);
        console.log(`✅ ${name} result:`, result);
        console.log(`✅ ${name} type:`, typeof result);
        if (result && typeof result === 'object') {
            console.log(`✅ ${name} keys:`, Object.keys(result));
            console.log(`✅ ${name} length:`, Object.keys(result).length);
        }
        return result;
    } catch (error) {
        console.error(`❌ ${name} ERROR:`, error);
        return null;
    }
}

// Test des fonctions de génération
console.log('\n🎨 Testing generateBrandColors...');
const brandTokens = testFunction('generateBrandColors', generateBrandColors, '#007ACC', 'custom');

console.log('\n🎨 Testing generateSystemColors...');
const systemTokens = testFunction('generateSystemColors', generateSystemColors, 'custom');

console.log('\n🎨 Testing generateGrayscale...');
const grayTokens = testFunction('generateGrayscale', generateGrayscale, 'custom');

console.log('\n🎨 Testing generateSpacing...');
const spacingTokens = testFunction('generateSpacing', generateSpacing, 'custom');

console.log('\n🎨 Testing generateRadius...');
const radiusTokens = testFunction('generateRadius', generateRadius, 'custom');

console.log('\n🎨 Testing generateTypography...');
const typographyTokens = testFunction('generateTypography', generateTypography, 'custom');

console.log('\n🎨 Testing generateBorder...');
const borderTokens = testFunction('generateBorder', generateBorder);

// Test de l'assemblage final
console.log('\n🔄 Testing final token assembly...');
try {
    const finalTokens = {
        brand: brandTokens,
        system: systemTokens,
        gray: grayTokens,
        spacing: spacingTokens,
        radius: radiusTokens,
        typography: typographyTokens,
        border: borderTokens
    };

    console.log('✅ Final tokens object:', finalTokens);
    console.log('✅ Final tokens keys:', Object.keys(finalTokens));
    console.log('✅ Final tokens length:', Object.keys(finalTokens).length);

    // Vérifier chaque catégorie
    Object.entries(finalTokens).forEach(([category, tokens]) => {
        if (!tokens || (typeof tokens === 'object' && Object.keys(tokens).length === 0)) {
            console.warn(`⚠️ Category ${category} is empty or null:`, tokens);
        } else {
            console.log(`✅ Category ${category}: ${Object.keys(tokens).length} tokens`);
        }
    });

} catch (error) {
    console.error('❌ Final assembly ERROR:', error);
}

console.log('\n=== DEBUG COMPLETE ===');