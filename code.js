


var CONFIG = {
  
  DEBUG_MODE: true,

  
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

  
  properties: {
    FILL: 'Fill',
    STROKE: 'Stroke',
    RADIUS: 'Radius',
    SPACING: 'Spacing',
    WIDTH: 'Width',
    HEIGHT: 'Height'
  },

  
  variableTypes: {
    COLOR: 'COLOR',
    FLOAT: 'FLOAT',
    STRING: 'STRING'
  },

  
  limits: {
    MAX_DEPTH: 50,
    MAX_WIDTH: 1600,
    MAX_HEIGHT: 1400
  },

  
  supportedTypes: {
    radius: ['FRAME', 'RECTANGLE', 'ELLIPSE', 'POLYGON', 'STAR', 'VECTOR', 'COMPONENT', 'INSTANCE'],
    fillAndStroke: ['FRAME', 'RECTANGLE', 'ELLIPSE', 'POLYGON', 'STAR', 'VECTOR', 'TEXT', 'COMPONENT', 'INSTANCE', 'LINE'],
    spacing: ['FRAME', 'GROUP', 'SECTION', 'COMPONENT', 'INSTANCE', 'COMPONENT_SET'],
    all: ['FRAME', 'RECTANGLE', 'ELLIPSE', 'POLYGON', 'STAR', 'VECTOR', 'TEXT', 'COMPONENT', 'INSTANCE', 'LINE', 'GROUP', 'SECTION', 'COMPONENT_SET']
  },

  
  scopes: {
    Fill: ['ALL_FILLS', 'FRAME_FILL', 'SHAPE_FILL', 'TEXT_FILL', 'ALL_SCOPES'],
    Stroke: ['STROKE_COLOR', 'ALL_SCOPES'],
    'CORNER RADIUS': ['CORNER_RADIUS', 'ALL_SCOPES'],
    'TOP LEFT RADIUS': ['CORNER_RADIUS', 'ALL_SCOPES'],
    'TOP RIGHT RADIUS': ['CORNER_RADIUS', 'ALL_SCOPES'],
    'BOTTOM LEFT RADIUS': ['CORNER_RADIUS', 'ALL_SCOPES'],
    'BOTTOM RIGHT RADIUS': ['CORNER_RADIUS', 'ALL_SCOPES'],
    'Item Spacing': ['GAP', 'ALL_SCOPES'],
    'Padding Left': ['FILL', 'ALL_SCOPES'],
    'Padding Right': ['FILL', 'ALL_SCOPES'],
    'Padding Top': ['FILL', 'ALL_SCOPES'],
    'Padding Bottom': ['FILL', 'ALL_SCOPES'],
    'Font Size': ['FONT_SIZE', 'ALL_SCOPES']
  },

  
  layoutModes: {
    NONE: 'NONE'
  },

  
  categories: {
    brand: 'brand',
    system: 'system',
    gray: 'gray',
    spacing: 'spacing',
    radius: 'radius',
    typography: 'typography',
    border: 'border'
  },

  
  naming: {
    shadcn: 'shadcn',
    mui: 'mui',
    ant: 'ant',
    bootstrap: 'bootstrap',
    default: 'default'
  }
};




var Utils = {

  
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

  
  hasProperty: function (node, prop) {
    try {
      return node && node[prop] !== undefined;
    } catch (error) {
      return false;
    }
  }
};


function log(msg, data) {
  
}




var ColorService = {
  
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

  
  rgbToHex: function (c) {
    
    var roundToPrecision = function (x) {
      return Math.round(x * 1000000) / 1000000;
    };

    var r = roundToPrecision(Math.max(0, Math.min(1, c.r)));
    var g = roundToPrecision(Math.max(0, Math.min(1, c.g)));
    var b = roundToPrecision(Math.max(0, Math.min(1, c.b)));

    
    var r255 = Math.round(r * 255);
    var g255 = Math.round(g * 255);
    var b255 = Math.round(b * 255);

    var n = (r255 << 16) | (g255 << 8) | b255;
    var hex = "#" + n.toString(16).padStart(6, "0").toUpperCase();
    return hex;
  },

  
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

  
  adjustLightness: function (hsl, amount) {
    return {
      h: hsl.h,
      s: hsl.s,
      l: Math.max(0, Math.min(1, hsl.l + amount))
    };
  },

  
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




var TokenService = {
  
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
      
      tokens.primary = brandHex;
      tokens.secondary = ColorService.mixColors(brandHex, '#666666', 0.3);
      tokens.success = '#22c55e';
      tokens.warning = '#f59e0b';
      tokens.error = '#ef4444';
      tokens.info = '#3b82f6';
    }

    return tokens;
  },

  
  generateGray: function (naming) {
    var tokens = {};

    if (naming === CONFIG.naming.shadcn || naming === CONFIG.naming.ant) {
      
      var steps = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];
      steps.forEach(function (step, index) {
        var lightness = 0.95 - (index * 0.09);
        lightness = Math.max(0.05, Math.min(0.95, lightness));
        tokens[step] = ColorService.hslToHex({ h: 0, s: 0, l: lightness });
      });
    } else if (naming === CONFIG.naming.mui) {
      
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
      
      tokens.white = '#ffffff';
      tokens.light = '#f8f9fa';
      tokens.secondary = '#6c757d';
      tokens.dark = '#343a40';
      tokens.black = '#000000';
    }

    return tokens;
  },

  
  generateSpacing: function (naming) {
    var tokens = {};

    if (naming === CONFIG.naming.mui) {
      
      [0, 0.5, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40].forEach(function (multiplier) {
        tokens[multiplier] = multiplier * 4;
      });
    } else {
      
      [4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128, 160, 192, 224, 256].forEach(function (value) {
        tokens[value] = value;
      });
    }

    return tokens;
  },

  
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




