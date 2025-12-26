/**
 * MessageBus - Event-Driven Communication Layer
 * 
 * Provides decoupled communication between UI and Plugin via events.
 * Features:
 * - Type-safe message validation
 * - Middleware support (logging, metrics, etc.)
 * - Event history for debugging
 * - Feature flag for gradual migration
 */

// ============================================================================
// CONSTANTS (for standalone usage)
// ============================================================================
var DEBUG_LOCAL = false;
try {
    if (typeof DEBUG !== 'undefined') {
        DEBUG_LOCAL = DEBUG;
    }
} catch (e) {
    DEBUG_LOCAL = false;
}
const DEBUG = DEBUG_LOCAL;

// ============================================================================
// FEATURE FLAG
// ============================================================================
const USE_MESSAGE_BUS = false; // 🚩 ROLLBACK: Set to false to use legacy postMessage

// ============================================================================
// MESSAGE SCHEMAS (Contract-First)
// ============================================================================
const MESSAGE_SCHEMAS = {
    // Token Generation
    'generate-tokens': {
        required: ['hex', 'naming'],
        optional: ['themeMode', 'overwrite'],
        validate: function (payload) {
            if (!/^#[0-9A-Fa-f]{6}$/.test(payload.hex)) {
                throw new Error('Invalid hex color format');
            }
            const validNaming = ['tailwind', 'mui', 'ant', 'bootstrap', 'chakra', 'custom'];
            if (!validNaming.includes(payload.naming)) {
                throw new Error('Invalid naming: ' + payload.naming);
            }
        }
    },

    // Token Import
    'import-tokens': {
        required: ['tokens', 'naming'],
        optional: ['overwrite'],
        validate: function (payload) {
            if (!payload.tokens || typeof payload.tokens !== 'object') {
                throw new Error('Invalid tokens structure');
            }
        }
    },

    // Scanner
    'scan-frame': {
        required: [],
        optional: ['ignoreHiddenLayers'],
        validate: function (payload) {
            // No specific validation needed
        }
    },

    // Fixer
    'apply-single-fix': {
        required: ['index', 'selectedVariableId'],
        optional: [],
        validate: function (payload) {
            if (typeof payload.index !== 'number') {
                throw new Error('Invalid index');
            }
        }
    },

    // UI Updates
    'tokens-generated': {
        required: ['tokens'],
        optional: ['naming', 'semanticNameMap'],
        validate: function (payload) {
            // Validation handled by TokenService
        }
    },

    'scan-results': {
        required: ['results'],
        optional: ['stats'],
        validate: function (payload) {
            if (!Array.isArray(payload.results)) {
                throw new Error('Results must be an array');
            }
        }
    }
};

// ============================================================================
// MESSAGE BUS CLASS
// ============================================================================
class MessageBus {
    constructor(options) {
        options = options || {};

        this.handlers = new Map();
        this.middleware = [];
        this.history = [];
        this.maxHistory = options.maxHistory || 100;
        this.debug = options.debug !== undefined ? options.debug : DEBUG;

        // Statistics
        this.stats = {
            sent: 0,
            received: 0,
            errors: 0
        };
    }

    /**
     * Register a handler for an event type
     * @param {string} eventType - Event type to listen for
     * @param {Function} handler - Handler function
     */
    on(eventType, handler) {
        if (!this.handlers.has(eventType)) {
            this.handlers.set(eventType, []);
        }
        this.handlers.get(eventType).push(handler);

        if (this.debug) {
            console.log('📡 [MessageBus] Registered handler for:', eventType);
        }
    }

    /**
     * Unregister a handler
     * @param {string} eventType - Event type
     * @param {Function} handler - Handler to remove
     */
    off(eventType, handler) {
        if (!this.handlers.has(eventType)) return;

        const handlers = this.handlers.get(eventType);
        const index = handlers.indexOf(handler);
        if (index !== -1) {
            handlers.splice(index, 1);
        }
    }

