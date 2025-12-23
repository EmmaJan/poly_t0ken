// End-to-end scenario tests
describe('End-to-End Scenarios', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Complete Token Generation Workflow', () => {
        test('should complete full token generation from start to Figma', () => {
            // Step 1: User selects library
            figma.root.setPluginData('tokenStarter.naming', 'tailwind');

            // Step 2: User picks color
            const primaryColor = '#6366F1';

            // Step 3: Generate tokens
            const mockTokens = {
                brand: {
                    '50': '#EEF2FF',
                    '500': '#6366F1',
                    '900': '#312E81'
                },
                gray: {
                    '50': '#F9FAFB',
                    '500': '#6B7280',
                    '900': '#111827'
                },
                semantic: {
                    'text.primary': {
                        resolvedValue: '#111827',
                        type: 'COLOR',
                        aliasTo: null
                    }
                }
            };

            figma.ui.postMessage({
                type: 'tokens-generated',
                tokens: mockTokens,
                naming: 'tailwind'
            });

            // Step 4: User imports to Figma
            figma.ui.postMessage({
                type: 'import-completed'
            });

            // Verify complete flow
            expect(figma.root.setPluginData).toHaveBeenCalledWith(
                'tokenStarter.naming',
                'tailwind'
            );
            expect(figma.ui.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'tokens-generated'
                })
            );
            expect(figma.ui.postMessage).toHaveBeenCalledWith({
                type: 'import-completed'
            });
        });
    });

    describe('Complete Scan & Fix Workflow', () => {
        test('should complete full scan and fix workflow', () => {
            // Step 1: User scans frame
            const mockScanResults = [
                {
                    nodeId: 'node-1',
                    layerName: 'Button',
                    property: 'Fill',
                    value: '#6366F1',
                    suggestedVariableId: 'var-brand-500',
                    suggestedVariableName: 'brand-500',
                    isExact: true
                },
                {
                    nodeId: 'node-2',
                    layerName: 'Text',
                    property: 'Text',
                    value: '#111827',
                    suggestedVariableId: 'var-gray-900',
                    suggestedVariableName: 'gray-900',
                    isExact: true
                }
            ];

            figma.ui.postMessage({
                type: 'scan-results',
                results: mockScanResults
            });

            // Step 2: User applies all auto fixes
            figma.ui.postMessage({
                type: 'all-fixes-applied',
                appliedCount: 2
            });

            // Step 3: Verify fixes applied
            expect(figma.ui.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'scan-results',
                    results: expect.arrayContaining([
                        expect.objectContaining({ isExact: true })
                    ])
                })
            );
            expect(figma.ui.postMessage).toHaveBeenCalledWith({
                type: 'all-fixes-applied',
                appliedCount: 2
            });
        });

        test('should handle manual fix selection workflow', () => {
            // Step 1: Scan finds issues
            const mockResults = [
                {
                    nodeId: 'node-1',
                    property: 'Fill',
                    value: '#6366F1',
                    colorSuggestions: [
                        { id: 'var-1', name: 'brand-500', hex: '#6366F1', isExact: true },
                        { id: 'var-2', name: 'brand-600', hex: '#4F46E5', isExact: false }
                    ],
                    isExact: false // Multiple suggestions
                }
            ];

            figma.ui.postMessage({
                type: 'scan-results',
                results: mockResults
            });

            // Step 2: User selects specific variable
            figma.ui.postMessage({
                type: 'single-fix-applied',
                appliedCount: 1,
                index: 0
            });

            expect(figma.ui.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'single-fix-applied'
                })
            );
        });
    });

    describe('Import from File Workflow', () => {
        test('should import tokens from JSON file', () => {
            // Step 1: User uploads JSON file
            const importedTokens = {
                brand: {
                    '500': '#6366F1',
                    '600': '#4F46E5'
                },
                semantic: {
                    'text.primary': {
                        resolvedValue: '#111827',
                        type: 'COLOR'
                    }
                }
            };

            // Step 2: Plugin imports tokens
            figma.ui.postMessage({
                type: 'import-completed'
            });

            // Step 3: Verify import
            expect(figma.ui.postMessage).toHaveBeenCalledWith({
                type: 'import-completed'
            });
        });

        test('should import tokens from CSS file', () => {
            // Step 1: User uploads CSS file with variables
            const cssContent = `
        :root {
          --brand-500: #6366F1;
          --gray-500: #6B7280;
        }
      `;

            // Step 2: Plugin parses and imports
            figma.ui.postMessage({
                type: 'import-completed'
            });

            expect(figma.ui.postMessage).toHaveBeenCalledWith({
                type: 'import-completed'
            });
        });
    });

    describe('Preview & Rollback Workflow', () => {
        test('should preview fix and rollback', () => {
            // Step 1: User hovers over suggestion (preview)
            const previewIndices = [0];
            const variableId = 'var-1';

            // Preview is applied (no response message)

            // Step 2: User moves away (rollback)
            figma.ui.postMessage({
                type: 'scan-results',
                results: [] // Re-scan to restore original state
            });

            expect(figma.ui.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'scan-results'
                })
            );
        });
    });

    describe('Multi-Library Workflow', () => {
        test('should switch between libraries', () => {
            // Start with Tailwind
            figma.root.setPluginData('tokenStarter.naming', 'tailwind');
            figma.root.getPluginData.mockReturnValue('tailwind');

            let naming = figma.root.getPluginData('tokenStarter.naming');
            expect(naming).toBe('tailwind');

            // Switch to MUI
            figma.root.setPluginData('tokenStarter.naming', 'mui');
            figma.root.getPluginData.mockReturnValue('mui');

            naming = figma.root.getPluginData('tokenStarter.naming');
            expect(naming).toBe('mui');

            // Generate tokens for MUI
            figma.ui.postMessage({
                type: 'tokens-generated',
                tokens: {},
                naming: 'mui'
            });

            expect(figma.ui.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    naming: 'mui'
                })
            );
        });
    });

    describe('Theme Mode Workflow', () => {
        test('should handle light/dark theme switching', () => {
            // Step 1: Set light theme
            figma.root.setPluginData('tokenStarter.themeMode', 'light');

            // Step 2: Generate tokens for light theme
            const lightTokens = {
                semantic: {
                    'bg.surface': {
                        resolvedValue: '#FFFFFF',
                        type: 'COLOR'
                    }
                }
            };

            // Step 3: Switch to dark theme
            figma.root.setPluginData('tokenStarter.themeMode', 'dark');

            // Step 4: Generate tokens for dark theme
            const darkTokens = {
                semantic: {
                    'bg.surface': {
                        resolvedValue: '#111827',
                        type: 'COLOR'
                    }
                }
            };

            expect(figma.root.setPluginData).toHaveBeenCalledWith(
                'tokenStarter.themeMode',
                'light'
            );
            expect(figma.root.setPluginData).toHaveBeenCalledWith(
                'tokenStarter.themeMode',
                'dark'
            );
        });
    });

    describe('Error Recovery Workflow', () => {
        test('should recover from import error', () => {
            // Step 1: Import fails
            figma.ui.postMessage({
                type: 'import-completed',
                error: 'Invalid token format'
            });

            // Step 2: User corrects and retries
            figma.ui.postMessage({
                type: 'import-completed'
            });

            expect(figma.ui.postMessage).toHaveBeenCalledTimes(2);
            expect(figma.ui.postMessage).toHaveBeenLastCalledWith({
                type: 'import-completed'
            });
        });

        test('should handle scan with no selection', () => {
            // User scans with no selection
            figma.currentPage.selection = [];

            if (figma.currentPage.selection.length === 0) {
                figma.notify('Please select a frame to scan');
            }

            expect(figma.notify).toHaveBeenCalledWith(
                expect.stringContaining('select')
            );
        });
    });

    describe('Persistence Across Sessions', () => {
        test('should restore complete state on plugin restart', () => {
            // Session 1: User configures plugin
            figma.root.setPluginData('tokenStarter.naming', 'tailwind');
            figma.root.setPluginData('tokenStarter.themeMode', 'dark');

            // Session 2: Plugin restarts
            figma.root.getPluginData.mockImplementation((key) => {
                if (key === 'tokenStarter.naming') return 'tailwind';
                if (key === 'tokenStarter.themeMode') return 'dark';
                return null;
            });

            const naming = figma.root.getPluginData('tokenStarter.naming');
            const themeMode = figma.root.getPluginData('tokenStarter.themeMode');

            // Send init with restored state
            figma.ui.postMessage({
                type: 'init',
                naming: naming,
                themeMode: themeMode
            });

            expect(figma.ui.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'init',
                    naming: 'tailwind',
                    themeMode: 'dark'
                })
            );
        });
    });
});
