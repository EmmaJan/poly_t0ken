


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
} else {
  // Même sans variables locales, on peut scanner pour détecter les variables publiées
  figma.ui.postMessage({ type: "has-variables", value: false });
}

  
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
