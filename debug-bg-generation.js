// Debug script to check what values are generated for backgrounds
// This simulates the mapSemanticTokens function for backgrounds only

// Mock palette data (simulating gray scale)
const mockPalettes = {
  gray: {
    '50': '#FAFAFA',
    '100': '#F5F5F5',
    '200': '#EEEEEE',
    '300': '#E0E0E0',
    '400': '#BDBDBD',
    '500': '#9E9E9E',
    '600': '#757575',
    '700': '#616161',
    '800': '#424242',
    '900': '#212121',
    '950': '#0D0D0D'
  }
};

// Mock preset
const mockPreset = { name: 'tailwind' };

// Simplified version of getStandardMapping
function getStandardMapping(key) {
  if (key === 'bg.canvas') return { category: 'gray', light: '50', dark: '950', type: 'COLOR' };
  if (key === 'bg.surface') return { category: 'gray', light: '100', dark: '900', type: 'COLOR' };
  if (key === 'bg.elevated') return { category: 'gray', light: '200', dark: '800', type: 'COLOR' };
  if (key === 'bg.muted') return { category: 'gray', light: '300', dark: '700', type: 'COLOR' };
  if (key === 'bg.inverse') return { category: 'gray', light: '950', dark: '50', type: 'COLOR' };
  return null;
}

// Simplified version of the collision resolution logic
function resolveSemanticValue(semKey, mode) {
  const mapDef = getStandardMapping(semKey);
  if (!mapDef) return null;

  const category = mapDef.category;
  const preferredRef = mode === 'dark' ? mapDef.dark : mapDef.light;
  const paletteCat = mockPalettes[category];

  if (!paletteCat) return null;

  // Get available keys
  const candidates = Object.keys(paletteCat).sort((a, b) => parseInt(a) - parseInt(b));

  // Find index of preferred
  let idx = candidates.indexOf(preferredRef);
  if (idx === -1) idx = 0;

  // For this test, assume no collisions (they should be resolved)
  const finalRef = preferredRef;

  return {
    key: semKey,
    category: category,
    finalRef: finalRef,
    resolvedValue: paletteCat[finalRef],
    aliasInfo: { category: category, key: finalRef }
  };
}

// Test backgrounds for both modes
console.log('🧪 Testing background resolution...\n');

const bgKeys = ['bg.canvas', 'bg.surface', 'bg.elevated', 'bg.muted', 'bg.inverse'];
const modes = ['light', 'dark'];

modes.forEach(mode => {
  console.log(`📊 ${mode.toUpperCase()} MODE:`);
  bgKeys.forEach(key => {
    const result = resolveSemanticValue(key, mode);
    if (result) {
      console.log(`  ${key}: ${result.category}.${result.finalRef} -> ${result.resolvedValue}`);
    }
  });
  console.log('');
});

console.log('🎯 Expected results:');
console.log('Light: canvas=50, surface=100, elevated=200, muted=300, inverse=950');
console.log('Dark:  canvas=950, surface=900, elevated=800, muted=700, inverse=50');