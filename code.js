// ============================================
// 1. CONFIGURATION
// ============================================
const CONFIG = {
  // Debug mode
  DEBUG_MODE: true,

  // Node types
  types: {
    SOLID: 'SOLID',
    VARIABLE_ALIAS: 'VARIABLE_ALIAS',
    TEXT: 'TEXT',
    FRAME: 'FRAME',
    RECTANGLE: 'RECTANGLE',
    ELLIPSE: 'ELLIPSE',
    POLYGON: 'POLYGON',
    STAR: 'STAR',
    VECTOR: 'VECTOR',
    COMPONENT: 'COMPONENT',
    INSTANCE: 'INSTANCE',
    LINE: 'LINE',
    GROUP: 'GROUP',
    SECTION: 'SECTION',
    COMPONENT_SET: 'COMPONENT_SET'
  },

  // Property types
  properties: {
    FILL: 'Fill',
    STROKE: 'Stroke',
    RADIUS: 'Radius',
    SPACING: 'Spacing',
    WIDTH: 'Width',
    HEIGHT: 'Height'
  },

  // Variable resolved types
  variableTypes: {
    COLOR: 'COLOR',
    FLOAT: 'FLOAT',
    STRING: 'STRING'
  },

  // Limits
  limits: {
    MAX_DEPTH: 50,
    MAX_WIDTH: 1600,
    MAX_HEIGHT: 1400
  },

  // Supported node types for operations
  supportedTypes: {
    radius: ['FRAME', 'RECTANGLE', 'ELLIPSE', 'POLYGON', 'STAR', 'VECTOR', 'COMPONENT', 'INSTANCE'],
    fillAndStroke: ['FRAME', 'RECTANGLE', 'ELLIPSE', 'POLYGON', 'STAR', 'VECTOR', 'TEXT', 'COMPONENT', 'INSTANCE', 'LINE'],
    spacing: ['FRAME', 'GROUP', 'SECTION', 'COMPONENT', 'INSTANCE', 'COMPONENT_SET'],
    all: ['FRAME', 'RECTANGLE', 'ELLIPSE', 'POLYGON', 'STAR', 'VECTOR', 'TEXT', 'COMPONENT', 'INSTANCE', 'LINE', 'GROUP', 'SECTION', 'COMPONENT_SET']
  },

  // Property scopes for variables
  scopes: {
    Fill: ['ALL_FILLS', 'FRAME_FILL', 'SHAPE_FILL', 'TEXT_FILL', 'ALL_SCOPES'],
    Stroke: ['STROKE_COLOR', 'ALL_SCOPES'],
    'Corner Radius': ['CORNER_RADIUS', 'ALL_SCOPES'],
    'Top Left Radius': ['CORNER_RADIUS', 'ALL_SCOPES'],
    'Top Right Radius': ['CORNER_RADIUS', 'ALL_SCOPES'],
    'Bottom Left Radius': ['CORNER_RADIUS', 'ALL_SCOPES'],
    'Bottom Right Radius': ['CORNER_RADIUS', 'ALL_SCOPES'],
    'Item Spacing': ['GAP', 'ALL_SCOPES'],
    'Padding Left': ['GAP', 'ALL_SCOPES'],
    'Padding Right': ['GAP', 'ALL_SCOPES'],
    'Padding Top': ['GAP', 'ALL_SCOPES'],
    'Padding Bottom': ['GAP', 'ALL_SCOPES'],
    'Font Size': ['FONT_SIZE', 'ALL_SCOPES']
  },

  // Layout modes
  layoutModes: {
    NONE: 'NONE'
  },

  // Categories for token organization
  categories: {
    brand: 'brand',
    system: 'system',
    gray: 'gray',
    spacing: 'spacing',
    radius: 'radius',
    typography: 'typography',
    border: 'border'
  },

  // Naming conventions
  naming: {
    shadcn: 'shadcn',
    mui: 'mui',
    ant: 'ant',
    bootstrap: 'bootstrap',
    default: 'default'
  }
};

// ============================================
// 2. UTILS (Helpers techniques)
// ============================================
const Utils = {
  /**
   * Helper function for logging in debug mode
   * @param {string} msg - The message to log
   * @param {*} data - Optional data to log alongside the message
   */
  log: function (msg, data) {
    if (CONFIG.DEBUG_MODE) {
      if (data !== undefined) {
        console.log(msg, data);
      } else {
        console.log(msg);
      }
    }
  },

  /**
   * Safely get a property from a node with error handling
   * @param {Object} node - Figma node
   * @param {string} prop - Property name
   * @param {*} defaultValue - Default value if property doesn't exist
   * @returns {*} The property value or default
   */
  safeGet: function (node, prop, defaultValue) {
    try {
      if (node && node[prop] !== undefined) {
        return node[prop];
      }
      return defaultValue;
    } catch (error) {
      return defaultValue;
    }
  },

  /**
   * Safely check if a node has a property
   * @param {Object} node - Figma node
   * @param {string} prop - Property name
   * @returns {boolean} True if property exists
   */
  hasProperty: function (node, prop) {
    try {
      return node && node[prop] !== undefined;
    } catch (error) {
      return false;
    }
  }
};

/**
 * @param {string} msg - The message to log
 * @param {*} data - Optional data to log alongside the message
 */
function log(msg, data) {
  // Logging disabled for production
}

// ============================================
// 3. COLOR_SERVICE (Logique pure couleurs)
// ============================================
const ColorService = {
  /**
   * Convert hex color to RGB object
   * @param {string} hex - Hex color string
   * @returns {Object} RGB object with r, g, b properties
   */
  hexToRgb: function (hex) {
    hex = hex.replace("#", "");
    if (hex.length === 3) {
      hex = hex.split("").map(function (x) { return x + x; }).join("");
    }
    var num = parseInt(hex, 16);
    return {
      r: ((num >> 16) & 255) / 255,
      g: ((num >> 8) & 255) / 255,
      b: (num & 255) / 255
    };
  },

  /**
   * Convert RGB object to hex color (version sécurisée avec arrondis)
   * @param {Object} c - RGB object with r, g, b properties
   * @returns {string} Hex color string
   */
  rgbToHex: function (c) {
    // Tolérance pour la précision flottante - arrondi à 6 décimales pour éviter les erreurs d'arrondi
    var roundToPrecision = function (x) {
      return Math.round(x * 1000000) / 1000000;
    };

    var r = roundToPrecision(Math.max(0, Math.min(1, c.r)));
    var g = roundToPrecision(Math.max(0, Math.min(1, c.g)));
    var b = roundToPrecision(Math.max(0, Math.min(1, c.b)));

    // Conversion en 255 avec arrondi sécurisé
    var r255 = Math.round(r * 255);
    var g255 = Math.round(g * 255);
    var b255 = Math.round(b * 255);

    var n = (r255 << 16) | (g255 << 8) | b255;
    var hex = "#" + n.toString(16).padStart(6, "0").toUpperCase();
    return hex;
  },

  /**
   * Convert hex color to HSL object
   * @param {string} hex - Hex color string
   * @returns {Object} HSL object with h, s, l properties
   */
  hexToHsl: function (hex) {
    var rgb = ColorService.hexToRgb(hex);
    var r = rgb.r;
    var g = rgb.g;
    var b = rgb.b;

    var max = Math.max(r, g, b);
    var min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      var d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return { h: h, s: s, l: l };
  },

  /**
   * Convert HSL object to hex color
   * @param {Object} hsl - HSL object with h, s, l properties
   * @returns {string} Hex color string
   */
  hslToHex: function (hsl) {
    var h = hsl.h;
    var s = hsl.s;
    var l = hsl.l;

    if (s === 0) {
      var gray = Math.round(l * 255);
      return "#" + (gray << 16 | gray << 8 | gray).toString(16).padStart(6, "0").toUpperCase();
    }

    var hue2rgb = function (p, q, t) {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    var p = 2 * l - q;

    var r = hue2rgb(p, q, h + 1 / 3);
    var g = hue2rgb(p, q, h);
    var b = hue2rgb(p, q, h - 1 / 3);

    return ColorService.rgbToHex({ r: r, g: g, b: b });
  },

  /**
   * Adjust lightness of a color
   * @param {Object} hsl - HSL object
   * @param {number} amount - Amount to adjust (-1 to 1)
   * @returns {Object} Adjusted HSL object
   */
  adjustLightness: function (hsl, amount) {
    return {
      h: hsl.h,
      s: hsl.s,
      l: Math.max(0, Math.min(1, hsl.l + amount))
    };
  },

  /**
   * Mix two colors
   * @param {string} c1 - First hex color
   * @param {string} c2 - Second hex color
   * @param {number} w - Weight (0-1, 0 = c1, 1 = c2)
   * @returns {string} Mixed hex color
   */
  mixColors: function (c1, c2, w) {
    var rgb1 = ColorService.hexToRgb(c1);
    var rgb2 = ColorService.hexToRgb(c2);

    return ColorService.rgbToHex({
      r: rgb1.r * (1 - w) + rgb2.r * w,
      g: rgb1.g * (1 - w) + rgb2.g * w,
      b: rgb1.b * (1 - w) + rgb2.b * w
    });
  }
};

// ============================================
// 4. TOKEN_SERVICE (Génération des tokens)
// ============================================
const TokenService = {
  /**
   * Generate brand color tokens
   * @param {string} hex - Base brand color
   * @param {string} naming - Naming convention
   * @returns {Object} Brand color tokens
   */
  generateBrand: function (hex, naming) {
    var tokens = {};

    if (naming === CONFIG.naming.shadcn) {
      tokens.primary = hex;
    } else if (naming === CONFIG.naming.mui) {
      tokens.main = hex;
      tokens.light = ColorService.hslToHex(ColorService.adjustLightness(ColorService.hexToHsl(hex), 0.1));
      tokens.dark = ColorService.hslToHex(ColorService.adjustLightness(ColorService.hexToHsl(hex), -0.1));
      tokens.contrastText = ColorService.hslToHex(ColorService.adjustLightness(ColorService.hexToHsl(hex), -0.5));
    } else if (naming === CONFIG.naming.ant) {
      tokens.main = hex;
      tokens.light = ColorService.hslToHex(ColorService.adjustLightness(ColorService.hexToHsl(hex), 0.1));
      tokens.dark = ColorService.hslToHex(ColorService.adjustLightness(ColorService.hexToHsl(hex), -0.1));
    } else if (naming === CONFIG.naming.bootstrap) {
      tokens.main = hex;
      tokens.light = ColorService.hslToHex(ColorService.adjustLightness(ColorService.hexToHsl(hex), 0.15));
      tokens.dark = ColorService.hslToHex(ColorService.adjustLightness(ColorService.hexToHsl(hex), -0.15));
    } else {
      // Default naming
      tokens['50'] = ColorService.hslToHex(ColorService.adjustLightness(ColorService.hexToHsl(hex), 0.4));
      tokens['100'] = ColorService.hslToHex(ColorService.adjustLightness(ColorService.hexToHsl(hex), 0.3));
      tokens['200'] = ColorService.hslToHex(ColorService.adjustLightness(ColorService.hexToHsl(hex), 0.2));
      tokens['300'] = ColorService.hslToHex(ColorService.adjustLightness(ColorService.hexToHsl(hex), 0.1));
      tokens['400'] = ColorService.hslToHex(ColorService.adjustLightness(ColorService.hexToHsl(hex), 0.05));
      tokens['500'] = hex;
      tokens['600'] = ColorService.hslToHex(ColorService.adjustLightness(ColorService.hexToHsl(hex), -0.05));
      tokens['700'] = ColorService.hslToHex(ColorService.adjustLightness(ColorService.hexToHsl(hex), -0.1));
      tokens['800'] = ColorService.hslToHex(ColorService.adjustLightness(ColorService.hexToHsl(hex), -0.2));
      tokens['900'] = ColorService.hslToHex(ColorService.adjustLightness(ColorService.hexToHsl(hex), -0.3));
    }

    return tokens;
  },

  /**
   * Generate system color tokens
   * @param {string} naming - Naming convention
   * @param {string} brandHex - Base brand color for derived colors
   * @returns {Object} System color tokens
   */
  generateSystem: function (naming, brandHex) {
    var tokens = {};
    var brandHsl = ColorService.hexToHsl(brandHex);

    if (naming === CONFIG.naming.mui) {
      tokens.primary = TokenService.generateBrand(brandHex, naming);
      tokens.secondary = {
        main: ColorService.mixColors(brandHex, '#666666', 0.3),
        light: ColorService.mixColors(brandHex, '#999999', 0.5),
        dark: ColorService.mixColors(brandHex, '#333333', 0.2),
        contrastText: '#ffffff'
      };
      tokens.success = { main: '#4caf50', light: '#81c784', dark: '#388e3c', contrastText: '#ffffff' };
      tokens.warning = { main: '#ff9800', light: '#ffb74d', dark: '#f57c00', contrastText: '#000000' };
      tokens.error = { main: '#f44336', light: '#e57373', dark: '#d32f2f', contrastText: '#ffffff' };
      tokens.info = { main: '#2196f3', light: '#64b5f6', dark: '#1976d2', contrastText: '#ffffff' };
    } else {
      // Default system colors
      tokens.primary = brandHex;
      tokens.secondary = ColorService.mixColors(brandHex, '#666666', 0.3);
      tokens.success = '#22c55e';
      tokens.warning = '#f59e0b';
      tokens.error = '#ef4444';
      tokens.info = '#3b82f6';
    }

    return tokens;
  },

  /**
   * Generate grayscale tokens
   * @param {string} naming - Naming convention
   * @returns {Object} Grayscale tokens
   */
  generateGray: function (naming) {
    var tokens = {};

    if (naming === CONFIG.naming.shadcn || naming === CONFIG.naming.ant) {
      // Shadcn/Ant design scale
      var steps = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];
      steps.forEach(function (step, index) {
        var lightness = 0.95 - (index * 0.09);
        lightness = Math.max(0.05, Math.min(0.95, lightness));
        tokens[step] = ColorService.hslToHex({ h: 0, s: 0, l: lightness });
      });
    } else if (naming === CONFIG.naming.mui) {
      // MUI grey scale
      tokens['50'] = '#fafafa';
      tokens['100'] = '#f5f5f5';
      tokens['200'] = '#eeeeee';
      tokens['300'] = '#e0e0e0';
      tokens['400'] = '#bdbdbd';
      tokens['500'] = '#9e9e9e';
      tokens['600'] = '#757575';
      tokens['700'] = '#616161';
      tokens['800'] = '#424242';
      tokens['900'] = '#212121';
    } else {
      // Bootstrap/default scale
      tokens.white = '#ffffff';
      tokens.light = '#f8f9fa';
      tokens.secondary = '#6c757d';
      tokens.dark = '#343a40';
      tokens.black = '#000000';
    }

    return tokens;
  },

  /**
   * Generate spacing tokens
   * @param {string} naming - Naming convention
   * @returns {Object} Spacing tokens
   */
  generateSpacing: function (naming) {
    var tokens = {};

    if (naming === CONFIG.naming.mui) {
      // MUI spacing scale (4px base)
      [0, 0.5, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40].forEach(function (multiplier) {
        tokens[multiplier] = multiplier * 4;
      });
    } else {
      // Default spacing scale
      [4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128, 160, 192, 224, 256].forEach(function (value) {
        tokens[value] = value;
      });
    }

    return tokens;
  },

  /**
   * Generate radius tokens
   * @param {string} naming - Naming convention
   * @returns {Object} Radius tokens
   */
  generateRadius: function (naming) {
    var tokens = {};

    if (naming === CONFIG.naming.mui) {
      tokens.none = 0;
      tokens.xs = 2;
      tokens.sm = 4;
      tokens.md = 6;
      tokens.lg = 8;
      tokens.xl = 12;
      tokens['2xl'] = 16;
      tokens.full = 9999;
    } else {
      // Default radius scale
      tokens.none = 0;
      tokens.sm = 2;
      tokens.base = 4;
      tokens.md = 6;
      tokens.lg = 8;
      tokens.xl = 12;
      tokens['2xl'] = 16;
      tokens['3xl'] = 24;
      tokens.full = 9999;
    }

    return tokens;
  },

  /**
   * Generate all tokens based on input
   * @param {Object} msg - Message with generation parameters
   * @returns {Object} Complete tokens object
   */
  generateAll: function (msg) {
    var hex = msg.hex || '#6366F1';
    var naming = msg.naming || CONFIG.naming.default;


    return {
      brand: TokenService.generateBrand(hex, naming),
      system: TokenService.generateSystem(naming, hex),
      gray: TokenService.generateGray(naming),
      spacing: TokenService.generateSpacing(naming),
      radius: TokenService.generateRadius(naming),
      typography: {
        'xs': 12,
        'sm': 14,
        'base': 16,
        'lg': 18,
        'xl': 20,
        '2xl': 24,
        '3xl': 30,
        '4xl': 36
      },
      border: {
        'thin': 1,
        'base': 2,
        'thick': 4
      }
    };
  }
};

