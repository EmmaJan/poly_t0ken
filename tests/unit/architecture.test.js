
const fs = require('fs');
const path = require('path');

describe('Architecture Standards', () => {
    const codeJsPath = path.resolve(__dirname, '../../code.js');
    let codeContent = '';

    beforeAll(() => {
        codeContent = fs.readFileSync(codeJsPath, 'utf8');
    });

    test('Should only have ONE definition of figma.ui.onmessage', () => {
        const matches = codeContent.match(/figma\.ui\.onmessage\s*=/g);
        expect(matches).not.toBeNull();
        expect(matches.length).toBe(1);
    });

    test('Should NOT have direct figma.ui.postMessage calls (use postToUI)', () => {
        // We look for figma.ui.postMessage, but we must exclude the definition inside postToUI function.
        // The definition looks like: figma.ui.postMessage(message);

        // Strategy: 
        // 1. Count all occurrences
        // 2. Count occurrences inside postToUI definition (relaxed regex)
        // 3. Difference should be 0

        const allMatches = codeContent.match(/figma\.ui\.postMessage\(/g) || [];

        // We expect exactly 1 occurrence (the one in postToUI function)
        if (allMatches.length > 1) {
            // Find context for debugging
            const lines = codeContent.split('\n');
            lines.forEach((line, idx) => {
                if (line.includes('figma.ui.postMessage(') && !line.includes('function postToUI')) {
                    // Simple heuristic check: if it's not near the postToUI definition
                    // (We assume the valid one is around line 80-90)
                    // A better check is just manually verifying lines in output if test fails
                }
            });
        }

        expect(allMatches.length).toBe(1);
    });

    test('Should use generateTokensPipeline in generate case', () => {
        // Simple string check to ensure the function is called
        expect(codeContent.includes('generateTokensPipeline({')).toBe(true);
    });

    test('Should use persistTokens in generate case', () => {
        expect(codeContent.includes('persistTokens(result.tokens')).toBe(true);
    });

    test('Should use emitTokensGenerated in generate case', () => {
        expect(codeContent.includes('emitTokensGenerated(result.tokens')).toBe(true);
    });

    test('Should NOT contain legacy "PIPELINE COMMUN" block', () => {
        expect(codeContent.includes('PIPELINE COMMUN (inchangé)')).toBe(false);
    });
});
