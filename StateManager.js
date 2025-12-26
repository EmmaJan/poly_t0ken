/**
 * StateManager - Centralized State Management
 * 
 * Provides single source of truth for application state with:
 * - Immutable state access
 * - Validation on updates
 * - Undo/redo support
 * - Reactive listeners
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
const USE_STATE_MANAGER = false; // 🚩 ROLLBACK: Set to false to use legacy global variables

// ============================================================================
// STATE SCHEMAS (Validation)
// ============================================================================
const STATE_SCHEMAS = {
    wizard: {
        currentStep: { type: 'number', min: 0, max: 4 },
        currentNaming: { type: 'string', enum: ['tailwind', 'mui', 'ant', 'bootstrap', 'chakra', 'custom'] },
        currentColor: { type: 'string', pattern: /^#[0-9A-Fa-f]{6}$/ },
        currentThemeMode: { type: 'string', enum: ['light', 'dark', 'both'] }
    },

    tokens: {
        current: { type: 'object', nullable: true },
        existing: { type: 'object', nullable: true },
        hasExisting: { type: 'boolean' }
    },

    scan: {
        results: { type: 'array' },
        appliedIndices: { type: 'array' },
        ignoredIndices: { type: 'array' },
        isScanning: { type: 'boolean' }
    }
};

// ============================================================================
// HELPER: Deep Clone
// ============================================================================
function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(function (item) { return deepClone(item); });

    var cloned = {};
    for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
            cloned[key] = deepClone(obj[key]);
        }
    }
    return cloned;
}

// ============================================================================
// HELPER: Get/Set Path
// ============================================================================
function getPath(obj, path) {
    var parts = path.split('.');
    var current = obj;

    for (var i = 0; i < parts.length; i++) {
        if (current === null || current === undefined) return undefined;
        current = current[parts[i]];
    }

    return current;
}

function setPath(obj, path, value) {
    var parts = path.split('.');
    var current = obj;

    for (var i = 0; i < parts.length - 1; i++) {
        if (!(parts[i] in current)) {
            current[parts[i]] = {};
        }
        current = current[parts[i]];
    }

    current[parts[parts.length - 1]] = value;
}

// ============================================================================
// STATE MANAGER CLASS
// ============================================================================
class StateManager {
    constructor(initialState, options) {
        options = options || {};

        this.state = initialState || {};
        this.listeners = [];
        this.history = [];
        this.maxHistory = options.maxHistory || 50;
        this.debug = options.debug !== undefined ? options.debug : DEBUG;

        // Statistics
        this.stats = {
            updates: 0,
            undos: 0,
            redos: 0
        };
    }

    /**
     * Get state value (immutable)
     * @param {string} path - Dot-separated path (e.g., 'wizard.currentStep')
     * @returns {*} State value (cloned)
     */
    getState(path) {
        var value = getPath(this.state, path);
        return deepClone(value);
    }

    /**
     * Set state value
     * @param {string} path - Dot-separated path
     * @param {*} value - New value
     * @param {Object} options - Options { validate, silent, saveHistory }
     */
    setState(path, value, options) {
        options = options || {};
        var validate = options.validate !== false;
        var silent = options.silent === true;
        var saveHistory = options.saveHistory !== false;

        try {
            // Validation
            if (validate) {
                this.validateState(path, value);
            }

            // Save history (for undo)
            if (saveHistory) {
                this.saveHistory();
            }

            // Get old value
            var oldValue = getPath(this.state, path);

            // Update state
            setPath(this.state, path, value);

            this.stats.updates++;

            if (this.debug) {
                console.log('🔄 [StateManager] Updated:', path, 'Old:', oldValue, 'New:', value);
            }

            // Notify listeners
            if (!silent) {
                this.notifyListeners(path, value, oldValue);
            }
        } catch (error) {
            console.error('❌ [StateManager] setState error:', error);
            throw error;
        }
    }

    /**
     * Batch update (multiple setState in one transaction)
     * @param {Object} updates - Map of path → value
     */
    batchUpdate(updates) {
        // Save history once
        this.saveHistory();

        // Apply all updates silently
        for (var path in updates) {
            if (updates.hasOwnProperty(path)) {
                this.setState(path, updates[path], { silent: true, saveHistory: false });
            }
        }

        // Notify listeners once
        this.notifyListeners('*', this.state, null);
    }

    /**
     * Validate state value against schema
     * @param {string} path - Path
     * @param {*} value - Value to validate
     */
    validateState(path, value) {
        var parts = path.split('.');
        var category = parts[0];
        var field = parts[1];

        var schema = STATE_SCHEMAS[category];
        if (!schema) {
            if (this.debug) {
                console.warn('⚠️ [StateManager] No schema for category:', category);
            }
            return; // Allow unknown paths (for gradual migration)
        }

        var fieldSchema = schema[field];
        if (!fieldSchema) {
            if (this.debug) {
                console.warn('⚠️ [StateManager] No schema for field:', field);
            }
            return;
        }

        // Type validation
        if (fieldSchema.type) {
            var actualType = Array.isArray(value) ? 'array' : typeof value;
            if (actualType !== fieldSchema.type && !(fieldSchema.nullable && value === null)) {
                throw new Error('Invalid type for ' + path + ': expected ' + fieldSchema.type + ', got ' + actualType);
            }
        }

        // Enum validation
        if (fieldSchema.enum && fieldSchema.enum.indexOf(value) === -1) {
            throw new Error('Invalid value for ' + path + ': must be one of ' + fieldSchema.enum.join(', '));
        }

        // Pattern validation
        if (fieldSchema.pattern && !fieldSchema.pattern.test(value)) {
            throw new Error('Invalid format for ' + path + ': must match pattern ' + fieldSchema.pattern);
        }

        // Range validation
        if (fieldSchema.min !== undefined && value < fieldSchema.min) {
            throw new Error('Value for ' + path + ' must be >= ' + fieldSchema.min);
        }
        if (fieldSchema.max !== undefined && value > fieldSchema.max) {
            throw new Error('Value for ' + path + ' must be <= ' + fieldSchema.max);
        }
    }

    /**
     * Register a listener
     * @param {string} path - Path to listen to ('*' for all)
     * @param {Function} callback - Callback(path, newValue, oldValue)
     */
    on(path, callback) {
        this.listeners.push({ path: path, callback: callback });

        if (this.debug) {
            console.log('👂 [StateManager] Registered listener for:', path);
        }
    }

    /**
     * Unregister a listener
     * @param {Function} callback - Callback to remove
     */
    off(callback) {
        this.listeners = this.listeners.filter(function (l) {
            return l.callback !== callback;
        });
    }

    /**
     * Notify listeners of state change
     * @param {string} path - Changed path
     * @param {*} newValue - New value
     * @param {*} oldValue - Old value
     */
    notifyListeners(path, newValue, oldValue) {
        this.listeners.forEach(function (listener) {
            if (listener.path === '*' || listener.path === path || path.startsWith(listener.path + '.')) {
                try {
                    listener.callback(path, newValue, oldValue);
                } catch (error) {
                    console.error('❌ [StateManager] Listener error:', error);
                }
            }
        });
    }

    /**
     * Save current state to history
     */
    saveHistory() {
        this.history.push(deepClone(this.state));

        // Trim history
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        }
    }

    /**
     * Undo last change
     * @returns {boolean} True if undo was successful
     */
    undo() {
        if (this.history.length === 0) {
            if (this.debug) {
                console.warn('⚠️ [StateManager] No history to undo');
            }
            return false;
        }

        this.state = this.history.pop();
        this.stats.undos++;

        if (this.debug) {
            console.log('↩️ [StateManager] Undo successful');
        }

        // Notify listeners
        this.notifyListeners('*', this.state, null);

        return true;
    }

    /**
     * Get entire state (immutable)
     * @returns {Object} Cloned state
     */
    getAll() {
        return deepClone(this.state);
    }

    /**
     * Reset state to initial
     * @param {Object} initialState - New initial state
     */
    reset(initialState) {
        this.state = initialState || {};
        this.history = [];

        if (this.debug) {
            console.log('🔄 [StateManager] State reset');
        }

        this.notifyListeners('*', this.state, null);
    }

    /**
     * Get statistics
     * @returns {Object} Stats
     */
    getStats() {
        return Object.assign({}, this.stats, {
            historySize: this.history.length,
            listenerCount: this.listeners.length
        });
    }
}

