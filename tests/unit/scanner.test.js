// Tests for scan and fix functions
describe('Scan & Fix', () => {
    describe('Property Detection', () => {
        const isColorProperty = (property) => {
            const colorProps = ['Fill', 'Text', 'Stroke', 'Local Fill Style', 'Local Stroke Style'];
            return colorProps.includes(property);
        };

        const isNumericProperty = (property) => {
            const numericProps = [
                'CORNER RADIUS', 'TOP LEFT RADIUS', 'TOP RIGHT RADIUS',
                'BOTTOM LEFT RADIUS', 'BOTTOM RIGHT RADIUS',
                'Item Spacing', 'Padding Left', 'Padding Right',
                'Padding Top', 'Padding Bottom',
                'Border Width'
            ];
            return numericProps.includes(property);
        };

        test('should detect color properties', () => {
            expect(isColorProperty('Fill')).toBe(true);
            expect(isColorProperty('Text')).toBe(true);
            expect(isColorProperty('Stroke')).toBe(true);
            expect(isColorProperty('Local Fill Style')).toBe(true);
            expect(isColorProperty('Local Stroke Style')).toBe(true);
        });

        test('should not detect non-color properties as color', () => {
            expect(isColorProperty('CORNER RADIUS')).toBe(false);
            expect(isColorProperty('Item Spacing')).toBe(false);
            expect(isColorProperty('Unknown')).toBe(false);
        });

        test('should detect numeric properties', () => {
            expect(isNumericProperty('CORNER RADIUS')).toBe(true);
            expect(isNumericProperty('TOP LEFT RADIUS')).toBe(true);
            expect(isNumericProperty('Item Spacing')).toBe(true);
            expect(isNumericProperty('Padding Left')).toBe(true);
            expect(isNumericProperty('Border Width')).toBe(true);
        });

        test('should not detect non-numeric properties as numeric', () => {
            expect(isNumericProperty('Fill')).toBe(false);
            expect(isNumericProperty('Text')).toBe(false);
            expect(isNumericProperty('Unknown')).toBe(false);
        });
    });

    describe('Color Distance Calculation', () => {
        const calculateColorDistance = (color1, color2) => {
            // Simple Euclidean distance in RGB space
            const dr = color1.r - color2.r;
            const dg = color1.g - color2.g;
            const db = color1.b - color2.b;
            return Math.sqrt(dr * dr + dg * dg + db * db);
        };

        test('should calculate distance between identical colors', () => {
            const color = { r: 0.5, g: 0.5, b: 0.5 };
            expect(calculateColorDistance(color, color)).toBe(0);
        });

        test('should calculate distance between black and white', () => {
            const black = { r: 0, g: 0, b: 0 };
            const white = { r: 1, g: 1, b: 1 };
            const distance = calculateColorDistance(black, white);
            expect(distance).toBeCloseTo(Math.sqrt(3), 5);
        });

        test('should calculate distance between similar colors', () => {
            const color1 = { r: 0.5, g: 0.5, b: 0.5 };
            const color2 = { r: 0.51, g: 0.51, b: 0.51 };
            const distance = calculateColorDistance(color1, color2);
            expect(distance).toBeLessThan(0.02);
        });

        test('should be symmetric', () => {
            const color1 = { r: 0.3, g: 0.4, b: 0.5 };
            const color2 = { r: 0.6, g: 0.7, b: 0.8 };
            expect(calculateColorDistance(color1, color2)).toBe(calculateColorDistance(color2, color1));
        });
    });

    describe('Numeric Value Matching', () => {
        const isNumericMatch = (value1, value2, tolerance = 0.5) => {
            const num1 = typeof value1 === 'number' ? value1 : parseFloat(value1);
            const num2 = typeof value2 === 'number' ? value2 : parseFloat(value2);

            if (isNaN(num1) || isNaN(num2)) return false;

            return Math.abs(num1 - num2) <= tolerance;
        };

        test('should match exact values', () => {
            expect(isNumericMatch(16, 16)).toBe(true);
            expect(isNumericMatch(8, 8)).toBe(true);
        });

        test('should match within tolerance', () => {
            expect(isNumericMatch(16, 16.3, 0.5)).toBe(true);
            expect(isNumericMatch(8, 8.4, 0.5)).toBe(true);
        });

        test('should not match outside tolerance', () => {
            expect(isNumericMatch(16, 17, 0.5)).toBe(false);
            expect(isNumericMatch(8, 10, 0.5)).toBe(false);
        });

        test('should handle string values', () => {
            expect(isNumericMatch('16', 16)).toBe(true);
            expect(isNumericMatch(16, '16')).toBe(true);
            expect(isNumericMatch('16', '16')).toBe(true);
        });

        test('should handle invalid values', () => {
            expect(isNumericMatch('invalid', 16)).toBe(false);
            expect(isNumericMatch(16, 'invalid')).toBe(false);
            expect(isNumericMatch(null, 16)).toBe(false);
        });
    });

    describe('Scan Result Filtering', () => {
        const filterScanResults = (results, filter) => {
            if (!results || !Array.isArray(results)) return [];
            if (!filter || filter === 'all') return results;

            if (filter === 'auto') {
                return results.filter(r => r.isExact === true);
            }

            if (filter === 'manual') {
                return results.filter(r => r.isExact !== true);
            }

            return results;
        };

        const mockResults = [
            { id: 1, property: 'Fill', isExact: true },
            { id: 2, property: 'Stroke', isExact: false },
            { id: 3, property: 'CORNER RADIUS', isExact: true },
            { id: 4, property: 'Item Spacing', isExact: false }
        ];

        test('should return all results with "all" filter', () => {
            expect(filterScanResults(mockResults, 'all')).toHaveLength(4);
        });

        test('should return only exact matches with "auto" filter', () => {
            const filtered = filterScanResults(mockResults, 'auto');
            expect(filtered).toHaveLength(2);
            expect(filtered.every(r => r.isExact === true)).toBe(true);
        });

        test('should return only non-exact matches with "manual" filter', () => {
            const filtered = filterScanResults(mockResults, 'manual');
            expect(filtered).toHaveLength(2);
            expect(filtered.every(r => r.isExact !== true)).toBe(true);
        });

        test('should handle null/undefined results', () => {
            expect(filterScanResults(null, 'all')).toEqual([]);
            expect(filterScanResults(undefined, 'all')).toEqual([]);
        });

        test('should handle empty array', () => {
            expect(filterScanResults([], 'all')).toEqual([]);
        });

        test('should default to all when no filter', () => {
            expect(filterScanResults(mockResults)).toHaveLength(4);
        });
    });

    describe('Scope Validation', () => {
        const validateScope = (variableScopes, propertyType) => {
            if (!variableScopes || !Array.isArray(variableScopes)) return false;
            if (variableScopes.length === 0) return true; // No scopes = all scopes

            const scopeMap = {
                'Fill': ['ALL_FILLS', 'FRAME_FILL', 'SHAPE_FILL', 'TEXT_FILL'],
                'Stroke': ['ALL_STROKES', 'STROKE_COLOR'],
                'Text': ['ALL_FILLS', 'TEXT_FILL'],
                'CORNER RADIUS': ['CORNER_RADIUS'],
                'Item Spacing': ['GAP'],
                'Padding Left': ['ALL_PADDING', 'LEFT_PADDING'],
                'Padding Right': ['ALL_PADDING', 'RIGHT_PADDING'],
                'Padding Top': ['ALL_PADDING', 'TOP_PADDING'],
                'Padding Bottom': ['ALL_PADDING', 'BOTTOM_PADDING']
            };

            const requiredScopes = scopeMap[propertyType] || [];

            return requiredScopes.some(scope => variableScopes.includes(scope));
        };

        test('should validate fill scopes', () => {
            expect(validateScope(['ALL_FILLS'], 'Fill')).toBe(true);
            expect(validateScope(['FRAME_FILL'], 'Fill')).toBe(true);
            expect(validateScope(['SHAPE_FILL'], 'Fill')).toBe(true);
            expect(validateScope(['TEXT_FILL'], 'Fill')).toBe(true);
        });

        test('should validate stroke scopes', () => {
            expect(validateScope(['ALL_STROKES'], 'Stroke')).toBe(true);
            expect(validateScope(['STROKE_COLOR'], 'Stroke')).toBe(true);
        });

        test('should validate text scopes', () => {
            expect(validateScope(['TEXT_FILL'], 'Text')).toBe(true);
            expect(validateScope(['ALL_FILLS'], 'Text')).toBe(true);
        });

        test('should validate numeric scopes', () => {
            expect(validateScope(['CORNER_RADIUS'], 'CORNER RADIUS')).toBe(true);
            expect(validateScope(['GAP'], 'Item Spacing')).toBe(true);
            expect(validateScope(['ALL_PADDING'], 'Padding Left')).toBe(true);
        });

        test('should reject invalid scopes', () => {
            expect(validateScope(['WRONG_SCOPE'], 'Fill')).toBe(false);
            expect(validateScope(['TEXT_FILL'], 'Stroke')).toBe(false);
        });

        test('should accept empty scopes array', () => {
            expect(validateScope([], 'Fill')).toBe(true);
            expect(validateScope([], 'Stroke')).toBe(true);
        });

        test('should handle null/undefined scopes', () => {
            expect(validateScope(null, 'Fill')).toBe(false);
            expect(validateScope(undefined, 'Fill')).toBe(false);
        });
    });
});
