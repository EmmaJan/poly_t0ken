// Test de la fonction tryResolveSemanticAlias

console.log("🧪 Test des alias sémantiques");

// Mock des variables Figma pour le test
const mockVariables = {
  // Grayscale
  gray50: { id: 'gray50', name: 'gray-50' },
  gray100: { id: 'gray100', name: 'gray-100' },
  gray200: { id: 'gray200', name: 'gray-200' },
  gray700: { id: 'gray700', name: 'gray-700' },
  gray950: { id: 'gray950', name: 'gray-950' },

  // Brand
  primary600: { id: 'primary600', name: 'primary/600' },
  primary700: { id: 'primary700', name: 'primary/700' },
  primary800: { id: 'primary800', name: 'primary/800' },

  // System
  success: { id: 'success', name: 'success' },

  // Spacing
  spacing8: { id: 'spacing8', name: 'spacing-8' },
  spacing16: { id: 'spacing16', name: 'spacing-16' },

  // Radius
  radius4: { id: 'radius4', name: 'radius-4' },
  radius8: { id: 'radius8', name: 'radius-8' }
};

// Mock des collections
const mockCollections = [
  {
    name: 'Grayscale',
    variableIds: ['gray50', 'gray100', 'gray200', 'gray700', 'gray950']
  },
  {
    name: 'Brand Colors',
    variableIds: ['primary600', 'primary700', 'primary800']
  },
  {
    name: 'System Colors',
    variableIds: ['success']
  },
  {
    name: 'Spacing',
    variableIds: ['spacing8', 'spacing16']
  },
  {
    name: 'Radius',
    variableIds: ['radius4', 'radius8']
  }
];

// Mock de figma.variables
global.figma = {
  variables: {
    getLocalVariableCollections: () => mockCollections,
    getVariableById: (id) => mockVariables[id]
  }
};

// Test de extractVariableKey
console.log("\n🔍 Test extractVariableKey:");

const testCases = [
  { variable: mockVariables.gray50, collectionName: 'Grayscale', expected: '50' },
  { variable: mockVariables.primary600, collectionName: 'Brand Colors', expected: '600' },
  { variable: mockVariables.success, collectionName: 'System Colors', expected: 'success' },
  { variable: mockVariables.spacing8, collectionName: 'Spacing', expected: '8' },
  { variable: mockVariables.radius4, collectionName: 'Radius', expected: '4' }
];

testCases.forEach(testCase => {
  const result = extractVariableKey(testCase.variable, testCase.collectionName);
  const success = result === testCase.expected;
  console.log(`  ${testCase.collectionName} "${testCase.variable.name}" -> "${result}" (${success ? '✅' : '❌'} expected: "${testCase.expected}")`);
});

// Test de tryResolveSemanticAlias
console.log("\n🔗 Test tryResolveSemanticAlias:");

const aliasTestCases = [
  { semanticKey: 'bg.canvas', expected: mockVariables.gray50 },
  { semanticKey: 'text.primary', expected: mockVariables.gray950 },
  { semanticKey: 'action.primary.default', expected: mockVariables.primary600 },
  { semanticKey: 'status.success', expected: mockVariables.success },
  { semanticKey: 'space.sm', expected: mockVariables.spacing8 },
  { semanticKey: 'radius.sm', expected: mockVariables.radius4 }
];

aliasTestCases.forEach(testCase => {
  const result = tryResolveSemanticAlias(testCase.semanticKey, {});
  const success = result && result.id === testCase.expected.id;
  console.log(`  ${testCase.semanticKey} -> ${result ? result.name : 'null'} (${success ? '✅' : '❌'} expected: ${testCase.expected.name})`);
});

console.log("\n🏁 Tests terminés!");

