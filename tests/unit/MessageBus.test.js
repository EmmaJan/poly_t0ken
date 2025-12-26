/**
 * Tests for MessageBus
 */

const { MessageBus, MESSAGE_SCHEMAS } = require('../../MessageBus');

describe('MessageBus', () => {
    let bus;

    beforeEach(() => {
        bus = new MessageBus({ debug: false });
    });

    afterEach(() => {
        bus.clear();
    });

    describe('Event Registration', () => {
        test('should register handler for event type', () => {
            const handler = jest.fn();
            bus.on('test-event', handler);

            bus.emit('test-event', { data: 'test' });

            expect(handler).toHaveBeenCalledWith({ data: 'test' });
        });

        test('should support multiple handlers for same event', () => {
            const handler1 = jest.fn();
            const handler2 = jest.fn();

            bus.on('test-event', handler1);
            bus.on('test-event', handler2);

            bus.emit('test-event', { data: 'test' });

            expect(handler1).toHaveBeenCalled();
            expect(handler2).toHaveBeenCalled();
        });

        test('should unregister handler', () => {
            const handler = jest.fn();
            bus.on('test-event', handler);
            bus.off('test-event', handler);

            bus.emit('test-event', { data: 'test' });

            expect(handler).not.toHaveBeenCalled();
        });
    });

    describe('Message Validation', () => {
        test('should validate required fields', () => {
            expect(() => {
                bus.emit('generate-tokens', { naming: 'tailwind' }); // Missing hex
            }).toThrow('Missing required field: hex');
        });

        test('should validate hex color format', () => {
            expect(() => {
                bus.emit('generate-tokens', { hex: 'invalid', naming: 'tailwind' });
            }).toThrow('Invalid hex color format');
        });

        test('should validate naming enum', () => {
            expect(() => {
                bus.emit('generate-tokens', { hex: '#6366F1', naming: 'invalid' });
            }).toThrow('Invalid naming');
        });

        test('should allow valid messages', () => {
            expect(() => {
                bus.emit('generate-tokens', { hex: '#6366F1', naming: 'tailwind' });
            }).not.toThrow();
        });
    });

    describe('Middleware', () => {
        test('should run middleware before handlers', () => {
            const order = [];

            bus.use((eventType, payload) => {
                order.push('middleware');
            });

            bus.on('test-event', () => {
                order.push('handler');
            });

            bus.emit('test-event', {});

            expect(order).toEqual(['middleware', 'handler']);
        });

        test('should handle middleware errors gracefully', () => {
            bus.use(() => {
                throw new Error('Middleware error');
            });

            const handler = jest.fn();
            bus.on('test-event', handler);

            expect(() => {
                bus.emit('test-event', {});
            }).not.toThrow();

            expect(handler).toHaveBeenCalled();
        });
    });

    describe('Event History', () => {
        test('should record events in history', () => {
            bus.emit('test-event', { data: 'test1' });
            bus.emit('test-event', { data: 'test2' });

            const history = bus.getHistory();

            expect(history).toHaveLength(2);
            expect(history[0].eventType).toBe('test-event');
            expect(history[0].payload).toEqual({ data: 'test1' });
        });

        test('should limit history size', () => {
            const smallBus = new MessageBus({ maxHistory: 5, debug: false });

            for (let i = 0; i < 10; i++) {
                smallBus.emit('test-event', { index: i });
            }

            const history = smallBus.getHistory(10);

            expect(history).toHaveLength(5);
            expect(history[0].payload.index).toBe(5); // Oldest kept
        });
    });

    describe('Statistics', () => {
        test('should track sent events', () => {
            bus.emit('test-event', {});
            bus.emit('test-event', {});

            const stats = bus.getStats();

            expect(stats.sent).toBe(2);
        });

        test('should track errors', () => {
            bus.on('test-event', () => {
                throw new Error('Handler error');
            });

            bus.emit('test-event', {});

            const stats = bus.getStats();

            expect(stats.errors).toBe(1);
        });
    });
});
