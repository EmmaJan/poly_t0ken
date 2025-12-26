/**
 * TokenService - Business Logic for Token Generation
 * 
 * Provides high-level token operations with:
 * - Dependency Injection (no hardcoded dependencies)
 * - Validation (pre/post generation)
 * - Event emission (via MessageBus)
 * - Persistence (via Storage)
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
const USE_TOKEN_SERVICE = false; // 🚩 ROLLBACK: Set to false to use legacy functions

// ============================================================================
// TOKEN SERVICE CLASS
// ============================================================================
class TokenService {
    /**
     * Constructor with Dependency Injection
     * @param {Object} deps - Dependencies
     * @param {Object} deps.generator - Token generator (primitives + semantics)
     * @param {Object} deps.validator - Token validator
     * @param {Object} deps.storage - Storage service
     * @param {Object} deps.messageBus - Message bus for events
     */
    constructor(deps) {
        deps = deps || {};

        this.generator = deps.generator;
        this.validator = deps.validator;
        this.storage = deps.storage;
        this.messageBus = deps.messageBus;
        this.debug = deps.debug !== undefined ? deps.debug : DEBUG;

        // Statistics
        this.stats = {
            generated: 0,
            imported: 0,
            exported: 0,
            errors: 0
        };
    }

    /**
     * Generate tokens (primitives + semantics)
     * @param {Object} config - Generation config
     * @param {string} config.hex - Primary color hex
     * @param {string} config.naming - Library naming (tailwind, mui, etc.)
     * @param {string} config.themeMode - Theme mode (light, dark, both)
     * @returns {Promise<Object>} Generated tokens
     */
    async generateTokens(config) {
        try {
            if (this.debug) {
                console.log('🎨 [TokenService] Generating tokens:', config);
            }

            // 1. Validate config
            this.validateConfig(config);

            // 2. Generate primitives
            const primitives = await this.generator.generatePrimitives(config);

            if (this.debug) {
                console.log('✅ [TokenService] Primitives generated:', Object.keys(primitives));
            }

            // 3. Generate semantics
            const semantics = await this.generator.generateSemantics(primitives, config);

            if (this.debug) {
                console.log('✅ [TokenService] Semantics generated:', Object.keys(semantics));
            }

            // 4. Validate tokens
            this.validateTokens({ primitives, semantics });

            // 5. Persist tokens
            if (this.storage) {
                await this.storage.saveTokens({ primitives, semantics, config });
            }

            // 6. Emit event
            if (this.messageBus) {
                this.messageBus.emit('tokens:generated', {
                    primitives: primitives,
                    semantics: semantics,
                    config: config
                });
            }

            this.stats.generated++;

            return { primitives, semantics };
        } catch (error) {
            this.stats.errors++;
            console.error('❌ [TokenService] Generation error:', error);
            throw error;
        }
    }

    /**
     * Import tokens to Figma
     * @param {Object} tokens - Tokens to import
     * @param {Object} config - Import config
     * @returns {Promise<void>}
     */
    async importTokens(tokens, config) {
        try {
            if (this.debug) {
                console.log('📥 [TokenService] Importing tokens:', config);
            }

            // 1. Validate tokens
            this.validateTokens(tokens);

            // 2. Import via generator (which handles Figma API)
            await this.generator.importToFigma(tokens, config);

            // 3. Emit event
            if (this.messageBus) {
                this.messageBus.emit('tokens:imported', { tokens, config });
            }

            this.stats.imported++;

            if (this.debug) {
                console.log('✅ [TokenService] Import complete');
            }
        } catch (error) {
            this.stats.errors++;
            console.error('❌ [TokenService] Import error:', error);
            throw error;
        }
    }

    /**
     * Export tokens to format
     * @param {Object} tokens - Tokens to export
     * @param {string} format - Export format (css, json, tailwind, scss)
     * @returns {string} Exported code
     */
    exportTokens(tokens, format) {
        try {
            if (this.debug) {
                console.log('📤 [TokenService] Exporting to:', format);
            }

            // Validate
            this.validateTokens(tokens);

            // Export via generator
            const exported = this.generator.exportToFormat(tokens, format);

            // Emit event
            if (this.messageBus) {
                this.messageBus.emit('tokens:exported', { tokens, format });
            }

            this.stats.exported++;

            return exported;
        } catch (error) {
            this.stats.errors++;
            console.error('❌ [TokenService] Export error:', error);
            throw error;
        }
    }

    /**
     * Validate generation config
     * @param {Object} config - Config to validate
     */
    validateConfig(config) {
        if (!config) {
            throw new Error('Config is required');
        }

        if (!config.hex || !/^#[0-9A-Fa-f]{6}$/.test(config.hex)) {
            throw new Error('Invalid hex color: ' + config.hex);
        }

        const validNaming = ['tailwind', 'mui', 'ant', 'bootstrap', 'chakra', 'custom'];
        if (!config.naming || !validNaming.includes(config.naming)) {
            throw new Error('Invalid naming: ' + config.naming);
        }

        const validThemeMode = ['light', 'dark', 'both'];
        if (config.themeMode && !validThemeMode.includes(config.themeMode)) {
            throw new Error('Invalid themeMode: ' + config.themeMode);
        }
    }

    /**
     * Validate tokens structure
     * @param {Object} tokens - Tokens to validate
     */
    validateTokens(tokens) {
        if (!tokens || typeof tokens !== 'object') {
            throw new Error('Invalid tokens structure');
        }

        // Validate primitives
        if (tokens.primitives) {
            const requiredCategories = ['brand', 'gray', 'system'];
            requiredCategories.forEach(function (cat) {
                if (!tokens.primitives[cat]) {
                    throw new Error('Missing primitive category: ' + cat);
                }
            });
        }

        // Validate semantics
        if (tokens.semantics) {
            if (typeof tokens.semantics !== 'object') {
                throw new Error('Invalid semantics structure');
            }
        }
    }

    /**
     * Get statistics
     * @returns {Object} Stats
     */
    getStats() {
        return Object.assign({}, this.stats);
    }
}

