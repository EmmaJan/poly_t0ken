// ============================================================================
// SCAN ENGINE V2 - Enums & Constants
// ============================================================================

var PropertyKind = {
    FILL: 'FILL',
    TEXT_FILL: 'TEXT_FILL',
    STROKE: 'STROKE',
    EFFECT_COLOR: 'EFFECT_COLOR',
    GAP: 'GAP',
    PADDING: 'PADDING',
    CORNER_RADIUS: 'CORNER_RADIUS',
    STROKE_WEIGHT: 'STROKE_WEIGHT',
    FONT_SIZE: 'FONT_SIZE',
    LINE_HEIGHT: 'LINE_HEIGHT',
    LETTER_SPACING: 'LETTER_SPACING',
    UNKNOWN: 'UNKNOWN'
};

var TokenKind = {
    SEMANTIC: 'SEMANTIC',
    PRIMITIVE: 'PRIMITIVE'
};

var IssueStatus = {
    UNBOUND: 'UNBOUND',
    NO_MATCH: 'NO_MATCH',
    HAS_MATCHES: 'HAS_MATCHES'
};

var ValueType = {
    COLOR: 'COLOR',
    FLOAT: 'FLOAT'
};

// ============================================================================
// Token Name Normalization (CRITICAL)
// ============================================================================

/**
 * Normalizes token names for consistent matching
 * "bg.inverse", "bg/inverse", "bg / inverse", "bg - inverse" -> "bg-inverse"
 */
function normalizeTokenName(name) {
    if (!name) return '';
    return name
        .trim()
        .toLowerCase()
        .replace(/[\\/\\.]/g, '-')      // Replace /, \, . with -
        .replace(/\s+/g, '-')            // Replace spaces with -
        .replace(/-+/g, '-')             // Collapse multiple dashes
        .replace(/^-|-$/g, '');          // Remove leading/trailing dashes
}

// ============================================================================
// Mode Detection (FIXED)
// ============================================================================

/**
 * Detects the mode of a node, prioritizing explicit Figma modes
 * Returns the modeId directly (not the mode name)
 */
function detectNodeModeId(node) {
    if (!node) return null;

    // Priority 1: Explicit mode on the node itself
    if (node.explicitVariableModes) {
        var collectionIds = Object.keys(node.explicitVariableModes);
        if (collectionIds.length > 0) {
            // Find the Semantic collection
            var collections = figma.variables.getLocalVariableCollections();
            for (var i = 0; i < collections.length; i++) {
                var col = collections[i];
                var colName = col.name.toLowerCase();
                if (colName.indexOf('semantic') !== -1 || colName.indexOf('sémantique') !== -1) {
                    var modeId = node.explicitVariableModes[col.id];
                    if (modeId) {
                        return modeId;
                    }
                }
            }

            // Fallback: use first collection's mode
            return node.explicitVariableModes[collectionIds[0]];
        }
    }

    // Priority 2: Inherit from parent
    if (node.parent && node.parent.explicitVariableModes) {
        return detectNodeModeId(node.parent);
    }

    // Priority 3: Find default Light mode from Semantic collection
    var collections = figma.variables.getLocalVariableCollections();
    for (var i = 0; i < collections.length; i++) {
        var col = collections[i];
        var colName = col.name.toLowerCase();
        if (colName.indexOf('semantic') !== -1 || colName.indexOf('sémantique') !== -1) {
            // Find Light mode
            for (var j = 0; j < col.modes.length; j++) {
                var mode = col.modes[j];
                var modeName = mode.name.toLowerCase();
                if (modeName.indexOf('light') !== -1 || modeName.indexOf('clair') !== -1) {
                    return mode.modeId;
                }
            }
            // Fallback: first mode
            if (col.modes.length > 0) {
                return col.modes[0].modeId;
            }
        }
    }

    return null;
}

// ============================================================================
// Self-Check Functions
// ============================================================================

function selfCheckNormalization() {
    var tests = [
        ['bg.inverse', 'bg-inverse'],
        ['bg/inverse', 'bg-inverse'],
        ['bg / inverse', 'bg-inverse'],
        ['bg - inverse', 'bg-inverse'],
        ['text.primary', 'text-primary'],
        ['action-primary', 'action-primary']
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
