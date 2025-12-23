// Tests for semantic token functions
describe('Semantic Tokens', () => {
    describe('Semantic Key Parsing', () => {
        const getCategoryFromSemanticKey = (semanticKey) => {
            if (!semanticKey || typeof semanticKey !== 'string') return '';

            const parts = semanticKey.split('.');
            return parts[0] || '';
        };

        const getKeyFromSemanticKey = (semanticKey) => {
            if (!semanticKey || typeof semanticKey !== 'string') return '';

            const parts = semanticKey.split('.');
            return parts.slice(1).join('.') || '';
        };

        test('getCategoryFromSemanticKey should extract category', () => {
            expect(getCategoryFromSemanticKey('text.primary')).toBe('text');
            expect(getCategoryFromSemanticKey('bg.surface')).toBe('bg');
            expect(getCategoryFromSemanticKey('action.primary.default')).toBe('action');
        });

        test('getCategoryFromSemanticKey should handle single part', () => {
            expect(getCategoryFromSemanticKey('primary')).toBe('primary');
        });

        test('getCategoryFromSemanticKey should handle invalid input', () => {
            expect(getCategoryFromSemanticKey(null)).toBe('');
            expect(getCategoryFromSemanticKey(undefined)).toBe('');
            expect(getCategoryFromSemanticKey('')).toBe('');
            expect(getCategoryFromSemanticKey(123)).toBe('');
        });

        test('getKeyFromSemanticKey should extract key', () => {
            expect(getKeyFromSemanticKey('text.primary')).toBe('primary');
            expect(getKeyFromSemanticKey('bg.surface')).toBe('surface');
            expect(getKeyFromSemanticKey('action.primary.default')).toBe('primary.default');
        });

        test('getKeyFromSemanticKey should handle single part', () => {
            expect(getKeyFromSemanticKey('primary')).toBe('');
        });

        test('getKeyFromSemanticKey should handle invalid input', () => {
            expect(getKeyFromSemanticKey(null)).toBe('');
            expect(getKeyFromSemanticKey(undefined)).toBe('');
            expect(getKeyFromSemanticKey('')).toBe('');
        });
    });

    describe('Alias Normalization', () => {
        const normalizeAliasTo = (aliasTo, collections) => {
            if (!aliasTo) return null;

            // If already normalized object
            if (typeof aliasTo === 'object' && aliasTo.variableId) {
                return aliasTo;
            }

            // If string ID, resolve it
            if (typeof aliasTo === 'string') {
                // Mock resolution - in real code this would query Figma
                return {
                    variableId: aliasTo,
                    collection: 'mock-collection',
                    key: 'mock-key',
                    cssName: '--mock-var'
                };
            }

            return null;
        };

        test('should return null for falsy input', () => {
            expect(normalizeAliasTo(null)).toBe(null);
            expect(normalizeAliasTo(undefined)).toBe(null);
            expect(normalizeAliasTo('')).toBe(null);
        });

        test('should return normalized object as-is', () => {
            const normalized = {
                variableId: 'var-123',
                collection: 'Brand',
                key: '500',
                cssName: '--brand-500'
            };

            expect(normalizeAliasTo(normalized)).toEqual(normalized);
        });

        test('should normalize string ID to object', () => {
            const result = normalizeAliasTo('var-123');

            expect(result).toHaveProperty('variableId', 'var-123');
            expect(result).toHaveProperty('collection');
            expect(result).toHaveProperty('key');
            expect(result).toHaveProperty('cssName');
        });
    });

    describe('Fallback Values', () => {
        const getFallbackValue = (type, category) => {
            if (type === 'COLOR') {
                return '#FFFFFF';
            }
            if (type === 'FLOAT') {
                return 0;
            }
            if (type === 'STRING') {
                return '';
            }
            return null;
        };

        test('should return color fallback', () => {
            expect(getFallbackValue('COLOR', 'semantic')).toBe('#FFFFFF');
        });

        test('should return float fallback', () => {
            expect(getFallbackValue('FLOAT', 'spacing')).toBe(0);
        });

        test('should return string fallback', () => {
            expect(getFallbackValue('STRING', 'typography')).toBe('');
        });

        test('should return null for unknown type', () => {
            expect(getFallbackValue('UNKNOWN', 'category')).toBe(null);
        });
    });

    describe('UI Fallback Detection', () => {
        const isUIFallbackValue = (value, tokenType) => {
            if (tokenType === 'COLOR') {
                return value === '#FFFFFF' || value === '#000000' || value === 'rgba(0,0,0,0)';
            }
            if (tokenType === 'FLOAT') {
                return value === 0 || value === '0' || value === '0px';
            }
            if (tokenType === 'STRING') {
                return value === '' || value === '[object Object]';
            }
            return false;
        };

        test('should detect color fallbacks', () => {
            expect(isUIFallbackValue('#FFFFFF', 'COLOR')).toBe(true);
            expect(isUIFallbackValue('#000000', 'COLOR')).toBe(true);
            expect(isUIFallbackValue('rgba(0,0,0,0)', 'COLOR')).toBe(true);
            expect(isUIFallbackValue('#FF0000', 'COLOR')).toBe(false);
        });

        test('should detect float fallbacks', () => {
            expect(isUIFallbackValue(0, 'FLOAT')).toBe(true);
            expect(isUIFallbackValue('0', 'FLOAT')).toBe(true);
            expect(isUIFallbackValue('0px', 'FLOAT')).toBe(true);
            expect(isUIFallbackValue(16, 'FLOAT')).toBe(false);
        });

        test('should detect string fallbacks', () => {
            expect(isUIFallbackValue('', 'STRING')).toBe(true);
            expect(isUIFallbackValue('[object Object]', 'STRING')).toBe(true);
            expect(isUIFallbackValue('normal text', 'STRING')).toBe(false);
        });
    });

    describe('Token State Management', () => {
        const TOKEN_STATE = {
            VALUE: "VALUE",
            ALIAS_RESOLVED: "ALIAS_RESOLVED",
            ALIAS_UNRESOLVED: "ALIAS_UNRESOLVED"
        };

        const getTokenState = (token) => {
            if (!token) return null;

            // Has aliasTo and it's resolved
            if (token.aliasTo && typeof token.aliasTo === 'object' && token.aliasTo.variableId) {
                return TOKEN_STATE.ALIAS_RESOLVED;
            }

            // Has aliasTo but unresolved (string ID only)
            if (token.aliasTo && typeof token.aliasTo === 'string') {
                return TOKEN_STATE.ALIAS_UNRESOLVED;
            }

            // Has direct value
            if (token.resolvedValue !== undefined && token.resolvedValue !== null) {
                return TOKEN_STATE.VALUE;
            }

            return null;
        };

        test('should detect VALUE state', () => {
            const token = { resolvedValue: '#FF0000', type: 'COLOR' };
            expect(getTokenState(token)).toBe(TOKEN_STATE.VALUE);
        });

        test('should detect ALIAS_RESOLVED state', () => {
            const token = {
                aliasTo: {
                    variableId: 'var-123',
                    collection: 'Brand',
                    key: '500'
                }
            };
            expect(getTokenState(token)).toBe(TOKEN_STATE.ALIAS_RESOLVED);
        });

        test('should detect ALIAS_UNRESOLVED state', () => {
            const token = { aliasTo: 'var-123' };
            expect(getTokenState(token)).toBe(TOKEN_STATE.ALIAS_UNRESOLVED);
        });

        test('should handle null token', () => {
            expect(getTokenState(null)).toBe(null);
            expect(getTokenState(undefined)).toBe(null);
        });

        test('should handle empty token', () => {
            expect(getTokenState({})).toBe(null);
        });
    });
});
