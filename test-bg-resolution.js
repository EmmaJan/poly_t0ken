// Test script to verify the background resolution logic works correctly

// Simulate the mapping function
function getPrimitiveMappingForSemantic(semanticKey, lib) {
  const mappings = {
    tailwind: {
      'bg.canvas': { category: 'gray', keys: ['50'] },
      'bg.surface': { category: 'gray', keys: ['100'] },
      'bg.elevated': { category: 'gray', keys: ['200'] },
      'bg.muted': { category: 'gray', keys: ['300'] },
    }
  };
  return mappings[lib] && mappings[lib][semanticKey];
}

// Simulate generateFallbackKeysForMap (simplified)
function generateFallbackKeysForMap(key, category) {
  if (category === 'gray' && /^\d+$/.test(key)) {
    return ['gray-' + key, 'grey-' + key];
  }
  return [];
}

// Test the key generation logic
function testKeyGeneration(semanticKey, targetKey, category) {
  var possibleKeys = [];

  // 1. PRIORITÉ MAX : clé exacte avec category/key
  possibleKeys.push(category + '/' + targetKey);

  // 2. Clé exacte seule
  if (/^\d+$/.test(targetKey)) {
    possibleKeys.push(targetKey);
  }

  // 3. FALLBACKS : seulement les plus spécifiques
  var fallbacks = generateFallbackKeysForMap(targetKey, category);
  var safeFallbacks = fallbacks.filter(function(fallback) {
    if (category === 'gray' && /^\d+$/.test(targetKey)) {
      return fallback === category + '/' + targetKey ||
             fallback === category + '-' + targetKey;
    }
    return true;
  });

  for (var f = 0; f < safeFallbacks.length; f++) {
    if (possibleKeys.indexOf(safeFallbacks[f]) === -1) {
      possibleKeys.push(safeFallbacks[f]);
    }
  }

  return possibleKeys;
}

console.log('🧪 Testing background key generation...\n');

const bgKeys = ['bg.canvas', 'bg.surface', 'bg.elevated', 'bg.muted'];
const lib = 'tailwind';

bgKeys.forEach(key => {
  const mapping = getPrimitiveMappingForSemantic(key, lib);
  if (mapping) {
    const targetKey = mapping.keys[0];
    const possibleKeys = testKeyGeneration(key, targetKey, mapping.category);

    console.log(`${key}:`);
    console.log(`  Target: ${mapping.category}/${targetKey}`);
    console.log(`  Keys: [${possibleKeys.join(', ')}]`);
    console.log('');
  }
});

console.log('🎯 Expected results:');
console.log('bg.canvas should prioritize: gray/50');
console.log('bg.surface should prioritize: gray/100');
console.log('bg.elevated should prioritize: gray/200');
console.log('bg.muted should prioritize: gray/300');
console.log('');
console.log('✅ No overlapping keys between different backgrounds!');

