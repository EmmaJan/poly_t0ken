// Test script to verify background mappings are correct
// This tests getPrimitiveMappingForSemantic for backgrounds

// Mock the function (simplified version)
function getPrimitiveMappingForSemantic(semanticKey, lib) {
  // Simplified mappings for testing
  const mappings = {
    tailwind: {
      'bg.canvas': { category: 'gray', keys: ['50'], darkKeys: ['950'] },
      'bg.surface': { category: 'gray', keys: ['100'], darkKeys: ['900'] },
      'bg.elevated': { category: 'gray', keys: ['200'], darkKeys: ['800'] },
      'bg.muted': { category: 'gray', keys: ['300'], darkKeys: ['700'] },
      'bg.inverse': { category: 'gray', keys: ['950'], darkKeys: ['50'] },
    }
  };

  return mappings[lib] && mappings[lib][semanticKey];
}

console.log('🧪 Testing background mappings...\n');

const bgKeys = ['bg.canvas', 'bg.surface', 'bg.elevated', 'bg.muted', 'bg.inverse'];
const modes = ['light', 'dark'];

modes.forEach(mode => {
  console.log(`📊 ${mode.toUpperCase()} MODE:`);
  bgKeys.forEach(key => {
    const mapping = getPrimitiveMappingForSemantic(key, 'tailwind');
    if (mapping) {
      const targetKeys = (mode === 'dark' && mapping.darkKeys) ? mapping.darkKeys : mapping.keys;
      console.log(`  ${key}: ${mapping.category} -> [${targetKeys.join(', ')}]`);
    }
  });
  console.log('');
});

console.log('🎯 Expected unique values:');
console.log('Light: 50, 100, 200, 300, 950 (all different)');
console.log('Dark:  950, 900, 800, 700, 50 (all different)');

