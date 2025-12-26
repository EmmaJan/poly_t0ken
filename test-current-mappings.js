// Test to check current mappings in the code

// Extract the mapping function from the code
function getPrimitiveMappingForSemantic(semanticKey, lib) {
  // This is copied from the actual code
  const mappings = {
    tailwind: {
      'bg.canvas': { category: 'gray', keys: ['50'], darkKeys: ['950'] },
      'bg.surface': { category: 'gray', keys: ['100'], darkKeys: ['900'] },
      'bg.elevated': { category: 'gray', keys: ['200'], darkKeys: ['800'] },
      'bg.muted': { category: 'gray', keys: ['300'], darkKeys: ['700'] },
      'bg.inverse': { category: 'gray', keys: ['950'], darkKeys: ['50'] },
      // ... other mappings
    }
  };
  return mappings[lib] && mappings[lib][semanticKey];
}

console.log('🧪 Testing current mappings...\n');

const bgKeys = ['bg.canvas', 'bg.surface', 'bg.elevated', 'bg.muted'];
const lib = 'tailwind';

bgKeys.forEach(key => {
  const mapping = getPrimitiveMappingForSemantic(key, lib);
  if (mapping) {
    console.log(`${key}:`);
    console.log(`  category: ${mapping.category}`);
    console.log(`  keys: [${mapping.keys.join(', ')}]`);
    console.log(`  darkKeys: [${mapping.darkKeys ? mapping.darkKeys.join(', ') : 'none'}]`);
    console.log('');
  }
});

console.log('🎯 Expected for light mode:');
console.log('bg.canvas: gray/50');
console.log('bg.surface: gray/100');
console.log('bg.elevated: gray/200');
console.log('bg.muted: gray/300');