// ============================================================================
// TOKEN GENERATOR (Adapter for existing functions)
// ============================================================================
class TokenGenerator {
    constructor(deps) {
        deps = deps || {};
        this.debug = deps.debug !== undefined ? deps.debug : DEBUG;
    }

    /**
     * Generate primitives
     * @param {Object} config - Config
     * @returns {Promise<Object>} Primitives
     */
    async generatePrimitives(config) {
        // This would call existing functions:
        // - generateBrandColors(config.hex, config.naming)
        // - generateGrayscale(config.naming)
        // - generateSystemColors(config.naming)
        // - etc.

        // For now, return a placeholder
        return {
            brand: {},
            gray: {},
            system: {},
            spacing: {},
            radius: {},
            typography: {},
            border: {}
        };
    }

    /**
     * Generate semantics
     * @param {Object} primitives - Primitives
     * @param {Object} config - Config
     * @returns {Promise<Object>} Semantics
     */
    async generateSemantics(primitives, config) {
        // This would call existing function:
        // - generateSemanticTokens(primitives, { naming: config.naming })

        // For now, return a placeholder
        return {};
    }

    /**
     * Import to Figma
     * @param {Object} tokens - Tokens
     * @param {Object} config - Config
     * @returns {Promise<void>}
     */
    async importToFigma(tokens, config) {
        // This would call existing function:
        // - importTokensToFigma(tokens, config.naming, config.overwrite)
    }

    /**
     * Export to format
     * @param {Object} tokens - Tokens
     * @param {string} format - Format
     * @returns {string} Exported code
     */
    exportToFormat(tokens, format) {
        // This would call existing functions:
        // - exportToCSS(tokens)
        // - exportToJSON(tokens)
        // - etc.

        return '';
    }
}

// ============================================================================
// TOKEN VALIDATOR
// ============================================================================
class TokenValidator {
    validate(tokens) {
        // Validation logic
        return true;
    }
}

// ============================================================================
// STORAGE SERVICE (Adapter for existing functions)
// ============================================================================
class StorageService {
    async saveTokens(data) {
        // This would call existing functions:
        // - saveNamingToFile(data.config.naming)
        // - savePrimitivesTokensToFile(data.primitives)
        // - saveSemanticTokensToFile(data.semantics)
    }

    async loadTokens() {
        // This would call existing functions:
        // - getNamingFromFile()
        // - getPrimitivesTokensFromFile()
        // - getSemanticTokensFromFile()

        return null;
    }
}

// ============================================================================
// GLOBAL INSTANCE (with DI)
// ============================================================================
var tokenService = new TokenService({
    generator: new TokenGenerator({ debug: DEBUG }),
    validator: new TokenValidator(),
    storage: new StorageService(),
    messageBus: typeof messageBus !== 'undefined' ? messageBus : null,
    debug: DEBUG
});

// ============================================================================
// HELPER: Generate with fallback to legacy
// ============================================================================
async function generateTokensSafe(config) {
    if (USE_TOKEN_SERVICE) {
        return await tokenService.generateTokens(config);
    } else {
        // Legacy: call existing functions directly
        // This would be the current implementation
        return null;
    }
}

// ============================================================================
// EXPORTS (for testing)
// ============================================================================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        TokenService: TokenService,
        TokenGenerator: TokenGenerator,
        TokenValidator: TokenValidator,
        StorageService: StorageService,
        tokenService: tokenService
    };
}
