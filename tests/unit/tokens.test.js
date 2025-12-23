// Tests for token generation functions
describe('Token Generation', () => {
    describe('hexToRgb', () => {
        const hexToRgb = (hex) => {
            // Return as-is if already RGB object
            if (hex && typeof hex === 'object' && hex.r !== undefined && hex.g !== undefined && hex.b !== undefined) {
                return hex;
            }

            // Convert from hex string
            if (typeof hex === 'string') {
                hex = hex.replace("#", "");
                if (hex.length === 3) {
                    hex = hex.split("").map(function (x) { return x + x; }).join("");
                }
                var num = parseInt(hex, 16);
                if (!isNaN(num)) {
                    return {
                        r: ((num >> 16) & 255) / 255,
                        g: ((num >> 8) & 255) / 255,
                        b: (num & 255) / 255
                    };
                }
            }

            // Default fallback
            return { r: 0, g: 0, b: 0 };
        };

        test('should convert 6-digit hex to RGB', () => {
            const result = hexToRgb('#FF0000');
            expect(result).toEqual({ r: 1, g: 0, b: 0 });
        });

        test('should convert 3-digit hex to RGB', () => {
            const result = hexToRgb('#F00');
            expect(result).toEqual({ r: 1, g: 0, b: 0 });
        });

        test('should handle hex without #', () => {
            const result = hexToRgb('00FF00');
            expect(result).toEqual({ r: 0, g: 1, b: 0 });
        });

        test('should handle lowercase hex', () => {
            const result = hexToRgb('#0000ff');
            expect(result).toEqual({ r: 0, g: 0, b: 1 });
        });

        test('should return RGB object as-is', () => {
            const rgb = { r: 0.5, g: 0.5, b: 0.5 };
            expect(hexToRgb(rgb)).toEqual(rgb);
        });

        test('should handle invalid hex', () => {
            expect(hexToRgb('invalid')).toEqual({ r: 0, g: 0, b: 0 });
            expect(hexToRgb('')).toEqual({ r: 0, g: 0, b: 0 });
        });

        test('should handle null/undefined', () => {
            expect(hexToRgb(null)).toEqual({ r: 0, g: 0, b: 0 });
            expect(hexToRgb(undefined)).toEqual({ r: 0, g: 0, b: 0 });
        });
    });

    describe('rgbToHex', () => {
        const rgbToHex = (c) => {
            const roundToPrecision = function (x) {
                return Math.round(x * 1000000) / 1000000;
            };

            var r = roundToPrecision(Math.max(0, Math.min(1, c.r)));
            var g = roundToPrecision(Math.max(0, Math.min(1, c.g)));
            var b = roundToPrecision(Math.max(0, Math.min(1, c.b)));

            var r255 = Math.round(r * 255);
            var g255 = Math.round(g * 255);
            var b255 = Math.round(b * 255);

            var n = (r255 << 16) | (g255 << 8) | b255;
            var hex = "#" + n.toString(16).padStart(6, "0").toUpperCase();
            return hex;
        };

        test('should convert RGB to hex', () => {
            expect(rgbToHex({ r: 1, g: 0, b: 0 })).toBe('#FF0000');
            expect(rgbToHex({ r: 0, g: 1, b: 0 })).toBe('#00FF00');
            expect(rgbToHex({ r: 0, g: 0, b: 1 })).toBe('#0000FF');
        });

        test('should handle fractional RGB values', () => {
            expect(rgbToHex({ r: 0.5, g: 0.5, b: 0.5 })).toBe('#808080');
        });

        test('should clamp values to 0-1 range', () => {
            expect(rgbToHex({ r: 2, g: -1, b: 0.5 })).toBe('#FF0080');
        });

        test('should handle white and black', () => {
            expect(rgbToHex({ r: 1, g: 1, b: 1 })).toBe('#FFFFFF');
            expect(rgbToHex({ r: 0, g: 0, b: 0 })).toBe('#000000');
        });

        test('should pad zeros correctly', () => {
            expect(rgbToHex({ r: 0, g: 0, b: 0.004 })).toBe('#000001');
        });
    });

    describe('Token Type Detection', () => {
        const determineTokenTypeFromKey = (key) => {
            if (!key) return 'COLOR';

            const lower = key.toLowerCase();

            // Spacing tokens
            if (lower.includes('spacing') || lower.includes('gap') || lower.includes('padding') || lower.includes('margin')) {
                return 'FLOAT';
            }

            // Radius tokens
            if (lower.includes('radius') || lower.includes('rounded')) {
                return 'FLOAT';
            }

            // Typography tokens
            if (lower.includes('font') && lower.includes('size')) {
                return 'FLOAT';
            }
            if (lower.includes('line') && lower.includes('height')) {
                return 'FLOAT';
            }
            if (lower.includes('letter') && lower.includes('spacing')) {
                return 'FLOAT';
            }

            // Border width
            if (lower.includes('border') && lower.includes('width')) {
                return 'FLOAT';
            }

            // Default to COLOR for everything else
            return 'COLOR';
        };

        test('should detect spacing tokens as FLOAT', () => {
            expect(determineTokenTypeFromKey('spacing-4')).toBe('FLOAT');
            expect(determineTokenTypeFromKey('gap-large')).toBe('FLOAT');
            expect(determineTokenTypeFromKey('padding-left')).toBe('FLOAT');
            expect(determineTokenTypeFromKey('margin-top')).toBe('FLOAT');
        });

        test('should detect radius tokens as FLOAT', () => {
            expect(determineTokenTypeFromKey('radius-sm')).toBe('FLOAT');
            expect(determineTokenTypeFromKey('rounded-lg')).toBe('FLOAT');
        });

        test('should detect typography tokens as FLOAT', () => {
            expect(determineTokenTypeFromKey('font-size-base')).toBe('FLOAT');
            expect(determineTokenTypeFromKey('line-height-normal')).toBe('FLOAT');
            expect(determineTokenTypeFromKey('letter-spacing-wide')).toBe('FLOAT');
        });

        test('should detect border width as FLOAT', () => {
            expect(determineTokenTypeFromKey('border-width-thin')).toBe('FLOAT');
        });

        test('should default to COLOR for color tokens', () => {
            expect(determineTokenTypeFromKey('primary-500')).toBe('COLOR');
            expect(determineTokenTypeFromKey('text-primary')).toBe('COLOR');
            expect(determineTokenTypeFromKey('bg-surface')).toBe('COLOR');
        });

        test('should handle case-insensitive keys', () => {
            expect(determineTokenTypeFromKey('SPACING-4')).toBe('FLOAT');
            expect(determineTokenTypeFromKey('Radius-Sm')).toBe('FLOAT');
        });

        test('should handle null/undefined', () => {
            expect(determineTokenTypeFromKey(null)).toBe('COLOR');
            expect(determineTokenTypeFromKey(undefined)).toBe('COLOR');
            expect(determineTokenTypeFromKey('')).toBe('COLOR');
        });
    });

    describe('Collection Name Parsing', () => {
        const getCategoryFromVariableCollection = (collectionName) => {
            if (!collectionName) return 'unknown';

            const lower = collectionName.toLowerCase();

            // Semantic collection
            if (lower.includes('semantic') || lower.includes('alias')) {
                return 'semantic';
            }

            // Primitive collections
            if (lower.includes('brand') || lower.includes('primary')) return 'brand';
            if (lower.includes('gray') || lower.includes('grey') || lower.includes('neutral')) return 'gray';
            if (lower.includes('system') || lower.includes('status')) return 'system';
            if (lower.includes('spacing') || lower.includes('space')) return 'spacing';
            if (lower.includes('radius') || lower.includes('rounded')) return 'radius';
            if (lower.includes('typography') || lower.includes('typo') || lower.includes('font')) return 'typography';
            if (lower.includes('border')) return 'border';

            return 'unknown';
        };

        test('should detect semantic collection', () => {
            expect(getCategoryFromVariableCollection('Semantic Tokens')).toBe('semantic');
            expect(getCategoryFromVariableCollection('Alias Tokens')).toBe('semantic');
        });

        test('should detect brand collection', () => {
            expect(getCategoryFromVariableCollection('Brand Colors')).toBe('brand');
            expect(getCategoryFromVariableCollection('Primary')).toBe('brand');
        });

        test('should detect gray collection', () => {
            expect(getCategoryFromVariableCollection('Gray Scale')).toBe('gray');
            expect(getCategoryFromVariableCollection('Neutral')).toBe('gray');
            expect(getCategoryFromVariableCollection('Grey')).toBe('gray');
        });

        test('should detect system collection', () => {
            expect(getCategoryFromVariableCollection('System Colors')).toBe('system');
            expect(getCategoryFromVariableCollection('Status')).toBe('system');
        });

        test('should detect spacing collection', () => {
            expect(getCategoryFromVariableCollection('Spacing')).toBe('spacing');
            expect(getCategoryFromVariableCollection('Space Scale')).toBe('spacing');
        });

        test('should detect radius collection', () => {
            expect(getCategoryFromVariableCollection('Radius')).toBe('radius');
            expect(getCategoryFromVariableCollection('Rounded')).toBe('radius');
        });

        test('should detect typography collection', () => {
            expect(getCategoryFromVariableCollection('Typography')).toBe('typography');
            expect(getCategoryFromVariableCollection('Font Sizes')).toBe('typography');
        });

        test('should handle unknown collections', () => {
            expect(getCategoryFromVariableCollection('Custom')).toBe('unknown');
            expect(getCategoryFromVariableCollection('Other')).toBe('unknown');
        });

        test('should handle null/undefined', () => {
            expect(getCategoryFromVariableCollection(null)).toBe('unknown');
            expect(getCategoryFromVariableCollection(undefined)).toBe('unknown');
            expect(getCategoryFromVariableCollection('')).toBe('unknown');
        });
    });
});