    /**
     * Emit an event
     * @param {string} eventType - Event type
     * @param {Object} payload - Event payload
     */
    emit(eventType, payload) {
        try {
            // Validate message
            this.validate(eventType, payload);

            // Run middleware
            this.runMiddleware(eventType, payload);

            // Record in history
            this.recordHistory(eventType, payload);

            // Dispatch to handlers
            const handlers = this.handlers.get(eventType) || [];
            handlers.forEach(function (handler) {
                try {
                    handler(payload);
                } catch (handlerError) {
                    console.error('❌ [MessageBus] Handler error for ' + eventType + ':', handlerError);
                    this.stats.errors++;
                }
            }.bind(this));

            this.stats.sent++;

            if (this.debug) {
                console.log('📤 [MessageBus] Emitted:', eventType, payload);
            }
        } catch (error) {
            console.error('❌ [MessageBus] Emit error:', error);
            this.stats.errors++;
            throw error;
        }
    }

    /**
     * Validate message against schema
     * @param {string} eventType - Event type
     * @param {Object} payload - Payload to validate
     */
    validate(eventType, payload) {
        const schema = MESSAGE_SCHEMAS[eventType];

        if (!schema) {
            console.warn('⚠️ [MessageBus] No schema for event type:', eventType);
            return; // Allow unknown events (for gradual migration)
        }

        // Check required fields
        schema.required.forEach(function (field) {
            if (!(field in payload)) {
                throw new Error('Missing required field: ' + field + ' in ' + eventType);
            }
        });

        // Run custom validation
        if (schema.validate) {
            schema.validate(payload);
        }
    }

    /**
     * Run middleware chain
     * @param {string} eventType - Event type
     * @param {Object} payload - Payload
     */
    runMiddleware(eventType, payload) {
        this.middleware.forEach(function (mw) {
            try {
                mw(eventType, payload);
            } catch (mwError) {
                console.error('❌ [MessageBus] Middleware error:', mwError);
            }
        });
    }

    /**
     * Add middleware
     * @param {Function} middleware - Middleware function (eventType, payload) => void
     */
    use(middleware) {
        this.middleware.push(middleware);
    }

    /**
     * Record event in history
     * @param {string} eventType - Event type
     * @param {Object} payload - Payload
     */
    recordHistory(eventType, payload) {
        this.history.push({
            eventType: eventType,
            payload: payload,
            timestamp: Date.now()
        });

        // Trim history
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        }
    }

    /**
     * Get event history
     * @param {number} limit - Max number of events to return
     * @returns {Array} Event history
     */
    getHistory(limit) {
        limit = limit || 10;
        return this.history.slice(-limit);
    }

    /**
     * Get statistics
     * @returns {Object} Stats
     */
    getStats() {
        return Object.assign({}, this.stats);
    }

    /**
     * Clear all handlers
     */
    clear() {
        this.handlers.clear();
        if (this.debug) {
            console.log('🧹 [MessageBus] Cleared all handlers');
        }
    }
}

// ============================================================================
// GLOBAL INSTANCE
// ============================================================================
var messageBus = new MessageBus({ debug: DEBUG });

// ============================================================================
// MIDDLEWARE: Logging
// ============================================================================
if (DEBUG) {
    messageBus.use(function loggingMiddleware(eventType, payload) {
        console.log('📊 [MessageBus] Event:', eventType, 'Payload size:', JSON.stringify(payload).length);
    });
}

// ============================================================================
// MIDDLEWARE: Metrics (optional)
// ============================================================================
// messageBus.use(function metricsMiddleware(eventType, payload) {
//   // Send to analytics
// });

// ============================================================================
// HELPER: Send to UI (Plugin → UI)
// ============================================================================
function sendToUI(eventType, payload) {
    if (USE_MESSAGE_BUS) {
        // New way: via MessageBus
        messageBus.emit(eventType, payload);

        // Still send via Figma API (MessageBus is for validation/logging)
        figma.ui.postMessage(Object.assign({ type: eventType }, payload));
    } else {
        // Legacy way: direct postMessage
        postToUI(eventType, payload);
    }
}

// ============================================================================
// HELPER: Send to Plugin (UI → Plugin)
// ============================================================================
// This would be in ui.html:
// function sendToPlugin(eventType, payload) {
//   if (USE_MESSAGE_BUS) {
//     messageBus.emit(eventType, payload);
//     parent.postMessage({ pluginMessage: Object.assign({ type: eventType }, payload) }, '*');
//   } else {
//     parent.postMessage({ pluginMessage: Object.assign({ type: eventType }, payload) }, '*');
//   }
// }

// ============================================================================
// EXPORTS (for testing)
// ============================================================================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        MessageBus: MessageBus,
        MESSAGE_SCHEMAS: MESSAGE_SCHEMAS,
        messageBus: messageBus
    };
}
