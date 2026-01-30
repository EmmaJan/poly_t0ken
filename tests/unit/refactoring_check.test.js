
describe('Refactoring Check', () => {

    // Mock dependencies
    const SEMANTIC_TYPE_MAP = { 'bg.surface': 'COLOR' };
    const TOKEN_STATE = { VALUE: 'VALUE', ALIAS_RESOLVED: 'ALIAS_RESOLVED' };
    const getCategoryFromSemanticKey = k => k.split('.')[0];
    const getKeyFromSemanticKey = k => k.split('.').slice(1).join('.');
    const DEBUG = false;

    // --- SCOPING POLICY (Refactored Version) ---
    const SCOPE_POLICY = 'LENIENT';

    function filterVariableByScopes(meta, requiredScopes, policy) {
        if (!requiredScopes || requiredScopes.length === 0) return true;
        policy = policy || SCOPE_POLICY;

        // Si on demande des scopes précis mais que la variable n'en a pas
        if (!meta.scopes || meta.scopes.length === 0) {
            if (policy === 'LENIENT') {
                return true;
            } else {
                return false;
            }
        }

        // SPECIAL CASE: ALL_SCOPES
        if (meta.scopes.indexOf('ALL_SCOPES') !== -1) {
            return true;
        }

        // Check if variable has at least one of the required scopes (OR logic)
        for (var i = 0; i < requiredScopes.length; i++) {
            if (meta.scopes.indexOf(requiredScopes[i]) !== -1) {
                return true;
            }
        }

        return false;
    }

    test('filterVariableByScopes LENIENT matches current behavior', () => {
        const meta = { scopes: [], name: 'NoScopeVar' }; // No scopes
        const required = ['ALL_FILLS'];

        // Default policy (undefined) -> LENIENT
        expect(filterVariableByScopes(meta, required)).toBe(true);
        // Explicit LENIENT
        expect(filterVariableByScopes(meta, required, 'LENIENT')).toBe(true);
        // Explicit STRICT
        expect(filterVariableByScopes(meta, required, 'STRICT')).toBe(false);
    });

    test('filterVariableByScopes respects matching scopes', () => {
        const meta = { scopes: ['ALL_FILLS'], name: 'FillVar' };
        expect(filterVariableByScopes(meta, ['ALL_FILLS'])).toBe(true);
    });

    test('filterVariableByScopes respects ALL_SCOPES', () => {
        const meta = { scopes: ['ALL_SCOPES'], name: 'AllVar' };
        expect(filterVariableByScopes(meta, ['ANYTHING'])).toBe(true);
    });

    // --- NORMALIZE SEMANTIC TOKEN (Refactored Version) ---
    function normalizeSemanticToken(token, key, themeMode) {
        if (!token || typeof token !== 'object') return token;

        // PRESERVE STRUCTURE: If modes exist, strictly preserve them
        if (token.modes) {
            return Object.assign({}, token); // Shallow clone
        }

        // ALREADY NORMALIZED?
        if (token.resolvedValue !== undefined && !token.modes) {
            return Object.assign({}, token);
        }

        // FALLBACK: Return as is
        return token;
    }

    test('normalizeSemanticToken preserves modes structure', () => {
        const tokenWithModes = {
            modes: {
                light: { resolvedValue: '#fff', aliasRef: 'var:123' },
                dark: { resolvedValue: '#000', aliasRef: 'var:456' }
            }
        };
        const result = normalizeSemanticToken(tokenWithModes, 'bg.surface', 'light');
        expect(result).not.toBe(tokenWithModes); // It's a structured check
        expect(result.modes).toEqual(tokenWithModes.modes);
        expect(result.modes.light.resolvedValue).toBe('#fff');
    });

    test('normalizeSemanticToken handles legacy format (identity)', () => {
        const legacyToken = { resolvedValue: '#123456' }; // Just verify it returns normalized
        // In the mock map, 'bg.surface' is COLOR
        const result = normalizeSemanticToken(legacyToken, 'bg.surface', 'light');

        expect(result).not.toBe(legacyToken); // Shallow clone
        expect(result.resolvedValue).toBe('#123456');
        // Type is not added by normalization anymore (preserved original behavior)
        expect(result.type).toBeUndefined();
    });

    test('normalizeSemanticToken returns unknown format as ref', () => {
        const unknown = { foo: 'bar' };
        const result = normalizeSemanticToken(unknown, 'key', 'light');
        expect(result).toBe(unknown);
    });

});
