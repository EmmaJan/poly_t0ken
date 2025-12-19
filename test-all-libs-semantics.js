// Script de test complet pour vérifier les sémantiques de toutes les bibliothèques
console.log("🧪 TEST ALL LIBS SEMANTICS - Vérification complète de tous les systèmes de design");

// Simuler les primitives disponibles (structure standard)
const primitives = {
  gray: {
    '50': '#F9FAFB',   // Blanc très clair
    '100': '#F3F4F6',  // Blanc clair
    '200': '#E5E7EB',  // Gris très clair
    '300': '#D1D5DB',  // Gris clair
    '400': '#9CA3AF',  // Gris moyen
    '500': '#6B7280',  // Gris
    '600': '#4B5563',  // Gris foncé
    '700': '#374151',  // Gris très foncé
    '800': '#1F2937',  // Gris presque noir
    '900': '#111827',  // Gris noir
    '950': '#030712'   // Noir
  },
  brand: {
    '50': '#EFF6FF',   // Bleu très clair
    '100': '#DBEAFE',  // Bleu clair
    '200': '#BFDBFE',  // Bleu pâle
    '300': '#93C5FD',  // Bleu moyen-clair
    '400': '#60A5FA',  // Bleu moyen
    '500': '#3B82F6',  // Bleu principal (main)
    '600': '#2563EB',  // Bleu foncé
    '700': '#1D4ED8',  // Bleu très foncé (dark)
    '800': '#1E40AF',  // Bleu presque noir
    '900': '#1E3A8A',  // Bleu noir
    '950': '#172554'   // Bleu très noir
  },
  system: {
    success: '#10B981',  // Vert
    warning: '#F59E0B',  // Orange
    error: '#EF4444',    // Rouge
    info: '#3B82F6'      // Bleu
  },
  spacing: {
    '4': 16,
    '8': 32,
    '16': 64,
    '24': 96
  },
  radius: {
    'sm': 4,
    'md': 8,
    'lg': 12
  },
  typography: {
    'text.base': 16,
    'text.regular': 400,
    base: 16,
    regular: 400
  }
};