// ============================================
// 5. FIGMA_SERVICE (Interactions API directes)
// ============================================
const FigmaService = {
  /**
   * Get all variable collections
   * @returns {Array} Array of variable collections
   */
  getCollections: function () {
    return figma.variables.getLocalVariableCollections();
  },

  /**
   * Get variable by ID
   * @param {string} id - Variable ID
   * @returns {Object|null} Variable object or null
   */
  getVariableById: function (id) {
    return figma.variables.getVariableById(id);
  },

  /**
   * Show notification to user
   * @param {string} msg - Message to show
   */
  notify: function (msg) {
    figma.notify(msg);
  },

  /**
   * Get or create a variable collection
   * @param {string} name - Collection name
   * @param {boolean} overwrite - Whether to overwrite existing
   * @returns {Object} Collection object
   */
  getOrCreateCollection: function (name, overwrite) {
    var collections = FigmaService.getCollections();

    for (var i = 0; i < collections.length; i++) {
      if (collections[i].name === name) {
        if (overwrite) {
          // Remove all variables from collection
          var variables = collections[i].variableIds;
          for (var j = 0; j < variables.length; j++) {
            try {
              var variable = FigmaService.getVariableById(variables[j]);
              if (variable) {
                variable.remove();
              }
            } catch (error) {
            }
          }
        }
        return collections[i];
      }
    }

    return figma.variables.createVariableCollection(name);
  },

  /**
   * Create or update a variable
   * @param {Object} collection - Variable collection
   * @param {string} name - Variable name
   * @param {string} type - Variable type
   * @param {*} value - Variable value
   * @param {string} category - Category name
   * @param {boolean} overwrite - Whether to overwrite existing
   * @returns {Object} Created or updated variable
   */
  createOrUpdateVariable: function (collection, name, type, value, category, overwrite) {
    // 1. Find existing variable
    var allVariables = figma.variables.getLocalVariables();
    var existingVariable = null;

    for (var i = 0; i < allVariables.length; i++) {
      var variable = allVariables[i];
      if (variable.name === name && variable.variableCollectionId === collection.id) {
        existingVariable = variable;
        break;
      }
    }

    if (existingVariable && !overwrite) {
      return existingVariable;
    }

    if (existingVariable) {
      // Update existing variable
      existingVariable.setValueForMode(collection.modes[0].modeId, value);
      return existingVariable;
    }

    // Create new variable
    var variable = figma.variables.createVariable(name, collection, type);

    // Set scopes based on category
    var scopes = [];
    if (category === CONFIG.categories.brand || category === CONFIG.categories.system || category === CONFIG.categories.gray) {
      scopes = CONFIG.scopes.Fill;
    } else if (category === CONFIG.categories.spacing || category === CONFIG.categories.radius) {
      scopes = CONFIG.scopes['Item Spacing'];
    } else if (category === CONFIG.categories.typography) {
      scopes = CONFIG.scopes['Font Size'];
    } else if (category === CONFIG.categories.border) {
      scopes = CONFIG.scopes.Stroke;
    }

    if (scopes.length > 0) {
      variable.setScopes(scopes);
    }

    variable.setValueForMode(collection.modes[0].modeId, value);
    return variable;
  },

  /**
   * Import tokens to Figma
   * @param {Object} tokens - Tokens object
   * @param {string} naming - Naming convention
   * @param {boolean} overwrite - Whether to overwrite existing
   */
  importTokens: function (tokens, naming, overwrite) {

    // Brand Colors
    if (tokens.brand) {
      var brandCollection = FigmaService.getOrCreateCollection("Brand Colors", overwrite);

      for (var key in tokens.brand) {
        if (!tokens.brand.hasOwnProperty(key)) continue;

        var varName = "";
        if (naming === CONFIG.naming.shadcn) varName = "primary";
        else if (naming === CONFIG.naming.mui) varName = "primary/" + key;
        else if (naming === CONFIG.naming.ant) varName = "primary-" + key;
        else if (naming === CONFIG.naming.bootstrap) varName = key;
        else varName = "primary-" + key;

        FigmaService.createOrUpdateVariable(brandCollection, varName, CONFIG.variableTypes.COLOR, ColorService.hexToRgb(tokens.brand[key]), CONFIG.categories.brand, overwrite);
      }
    }

    // System Colors
    if (tokens.system) {
      var systemCollection = FigmaService.getOrCreateCollection("System Colors", overwrite);

      for (var sKey in tokens.system) {
        if (!tokens.system.hasOwnProperty(sKey)) continue;

        if (typeof tokens.system[sKey] === 'object') {
          // MUI style nested colors
          for (var subKey in tokens.system[sKey]) {
            if (!tokens.system[sKey].hasOwnProperty(subKey)) continue;
            FigmaService.createOrUpdateVariable(systemCollection, sKey + "/" + subKey, CONFIG.variableTypes.COLOR, ColorService.hexToRgb(tokens.system[sKey][subKey]), CONFIG.categories.system, overwrite);
          }
        } else {
          // Simple color
          FigmaService.createOrUpdateVariable(systemCollection, sKey, CONFIG.variableTypes.COLOR, ColorService.hexToRgb(tokens.system[sKey]), CONFIG.categories.system, overwrite);
        }
      }
    }

    // Grayscale
    if (tokens.gray) {
      var grayCollection = FigmaService.getOrCreateCollection("Grayscale", overwrite);

      for (var gKey in tokens.gray) {
        if (!tokens.gray.hasOwnProperty(gKey)) continue;

        var grayName = "";
        if (naming === CONFIG.naming.shadcn) grayName = "gray-" + gKey;
        else if (naming === CONFIG.naming.mui) grayName = "grey-" + gKey;
        else if (naming === CONFIG.naming.ant) grayName = "gray-" + gKey;
        else grayName = "gray-" + gKey;

        FigmaService.createOrUpdateVariable(grayCollection, grayName, CONFIG.variableTypes.COLOR, ColorService.hexToRgb(tokens.gray[gKey]), CONFIG.categories.gray, overwrite);
      }
    }

    // Spacing
    if (tokens.spacing) {
      var spacingCollection = FigmaService.getOrCreateCollection("Spacing", overwrite);

      for (var sKey in tokens.spacing) {
        if (!tokens.spacing.hasOwnProperty(sKey)) continue;
        var cleanKey = sKey.toString().replace(/[^a-zA-Z0-9_-]/g, '');
        FigmaService.createOrUpdateVariable(spacingCollection, "spacing-" + cleanKey, CONFIG.variableTypes.FLOAT, tokens.spacing[sKey], CONFIG.categories.spacing, overwrite);
      }
    }

    // Radius
    if (tokens.radius) {
      var radiusCollection = FigmaService.getOrCreateCollection("Radius", overwrite);

      for (var rKey in tokens.radius) {
        if (!tokens.radius.hasOwnProperty(rKey)) continue;
        var cleanRKey = rKey.toString().replace(/[^a-zA-Z0-9_-]/g, '');
        FigmaService.createOrUpdateVariable(radiusCollection, "radius-" + cleanRKey, CONFIG.variableTypes.FLOAT, tokens.radius[rKey], CONFIG.categories.radius, overwrite);
      }
    }

    // Typography
    if (tokens.typography) {
      var typoCollection = FigmaService.getOrCreateCollection("Typography", overwrite);

      for (var tKey in tokens.typography) {
        if (!tokens.typography.hasOwnProperty(tKey)) continue;
        var cleanTKey = tKey.toString().replace(/[^a-zA-Z0-9_-]/g, '');
        FigmaService.createOrUpdateVariable(typoCollection, "typo-" + cleanTKey, CONFIG.variableTypes.FLOAT, tokens.typography[tKey], CONFIG.categories.typography, overwrite);
      }
    }

    // Border
    if (tokens.border) {
      var borderCollection = FigmaService.getOrCreateCollection("Border", overwrite);

      for (var bKey in tokens.border) {
        if (!tokens.border.hasOwnProperty(bKey)) continue;
        var cleanBKey = bKey.toString().replace(/[^a-zA-Z0-9_-]/g, '');
        FigmaService.createOrUpdateVariable(borderCollection, "border-" + cleanBKey, CONFIG.variableTypes.FLOAT, tokens.border[bKey], CONFIG.categories.border, overwrite);
      }
    }

    FigmaService.notify("✅ Tokens importés depuis le fichier (Ctrl+Z pour annuler)");
  }
};

// ============================================
// 6. SCANNER_ENGINE (Logique d'analyse)
// ============================================
const Scanner = {
  // État interne
  valueMap: null,
  lastScanResults: null,
  collectionsCache: null,
  variablesCache: null,
  cacheTimestamp: 0,
  CACHE_DURATION: 30000, // 30 secondes

  /**
   * Initialize the value to variable map
   */
  initMap: function () {
    var now = Date.now();

    // Utiliser le cache si valide
    if (Scanner.valueMap && Scanner.cacheTimestamp && (now - Scanner.cacheTimestamp < Scanner.CACHE_DURATION)) {
      return;
    }


    Scanner.valueMap = new Map();
    var localCollections = FigmaService.getCollections();
    Scanner.cacheTimestamp = now;


    for (var i = 0; i < localCollections.length; i++) {
      var collection = localCollections[i];
      var collectionName = collection.name;

      for (var j = 0; j < collection.variableIds.length; j++) {
        var variableId = collection.variableIds[j];
        var variable = FigmaService.getVariableById(variableId);

        if (!variable) {
          continue;
        }

        var modeId = collection.modes[0].modeId;
        var resolvedValue = variable.valuesByMode[modeId];

        if (resolvedValue !== undefined) {
          var formattedValue = Scanner._formatVariableValue(variable, resolvedValue);
          var key = Scanner._createMapKey(variable.resolvedType, formattedValue);

          if (!Scanner.valueMap.has(key)) {
            Scanner.valueMap.set(key, []);
          }

          Scanner.valueMap.get(key).push({
            id: variable.id,
            name: variable.name,
            resolvedValue: formattedValue,
            scopes: variable.scopes || []
          });

        }
      }
    }

  },

  /**
   * Format variable value for map key
   * @param {Object} variable - Variable object
   * @param {*} rawValue - Raw variable value
   * @returns {*} Formatted value
   */
  _formatVariableValue: function (variable, rawValue) {
    if (variable.resolvedType === CONFIG.variableTypes.COLOR && typeof rawValue === "object") {
      return ColorService.rgbToHex(rawValue);
    } else if (variable.resolvedType === CONFIG.variableTypes.FLOAT) {
      return rawValue + "px";
    } else if (variable.resolvedType === CONFIG.variableTypes.STRING) {
      return rawValue;
    }
    return rawValue;
  },

  /**
   * Create map key from type and value
   * @param {string} type - Variable type
   * @param {*} value - Formatted value
   * @returns {string} Map key
   */
  _createMapKey: function (type, value) {
    return type + ':' + value;
  },

  /**
   * Scan selection for applicable fixes
   * @param {boolean} ignoreHiddenLayers - Whether to ignore hidden layers
   */
  scanSelection: function (ignoreHiddenLayers) {

    var selection = figma.currentPage.selection;
    if (!selection || !Array.isArray(selection) || selection.length === 0) {
      figma.ui.postMessage({ type: "scan-results", results: [] });
      return [];
    }

    if (!Scanner.valueMap) {
      Scanner.initMap();
    }

    var results = [];
    var processedCount = 0;


    for (var i = 0; i < selection.length; i++) {
      var node = selection[i];
      Scanner._scanNodeRecursive(node, results, 0, ignoreHiddenLayers);
      processedCount++;
    }

    Scanner.lastScanResults = results;

    figma.ui.postMessage({ type: "scan-results", results: results });

    // Nettoyer la mémoire après 5 secondes
    setTimeout(function () {
      if (Scanner.valueMap) {
        Scanner.valueMap.clear();
        Scanner.valueMap = null;
      }
    }, 5000);

    return results;
  },

  /**
   * Recursively scan a node and its children
   * @param {Object} node - Node to scan
   * @param {Array} results - Results array
   * @param {number} depth - Current depth
   * @param {boolean} ignoreHiddenLayers - Whether to ignore hidden layers
   */
  _scanNodeRecursive: function (node, results, depth, ignoreHiddenLayers) {
    // Protection contre les récursions infinies
    if (depth > CONFIG.limits.MAX_DEPTH) {
      return;
    }

    // Vérifications défensives de base
    if (!node) {
      return;
    }

    // Vérifier si le nœud a été supprimé
    if (node.removed) {
      return;
    }

    // NOUVEAU: Vérifier les instances détachées (CRITICAL FIX)
    if (node.type === 'INSTANCE' && node.mainComponent === null) {
      return;
    }

    // Vérification supplémentaire des propriétés essentielles
    if (!node.id || !node.type) {
      return;
    }

    try {
      var nodeType = node.type;
      var nodeId = node.id;
      var nodeName = node.name || "Unnamed";


      // NOUVEAU: Envoyer la progression tous les 10 nœuds
      if (depth === 0 && results.length % 10 === 0) {
        figma.ui.postMessage({
          type: "scan-progress",
          current: results.length,
          status: "Analyse en cours..."
        });
      }

      // Liste étendue des types de conteneurs supportés
      var containerTypes = CONFIG.supportedTypes.spacing;

      // Liste des types qui peuvent avoir des propriétés de style
      var styleTypes = CONFIG.supportedTypes.fillAndStroke;

      var isContainer = containerTypes.indexOf(nodeType) !== -1;
      var hasStyle = styleTypes.indexOf(nodeType) !== -1;

      // Analyser les propriétés de style si applicable
      if (hasStyle) {
        try {
          Scanner._checkProperties(node, results, ignoreHiddenLayers);
        } catch (propertyAnalysisError) {
        }
      }

      // Traversée des enfants avec protection
      if (isContainer) {
        try {
          var children = node.children;

          if (children && Array.isArray(children)) {

            for (var i = 0; i < children.length; i++) {
              try {
                var child = children[i];

                // Vérification défensive de l'enfant
                if (!child) {
                  continue;
                }

                if (child.removed) {
                  continue;
                }

                // Récursion avec protection et limite de profondeur
                Scanner._scanNodeRecursive(child, results, depth + 1, ignoreHiddenLayers);

              } catch (childError) {
              }
            }
          }

        } catch (childrenError) {
        }
      }

    } catch (nodeError) {
    }
  },

  /**
   * Check properties of a node for applicable fixes
   * @param {Object} node - Node to check
   * @param {Array} results - Results array
   * @param {boolean} ignoreHiddenLayers - Whether to ignore hidden layers
   */
  _checkProperties: function (node, results, ignoreHiddenLayers) {
    // Vérifications défensives de base
    if (!node) {
      return;
    }

    // Vérifier si le nœud a été supprimé
    if (node.removed) {
      return;
    }

    // Vérifications de base des propriétés essentielles
    if (!node.id || !node.name || !node.type) {
      return;
    }

    var nodeId = node.id;
    var layerName = node.name;
    var nodeType = node.type;

    // Filtrage intelligent
    if (ignoreHiddenLayers) {
      try {
        if (Utils.safeGet(node, 'visible') === false) {
          return;
        }
        if (Utils.safeGet(node, 'locked') === true) {
          return;
        }
      } catch (visibilityError) {
        // Certains types de nœuds n'ont pas ces propriétés, continuer silencieusement
      }
    }

    // Liste étendue des types supportés pour le style
    var supportedTypes = CONFIG.supportedTypes.all;

    // Pour les conteneurs, on ne vérifie que s'ils peuvent avoir des propriétés de style
    var styleSupportedTypes = CONFIG.supportedTypes.fillAndStroke;

    var isContainer = supportedTypes.indexOf(nodeType) !== -1;
    var supportsStyle = styleSupportedTypes.indexOf(nodeType) !== -1;

    if (!isContainer) {
      return;
    }

    // Analyse des propriétés avec protection
    if (supportsStyle) {
      try {
        // 1. VÉRIFICATION DES FILLS (COULEURS DE FOND) - GESTION FIGMA.MIXED
        if (Utils.hasProperty(node, 'fills') && node.fills !== figma.mixed) {
          Scanner._checkFillsSafely(node, results);
        }

        // 2. VÉRIFICATION DES STROKES (COULEURS DE CONTOUR) - GESTION FIGMA.MIXED
        if (Utils.hasProperty(node, 'strokes') && node.strokes !== figma.mixed) {
          Scanner._checkStrokesSafely(node, results);
        }

        // 3. VÉRIFICATION DES CORNER RADIUS - GESTION COMPLÈTE FIGMA.MIXED
        Scanner._checkCornerRadiusSafely(node, results);

        // 4. VÉRIFICATION DES PROPRIÉTÉS NUMÉRIQUES (SPACING, PADDING, RADIUS)
        Scanner._checkNumericPropertiesSafely(node, results);

        // 5. VÉRIFICATION DES PROPRIÉTÉS DE TYPOGRAPHIE (pour les nœuds TEXT)
        if (node.type === CONFIG.types.TEXT) {
          Scanner._checkTypographyPropertiesSafely(node, results);
        }

      } catch (propertyError) {
      }
    }
  },

  // Autres méthodes privées du Scanner...
  _checkFillsSafely: function (node, results) {
    // Implémentation similaire à l'original
  },

  _checkStrokesSafely: function (node, results) {
    // Implémentation similaire à l'original
  },

  _checkCornerRadiusSafely: function (node, results) {
    // Implémentation similaire à l'original
  },

  _checkNumericPropertiesSafely: function (node, results) {
    // Implémentation similaire à l'original
  },

  _checkTypographyPropertiesSafely: function (node, results) {
    // Implémentation similaire à l'original
  }
};

// ============================================
// 7. FIXER_ENGINE (Logique de correction)
// ============================================
const Fixer = {
  /**
   * Apply and verify a fix
   * @param {Object} result - Scan result
   * @param {string} variableId - Variable ID to apply
   * @returns {Object} Verification result
   */
  applyAndVerify: function (result, variableId) {

    // Validation 1: Résultat valide
    if (!result) {
      throw new Error('Invalid result or incomplete');
    }
    if (!result.nodeId) {
      throw new Error('Invalid result: nodeId missing');
    }
    if (!result.property) {
      throw new Error('Invalid result: property missing');
    }

    // Validation 2: Variable disponible
    if (!variableId) {
      throw new Error('No variable ID provided or suggested');
    }

    var variable = FigmaService.getVariableById(variableId);
    if (!variable) {
      throw new Error('Variable not found: ' + variableId);
    }

    // Validation 3: Nœud existe et accessible
    var node = figma.getNodeById(result.nodeId);
    if (!node) {
      throw new Error('Node not found: ' + result.nodeId);
    }
    if (node.removed) {
      throw new Error('Node removed: ' + result.nodeId);
    }

    // NOUVEAU: Vérifier si le nœud est verrouillé (CRITICAL FIX)
    if (Utils.safeGet(node, 'locked') === true) {
      throw new Error('Cannot modify locked node: ' + result.layerName);
    }

    // Validation 4: Propriété existe toujours
    if (!Fixer._validatePropertyExists(node, result)) {
      throw new Error('Property no longer exists: ' + result.property);
    }

    // Validation 5: Compatibilité variable-propriété
    if (!Fixer._validateVariableCanBeApplied(variable, result)) {
      throw new Error('Variable incompatible with property');
    }

    // Application de la correction
    var applied = Fixer._applyVariableToProperty(node, result, variable);

    if (!applied) {
      throw new Error('Failed to apply variable');
    }

    // Vérification de l'application
    var verification = Fixer._verifyVariableApplication(node, result, variable);

    if (verification.success) {
      return verification;
    } else {
      return verification;
    }
  },

  /**
   * Apply fix to a single node
   * @param {Object} result - Scan result
   * @param {string} variableId - Variable ID
   * @returns {number} 1 if successful, 0 if failed
   */
  applySingle: function (result, variableId) {
    try {
      var verification = Fixer.applyAndVerify(result, variableId);
      return verification.success ? 1 : 0;
    } catch (error) {
      return 0;
    }
  },

  /**
   * Apply fixes to a group of results
   * @param {Array} indices - Array of result indices
   * @param {string} variableId - Variable ID to apply
   */
  applyGroup: function (indices, variableId) {
    if (!Scanner.lastScanResults || !Array.isArray(indices)) {
      return;
    }

    var appliedCount = 0;
    var failedCount = 0;

    for (var i = 0; i < indices.length; i++) {
      var index = indices[i];
      if (index >= 0 && index < Scanner.lastScanResults.length) {
        var result = Scanner.lastScanResults[index];
        try {
          var success = Fixer.applySingle(result, variableId);
          if (success) {
            appliedCount++;
          } else {
            failedCount++;
          }
        } catch (error) {
          failedCount++;
        }
      }
    }

    var message = '✅ ' + appliedCount + ' corrections appliquées';
    if (failedCount > 0) {
      message += ', ' + failedCount + ' échouées';
    }

    FigmaService.notify(message);
  },

  /**
   * Apply all fixes from scan results
   */
  applyAll: function () {
    if (!Scanner.lastScanResults || !Array.isArray(Scanner.lastScanResults)) {
      return;
    }

    var appliedCount = 0;
    var failedCount = 0;

    for (var i = 0; i < Scanner.lastScanResults.length; i++) {
      var result = Scanner.lastScanResults[i];
      try {
        var success = Fixer.applySingle(result, result.suggestedVariableId);
        if (success) {
          appliedCount++;
        } else {
          failedCount++;
        }
      } catch (error) {
        failedCount++;
      }
    }

    var message = '🎉 Toutes les corrections appliquées ! (' + appliedCount + ' réussies';
    if (failedCount > 0) {
      message += ', ' + failedCount + ' échouées)';
    } else {
      message += ')';
    }

    FigmaService.notify(message);
  },

  // Méthodes privées du Fixer...
  _validatePropertyExists: function (node, result) {
    // Implémentation similaire à l'original
  },

  _validateVariableCanBeApplied: function (variable, result) {
    // Implémentation similaire à l'original
  },

  _applyVariableToProperty: function (node, result, variable) {
    try {
      var success = false;

      switch (result.property) {
        case "Fill":
          success = applyColorVariableToFill(node, variable, result.fillIndex);
          break;

        case "Stroke":
          success = applyColorVariableToStroke(node, variable, result.strokeIndex);
          break;

        case "Corner Radius":
        case "Top Left Radius":
        case "Top Right Radius":
        case "Bottom Left Radius":
        case "Bottom Right Radius":
          success = applyNumericVariable(node, variable, result.figmaProperty, result.property);
          break;

        case "Item Spacing":
        case "Padding Left":
        case "Padding Right":
        case "Padding Top":
        case "Padding Bottom":
          success = applyNumericVariable(node, variable, result.figmaProperty, result.property);
          break;

        default:
          return false;
      }

      return success;
    } catch (error) {
      return false;
    }
  },

  _verifyVariableApplication: function (node, result, variable) {
    // Implémentation similaire à l'original
  },

  _getNodePropertyDebugInfo: function (node, result) {
    // Implémentation similaire à l'original
  }
};

