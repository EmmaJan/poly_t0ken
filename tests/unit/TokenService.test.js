/**
 * Tests for TokenService
 */

const { TokenService, TokenGenerator, TokenValidator, StorageService } = require('../../TokenService');

describe('TokenService', () => {
    let service;
    let mockGenerator;
    let mockValidator;
    let mockStorage;
    let mockMessageBus;

    beforeEach(() => {
        // Mock dependencies
        mockGenerator = {
            generatePrimitives: jest.fn().mockResolvedValue({
                brand: { '500': '#6366F1' },
                gray: { '50': '#FAFAFA', '950': '#0A0A0A' },
                system: { success: '#10B981', error: '#EF4444' }
            }),
            generateSemantics: jest.fn().mockResolvedValue({
                'bg.canvas': { type: 'COLOR', modes: { light: { resolvedValue: '#FAFAFA' } } }
            }),
            importToFigma: jest.fn().mockResolvedValue(undefined),
            exportToFormat: jest.fn().mockReturnValue('/* CSS */')
        };

        mockValidator = {
            validate: jest.fn().mockReturnValue(true)
        };

        mockStorage = {
            saveTokens: jest.fn().mockResolvedValue(undefined),
            loadTokens: jest.fn().mockResolvedValue(null)
        };

        mockMessageBus = {
            emit: jest.fn()
        };

        service = new TokenService({
            generator: mockGenerator,
            validator: mockValidator,
            storage: mockStorage,
            messageBus: mockMessageBus,
            debug: false
        });
    });

    describe('Token Generation', () => {
        test('should generate tokens with valid config', async () => {
            const config = {
                hex: '#6366F1',
                naming: 'tailwind',
                themeMode: 'light'
            };

            const result = await service.generateTokens(config);

            expect(result).toHaveProperty('primitives');
            expect(result).toHaveProperty('semantics');
            expect(mockGenerator.generatePrimitives).toHaveBeenCalledWith(config);
            expect(mockGenerator.generateSemantics).toHaveBeenCalled();
        });

        test('should validate config before generation', async () => {
            const invalidConfig = {
                hex: 'invalid',
                naming: 'tailwind'
            };

            await expect(service.generateTokens(invalidConfig)).rejects.toThrow('Invalid hex color');
        });

        test('should validate naming', async () => {
            const invalidConfig = {
                hex: '#6366F1',
                naming: 'invalid'
            };

            await expect(service.generateTokens(invalidConfig)).rejects.toThrow('Invalid naming');
        });

        test('should save tokens to storage', async () => {
            const config = { hex: '#6366F1', naming: 'tailwind' };

            await service.generateTokens(config);

            expect(mockStorage.saveTokens).toHaveBeenCalled();
        });

        test('should emit event after generation', async () => {
            const config = { hex: '#6366F1', naming: 'tailwind' };

            await service.generateTokens(config);

            expect(mockMessageBus.emit).toHaveBeenCalledWith('tokens:generated', expect.objectContaining({
                primitives: expect.any(Object),
                semantics: expect.any(Object)
            }));
        });

        test('should track statistics', async () => {
            const config = { hex: '#6366F1', naming: 'tailwind' };

            await service.generateTokens(config);

            const stats = service.getStats();
            expect(stats.generated).toBe(1);
        });
    });

    describe('Token Import', () => {
        test('should import tokens to Figma', async () => {
            const tokens = {
                primitives: {
                    brand: { '500': '#6366F1' },
                    gray: { '50': '#FAFAFA' },
                    system: { success: '#10B981' }
                },
                semantics: { 'bg.canvas': {} }
            };
            const config = { naming: 'tailwind', overwrite: false };

            await service.importTokens(tokens, config);

            expect(mockGenerator.importToFigma).toHaveBeenCalledWith(tokens, config);
        });

        test('should validate tokens before import', async () => {
            const invalidTokens = { invalid: true };
            const config = { naming: 'tailwind' };

            await expect(service.importTokens(invalidTokens, config)).rejects.toThrow();
        });

        test('should emit event after import', async () => {
            const tokens = {
                primitives: {
                    brand: { '500': '#6366F1' },
                    gray: { '50': '#FAFAFA' },
                    system: { success: '#10B981' }
                },
                semantics: {}
            };
            const config = { naming: 'tailwind' };

            await service.importTokens(tokens, config);

            expect(mockMessageBus.emit).toHaveBeenCalledWith('tokens:imported', expect.any(Object));
        });
    });

    describe('Token Export', () => {
        test('should export tokens to CSS', () => {
            const tokens = {
                primitives: {
                    brand: { '500': '#6366F1' },
                    gray: { '50': '#FAFAFA' },
                    system: { success: '#10B981' }
                },
                semantics: {}
            };

            const result = service.exportTokens(tokens, 'css');

            expect(result).toBe('/* CSS */');
            expect(mockGenerator.exportToFormat).toHaveBeenCalledWith(tokens, 'css');
        });

        test('should validate tokens before export', () => {
            const invalidTokens = {
                primitives: { brand: {} }  // Missing gray and system
            };

            expect(() => service.exportTokens(invalidTokens, 'css')).toThrow();
        });

        test('should emit event after export', () => {
            const tokens = {
                primitives: {
                    brand: { '500': '#6366F1' },
                    gray: { '50': '#FAFAFA' },
                    system: { success: '#10B981' }
                },
                semantics: {}
            };

            service.exportTokens(tokens, 'css');

            expect(mockMessageBus.emit).toHaveBeenCalledWith('tokens:exported', expect.any(Object));
        });
    });

    describe('Validation', () => {
        test('should validate config hex format', () => {
            expect(() => service.validateConfig({ hex: '#6366F1', naming: 'tailwind' })).not.toThrow();
            expect(() => service.validateConfig({ hex: 'invalid', naming: 'tailwind' })).toThrow();
            expect(() => service.validateConfig({ hex: '#6366F', naming: 'tailwind' })).toThrow();
        });

        test('should validate config naming', () => {
            expect(() => service.validateConfig({ hex: '#6366F1', naming: 'tailwind' })).not.toThrow();
            expect(() => service.validateConfig({ hex: '#6366F1', naming: 'mui' })).not.toThrow();
            expect(() => service.validateConfig({ hex: '#6366F1', naming: 'invalid' })).toThrow();
        });

        test('should validate tokens structure', () => {
            const validTokens = {
                primitives: {
                    brand: { '500': '#6366F1' },
                    gray: { '50': '#FAFAFA' },
                    system: { success: '#10B981' }
                },
                semantics: {}
            };

            expect(() => service.validateTokens(validTokens)).not.toThrow();
        });

        test('should reject invalid tokens structure', () => {
            expect(() => service.validateTokens(null)).toThrow();
            expect(() => service.validateTokens('invalid')).toThrow();
        });

        test('should reject missing primitive categories', () => {
            const invalidTokens = {
                primitives: {
                    brand: { '500': '#6366F1' }
                    // Missing gray and system
                }
            };

            expect(() => service.validateTokens(invalidTokens)).toThrow('Missing primitive category');
        });
    });

    describe('Error Handling', () => {
        test('should track errors in statistics', async () => {
            mockGenerator.generatePrimitives.mockRejectedValue(new Error('Generation failed'));

            const config = { hex: '#6366F1', naming: 'tailwind' };

            await expect(service.generateTokens(config)).rejects.toThrow();

            const stats = service.getStats();
            expect(stats.errors).toBe(1);
        });

        test('should handle storage errors gracefully', async () => {
            mockStorage.saveTokens.mockRejectedValue(new Error('Storage failed'));

            const config = { hex: '#6366F1', naming: 'tailwind' };

            // Should still complete generation even if storage fails
            await expect(service.generateTokens(config)).rejects.toThrow();
        });
    });

    describe('Statistics', () => {
        test('should track all operations', async () => {
            const config = { hex: '#6366F1', naming: 'tailwind' };
            const tokens = {
                primitives: { brand: {}, gray: {}, system: {} },
                semantics: {}
            };

            await service.generateTokens(config);
            await service.importTokens(tokens, config);
            service.exportTokens(tokens, 'css');

            const stats = service.getStats();

            expect(stats.generated).toBe(1);
            expect(stats.imported).toBe(1);
            expect(stats.exported).toBe(1);
            expect(stats.errors).toBe(0);
        });
    });
});
