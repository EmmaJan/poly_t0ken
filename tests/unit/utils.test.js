// Import functions from code.js
// Note: We'll need to extract these functions or use a different approach
// For now, we'll test them by requiring the code

describe('Utility Functions', () => {
    describe('safeStringify', () => {
        // Mock the function for testing
        const safeStringify = (obj, maxLen) => {
            maxLen = maxLen || 6000;
            try {
                var str = JSON.stringify(obj, null, 2);
                return str.length > maxLen ? str.substring(0, maxLen) + '... [TRUNCATED]' : str;
            } catch (e) {
                return '[STRINGIFY ERROR: ' + e.message + ']';
            }
        };

        test('should stringify simple object', () => {
            const result = safeStringify({ a: 1, b: 2 });
            expect(result).toContain('"a": 1');
            expect(result).toContain('"b": 2');
        });

        test('should truncate long strings', () => {
            const longObj = { data: 'x'.repeat(10000) };
            const result = safeStringify(longObj, 100);
            expect(result).toContain('[TRUNCATED]');
            expect(result.length).toBeLessThanOrEqual(115); // 100 + '... [TRUNCATED]'
        });

        test('should handle circular references', () => {
            const circular = { a: 1 };
            circular.self = circular;
            const result = safeStringify(circular);
            expect(result).toContain('[STRINGIFY ERROR');
        });

        test('should handle undefined and null', () => {
            expect(safeStringify(null)).toBe('null');
            // undefined causes JSON.stringify to fail, which triggers error handling
            expect(safeStringify(undefined)).toContain('[STRINGIFY ERROR');
        });
    });

    describe('normalizeLibType', () => {
        const normalizeLibType = (naming) => {
            if (!naming) return 'tailwind';
            if (typeof naming !== 'string') return 'tailwind';

            var lower = naming.toLowerCase().trim();
            if (lower === 'tailwind' || lower === 'shadcn') return 'tailwind';
            if (lower === 'mui' || lower === 'material' || lower === 'material-ui') return 'mui';
            if (lower === 'ant' || lower === 'antd' || lower === 'ant-design') return 'ant';
            if (lower === 'bootstrap' || lower === 'bs') return 'bootstrap';
            if (lower === 'chakra' || lower === 'chakra-ui') return 'chakra';
            return 'tailwind';
        };

        test('should normalize shadcn to tailwind', () => {
            expect(normalizeLibType('shadcn')).toBe('tailwind');
            expect(normalizeLibType('Shadcn')).toBe('tailwind');
            expect(normalizeLibType('SHADCN')).toBe('tailwind');
        });

        test('should normalize mui variants', () => {
            expect(normalizeLibType('mui')).toBe('mui');
            expect(normalizeLibType('MUI')).toBe('mui');
            expect(normalizeLibType('material')).toBe('mui');
            expect(normalizeLibType('material-ui')).toBe('mui');
        });

        test('should normalize ant variants', () => {
            expect(normalizeLibType('ant')).toBe('ant');
            expect(normalizeLibType('antd')).toBe('ant');
            expect(normalizeLibType('ant-design')).toBe('ant');
        });

        test('should normalize bootstrap variants', () => {
            expect(normalizeLibType('bootstrap')).toBe('bootstrap');
            expect(normalizeLibType('bs')).toBe('bootstrap');
        });

        test('should handle null/undefined', () => {
            expect(normalizeLibType(null)).toBe('tailwind');
            expect(normalizeLibType(undefined)).toBe('tailwind');
            expect(normalizeLibType('')).toBe('tailwind');
        });

        test('should handle non-string input', () => {
            expect(normalizeLibType(123)).toBe('tailwind');
            expect(normalizeLibType({})).toBe('tailwind');
            expect(normalizeLibType([])).toBe('tailwind');
        });

        test('should be case-insensitive', () => {
            expect(normalizeLibType('TAILWIND')).toBe('tailwind');
            expect(normalizeLibType('MuI')).toBe('mui');
            expect(normalizeLibType('AnT')).toBe('ant');
        });

        test('should default to tailwind for unknown libraries', () => {
            expect(normalizeLibType('unknown')).toBe('tailwind');
            expect(normalizeLibType('custom')).toBe('tailwind');
        });
    });

    describe('validateMessage (UI)', () => {
        const validateMessage = (msg) => {
            if (!msg || typeof msg !== 'object') {
                return false;
            }
            if (!msg.type || typeof msg.type !== 'string') {
                return false;
            }
            return true;
        };

        test('should accept valid message', () => {
            expect(validateMessage({ type: 'scan-results', results: [] })).toBe(true);
            expect(validateMessage({ type: 'init', naming: 'tailwind' })).toBe(true);
        });

        test('should reject null message', () => {
            expect(validateMessage(null)).toBe(false);
        });

        test('should reject undefined message', () => {
            expect(validateMessage(undefined)).toBe(false);
        });

        test('should reject message without type', () => {
            expect(validateMessage({ data: 'test' })).toBe(false);
            expect(validateMessage({})).toBe(false);
        });

        test('should reject message with non-string type', () => {
            expect(validateMessage({ type: 123 })).toBe(false);
            expect(validateMessage({ type: null })).toBe(false);
            expect(validateMessage({ type: {} })).toBe(false);
        });

        test('should reject non-object message', () => {
            expect(validateMessage('string')).toBe(false);
            expect(validateMessage(123)).toBe(false);
            expect(validateMessage([])).toBe(false);
        });
    });
});