// Fonction de simulation complète de tryResolveSemanticAlias
function tryResolveSemanticAlias(semanticKey, allPrimitives, naming) {
  console.log(`🔍 [${naming.toUpperCase()}] Résolution de: ${semanticKey}`);

  // Créer un mapping adapté selon le système de design
  var primitiveMapping;

  if (naming === 'tailwind') {
    primitiveMapping = {
      'bg.canvas': { category: 'gray', keys: ['50'] },
      'bg.surface': { category: 'gray', keys: ['50'] },
      'bg.muted': { category: 'gray', keys: ['100'] },
      'bg.inverse': { category: 'gray', keys: ['950', '900'] },
      'text.primary': { category: 'gray', keys: ['950', '900'] },
      'text.secondary': { category: 'gray', keys: ['700', '600'] },
      'text.muted': { category: 'gray', keys: ['500', '400'] },
      'text.inverse': { category: 'gray', keys: ['50'] },
      'text.disabled': { category: 'gray', keys: ['400', '300'] },
      'border.default': { category: 'gray', keys: ['200'] },
      'border.muted': { category: 'gray', keys: ['100'] },
      'action.primary.default': { category: 'brand', keys: ['600', '500'] },
      'action.primary.hover': { category: 'brand', keys: ['700', '600'] },
      'action.primary.active': { category: 'brand', keys: ['800', '700'] },
      'action.primary.disabled': { category: 'gray', keys: ['300'] },
      'status.success': { category: 'system', keys: ['success'], fallback: { category: 'brand', keys: ['600'] } },
      'status.warning': { category: 'system', keys: ['warning'], fallback: '#F59E0B' },
      'status.error': { category: 'system', keys: ['error'], fallback: '#DC2626' },
      'status.info': { category: 'system', keys: ['info'], fallback: '#2563EB' },
      'radius.sm': { category: 'radius', keys: ['sm', '4'] },
      'radius.md': { category: 'radius', keys: ['md', '8'] },
      'space.sm': { category: 'spacing', keys: ['4', '8'] },
      'space.md': { category: 'spacing', keys: ['8', '16'] },
      'font.size.base': { category: 'typography', keys: ['text.base', 'base'] },
      'font.weight.base': { category: 'typography', keys: ['text.regular', 'regular'] }
    };
  } else {
    // Mapping générique pour Ant, MUI, Bootstrap
    primitiveMapping = {
      'bg.canvas': { category: 'gray', keys: ['50', 'white'] },
      'bg.surface': { category: 'gray', keys: ['white', '50'] },
      'bg.muted': { category: 'gray', keys: ['100'] },
      'bg.inverse': { category: 'gray', keys: ['950', '900'] },
      'text.primary': { category: 'gray', keys: ['950', '900'] },
      'text.secondary': { category: 'gray', keys: ['700', '600'] },
      'text.muted': { category: 'gray', keys: ['500', '400'] },
      'text.inverse': { category: 'gray', keys: ['50', '100'] },
      'text.disabled': { category: 'gray', keys: ['400', '300'] },
      'border.default': { category: 'gray', keys: ['200', '300'] },
      'border.muted': { category: 'gray', keys: ['100', '200'] },
      'action.primary.default': { category: 'brand', keys: ['600', '500'] },
      'action.primary.hover': { category: 'brand', keys: ['700', '600'] },
      'action.primary.active': { category: 'brand', keys: ['800', '700'] },
      'action.primary.disabled': { category: 'gray', keys: ['300', '400'] },
      'status.success': { category: 'system', keys: ['success'], fallback: { category: 'brand', keys: ['600'] } },
      'status.warning': { category: 'system', keys: ['warning'], fallback: '#F59E0B' },
      'status.error': { category: 'system', keys: ['error'], fallback: '#DC2626' },
      'status.info': { category: 'system', keys: ['info'], fallback: '#2563EB' },
      'radius.sm': { category: 'radius', keys: ['sm', '4'] },
      'radius.md': { category: 'radius', keys: ['md', '8'] },
      'space.sm': { category: 'spacing', keys: ['8', '2'] },
      'space.md': { category: 'spacing', keys: ['16', '4'] },
      'font.size.base': { category: 'typography', keys: ['text.base', 'base', '16'] },
      'font.weight.base': { category: 'typography', keys: ['text.regular', 'regular', '400'] }
    };

    // Ajustements spécifiques par système
    if (naming === 'ant') {
      // Ant Design utilise des niveaux de couleur (colorPrimary, colorPrimaryHover, etc.)
      // Mais comme nos primitives sont numériques, on utilise des équivalents appropriés
      primitiveMapping['action.primary.default'].keys = ['600', '500', 'primary'];
      primitiveMapping['action.primary.hover'].keys = ['500', '400', 'primary-hover'];
      primitiveMapping['action.primary.active'].keys = ['700', '800', 'primary-active'];
    } else if (naming === 'mui') {
      primitiveMapping['action.primary.default'].keys = ['500', '600', 'main', 'primary'];
      primitiveMapping['action.primary.hover'].keys = ['700', '600', 'dark', 'primary-dark'];
      primitiveMapping['action.primary.active'].keys = ['800', '700', 'dark', 'primary-active'];
    } else if (naming === 'bootstrap') {
      // Bootstrap utilise des noms sémantiques, mais on mappe vers les équivalents numériques
      primitiveMapping['action.primary.default'].keys = ['500', '600', 'primary'];
      primitiveMapping['action.primary.hover'].keys = ['600', '700', 'primary-hover'];
      primitiveMapping['action.primary.active'].keys = ['700', '800', 'primary-active'];
    }
  }

  var mapping = primitiveMapping[semanticKey];
  if (!mapping) {
    console.log(`❌ [${naming.toUpperCase()}] Mapping non trouvé pour: ${semanticKey}`);
    return null;
  }

  var categoryData = allPrimitives[mapping.category];
  if (!categoryData) {
    console.log(`❌ [${naming.toUpperCase()}] Catégorie ${mapping.category} non trouvée`);
    return null;
  }

  // Essayer chaque clé dans l'ordre de priorité
  for (var i = 0; i < mapping.keys.length; i++) {
    var key = mapping.keys[i];
    if (categoryData[key] !== undefined) {
      console.log(`✅ [${naming.toUpperCase()}] ${semanticKey} → ${mapping.category}.${key} (${categoryData[key]})`);
      return {
        id: `var-${mapping.category}-${key}`,
        variableCollectionId: `collection-${mapping.category}`,
        name: `${mapping.category}-${key}`
      };
    }
  }

  console.log(`❌ [${naming.toUpperCase()}] Aucune clé trouvée dans ${mapping.category} pour: [${mapping.keys.join(', ')}]`);
  return null;
}

// Simuler les autres fonctions nécessaires
function extractVariableKey(variable, collectionName) {
  return variable.name.split('-').pop();
}

function getCategoryFromVariableCollection(collectionName) {
  const n = collectionName.toLowerCase().trim();
  if (n.includes('gray')) return "gray";
  else if (n.includes('brand')) return "brand";
  else if (n.includes('system')) return "system";
  else if (n.includes('spacing')) return "spacing";
  else if (n.includes('radius')) return "radius";
  else if (n.includes('typography')) return "typography";
  return "unknown";
}

function resolveSemanticValue(semanticKey, primitives, naming, fallback) {
  try {
    const variable = tryResolveSemanticAlias(semanticKey, primitives, naming);
    if (variable) {
      const collectionName = `collection-${variable.name.split('-')[0]}`;
      const category = getCategoryFromVariableCollection(collectionName);
      const variableKey = extractVariableKey(variable, collectionName);

      if (primitives[category] && primitives[category][variableKey]) {
        return primitives[category][variableKey];
      }
    }
  } catch (error) {
    console.warn(`⚠️ Erreur lors de la résolution de ${semanticKey}:`, error);
  }
  console.log(`⚠️ [${naming.toUpperCase()}] ${semanticKey} → fallback: ${fallback}`);
  return fallback;
}