// ============================================================================
// GLOBAL INSTANCE
// ============================================================================
var stateManager = new StateManager({
    wizard: {
        currentStep: 0,
        currentNaming: 'tailwind',
        currentColor: '#6366F1',
        currentThemeMode: 'light'
    },
    tokens: {
        current: null,
        existing: null,
        hasExisting: false
    },
    scan: {
        results: [],
        appliedIndices: [],
        ignoredIndices: [],
        isScanning: false
    }
}, { debug: DEBUG });

// ============================================================================
// HELPER: Get/Set with fallback to legacy globals
// ============================================================================
function getGlobalState(path) {
    if (USE_STATE_MANAGER) {
        return stateManager.getState(path);
    } else {
        // Legacy: map to global variables
        // This would need to be implemented based on actual global vars
        return undefined;
    }
}

function setGlobalState(path, value) {
    if (USE_STATE_MANAGER) {
        stateManager.setState(path, value);
    } else {
        // Legacy: update global variables
        // This would need to be implemented based on actual global vars
    }
}

// ============================================================================
// EXPORTS (for testing)
// ============================================================================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        StateManager: StateManager,
        STATE_SCHEMAS: STATE_SCHEMAS,
        stateManager: stateManager,
        deepClone: deepClone,
        getPath: getPath,
        setPath: setPath
    };
}
