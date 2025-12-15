// Test script pour les fonctions de génération de tokens
// À exécuter dans la console du navigateur après avoir chargé code.js

console.log('=== Test des fonctions de génération de tokens ===');

// Test des fonctions utilitaires
console.log('Test hexToHsl:');
try {
    var hsl = hexToHsl('#FF0000');
    console.log('hexToHsl("#FF0000"):', hsl);
} catch (error) {
    console.error('Erreur hexToHsl:', error);
}

console.log('Test hslToHex:');
try {
    var hex = hslToHex(0, 100, 50);
    console.log('hslToHex(0, 100, 50):', hex);
} catch (error) {
    console.error('Erreur hslToHex:', error);
}

// Test des fonctions de génération
console.log('Test generateBrandColors:');
try {
    var brandTokens = generateBrandColors('#007ACC', 'custom');
    console.log('generateBrandColors("#007ACC", "custom"):', brandTokens);
} catch (error) {
    console.error('Erreur generateBrandColors:', error);
}

console.log('Test generateSystemColors:');
try {
    var systemTokens = generateSystemColors('custom');
    console.log('generateSystemColors("custom"):', systemTokens);
} catch (error) {
    console.error('Erreur generateSystemColors:', error);
}

console.log('Test generateGrayscale:');
try {
    var grayTokens = generateGrayscale('custom');
    console.log('generateGrayscale("custom"):', grayTokens);
} catch (error) {
    console.error('Erreur generateGrayscale:', error);
}

console.log('Test generateSpacing:');
try {
    var spacingTokens = generateSpacing('custom');
    console.log('generateSpacing("custom"):', spacingTokens);
} catch (error) {
    console.error('Erreur generateSpacing:', error);
}

console.log('Test generateRadius:');
try {
    var radiusTokens = generateRadius('custom');
    console.log('generateRadius("custom"):', radiusTokens);
} catch (error) {
    console.error('Erreur generateRadius:', error);
}

console.log('Test generateTypography:');
try {
    var typographyTokens = generateTypography('custom');
    console.log('generateTypography("custom"):', typographyTokens);
} catch (error) {
    console.error('Erreur generateTypography:', error);
}

console.log('Test generateBorder:');
try {
    var borderTokens = generateBorder();
    console.log('generateBorder():', borderTokens);
} catch (error) {
    console.error('Erreur generateBorder:', error);
}

console.log('=== Test complet terminé ===');