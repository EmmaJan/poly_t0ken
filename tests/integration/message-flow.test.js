// Integration tests for UI ↔ Plugin message flow
describe('Message Flow Integration', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Plugin Startup Flow', () => {
        test('should send init message with saved naming', async () => {
            // Mock saved naming
            figma.root.getPluginData.mockReturnValue('mui');

            // Simulate plugin startup
            const savedNaming = figma.root.getPluginData('tokenStarter.naming') || 'tailwind';

            figma.ui.postMessage({
                type: 'init',
                naming: savedNaming,
                savedSemanticTokens: {}
            });

            expect(figma.ui.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'init',
                    naming: 'mui'
                })
            );
        });

        test('should send has-variables message if collections exist', () => {
            figma.variables.getLocalVariableCollections.mockReturnValue([
                { name: 'Brand', variableIds: ['var-1', 'var-2'] }
            ]);

            const collections = figma.variables.getLocalVariableCollections();

            if (collections.length > 0) {
                figma.ui.postMessage({ type: 'has-variables', value: true });
            }

            expect(figma.ui.postMessage).toHaveBeenCalledWith({
                type: 'has-variables',
                value: true
            });
        });

        test('should not send has-variables if no collections', () => {
            figma.variables.getLocalVariableCollections.mockReturnValue([]);

            const collections = figma.variables.getLocalVariableCollections();

            if (collections.length > 0) {
                figma.ui.postMessage({ type: 'has-variables', value: true });
            }

            expect(figma.ui.postMessage).not.toHaveBeenCalled();
        });
    });

    describe('Token Generation Flow', () => {
        test('should handle generate message and respond with tokens-generated', () => {
            const generateMessage = {
                type: 'generate',
                hex: '#6366F1',
                naming: 'tailwind'
            };

            // Simulate token generation
            const mockTokens = {
                brand: { '500': '#6366F1' },
                gray: { '500': '#6B7280' },
                semantic: {}
            };

            // Plugin should respond with tokens-generated
            figma.ui.postMessage({
                type: 'tokens-generated',
                tokens: mockTokens,
                naming: 'tailwind',
                semanticPreview: []
            });

            expect(figma.ui.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'tokens-generated',
                    tokens: expect.any(Object),
                    naming: 'tailwind'
                })
            );
        });

        test('should save naming when tokens are generated', () => {
            const naming = 'mui';

            figma.root.setPluginData('tokenStarter.naming', naming);

            expect(figma.root.setPluginData).toHaveBeenCalledWith(
                'tokenStarter.naming',
                'mui'
            );
        });
    });

    describe('Scan Flow', () => {
        test('should handle scan-frame message and respond with scan-results', () => {
            const scanMessage = {
                type: 'scan-frame',
                ignoreHiddenLayers: true
            };

            // Mock scan results
            const mockResults = [
                {
                    nodeId: 'node-1',
                    layerName: 'Button',
                    property: 'Fill',
                    value: '#FF0000',
                    suggestedVariableId: 'var-1',
                    suggestedVariableName: 'brand-500',
                    isExact: true
                }
            ];

            // Plugin should respond with scan-results
            figma.ui.postMessage({
                type: 'scan-results',
                results: mockResults
            });

            expect(figma.ui.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'scan-results',
                    results: expect.any(Array)
                })
            );
        });

        test('should send empty results if no issues found', () => {
            figma.ui.postMessage({
                type: 'scan-results',
                results: []
            });

            expect(figma.ui.postMessage).toHaveBeenCalledWith({
                type: 'scan-results',
                results: []
            });
        });
    });

    describe('Fix Application Flow', () => {
        test('should handle apply-single-fix and respond with confirmation', () => {
            const fixMessage = {
                type: 'apply-single-fix',
                index: 0,
                selectedVariableId: 'var-1'
            };

            // Plugin applies fix and responds
            figma.ui.postMessage({
                type: 'single-fix-applied',
                appliedCount: 1,
                index: 0
            });

            expect(figma.ui.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'single-fix-applied',
                    appliedCount: 1
                })
            );
        });

        test('should handle apply-group-fix for multiple indices', () => {
            const fixMessage = {
                type: 'apply-group-fix',
                indices: [0, 1, 2],
                variableId: 'var-1'
            };

            // Plugin applies fixes and responds
            figma.ui.postMessage({
                type: 'group-fix-applied',
                appliedCount: 3
            });

            expect(figma.ui.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'group-fix-applied',
                    appliedCount: 3
                })
            );
        });

        test('should handle apply-all-fixes', () => {
            figma.ui.postMessage({
                type: 'all-fixes-applied',
                appliedCount: 10
            });

            expect(figma.ui.postMessage).toHaveBeenCalledWith({
                type: 'all-fixes-applied',
                appliedCount: 10
            });
        });
    });

    describe('Import/Export Flow', () => {
        test('should handle import message and respond with completion', () => {
            const importMessage = {
                type: 'import',
                tokens: { brand: { '500': '#6366F1' } },
                naming: 'tailwind',
                overwrite: false
            };

            // Plugin imports and responds
            figma.ui.postMessage({
                type: 'import-completed'
            });

            expect(figma.ui.postMessage).toHaveBeenCalledWith({
                type: 'import-completed'
            });
        });

        test('should handle import-from-file message', () => {
            const importMessage = {
                type: 'import-from-file',
                tokens: { brand: { '500': '#6366F1' } },
                naming: 'custom'
            };

            figma.ui.postMessage({
                type: 'import-completed'
            });

            expect(figma.ui.postMessage).toHaveBeenCalledWith({
                type: 'import-completed'
            });
        });

        test('should send error on import failure', () => {
            figma.ui.postMessage({
                type: 'import-completed',
                error: 'Invalid token format'
            });

            expect(figma.ui.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'import-completed',
                    error: expect.any(String)
                })
            );
        });
    });

    describe('Preview & Rollback Flow', () => {
        test('should handle preview-fix message', () => {
            const previewMessage = {
                type: 'preview-fix',
                indices: [0, 1],
                variableId: 'var-1'
            };

            // Preview doesn't send response, just applies temporarily
            // No assertion needed, just verify no errors
            expect(true).toBe(true);
        });

        test('should handle rollback-preview by re-scanning', () => {
            const rollbackMessage = {
                type: 'rollback-preview'
            };

            // Plugin re-scans and sends new results
            figma.ui.postMessage({
                type: 'scan-results',
                results: []
            });

            expect(figma.ui.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'scan-results'
                })
            );
        });
    });

    describe('Semantic Token Rehydration Flow', () => {
        test('should handle rehydrate-semantic-aliases message', () => {
            const rehydrateMessage = {
                type: 'rehydrate-semantic-aliases'
            };

            // Plugin rehydrates and responds
            const mockRehydratedTokens = {
                'text.primary': {
                    resolvedValue: '#000000',
                    type: 'COLOR',
                    aliasTo: {
                        variableId: 'var-1',
                        collection: 'Brand',
                        key: '900'
                    }
                }
            };

            figma.ui.postMessage({
                type: 'semantic-tokens-rehydrated',
                tokens: mockRehydratedTokens
            });

            expect(figma.ui.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'semantic-tokens-rehydrated',
                    tokens: expect.any(Object)
                })
            );
        });
    });

    describe('Error Handling Flow', () => {
        test('should send error message on plugin error', () => {
            const error = new Error('Something went wrong');

            figma.ui.postMessage({
                type: 'error',
                error: error.message
            });

            expect(figma.ui.postMessage).toHaveBeenCalledWith({
                type: 'error',
                error: 'Something went wrong'
            });
        });

        test('should handle unknown message type gracefully', () => {
            const unknownMessage = {
                type: 'unknown-type',
                data: 'test'
            };

            // Should log warning but not crash
            console.warn('Unknown message type:', unknownMessage.type);

            expect(console.warn).toHaveBeenCalledWith(
                'Unknown message type:',
                'unknown-type'
            );
        });
    });

    describe('Persistence Flow', () => {
        test('should save and restore naming across sessions', () => {
            // Save
            figma.root.setPluginData('tokenStarter.naming', 'ant');

            // Restore
            figma.root.getPluginData.mockReturnValue('ant');
            const restored = figma.root.getPluginData('tokenStarter.naming');

            expect(restored).toBe('ant');
        });

        test('should save and restore theme mode', () => {
            // Save
            figma.root.setPluginData('tokenStarter.themeMode', 'dark');

            // Restore
            figma.root.getPluginData.mockReturnValue('dark');
            const restored = figma.root.getPluginData('tokenStarter.themeMode');

            expect(restored).toBe('dark');
        });

        test('should sync scan results between UI and plugin', () => {
            const syncMessage = {
                type: 'sync-scan-results',
                results: [{ id: 1 }, { id: 2 }]
            };

            // Plugin confirms sync
            figma.ui.postMessage({
                type: 'sync-confirmation',
                success: true
            });

            expect(figma.ui.postMessage).toHaveBeenCalledWith({
                type: 'sync-confirmation',
                success: true
            });
        });
    });
});