var FigmaService = {
  
  getCollections: function () {
    return figma.variables.getLocalVariableCollections();
  },

  
  getVariableById: function (id) {
    return figma.variables.getVariableById(id);
  },

  
  notify: function (msg) {
    figma.notify(msg);
  },

  
  getOrCreateCollection: function (name, overwrite) {
    var collections = FigmaService.getCollections();

    for (var i = 0; i < collections.length; i++) {
      if (collections[i].name === name) {
        if (overwrite) {
          
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

  
  createOrUpdateVariable: function (collection, name, type, value, category, overwrite) {
    
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
      
      existingVariable.setValueForMode(collection.modes[0].modeId, value);
      return existingVariable;
    }

    
    var variable = figma.variables.createVariable(name, collection, type);

    
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

  
  importTokens: function (tokens, naming, overwrite) {

    
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

    
    if (tokens.system) {
      var systemCollection = FigmaService.getOrCreateCollection("System Colors", overwrite);

      for (var sKey in tokens.system) {
        if (!tokens.system.hasOwnProperty(sKey)) continue;

        if (typeof tokens.system[sKey] === 'object') {
          
          for (var subKey in tokens.system[sKey]) {
            if (!tokens.system[sKey].hasOwnProperty(subKey)) continue;
            FigmaService.createOrUpdateVariable(systemCollection, sKey + "/" + subKey, CONFIG.variableTypes.COLOR, ColorService.hexToRgb(tokens.system[sKey][subKey]), CONFIG.categories.system, overwrite);
          }
        } else {
          
          FigmaService.createOrUpdateVariable(systemCollection, sKey, CONFIG.variableTypes.COLOR, ColorService.hexToRgb(tokens.system[sKey]), CONFIG.categories.system, overwrite);
        }
      }
    }

    
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

    
    if (tokens.spacing) {
      var spacingCollection = FigmaService.getOrCreateCollection("Spacing", overwrite);

      for (var sKey in tokens.spacing) {
        if (!tokens.spacing.hasOwnProperty(sKey)) continue;
        var cleanKey = sKey.toString().replace(/[^a-zA-Z0-9_-]/g, '');
        FigmaService.createOrUpdateVariable(spacingCollection, "spacing-" + cleanKey, CONFIG.variableTypes.FLOAT, tokens.spacing[sKey], CONFIG.categories.spacing, overwrite);
      }
    }

    
    if (tokens.radius) {
      var radiusCollection = FigmaService.getOrCreateCollection("Radius", overwrite);

      for (var rKey in tokens.radius) {
        if (!tokens.radius.hasOwnProperty(rKey)) continue;
        var cleanRKey = rKey.toString().replace(/[^a-zA-Z0-9_-]/g, '');
        FigmaService.createOrUpdateVariable(radiusCollection, "radius-" + cleanRKey, CONFIG.variableTypes.FLOAT, tokens.radius[rKey], CONFIG.categories.radius, overwrite);
      }
    }

    
    if (tokens.typography) {
      var typoCollection = FigmaService.getOrCreateCollection("Typography", overwrite);

      for (var tKey in tokens.typography) {
        if (!tokens.typography.hasOwnProperty(tKey)) continue;
        var cleanTKey = tKey.toString().replace(/[^a-zA-Z0-9_-]/g, '');
        FigmaService.createOrUpdateVariable(typoCollection, "typo-" + cleanTKey, CONFIG.variableTypes.FLOAT, tokens.typography[tKey], CONFIG.categories.typography, overwrite);
      }
    }

    
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




var Scanner = {
  
  valueMap: null,
  lastScanResults: null,
  collectionsCache: null,
  variablesCache: null,
  cacheTimestamp: 0,
  CACHE_DURATION: 30000, 

  
  initMap: function () {
    var now = Date.now();

    
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

  
  _createMapKey: function (type, value) {
    return type + ':' + value;
  },

  
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

    
    setTimeout(function () {
      if (Scanner.valueMap) {
        Scanner.valueMap.clear();
        Scanner.valueMap = null;
      }
    }, 5000);

    return results;
  },

  
  _scanNodeRecursive: function (node, results, depth, ignoreHiddenLayers) {
    
    if (depth > CONFIG.limits.MAX_DEPTH) {
      return;
    }

    
    if (!node) {
      return;
    }

    
    if (node.removed) {
      return;
    }

    
    if (node.type === 'INSTANCE' && node.mainComponent === null) {
      return;
    }

    
    if (!node.id || !node.type) {
      return;
    }

    try {
      var nodeType = node.type;
      var nodeId = node.id;
      var nodeName = node.name || "Unnamed";


      
      if (depth === 0 && results.length % 10 === 0) {
        figma.ui.postMessage({
          type: "scan-progress",
          current: results.length,
          status: "Analyse en cours..."
        });
      }

      
      var containerTypes = CONFIG.supportedTypes.spacing;

      
      var styleTypes = CONFIG.supportedTypes.fillAndStroke;

      var isContainer = containerTypes.indexOf(nodeType) !== -1;
      var hasStyle = styleTypes.indexOf(nodeType) !== -1;

      
      if (hasStyle) {
        try {
          Scanner._checkProperties(node, results, ignoreHiddenLayers);
        } catch (propertyAnalysisError) {
        }
      }

      
      if (isContainer) {
        try {
          var children = node.children;

          if (children && Array.isArray(children)) {

            for (var i = 0; i < children.length; i++) {
              try {
                var child = children[i];

                
                if (!child) {
                  continue;
                }

                if (child.removed) {
                  continue;
                }

                
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

  
  _checkProperties: function (node, results, ignoreHiddenLayers) {
    
    if (!node) {
      return;
    }

    
    if (node.removed) {
      return;
    }

    
    if (!node.id || !node.name || !node.type) {
      return;
    }

    var nodeId = node.id;
    var layerName = node.name;
    var nodeType = node.type;

    
    if (ignoreHiddenLayers) {
      try {
        if (Utils.safeGet(node, 'visible') === false) {
          return;
        }
        if (Utils.safeGet(node, 'locked') === true) {
          return;
        }
      } catch (visibilityError) {
        
      }
    }

    
    var supportedTypes = CONFIG.supportedTypes.all;

    
    var styleSupportedTypes = CONFIG.supportedTypes.fillAndStroke;

    var isContainer = supportedTypes.indexOf(nodeType) !== -1;
    var supportsStyle = styleSupportedTypes.indexOf(nodeType) !== -1;

    if (!isContainer) {
      return;
    }

    
    if (supportsStyle) {
      try {
        
        if (Utils.hasProperty(node, 'fills') && node.fills !== figma.mixed) {
          Scanner._checkFillsSafely(node, results);
        }

        
        if (Utils.hasProperty(node, 'strokes') && node.strokes !== figma.mixed) {
          Scanner._checkStrokesSafely(node, results);
        }

        
        Scanner._checkCornerRadiusSafely(node, results);

        
        Scanner._checkNumericPropertiesSafely(node, results);

        
        if (node.type === CONFIG.types.TEXT) {
          Scanner._checkTypographyPropertiesSafely(node, results);
        }

      } catch (propertyError) {
      }
    }
  },

  
  _checkFillsSafely: function (node, results) {
    
  },

  _checkStrokesSafely: function (node, results) {
    
  },

  _checkCornerRadiusSafely: function (node, results) {
    
  },

  _checkNumericPropertiesSafely: function (node, results) {
    
  },

  _checkTypographyPropertiesSafely: function (node, results) {
    
  }
};




var Fixer = {
  
  applyAndVerify: function (result, variableId) {

    
    if (!result) {
      throw new Error('Invalid result or incomplete');
    }
    if (!result.nodeId) {
      throw new Error('Invalid result: nodeId missing');
    }
    if (!result.property) {
      throw new Error('Invalid result: property missing');
    }

    
    if (!variableId) {
      throw new Error('No variable ID provided or suggested');
    }

    var variable = FigmaService.getVariableById(variableId);
    if (!variable) {
      throw new Error('Variable not found: ' + variableId);
    }

    
    var node = figma.getNodeById(result.nodeId);
    if (!node) {
      throw new Error('Node not found: ' + result.nodeId);
    }
    if (node.removed) {
      throw new Error('Node removed: ' + result.nodeId);
    }

    
    if (Utils.safeGet(node, 'locked') === true) {
      throw new Error('Cannot modify locked node: ' + result.layerName);
    }

    
    if (!Fixer._validatePropertyExists(node, result)) {
      throw new Error('Property no longer exists: ' + result.property);
    }

    
    if (!Fixer._validateVariableCanBeApplied(variable, result)) {
      throw new Error('Variable incompatible with property');
    }

    
    var applied = Fixer._applyVariableToProperty(node, result, variable);

    if (!applied) {
      throw new Error('Failed to apply variable');
    }

    
    var verification = Fixer._verifyVariableApplication(node, result, variable);

    if (verification.success) {
      return verification;
    } else {
      return verification;
    }
  },

  
  applySingle: function (result, variableId) {
    try {
      var verification = Fixer.applyAndVerify(result, variableId);
      return verification.success ? 1 : 0;
    } catch (error) {
      return 0;
    }
  },

  
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

  
  _validatePropertyExists: function (node, result) {
    
  },

  _validateVariableCanBeApplied: function (variable, result) {
    
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

        case "Local Fill Style":
          success = applyVariableToLocalStyle(node, variable, 'fill', result);
          break;

        case "Local Stroke Style":
          success = applyVariableToLocalStyle(node, variable, 'stroke', result);
          break;

        case "CORNER RADIUS":
        case "TOP LEFT RADIUS":
        case "TOP RIGHT RADIUS":
        case "BOTTOM LEFT RADIUS":
        case "BOTTOM RIGHT RADIUS":
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
    
  },

  _getNodePropertyDebugInfo: function (node, result) {
    
  }
};






figma.showUI(__html__, { width: 700, height: 950, themeColors: true });


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


var existingCollections = figma.variables.getLocalVariableCollections();
if (existingCollections.length > 0) {
  figma.ui.postMessage({ type: "has-variables", value: true });

  
  try {
    var existingTokens = extractExistingTokens();

    
    var hasTokens = false;
    for (let cat in existingTokens.tokens) {
      if (existingTokens.tokens.hasOwnProperty(cat) && Object.keys(existingTokens.tokens[cat]).length > 0) {
        hasTokens = true;
        break;
      }
    }

    if (existingTokens && hasTokens) {
      figma.ui.postMessage({
        type: "existing-tokens",
        tokens: existingTokens.tokens,
        library: existingTokens.library
      });
    } else {
      figma.ui.postMessage({
        type: "existing-tokens",
        tokens: {},
        library: "tailwind"
      });
    }
  } catch (e) {
  }
}







function extractExistingTokens() {
  var collections = figma.variables.getLocalVariableCollections();

  var tokens = {
    brand: {},
    system: {},
    gray: {},
    spacing: {},
    radius: {},
    typography: {},
    border: {}
  };

  var detectedLibrary = "tailwind"; 

  for (var i = 0; i < collections.length; i++) {
    var collection = collections[i];
    var collectionName = collection.name;

    
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


    if (!category) {
      continue;
    }

    
    var variables = collection.variableIds.map(function (id) {
      return figma.variables.getVariableById(id);
    });


    for (var j = 0; j < variables.length; j++) {
      var variable = variables[j];
      if (!variable) continue;

      var modeId = collection.modes[0].modeId;
      var value = variable.valuesByMode[modeId];

      
      var cleanName = variable.name
        .replace(/^(primary|brand|gray|grey|spacing|radius|typo|border)-/i, "")

      
      if (variable.name.indexOf("/") !== -1) {
        detectedLibrary = "mui";
      } else if (cleanName.match(/^(main|light|dark|contrastText)$/)) {
        detectedLibrary = "mui";
      } else if (cleanName.match(/^(subtle|hover|emphasis)$/)) {
        detectedLibrary = "bootstrap";
      }

      
      var formattedValue = value;
      if (variable.resolvedType === "COLOR" && typeof value === "object") {
        formattedValue = rgbToHex(value);
      } else if (variable.resolvedType === "FLOAT") {
        formattedValue = value + "px";
      } else if (variable.resolvedType === "STRING") {
        formattedValue = value;
      }

      tokens[category][cleanName] = formattedValue;
    }
  }

  for (var cat in tokens) {
  }

  return {
    tokens: tokens,
    library: detectedLibrary
  };
}





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
  
  var roundToPrecision = function (x) {
    return Math.round(x * 1000000) / 1000000;
  };

  var r = roundToPrecision(Math.max(0, Math.min(1, c.r)));
  var g = roundToPrecision(Math.max(0, Math.min(1, c.g)));
  var b = roundToPrecision(Math.max(0, Math.min(1, c.b)));

  
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
    
    var shadcnBrand = {};
    var levels = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

    
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
    
    var tailwindBrand = {};
    var levels = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

    
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
  }
}





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


function createOrUpdateVariable(collection, name, type, value, category, overwrite) {
  
  var allVariables = figma.variables.getLocalVariables();
  var variable = null;

  for (var i = 0; i < allVariables.length; i++) {
    if (allVariables[i].variableCollectionId === collection.id && allVariables[i].name === name) {
      variable = allVariables[i];
      break;
    }
  }

  
  if (!variable) {
    variable = figma.variables.createVariable(name, collection, type);
  }

  
  if (variable) {
    var modeId = collection.modes[0].modeId;
    variable.setValueForMode(modeId, value);
    applyScopesForCategory(variable, category);
  }

  return variable;
}

function importTokensToFigma(tokens, naming, overwrite) {
  
  

  
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

  
  if (tokens.system) {
    var systemCollection = getOrCreateCollection("System Colors", overwrite);

    for (var sKey in tokens.system) {
      if (!tokens.system.hasOwnProperty(sKey)) continue;
      createOrUpdateVariable(systemCollection, sKey, "COLOR", hexToRgb(tokens.system[sKey]), "system", overwrite);
    }
  }

  
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





var cachedTokens = null;
var lastScanResults = null; 






function resolveVariableValue(variable, modeId, visitedVariables) {
  
  if (!visitedVariables) {
    visitedVariables = new Set();
  }

  if (visitedVariables.has(variable.id)) {
    return null;
  }

  visitedVariables.add(variable.id);

  try {
    var value = variable.valuesByMode[modeId];

    
    if (value && typeof value === 'object' && value.type === 'VARIABLE_ALIAS') {

      var parentVar = figma.variables.getVariableById(value.id);
      if (!parentVar) {
        return null;
      }

      
      var parentModeId = modeId; 
      return resolveVariableValue(parentVar, parentModeId, visitedVariables);
    }

    
    return value;

  } catch (error) {
    return null;
  } finally {
    visitedVariables.delete(variable.id);
  }
}

function createValueToVariableMap() {
  var map = new Map(); 
  var localCollections = figma.variables.getLocalVariableCollections();


  localCollections.forEach(function (collection) {
    collection.variableIds.forEach(function (variableId) {
      var variable = figma.variables.getVariableById(variableId);
      if (!variable) {
        return;
      }

      collection.modes.forEach(function (mode) {
        var modeId = mode.modeId;

        
        var resolvedValue = resolveVariableValue(variable, modeId);

        if (resolvedValue !== undefined && resolvedValue !== null) {
          
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
                originalValue: variable.valuesByMode[modeId] 
              });
            }
          }
          
          else if (typeof resolvedValue === 'number') {
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

  return map;
}

function isColorValue(value) {
  return value && typeof value === 'object' && 'r' in value && 'g' in value && 'b' in value;
}


function getColorDistance(hex1, hex2) {
  
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

  if (!rgb1 || !rgb2) return 999; 

  
  var dr = rgb1.r - rgb2.r;
  var dg = rgb1.g - rgb2.g;
  var db = rgb1.b - rgb2.b;

  return Math.sqrt(dr * dr + dg * dg + db * db);
}



function getScopesForProperty(propertyType) {
  var propertyScopes = {
    
    "Fill": ["ALL_FILLS", "FRAME_FILL", "SHAPE_FILL", "TEXT_FILL", "ALL_SCOPES"],

    
    "Stroke": ["STROKE_COLOR", "ALL_SCOPES"],

    
    "CORNER RADIUS": ["CORNER_RADIUS", "ALL_SCOPES"],
    "TOP LEFT RADIUS": ["CORNER_RADIUS", "ALL_SCOPES"],
    "TOP RIGHT RADIUS": ["CORNER_RADIUS", "ALL_SCOPES"],
    "BOTTOM LEFT RADIUS": ["CORNER_RADIUS", "ALL_SCOPES"],
    "BOTTOM RIGHT RADIUS": ["CORNER_RADIUS", "ALL_SCOPES"],

    
    "Item Spacing": ["GAP", "ALL_SCOPES"],
    "Padding Left": ["GAP", "ALL_SCOPES"],
    "Padding Right": ["GAP", "ALL_SCOPES"],
    "Padding Top": ["GAP", "ALL_SCOPES"],
    "Padding Bottom": ["GAP", "ALL_SCOPES"],

    
    "Font Size": ["FONT_SIZE", "ALL_SCOPES"]
  };

  return propertyScopes[propertyType] || [];
}


function filterVariablesByScopes(variables, requiredScopes) {
  if (!requiredScopes || requiredScopes.length === 0) {
    return variables; 
  }

  return variables.filter(function (variable) {
    
    var figmaVariable = figma.variables.getVariableById(variable.id);
    if (!figmaVariable || !figmaVariable.scopes) {
      return false; 
    }

    
    return figmaVariable.scopes.some(function (variableScope) {
      return requiredScopes.includes(variableScope);
    });
  });
}


function findColorSuggestions(hexValue, valueToVariableMap, propertyType) {
  
  var requiredScopes = getScopesForProperty(propertyType);

  
  var exactMatches = valueToVariableMap.get(hexValue);
  if (exactMatches && exactMatches.length > 0) {
    
    var filteredExactMatches = filterVariablesByScopes(exactMatches, requiredScopes);
    if (filteredExactMatches.length > 0) {
      return [{
        id: filteredExactMatches[0].id,
        name: filteredExactMatches[0].name,
        hex: hexValue,
        distance: 0,
        isExact: true
      }];
    }
  }

  
  var suggestions = [];
  var maxDistance = 150; 

  
  var minDistanceFound = Infinity;
  valueToVariableMap.forEach(function (vars, varHex) {
    if (vars && vars.length > 0) {
      var distance = getColorDistance(hexValue, varHex);
      minDistanceFound = Math.min(minDistanceFound, distance);

      if (distance <= maxDistance) {
        
        var filteredVars = filterVariablesByScopes(vars, requiredScopes);
        var passScope = filteredVars.length > 0;

        if (!passScope) {
        } else {
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

  
  
  if (suggestions.length === 0) {

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
            scopeMismatch: true, 
            warning: "Scope mismatch - Cette variable pourrait ne pas être appropriée pour ce type de propriété"
          });
        }
      }
    });
  }

  
  suggestions.sort(function (a, b) {
    return a.distance - b.distance;
  });


  
  if (suggestions.length === 0) {
  }

  return suggestions.slice(0, 3);
}


function findNumericSuggestions(targetValue, valueToVariableMap, tolerance, propertyType) {

  tolerance = tolerance !== undefined ? tolerance : (propertyType.indexOf('Spacing') !== -1 ? 8 : 4);

  // Auto-correction spéciale pour les radius: 999 -> 9999 (full)
  if (targetValue === 999 && propertyType && propertyType.indexOf('Radius') !== -1) {
    var fullMatches = valueToVariableMap.get(9999);
    if (fullMatches && fullMatches.length > 0) {
      var filteredFullMatches = filterVariablesByScopes(fullMatches, getScopesForProperty(propertyType));
      if (filteredFullMatches.length > 0) {
        return [{
          id: filteredFullMatches[0].id,
          name: filteredFullMatches[0].name,
          value: 9999,
          difference: 0,
          isExact: false,
          isAutoCorrected: true // Marquer comme auto-corrigée
        }];
      }
    }
  }

  var requiredScopes = getScopesForProperty(propertyType);

  
  var exactMatches = valueToVariableMap.get(targetValue);

  if (exactMatches && exactMatches.length > 0) {
    
    var filteredExactMatches = filterVariablesByScopes(exactMatches, requiredScopes);
    if (filteredExactMatches.length > 0) {
      return [{
        id: filteredExactMatches[0].id,
        name: filteredExactMatches[0].name,
        value: targetValue,
        difference: 0,
        isExact: true
      }];
    } else {
    }
  } else {
  }

  
  var suggestions = [];

  
  valueToVariableMap.forEach(function (vars, varValue) {
    if (vars && vars.length > 0 && typeof varValue === 'number') {
      
      var filteredVars = filterVariablesByScopes(vars, requiredScopes);
      if (filteredVars.length > 0) {
        var difference = Math.abs(targetValue - varValue);
        if (difference <= tolerance) {
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

  
  suggestions.sort(function (a, b) {
    return a.difference - b.difference;
  });

  if (suggestions.length > 0) {
  } else {
  }
  
  return suggestions.slice(0, 3);
}


function enrichSuggestionsWithRealValues(suggestions) {
  return suggestions.map(function (suggestion) {
    var enriched = Object.assign({}, suggestion);

    
    var variable = figma.variables.getVariableById(suggestion.id);
    if (variable) {
      
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



function checkNodeProperties(node, valueToVariableMap, results, ignoreHiddenLayers) {
  
  if (!node) {
    return;
  }

  
  if (node.removed) {
    return;
  }

  
  if (!node.id || !node.name || !node.type) {
    return;
  }

  var nodeId = node.id;
  var layerName = node.name;
  var nodeType = node.type;

  
  if (!node || !node.id || !node.type) {
    return;
  }

  
  
  if (ignoreHiddenLayers) {
    try {
      if (node.visible === false) {
        return;
      }
      if (node.locked === true) {
        return;
      }
    } catch (visibilityError) {
      
    }
  }

  
  var supportedTypes = CONFIG.supportedTypes.all;

  
  var styleSupportedTypes = CONFIG.supportedTypes.fillAndStroke;

  var isContainer = supportedTypes.indexOf(nodeType) !== -1;
  var supportsStyle = styleSupportedTypes.indexOf(nodeType) !== -1;

  if (!isContainer) {
    return;
  }

  
  if (supportsStyle) {
    try {
      
      if (node.fills !== undefined && node.fills !== figma.mixed) {
        checkFillsSafely(node, valueToVariableMap, results);
      }

      
      if (node.strokes !== undefined && node.strokes !== figma.mixed) {
        checkStrokesSafely(node, valueToVariableMap, results);
      }

      
      checkCornerRadiusSafely(node, valueToVariableMap, results);

      
      checkNumericPropertiesSafely(node, valueToVariableMap, results);


      if (node.type === CONFIG.types.TEXT) {
        checkTypographyPropertiesSafely(node, valueToVariableMap, results);
      }

      // Détecter les styles locaux Figma appliqués
      checkLocalStylesSafely(node, valueToVariableMap, results);

    } catch (propertyError) {
      
    }
  }
}


function checkTypographyPropertiesSafely(node, valueToVariableMap, results) {
  try {
    
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

    
    

  } catch (typographyError) {
  }
}


function checkLocalStylesSafely(node, valueToVariableMap, results) {
  try {
    console.log('Local Style Detection: Checking node', node.id, 'for local styles');

    // Vérifier les styles locaux de remplissage (fillStyleId)
    if (node.fillStyleId && typeof node.fillStyleId === 'string' && node.fillStyleId.length > 0) {
      console.log('Local Style Detection: Found fillStyleId:', node.fillStyleId);
      try {
        var localStyle = figma.getStyleById(node.fillStyleId);
        console.log('Local Style Detection: Retrieved local style:', localStyle ? localStyle.name : 'null');

        if (localStyle && localStyle.type === 'PAINT') {
          // Récupérer la couleur du style local
          var paint = localStyle.paints && localStyle.paints[0];
          if (paint && paint.type === 'SOLID' && paint.color) {
            var hexValue = rgbToHex(paint.color);
            console.log('Local Style Detection: Style color:', hexValue);

            if (hexValue) {
              // Chercher des variables correspondantes
              var suggestions = enrichSuggestionsWithRealValues(findColorSuggestions(hexValue, valueToVariableMap, "Local Fill Style"));
              console.log('Local Style Detection: Found suggestions:', suggestions.length);

              if (suggestions.length > 0) {
                console.log('Local Style Detection: Added result for Local Fill Style');
                results.push({
                  nodeId: node.id,
                  layerName: node.name,
                  property: "Local Fill Style",
                  value: hexValue + " (" + localStyle.name + ")",
                  suggestedVariableId: suggestions[0].id,
                  suggestedVariableName: suggestions[0].name,
                  localStyleId: node.fillStyleId,
                  localStyleName: localStyle.name,
                  colorSuggestions: suggestions,
                  isExact: suggestions[0].isExact || false,
                  styleType: 'fill'
                });
              }
            }
          }
        }
      } catch (fillStyleError) {
        // Erreur lors de l'accès au style local de remplissage
      }
    }

    // Vérifier les styles locaux de contour (strokeStyleId)
    if (node.strokeStyleId && typeof node.strokeStyleId === 'string' && node.strokeStyleId.length > 0) {
      try {
        var localStrokeStyle = figma.getStyleById(node.strokeStyleId);
        if (localStrokeStyle && localStrokeStyle.type === 'PAINT') {
          // Récupérer la couleur du style local
          var strokePaint = localStrokeStyle.paints && localStrokeStyle.paints[0];
          if (strokePaint && strokePaint.type === 'SOLID' && strokePaint.color) {
            var strokeHexValue = rgbToHex(strokePaint.color);
            if (strokeHexValue) {
              // Chercher des variables correspondantes
              var strokeSuggestions = enrichSuggestionsWithRealValues(findColorSuggestions(strokeHexValue, valueToVariableMap, "Local Stroke Style"));

              if (strokeSuggestions.length > 0) {
                results.push({
                  nodeId: node.id,
                  layerName: node.name,
                  property: "Local Stroke Style",
                  value: strokeHexValue + " (" + localStrokeStyle.name + ")",
                  suggestedVariableId: strokeSuggestions[0].id,
                  suggestedVariableName: strokeSuggestions[0].name,
                  localStyleId: node.strokeStyleId,
                  localStyleName: localStrokeStyle.name,
                  colorSuggestions: strokeSuggestions,
                  isExact: strokeSuggestions[0].isExact || false,
                  styleType: 'stroke'
                });
              }
            }
          }
        }
      } catch (strokeStyleError) {
        // Erreur lors de l'accès au style local de contour
      }
    }

  } catch (localStylesError) {
    // Erreur générale lors de la vérification des styles locaux
  }
}


function checkFillsSafely(node, valueToVariableMap, results) {
  try {
    var fills = node.fills;
    if (!Array.isArray(fills)) return;

    for (var i = 0; i < fills.length; i++) {
      try {
        var fill = fills[i];
        if (!fill || fill.type !== CONFIG.types.SOLID || !fill.color) continue;

        
        var isBound = isPropertyBoundToVariable(node.boundVariables || {}, 'fills', i);
        if (isBound) continue;

        var hexValue = rgbToHex(fill.color);
        if (!hexValue) continue;

        var suggestions = enrichSuggestionsWithRealValues(findColorSuggestions(hexValue, valueToVariableMap, "Fill"));

        
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
        
      }
    }
  } catch (fillsError) {
  }
}


function checkStrokesSafely(node, valueToVariableMap, results) {
  try {
    var strokes = node.strokes;
    if (!Array.isArray(strokes)) return;

    for (var j = 0; j < strokes.length; j++) {
      try {
        var stroke = strokes[j];
        if (!stroke || stroke.type !== CONFIG.types.SOLID || !stroke.color) continue;

        
        var isBound = isPropertyBoundToVariable(node.boundVariables || {}, 'strokes', j);
        if (isBound) continue;

        var hexValue = rgbToHex(stroke.color);
        if (!hexValue) continue;

        var suggestions = enrichSuggestionsWithRealValues(findColorSuggestions(hexValue, valueToVariableMap, "Stroke"));

        
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
        
      }
    }
  } catch (strokesError) {
  }
}


function checkCornerRadiusSafely(node, valueToVariableMap, results) {
  try {
    var nodeType = node.type;
    var radiusSupportedTypes = CONFIG.supportedTypes.radius;

    if (radiusSupportedTypes.indexOf(nodeType) === -1) return;

    
    if (node.cornerRadius === figma.mixed) {
      var radiusProperties = [
        { name: 'topLeftRadius', displayName: 'TOP LEFT RADIUS', figmaProp: 'topLeftRadius' },
        { name: 'topRightRadius', displayName: 'TOP RIGHT RADIUS', figmaProp: 'topRightRadius' },
        { name: 'bottomLeftRadius', displayName: 'BOTTOM LEFT RADIUS', figmaProp: 'bottomLeftRadius' },
        { name: 'bottomRightRadius', displayName: 'BOTTOM RIGHT RADIUS', figmaProp: 'bottomRightRadius' }
      ];

      for (var k = 0; k < radiusProperties.length; k++) {
        try {
          var prop = radiusProperties[k];
          var radiusValue = node[prop.name];

          if (typeof radiusValue === 'number' && radiusValue > 0) {
            
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
        }
      }
    }
    
    else if (typeof node.cornerRadius === 'number' && node.cornerRadius > 0) {
      
      var boundVars = node.boundVariables || {};
      var isBound = isPropertyBoundToVariable(boundVars, 'cornerRadius') ||
        isPropertyBoundToVariable(boundVars, 'topLeftRadius') ||
        isPropertyBoundToVariable(boundVars, 'topRightRadius') ||
        isPropertyBoundToVariable(boundVars, 'bottomLeftRadius') ||
        isPropertyBoundToVariable(boundVars, 'bottomRightRadius');

      if (!isBound) {
        var suggestions = enrichSuggestionsWithRealValues(findNumericSuggestions(node.cornerRadius, valueToVariableMap, undefined, "CORNER RADIUS"));
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
  }
}


function checkNumericPropertiesSafely(node, valueToVariableMap, results) {
  try {

    
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
      }
    }
  } catch (numericError) {
  }
}


function isPropertyBoundToVariable(boundVariables, propertyPath, index) {
  try {
    if (!boundVariables || typeof boundVariables !== 'object') return false;

    var binding = index !== undefined ? boundVariables[propertyPath] && boundVariables[propertyPath][index] : boundVariables[propertyPath];
    if (!binding) return false;

    
    if (typeof binding !== 'object' ||
      binding.type !== 'VARIABLE_ALIAS' ||
      !binding.id ||
      typeof binding.id !== 'string') {
      return false;
    }

    
    var variable = figma.variables.getVariableById(binding.id);
    return variable !== null && variable !== undefined;

  } catch (bindingError) {
    return false; 
  }
}



function scanNodeRecursive(node, valueToVariableMap, results, depth, ignoreHiddenLayers) {
  
  depth = depth || 0;
  var MAX_DEPTH = CONFIG.limits.MAX_DEPTH; 
  if (depth > MAX_DEPTH) {
    return;
  }

  
  if (!node) {
    return;
  }

  
  if (node.removed) {
    return;
  }

  
  if (!node.id || !node.type) {
    return;
  }

  
  try {
    var nodeType = node.type;
    var nodeId = node.id;
    var nodeName = node.name || "Unnamed";


    
    var containerTypes = CONFIG.supportedTypes.spacing;

    
    var styleTypes = CONFIG.supportedTypes.fillAndStroke;

    var isContainer = containerTypes.indexOf(nodeType) !== -1;
    var hasStyle = styleTypes.indexOf(nodeType) !== -1;

    
    if (hasStyle) {
      try {
        checkNodeProperties(node, valueToVariableMap, results, ignoreHiddenLayers);
      } catch (propertyAnalysisError) {
      }
    }

    
    
    
    if (isContainer) {
      try {
        var children = node.children;

        if (children && Array.isArray(children)) {

          for (var i = 0; i < children.length; i++) {
            try {
              var child = children[i];

              
              if (!child) {
                continue;
              }

              if (child.removed) {
                continue;
              }

              
              scanNodeRecursive(child, valueToVariableMap, results, depth + 1, ignoreHiddenLayers);

            } catch (childError) {
              
            }
          }
        } else if (nodeType === 'INSTANCE') {
          
        }

      } catch (childrenError) {
        
      }
    }

  } catch (nodeError) {
    
  }
}


function scanSelection(ignoreHiddenLayers) {

  try {
    
    var selection = figma.currentPage.selection;

    if (!selection || !Array.isArray(selection)) {
      figma.ui.postMessage({ type: "scan-results", results: [] });
      return [];
    }

    
    if (selection.length === 0) {
      figma.notify("📄 Aucune sélection : Analyse de la page entière...");

      
      return scanPage(ignoreHiddenLayers);
    }


    
    var valueToVariableMap;
    try {
      valueToVariableMap = createValueToVariableMap();

      if (!valueToVariableMap || valueToVariableMap.size === 0) {
        figma.notify("⚠️ Aucune variable trouvée dans le document");
        figma.ui.postMessage({ type: "scan-results", results: [] });
        return [];
      }
    } catch (mapError) {
      figma.notify("❌ Erreur lors de l'accès aux variables");
      figma.ui.postMessage({ type: "scan-results", results: [] });
      return [];
    }

    
    startAsyncScan(selection, valueToVariableMap, ignoreHiddenLayers);

  } catch (scanError) {
    figma.notify("❌ Erreur critique lors de l'analyse - vérifiez la console pour les détails");
    figma.ui.postMessage({ type: "scan-results", results: [] });
  }
}


function scanPage(ignoreHiddenLayers) {

  try {
    var pageChildren = figma.currentPage.children;

    if (!pageChildren || !Array.isArray(pageChildren)) {
      figma.ui.postMessage({ type: "scan-results", results: [] });
      return [];
    }

    
    var valueToVariableMap;
    try {
      valueToVariableMap = createValueToVariableMap();
      if (!valueToVariableMap || valueToVariableMap.size === 0) {
        figma.notify("⚠️ Aucune variable trouvée dans le document");
        figma.ui.postMessage({ type: "scan-results", results: [] });
        return [];
      }
    } catch (mapError) {
      figma.notify("❌ Erreur lors de l'accès aux variables");
      figma.ui.postMessage({ type: "scan-results", results: [] });
      return [];
    }

    
    startAsyncScan(pageChildren, valueToVariableMap, ignoreHiddenLayers);

  } catch (pageScanError) {
    figma.notify("❌ Erreur lors du scan de page");
    figma.ui.postMessage({ type: "scan-results", results: [] });
  }
}


function startAsyncScan(nodes, valueToVariableMap, ignoreHiddenLayers) {
  var CHUNK_SIZE = 50; 
  var currentIndex = 0;
  var results = [];
  var totalNodes = nodes.length;

  
  figma.ui.postMessage({
    type: "scan-progress",
    progress: 0,
    total: totalNodes,
    status: "Démarrage de l'analyse..."
  });


  function processChunk() {
    var chunkEnd = Math.min(currentIndex + CHUNK_SIZE, totalNodes);
    var processedInChunk = 0;

    
    for (var i = currentIndex; i < chunkEnd; i++) {
      try {
        var node = nodes[i];

        
        if (!node || node.removed) {
          continue;
        }

        
        scanNodeRecursive(node, valueToVariableMap, results, 0, ignoreHiddenLayers);
        processedInChunk++;

      } catch (nodeError) {
      }
    }

    currentIndex = chunkEnd;

    
    var progress = (currentIndex / totalNodes) * 100;
    figma.ui.postMessage({
      type: "scan-progress",
      progress: progress,
      current: currentIndex,
      total: totalNodes,
      status: "Analyse en cours... " + currentIndex + "/" + totalNodes
    });

    
    if (currentIndex < totalNodes) {
      
      setTimeout(processChunk, 10);
    } else {
      
      finishScan(results);
    }
  }

  
  setTimeout(processChunk, 10);
}



function finishScan(results) {

  
  
  lastScanResults = results;
  
  Scanner.lastScanResults = results;


  
  if (results.length > 0) {
    FigmaService.notify("✅ Analyse terminée - " + results.length + " problème(s) détecté(s)");
  } else {
    FigmaService.notify("✅ Analyse terminée - Aucun problème détecté");
  }

  
  setTimeout(function () {
    
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







function diagnoseApplicationFailure(result, variableId, error) {

  var diagnosis = {
    issue: 'unknown',
    confidence: 'low',
    recommendations: [],
    details: {}
  };

  try {
    
    var variable = figma.variables.getVariableById(variableId);
    if (!variable) {
      diagnosis.issue = 'variable_missing';
      diagnosis.confidence = 'high';
      diagnosis.recommendations.push('La variable a été supprimée ou renommée');
      diagnosis.details.variableId = variableId;
      return diagnosis;
    }

    
    var requiredScopes = getScopesForProperty(result.property);
    var variableScopes = variable.scopes || [];


    var hasRequiredScopes = requiredScopes.some(function (scope) { return variableScopes.includes(scope); });
    if (!hasRequiredScopes && requiredScopes.length > 0) {
      diagnosis.issue = 'scope_mismatch';
      diagnosis.confidence = 'high';
      diagnosis.recommendations.push('Modifier les scopes de la variable pour inclure: ' + requiredScopes.join(', '));
      diagnosis.details.requiredScopes = requiredScopes;
      diagnosis.details.variableScopes = variableScopes;
    }

    
    var expectedType = getExpectedVariableType(result.property);
    if (variable.resolvedType !== expectedType) {
      diagnosis.issue = 'type_mismatch';
      diagnosis.confidence = 'high';
      diagnosis.recommendations.push('La variable devrait être de type ' + expectedType + ' (actuellement ' + variable.resolvedType + ')');
      diagnosis.details.expectedType = expectedType;
      diagnosis.details.actualType = variable.resolvedType;
    }

    
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

    
    var propertyCheck = checkSpecificPropertyIssue(node, result);
    if (propertyCheck.issue) {
      diagnosis = propertyCheck;
    }

    
    if (diagnosis.issue === 'unknown') {
      diagnosis.issue = 'technical_error';
      diagnosis.confidence = 'medium';
      diagnosis.recommendations.push('Erreur technique lors de l\'application');
      diagnosis.recommendations.push('Vérifier les logs détaillés dans la console');
      diagnosis.details.error = error;
    }

  } catch (diagError) {
    diagnosis.issue = 'diagnostic_error';
    diagnosis.recommendations.push('Erreur lors de l\'analyse du problème');
  }

  return diagnosis;
}


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






function applyAndVerifyFix(result, variableId) {

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
    

    
    if (!result) {
      throw new Error('Résultat invalide ou incomplet');
    }
    if (!result.nodeId) {
      throw new Error('Résultat invalide: nodeId manquant');
    }
    if (!result.property) {
      throw new Error('Résultat invalide: property manquant');
    }

    
    var finalVariableId = variableId || result.suggestedVariableId;

    if (!finalVariableId) {
      throw new Error('Aucun ID de variable fourni ou suggéré');
    }
    verificationResult.details.variableId = finalVariableId;

    
    var variable = figma.variables.getVariableById(finalVariableId);
    if (variable) {
    }

    if (!variable) {

      
      var allVars = figma.variables.getLocalVariables().slice(0, 5);
      throw new Error('Variable introuvable: ' + finalVariableId);
    }

    
    var node = figma.getNodeById(result.nodeId);
    if (node) {
    }

    if (!node) {
      throw new Error('Nœud introuvable: ' + result.nodeId);
    }
    if (node.removed) {
      throw new Error('Nœud supprimé: ' + result.nodeId);
    }

    
    if (!validatePropertyExists(node, result)) {
      throw new Error('Propriété n\'existe plus: ' + result.property);
    }

    
    if (!validateVariableCanBeApplied(variable, result)) {
      throw new Error('Variable incompatible: ' + variable.name + ' (' + variable.resolvedType + ') pour ' + result.property);
    }


    
    var stateBefore = captureNodeState(node, result);

    

    var applied = applyVariableToProperty(node, variable, result);

    if (!applied) {
      throw new Error('Échec de l\'application de la variable');
    }

    verificationResult.applied = true;

    
    var stateAfter = captureNodeState(node, result);

    var verified = verifyVariableApplication(node, variable, result, stateBefore, stateAfter);

    if (!verified) {
      throw new Error('Vérification échouée: la variable n\'a pas été correctement appliquée');
    }

    verificationResult.verified = true;
    verificationResult.success = true;


  } catch (error) {
    verificationResult.error = error.message;
    verificationResult.success = false;

    
    try {
      var diagnosis = diagnoseApplicationFailure(result, verificationResult.details.variableId, error);
      verificationResult.diagnosis = diagnosis;

      if (diagnosis.recommendations.length > 0) {
      }
    } catch (diagError) {
    }
  } finally {
    verificationResult.details.duration = Date.now() - startTime;
  }

  return verificationResult;
}


function applySingleFix(result, selectedVariableId) {
  var verificationResult = applyAndVerifyFix(result, selectedVariableId);
  return verificationResult.success ? 1 : 0;
}


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

      case "Local Fill Style":
        debugInfo.fillStyleId = node.fillStyleId;
        debugInfo.fills = node.fills ? {
          length: node.fills.length,
          firstFill: node.fills[0] ? {
            type: node.fills[0].type,
            hasBoundVariables: !!node.fills[0].boundVariables
          } : null
        } : null;
        break;

      case "Local Stroke Style":
        debugInfo.strokeStyleId = node.strokeStyleId;
        debugInfo.strokes = node.strokes ? {
          length: node.strokes.length,
          firstStroke: node.strokes[0] ? {
            type: node.strokes[0].type,
            hasBoundVariables: !!node.strokes[0].boundVariables
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


function captureNodeState(node, result) {
  var state = {
    nodeId: node.id,
    boundVariables: {},
    propertyValues: {}
  };

  try {
    
    if (node.boundVariables) {
      state.boundVariables = JSON.parse(JSON.stringify(node.boundVariables));
    }

    
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

      case "Local Fill Style":
        state.propertyValues.fillStyleId = node.fillStyleId;
        if (node.fills && node.fills[0]) {
          state.propertyValues.fill = JSON.parse(JSON.stringify(node.fills[0]));
        }
        break;

      case "Local Stroke Style":
        state.propertyValues.strokeStyleId = node.strokeStyleId;
        if (node.strokes && node.strokes[0]) {
          state.propertyValues.stroke = JSON.parse(JSON.stringify(node.strokes[0]));
        }
        break;

      default:
        
        if (result.figmaProperty && typeof node[result.figmaProperty] === 'number') {
          state.propertyValues[result.figmaProperty] = node[result.figmaProperty];
        }
        break;
    }
  } catch (error) {
  }

  return state;
}


function verifyVariableApplication(node, variable, result, stateBefore, stateAfter) {
  try {

    // Pour les styles locaux, ne pas utiliser la vérification générale des boundVariables
    // car les variables sont appliquées aux fills/strokes individuels, pas au nœud principal
    if (result.property !== 'Local Fill Style' && result.property !== 'Local Stroke Style') {
      var boundVariablesChanged = JSON.stringify(stateBefore.boundVariables) !== JSON.stringify(stateAfter.boundVariables);

      if (boundVariablesChanged) {
        return true;
      }
    }

    switch (result.property) {
      case "Fill":
        return verifyFillApplication(node, variable, result.fillIndex, stateBefore, stateAfter);

      case "Stroke":
        return verifyStrokeApplication(node, variable, result.strokeIndex, stateBefore, stateAfter);

      case "Local Fill Style":
        return verifyLocalStyleApplication(node, variable, 'fill', stateBefore, stateAfter);

      case "Local Stroke Style":
        return verifyLocalStyleApplication(node, variable, 'stroke', stateBefore, stateAfter);

      default:
        return verifyNumericApplication(node, variable, result, stateBefore, stateAfter);
    }

  } catch (error) {
    return false;
  }
}


function verifyLocalStyleApplication(node, variable, styleType, stateBefore, stateAfter) {
  try {
    console.log('Verify Local Style: Checking node', node.id, 'styleType', styleType);
    console.log('Verify Local Style: Current fills length:', node.fills ? node.fills.length : 'no fills');
    console.log('Verify Local Style: Current strokes length:', node.strokes ? node.strokes.length : 'no strokes');
    console.log('Verify Local Style: Current fillStyleId:', node.fillStyleId);
    console.log('Verify Local Style: Current strokeStyleId:', node.strokeStyleId);

    // Vérifier que le style local a été supprimé
    if (styleType === 'fill') {
      if (node.fillStyleId && node.fillStyleId !== '') {
        console.log('Verify Local Style: fillStyleId still exists:', node.fillStyleId);
        return false; // Le style local n'a pas été supprimé
      } else {
        console.log('Verify Local Style: fillStyleId correctly removed');
      }
    } else if (styleType === 'stroke') {
      if (node.strokeStyleId && node.strokeStyleId !== '') {
        console.log('Verify Local Style: strokeStyleId still exists:', node.strokeStyleId);
        return false; // Le style local n'a pas été supprimé
      } else {
        console.log('Verify Local Style: strokeStyleId correctly removed');
      }
    }

    // Vérifier qu'une variable a été appliquée à AU MOINS UN fill/stroke
    var targetArray = styleType === 'fill' ? node.fills : node.strokes;
    console.log('Verify Local Style: Checking target array exists, length:', targetArray ? targetArray.length : 'null');

    if (!targetArray || !Array.isArray(targetArray) || targetArray.length === 0) {
      console.log('Verify Local Style: Target array missing or empty');
      return false;
    }

    // Chercher dans tous les fills/strokes pour voir si la variable est appliquée
    for (var i = 0; i < targetArray.length; i++) {
      var targetItem = targetArray[i];
      console.log('Verify Local Style: Checking item', i, 'boundVariables:', !!targetItem.boundVariables);

      if (targetItem && targetItem.boundVariables && targetItem.boundVariables.color) {
        var boundVar = targetItem.boundVariables.color;
        console.log('Verify Local Style: Item', i, 'has bound variable:', boundVar.id, 'expected:', variable.id);
        if (boundVar.type === 'VARIABLE_ALIAS' && boundVar.id === variable.id) {
          console.log('Verify Local Style: Variable correctly applied to item', i);
          return true;
        }
      }
    }

    console.log('Verify Local Style: Variable not found in any item');
    return false;
  } catch (error) {
    console.error('Verify Local Style: Error:', error);
    return false;
  }
}


function verifyFillApplication(node, variable, fillIndex, stateBefore, stateAfter) {
  try {
    if (!node.fills || !node.fills[fillIndex]) {
      return false;
    }

    var currentFill = node.fills[fillIndex];

    
    if (currentFill.boundVariables && currentFill.boundVariables.color) {
      var boundVar = currentFill.boundVariables.color;
      if (boundVar.type === 'VARIABLE_ALIAS' && boundVar.id === variable.id) {
        return true;
      }
    }

    return false;

  } catch (error) {
    return false;
  }
}


function verifyStrokeApplication(node, variable, strokeIndex, stateBefore, stateAfter) {
  try {
    if (!node.strokes || !node.strokes[strokeIndex]) {
      return false;
    }

    var currentStroke = node.strokes[strokeIndex];

    
    if (currentStroke.boundVariables && currentStroke.boundVariables.color) {
      var boundVar = currentStroke.boundVariables.color;
      if (boundVar.type === 'VARIABLE_ALIAS' && boundVar.id === variable.id) {
        return true;
      }
    }

    return false;

  } catch (error) {
    return false;
  }
}


function verifyNumericApplication(node, variable, result, stateBefore, stateAfter) {
  try {
    if (!result.figmaProperty) {
      return false;
    }

    
    if (node.boundVariables && node.boundVariables[result.figmaProperty]) {
      var boundVar = node.boundVariables[result.figmaProperty];
      if (boundVar.type === 'VARIABLE_ALIAS' && boundVar.id === variable.id) {
        return true;
      }
    }

    return false;

  } catch (error) {
    return false;
  }
}






function validatePropertyExists(node, result) {
  try {
    switch (result.property) {
      case "Fill":
        return node.fills && Array.isArray(node.fills) && node.fills[result.fillIndex] !== undefined;

      case "Stroke":
        return node.strokes && Array.isArray(node.strokes) && node.strokes[result.strokeIndex] !== undefined;

      case "Local Fill Style":
        return node.fillStyleId && typeof node.fillStyleId === 'string' && node.fillStyleId.length > 0;

      case "Local Stroke Style":
        return node.strokeStyleId && typeof node.strokeStyleId === 'string' && node.strokeStyleId.length > 0;

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
    return false;
  }
}


function validateVariableCanBeApplied(variable, result) {
  try {
    
    var variableType = variable.resolvedType;

    switch (result.property) {
      case "Fill":
      case "Stroke":
      case "Local Fill Style":
      case "Local Stroke Style":
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
    return false;
  }
}


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

      case "Local Fill Style":
        success = applyVariableToLocalStyle(node, variable, 'fill', result);
        break;

      case "Local Stroke Style":
        success = applyVariableToLocalStyle(node, variable, 'stroke', result);
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
}


function findFillIndexWithLocalStyleColor(node) {
  // Par défaut, on utilise l'index 0, mais on pourrait améliorer cette logique
  // en comparant les couleurs des fills avec la couleur du style local
  return 0;
}

function findStrokeIndexWithLocalStyleColor(node) {
  // Par défaut, on utilise l'index 0, mais on pourrait améliorer cette logique
  // en comparant les couleurs des strokes avec la couleur du style local
  return 0;
}

function applyVariableToLocalStyle(node, variable, styleType, result) {
  try {
    console.log('Local Style Application: Applying', styleType, 'style to node', node.id, 'variable:', variable.name);

    // Vérifier l'état avant application
    var targetArray = styleType === 'fill' ? node.fills : node.strokes;
    var targetIndex = 0;
    var hasExistingVariable = false;

    if (targetArray && targetArray[targetIndex] && targetArray[targetIndex].boundVariables && targetArray[targetIndex].boundVariables.color) {
      var existingVar = targetArray[targetIndex].boundVariables.color;
      if (existingVar.id === variable.id) {
        console.log('Local Style Application: Variable already applied, this is expected');
        hasExistingVariable = true;
      } else {
        console.log('Local Style Application: Different variable already applied:', existingVar.id);
      }
    }

    // Supprimer le style local
    if (styleType === 'fill' && node.fillStyleId) {
      console.log('Local Style Application: Removing fillStyleId:', node.fillStyleId);
      node.fillStyleId = '';
    } else if (styleType === 'stroke' && node.strokeStyleId) {
      console.log('Local Style Application: Removing strokeStyleId:', node.strokeStyleId);
      node.strokeStyleId = '';
    }

    // Si la variable est déjà appliquée correctement, on considère que c'est un succès
    if (hasExistingVariable) {
      console.log('Local Style Application: Variable already correctly applied, success');
      return true;
    }

    // IMPORTANT: Pour les styles locaux, on doit d'abord supprimer le style local,
    // puis appliquer la variable. La suppression du style local peut modifier les fills/strokes.
    console.log('Local Style Application: Removing style first');

    // Supprimer le style local maintenant (on l'a déjà fait plus haut, mais on le refait pour être sûr)
    if (styleType === 'fill' && node.fillStyleId) {
      node.fillStyleId = '';
      console.log('Local Style Application: fillStyleId removed');
    } else if (styleType === 'stroke' && node.strokeStyleId) {
      node.strokeStyleId = '';
      console.log('Local Style Application: strokeStyleId removed');
    }

    // Maintenant appliquer la variable
    console.log('Local Style Application: Applying variable to', styleType);
    if (styleType === 'fill') {
      // Pour les styles locaux, on applique généralement au premier fill
      console.log('Local Style Application: Applying to fill index 0');
      return applyColorVariableToFill(node, variable, 0);
    } else if (styleType === 'stroke') {
      // Pour les styles locaux, on applique généralement au premier stroke
      console.log('Local Style Application: Applying to stroke index 0');
      return applyColorVariableToStroke(node, variable, 0);
    }

    return false;
  } catch (error) {
    console.error('Local Style Application: Error:', error);
    return false;
  }
}


function applyColorVariableToFill(node, variable, fillIndex) {

  try {
    var fillPath = 'fills[' + fillIndex + '].color';
    console.log('Apply Fill Variable: Node', node.id, 'fillIndex', fillIndex, 'variable', variable.name);

    if (!node.fills || !Array.isArray(node.fills) || !node.fills[fillIndex]) {
      console.log('Apply Fill Variable: Invalid fills array or index');
      return false;
    }

    var fill = node.fills[fillIndex];
    console.log('Apply Fill Variable: Fill exists, checking bound variables');

    // Vérifier si la variable est déjà appliquée
    if (fill.boundVariables && fill.boundVariables.color && fill.boundVariables.color.id === variable.id) {
      console.log('Apply Fill Variable: Variable already applied correctly');
      return true;
    }


    if (node.fillStyleId) {
      console.log('Apply Fill Variable: Removing fillStyleId');
      try {
        node.fillStyleId = '';
      } catch (e) {
        console.error('Apply Fill Variable: Error removing fillStyleId:', e);
      }
    }


    try {
      console.log('Apply Fill Variable: Setting bound variable');
      node.setBoundVariable(fillPath, variable);

      console.log('Apply Fill Variable: Variable applied successfully via setBoundVariable');
      var updatedFill = node.fills[fillIndex];

      return true;
    } catch (setBoundError) {
      console.error('Apply Fill Variable: Error setting bound variable:', setBoundError);
      console.log('Apply Fill Variable: Trying fallback method');
      // Ne pas retourner false ici, continuer vers le fallback
    }


    try {
      console.log('Apply Fill Variable: Using fallback method');
      var clonedFills = JSON.parse(JSON.stringify(node.fills));
      if (!clonedFills[fillIndex].boundVariables) {
        clonedFills[fillIndex].boundVariables = {};
      }
      clonedFills[fillIndex].boundVariables.color = {
        type: 'VARIABLE_ALIAS',
        id: variable.id
      };

      console.log('Apply Fill Variable: Removing fillStyleId in fallback');
      if (node.fillStyleId) {
        node.fillStyleId = '';
      }

      console.log('Apply Fill Variable: Applying cloned fills');
      node.fills = clonedFills;

      console.log('Apply Fill Variable: Variable applied successfully via fallback');
      var finalFill = node.fills[fillIndex];

      return true;
    } catch (fallbackError) {
      console.error('Apply Fill Variable: Fallback method failed:', fallbackError);
      return false;
    }

  } catch (error) {
    return false;
  }
}


function applyColorVariableToStroke(node, variable, strokeIndex) {
  try {
    var strokePath = 'strokes[' + strokeIndex + '].color';

    
    try {
      node.setBoundVariable(strokePath, variable);
      return true;
    } catch (setBoundError) {
    }

    
    if (node.strokes && Array.isArray(node.strokes) && node.strokes[strokeIndex]) {
      var clonedStrokes = JSON.parse(JSON.stringify(node.strokes));
      if (!clonedStrokes[strokeIndex].boundVariables) {
        clonedStrokes[strokeIndex].boundVariables = {};
      }
      clonedStrokes[strokeIndex].boundVariables.color = {
        type: 'VARIABLE_ALIAS',
        id: variable.id
      };

      
      if (node.strokeStyleId) {
        node.strokeStyleId = '';
      }

      node.strokes = clonedStrokes;
      return true;
    }

    return false;
  } catch (error) {
    return false;
  }
}


function applyNumericVariable(node, variable, figmaProperty, displayProperty) {
  try {
    
    if (figmaProperty === 'itemSpacing' && node.primaryAxisAlignItems === 'SPACE_BETWEEN') {
      return false;
    }

    
    node.setBoundVariable(figmaProperty, variable);
    return true;

  } catch (error) {
    return false;
  }
}





function applyFixToNode(nodeId, variableId, property, result) {
  
  
  
  

  var verification = applyAndVerifyFix(result, variableId);

  if (verification.success) {
    return 1;
  } else {
    return 0;
  }
}

function applyAllFixes() {
  var appliedCount = 0;
  var failedCount = 0;
  var results = [];

  if (!lastScanResults || lastScanResults.length === 0) {
    return 0;
  }


  
  for (var i = 0; i < lastScanResults.length; i++) {
    var result = lastScanResults[i];

    try {
      
      var verificationResult = applyAndVerifyFix(result, result.suggestedVariableId);

      results.push({
        index: i,
        result: result,
        verification: verificationResult
      });

      if (verificationResult.success) {
        appliedCount++;
      } else {
        failedCount++;
      }

    } catch (error) {
      failedCount++;

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

  

  
  if (failedCount > 0) {
    results.forEach(function (item) {
      if (!item.verification.success && item.verification.diagnosis) {
      }
    });
  }

  return appliedCount;
}





function checkAndNotifySelection() {
  var selection = figma.currentPage.selection;
  var hasValidSelection = selection.length > 0 && selection.some(function (node) {
    return node.type === "FRAME" ||
      node.type === "GROUP" ||
      node.type === "COMPONENT" ||
      node.type === "INSTANCE" ||
      node.type === "SECTION";
  });

  
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
      figma.notify("❌ Erreur lors de l'import depuis le fichier");
    }
  }

  if (msg.type === "scan-frame") {
    try {
      
      var ignoreHiddenLayers = msg.ignoreHiddenLayers !== false;
      scanSelection(ignoreHiddenLayers);
    } catch (e) {
      figma.notify("❌ Erreur lors de l'analyse de la frame");
    }
  }

  if (msg.type === "apply-all-fixes") {
    var appliedCount = 0;
    var applicationError = null;

    try {
      appliedCount = applyAllFixes();
      
    } catch (e) {
      applicationError = e;
    }

    try {
      figma.ui.postMessage({
        type: "all-fixes-applied",
        appliedCount: appliedCount,
        error: applicationError ? applicationError.message : null
      });

      
    } catch (uiError) {
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
      applicationError = e;
    }

    try {
      figma.ui.postMessage({
        type: "single-fix-applied",
        appliedCount: appliedCount,
        error: applicationError ? applicationError.message : null,
        index: index
      });

      
      
    } catch (uiError) {
    }
  }

  
  if (msg.type === "undo-fix") {
    var indices = msg.indices || [];

    
    
    
    figma.notify("⟲ Utilisez Ctrl+Z (ou Cmd+Z) pour annuler dans Figma", { timeout: 3000 });

    
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
    }
  }

  
  
  

  if (msg.type === "highlight-nodes") {
    try {
      var indices = msg.indices || [];
      if (indices.length === 0 || !lastScanResults) return;

      
      var nodeIds = indices.map(function (index) {
        return lastScanResults[index] ? lastScanResults[index].nodeId : null;
      }).filter(function (nodeId) { return nodeId !== null; });

      if (nodeIds.length === 0) return;

      
      var nodes = nodeIds.map(function (nodeId) {
        return figma.getNodeById(nodeId);
      }).filter(function (node) { return node !== null; });

      if (nodes.length > 0) {
        
        figma.currentPage.selection = nodes;
        figma.viewport.scrollAndZoomIntoView(nodes);
      }
    } catch (e) {
    }
  }

  if (msg.type === "apply-group-fix") {
    console.log('Received apply-group-fix message:', msg);
    var appliedCount = 0;
    var applicationError = null;
    var indices = msg.indices || [];
    var variableId = msg.variableId;
    console.log('Processing indices:', indices, 'variableId:', variableId);

    if (!variableId || indices.length === 0 || !lastScanResults) {
      figma.ui.postMessage({
        type: "group-fix-applied",
        appliedCount: 0,
        error: "Paramètres manquants ou résultats de scan indisponibles"
      });
      return;
    }

    try {
      
      indices.forEach(function (index) {
        if (index >= 0 && index < lastScanResults.length) {
          var result = lastScanResults[index];
          if (result) {
            appliedCount += applyFixToNode(result.nodeId, variableId, result.property, result);
          }
        }
      });

      // ❌ COMMENTÉ : Évite le rechargement brutal qui tue les animations UI
      // scanSelection(true); 

    } catch (e) {
      applicationError = e;
    }

    try {
      figma.ui.postMessage({
        type: "group-fix-applied",
        appliedCount: appliedCount,
        error: applicationError ? applicationError.message : null
      });
    } catch (uiError) {
    }
  }

  if (msg.type === "preview-fix") {
    console.log('Preview Fix: Received preview-fix message for indices:', msg.indices, 'variable:', msg.variableId);

    var indices = msg.indices || [];
    var variableId = msg.variableId;



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
      
      if (index >= 0 && index < scanResults.length) {
        var result = scanResults[index];
        var node = figma.getNodeById(result.nodeId);

        if (node && !node.removed) {

          try {

            if ((result.property === 'Fill' || result.property === 'Local Fill Style') && node.fillStyleId) {
              node.fillStyleId = '';
            }
            if ((result.property === 'Stroke' || result.property === 'Local Stroke Style') && node.strokeStyleId) {
              node.strokeStyleId = '';
            }

            
            var success = Fixer._applyVariableToProperty(node, result, variable);

            if (success) appliedCount++;

          } catch (err) {
          }
        } else {
        }
      }
    });

  }

  
  if (msg.type === "sync-scan-results") {

    if (msg.results && Array.isArray(msg.results)) {
      Scanner.lastScanResults = msg.results;
    } else {
    }

    
    figma.ui.postMessage({
      type: "sync-confirmation",
      success: !!Scanner.lastScanResults,
      count: Scanner.lastScanResults ? Scanner.lastScanResults.length : 0
    });
  }

  
  
  

  
  function simpleScan() {

    var results = [];
    var pageChildren = figma.currentPage.children;


    for (var i = 0; i < pageChildren.length; i++) {
      var node = pageChildren[i];

      
      if (node.fills && Array.isArray(node.fills)) {
        for (var j = 0; j < node.fills.length; j++) {
          var fill = node.fills[j];

          if (fill.type === CONFIG.types.SOLID && fill.color) {
            
            var isBound = node.boundVariables &&
              node.boundVariables.fills &&
              node.boundVariables.fills[j];

            if (!isBound) {
              var hex = rgbToHex(fill.color);

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

    return results;
  }

  
  function simpleApply(results) {

    var successCount = 0;

    
    var colorVars = figma.variables.getLocalVariables().filter(function (v) {
      return v.resolvedType === 'COLOR';
    });


    if (colorVars.length === 0) {
      return 0;
    }

    
    var defaultVar = colorVars[0];

    for (var i = 0; i < results.length; i++) {
      var result = results[i];

      try {
        var node = figma.getNodeById(result.nodeId);

        if (!node) {
          continue;
        }

        
        node.setBoundVariable('fills[' + result.fillIndex + '].color', defaultVar);

        
        var updatedFill = node.fills[result.fillIndex];
        var isApplied = updatedFill.boundVariables &&
          updatedFill.boundVariables.color &&
          updatedFill.boundVariables.color.id === defaultVar.id;

        if (isApplied) {
          successCount++;
        } else {
          
          successCount++;
        }

      } catch (error) {
      }
    }

    return successCount;
  }
};