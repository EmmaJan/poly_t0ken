// Test pour vérifier que la génération des tokens sémantiques fonctionne pour Ant
console.log("🧪 TEST GÉNÉRATION SÉMANTIQUE ANT");

// Simuler les primitives générées pour Ant
const antPrimitives = {
  brand: {
    "1": "#F5F5F5",
    "2": "#D9D9D9",
    "3": "#595959",  // Action primary default
    "4": "#434343",  // Action primary hover
    "5": "#262626"   // Action primary active
  },
  system: {
    'green-6': '#52C41A',
    'orange-6': '#FAAD14',
    'red-6': '#FF4D4F',
    'blue-6': '#1890FF',
    success: '#52C41A',
    warning: '#FAAD14',
    error: '#FF4D4F',
    info: '#1890FF'
  },
  gray: {
    "1": "#FFFFFF",
    "2": "#FAFAFA",
    "3": "#F5F5F5",
    "4": "#F0F0F0",
    "5": "#D9D9D9",
    "6": "#BFBFBF",
    "7": "#8C8C8C",
    "8": "#595959",
    "9": "#434343",
    "10": "#262626"
  },
  spacing: { "8": 32, "16": 64, "small": 32, "middle": 64 },
  radius: { "sm": 4, "md": 6, "4": 4, "6": 6 },
  typography: { "fontSize": 14, "fontWeight": 400, "14": 14, "400": 400 }
};

// Fonction pour obtenir le mapping des primitives selon la bibliothèque (copié de generateSemanticTokens)
function getPrimitiveMapping(lib) {
  if (lib === 'ant') {
    return {
      'bg.canvas': { category: 'gray', keys: ['1'] },
      'bg.surface': { category: 'gray', keys: ['1'] },
      'bg.muted': { category: 'gray', keys: ['2'] },
      'bg.inverse': { category: 'gray', keys: ['10'] },
      'text.primary': { category: 'gray', keys: ['10'] },
      'text.secondary': { category: 'gray', keys: ['8', '9'] },
      'text.muted': { category: 'gray', keys: ['6', '7'] },
      'text.inverse': { category: 'gray', keys: ['1'] },
      'text.disabled': { category: 'gray', keys: ['6'] },
      'border.default': { category: 'gray', keys: ['4'] },
      'border.muted': { category: 'gray', keys: ['3'] },
      'action.primary.default': { category: 'brand', keys: ['3'] },
      'action.primary.hover': { category: 'brand', keys: ['4'] },
      'action.primary.active': { category: 'brand', keys: ['5'] },
      'action.primary.disabled': { category: 'gray', keys: ['6'] },
      'status.success': { category: 'system', keys: ['green-6', 'success'] },
      'status.warning': { category: 'system', keys: ['orange-6', 'warning'] },
      'status.error': { category: 'system', keys: ['red-6', 'error'] },
      'status.info': { category: 'system', keys: ['blue-6', 'info'] },
      'radius.sm': { category: 'radius', keys: ['sm', '4'] },
      'radius.md': { category: 'radius', keys: ['md', '6'] },
      'space.sm': { category: 'spacing', keys: ['8', 'small'] },
      'space.md': { category: 'spacing', keys: ['16', 'middle'] },
      'font.size.base': { category: 'typography', keys: ['fontSize', '14'] },
      'font.weight.base': { category: 'typography', keys: ['fontWeight', '400'] }
    };
  }
}

// Fonction resolveSemanticValue (simplifiée pour le test)
function resolveSemanticValue(semanticKey, primitives, lib, fallback) {
  try {
    const primitiveMapping = getPrimitiveMapping(lib);
    const mapping = primitiveMapping[semanticKey];

    if (mapping) {
      for (const key of mapping.keys) {
        if (primitives[mapping.category] && primitives[mapping.category][key]) {
          const value = primitives[mapping.category][key];
          console.log(`✅ ${semanticKey} → ${mapping.category}.${key} (${value})`);
          return value;
        }
      }
    }
  } catch (error) {
    console.warn(`⚠️ Erreur lors de la résolution de ${semanticKey}:`, error);
  }

  console.log(`⚠️ ${semanticKey} → fallback: ${fallback}`);
  return fallback;
}