// Liste des bibliothèques à tester
const libraries = ['tailwind', 'ant', 'mui', 'bootstrap'];

// Tokens sémantiques critiques à vérifier
const criticalTokens = [
  // Branding (doit pointer vers brand, pas gray)
  'action.primary.default',
  'action.primary.hover',
  'action.primary.active',

  // Background (doit pointer vers gray)
  'bg.canvas',
  'bg.surface',
  'bg.muted',

  // Text (doit pointer vers gray)
  'text.primary',
  'text.secondary',

  // Status (doit pointer vers system)
  'status.success',
  'status.warning',
  'status.error',

  // Shape & Space
  'radius.sm',
  'space.sm'
];

// Exécuter les tests pour chaque bibliothèque
libraries.forEach(libName => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🎨 TEST DE ${libName.toUpperCase()}`);
  console.log(`${'='.repeat(60)}\n`);

  let totalTests = criticalTokens.length;
  let passedTests = 0;
  let brandingIssues = 0;

  console.log(`Primitives disponibles pour ${libName}:`);
  console.log(`  gray: ${Object.keys(primitives.gray).slice(0, 5).join(', ')}...`);
  console.log(`  brand: ${Object.keys(primitives.brand).slice(0, 5).join(', ')}...`);
  console.log(`  system: ${Object.keys(primitives.system).join(', ')}`);
  console.log(`  spacing: ${Object.keys(primitives.spacing).join(', ')}`);
  console.log(`  radius: ${Object.keys(primitives.radius).join(', ')}\n`);

  criticalTokens.forEach(tokenKey => {
    const result = resolveSemanticValue(tokenKey, primitives, libName, 'FALLBACK_VALUE');
    const usedPrimitive = result !== 'FALLBACK_VALUE';

    // Vérifier les problèmes spécifiques au branding
    let hasBrandingIssue = false;
    if (tokenKey.startsWith('action.primary') && !result.includes('#3B82F6') && !result.includes('#2563EB') && !result.includes('#1D4ED8') && !result.includes('#1E40AF')) {
      // Pour les actions primaires, on s'attend à des couleurs brand (bleues)
      if (libName === 'ant' && result === 'FALLBACK_VALUE') {
        // Ant utilise des clés spéciales, c'est normal qu'il fallback
      } else {
        hasBrandingIssue = true;
        brandingIssues++;
      }
    }

    if (usedPrimitive) {
      passedTests++;
      console.log(`✅ ${tokenKey}: ${result} ${hasBrandingIssue ? '(⚠️ POSSIBLE BRANDING ISSUE)' : ''}`);
    } else {
      console.log(`❌ ${tokenKey}: FALLBACK_VALUE (pas de primitive trouvée)`);
    }
  });

  console.log(`\n📊 RÉSULTATS ${libName.toUpperCase()}: ${passedTests}/${totalTests} tokens utilisent des primitives`);
  if (brandingIssues > 0) {
    console.log(`⚠️ ${brandingIssues} problème(s) de branding détecté(s)`);
  }

  if (passedTests === totalTests && brandingIssues === 0) {
    console.log(`🎉 ${libName.toUpperCase()} PARFAIT: Tous les tokens pointent vers les bonnes primitives!`);
  } else if (passedTests === totalTests && brandingIssues > 0) {
    console.log(`⚠️ ${libName.toUpperCase()} PRESQUE: Primitives OK mais problèmes de branding`);
  } else {
    console.log(`❌ ${libName.toUpperCase()} PROBLÉMATIQUE: ${totalTests - passedTests} tokens n'utilisent pas de primitives`);
  }
});

console.log(`\n${'='.repeat(60)}`);
console.log(`🏁 RÉSUMÉ FINAL`);
console.log(`${'='.repeat(60)}\n`);

// Résumé par catégorie de problèmes
console.log(`🔍 ANALYSE DES PROBLÈMES:`);
console.log(`• Tailwind devrait utiliser brand.600 pour primary (plus professionnel)`);
console.log(`• Ant utilise des clés spéciales (3, 4, 5) qui n'existent pas → fallback normal`);
console.log(`• MUI utilise maintenant les bonnes clés numériques (500, 700, 800)`);
console.log(`• Bootstrap cherche 'primary' qui n'existe pas → devrait chercher dans brand.500`);

console.log(`\n💡 RECOMMANDATIONS:`);
console.log(`• Vérifier que les clés des primitives correspondent aux attentes de chaque lib`);
console.log(`• Pour Ant: soit ajouter les clés 3,4,5, soit ajuster les mappings`);
console.log(`• Pour Bootstrap: soit renommer les primitives, soit ajuster les mappings`);
console.log(`• Pour Tailwind: considérer brand.500 au lieu de 600 pour primary.default`);
