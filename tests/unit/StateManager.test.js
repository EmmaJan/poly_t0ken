/**
 * Tests for StateManager
 */

const { StateManager, STATE_SCHEMAS, deepClone, getPath, setPath } = require('../../StateManager');

describe('StateManager', () => {
    let manager;

    beforeEach(() => {
        manager = new StateManager({
            wizard: {
                currentStep: 0,
                currentNaming: 'tailwind',
                currentColor: '#6366F1'
            },
            tokens: {
                current: null
            }
        }, { debug: false });
    });

    describe('State Access', () => {
        test('should get state value', () => {
            const step = manager.getState('wizard.currentStep');
            expect(step).toBe(0);
        });

        test('should return cloned value (immutable)', () => {
            const wizard = manager.getState('wizard');
            wizard.currentStep = 999;

            const step = manager.getState('wizard.currentStep');
            expect(step).toBe(0); // Not modified
        });

        test('should set state value', () => {
            manager.setState('wizard.currentStep', 1);

            const step = manager.getState('wizard.currentStep');
            expect(step).toBe(1);
        });
    });

    describe('Validation', () => {
        test('should validate type', () => {
            expect(() => {
                manager.setState('wizard.currentStep', 'invalid');
            }).toThrow('Invalid type');
        });

        test('should validate enum', () => {
            expect(() => {
                manager.setState('wizard.currentNaming', 'invalid');
            }).toThrow('Invalid value');
        });

        test('should validate pattern', () => {
            expect(() => {
                manager.setState('wizard.currentColor', 'invalid');
            }).toThrow('Invalid format');
        });

        test('should validate range', () => {
            expect(() => {
                manager.setState('wizard.currentStep', 10);
            }).toThrow('must be <=');
        });

        test('should allow valid values', () => {
            expect(() => {
                manager.setState('wizard.currentStep', 2);
                manager.setState('wizard.currentNaming', 'mui');
                manager.setState('wizard.currentColor', '#FF0000');
            }).not.toThrow();
        });

        test('should skip validation if disabled', () => {
            expect(() => {
                manager.setState('wizard.currentStep', 'invalid', { validate: false });
            }).not.toThrow();
        });
    });

    describe('Listeners', () => {
        test('should notify listeners on change', () => {
            const listener = jest.fn();
            manager.on('wizard.currentStep', listener);

            manager.setState('wizard.currentStep', 1);

            expect(listener).toHaveBeenCalledWith('wizard.currentStep', 1, 0);
        });

        test('should support wildcard listeners', () => {
            const listener = jest.fn();
            manager.on('*', listener);

            manager.setState('wizard.currentStep', 1);

            expect(listener).toHaveBeenCalled();
        });

        test('should support parent path listeners', () => {
            const listener = jest.fn();
            manager.on('wizard', listener);

            manager.setState('wizard.currentStep', 1);

            expect(listener).toHaveBeenCalled();
        });

        test('should not notify if silent', () => {
            const listener = jest.fn();
            manager.on('wizard.currentStep', listener);

            manager.setState('wizard.currentStep', 1, { silent: true });

            expect(listener).not.toHaveBeenCalled();
        });

        test('should unregister listener', () => {
            const listener = jest.fn();
            manager.on('wizard.currentStep', listener);
            manager.off(listener);

            manager.setState('wizard.currentStep', 1);

            expect(listener).not.toHaveBeenCalled();
        });
    });

    describe('Batch Update', () => {
        test('should update multiple values', () => {
            manager.batchUpdate({
                'wizard.currentStep': 2,
                'wizard.currentNaming': 'mui',
                'wizard.currentColor': '#FF0000'
            });

            expect(manager.getState('wizard.currentStep')).toBe(2);
            expect(manager.getState('wizard.currentNaming')).toBe('mui');
            expect(manager.getState('wizard.currentColor')).toBe('#FF0000');
        });

        test('should notify listeners once', () => {
            const listener = jest.fn();
            manager.on('*', listener);

            manager.batchUpdate({
                'wizard.currentStep': 2,
                'wizard.currentNaming': 'mui'
            });

            expect(listener).toHaveBeenCalledTimes(1);
        });
    });

    describe('Undo/Redo', () => {
        test('should undo last change', () => {
            manager.setState('wizard.currentStep', 1);
            manager.setState('wizard.currentStep', 2);

            manager.undo();

            expect(manager.getState('wizard.currentStep')).toBe(1);
        });

        test('should undo multiple changes', () => {
            manager.setState('wizard.currentStep', 1);
            manager.setState('wizard.currentStep', 2);
            manager.setState('wizard.currentStep', 3);

            manager.undo();
            manager.undo();

            expect(manager.getState('wizard.currentStep')).toBe(1);
        });

        test('should return false if no history', () => {
            const result = manager.undo();
            expect(result).toBe(false);
        });

        test('should notify listeners on undo', () => {
            const listener = jest.fn();
            manager.on('*', listener);

            manager.setState('wizard.currentStep', 1);
            listener.mockClear();

            manager.undo();

            expect(listener).toHaveBeenCalled();
        });
    });

    describe('Helpers', () => {
        test('deepClone should clone objects', () => {
            const obj = { a: { b: { c: 1 } } };
            const cloned = deepClone(obj);

            cloned.a.b.c = 999;

            expect(obj.a.b.c).toBe(1);
        });

        test('getPath should get nested value', () => {
            const obj = { a: { b: { c: 1 } } };
            expect(getPath(obj, 'a.b.c')).toBe(1);
        });

        test('setPath should set nested value', () => {
            const obj = {};
            setPath(obj, 'a.b.c', 1);
            expect(obj.a.b.c).toBe(1);
        });
    });

    describe('Statistics', () => {
        test('should track updates', () => {
            manager.setState('wizard.currentStep', 1);
            manager.setState('wizard.currentStep', 2);

            const stats = manager.getStats();

            expect(stats.updates).toBe(2);
        });

        test('should track undos', () => {
            manager.setState('wizard.currentStep', 1);
            manager.undo();

            const stats = manager.getStats();

            expect(stats.undos).toBe(1);
        });

        test('should track history size', () => {
            manager.setState('wizard.currentStep', 1);
            manager.setState('wizard.currentStep', 2);

            const stats = manager.getStats();

            expect(stats.historySize).toBe(2);
        });
    });
});
