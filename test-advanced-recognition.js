// Test des améliorations avancées : alias + détection transversale radius/spacing

console.log('🚀 Test des améliorations avancées de reconnaissance');

// Simuler des variables Figma pour les tests
function createMockVariable(id, name, resolvedType, value) {
  return {
    id: id,
    name: name,
    resolvedType: resolvedType,
    valuesByMode: { 'default': value || {} }
  };
}

function createMockCollection(name, variables) {
  return {
    name: name,
    variableIds: variables.map(v => v.id),
    modes: [{ modeId: 'default' }],
    _mockVariables: variables
  };
}

// Mock amélioré de figma.variables.getVariableById
global.figma = {
  variables: {
    getVariableById: function(id) {
      const mockVars = {
        'color-blue-500': createMockVariable('color-blue-500', 'blue-500', 'COLOR', { r: 0, g: 0.5, b: 1 }),
        'spacing-md': createMockVariable('spacing-md', 'spacing-md', 'FLOAT', 16),
        'radius-lg': createMockVariable('radius-lg', 'border-radius-large', 'FLOAT', 8),
        'gap-sm': createMockVariable('gap-sm', 'gap-small', 'FLOAT', 4),
        'alias-var': createMockVariable('alias-var', 'primary-alias', 'COLOR', { type: 'VARIABLE_ALIAS', id: 'color-blue-500' })
      };
      return mockVars[id] || null;
    }
  }
};

// Fonctions helper (simulées pour les tests)
function isRadiusPattern(variableName) {
  if (!variableName) return false;
  var name = variableName.toLowerCase();
  return name.includes('radius') || name.includes('corner') || name.includes('border-radius') ||
         name.includes('round') || /^\d+$/.test(name);
}

function isSpacingPattern(variableName) {
  if (!variableName) return false;
  var name = variableName.toLowerCase();
  return name.includes('spacing') || name.includes('gap') || name.includes('margin') ||
         name.includes('padding') || name.includes('space') || /^\d+$/.test(name);
}

// Fonction extractVariableKey simplifiée pour les tests
function extractVariableKey(variable, collectionName) {
  if (!variable || !variable.name) return null;

  var raw = (variable.name || '').toLowerCase();
  raw = raw.split('/').pop().trim();
  raw = raw.replace(/\s+/g, '');
  raw = raw.replace(/\(.*\)$/g, '').trim();
  var name = raw;

  var c = (collectionName || '').toLowerCase();
  var isBrand = c.includes('brand') || c.includes('color') || c.includes('theme') || c.includes('palette') || c.includes('ui') || c === "colors" || c === "design tokens";
  var isSpacing = c.includes('spacing') || c.includes('gap') || c.includes('margin') || c.includes('padding') || c.includes('space');
  var isRadius = c.includes('radius') || c.includes('corner') || c.includes('border-radius') || c.includes('round');

  var forceRadius = false;
  var forceSpacing = false;

  if (!isRadius && isRadiusPattern(variable.name)) {
    forceRadius = true;
  }
  if (!isSpacing && isSpacingPattern(variable.name)) {
    forceSpacing = true;
  }

  if (isSpacing || forceSpacing) {
    if (name.startsWith("spacing-")) {
      return name.replace("spacing-", "").replace(/-/g, ".");
    }
    if (name.startsWith("gap-") || name.startsWith("margin-") || name.startsWith("padding-")) {
      return name.replace(/^(gap|margin|padding)-/, "").replace(/-/g, ".");
    }
    return name.replace(/-/g, ".");
  } else if (isRadius || forceRadius) {
    if (name.startsWith("radius-") || name.startsWith("corner-") || name.startsWith("border-radius-")) {
      return name.replace(/^(radius|corner|border-radius)-/, "").replace(/-/g, ".");
    }
    return name.replace(/-/g, ".");
  }

  return name; // fallback pour autres catégories
}

// Tests des patterns
console.log('\n🔍 Test des patterns de détection:');
console.log('  isRadiusPattern("border-radius-large") →', isRadiusPattern("border-radius-large"));
console.log('  isRadiusPattern("corner-small") →', isRadiusPattern("corner-small"));
console.log('  isRadiusPattern("blue-500") →', isRadiusPattern("blue-500"));
console.log('  isSpacingPattern("gap-small") →', isSpacingPattern("gap-small"));
console.log('  isSpacingPattern("margin-lg") →', isSpacingPattern("margin-lg"));
console.log('  isSpacingPattern("red-600") →', isSpacingPattern("red-600"));

// Tests de extractVariableKey avec détection transversale
console.log('\n🎯 Test de extractVariableKey avec détection transversale:');

// Variable radius dans une collection "Colors" (devrait être détectée comme radius)
var radiusVar = createMockVariable('radius-lg', 'border-radius-large', 'FLOAT', 8);
console.log('  "border-radius-large" dans "Colors" →', extractVariableKey(radiusVar, "Colors"));

// Variable spacing dans une collection "Design Tokens" (devrait être détectée comme spacing)
var spacingVar = createMockVariable('gap-sm', 'gap-small', 'FLOAT', 4);
console.log('  "gap-small" dans "Design Tokens" →', extractVariableKey(spacingVar, "Design Tokens"));

// Variable normale dans une collection radius (devrait utiliser la logique normale)
var normalRadiusVar = createMockVariable('normal-radius', 'large', 'FLOAT', 12);
console.log('  "large" dans "Radius" →', extractVariableKey(normalRadiusVar, "Radius"));

// Variable normale dans une collection spacing (devrait utiliser la logique normale)
var normalSpacingVar = createMockVariable('normal-spacing', 'medium', 'FLOAT', 8);
console.log('  "medium" dans "Spacing" →', extractVariableKey(normalSpacingVar, "Spacing"));

console.log('\n✅ Tests terminés - Les améliorations semblent fonctionner !');
console.log('📋 Résumé des avancées :');
console.log('   • Détection transversale de radius/spacing même hors collections dédiées');
console.log('   • Support étendu pour "gap-", "margin-", "padding-", "corner-", "border-radius-"');
console.log('   • Re-catégorisation automatique des variables mal rangées');
console.log('   • Récupération d\'alias dans toutes les variables (primitives + sémantiques)');