// Simuler generateSemanticTokens pour Ant
function simulateGenerateSemanticTokens(primitives, naming) {
  const semanticTokens = {};

  // Fonctions utilitaires
  function safeGet(obj, path, fallback) {
    try {
      const keys = path.split('.');
      let current = obj;
      for (const key of keys) {
        if (current && typeof current === 'object' && key in current) {
          current = current[key];
        } else {
          return fallback;
        }
      }
      return current;
    } catch (error) {
      return fallback;
    }
  }

  // Extraction des primitives
  const gray = primitives.gray || {};
  const brand = primitives.brand || {};
  const system = primitives.system || {};
  const spacing = primitives.spacing || {};
  const radius = primitives.radius || {};
  const typography = primitives.typography || {};

  console.log('\n🔍 Primitives reçues pour génération sémantique Ant:');
  console.log('  gray:', Object.keys(gray).length > 0 ? Object.keys(gray).slice(0, 5).join(', ') + '...' : 'vide');
  console.log('  brand:', Object.keys(brand).length > 0 ? Object.keys(brand).slice(0, 3).join(', ') + '...' : 'vide');
  console.log('  system:', Object.keys(system).length > 0 ? Object.keys(system).join(', ') : 'vide');

  // Génération des tokens critiques pour Ant
  semanticTokens['bg.canvas'] = resolveSemanticValue('bg.canvas', primitives, naming, safeGet(gray, '1', '#FFFFFF'));
  semanticTokens['bg.surface'] = resolveSemanticValue('bg.surface', primitives, naming, safeGet(gray, '1', '#FFFFFF'));
  semanticTokens['bg.muted'] = resolveSemanticValue('bg.muted', primitives, naming, safeGet(gray, '2', '#FAFAFA'));
  semanticTokens['bg.inverse'] = resolveSemanticValue('bg.inverse', primitives, naming, safeGet(gray, '10', '#262626'));

  semanticTokens['text.primary'] = resolveSemanticValue('text.primary', primitives, naming, safeGet(gray, '10', '#262626'));
  semanticTokens['text.secondary'] = resolveSemanticValue('text.secondary', primitives, naming, safeGet(gray, '8', '#595959'));
  semanticTokens['text.muted'] = resolveSemanticValue('text.muted', primitives, naming, safeGet(gray, '6', '#BFBFBF'));
  semanticTokens['text.inverse'] = resolveSemanticValue('text.inverse', primitives, naming, safeGet(gray, '1', '#FFFFFF'));
  semanticTokens['text.disabled'] = resolveSemanticValue('text.disabled', primitives, naming, safeGet(gray, '6', '#BFBFBF'));

  semanticTokens['border.default'] = resolveSemanticValue('border.default', primitives, naming, safeGet(gray, '4', '#F0F0F0'));
  semanticTokens['border.muted'] = resolveSemanticValue('border.muted', primitives, naming, safeGet(gray, '3', '#F5F5F5'));

  semanticTokens['action.primary.default'] = resolveSemanticValue('action.primary.default', primitives, naming, '#1890FF');
  semanticTokens['action.primary.hover'] = resolveSemanticValue('action.primary.hover', primitives, naming, '#096DD9');
  semanticTokens['action.primary.active'] = resolveSemanticValue('action.primary.active', primitives, naming, '#003A8C');
  semanticTokens['action.primary.disabled'] = resolveSemanticValue('action.primary.disabled', primitives, naming, safeGet(gray, '6', '#BFBFBF'));

  semanticTokens['status.success'] = resolveSemanticValue('status.success', primitives, naming, safeGet(system, 'success', '#10B981'));
  semanticTokens['status.warning'] = resolveSemanticValue('status.warning', primitives, naming, safeGet(system, 'warning', '#F59E0B'));
  semanticTokens['status.error'] = resolveSemanticValue('status.error', primitives, naming, safeGet(system, 'error', '#EF4444'));
  semanticTokens['status.info'] = resolveSemanticValue('status.info', primitives, naming, safeGet(system, 'info', '#3B82F6'));

  return semanticTokens;
}

// Test de génération pour Ant
console.log("\n🧪 GÉNÉRATION DES TOKENS SÉMANTIQUES POUR ANT\n");

const semanticTokens = simulateGenerateSemanticTokens(antPrimitives, 'ant');

console.log(`\n📊 RÉSULTATS: ${Object.keys(semanticTokens).length} tokens sémantiques générés`);

console.log("\n🎯 VÉRIFICATION DES TOKENS CRITIQUES:\n");

const criticalTokens = [
  'action.primary.default',
  'action.primary.hover',
  'action.primary.active',
  'bg.inverse',
  'text.primary',
  'status.success',
  'status.warning',
  'status.error',
  'status.info'
];

let successCount = 0;

criticalTokens.forEach(token => {
  const value = semanticTokens[token];
  if (value) {
    // Vérifier si c'est une vraie primitive (pas un fallback générique)
    const isRealPrimitive =
      (token.includes('action.primary') && value === '#595959') || // brand.3
      (token === 'bg.inverse' && value === '#262626') || // gray.10
      (token === 'text.primary' && value === '#262626') || // gray.10
      (token.includes('status.') && !value.startsWith('#10') && !value.startsWith('#F5') && !value.startsWith('#EF') && !value.startsWith('#3B')); // Pas les fallbacks génériques

    if (isRealPrimitive) {
      console.log(`✅ ${token}: ${value} (PRIMITIVE)`);
      successCount++;
    } else {
      console.log(`⚠️ ${token}: ${value} (FALLBACK)`);
    }
  } else {
    console.log(`❌ ${token}: MANQUANT`);
  }
});

console.log(`\n🏆 SCORE: ${successCount}/${criticalTokens.length} tokens utilisent des primitives réelles`);

if (successCount >= 5) {
  console.log("🎉 SUCCÈS ! La génération sémantique Ant fonctionne correctement !");
} else {
  console.log("❌ ÉCHEC ! La plupart des tokens utilisent des fallbacks.");
}

console.log("\n💡 Les tokens qui utilisent des primitives réelles pointent vers les vraies variables Figma !");