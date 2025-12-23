// DARK MODE VERIFICATION SCRIPT
// Copy and paste this into the Figma console to verify the fix

(function () {
    console.log("🔍 Starting Dark Mode Verification...\n");

    // 1. Check if semantic tokens are saved
    const semanticData = figma.root.getPluginData("tokenStarter.semantic");
    if (!semanticData) {
        console.error("❌ No semantic tokens found. Please generate tokens first.");
        return;
    }

    const tokens = JSON.parse(semanticData);
    const tokenKeys = Object.keys(tokens);
    console.log(`📊 Found ${tokenKeys.length} semantic tokens\n`);

    // 2. Check for modes structure
    let modesCount = 0;
    let aliasCount = 0;
    let valueCount = 0;
    let issueCount = 0;

    tokenKeys.forEach(key => {
        const token = tokens[key];

        if (token.modes) {
            modesCount++;

            // Check if both light and dark modes exist
            if (!token.modes.light || !token.modes.dark) {
                console.warn(`⚠️ ${key}: Missing light or dark mode`);
                issueCount++;
            } else {
                // Check if values are different
                const lightVal = token.modes.light.resolvedValue;
                const darkVal = token.modes.dark.resolvedValue;

                if (lightVal === darkVal) {
                    console.warn(`⚠️ ${key}: Light and dark values are identical (${lightVal})`);
                    issueCount++;
                }

                // Check for aliases
                if (token.modes.light.aliasRef || token.modes.dark.aliasRef) {
                    aliasCount++;
                }
            }
        } else {
            valueCount++;
        }
    });

    console.log("\n📈 Token Structure Analysis:");
    console.log(`  - Tokens with modes: ${modesCount}`);
    console.log(`  - Tokens with aliases: ${aliasCount}`);
    console.log(`  - Legacy tokens: ${valueCount}`);
    console.log(`  - Issues found: ${issueCount}\n`);

    // 3. Check Figma variables
    const collections = figma.variables.getLocalVariableCollections();
    const semanticCollection = collections.find(c => c.name === "Semantic");

    if (!semanticCollection) {
        console.error("❌ No Semantic collection found in Figma variables");
        return;
    }

    console.log("✅ Semantic collection found");
    console.log(`   Modes: ${semanticCollection.modes.map(m => m.name).join(", ")}\n`);

    // 4. Sample a few tokens to verify
    const sampleKeys = ["bg.canvas", "text.primary", "border.default"];
    console.log("🔬 Sampling key tokens:");

    sampleKeys.forEach(key => {
        if (!tokens[key]) {
            console.log(`  ⚠️ ${key}: Not found in saved tokens`);
            return;
        }

        const token = tokens[key];
        if (token.modes) {
            console.log(`  ✅ ${key}:`);
            console.log(`     Light: ${token.modes.light.resolvedValue}${token.modes.light.aliasRef ? ' (alias)' : ''}`);
            console.log(`     Dark:  ${token.modes.dark.resolvedValue}${token.modes.dark.aliasRef ? ' (alias)' : ''}`);
        } else {
            console.log(`  ⚠️ ${key}: Legacy structure (no modes)`);
        }
    });

    // 5. Final verdict
    console.log("\n" + "=".repeat(50));
    if (modesCount > 0 && issueCount === 0) {
        console.log("✅ VERIFICATION PASSED");
        console.log("   Dark mode tokens are correctly structured!");
    } else if (modesCount === 0) {
        console.log("❌ VERIFICATION FAILED");
        console.log("   No tokens with modes structure found.");
        console.log("   Please regenerate tokens after applying the fix.");
    } else {
        console.log("⚠️ VERIFICATION PARTIAL");
        console.log(`   Found ${issueCount} issues that need attention.`);
    }
    console.log("=".repeat(50));
})();
