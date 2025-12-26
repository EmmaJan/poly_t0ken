// ============================================================================
// SELF-CHECKS & TESTS
// ============================================================================

/**
 * Test normalizeTokenName on all variants
 */
function selfCheckNormalization() {
    var tests = [
        ['bg.inverse', 'bg-inverse'],
        ['bg/inverse', 'bg-inverse'],
        ['bg / inverse', 'bg-inverse'],
        ['bg - inverse', 'bg-inverse'],
        ['text.primary', 'text-primary'],
        ['action-primary', 'action-primary'],
        ['  spacing / large  ', 'spacing-large'],
        ['border.default', 'border-default']
    ];

    var passed = 0;
    var failed = 0;

    for (var i = 0; i < tests.length; i++) {
        var input = tests[i][0];
        var expected = tests[i][1];
        var result = normalizeTokenName(input);

        if (result === expected) {
            passed++;
        } else {
            failed++;
            console.error('[SELF-CHECK] normalizeTokenName FAILED:', input, '→', result, '(expected:', expected + ')');
        }
    }

    console.log('[SELF-CHECK] normalizeTokenName:', passed, 'passed,', failed, 'failed');
    return failed === 0;
}

/**
 * Test that createScanIssue never produces undefined fields
 */
function selfCheckScanIssueNoUndefined() {
    var issue = createScanIssue({
        nodeId: 'test-node',
        nodeName: 'Test Node'
    });

    var requiredFields = ['nodeId', 'nodeName', 'nodeType', 'propertyKind', 'propertyKey', 'rawValue', 'rawValueType', 'contextModeName', 'contextModeId', 'isBound', 'requiredScopes', 'suggestions', 'status'];

    var failed = 0;
    for (var i = 0; i < requiredFields.length; i++) {
        var field = requiredFields[i];
        if (issue[field] === undefined) {
            console.error('[SELF-CHECK] ScanIssue has undefined field:', field);
            failed++;
        }
    }

    console.log('[SELF-CHECK] ScanIssue no undefined:', failed === 0 ? 'PASSED' : 'FAILED (' + failed + ' undefined fields)');
    return failed === 0;
}

/**
 * Test that createSuggestion never produces undefined fields
 */
function selfCheckSuggestionNoUndefined() {
    var suggestion = createSuggestion({
        variableId: 'test-var',
        variableName: 'test / variable'
    });

    var requiredFields = ['variableId', 'variableName', 'normalizedName', 'resolvedValue', 'distance', 'isExact', 'scopeMatch', 'modeMatch', 'debug'];

    var failed = 0;
    for (var i = 0; i < requiredFields.length; i++) {
        var field = requiredFields[i];
        if (suggestion[field] === undefined) {
            console.error('[SELF-CHECK] Suggestion has undefined field:', field);
            failed++;
        }
    }

    console.log('[SELF-CHECK] Suggestion no undefined:', failed === 0 ? 'PASSED' : 'FAILED (' + failed + ' undefined fields)');
    return failed === 0;
}

/**
 * Run all self-checks
 */
function runAllSelfChecks() {
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  RUNNING SELF-CHECKS');
    console.log('═══════════════════════════════════════════════════════════');

    var results = {
        normalization: selfCheckNormalization(),
        scanIssueNoUndefined: selfCheckScanIssueNoUndefined(),
        suggestionNoUndefined: selfCheckSuggestionNoUndefined()
    };

    var allPassed = results.normalization && results.scanIssueNoUndefined && results.suggestionNoUndefined;

    console.log('═══════════════════════════════════════════════════════════');
    console.log('  SELF-CHECKS:', allPassed ? '✅ ALL PASSED' : '❌ SOME FAILED');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');

    return allPassed;
}

// Export for use in code.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        selfCheckNormalization: selfCheckNormalization,
        selfCheckScanIssueNoUndefined: selfCheckScanIssueNoUndefined,
        selfCheckSuggestionNoUndefined: selfCheckSuggestionNoUndefined,
        runAllSelfChecks: runAllSelfChecks
    };
}