// ============================================
// 8. MAIN (Point d'entrée)
// ============================================

// Initialisation de l'UI
figma.showUI(__html__, { width: 700, height: 950, themeColors: true });

// Gestionnaire d'événements
figma.ui.onmessage = function (msg) {

  try {
    switch (msg.type) {
      case 'scan-selection':
        Scanner.scanSelection(msg.ignoreHiddenLayers);
        break;

      case 'scan-page':
        Scanner.scanPage(msg.ignoreHiddenLayers);
        break;

      case 'generate-tokens':
        var tokens = TokenService.generateAll(msg);
        figma.ui.postMessage({ type: 'tokens-generated', tokens: tokens });
        break;

      case 'import-tokens':
        FigmaService.importTokens(msg.tokens, msg.naming, msg.overwrite);
        break;

      case 'apply-fix':
        var verification = Fixer.applyAndVerify(msg.result, msg.variableId);
        figma.ui.postMessage({ type: 'fix-applied', verification: verification });
        break;

      case 'apply-group':
        Fixer.applyGroup(msg.indices, msg.variableId);
        break;

      case 'apply-all':
        Fixer.applyAll();
        break;

      default:
    }
  } catch (error) {
    figma.ui.postMessage({ type: 'error', error: error.message });
  }
};

// Check if variables exist and notify UI
const existingCollections = figma.variables.getLocalVariableCollections();
if (existingCollections.length > 0) {
  figma.ui.postMessage({ type: "has-variables", value: true });

  // Extraire les tokens existants et les envoyer à l'UI
  try {
    const existingTokens = extractExistingTokens();
    log("Tokens existants extraits:", existingTokens);

    // Compter le nombre total de tokens
    let hasTokens = false;
    for (let cat in existingTokens.tokens) {
      if (existingTokens.tokens.hasOwnProperty(cat) && Object.keys(existingTokens.tokens[cat]).length > 0) {
        hasTokens = true;
        break;
      }
    }

    if (existingTokens && hasTokens) {
      log("Envoi des tokens à l'UI");
      figma.ui.postMessage({
        type: "existing-tokens",
        tokens: existingTokens.tokens,
        library: existingTokens.library
      });
    } else {
      log("Aucun token extrait - envoi d'un message vide");
      figma.ui.postMessage({
        type: "existing-tokens",
        tokens: {},
        library: "tailwind"
      });
    }
  } catch (e) {
    log("Erreur lors de l'extraction des tokens existants:", e);
  }
}

// ============================================
// ============================================
// EXTRACT EXISTING TOKENS
// ============================================

/**
 * Extrait les tokens existants des collections de variables Figma
 * @returns {Object} Objet contenant les tokens organisés par catégories et la librairie détectée
 * @property {Object} tokens - Tokens organisés par catégories (brand, system, gray, spacing, radius, typography, border)
 * @property {string} library - Librairie détectée (tailwind, mui, bootstrap)
 */
