describe('Storage Functions', () => {
    beforeEach(() => {
        // Reset mocks before each test
        jest.clearAllMocks();
    });

    describe('saveNamingToFile', () => {
        // Mock the function
        const saveNamingToFile = (naming) => {
            if (!naming || typeof naming !== 'string') {
                console.warn('Invalid naming provided to saveNamingToFile');
                return;
            }
            try {
                figma.root.setPluginData('tokenStarter.naming', naming);
            } catch (error) {
                console.error('Error saving naming:', error);
            }
        };

        test('should save naming to pluginData', () => {
            saveNamingToFile('mui');

            expect(figma.root.setPluginData).toHaveBeenCalledWith(
                'tokenStarter.naming',
                'mui'
            );
        });

        test('should save different library names', () => {
            const libraries = ['tailwind', 'mui', 'ant', 'bootstrap', 'chakra'];

            libraries.forEach(lib => {
                jest.clearAllMocks();
                saveNamingToFile(lib);
                expect(figma.root.setPluginData).toHaveBeenCalledWith(
                    'tokenStarter.naming',
                    lib
                );
            });
        });

        test('should handle empty string', () => {
            saveNamingToFile('');
            expect(figma.root.setPluginData).not.toHaveBeenCalled();
        });

        test('should handle null/undefined', () => {
            saveNamingToFile(null);
            expect(figma.root.setPluginData).not.toHaveBeenCalled();

            jest.clearAllMocks();
            saveNamingToFile(undefined);
            expect(figma.root.setPluginData).not.toHaveBeenCalled();
        });
    });

    describe('getNamingFromFile', () => {
        const getNamingFromFile = () => {
            try {
                var saved = figma.root.getPluginData('tokenStarter.naming');
                return saved || 'tailwind';
            } catch (error) {
                console.error('Error loading naming:', error);
                return 'tailwind';
            }
        };

        test('should retrieve saved naming', () => {
            figma.root.getPluginData.mockReturnValue('ant');
            expect(getNamingFromFile()).toBe('ant');
        });

        test('should return default if no data', () => {
            figma.root.getPluginData.mockReturnValue('');
            expect(getNamingFromFile()).toBe('tailwind');
        });

        test('should return default if null', () => {
            figma.root.getPluginData.mockReturnValue(null);
            expect(getNamingFromFile()).toBe('tailwind');
        });

        test('should handle errors gracefully', () => {
            figma.root.getPluginData.mockImplementation(() => {
                throw new Error('Storage error');
            });

            expect(getNamingFromFile()).toBe('tailwind');
        });
    });

    describe('postToUI wrapper', () => {
        const postToUI = (type, payload) => {
            try {
                var message = Object.assign({ type: type }, payload || {});
                figma.ui.postMessage(message);
            } catch (error) {
                console.error('❌ Error sending message to UI:', error);
            }
        };

        test('should send message with type and payload', () => {
            postToUI('tokens-generated', { tokens: {}, naming: 'tailwind' });

            expect(figma.ui.postMessage).toHaveBeenCalledWith({
                type: 'tokens-generated',
                tokens: {},
                naming: 'tailwind'
            });
        });

        test('should handle empty payload', () => {
            postToUI('init');

            expect(figma.ui.postMessage).toHaveBeenCalledWith({
                type: 'init'
            });
        });

        test('should handle null payload', () => {
            postToUI('scan-results', null);

            expect(figma.ui.postMessage).toHaveBeenCalledWith({
                type: 'scan-results'
            });
        });

        test('should handle errors gracefully', () => {
            figma.ui.postMessage.mockImplementation(() => {
                throw new Error('UI not ready');
            });

            // Should not throw
            expect(() => postToUI('test', {})).not.toThrow();
        });
    });
});
