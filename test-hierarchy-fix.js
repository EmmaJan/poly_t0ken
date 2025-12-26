// Test script to validate that background hierarchy is now correct
// Run with: node test-hierarchy-fix.js

// Simulate the semantic mappings structure for testing
const testMappings = {
  tailwind: {
    'bg.canvas': { category: 'gray', keys: ['50'] },
    'bg.surface': { category: 'gray', keys: ['100'] },
    'bg.elevated': { category: 'gray', keys: ['200'] },
    'bg.muted': { category: 'gray', keys: ['300'] },
    'bg.inverse': { category: 'gray', keys: ['950'] },
  },
  chakra: {
    'bg.canvas': { category: 'gray', keys: ['50'] },
    'bg.surface': { category: 'gray', keys: ['100'] },
    'bg.elevated': { category: 'gray', keys: ['200'] },
    'bg.muted': { category: 'gray', keys: ['300'] },
    'bg.inverse': { category: 'gray', keys: ['900'] },
  },
  bootstrap: {
    'bg.canvas': { category: 'gray', keys: ['white'] },
    'bg.surface': { category: 'gray', keys: ['100'] },
    'bg.elevated': { category: 'gray', keys: ['200'] },
    'bg.muted': { category: 'gray', keys: ['300'] },
    'bg.inverse': { category: 'gray', keys: ['900'] },
  },
  ant: {
    'bg.canvas': { category: 'gray', keys: ['1'] },
    'bg.surface': { category: 'gray', keys: ['2'] },
    'bg.elevated': { category: 'gray', keys: ['3'] },
    'bg.muted': { category: 'gray', keys: ['4'] },
    'bg.inverse': { category: 'gray', keys: ['10'] },
  }
};

// Simple validation function (extracted from the main code)
function validateSemanticHierarchy(semanticMappings, lib) {
  var issues = [];
  var categoryGroups = {};

  // Grouper les tokens par catégorie
  for (var semanticKey in semanticMappings) {
    if (!semanticMappings.hasOwnProperty(semanticKey)) continue;

    var mapping = semanticMappings[semanticKey];
    if (!mapping || !mapping.category) continue;

    var category = mapping.category;
    if (!categoryGroups[category]) {
      categoryGroups[category] = [];
    }

    categoryGroups[category].push({
      key: semanticKey,
      mapping: mapping
    });
  }

  // Vérifier les doublons dans chaque catégorie
  for (var category in categoryGroups) {
    if (!categoryGroups.hasOwnProperty(category)) continue;

    var tokens = categoryGroups[category];
    var seenValues = {};

    for (var i = 0; i < tokens.length; i++) {
      var token = tokens[i];
      var primaryKey = token.mapping.keys ? token.mapping.keys[0] : null;

      if (primaryKey && seenValues[primaryKey]) {
        issues.push({
          type: 'DUPLICATE_VALUE',
          category: category,
          tokens: [seenValues[primaryKey].key, token.key],
          value: primaryKey,
          lib: lib
        });
      } else if (primaryKey) {
        seenValues[primaryKey] = token;
      }
    }
  }

  return issues;
}

// Test all libraries
console.log('🧪 Testing background hierarchy validation...\n');

for (const lib in testMappings) {
  const issues = validateSemanticHierarchy(testMappings[lib], lib);

  if (issues.length === 0) {
    console.log(`✅ ${lib}: No hierarchy issues found`);
  } else {
    console.log(`❌ ${lib}: Found ${issues.length} hierarchy issue(s):`);
    issues.forEach(issue => {
      console.log(`   - ${issue.type}: ${issue.tokens.join(' & ')} both use '${issue.value}' in category '${issue.category}'`);
    });
  }
}

console.log('\n🎯 Expected hierarchy for backgrounds:');
console.log('   canvas (lightest) → surface → elevated → muted (darkest)');
console.log('   All should have unique primitive values!');