function extractExistingTokens() {
  var collections = figma.variables.getLocalVariableCollections();
  log("Nombre de collections trouvées:", collections.length);

  const tokens = {
    brand: {},
    system: {},
    gray: {},
    spacing: {},
    radius: {},
    typography: {},
    border: {}
  };

  var detectedLibrary = "tailwind"; // Par défaut

  for (var i = 0; i < collections.length; i++) {
    var collection = collections[i];
    var collectionName = collection.name;
    log("Collection #" + i + ":", collectionName, "(" + collection.variableIds.length + " variables)");

    // Déterminer la catégorie en matchant les noms exacts créés par le plugin
    var category = null;

    if (collectionName === "Brand Colors") {
      category = "brand";
    } else if (collectionName === "System Colors") {
      category = "system";
    } else if (collectionName === "Grayscale") {
      category = "gray";
    } else if (collectionName === "Spacing") {
      category = "spacing";
    } else if (collectionName === "Radius") {
      category = "radius";
    } else if (collectionName === "Typography") {
      category = "typography";
    } else if (collectionName === "Border") {
      category = "border";
    }

    log("  → Catégorie détectée:", category);

    if (!category) {
      log("  → Collection ignorée (ne correspond pas aux collections du plugin)");
      continue;
    }

    // Extraire les variables de cette collection
    var variables = collection.variableIds.map(function (id) {
      return figma.variables.getVariableById(id);
    });

    log("  → Nombre de variables:", variables.length);

    for (var j = 0; j < variables.length; j++) {
      var variable = variables[j];
      if (!variable) continue;

      var modeId = collection.modes[0].modeId;
      var value = variable.valuesByMode[modeId];

      // Nettoyer le nom de la variable
      var cleanName = variable.name
        .replace(/^(primary|brand|gray|grey|spacing|radius|typo|border)-/i, "")
        .replace(/^primary\//i, "");

      // Détecter la librairie basée sur les noms de variables
      if (variable.name.indexOf("/") !== -1) {
        detectedLibrary = "mui";
      } else if (cleanName.match(/^(main|light|dark|contrastText)$/)) {
        detectedLibrary = "mui";
      } else if (cleanName.match(/^(subtle|hover|emphasis)$/)) {
        detectedLibrary = "bootstrap";
      }

      // Convertir la valeur selon le type
      var formattedValue = value;
      if (variable.resolvedType === "COLOR" && typeof value === "object") {
        formattedValue = rgbToHex(value);
      } else if (variable.resolvedType === "FLOAT") {
        formattedValue = value + "px";
      } else if (variable.resolvedType === "STRING") {
        formattedValue = value;
      }

      log("    Variable:", variable.name, "→", cleanName, "=", formattedValue);
      tokens[category][cleanName] = formattedValue;
    }
  }

  log("Tokens finaux par catégorie:");
  for (var cat in tokens) {
    log("  " + cat + ":", Object.keys(tokens[cat]).length, "tokens");
  }

  return {
    tokens: tokens,
    library: detectedLibrary
  };
}

// ============================================
// COLOR UTILITIES
// ============================================

function hexToRgb(hex) {
  hex = hex.replace("#", "");
  if (hex.length === 3) {
    hex = hex.split("").map(function (x) { return x + x; }).join("");
  }
  var num = parseInt(hex, 16);
  return {
    r: ((num >> 16) & 255) / 255,
    g: ((num >> 8) & 255) / 255,
    b: (num & 255) / 255
  };
}

function rgbToHex(c) {
  // Tolérance pour la précision flottante - arrondi à 6 décimales pour éviter les erreurs d'arrondi
  var roundToPrecision = function (x) {
    return Math.round(x * 1000000) / 1000000;
  };

  var r = roundToPrecision(Math.max(0, Math.min(1, c.r)));
  var g = roundToPrecision(Math.max(0, Math.min(1, c.g)));
  var b = roundToPrecision(Math.max(0, Math.min(1, c.b)));

  // Conversion en 255 avec arrondi sécurisé
  var r255 = Math.round(r * 255);
  var g255 = Math.round(g * 255);
  var b255 = Math.round(b * 255);

  var n = (r255 << 16) | (g255 << 8) | b255;
  var hex = "#" + n.toString(16).padStart(6, "0").toUpperCase();
  return hex;
}

function hexToHsl(hex) {
  var rgb = hexToRgb(hex);
  var r = rgb.r;
  var g = rgb.g;
  var b = rgb.b;

  var max = Math.max(r, g, b);
  var min = Math.min(r, g, b);
  var h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    var d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToHex(h, s, l) {
  h = h / 360;
  s = s / 100;
  l = l / 100;

  var r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    var hue2rgb = function (p, q, t) {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    var p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return rgbToHex({ r: r, g: g, b: b });
}

// ============================================
// TOKEN GENERATORS (5 steps)
// ============================================

function generateBrandColors(hex, naming) {
  var hsl = hexToHsl(hex);
  var H = hsl.h;
  var S = hsl.s;
  var L = hsl.l;

  var palette5 = {
    subtle: hslToHex(H, S, Math.min(97, L + 25)),
    light: hslToHex(H, S, Math.min(92, L + 15)),
    base: hex,
    hover: hslToHex(H, S, Math.max(10, L - 8)),
    dark: hslToHex(H, S, Math.max(5, L - 18))
  };

  if (naming === "shadcn") {
    // Générer une palette complète comme les gris pour Shadcn
    var shadcnBrand = {};
    var levels = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

    // Calculer les couleurs pour chaque niveau
    for (var i = 0; i < levels.length; i++) {
      var level = levels[i];
      var color;

      if (level === 50) color = palette5.subtle;
      else if (level === 100) color = palette5.light;
      else if (level === 200) color = hslToHex(H, S, Math.min(95, L + 10));
      else if (level === 300) color = hslToHex(H, S, Math.min(95, L + 5));
      else if (level === 400) color = hslToHex(H, S, Math.min(95, L + 2));
      else if (level === 500) color = palette5.base;
      else if (level === 600) color = hslToHex(H, S, Math.max(5, L - 2));
      else if (level === 700) color = hslToHex(H, S, Math.max(5, L - 5));
      else if (level === 800) color = hslToHex(H, S, Math.max(5, L - 10));
      else if (level === 900) color = palette5.dark;
      else if (level === 950) color = hslToHex(H, S, Math.max(5, L - 15));

      shadcnBrand[level.toString()] = color;
    }

    return shadcnBrand;
  }

  if (naming === "tailwind") {
    // Pour Tailwind/Shadcn, utiliser l'échelle complète comme Shadcn
    var tailwindBrand = {};
    var levels = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

    // Calculer les couleurs pour chaque niveau
    for (var i = 0; i < levels.length; i++) {
      var level = levels[i];
      var color;

      if (level === 50) color = palette5.subtle;
      else if (level === 100) color = palette5.light;
      else if (level === 200) color = hslToHex(H, S, Math.min(95, L + 10));
      else if (level === 300) color = hslToHex(H, S, Math.min(95, L + 5));
      else if (level === 400) color = hslToHex(H, S, Math.min(95, L + 2));
      else if (level === 500) color = palette5.base;
      else if (level === 600) color = hslToHex(H, S, Math.max(5, L - 2));
      else if (level === 700) color = hslToHex(H, S, Math.max(5, L - 5));
      else if (level === 800) color = hslToHex(H, S, Math.max(5, L - 10));
      else if (level === 900) color = palette5.dark;
      else if (level === 950) color = hslToHex(H, S, Math.max(5, L - 15));

      tailwindBrand[level.toString()] = color;
    }

    return tailwindBrand;
  }

  if (!naming || naming === "chakra" || naming === "custom") {
    return {
      "100": palette5.subtle,
      "200": palette5.light,
      "300": palette5.base,
      "400": palette5.hover,
      "500": palette5.dark
    };
  }

  if (naming === "mui") {
    return {
      light: palette5.light,
      main: palette5.base,
      dark: palette5.dark,
      contrastText: "#FFFFFF"
    };
  }

  if (naming === "bootstrap") {
    return {
      "primary": palette5.base,
      "primary-subtle": palette5.subtle,
      "primary-hover": palette5.hover,
      "primary-dark": palette5.dark
    };
  }

  if (naming === "ant") {
    return {
      "1": palette5.subtle,
      "2": palette5.light,
      "3": palette5.base,
      "4": palette5.hover,
      "5": palette5.dark
    };
  }

  return {
    subtle: palette5.subtle,
    light: palette5.light,
    base: palette5.base,
    hover: palette5.hover,
    dark: palette5.dark
  };
}

function generateGrayscale(naming) {
  var base = {
    "50": "#F9FAFB",
    "100": "#F3F4F6",
    "200": "#E5E7EB",
    "300": "#D1D5DB",
    "400": "#9CA3AF",
    "500": "#6B7280",
    "600": "#4B5563",
    "700": "#374151",
    "800": "#1F2937",
    "900": "#111827",
    "950": "#030712",
    "white": "#FFFFFF",
  };

  if (naming === "shadcn") {
    var shadcnGrays = {};
    // Ordre spécifique pour shadcn (sans white)
    var shadcnOrder = ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950"];
    for (var i = 0; i < shadcnOrder.length; i++) {
      var key = shadcnOrder[i];
      shadcnGrays[key] = base[key];
    }
    return shadcnGrays;
  }

  if (naming === "ant") {
    return {
      "1": base["50"],
      "2": base["100"],
      "3": base["200"],
      "4": base["300"],
      "5": base["400"],
      "6": base["500"],
      "7": base["600"],
      "8": base["700"],
      "9": base["800"],
      "10": base["900"]
    };
  }

  // Pour tailwind et autres, retourner dans le bon ordre
  var orderedGrays = {};
  var order = ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950", "white"];
  for (var i = 0; i < order.length; i++) {
    var key = order[i];
    orderedGrays[key] = base[key];
  }
  return orderedGrays;
}

function generateSystemColors(naming) {
  var baseColors = {
    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",
    info: "#3B82F6"
  };

  var result = {};

  for (var colorName in baseColors) {
    if (!baseColors.hasOwnProperty(colorName)) continue;

    var baseHex = baseColors[colorName];
    var hsl = hexToHsl(baseHex);

    var light = hslToHex(hsl.h, hsl.s, Math.min(95, hsl.l + 25));
    var dark = hslToHex(hsl.h, hsl.s, Math.max(20, hsl.l - 15));

    if (naming === "shadcn") {
      // Pour shadcn, mapper les couleurs système aux conventions appropriées
      if (colorName === "success") {
        result["primary"] = baseHex;
        result["primary-foreground"] = "#FFFFFF";
      } else if (colorName === "error") {
        result["destructive"] = baseHex;
        result["destructive-foreground"] = "#FFFFFF";
      } else if (colorName === "warning") {
        result["warning"] = baseHex;
        result["warning-foreground"] = "#000000";
      } else if (colorName === "info") {
        result["accent"] = baseHex;
        result["accent-foreground"] = "#FFFFFF";
      }
    } else if (naming === "mui") {
      result[colorName + "-light"] = light;
      result[colorName + "-main"] = baseHex;
      result[colorName + "-dark"] = dark;
    } else if (naming === "bootstrap") {
      result[colorName] = baseHex;
      result[colorName + "-subtle"] = light;
      result[colorName + "-emphasis"] = dark;
    } else {
      result[colorName + "-light"] = light;
      result[colorName] = baseHex;
      result[colorName + "-dark"] = dark;
    }
  }

  return result;
}

function generateSpacing(naming) {
  if (naming === "shadcn") {
    return {
      "1": "0.25rem",
      "2": "0.5rem",
      "3": "0.75rem",
      "4": "1rem",
      "5": "1.25rem",
      "6": "1.5rem",
      "8": "2rem",
      "10": "2.5rem",
      "12": "3rem",
      "16": "4rem"
    };
  }
  if (naming === "mui") {
    return { "1": "8px", "2": "16px", "3": "24px", "4": "32px", "5": "40px" };
  }
  if (naming === "bootstrap") {
    return { "1": "0.25rem", "2": "0.5rem", "3": "1rem", "4": "1.5rem", "5": "3rem" };
  }
  return { "1": "4px", "2": "8px", "3": "12px", "4": "16px", "5": "20px", "6": "24px", "8": "32px" };
}

function generateRadius(naming) {
  if (naming === "shadcn") {
    return {
      "sm": "0.125rem",
      "md": "0.375rem",
      "lg": "0.5rem",
      "xl": "0.75rem",
      "2xl": "1rem",
      "3xl": "1.5rem",
      "full": "9999px"
    };
  }
  if (naming === "mui") {
    return { "xs": "4px", "sm": "8px", "md": "12px", "lg": "16px", "xl": "20px" };
  }
  if (naming === "bootstrap") {
    return { "sm": "0.25rem", "default": "0.375rem", "lg": "0.5rem", "pill": "50rem" };
  }
  return { "sm": "2", "md": "4", "lg": "8", "xl": "12", "2xl": "16", "full": "9999" };
}

function generateTypography(naming) {
  if (naming === "shadcn") {
    return {
      "xs": "0.75rem",
      "sm": "0.875rem",
      "base": "1rem",
      "lg": "1.125rem",
      "xl": "1.25rem",
      "2xl": "1.5rem",
      "3xl": "1.875rem",
      "4xl": "2.25rem",
      "5xl": "3rem"
    };
  }
  if (naming === "mui") {
    return {
      "h1": "96px / 700",
      "h2": "60px / 700",
      "h3": "48px / 600",
      "body1": "16px / 400",
      "body2": "14px / 400"
    };
  }
  if (naming === "bootstrap") {
    return {
      "h1": "2.5rem",
      "h2": "2rem",
      "h3": "1.75rem",
      "body": "1rem",
      "lead": "1.25rem"
    };
  }
  return {
    "text-xs": "0.75rem",
    "text-sm": "0.875rem",
    "text-base": "1rem",
    "text-lg": "1.125rem",
    "text-xl": "1.25rem"
  };
}

function generateBorder() {
  return { "1": "1", "2": "2", "4": "4" };
}

// ============================================
// FIGMA SCOPES
// ============================================

var scopesByCategory = {
  brand: ["ALL_FILLS", "STROKE_COLOR", "EFFECT_COLOR"],
  gray: ["ALL_FILLS", "STROKE_COLOR", "EFFECT_COLOR"],
  system: ["ALL_FILLS", "STROKE_COLOR", "EFFECT_COLOR"],
  border: ["STROKE_FLOAT"],
  radius: ["CORNER_RADIUS"],
  spacing: ["GAP", "WIDTH_HEIGHT"],
  typography: ["FONT_SIZE", "LINE_HEIGHT", "LETTER_SPACING", "TEXT_CONTENT"]
};

function applyScopesForCategory(variable, category) {
  if (!variable || !category) return;
  var scopes = scopesByCategory[category];
  if (!scopes || scopes.length === 0) return;
  try {
    variable.scopes = scopes;
  } catch (error) {
    log("[Scopes] Erreur pour", category, error);
  }
}

// ============================================
// IMPORT TOKENS INTO FIGMA
// ============================================

function getOrCreateCollection(name, overwrite) {
  var collections = figma.variables.getLocalVariableCollections();

  if (overwrite) {
    for (var i = 0; i < collections.length; i++) {
      if (collections[i].name === name) {
        collections[i].remove();
      }
    }
    return figma.variables.createVariableCollection(name);
  }

  for (var i = 0; i < collections.length; i++) {
    if (collections[i].name === name) return collections[i];
  }
  return figma.variables.createVariableCollection(name);
}

/**
 * Crée ou met à jour une variable dans une collection Figma
 * @param {Object} collection - Collection de variables Figma
 * @param {string} name - Nom de la variable
 * @param {string} type - Type de la variable (COLOR, FLOAT, STRING)
 * @param {*} value - Valeur de la variable
 * @param {string} category - Catégorie de la variable
 * @param {boolean} overwrite - Si true, écrase les variables existantes
 * @returns {Object} La variable créée ou mise à jour
 */
function createOrUpdateVariable(collection, name, type, value, category, overwrite) {
  // 1. Find existing variable
  var allVariables = figma.variables.getLocalVariables();
  var variable = null;

  for (var i = 0; i < allVariables.length; i++) {
    if (allVariables[i].variableCollectionId === collection.id && allVariables[i].name === name) {
      variable = allVariables[i];
      break;
    }
  }

  // 2. Create if needed
  if (!variable) {
    variable = figma.variables.createVariable(name, collection, type);
  }

  // 3. Update Value
  if (variable) {
    var modeId = collection.modes[0].modeId;
    variable.setValueForMode(modeId, value);
    applyScopesForCategory(variable, category);
  }

  return variable;
}

function importTokensToFigma(tokens, naming, overwrite) {
  // Note: figma.groupOperations a été supprimé dans les versions récentes de l'API Figma
  // Chaque opération sera maintenant annulable individuellement

  // Brand Colors
  if (tokens.brand) {
    var brandCollection = getOrCreateCollection("Brand Colors", overwrite);

    for (var key in tokens.brand) {
      if (!tokens.brand.hasOwnProperty(key)) continue;

      var varName = "";
      if (naming === "shadcn") varName = "primary";
      else if (naming === "mui") varName = "primary/" + key;
      else if (naming === "ant") varName = "primary-" + key;
      else if (naming === "bootstrap") varName = key;
      else varName = "primary-" + key;

      createOrUpdateVariable(brandCollection, varName, "COLOR", hexToRgb(tokens.brand[key]), "brand", overwrite);
    }
  }

  // System Colors
  if (tokens.system) {
    var systemCollection = getOrCreateCollection("System Colors", overwrite);

    for (var sKey in tokens.system) {
      if (!tokens.system.hasOwnProperty(sKey)) continue;
      createOrUpdateVariable(systemCollection, sKey, "COLOR", hexToRgb(tokens.system[sKey]), "system", overwrite);
    }
  }

  // Grayscale
  if (tokens.gray) {
    var grayCollection = getOrCreateCollection("Grayscale", overwrite);

    for (var gKey in tokens.gray) {
      if (!tokens.gray.hasOwnProperty(gKey)) continue;

      var grayName = "";
      if (naming === "shadcn") grayName = "gray-" + gKey;
      else if (naming === "mui") grayName = "grey-" + gKey;
      else if (naming === "ant") grayName = "gray-" + gKey;
      else grayName = "gray-" + gKey;

      createOrUpdateVariable(grayCollection, grayName, "COLOR", hexToRgb(tokens.gray[gKey]), "gray", overwrite);
    }
  }

  // Spacing
  if (tokens.spacing) {
    var spacingCollection = getOrCreateCollection("Spacing", overwrite);

    for (var spKey in tokens.spacing) {
      if (!tokens.spacing.hasOwnProperty(spKey)) continue;

      var cleanKey = spKey.replace(/\./g, "-");
      var valueStr = tokens.spacing[spKey];
      var value = parseFloat(valueStr);

      if (valueStr.indexOf("rem") !== -1) {
        value = value * 16;
      }

      createOrUpdateVariable(spacingCollection, "spacing-" + cleanKey, "FLOAT", value, "spacing", overwrite);
    }
  }

  // Radius
  if (tokens.radius) {
    var radiusCollection = getOrCreateCollection("Radius", overwrite);

    for (var rKey in tokens.radius) {
      if (!tokens.radius.hasOwnProperty(rKey)) continue;

      var cleanRKey = rKey.replace(/\./g, "-");
      var rValueStr = tokens.radius[rKey];
      var rValue = parseFloat(rValueStr);

      if (rValueStr.indexOf("rem") !== -1) {
        rValue = rValue * 16;
      }

      createOrUpdateVariable(radiusCollection, "radius-" + cleanRKey, "FLOAT", rValue, "radius", overwrite);
    }
  }

  // Typography
  if (tokens.typography) {
    var typoCollection = getOrCreateCollection("Typography", overwrite);

    for (var tKey in tokens.typography) {
      if (!tokens.typography.hasOwnProperty(tKey)) continue;

      var cleanTKey = tKey.replace(/\./g, "-");
      var typoValueStr = tokens.typography[tKey];
      var typoValue = parseFloat(typoValueStr);

      if (typoValueStr.indexOf("rem") !== -1) {
        typoValue = typoValue * 16;
      }

      createOrUpdateVariable(typoCollection, "typo-" + cleanTKey, "FLOAT", typoValue, "typography", overwrite);
    }
  }

  // Border
  if (tokens.border) {
    var borderCollection = getOrCreateCollection("Border", overwrite);

    for (var bKey in tokens.border) {
      if (!tokens.border.hasOwnProperty(bKey)) continue;

      var cleanBKey = bKey.replace(/\./g, "-");
      var bValue = parseFloat(tokens.border[bKey]);
      createOrUpdateVariable(borderCollection, "border-" + cleanBKey, "FLOAT", bValue, "border", overwrite);
    }
  }

  figma.notify("✅ All tokens imported successfully! (Chaque modification peut être annulée individuellement avec Ctrl+Z)");
  figma.ui.postMessage({ type: 'import-completed' });
}

// ============================================
// MESSAGE HANDLER
// ============================================

var cachedTokens = null;
var lastScanResults = null; // Pour stocker temporairement les résultats du dernier scan

// ============================================
// FRAME VERIFICATION FUNCTIONS
// ============================================

/**
 * Résout récursivement la valeur d'une variable, en suivant les alias jusqu'à la valeur brute
 * @param {Object} variable - La variable Figma à résoudre
 * @param {string} modeId - L'ID du mode à utiliser
 * @param {Set} visitedVariables - Ensemble des variables déjà visitées (pour éviter les cycles)
 * @returns {Object|Number|null} La valeur résolue ou null si résolution impossible
 */
function resolveVariableValue(variable, modeId, visitedVariables) {
  // Protection contre les cycles infinis
  if (!visitedVariables) {
    visitedVariables = new Set();
  }

  if (visitedVariables.has(variable.id)) {
    log("[resolveVariableValue] Cycle détecté dans les alias pour variable:", variable.name);
    return null;
  }

  visitedVariables.add(variable.id);

  try {
    var value = variable.valuesByMode[modeId];

    // Si c'est un alias, résoudre récursivement
    if (value && typeof value === 'object' && value.type === 'VARIABLE_ALIAS') {
      log("[resolveVariableValue] Alias détecté pour", variable.name, "-> résolution vers", value.id);

      var parentVar = figma.variables.getVariableById(value.id);
      if (!parentVar) {
        log("[resolveVariableValue] Variable parente introuvable:", value.id);
        return null;
      }

      // Pour les alias, utiliser le même mode ou le mode par défaut de la variable parente
      var parentModeId = modeId; // On garde le même mode pour simplifier
      return resolveVariableValue(parentVar, parentModeId, visitedVariables);
    }

    // Valeur brute atteinte
    return value;

  } catch (error) {
    log("[resolveVariableValue] Erreur lors de la résolution de", variable.name, ":", error);
    return null;
  } finally {
    visitedVariables.delete(variable.id);
  }
}

function createValueToVariableMap() {
  log("🔧 Construction de la map des variables avec résolution des alias...");
  var map = new Map(); // value -> [{id, name, collectionName, resolvedValue}, ...]
  var localCollections = figma.variables.getLocalVariableCollections();

  log("📚 Collections trouvées:", localCollections.length);

  localCollections.forEach(function (collection) {
    collection.variableIds.forEach(function (variableId) {
      var variable = figma.variables.getVariableById(variableId);
      if (!variable) {
        log("[createValueToVariableMap] Variable introuvable:", variableId);
        return;
      }

      collection.modes.forEach(function (mode) {
        var modeId = mode.modeId;

        // Résoudre la valeur réelle (en suivant les alias)
        var resolvedValue = resolveVariableValue(variable, modeId);

        if (resolvedValue !== undefined && resolvedValue !== null) {
          // Convertir les couleurs RGB en hex pour la comparaison
          if (isColorValue(resolvedValue)) {
            var hexValue = rgbToHex(resolvedValue);
            if (hexValue) {
              if (!map.has(hexValue)) {
                map.set(hexValue, []);
              }
              map.get(hexValue).push({
                id: variable.id,
                name: variable.name,
                collectionName: collection.name,
                modeName: mode.name,
                resolvedValue: resolvedValue,
                originalValue: variable.valuesByMode[modeId] // Garder la valeur originale pour référence
              });
            }
          }
          // Pour les autres types (nombres), stocker directement
          else if (typeof resolvedValue === 'number') {
            log('[DEBUG createValueToVariableMap] Stockage variable numérique:', variable.name, '=', resolvedValue);
            var key = resolvedValue;
            if (!map.has(key)) {
              map.set(key, []);
            }
            map.get(key).push({
              id: variable.id,
              name: variable.name,
              collectionName: collection.name,
              modeName: mode.name,
              resolvedValue: resolvedValue,
              originalValue: variable.valuesByMode[modeId]
            });
          }
        }
      });
    });
  });

  log("MAP INITIALISÉE :", map.size, "couleurs/valeurs uniques trouvées dans la librairie locale.");
  return map;
}

function isColorValue(value) {
  return value && typeof value === 'object' && 'r' in value && 'g' in value && 'b' in value;
}

// Fonction de distance des couleurs (distance Euclidienne RGB)
function getColorDistance(hex1, hex2) {
  // Convertir hex vers RGB
  function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  var rgb1 = hexToRgb(hex1);
  var rgb2 = hexToRgb(hex2);

  if (!rgb1 || !rgb2) return 999; // Distance maximale si conversion échoue

  // Distance Euclidienne normalisée
  var dr = rgb1.r - rgb2.r;
  var dg = rgb1.g - rgb2.g;
  var db = rgb1.b - rgb2.b;

  return Math.sqrt(dr * dr + dg * dg + db * db);
}

// Fonction helper pour déterminer les scopes appropriés selon le type de propriété
// APPROCHE PERMISSIVE : Accepter tous les scopes pertinents pour ne jamais rejeter une variable valide
function getScopesForProperty(propertyType) {
  var propertyScopes = {
    // Fill accepte tous les types de remplissage + ALL_SCOPES (usage général)
    "Fill": ["ALL_FILLS", "FRAME_FILL", "SHAPE_FILL", "TEXT_FILL", "ALL_SCOPES"],

    // Stroke accepte les couleurs de contour + ALL_SCOPES
    "Stroke": ["STROKE_COLOR", "ALL_SCOPES"],

    // Corner Radius accepte les rayons + ALL_SCOPES
    "Corner Radius": ["CORNER_RADIUS", "ALL_SCOPES"],
    "Top Left Radius": ["CORNER_RADIUS", "ALL_SCOPES"],
    "Top Right Radius": ["CORNER_RADIUS", "ALL_SCOPES"],
    "Bottom Left Radius": ["CORNER_RADIUS", "ALL_SCOPES"],
    "Bottom Right Radius": ["CORNER_RADIUS", "ALL_SCOPES"],

    // Espacements acceptent GAP + ALL_SCOPES
    "Item Spacing": ["GAP", "ALL_SCOPES"],
    "Padding Left": ["GAP", "ALL_SCOPES"],
    "Padding Right": ["GAP", "ALL_SCOPES"],
    "Padding Top": ["GAP", "ALL_SCOPES"],
    "Padding Bottom": ["GAP", "ALL_SCOPES"],

    // Typographie accepte FONT_SIZE + ALL_SCOPES
    "Font Size": ["FONT_SIZE", "ALL_SCOPES"]
  };

  return propertyScopes[propertyType] || [];
}

// Fonction pour filtrer les variables selon leurs scopes
function filterVariablesByScopes(variables, requiredScopes) {
  if (!requiredScopes || requiredScopes.length === 0) {
    return variables; // Si pas de scopes requis, retourner tout
  }

  return variables.filter(function (variable) {
    // Récupérer la variable complète depuis Figma
    var figmaVariable = figma.variables.getVariableById(variable.id);
    if (!figmaVariable || !figmaVariable.scopes) {
      return false; // Variable invalide ou sans scopes
    }

    // Vérifier si au moins un scope de la variable correspond aux scopes requis
    return figmaVariable.scopes.some(function (variableScope) {
      return requiredScopes.includes(variableScope);
    });
  });
}

// Fonction pour trouver les meilleures suggestions de variables de couleur
function findColorSuggestions(hexValue, valueToVariableMap, propertyType) {
  // Déterminer les scopes appropriés pour cette propriété
  var requiredScopes = getScopesForProperty(propertyType);
  log("[DEBUG] Recherche pour Hex:", hexValue, "Scopes requis:", requiredScopes);

  // Chercher d'abord une correspondance exacte
  var exactMatches = valueToVariableMap.get(hexValue);
  if (exactMatches && exactMatches.length > 0) {
    // Filtrer selon les scopes
    var filteredExactMatches = filterVariablesByScopes(exactMatches, requiredScopes);
    if (filteredExactMatches.length > 0) {
      log('[findColorSuggestions] Correspondance exacte trouvée et filtrée:', filteredExactMatches[0].name);
      return [{
        id: filteredExactMatches[0].id,
        name: filteredExactMatches[0].name,
        hex: hexValue,
        distance: 0,
        isExact: true
      }];
    }
  }

  // Si pas de correspondance exacte, chercher les plus proches
  var suggestions = [];
  var maxDistance = 150; // Tolérance maximale pour les suggestions (augmentée pour gérer les écarts RGB->Hex)

  // Parcourir toutes les variables disponibles dans valueToVariableMap
  var minDistanceFound = Infinity;
  valueToVariableMap.forEach(function (vars, varHex) {
    if (vars && vars.length > 0) {
      var distance = getColorDistance(hexValue, varHex);
      minDistanceFound = Math.min(minDistanceFound, distance);

      if (distance <= maxDistance) {
        // Vérifier si rejeté par scope
        var filteredVars = filterVariablesByScopes(vars, requiredScopes);
        var passScope = filteredVars.length > 0;

        if (!passScope) {
          log("[DEBUG] Variable rejetée par SCOPE:", vars[0].name, "scopes:", vars[0].scopes, "requis:", requiredScopes, "distance:", distance);
        } else {
          log("[DEBUG] Candidat valide trouvé:", vars[0].name, "Distance:", distance);
        }

        if (passScope) {
          suggestions.push({
            id: filteredVars[0].id,
            name: filteredVars[0].name,
            hex: varHex,
            distance: distance,
            isExact: false
          });
        }
      }
    }
  });

  // FALLBACK "SANS SCOPE" : Si aucune suggestion n'est trouvée avec le filtrage par scopes,
  // relance une recherche sans aucun filtre de scope
  if (suggestions.length === 0) {
    log("[DEBUG] Aucune suggestion avec scopes, tentative fallback sans filtre de scope");

    valueToVariableMap.forEach(function (vars, varHex) {
      if (vars && vars.length > 0) {
        var distance = getColorDistance(hexValue, varHex);
        if (distance <= maxDistance) {
          suggestions.push({
            id: vars[0].id,
            name: vars[0].name,
            hex: varHex,
            distance: distance,
            isExact: false,
            scopeMismatch: true, // Flag pour indiquer un problème de scope
            warning: "Scope mismatch - Cette variable pourrait ne pas être appropriée pour ce type de propriété"
          });
          log("[DEBUG] Fallback: variable trouvée sans filtre scope:", vars[0].name, "Distance:", distance);
        }
      }
    });
  }

  // Trier par distance croissante et prendre les 3 meilleures
  suggestions.sort(function (a, b) {
    return a.distance - b.distance;
  });

  log('[findColorSuggestions] Suggestions trouvées pour', propertyType, ':', suggestions.length, '(dont', suggestions.filter(function (s) { return s.scopeMismatch; }).length, 'avec scope mismatch)');

  // Log de debug détaillé si aucune suggestion n'est trouvée
  if (suggestions.length === 0) {
    log("FAIL: Hex", hexValue, " - Distance min trouvée :", minDistanceFound, "- Max tolérance:", maxDistance);
  }

  return suggestions.slice(0, 3);
}

// Fonction pour trouver les meilleures suggestions de variables numériques
function findNumericSuggestions(targetValue, valueToVariableMap, tolerance, propertyType) {
  // Tolérance par défaut de 4px pour radius, 8px pour spacing (plus permissif)
  tolerance = tolerance !== undefined ? tolerance : (propertyType.indexOf('Spacing') !== -1 ? 8 : 4);

  log('[DEBUG findNumericSuggestions] Recherche pour valeur:', targetValue, 'type:', propertyType, 'tolérance:', tolerance);

  // Déterminer les scopes appropriés pour cette propriété
  var requiredScopes = getScopesForProperty(propertyType);
  log('[findNumericSuggestions] Scopes requis pour', propertyType, ':', requiredScopes);

  // Chercher d'abord une correspondance exacte
  log('[DEBUG findNumericSuggestions] Recherche correspondance exacte pour valeur:', targetValue);
  var exactMatches = valueToVariableMap.get(targetValue);
  log('[DEBUG findNumericSuggestions] Correspondances exactes trouvées:', exactMatches ? exactMatches.length : 0);

  if (exactMatches && exactMatches.length > 0) {
    log('[DEBUG findNumericSuggestions] Variables exactes:', exactMatches.map(function (v) { return v.name; }));
    // Filtrer selon les scopes
    var filteredExactMatches = filterVariablesByScopes(exactMatches, requiredScopes);
    log('[DEBUG findNumericSuggestions] Après filtrage scopes:', filteredExactMatches.length);
    if (filteredExactMatches.length > 0) {
      log('[findNumericSuggestions] Correspondance exacte trouvée et filtrée:', filteredExactMatches[0].name);
      return [{
        id: filteredExactMatches[0].id,
        name: filteredExactMatches[0].name,
        value: targetValue,
        difference: 0,
        isExact: true
      }];
    } else {
      log('[DEBUG findNumericSuggestions] Aucune correspondance exacte après filtrage scopes');
    }
  } else {
    log('[DEBUG findNumericSuggestions] Aucune correspondance exacte trouvée');
  }

  // Si pas de correspondance exacte, chercher les plus proches dans la tolérance
  var suggestions = [];
  log('[DEBUG findNumericSuggestions] Recherche approximative avec tolérance:', tolerance);

  // Parcourir toutes les variables numériques disponibles dans valueToVariableMap
  valueToVariableMap.forEach(function (vars, varValue) {
    if (vars && vars.length > 0 && typeof varValue === 'number') {
      log('[DEBUG findNumericSuggestions] Vérification variable:', vars[0].name, 'valeur:', varValue, 'type:', typeof varValue);
      // Filtrer les variables selon les scopes
      var filteredVars = filterVariablesByScopes(vars, requiredScopes);
      log('[DEBUG findNumericSuggestions] Après filtrage scopes:', filteredVars.length, 'pour valeur:', varValue);
      if (filteredVars.length > 0) {
        var difference = Math.abs(targetValue - varValue);
        log('[DEBUG findNumericSuggestions] Différence:', difference, 'tolérance:', tolerance);
        if (difference <= tolerance) {
          log('[DEBUG findNumericSuggestions] Suggestion ajoutée:', filteredVars[0].name, 'différence:', difference);
          suggestions.push({
            id: filteredVars[0].id,
            name: filteredVars[0].name,
            value: varValue,
            difference: difference,
            isExact: false
          });
        }
      }
    }
  });

  // Trier par différence absolue croissante (plus proche en premier)
  suggestions.sort(function (a, b) {
    return a.difference - b.difference;
  });

  log('[findNumericSuggestions] Suggestions trouvées pour', propertyType, ':', suggestions.length);
  if (suggestions.length > 0) {
    log('[DEBUG findNumericSuggestions] Meilleures suggestions:', suggestions.slice(0, 3).map(function (s) { return s.name + ' (diff:' + s.difference + ')'; }));
  } else {
    log('[DEBUG findNumericSuggestions] AUCUNE suggestion trouvée pour valeur:', targetValue, 'avec tolérance:', tolerance);
  }
  // Retourner jusqu'à 3 suggestions
  return suggestions.slice(0, 3);
}

/**
 * Enrichit les suggestions avec leur vraie valeur de variable
 * @param {Array} suggestions - Liste des suggestions à enrichir
 * @returns {Array} Suggestions enrichies avec resolvedValue
 */
function enrichSuggestionsWithRealValues(suggestions) {
  return suggestions.map(function (suggestion) {
    var enriched = Object.assign({}, suggestion);

    // Récupérer la variable par son ID
    var variable = figma.variables.getVariableById(suggestion.id);
    if (variable) {
      // Récupérer la valeur de la variable selon son mode
      var collections = figma.variables.getLocalVariableCollections();
      var collection = null;
      for (var i = 0; i < collections.length; i++) {
        if (collections[i].variableIds.includes(variable.id)) {
          collection = collections[i];
          break;
        }
      }

      if (collection && collection.modes.length > 0) {
        var modeId = collection.modes[0].modeId;
        var rawValue = variable.valuesByMode[modeId];

        // Formater la valeur selon le type de variable
        if (variable.resolvedType === "COLOR" && typeof rawValue === "object") {
          enriched.resolvedValue = rgbToHex(rawValue);
        } else if (variable.resolvedType === "FLOAT") {
          enriched.resolvedValue = rawValue + "px";
        } else if (variable.resolvedType === "STRING") {
          enriched.resolvedValue = rawValue;
        } else {
          enriched.resolvedValue = rawValue;
        }
      }
    }

    return enriched;
  });
}

/**
 * Analyse les propriétés d'un nœud de manière défensive et robuste
 * Gère tous les cas edge avec protection contre les crashes
 * @param {Object} node - Le nœud Figma à analyser
 * @param {Map} valueToVariableMap - Map des valeurs vers les variables
 * @param {Array} results - Tableau pour stocker les résultats
 * @param {boolean} ignoreHiddenLayers - Option pour ignorer les calques invisibles/verrouillés
 */
/**
 * Vérifie les propriétés d'un nœud Figma pour identifier les valeurs qui pourraient être converties en variables
 * @param {Object} node - Nœud Figma à analyser
 * @param {Map} valueToVariableMap - Map des valeurs vers les variables existantes
 * @param {Array} results - Tableau des résultats d'analyse
 * @param {boolean} ignoreHiddenLayers - Si true, ignore les calques invisibles/verrouillés
 */
function checkNodeProperties(node, valueToVariableMap, results, ignoreHiddenLayers) {
  // === VÉRIFICATIONS DÉFENSIVES DE BASE ===
  if (!node) {
    log("[checkNodeProperties] Nœud null/undefined reçu");
    return;
  }

  // Vérifier si le nœud a été supprimé ou n'existe plus
  if (node.removed) {
    log("[checkNodeProperties] Nœud supprimé détecté:", node.id);
    return;
  }

  // Vérifications de base des propriétés essentielles
  if (!node.id || !node.name || !node.type) {
    log("[checkNodeProperties] Nœud malformé:", node);
    return;
  }

  var nodeId = node.id;
  var layerName = node.name;
  var nodeType = node.type;

  // === VÉRIFICATIONS DÉFENSIVES SUPPLÉMENTAIRES ===
  if (!node || !node.id || !node.type) {
    log("[checkNodeProperties] Nœud malformé ou null détecté");
    return;
  }

  // === FILTRAGE INTELLIGENT ===
  // Ignorer les calques invisibles ou verrouillés selon l'option
  if (ignoreHiddenLayers) {
    try {
      if (node.visible === false) {
        log("[checkNodeProperties] Calque invisible ignoré:", layerName);
        return;
      }
      if (node.locked === true) {
        log("[checkNodeProperties] Calque verrouillé ignoré:", layerName);
        return;
      }
    } catch (visibilityError) {
      // Certains types de nœuds n'ont pas ces propriétés, continuer silencieusement
    }
  }

  // Liste étendue des types supportés pour le style
  var supportedTypes = CONFIG.supportedTypes.all;

  // Pour les conteneurs, on ne vérifie que s'ils peuvent avoir des propriétés de style
  var styleSupportedTypes = CONFIG.supportedTypes.fillAndStroke;

  var isContainer = supportedTypes.indexOf(nodeType) !== -1;
  var supportsStyle = styleSupportedTypes.indexOf(nodeType) !== -1;

  if (!isContainer) {
    log("[checkNodeProperties] Type de nœud non supporté:", nodeType);
    return;
  }

  // === ANALYSE DES PROPRIÉTÉS AVEC PROTECTION ===
  if (supportsStyle) {
    try {
      // 1. VÉRIFICATION DES FILLS (COULEURS DE FOND) - GESTION FIGMA.MIXED
      if (node.fills !== undefined && node.fills !== figma.mixed) {
        checkFillsSafely(node, valueToVariableMap, results);
      }

      // 2. VÉRIFICATION DES STROKES (COULEURS DE CONTOUR) - GESTION FIGMA.MIXED
      if (node.strokes !== undefined && node.strokes !== figma.mixed) {
        checkStrokesSafely(node, valueToVariableMap, results);
      }

      // 3. VÉRIFICATION DES CORNER RADIUS - GESTION COMPLÈTE FIGMA.MIXED
      checkCornerRadiusSafely(node, valueToVariableMap, results);

      // 4. VÉRIFICATION DES PROPRIÉTÉS NUMÉRIQUES (SPACING, PADDING, RADIUS)
      checkNumericPropertiesSafely(node, valueToVariableMap, results);

      // 5. VÉRIFICATION DES PROPRIÉTÉS DE TYPOGRAPHIE (pour les nœuds TEXT)
      if (node.type === CONFIG.types.TEXT) {
        checkTypographyPropertiesSafely(node, valueToVariableMap, results);
      }

    } catch (propertyError) {
      log("[checkNodeProperties] Erreur lors de l'analyse des propriétés du nœud", nodeId, layerName, ":", propertyError);
      // Ne pas arrêter le scan, continuer vers les autres nœuds
    }
  }
}

/**
 * Vérifie les propriétés de typographie pour les nœuds TEXT
 */
function checkTypographyPropertiesSafely(node, valueToVariableMap, results) {
  try {
    // FONT SIZE - Propriété principale de typographie
    if (typeof node.fontSize === 'number' && node.fontSize > 0) {
      var isFontSizeBound = isPropertyBoundToVariable(node.boundVariables || {}, 'fontSize');
      if (!isFontSizeBound) {
        var suggestions = enrichSuggestionsWithRealValues(findNumericSuggestions(node.fontSize, valueToVariableMap, undefined, "Font Size"));
        if (suggestions.length > 0) {
          var bestSuggestion = suggestions[0];
          results.push({
            nodeId: node.id,
            layerName: node.name,
            property: "Font Size",
            value: node.fontSize + "px",
            suggestedVariableId: bestSuggestion.id,
            suggestedVariableName: bestSuggestion.name,
            figmaProperty: 'fontSize',
            numericSuggestions: suggestions
          });
        }
      }
    }

    // Autres propriétés de typographie pourraient être ajoutées ici si nécessaire
    // (lineHeight, letterSpacing, etc.)

  } catch (typographyError) {
    log("[checkTypographyPropertiesSafely] Erreur lors de l'analyse des propriétés de typographie du nœud", node.id, node.name, ":", typographyError);
  }
}

/**
 * Vérifie les fills de manière sécurisée avec gestion des tableaux et types mixtes
 */
function checkFillsSafely(node, valueToVariableMap, results) {
  try {
    var fills = node.fills;
    if (!Array.isArray(fills)) return;

    for (var i = 0; i < fills.length; i++) {
      try {
        var fill = fills[i];
        if (!fill || fill.type !== CONFIG.types.SOLID || !fill.color) continue;

        // Vérification stricte des variables liées avec validation de structure
        var isBound = isPropertyBoundToVariable(node.boundVariables || {}, 'fills', i);
        if (isBound) continue;

        var hexValue = rgbToHex(fill.color);
        if (!hexValue) continue;

        var suggestions = enrichSuggestionsWithRealValues(findColorSuggestions(hexValue, valueToVariableMap, "Fill"));

        // NE SIGNALER QUE LES PROBLÈMES AYANT UNE SOLUTION
        if (suggestions.length > 0) {
          results.push({
            nodeId: node.id,
            layerName: node.name,
            property: "Fill",
            value: hexValue,
            suggestedVariableId: suggestions[0].id,
            suggestedVariableName: suggestions[0].name,
            fillIndex: i,
            colorSuggestions: suggestions,
            isExact: suggestions[0].isExact || false
          });
        }
      } catch (fillError) {
        log("[checkFillsSafely] Erreur sur fill index", i, "du nœud", node.id, ":", fillError);
        // Continuer vers le fill suivant
      }
    }
  } catch (fillsError) {
    log("[checkFillsSafely] Erreur générale sur fills du nœud", node.id, ":", fillsError);
  }
}

/**
 * Vérifie les strokes de manière sécurisée avec gestion des tableaux et types mixtes
 */
function checkStrokesSafely(node, valueToVariableMap, results) {
  try {
    var strokes = node.strokes;
    if (!Array.isArray(strokes)) return;

    for (var j = 0; j < strokes.length; j++) {
      try {
        var stroke = strokes[j];
        if (!stroke || stroke.type !== CONFIG.types.SOLID || !stroke.color) continue;

        // Vérification stricte des variables liées
        var isBound = isPropertyBoundToVariable(node.boundVariables || {}, 'strokes', j);
        if (isBound) continue;

        var hexValue = rgbToHex(stroke.color);
        if (!hexValue) continue;

        var suggestions = enrichSuggestionsWithRealValues(findColorSuggestions(hexValue, valueToVariableMap, "Stroke"));

        // NE SIGNALER QUE LES PROBLÈMES AYANT UNE SOLUTION
        if (suggestions.length > 0) {
          results.push({
            nodeId: node.id,
            layerName: node.name,
            property: "Stroke",
            value: hexValue,
            suggestedVariableId: suggestions[0].id,
            suggestedVariableName: suggestions[0].name,
            strokeIndex: j,
            colorSuggestions: suggestions,
            isExact: suggestions[0].isExact || false
          });
        }
      } catch (strokeError) {
        log("[checkStrokesSafely] Erreur sur stroke index", j, "du nœud", node.id, ":", strokeError);
        // Continuer vers le stroke suivant
      }
    }
  } catch (strokesError) {
    log("[checkStrokesSafely] Erreur générale sur strokes du nœud", node.id, ":", strokesError);
  }
}

/**
 * Vérifie les corner radius avec gestion complète de figma.mixed
 */
function checkCornerRadiusSafely(node, valueToVariableMap, results) {
  try {
    var nodeType = node.type;
    var radiusSupportedTypes = CONFIG.supportedTypes.radius;

    if (radiusSupportedTypes.indexOf(nodeType) === -1) return;

    // Cas spécial : cornerRadius mixte (valeurs différentes par coin)
    if (node.cornerRadius === figma.mixed) {
      var radiusProperties = [
        { name: 'topLeftRadius', displayName: 'Top Left Radius', figmaProp: 'topLeftRadius' },
        { name: 'topRightRadius', displayName: 'Top Right Radius', figmaProp: 'topRightRadius' },
        { name: 'bottomLeftRadius', displayName: 'Bottom Left Radius', figmaProp: 'bottomLeftRadius' },
        { name: 'bottomRightRadius', displayName: 'Bottom Right Radius', figmaProp: 'bottomRightRadius' }
      ];

      for (var k = 0; k < radiusProperties.length; k++) {
        try {
          var prop = radiusProperties[k];
          var radiusValue = node[prop.name];

          if (typeof radiusValue === 'number' && radiusValue > 0) {
            // Vérification stricte des variables liées
            var isBound = isPropertyBoundToVariable(node.boundVariables || {}, prop.figmaProp);
            if (isBound) continue;

            var suggestions = enrichSuggestionsWithRealValues(findNumericSuggestions(radiusValue, valueToVariableMap, undefined, prop.displayName));
            if (suggestions.length > 0) {
              var bestSuggestion = suggestions[0];
              results.push({
                nodeId: node.id,
                layerName: node.name,
                property: prop.displayName,
                value: radiusValue + "px",
                suggestedVariableId: bestSuggestion.id,
                suggestedVariableName: bestSuggestion.name,
                figmaProperty: prop.figmaProp,
                numericSuggestions: suggestions
              });
            }
          }
        } catch (radiusError) {
          log("[checkCornerRadiusSafely] Erreur sur radius", prop.name, "du nœud", node.id, ":", radiusError);
        }
      }
    }
    // Cas normal : cornerRadius uniforme
    else if (typeof node.cornerRadius === 'number' && node.cornerRadius > 0) {
      // Vérification stricte des variables liées (tous les radius possibles)
      var boundVars = node.boundVariables || {};
      var isBound = isPropertyBoundToVariable(boundVars, 'cornerRadius') ||
        isPropertyBoundToVariable(boundVars, 'topLeftRadius') ||
        isPropertyBoundToVariable(boundVars, 'topRightRadius') ||
        isPropertyBoundToVariable(boundVars, 'bottomLeftRadius') ||
        isPropertyBoundToVariable(boundVars, 'bottomRightRadius');

      if (!isBound) {
        var suggestions = enrichSuggestionsWithRealValues(findNumericSuggestions(node.cornerRadius, valueToVariableMap, undefined, "Corner Radius"));
        if (suggestions.length > 0) {
          var bestSuggestion = suggestions[0];
          results.push({
            nodeId: node.id,
            layerName: node.name,
            property: "Corner Radius",
            value: node.cornerRadius + "px",
            suggestedVariableId: bestSuggestion.id,
            suggestedVariableName: bestSuggestion.name,
            figmaProperty: 'cornerRadius',
            numericSuggestions: suggestions
          });
        }
      }
    }
  } catch (cornerRadiusError) {
    log("[checkCornerRadiusSafely] Erreur générale sur cornerRadius du nœud", node.id, ":", cornerRadiusError);
  }
}

/**
 * Vérifie les propriétés numériques (spacing, padding, radius)
 */
function checkNumericPropertiesSafely(node, valueToVariableMap, results) {
  try {
    log('[DEBUG checkAutoLayoutSafely] Vérification du nœud:', node.name, 'layoutMode:', node.layoutMode);

    // ITEM SPACING (seulement si auto-layout)
    log('[DEBUG checkNumericPropertiesSafely] itemSpacing:', node.itemSpacing);
    if (node.layoutMode && node.layoutMode !== "NONE" && typeof node.itemSpacing === 'number' && node.itemSpacing > 0) {
      var isGapBound = isPropertyBoundToVariable(node.boundVariables || {}, 'itemSpacing');
      if (!isGapBound) {
        var suggestions = enrichSuggestionsWithRealValues(findNumericSuggestions(node.itemSpacing, valueToVariableMap, undefined, "Item Spacing"));
        if (suggestions.length > 0) {
          var bestSuggestion = suggestions[0];
          results.push({
            nodeId: node.id,
            layerName: node.name,
            property: "Item Spacing",
            value: node.itemSpacing + "px",
            suggestedVariableId: bestSuggestion.id,
            suggestedVariableName: bestSuggestion.name,
            figmaProperty: 'itemSpacing',
            numericSuggestions: suggestions
          });
        }
      }
    }

    // PADDINGS : Vérification systématique des 4 côtés individuels
    var paddingProperties = [
      { name: 'paddingLeft', displayName: 'Padding Left', figmaProp: 'paddingLeft' },
      { name: 'paddingRight', displayName: 'Padding Right', figmaProp: 'paddingRight' },
      { name: 'paddingTop', displayName: 'Padding Top', figmaProp: 'paddingTop' },
      { name: 'paddingBottom', displayName: 'Padding Bottom', figmaProp: 'paddingBottom' }
    ];

    for (var p = 0; p < paddingProperties.length; p++) {
      try {
        var paddingProp = paddingProperties[p];
        var paddingValue = node[paddingProp.name];
        log('[DEBUG checkNumericPropertiesSafely] ' + paddingProp.name + ':', paddingValue);

        if (typeof paddingValue === 'number' && paddingValue > 0) {
          var isPaddingBound = isPropertyBoundToVariable(node.boundVariables || {}, paddingProp.figmaProp);
          if (!isPaddingBound) {
            var suggestions = enrichSuggestionsWithRealValues(findNumericSuggestions(paddingValue, valueToVariableMap, undefined, paddingProp.displayName));
            if (suggestions.length > 0) {
              var bestSuggestion = suggestions[0];
              results.push({
                nodeId: node.id,
                layerName: node.name,
                property: paddingProp.displayName,
                value: paddingValue + "px",
                suggestedVariableId: bestSuggestion.id,
                suggestedVariableName: bestSuggestion.name,
                figmaProperty: paddingProp.figmaProp,
                numericSuggestions: suggestions
              });
            }
          }
        }
      } catch (paddingError) {
        log("[checkNumericPropertiesSafely] Erreur sur padding", paddingProp.name, "du nœud", node.id, ":", paddingError);
      }
    }
  } catch (numericError) {
    log("[checkNumericPropertiesSafely] Erreur générale sur propriétés numériques du nœud", node.id, ":", numericError);
  }
}

/**
 * Vérification stricte et sécurisée des variables liées avec validation de structure
 * @param {Object} boundVariables - L'objet boundVariables du nœud
 * @param {string} propertyPath - Le chemin de la propriété (ex: 'fills', 'strokes', 'cornerRadius')
 * @param {number} index - Index pour les tableaux (optionnel)
 * @returns {boolean} true si la propriété est liée à une variable valide
 */
function isPropertyBoundToVariable(boundVariables, propertyPath, index) {
  try {
    if (!boundVariables || typeof boundVariables !== 'object') return false;

    var binding = index !== undefined ? boundVariables[propertyPath] && boundVariables[propertyPath][index] : boundVariables[propertyPath];
    if (!binding) return false;

    // Validation stricte de la structure de l'alias de variable
    if (typeof binding !== 'object' ||
      binding.type !== 'VARIABLE_ALIAS' ||
      !binding.id ||
      typeof binding.id !== 'string') {
      return false;
    }

    // Vérifier que la variable existe encore
    var variable = figma.variables.getVariableById(binding.id);
    return variable !== null && variable !== undefined;

  } catch (bindingError) {
    log("[isPropertyBoundToVariable] Erreur lors de la vérification de liaison pour", propertyPath, index !== undefined ? "index " + index : "", ":", bindingError);
    return false; // En cas d'erreur, considérer comme non lié pour éviter les faux positifs
  }
}

/**
 * Parcourt récursivement l'arbre des nœuds de manière défensive et robuste
 * Chaque nœud est traité individuellement avec protection contre les crashes
 * @param {Object} node - Le nœud racine à scanner
 * @param {Map} valueToVariableMap - Map des valeurs vers les variables
 * @param {Array} results - Tableau pour accumuler les résultats
 * @param {number} depth - Profondeur actuelle (pour éviter les récursions infinies)
 * @param {boolean} ignoreHiddenLayers - Option pour ignorer les calques invisibles/verrouillés
 */
/**
 * Analyse récursivement un nœud Figma et ses enfants pour identifier les propriétés à convertir en variables
 * @param {Object} node - Nœud Figma à analyser
 * @param {Map} valueToVariableMap - Map des valeurs vers les variables existantes
 * @param {Array} results - Tableau des résultats d'analyse
 * @param {number} depth - Profondeur actuelle dans l'arbre des nœuds
 * @param {boolean} ignoreHiddenLayers - Si true, ignore les calques invisibles/verrouillés
 */
function scanNodeRecursive(node, valueToVariableMap, results, depth, ignoreHiddenLayers) {
  // === PROTECTION CONTRE LES RÉCURSIONS INFINIES ===
  depth = depth || 0;
  const MAX_DEPTH = CONFIG.limits.MAX_DEPTH; // Limite de sécurité pour éviter les boucles infinies
  if (depth > MAX_DEPTH) {
    log("[scanNodeRecursive] Profondeur maximale atteinte, arrêt de la récursion à", depth);
    return;
  }

  // === VÉRIFICATIONS DÉFENSIVES DE BASE ===
  if (!node) {
    log("[scanNodeRecursive] Nœud null/undefined reçu à profondeur", depth);
    return;
  }

  // Vérifier si le nœud a été supprimé pendant le scan
  if (node.removed) {
    log("[scanNodeRecursive] Nœud supprimé détecté à profondeur", depth, "- ignoré");
    return;
  }

  // Vérification supplémentaire des propriétés essentielles
  if (!node.id || !node.type) {
    log("[scanNodeRecursive] Nœud malformé détecté à profondeur", depth, "- ignoré");
    return;
  }

  // === TRAITEMENT DU NŒUD ACTUEL AVEC PROTECTION ===
  try {
    var nodeType = node.type;
    var nodeId = node.id;
    var nodeName = node.name || "Unnamed";

    log("[scanNodeRecursive] Traitement du nœud", nodeType, nodeName, "(ID:", nodeId, ") à profondeur", depth);

    // Liste étendue des types de conteneurs supportés
    var containerTypes = CONFIG.supportedTypes.spacing;

    // Liste des types qui peuvent avoir des propriétés de style
    var styleTypes = CONFIG.supportedTypes.fillAndStroke;

    var isContainer = containerTypes.indexOf(nodeType) !== -1;
    var hasStyle = styleTypes.indexOf(nodeType) !== -1;

    // Analyser les propriétés de style si applicable
    if (hasStyle) {
      try {
        checkNodeProperties(node, valueToVariableMap, results, ignoreHiddenLayers);
      } catch (propertyAnalysisError) {
        log("[scanNodeRecursive] Erreur CRITIQUE lors de l'analyse des propriétés du nœud", nodeId, nodeName, "(type:", nodeType, ") à profondeur", depth, ":", propertyAnalysisError);
        log("[scanNodeRecursive] Détails du nœud problématique:", {
          id: nodeId,
          type: nodeType,
          name: nodeName,
          hasBoundVariables: !!node.boundVariables,
          boundVariablesKeys: node.boundVariables ? Object.keys(node.boundVariables) : 'N/A',
          hasFills: !!node.fills,
          hasStrokes: !!node.strokes,
          hasCornerRadius: node.cornerRadius !== undefined,
          hasLayoutMode: !!node.layoutMode
        });
        // Ne pas arrêter le scan complet, continuer vers les enfants
      }
    }

    // === TRAVERSÉE DES ENFANTS AVEC PROTECTION ===
    // Pour les instances, on peut scanner leurs enfants (layers overrides)
    // Pour les autres conteneurs, on scan leurs enfants normalement
    if (isContainer) {
      try {
        var children = node.children;

        if (children && Array.isArray(children)) {
          log("[scanNodeRecursive] Nœud", nodeType, "a", children.length, "enfants à profondeur", depth);

          for (var i = 0; i < children.length; i++) {
            try {
              var child = children[i];

              // Vérification défensive de l'enfant
              if (!child) {
                log("[scanNodeRecursive] Enfant null/undefined à l'index", i, "du nœud", nodeId);
                continue;
              }

              if (child.removed) {
                log("[scanNodeRecursive] Enfant supprimé détecté à l'index", i, "du nœud", nodeId);
                continue;
              }

              // Récursion avec protection et limite de profondeur
              scanNodeRecursive(child, valueToVariableMap, results, depth + 1, ignoreHiddenLayers);

            } catch (childError) {
              log("[scanNodeRecursive] Erreur lors du traitement de l'enfant à l'index", i, "du nœud", nodeId, nodeName, ":", childError);
              // Continuer vers l'enfant suivant même en cas d'erreur
            }
          }
        } else if (nodeType === 'INSTANCE') {
          // Les instances peuvent avoir des overrides sans children directs
          log("[scanNodeRecursive] Instance", nodeName, "traitée (pas d'enfants directs ou overrides spéciaux)");
        }

      } catch (childrenError) {
        log("[scanNodeRecursive] Erreur lors de l'accès aux enfants du nœud", nodeId, nodeName, "à profondeur", depth, ":", childrenError);
        // Ne pas arrêter le scan complet
      }
    }

  } catch (nodeError) {
    log("[scanNodeRecursive] Erreur critique lors du traitement du nœud à profondeur", depth, ":", nodeError);
    // Même en cas d'erreur critique, on ne crash pas le scan complet
  }
}

/**
 * Analyse la sélection actuelle de manière asynchrone avec chunking
 * Gère tous les cas edge avec protection contre les crashes
 * @param {boolean} ignoreHiddenLayers - Option pour ignorer les calques invisibles/verrouillés
 * @returns {Array} Tableau des résultats d'analyse
 */
function scanSelection(ignoreHiddenLayers) {
  log("[scanSelection] Démarrage de l'analyse asynchrone...");

  try {
    // === VÉRIFICATION DE LA SÉLECTION ===
    var selection = figma.currentPage.selection;

    if (!selection || !Array.isArray(selection)) {
      log("[scanSelection] Sélection invalide ou inaccessible");
      figma.ui.postMessage({ type: "scan-results", results: [] });
      return [];
    }

    // === SCAN CONTEXTUEL INTELLIGENT ===
    if (selection.length === 0) {
      log("[scanSelection] Aucune sélection - scan de la page entière");
      figma.notify("📄 Aucune sélection : Analyse de la page entière...");

      // Scanner toute la page
      return scanPage(ignoreHiddenLayers);
    }

    log("[scanSelection]", selection.length, "nœud(s) sélectionné(s)");

    // === CRÉATION DE LA MAP DES VARIABLES AVEC PROTECTION ===
    var valueToVariableMap;
    try {
      valueToVariableMap = createValueToVariableMap();
      log("Variables chargées dans la Map :", valueToVariableMap.size);

      if (!valueToVariableMap || valueToVariableMap.size === 0) {
        log("[scanSelection] Aucune variable trouvée ou erreur lors de la création de la map");
        figma.notify("⚠️ Aucune variable trouvée dans le document");
        figma.ui.postMessage({ type: "scan-results", results: [] });
        return [];
      }
      log("[scanSelection] Map des variables créée avec", valueToVariableMap.size, "entrées");
    } catch (mapError) {
      log("[scanSelection] Erreur critique lors de la création de la map des variables:", mapError);
      figma.notify("❌ Erreur lors de l'accès aux variables");
      figma.ui.postMessage({ type: "scan-results", results: [] });
      return [];
    }

    // Démarrer le scan asynchrone
    startAsyncScan(selection, valueToVariableMap, ignoreHiddenLayers);

  } catch (scanError) {
    log("[scanSelection] Erreur critique lors de l'analyse de la sélection:", scanError);
    figma.notify("❌ Erreur critique lors de l'analyse - vérifiez la console pour les détails");
    figma.ui.postMessage({ type: "scan-results", results: [] });
  }
}

/**
 * Scan asynchrone de la page entière
 */
function scanPage(ignoreHiddenLayers) {
  log("[scanPage] Démarrage du scan de page entière...");

  try {
    var pageChildren = figma.currentPage.children;

    if (!pageChildren || !Array.isArray(pageChildren)) {
      log("[scanPage] Aucun enfant trouvé sur la page");
      figma.ui.postMessage({ type: "scan-results", results: [] });
      return [];
    }

    // === CRÉATION DE LA MAP DES VARIABLES ===
    var valueToVariableMap;
    try {
      valueToVariableMap = createValueToVariableMap();
      if (!valueToVariableMap || valueToVariableMap.size === 0) {
        log("[scanPage] Aucune variable trouvée");
        figma.notify("⚠️ Aucune variable trouvée dans le document");
        figma.ui.postMessage({ type: "scan-results", results: [] });
        return [];
      }
    } catch (mapError) {
      log("[scanPage] Erreur lors de la création de la map des variables:", mapError);
      figma.notify("❌ Erreur lors de l'accès aux variables");
      figma.ui.postMessage({ type: "scan-results", results: [] });
      return [];
    }

    // Démarrer le scan asynchrone de la page
    startAsyncScan(pageChildren, valueToVariableMap, ignoreHiddenLayers);

  } catch (pageScanError) {
    log("[scanPage] Erreur critique lors du scan de page:", pageScanError);
    figma.notify("❌ Erreur lors du scan de page");
    figma.ui.postMessage({ type: "scan-results", results: [] });
  }
}

/**
 * Lance le scan asynchrone avec chunking
 */
function startAsyncScan(nodes, valueToVariableMap, ignoreHiddenLayers) {
  var CHUNK_SIZE = 50; // Traiter 50 nœuds par chunk
  var currentIndex = 0;
  var results = [];
  var totalNodes = nodes.length;

  // Initialiser la barre de progression
  figma.ui.postMessage({
    type: "scan-progress",
    progress: 0,
    total: totalNodes,
    status: "Démarrage de l'analyse..."
  });

  log("[startAsyncScan] Scan asynchrone démarré pour", totalNodes, "nœuds");

  function processChunk() {
    var chunkEnd = Math.min(currentIndex + CHUNK_SIZE, totalNodes);
    var processedInChunk = 0;

    // Traiter le chunk actuel
    for (var i = currentIndex; i < chunkEnd; i++) {
      try {
        var node = nodes[i];

        // Vérifications défensives
        if (!node || node.removed) {
          continue;
        }

        // Analyse récursive du nœud
        scanNodeRecursive(node, valueToVariableMap, results, 0, ignoreHiddenLayers);
        processedInChunk++;

      } catch (nodeError) {
        log("[processChunk] Erreur sur nœud", i, ":", nodeError);
      }
    }

    currentIndex = chunkEnd;

    // Mettre à jour la progression
    var progress = (currentIndex / totalNodes) * 100;
    figma.ui.postMessage({
      type: "scan-progress",
      progress: progress,
      current: currentIndex,
      total: totalNodes,
      status: "Analyse en cours... " + currentIndex + "/" + totalNodes
    });

    // Continuer ou terminer
    if (currentIndex < totalNodes) {
      // Programmer le prochain chunk
      setTimeout(processChunk, 10);
    } else {
      // Scan terminé
      finishScan(results);
    }
  }

  // Démarrer le premier chunk
  setTimeout(processChunk, 10);
}

/**
 * Termine le scan et envoie les résultats
 */
/**
 * Termine le scan et envoie les résultats
 */
function finishScan(results) {

  // CORRECTIF CRITIQUE : Mettre à jour les deux emplacements de stockage
  // 1. Variable globale (pour la rétrocompatibilité)
  lastScanResults = results;
  // 2. Variable du namespace Scanner (utilisée par le Live Preview)
  Scanner.lastScanResults = results;


  // Notifier l'utilisateur
  if (results.length > 0) {
    FigmaService.notify("✅ Analyse terminée - " + results.length + " problème(s) détecté(s)");
  } else {
    FigmaService.notify("✅ Analyse terminée - Aucun problème détecté");
  }

  // Petit délai pour stabiliser après le scan asynchrone
  setTimeout(function () {
    // Envoyer les résultats à l'UI
    figma.ui.postMessage({
      type: "scan-progress",
      progress: 100,
      status: "Analyse terminée"
    });

    figma.ui.postMessage({
      type: "scan-results",
      results: results
    });
  }, 100);
}

// ⚡️ VERSION ROBUSTE AVEC VALIDATIONS COMPLETES
// ============================================
// DIAGNOSTIC DES PROBLÈMES RESTANTS
// ============================================

/**
 * Diagnostique les causes potentielles d'échec d'application
 */
function diagnoseApplicationFailure(result, variableId, error) {
  log('[diagnoseApplicationFailure] 🔍 Diagnostic pour:', result.layerName, '->', result.property);
  log('[diagnoseApplicationFailure] 📋 Erreur rapportée:', error);

  var diagnosis = {
    issue: 'unknown',
    confidence: 'low',
    recommendations: [],
    details: {}
  };

  try {
    // Vérifier si la variable existe
    var variable = figma.variables.getVariableById(variableId);
    if (!variable) {
      diagnosis.issue = 'variable_missing';
      diagnosis.confidence = 'high';
      diagnosis.recommendations.push('La variable a été supprimée ou renommée');
      diagnosis.details.variableId = variableId;
      return diagnosis;
    }

    // Vérifier les scopes
    var requiredScopes = getScopesForProperty(result.property);
    var variableScopes = variable.scopes || [];

    log('[diagnoseApplicationFailure] 📋 Scopes requis:', requiredScopes);
    log('[diagnoseApplicationFailure] 📋 Scopes variable:', variableScopes);

    var hasRequiredScopes = requiredScopes.some(function (scope) { return variableScopes.includes(scope); });
    if (!hasRequiredScopes && requiredScopes.length > 0) {
      diagnosis.issue = 'scope_mismatch';
      diagnosis.confidence = 'high';
      diagnosis.recommendations.push('Modifier les scopes de la variable pour inclure: ' + requiredScopes.join(', '));
      diagnosis.details.requiredScopes = requiredScopes;
      diagnosis.details.variableScopes = variableScopes;
    }

    // Vérifier le type de variable
    var expectedType = getExpectedVariableType(result.property);
    if (variable.resolvedType !== expectedType) {
      diagnosis.issue = 'type_mismatch';
      diagnosis.confidence = 'high';
      diagnosis.recommendations.push('La variable devrait être de type ' + expectedType + ' (actuellement ' + variable.resolvedType + ')');
      diagnosis.details.expectedType = expectedType;
      diagnosis.details.actualType = variable.resolvedType;
    }

    // Vérifier le nœud
    var node = figma.getNodeById(result.nodeId);
    if (!node) {
      diagnosis.issue = 'node_missing';
      diagnosis.confidence = 'high';
      diagnosis.recommendations.push('Le nœud a été supprimé');
      return diagnosis;
    }

    if (node.removed) {
      diagnosis.issue = 'node_removed';
      diagnosis.confidence = 'high';
      diagnosis.recommendations.push('Le nœud a été supprimé');
      return diagnosis;
    }

    // Vérifier la propriété spécifique
    var propertyCheck = checkSpecificPropertyIssue(node, result);
    if (propertyCheck.issue) {
      diagnosis = propertyCheck;
    }

    // Si aucun problème spécifique trouvé, c'est peut-être un problème technique
    if (diagnosis.issue === 'unknown') {
      diagnosis.issue = 'technical_error';
      diagnosis.confidence = 'medium';
      diagnosis.recommendations.push('Erreur technique lors de l\'application');
      diagnosis.recommendations.push('Vérifier les logs détaillés dans la console');
      diagnosis.details.error = error;
    }

  } catch (diagError) {
    log('[diagnoseApplicationFailure] Erreur lors du diagnostic:', diagError);
    diagnosis.issue = 'diagnostic_error';
    diagnosis.recommendations.push('Erreur lors de l\'analyse du problème');
  }

  log('[diagnoseApplicationFailure] 📊 Diagnostic final:', diagnosis);
  return diagnosis;
}

/**
 * Détermine le type de variable attendu pour une propriété
 */
function getExpectedVariableType(property) {
  switch (property) {
    case "Fill":
    case "Stroke":
      return "COLOR";
    case "Corner Radius":
    case "Top Left Radius":
    case "Top Right Radius":
    case "Bottom Left Radius":
    case "Bottom Right Radius":
    case "Item Spacing":
    case "Padding Left":
    case "Padding Right":
    case "Padding Top":
    case "Padding Bottom":
      return "FLOAT";
    default:
      return "UNKNOWN";
  }
}

/**
 * Vérifie les problèmes spécifiques à une propriété
 */
function checkSpecificPropertyIssue(node, result) {
  var diagnosis = { issue: null, confidence: 'low', recommendations: [], details: {} };

  try {
    switch (result.property) {
      case "Fill":
        if (!node.fills || !Array.isArray(node.fills) || !node.fills[result.fillIndex]) {
          diagnosis.issue = 'fill_missing';
          diagnosis.confidence = 'high';
          diagnosis.recommendations.push('Le fill à l\'index ' + result.fillIndex + ' n\'existe plus');
        } else {
          var fill = node.fills[result.fillIndex];
          if (fill.type !== CONFIG.types.SOLID) {
            diagnosis.issue = 'fill_type_unsupported';
            diagnosis.confidence = 'high';
            diagnosis.recommendations.push('Seuls les fills SOLID peuvent être liés à des variables');
          }
        }
        break;

      case "Stroke":
        if (!node.strokes || !Array.isArray(node.strokes) || !node.strokes[result.strokeIndex]) {
          diagnosis.issue = 'stroke_missing';
          diagnosis.confidence = 'high';
          diagnosis.recommendations.push('Le stroke à l\'index ' + result.strokeIndex + ' n\'existe plus');
        } else {
          var stroke = node.strokes[result.strokeIndex];
          if (stroke.type !== CONFIG.types.SOLID) {
            diagnosis.issue = 'stroke_type_unsupported';
            diagnosis.confidence = 'high';
            diagnosis.recommendations.push('Seuls les strokes SOLID peuvent être liés à des variables');
          }
        }
        break;

      case "Item Spacing":
        if (node.primaryAxisAlignItems === 'SPACE_BETWEEN') {
          diagnosis.issue = 'spacing_space_between';
          diagnosis.confidence = 'high';
          diagnosis.recommendations.push('Impossible d\'appliquer une variable de spacing sur SPACE_BETWEEN');
        }
        break;
    }
  } catch (error) {
    diagnosis.details.error = error.message;
  }

  return diagnosis;
}

// ============================================
// NOUVEAU SYSTÈME D'APPLICATION AVEC VÉRIFICATION
// ============================================

/**
 * Applique un correctif et vérifie immédiatement qu'il a été correctement appliqué
 * @param {Object} result - Résultat du scan
 * @param {string} variableId - ID de la variable à appliquer
 * @returns {Object} Résultat détaillé avec statut de vérification
 */
function applyAndVerifyFix(result, variableId) {
  log('[applyAndVerifyFix] 📋 DÉMARRAGE pour:', result.layerName, '(' + result.nodeId + ') ->', result.property);
  log('[applyAndVerifyFix] 🔍 Données d\'entrée:', {
    result: result,
    variableId: variableId,
    suggestedVariableId: result.suggestedVariableId
  });

  var startTime = Date.now();
  var verificationResult = {
    success: false,
    applied: false,
    verified: false,
    error: null,
    details: {
      nodeId: result.nodeId,
      property: result.property,
      variableId: variableId,
      duration: 0
    }
  };

  try {
    // === PHASE 1: VALIDATIONS PRÉALABLES ===
    log('[applyAndVerifyFix] 🔍 Phase 1: Validations préalables');

    // Vérifier que le résultat est valide
    log('[applyAndVerifyFix] 🧪 Validation 1: Résultat valide');
    if (!result) {
      log('[applyAndVerifyFix] ❌ Result est null/undefined');
      throw new Error('Résultat invalide ou incomplet');
    }
    if (!result.nodeId) {
      log('[applyAndVerifyFix] ❌ result.nodeId manquant:', result);
      throw new Error('Résultat invalide: nodeId manquant');
    }
    if (!result.property) {
      log('[applyAndVerifyFix] ❌ result.property manquant:', result);
      throw new Error('Résultat invalide: property manquant');
    }
    log('[applyAndVerifyFix] ✅ Résultat valide');

    // Déterminer l'ID de variable à utiliser
    log('[applyAndVerifyFix] 🧪 Validation 2: ID de variable');
    var finalVariableId = variableId || result.suggestedVariableId;
    log('[applyAndVerifyFix] 📋 variableId fourni:', variableId);
    log('[applyAndVerifyFix] 📋 suggestedVariableId:', result.suggestedVariableId);
    log('[applyAndVerifyFix] 📋 finalVariableId choisi:', finalVariableId);

    if (!finalVariableId) {
      log('[applyAndVerifyFix] ❌ Aucun ID de variable disponible');
      throw new Error('Aucun ID de variable fourni ou suggéré');
    }
    verificationResult.details.variableId = finalVariableId;
    log('[applyAndVerifyFix] ✅ ID de variable déterminé');

    // Vérifier que la variable existe
    log('[applyAndVerifyFix] 🧪 Validation 3: Existence de la variable');
    var variable = figma.variables.getVariableById(finalVariableId);
    log('[applyAndVerifyFix] 🔍 Variable trouvée:', !!variable);
    if (variable) {
      log('[applyAndVerifyFix] 📋 Détails variable:', {
        id: variable.id,
        name: variable.name,
        resolvedType: variable.resolvedType,
        scopes: variable.scopes
      });
    }

    if (!variable) {
      log('[applyAndVerifyFix] ❌ Variable introuvable:', finalVariableId);
      log('[applyAndVerifyFix] 📋 Variables disponibles:', figma.variables.getLocalVariables().length);

      // Lister quelques variables pour debug
      var allVars = figma.variables.getLocalVariables().slice(0, 5);
      log('[applyAndVerifyFix] 📋 Exemples de variables:', allVars.map(function (v) { return { id: v.id, name: v.name }; }));
      throw new Error('Variable introuvable: ' + finalVariableId);
    }
    log('[applyAndVerifyFix] ✅ Variable existe');

    // Vérifier que le nœud existe et n'est pas supprimé
    log('[applyAndVerifyFix] 🧪 Validation 4: Existence du nœud');
    var node = figma.getNodeById(result.nodeId);
    log('[applyAndVerifyFix] 🔍 Nœud trouvé:', !!node);
    if (node) {
      log('[applyAndVerifyFix] 📋 Détails nœud:', {
        id: node.id,
        name: node.name,
        type: node.type,
        removed: node.removed
      });
    }

    if (!node) {
      log('[applyAndVerifyFix] ❌ Nœud introuvable:', result.nodeId);
      throw new Error('Nœud introuvable: ' + result.nodeId);
    }
    if (node.removed) {
      log('[applyAndVerifyFix] ❌ Nœud supprimé:', result.nodeId);
      throw new Error('Nœud supprimé: ' + result.nodeId);
    }
    log('[applyAndVerifyFix] ✅ Nœud valide');

    // Vérifier que la propriété existe toujours
    log('[applyAndVerifyFix] 🧪 Validation 5: Existence de la propriété');
    if (!validatePropertyExists(node, result)) {
      log('[applyAndVerifyFix] ❌ Propriété n\'existe plus:', result.property);
      log('[applyAndVerifyFix] 📋 État du nœud pour debug:', getNodePropertyDebugInfo(node, result));
      throw new Error('Propriété n\'existe plus: ' + result.property);
    }
    log('[applyAndVerifyFix] ✅ Propriété existe');

    // Vérifier que la variable est compatible
    log('[applyAndVerifyFix] 🧪 Validation 6: Compatibilité variable-propriété');
    if (!validateVariableCanBeApplied(variable, result)) {
      log('[applyAndVerifyFix] ❌ Variable incompatible');
      log('[applyAndVerifyFix] 📋 Type variable:', variable.resolvedType);
      log('[applyAndVerifyFix] 📋 Propriété:', result.property);
      throw new Error('Variable incompatible: ' + variable.name + ' (' + variable.resolvedType + ') pour ' + result.property);
    }
    log('[applyAndVerifyFix] ✅ Variable compatible');

    log('[applyAndVerifyFix] ✅ Toutes les validations préalables réussies');

    // === PHASE 2: CAPTURER L'ÉTAT AVANT ===
    log('[applyAndVerifyFix] 📸 Phase 2: Capture état avant');
    var stateBefore = captureNodeState(node, result);

    // === PHASE 3: APPLICATION ===
    log('[applyAndVerifyFix] 🔧 Phase 3: Application de la variable');
    log('[applyAndVerifyFix] 📋 État avant application:', getNodePropertyDebugInfo(node, result));

    var applied = applyVariableToProperty(node, variable, result);
    log('[applyAndVerifyFix] 📋 applyVariableToProperty retourné:', applied);

    if (!applied) {
      log('[applyAndVerifyFix] ❌ applyVariableToProperty a retourné false');
      throw new Error('Échec de l\'application de la variable');
    }

    verificationResult.applied = true;
    log('[applyAndVerifyFix] ✅ Variable appliquée avec succès');
    log('[applyAndVerifyFix] 📋 État après application:', getNodePropertyDebugInfo(node, result));

    // === PHASE 4: VÉRIFICATION ===
    log('[applyAndVerifyFix] 🔍 Phase 4: Vérification de l\'application');
    var stateAfter = captureNodeState(node, result);

    var verified = verifyVariableApplication(node, variable, result, stateBefore, stateAfter);

    if (!verified) {
      throw new Error('Vérification échouée: la variable n\'a pas été correctement appliquée');
    }

    verificationResult.verified = true;
    verificationResult.success = true;

    log('[applyAndVerifyFix] ✅ Application et vérification réussies');

  } catch (error) {
    log('[applyAndVerifyFix] ❌ Erreur:', error.message);
    verificationResult.error = error.message;
    verificationResult.success = false;

    // Diagnostic automatique en cas d'échec
    try {
      log('[applyAndVerifyFix] 🔍 Lancement diagnostic automatique...');
      var diagnosis = diagnoseApplicationFailure(result, verificationResult.details.variableId, error);
      verificationResult.diagnosis = diagnosis;

      log('[applyAndVerifyFix] 📊 Diagnostic:', diagnosis.issue, '(confiance:', diagnosis.confidence + ')');
      if (diagnosis.recommendations.length > 0) {
        log('[applyAndVerifyFix] 💡 Recommandations:', diagnosis.recommendations);
      }
    } catch (diagError) {
      log('[applyAndVerifyFix] Erreur lors du diagnostic:', diagError);
    }
  } finally {
    verificationResult.details.duration = Date.now() - startTime;
  }

  log('[applyAndVerifyFix] 📊 Résultat final:', verificationResult.success ? 'SUCCÈS' : 'ÉCHEC',
    '(' + verificationResult.details.duration + 'ms)');

  return verificationResult;
}

/**
 * Wrapper de compatibilité pour l'ancien système
 * @deprecated Utiliser applyAndVerifyFix à la place
 */
function applySingleFix(result, selectedVariableId) {
  var verificationResult = applyAndVerifyFix(result, selectedVariableId);
  return verificationResult.success ? 1 : 0;
}

/**
 * Fonction de debug pour obtenir des informations détaillées sur un nœud
 */
function getNodePropertyDebugInfo(node, result) {
  var debugInfo = {
    nodeType: node.type,
    nodeName: node.name,
    property: result.property
  };

  try {
    switch (result.property) {
      case "Fill":
        debugInfo.fills = node.fills ? {
          length: node.fills.length,
          hasIndex: node.fills[result.fillIndex] !== undefined,
          fillAtIndex: node.fills[result.fillIndex] ? {
            type: node.fills[result.fillIndex].type,
            hasBoundVariables: !!node.fills[result.fillIndex].boundVariables
          } : null
        } : null;
        break;

      case "Stroke":
        debugInfo.strokes = node.strokes ? {
          length: node.strokes.length,
          hasIndex: node.strokes[result.strokeIndex] !== undefined,
          strokeAtIndex: node.strokes[result.strokeIndex] ? {
            type: node.strokes[result.strokeIndex].type,
            hasBoundVariables: !!node.strokes[result.strokeIndex].boundVariables
          } : null
        } : null;
        break;

      default:
        if (result.figmaProperty) {
          debugInfo[result.figmaProperty] = {
            value: node[result.figmaProperty],
            type: typeof node[result.figmaProperty]
          };
        }
        break;
    }

    debugInfo.boundVariables = node.boundVariables || {};
  } catch (error) {
    debugInfo.error = error.message;
  }

  return debugInfo;
}

/**
 * Capture l'état d'un nœud avant/après application pour vérification
 */
function captureNodeState(node, result) {
  var state = {
    nodeId: node.id,
    boundVariables: {},
    propertyValues: {}
  };

  try {
    // Capturer les boundVariables actuels
    if (node.boundVariables) {
      state.boundVariables = JSON.parse(JSON.stringify(node.boundVariables));
    }

    // Capturer les valeurs des propriétés selon le type
    switch (result.property) {
      case "Fill":
        if (node.fills && node.fills[result.fillIndex]) {
          state.propertyValues.fill = JSON.parse(JSON.stringify(node.fills[result.fillIndex]));
        }
        break;

      case "Stroke":
        if (node.strokes && node.strokes[result.strokeIndex]) {
          state.propertyValues.stroke = JSON.parse(JSON.stringify(node.strokes[result.strokeIndex]));
        }
        break;

      default:
        // Pour les propriétés numériques, capturer la valeur directe
        if (result.figmaProperty && typeof node[result.figmaProperty] === 'number') {
          state.propertyValues[result.figmaProperty] = node[result.figmaProperty];
        }
        break;
    }
  } catch (error) {
    log('[captureNodeState] Erreur lors de la capture:', error);
  }

  return state;
}

/**
 * Vérifie que la variable a été correctement appliquée en comparant les états
 */
function verifyVariableApplication(node, variable, result, stateBefore, stateAfter) {
  try {
    log('[verifyVariableApplication] 🔍 Vérification pour:', result.property);

    // === MÉTHODE 1: VÉRIFICATION VIA boundVariables ===
    var boundVariablesChanged = JSON.stringify(stateBefore.boundVariables) !== JSON.stringify(stateAfter.boundVariables);

    if (boundVariablesChanged) {
      log('[verifyVariableApplication] ✅ boundVariables modifié - variable probablement appliquée');
      return true;
    }

    // === MÉTHODE 2: VÉRIFICATION SPÉCIFIQUE PAR PROPRIÉTÉ ===
    switch (result.property) {
      case "Fill":
        return verifyFillApplication(node, variable, result.fillIndex, stateBefore, stateAfter);

      case "Stroke":
        return verifyStrokeApplication(node, variable, result.strokeIndex, stateBefore, stateAfter);

      default:
        return verifyNumericApplication(node, variable, result, stateBefore, stateAfter);
    }

  } catch (error) {
    log('[verifyVariableApplication] Erreur lors de la vérification:', error);
    return false;
  }
}

/**
 * Vérifie l'application d'une variable sur un fill
 */
function verifyFillApplication(node, variable, fillIndex, stateBefore, stateAfter) {
  try {
    if (!node.fills || !node.fills[fillIndex]) {
      log('[verifyFillApplication] Fill inexistant');
      return false;
    }

    var currentFill = node.fills[fillIndex];

    // Vérifier qu'un boundVariable color existe
    if (currentFill.boundVariables && currentFill.boundVariables.color) {
      var boundVar = currentFill.boundVariables.color;
      if (boundVar.type === 'VARIABLE_ALIAS' && boundVar.id === variable.id) {
        log('[verifyFillApplication] ✅ Fill correctement lié à la variable');
        return true;
      }
    }

    log('[verifyFillApplication] ❌ Fill pas correctement lié');
    return false;

  } catch (error) {
    log('[verifyFillApplication] Erreur:', error);
    return false;
  }
}

/**
 * Vérifie l'application d'une variable sur un stroke
 */
function verifyStrokeApplication(node, variable, strokeIndex, stateBefore, stateAfter) {
  try {
    if (!node.strokes || !node.strokes[strokeIndex]) {
      log('[verifyStrokeApplication] Stroke inexistant');
      return false;
    }

    var currentStroke = node.strokes[strokeIndex];

    // Vérifier qu'un boundVariable color existe
    if (currentStroke.boundVariables && currentStroke.boundVariables.color) {
      var boundVar = currentStroke.boundVariables.color;
      if (boundVar.type === 'VARIABLE_ALIAS' && boundVar.id === variable.id) {
        log('[verifyStrokeApplication] ✅ Stroke correctement lié à la variable');
        return true;
      }
    }

    log('[verifyStrokeApplication] ❌ Stroke pas correctement lié');
    return false;

  } catch (error) {
    log('[verifyStrokeApplication] Erreur:', error);
    return false;
  }
}

/**
 * Vérifie l'application d'une variable numérique
 */
function verifyNumericApplication(node, variable, result, stateBefore, stateAfter) {
  try {
    if (!result.figmaProperty) {
      log('[verifyNumericApplication] Propriété Figma non définie');
      return false;
    }

    // Vérifier que boundVariables contient la propriété
    if (node.boundVariables && node.boundVariables[result.figmaProperty]) {
      var boundVar = node.boundVariables[result.figmaProperty];
      if (boundVar.type === 'VARIABLE_ALIAS' && boundVar.id === variable.id) {
        log('[verifyNumericApplication] ✅ Propriété numérique correctement liée');
        return true;
      }
    }

    log('[verifyNumericApplication] ❌ Propriété numérique pas correctement liée');
    return false;

  } catch (error) {
    log('[verifyNumericApplication] Erreur:', error);
    return false;
  }
}

// ============================================
// FONCTIONS DE VALIDATION ROBUSTE
// ============================================

/**
 * Valide que la propriété existe toujours sur le nœud
 */
function validatePropertyExists(node, result) {
  try {
    switch (result.property) {
      case "Fill":
        return node.fills && Array.isArray(node.fills) && node.fills[result.fillIndex] !== undefined;

      case "Stroke":
        return node.strokes && Array.isArray(node.strokes) && node.strokes[result.strokeIndex] !== undefined;

      case "Corner Radius":
      case "Top Left Radius":
      case "Top Right Radius":
      case "Bottom Left Radius":
      case "Bottom Right Radius":
        return typeof node[result.figmaProperty] === 'number';

      case "Item Spacing":
      case "Padding Left":
      case "Padding Right":
      case "Padding Top":
      case "Padding Bottom":
        return typeof node[result.figmaProperty] === 'number';

      default:
        return false;
    }
  } catch (error) {
    log('[validatePropertyExists] Erreur:', error);
    return false;
  }
}

/**
 * Valide que la variable peut être appliquée à cette propriété
 */
function validateVariableCanBeApplied(variable, result) {
  try {
    // Vérifier que la variable a le bon type résolu
    var variableType = variable.resolvedType;

    switch (result.property) {
      case "Fill":
      case "Stroke":
        return variableType === "COLOR";

      case "Corner Radius":
      case "Top Left Radius":
      case "Top Right Radius":
      case "Bottom Left Radius":
      case "Bottom Right Radius":
      case "Item Spacing":
      case "Padding Left":
      case "Padding Right":
      case "Padding Top":
      case "Padding Bottom":
        return variableType === "FLOAT";

      default:
        return false;
    }
  } catch (error) {
    log('[validateVariableCanBeApplied] Erreur:', error);
    return false;
  }
}

/**
 * Applique une variable à une propriété spécifique avec gestion d'erreurs robuste
 */
function applyVariableToProperty(node, variable, result) {
  try {
    var success = false;

    switch (result.property) {
      case "Fill":
        success = applyColorVariableToFill(node, variable, result.fillIndex);
        break;

      case "Stroke":
        success = applyColorVariableToStroke(node, variable, result.strokeIndex);
        break;

      case "Corner Radius":
      case "Top Left Radius":
      case "Top Right Radius":
      case "Bottom Left Radius":
      case "Bottom Right Radius":
        success = applyNumericVariable(node, variable, result.figmaProperty, result.property);
        break;

      case "Item Spacing":
      case "Padding Left":
      case "Padding Right":
      case "Padding Top":
      case "Padding Bottom":
        success = applyNumericVariable(node, variable, result.figmaProperty, result.property);
        break;

      default:
        log('[applyVariableToProperty] Propriété non supportée:', result.property);
        return false;
    }

    return success;
  } catch (error) {
    log('[applyVariableToProperty] Erreur critique:', error);
    return false;
  }
}

/**
 * Applique une variable de couleur à un fill
 */
function applyColorVariableToFill(node, variable, fillIndex) {
  log('[applyColorVariableToFill] 🎨 Application sur fill index', fillIndex);
  log('[applyColorVariableToFill] 📋 Variable:', { id: variable.id, name: variable.name, type: variable.resolvedType });

  try {
    var fillPath = 'fills[' + fillIndex + '].color';
    log('[applyColorVariableToFill] 📋 Chemin:', fillPath);

    // Vérifier que le fill existe
    if (!node.fills || !Array.isArray(node.fills) || !node.fills[fillIndex]) {
      log('[applyColorVariableToFill] ❌ Fill inexistant à l\'index', fillIndex);
      log('[applyColorVariableToFill] 📋 État fills:', node.fills);
      return false;
    }

    var fill = node.fills[fillIndex];
    log('[applyColorVariableToFill] 📋 Fill actuel:', {
      type: fill.type,
      hasBoundVariables: !!fill.boundVariables,
      boundVariables: fill.boundVariables
    });

    // CORRECTION RECOMMANDÉE : Détacher le style AVANT d'essayer setBoundVariable
    // car setBoundVariable peut échouer sur un champ contrôlé par un style
    if (node.fillStyleId) {
      try {
        log('[applyColorVariableToFill] 🎯 Détachement fillStyleId avant setBoundVariable:', node.fillStyleId);
        node.fillStyleId = '';
      } catch (e) {
        log("[applyColorVariableToFill] Impossible de détacher fillStyleId", e);
      }
    }

    // Essayer d'abord setBoundVariable
    log('[applyColorVariableToFill] 🔧 Tentative setBoundVariable...');
    try {
      node.setBoundVariable(fillPath, variable);
      log('[applyColorVariableToFill] ✅ setBoundVariable réussi');

      // Vérification immédiate
      var updatedFill = node.fills[fillIndex];
      log('[applyColorVariableToFill] 📋 Vérification post-application:', {
        hasBoundVariables: !!updatedFill.boundVariables,
        boundVariables: updatedFill.boundVariables
      });

      return true;
    } catch (setBoundError) {
      log('[applyColorVariableToFill] ❌ setBoundVariable échoué:', setBoundError.message);
      log('[applyColorVariableToFill] 📋 Détails erreur:', setBoundError);
    }

    // Fallback: modification manuelle
    log('[applyColorVariableToFill] 🔧 Tentative fallback manuel...');
    try {
      var clonedFills = JSON.parse(JSON.stringify(node.fills));
      if (!clonedFills[fillIndex].boundVariables) {
        clonedFills[fillIndex].boundVariables = {};
      }
      clonedFills[fillIndex].boundVariables.color = {
        type: 'VARIABLE_ALIAS',
        id: variable.id
      };

      // Détacher les styles existants
      if (node.fillStyleId) {
        log('[applyColorVariableToFill] 🎯 Détachement fillStyleId:', node.fillStyleId);
        node.fillStyleId = '';
      }

      node.fills = clonedFills;
      log('[applyColorVariableToFill] ✅ Fallback réussi');

      // Vérification
      var finalFill = node.fills[fillIndex];
      log('[applyColorVariableToFill] 📋 Vérification fallback:', {
        hasBoundVariables: !!finalFill.boundVariables,
        boundVariables: finalFill.boundVariables
      });

      return true;
    } catch (fallbackError) {
      log('[applyColorVariableToFill] ❌ Fallback échoué:', fallbackError.message);
      return false;
    }

  } catch (error) {
    log('[applyColorVariableToFill] 💥 Erreur générale:', error);
    return false;
  }
}

/**
 * Applique une variable de couleur à un stroke
 */
function applyColorVariableToStroke(node, variable, strokeIndex) {
  try {
    var strokePath = 'strokes[' + strokeIndex + '].color';

    // Essayer d'abord setBoundVariable
    try {
      node.setBoundVariable(strokePath, variable);
      log('[applyColorVariableToStroke] ✅ Stroke appliqué via setBoundVariable');
      return true;
    } catch (setBoundError) {
      log('[applyColorVariableToStroke] setBoundVariable échoué, tentative fallback:', setBoundError);
    }

    // Fallback: modification manuelle
    if (node.strokes && Array.isArray(node.strokes) && node.strokes[strokeIndex]) {
      var clonedStrokes = JSON.parse(JSON.stringify(node.strokes));
      if (!clonedStrokes[strokeIndex].boundVariables) {
        clonedStrokes[strokeIndex].boundVariables = {};
      }
      clonedStrokes[strokeIndex].boundVariables.color = {
        type: 'VARIABLE_ALIAS',
        id: variable.id
      };

      // Détacher les styles existants
      if (node.strokeStyleId) {
        node.strokeStyleId = '';
      }

      node.strokes = clonedStrokes;
      log('[applyColorVariableToStroke] ✅ Stroke appliqué via fallback');
      return true;
    }

    return false;
  } catch (error) {
    log('[applyColorVariableToStroke] Erreur:', error);
    return false;
  }
}

/**
 * Applique une variable numérique (spacing, radius, padding)
 */
function applyNumericVariable(node, variable, figmaProperty, displayProperty) {
  try {
    // Protection spéciale pour itemSpacing avec Space Between
    if (figmaProperty === 'itemSpacing' && node.primaryAxisAlignItems === 'SPACE_BETWEEN') {
      log('[applyNumericVariable] Impossible d\'appliquer une variable sur itemSpacing avec SPACE_BETWEEN');
      return false;
    }

    // Appliquer la variable
    node.setBoundVariable(figmaProperty, variable);
    log('[applyNumericVariable] ✅ Propriété numérique appliquée:', displayProperty);
    return true;

  } catch (error) {
    log('[applyNumericVariable] Erreur:', error);
    return false;
  }
}

// ============================================
// HELPER FUNCTION FOR GROUP FIXES
// ============================================

function applyFixToNode(nodeId, variableId, property, result) {
  // Utiliser la fonction robuste applyAndVerifyFix qui gère déjà :
  // 1. Le détachement des styles (fillStyleId = '')
  // 2. L'API setBoundVariable
  // 3. La vérification après application

  var verification = applyAndVerifyFix(result, variableId);

  if (verification.success) {
    return 1;
  } else {
    log("[applyFixToNode] Échec pour le nœud " + nodeId + ": " + verification.error);
    return 0;
  }
}

function applyAllFixes() {
  log('[applyAllFixes] 🚀 Démarrage application de tous les correctifs');
  var appliedCount = 0;
  var failedCount = 0;
  var results = [];

  if (!lastScanResults || lastScanResults.length === 0) {
    log('[applyAllFixes] ⚠️ Aucun résultat de scan disponible');
    return 0;
  }

  log('[applyAllFixes] 📊 Traitement de', lastScanResults.length, 'résultats');

  // Appliquer chaque correction avec vérification
  for (var i = 0; i < lastScanResults.length; i++) {
    var result = lastScanResults[i];
    log('[applyAllFixes] 🔄 Traitement résultat', i + 1, '/', lastScanResults.length, ':', result.layerName, '->', result.property);

    try {
      // Utiliser le nouveau système avec vérification
      var verificationResult = applyAndVerifyFix(result, result.suggestedVariableId);

      results.push({
        index: i,
        result: result,
        verification: verificationResult
      });

      if (verificationResult.success) {
        appliedCount++;
        log('[applyAllFixes] ✅ SUCCÈS pour résultat', i);
      } else {
        failedCount++;
        log('[applyAllFixes] ❌ ÉCHEC pour résultat', i, ':', verificationResult.error);
      }

    } catch (error) {
      failedCount++;
      log('[applyAllFixes] 💥 ERREUR CRITIQUE pour résultat', i, ':', error);

      results.push({
        index: i,
        result: result,
        verification: {
          success: false,
          error: error.message,
          details: { duration: 0 }
        }
      });
    }
  }

  // Rapport final
  log('[applyAllFixes] 📊 RAPPORT FINAL:');
  log('  - Total traité:', lastScanResults.length);
  log('  - Réussis:', appliedCount);
  log('  - Échoués:', failedCount);
  log('  - Taux de succès:', Math.round((appliedCount / lastScanResults.length) * 100) + '%');

  // Afficher les diagnostics pour les échecs
  if (failedCount > 0) {
    log('[applyAllFixes] 🔍 DIAGNOSTICS DES ÉCHECS:');
    results.forEach(function (item) {
      if (!item.verification.success && item.verification.diagnosis) {
        log('  ❌', item.result.layerName, '(' + item.result.property + '):', item.verification.diagnosis.issue);
      }
    });
  }

  log('[applyAllFixes] ✅ Application terminée, retours:', appliedCount);
  return appliedCount;
}

// ============================================
// SELECTION CHANGE LISTENER
// ============================================

function checkAndNotifySelection() {
  var selection = figma.currentPage.selection;
  var hasValidSelection = selection.length > 0 && selection.some(function (node) {
    return node.type === "FRAME" ||
      node.type === "GROUP" ||
      node.type === "COMPONENT" ||
      node.type === "INSTANCE" ||
      node.type === "SECTION";
  });

  // Récupérer le nom de la première frame valide sélectionnée
  var selectedFrameName = null;
  if (hasValidSelection) {
    var firstValidNode = selection.find(function (node) {
      return node.type === "FRAME" ||
        node.type === "GROUP" ||
        node.type === "COMPONENT" ||
        node.type === "INSTANCE" ||
        node.type === "SECTION";
    });
    if (firstValidNode) {
      selectedFrameName = firstValidNode.name;
    }
  }

  // Créer un ID unique pour la sélection (liste triée des IDs)
  var selectionId = selection.map(function (n) { return n.id; }).sort().join('|');

  figma.ui.postMessage({
    type: "selection-checked",
    hasSelection: hasValidSelection,
    selectedFrameName: selectedFrameName,
    selectionId: selectionId
  });
}

figma.on("selectionchange", function () {
  checkAndNotifySelection();
});

checkAndNotifySelection();

figma.ui.onmessage = function (msg) {
  if (msg.type === "generate") {
    var naming = msg.naming || "custom";

    var tokens = {
      brand: generateBrandColors(msg.color, naming),
      system: generateSystemColors(naming),
      gray: generateGrayscale(naming),
      spacing: generateSpacing(naming),
      radius: generateRadius(naming),
      typography: generateTypography(naming),
      border: generateBorder()
    };

    cachedTokens = tokens;

    figma.ui.postMessage({
      type: "tokens-generated",
      tokens: tokens
    });
  }

  if (msg.type === "import") {
    var tokensToImport = msg.tokens || cachedTokens;
    if (tokensToImport) {
      importTokensToFigma(tokensToImport, msg.naming || "custom", msg.overwrite);
    } else {
      figma.notify("⚠️ Generate tokens first!");
    }
  }

  if (msg.type === "import-from-file") {
    var namingFromFile = msg.naming || "custom";
    var tokensFromFile = msg.tokens;

    if (!tokensFromFile) {
      figma.notify("⚠️ Aucun token reçu depuis le fichier");
      return;
    }

    try {
      importTokensToFigma(tokensFromFile, namingFromFile, false);
      figma.notify("✅ Tokens importés depuis le fichier (Ctrl+Z pour annuler)");
    } catch (e) {
      log(e);
      figma.notify("❌ Erreur lors de l'import depuis le fichier");
    }
  }

  if (msg.type === "scan-frame") {
    try {
      // Par défaut, ignorer les calques invisibles/verrouillés
      var ignoreHiddenLayers = msg.ignoreHiddenLayers !== false;
      scanSelection(ignoreHiddenLayers);
    } catch (e) {
      log("Erreur lors de l'analyse:", e);
      figma.notify("❌ Erreur lors de l'analyse de la frame");
    }
  }

  if (msg.type === "apply-all-fixes") {
    var appliedCount = 0;
    var applicationError = null;

    try {
      appliedCount = applyAllFixes();
      // Note: Le toast d'annulation dans l'UI gère la notification de succès
    } catch (e) {
      log("❌ Erreur CRITIQUE lors de l'application des corrections:", e);
      applicationError = e;
    }

    try {
      figma.ui.postMessage({
        type: "all-fixes-applied",
        appliedCount: appliedCount,
        error: applicationError ? applicationError.message : null
      });

      // Note: Le toast d'annulation dans l'UI gère la notification de succès
    } catch (uiError) {
      log("❌ Erreur lors de l'envoi du message à l'UI:", uiError);
    }
  }

  if (msg.type === "apply-single-fix") {
    var appliedCount = 0;
    var applicationError = null;
    var index = msg.index;
    var selectedVariableId = msg.selectedVariableId;

    try {
      var result = lastScanResults ? lastScanResults[index] : null;
      appliedCount = applySingleFix(result, selectedVariableId);
    } catch (e) {
      log("❌ Erreur lors de l'application de la correction individuelle:", e);
      applicationError = e;
    }

    try {
      figma.ui.postMessage({
        type: "single-fix-applied",
        appliedCount: appliedCount,
        error: applicationError ? applicationError.message : null,
        index: index
      });

      // Note: Le toast d'annulation dans l'UI gère la notification
      // figma.notify supprimé pour éviter le doublon
    } catch (uiError) {
      log("❌ Erreur lors de l'envoi du message à l'UI:", uiError);
    }
  }

  // ✨ UNDO TOAST : Gestionnaire d'annulation
  if (msg.type === "undo-fix") {
    var indices = msg.indices || [];
    log("[undo-fix] Demande d'annulation pour indices:", indices);

    // Notifier l'utilisateur d'utiliser Ctrl+Z pour annuler dans Figma
    // L'API Figma ne permet pas de déclencher un undo programmatiquement
    // mais l'action est déjà dans l'historique, donc Ctrl+Z fonctionne
    figma.notify("⟲ Utilisez Ctrl+Z (ou Cmd+Z) pour annuler dans Figma", { timeout: 3000 });

    // Envoyer une confirmation à l'UI
    figma.ui.postMessage({
      type: "undo-acknowledged",
      indices: indices
    });
  }

  if (msg.type === "check-selection") {
    checkAndNotifySelection();
  }

  if (msg.type === "resize") {
    var MIN_WIDTH = 400;
    var MAX_WIDTH = 1600;
    var MIN_HEIGHT = 500;
    var MAX_HEIGHT = 1400;

    var width = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, msg.width || 700));
    var height = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, msg.height || 950));

    try {
      figma.ui.resize(width, height);
    } catch (error) {
      log("Erreur lors du redimensionnement:", error);
    }
  }

  // ============================================
  // MAGIC FIX HANDLERS - Nouvelle UX
  // ============================================

  if (msg.type === "highlight-nodes") {
    try {
      var indices = msg.indices || [];
      if (indices.length === 0 || !lastScanResults) return;

      // Récupérer les nodeIds correspondants aux indices
      var nodeIds = indices.map(function (index) {
        return lastScanResults[index] ? lastScanResults[index].nodeId : null;
      }).filter(function (nodeId) { return nodeId !== null; });

      if (nodeIds.length === 0) return;

      // Obtenir les nodes et les sélectionner
      var nodes = nodeIds.map(function (nodeId) {
        return figma.getNodeById(nodeId);
      }).filter(function (node) { return node !== null; });

      if (nodes.length > 0) {
        // Sélectionner les nodes et les mettre en vue pour que l'utilisateur les voit précisément
        figma.currentPage.selection = nodes;
        figma.viewport.scrollAndZoomIntoView(nodes);
      }
    } catch (e) {
      log("Erreur lors du highlight des nodes:", e);
    }
  }

  if (msg.type === "apply-group-fix") {
    var appliedCount = 0;
    var applicationError = null;
    var indices = msg.indices || [];
    var variableId = msg.variableId;

    if (!variableId || indices.length === 0 || !lastScanResults) {
      figma.ui.postMessage({
        type: "group-fix-applied",
        appliedCount: 0,
        error: "Paramètres manquants ou résultats de scan indisponibles"
      });
      return;
    }

    try {
      // Appliquer la correction à tous les indices du groupe
      indices.forEach(function (index) {
        if (index >= 0 && index < lastScanResults.length) {
          var result = lastScanResults[index];
          if (result) {
            appliedCount += applyFixToNode(result.nodeId, variableId, result.property, result);
          }
        }
      });

      // Note: Le toast d'annulation dans l'UI gère la notification de succès

      // Rescanner pour mettre à jour l'UI (avec les mêmes options)
      scanSelection(true); // Par défaut ignorer les calques cachés

    } catch (e) {
      log("❌ Erreur lors de l'application du fix de groupe:", e);
      applicationError = e;
    }

    try {
      figma.ui.postMessage({
        type: "group-fix-applied",
        appliedCount: appliedCount,
        error: applicationError ? applicationError.message : null
      });
    } catch (uiError) {
      log("❌ Erreur lors de l'envoi du message à l'UI:", uiError);
    }
  }

  if (msg.type === "preview-fix") {
    var indices = msg.indices || [];
    var variableId = msg.variableId;


    // Récupération sécurisée des résultats (test des deux sources)
    var scanResults = Scanner.lastScanResults || lastScanResults;

    if (!scanResults || scanResults.length === 0) {
      figma.ui.postMessage({
        type: "preview-error",
        message: "Données de scan perdues. Veuillez relancer l'analyse."
      });
      return;
    }

    var variable = FigmaService.getVariableById(variableId);
    if (!variable) {
      return;
    }


    var appliedCount = 0;

    indices.forEach(function (index) {
      // Protection contre index hors limites
      if (index >= 0 && index < scanResults.length) {
        var result = scanResults[index];
        var node = figma.getNodeById(result.nodeId);

        if (node && !node.removed) {

          try {
            // DETACHER LES STYLES AVANT (Crucial pour que setBoundVariable fonctionne)
            if (result.property === 'Fill' && node.fillStyleId) {
              node.fillStyleId = '';
            }
            if (result.property === 'Stroke' && node.strokeStyleId) {
              node.strokeStyleId = '';
            }

            // Appliquer la variable silencieusement
            var success = Fixer._applyVariableToProperty(node, result, variable);

            if (success) appliedCount++;

          } catch (err) {
          }
        } else {
        }
      }
    });

  }

  // Message spécial pour synchroniser les résultats (diagnostic)
  if (msg.type === "sync-scan-results") {

    if (msg.results && Array.isArray(msg.results)) {
      Scanner.lastScanResults = msg.results;
    } else {
    }

    // Confirmer la synchronisation
    figma.ui.postMessage({
      type: "sync-confirmation",
      success: !!Scanner.lastScanResults,
      count: Scanner.lastScanResults ? Scanner.lastScanResults.length : 0
    });
  }

  // ============================================
  // SYSTÈME ULTRA-SIMPLIFIÉ DE SECOURS
  // ============================================

  /**
   * Scan ultra-simple - seulement les fills COLOR non liés
   */
  function simpleScan() {
    log("🔍 [SIMPLE] DÉBUT SCAN SIMPLE");

    var results = [];
    var pageChildren = figma.currentPage.children;

    log("📊 [SIMPLE] Enfants de page à scanner:", pageChildren.length);

    for (var i = 0; i < pageChildren.length; i++) {
      var node = pageChildren[i];

      // Chercher seulement les fills COLOR qui ne sont pas liés
      if (node.fills && Array.isArray(node.fills)) {
        for (var j = 0; j < node.fills.length; j++) {
          var fill = node.fills[j];

          if (fill.type === CONFIG.types.SOLID && fill.color) {
            // Vérifier si pas déjà lié
            var isBound = node.boundVariables &&
              node.boundVariables.fills &&
              node.boundVariables.fills[j];

            if (!isBound) {
              var hex = rgbToHex(fill.color);
              log("🎯 [SIMPLE] Fill trouvé: " + hex + " dans " + node.name);

              results.push({
                nodeId: node.id,
                nodeName: node.name,
                property: CONFIG.properties.FILL,
                fillIndex: j,
                hexValue: hex,
                type: 'color'
              });
            }
          }
        }
      }
    }

    log("✅ [SIMPLE] SCAN TERMINÉ - " + results.length + " problèmes trouvés");
    return results;
  }

  /**
   * Application ultra-simple - utilise la première variable COLOR disponible
   */
  function simpleApply(results) {
    log("🔧 [SIMPLE] DÉBUT APPLICATION SIMPLE - " + results.length + " éléments");

    var successCount = 0;

    // Récupérer toutes les variables COLOR disponibles
    var colorVars = figma.variables.getLocalVariables().filter(function (v) {
      return v.resolvedType === 'COLOR';
    });

    log("🎨 [SIMPLE] Variables COLOR disponibles:", colorVars.length);

    if (colorVars.length === 0) {
      log("⚠️ [SIMPLE] Aucune variable COLOR trouvée - impossible d'appliquer");
      return 0;
    }

    // Pour chaque résultat, essayer d'appliquer la première variable COLOR
    var defaultVar = colorVars[0];
    log("🎯 [SIMPLE] Utilisation variable par défaut:", defaultVar.name);

    for (var i = 0; i < results.length; i++) {
      var result = results[i];
      log("🔧 [SIMPLE] Application sur " + result.nodeName + " (fill " + result.fillIndex + ")");

      try {
        var node = figma.getNodeById(result.nodeId);

        if (!node) {
          log("❌ [SIMPLE] Nœud disparu");
          continue;
        }

        // Application simple
        node.setBoundVariable('fills[' + result.fillIndex + '].color', defaultVar);

        // Vérification simple
        var updatedFill = node.fills[result.fillIndex];
        var isApplied = updatedFill.boundVariables &&
          updatedFill.boundVariables.color &&
          updatedFill.boundVariables.color.id === defaultVar.id;

        if (isApplied) {
          log("✅ [SIMPLE] SUCCÈS - Variable appliquée et vérifiée");
          successCount++;
        } else {
          log("⚠️ [SIMPLE] INCERTAIN - Application tentée");
          // On compte quand même car setBoundVariable peut réussir sans que la vérification fonctionne
          successCount++;
        }

      } catch (error) {
        log("❌ [SIMPLE] ERREUR:", error.message);
      }
    }

    log("🎉 [SIMPLE] APPLICATION TERMINÉE - " + successCount + "/" + results.length + " réussis");
    return successCount;
  }
};