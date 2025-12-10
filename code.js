console.log("🔥 Token Starter Plugin Loaded");

figma.showUI(__html__, { width: 700, height: 950, themeColors: true });

// Check if variables exist and notify UI
var existingCollections = figma.variables.getLocalVariableCollections();
if (existingCollections.length > 0) {
  figma.ui.postMessage({ type: "has-variables", value: true });

  // Extraire les tokens existants et les envoyer à l'UI
  try {
    var existingTokens = extractExistingTokens();
    console.log("Tokens existants extraits:", existingTokens);

    // Compter le nombre total de tokens
    var hasTokens = false;
    for (var cat in existingTokens.tokens) {
      if (existingTokens.tokens.hasOwnProperty(cat) && Object.keys(existingTokens.tokens[cat]).length > 0) {
        hasTokens = true;
        break;
      }
    }

    if (existingTokens && hasTokens) {
      console.log("Envoi des tokens à l'UI");
      figma.ui.postMessage({
        type: "existing-tokens",
        tokens: existingTokens.tokens,
        library: existingTokens.library
      });
    } else {
      console.log("Aucun token extrait - envoi d'un message vide");
      figma.ui.postMessage({
        type: "existing-tokens",
        tokens: {},
        library: "tailwind"
      });
    }
  } catch (e) {
    console.error("Erreur lors de l'extraction des tokens existants:", e);
  }
}

// ============================================
// EXTRACT EXISTING TOKENS
// ============================================
function extractExistingTokens() {
  var collections = figma.variables.getLocalVariableCollections();
  console.log("Nombre de collections trouvées:", collections.length);

  var tokens = {
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
    console.log("Collection #" + i + ":", collectionName, "(" + collection.variableIds.length + " variables)");

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

    console.log("  → Catégorie détectée:", category);

    if (!category) {
      console.log("  → Collection ignorée (ne correspond pas aux collections du plugin)");
      continue;
    }

    // Extraire les variables de cette collection
    var variables = collection.variableIds.map(function (id) {
      return figma.variables.getVariableById(id);
    });

    console.log("  → Nombre de variables:", variables.length);

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

      console.log("    Variable:", variable.name, "→", cleanName, "=", formattedValue);
      tokens[category][cleanName] = formattedValue;
    }
  }

  console.log("Tokens finaux par catégorie:");
  for (var cat in tokens) {
    console.log("  " + cat + ":", Object.keys(tokens[cat]).length, "tokens");
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
  var roundToPrecision = function(x) {
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
  typography: ["TEXT_CONTENT"]
};

function applyScopesForCategory(variable, category) {
  if (!variable || !category) return;
  var scopes = scopesByCategory[category];
  if (!scopes || scopes.length === 0) return;
  try {
    variable.scopes = scopes;
  } catch (error) {
    console.warn("[Scopes] Erreur pour", category, error);
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
      createOrUpdateVariable(typoCollection, "typo-" + cleanTKey, "STRING", tokens.typography[tKey], "typography", overwrite);
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
}

// ============================================
// MESSAGE HANDLER
// ============================================

var cachedTokens = null;
var lastScanResults = null; // Pour stocker temporairement les résultats du dernier scan

// ============================================
// FRAME VERIFICATION FUNCTIONS
// ============================================

function createValueToVariableMap() {
  console.log("🔧 Construction de la map des variables avec gestion multi-modes...");
  var map = new Map(); // value -> [{id, name, collectionName}, ...]
  var localCollections = figma.variables.getLocalVariableCollections();

  console.log("📚 Collections trouvées:", localCollections.length);

  localCollections.forEach(function(collection) {
    collection.variableIds.forEach(function(variableId) {
      var variable = figma.variables.getVariableById(variableId);
      if (variable) {
        collection.modes.forEach(function(mode) {
          var modeId = mode.modeId;
          var value = variable.valuesByMode[modeId];

          if (value !== undefined) {
            // Convertir les couleurs RGB en hex pour la comparaison
            if (isColorValue(value)) {
              var hexValue = rgbToHex(value);
              if (hexValue) {
                if (!map.has(hexValue)) {
                  map.set(hexValue, []);
                }
                map.get(hexValue).push({
                  id: variable.id,
                  name: variable.name,
                  collectionName: collection.name,
                  modeName: mode.name
                });
              }
            }
            // Pour les autres types (nombres), stocker directement
            else if (typeof value === 'number') {
              var key = value;
              if (!map.has(key)) {
                map.set(key, []);
              }
              map.get(key).push({
                id: variable.id,
                name: variable.name,
                collectionName: collection.name,
                modeName: mode.name
              });
            }
          }
        });
      }
    });
  });

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

// Fonction pour trouver les meilleures suggestions de variables de couleur
function findColorSuggestions(hexValue, valueToVariableMap) {
  // Chercher d'abord une correspondance exacte
  var exactMatches = valueToVariableMap.get(hexValue);
  if (exactMatches && exactMatches.length > 0) {
    return [{
      id: exactMatches[0].id,
      name: exactMatches[0].name,
      hex: hexValue,
      distance: 0,
      isExact: true
    }];
  }

  // Si pas de correspondance exacte, chercher les plus proches
  var suggestions = [];
  var maxDistance = 50; // Tolérance maximale pour les suggestions

  // Parcourir toutes les variables disponibles dans valueToVariableMap
  valueToVariableMap.forEach(function(vars, varHex) {
    if (vars && vars.length > 0) {
      var distance = getColorDistance(hexValue, varHex);
      if (distance <= maxDistance) {
        suggestions.push({
          id: vars[0].id,
          name: vars[0].name,
          hex: varHex,
          distance: distance,
          isExact: false
        });
      }
    }
  });

  // Trier par distance croissante et prendre les 3 meilleures
  suggestions.sort(function(a, b) {
    return a.distance - b.distance;
  });

  return suggestions.slice(0, 3);
}

function checkNodeProperties(node, valueToVariableMap, results) {
  if (!node || !node.id || !node.name) {
    return;
  }

  var nodeId = node.id;
  var layerName = node.name;
  var nodeType = node.type;

  // Liste blanche de types valides pour le style
  var supportedTypes = ['FRAME', 'RECTANGLE', 'ELLIPSE', 'POLYGON', 'STAR', 'VECTOR', 'TEXT', 'COMPONENT', 'INSTANCE', 'LINE'];

  if (!nodeType || supportedTypes.indexOf(nodeType) === -1) {
    return;
  }

  // Vérifier les fills (couleurs de fond)
  if (node.fills && Array.isArray(node.fills)) {
    for (var i = 0; i < node.fills.length; i++) {
      var fill = node.fills[i];
      if (fill && fill.type === 'SOLID' && fill.color) {
        var isBound = node.boundVariables && node.boundVariables.fills && node.boundVariables.fills[i];

        if (!isBound) {
          var hexValue = rgbToHex(fill.color);
          if (hexValue) {
            var suggestions = findColorSuggestions(hexValue, valueToVariableMap);
            if (suggestions.length > 0) {
              // Prendre la meilleure suggestion (toujours la première après tri)
              var bestSuggestion = suggestions[0];
              results.push({
                nodeId: nodeId,
                layerName: layerName,
                property: "Fill",
                value: hexValue,
                suggestedVariableId: bestSuggestion.id,
                suggestedVariableName: bestSuggestion.name,
                fillIndex: i,
                colorSuggestions: suggestions // Toutes les suggestions pour l'UI
              });
            }
          }
        }
      }
    }
  }

  // Vérifier les strokes (couleurs de contour)
  if (node.strokes && Array.isArray(node.strokes)) {
    for (var j = 0; j < node.strokes.length; j++) {
      var stroke = node.strokes[j];
      if (stroke && stroke.type === 'SOLID' && stroke.color) {
        var isBound = node.boundVariables && node.boundVariables.strokes && node.boundVariables.strokes[j];

        if (!isBound) {
          var hexValue = rgbToHex(stroke.color);
          if (hexValue) {
            var suggestions = findColorSuggestions(hexValue, valueToVariableMap);
            if (suggestions.length > 0) {
              // Prendre la meilleure suggestion (toujours la première après tri)
              var bestSuggestion = suggestions[0];
              results.push({
                nodeId: nodeId,
                layerName: layerName,
                property: "Stroke",
                value: hexValue,
                suggestedVariableId: bestSuggestion.id,
                suggestedVariableName: bestSuggestion.name,
                strokeIndex: j,
                colorSuggestions: suggestions // Toutes les suggestions pour l'UI
              });
            }
          }
        }
      }
    }
  }

  // Vérifier cornerRadius
  if (nodeType === "FRAME" || nodeType === "RECTANGLE" || nodeType === "ELLIPSE" || nodeType === "POLYGON" || nodeType === "STAR" || nodeType === "VECTOR" || nodeType === "COMPONENT" || nodeType === "INSTANCE") {
    
    // Cas spécial : cornerRadius mixte
    if (node.cornerRadius === figma.mixed) {
      var radiusProperties = [
        { name: 'topLeftRadius', displayName: 'Top Left Radius', figmaProp: 'topLeftRadius' },
        { name: 'topRightRadius', displayName: 'Top Right Radius', figmaProp: 'topRightRadius' },
        { name: 'bottomLeftRadius', displayName: 'Bottom Left Radius', figmaProp: 'bottomLeftRadius' },
        { name: 'bottomRightRadius', displayName: 'Bottom Right Radius', figmaProp: 'bottomRightRadius' }
      ];

      for (var k = 0; k < radiusProperties.length; k++) {
        var prop = radiusProperties[k];
        var radiusValue = node[prop.name];

        if (typeof radiusValue === 'number' && radiusValue !== undefined && radiusValue !== 0) {
          var isBound = node.boundVariables && node.boundVariables[prop.figmaProp];

          if (!isBound) {
            var suggestedVars = valueToVariableMap.get(radiusValue);
            if (suggestedVars && suggestedVars.length > 0) {
              var suggestedVar = suggestedVars[0];
              results.push({
                nodeId: nodeId,
                layerName: layerName,
                property: prop.displayName,
                value: radiusValue + "px",
                suggestedVariableId: suggestedVar.id,
                suggestedVariableName: suggestedVar.name,
                figmaProperty: prop.figmaProp
              });
            }
          }
        }
      }
    }
    // Cas normal : cornerRadius uniforme
    else if (typeof node.cornerRadius === 'number' && node.cornerRadius !== undefined && node.cornerRadius !== 0) {
      var isBound = false;
      if (node.boundVariables) {
        isBound = node.boundVariables['cornerRadius'] ||
                  node.boundVariables['topLeftRadius'] ||
                  node.boundVariables['topRightRadius'] ||
                  node.boundVariables['bottomLeftRadius'] ||
                  node.boundVariables['bottomRightRadius'];
      }

      if (!isBound) {
        var suggestedVars = valueToVariableMap.get(node.cornerRadius);
        if (suggestedVars && suggestedVars.length > 0) {
          var suggestedVar = suggestedVars[0];
          results.push({
            nodeId: nodeId,
            layerName: layerName,
            property: "Corner Radius",
            value: node.cornerRadius + "px",
            suggestedVariableId: suggestedVar.id,
            suggestedVariableName: suggestedVar.name,
            figmaProperty: 'cornerRadius'
          });
        }
      }
    }
  }

  // Vérifier l'Auto Layout (Gap et Paddings)
  if (node.layoutMode && node.layoutMode !== "NONE") {

    // GAP : itemSpacing
    if (typeof node.itemSpacing === 'number' && node.itemSpacing !== undefined && node.itemSpacing > 0) {
      var isGapBound = node.boundVariables && node.boundVariables['itemSpacing'];

      if (!isGapBound) {
        var suggestedVars = valueToVariableMap.get(node.itemSpacing);
        if (suggestedVars && suggestedVars.length > 0) {
          var suggestedVar = suggestedVars[0];
          results.push({
            nodeId: nodeId,
            layerName: layerName,
            property: "Item Spacing",
            value: node.itemSpacing + "px",
            suggestedVariableId: suggestedVar.id,
            suggestedVariableName: suggestedVar.name,
            figmaProperty: 'itemSpacing'
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
      var paddingProp = paddingProperties[p];
      var paddingValue = node[paddingProp.name];

      if (typeof paddingValue === 'number' && paddingValue !== undefined && paddingValue > 0) {
        var isPaddingBound = node.boundVariables && node.boundVariables[paddingProp.figmaProp];

        if (!isPaddingBound) {
          var suggestedVars = valueToVariableMap.get(paddingValue);
          if (suggestedVars && suggestedVars.length > 0) {
            var suggestedVar = suggestedVars[0];
            results.push({
              nodeId: nodeId,
              layerName: layerName,
              property: paddingProp.displayName,
              value: paddingValue + "px",
              suggestedVariableId: suggestedVar.id,
              suggestedVariableName: suggestedVar.name,
              figmaProperty: paddingProp.figmaProp
            });
          }
        }
      }
    }
  }
}

function scanNodeRecursive(node, valueToVariableMap, results) {
  if (!node) return;

  var supportedTypes = ['FRAME', 'RECTANGLE', 'ELLIPSE', 'POLYGON', 'STAR', 'VECTOR', 'TEXT', 'COMPONENT', 'INSTANCE', 'LINE'];

  if (node.type && supportedTypes.indexOf(node.type) !== -1) {
    checkNodeProperties(node, valueToVariableMap, results);
  }

  if (node.children && Array.isArray(node.children)) {
    for (var i = 0; i < node.children.length; i++) {
      if (node.children[i]) {
        scanNodeRecursive(node.children[i], valueToVariableMap, results);
      }
    }
  }
}

function scanSelection() {
  var selection = figma.currentPage.selection;
  if (selection.length === 0) return [];

  // Récupérer toutes les variables locales et créer une map inversée Valeur -> VariableID
  var valueToVariableMap = createValueToVariableMap();
  var results = [];

  // Parcourir récursivement tous les nœuds sélectionnés
  selection.forEach(function(node) {
    scanNodeRecursive(node, valueToVariableMap, results);
  });

  lastScanResults = results;
  return results;
}

function applySingleFix(index, selectedVariableId) {
  var appliedCount = 0;

  if (!lastScanResults || lastScanResults.length === 0 || index < 0 || index >= lastScanResults.length) {
    return 0;
  }

  var result = lastScanResults[index];

  // Note: figma.groupOperations has been removed in newer Figma API versions
  // Each operation will now be undoable individually
  try {
    var node = figma.getNodeById(result.nodeId);
    if (!node) return 0;

    // Utiliser la variable sélectionnée par l'utilisateur ou celle par défaut
    var variableId = selectedVariableId || result.suggestedVariableId;
    var variable = figma.variables.getVariableById(variableId);
    if (!variable) return 0;

    // Logique de confiance : On fait confiance au scan effectué récemment
    if (result.property === "Fill") {
      try {
        if (node.fills && Array.isArray(node.fills) && typeof result.fillIndex === 'number') {
          var fillIndex = result.fillIndex;
          if (fillIndex < node.fills.length) {
            var targetFill = node.fills[fillIndex];
            var isAlreadyBound = node.boundVariables &&
                                 node.boundVariables.fills &&
                                 node.boundVariables.fills[fillIndex];

            if (!isAlreadyBound && targetFill && targetFill.type === 'SOLID') {
              // Clonage Sécurisé
              var clonedFills = JSON.parse(JSON.stringify(node.fills));
              if (!clonedFills[fillIndex].boundVariables) {
                clonedFills[fillIndex].boundVariables = {};
              }

              // 🔥 CORRECTION CRITIQUE : Utiliser un alias de variable au lieu de l'objet variable
              clonedFills[fillIndex].boundVariables.color = {
                type: 'VARIABLE_ALIAS',
                id: variable.id
              };

              try {
                node.fills = clonedFills;
                appliedCount++;
              } catch (textError) {
                console.error("Erreur spécifique Fill:", textError);
              }
            }
          }
        }
      } catch (e) {
        console.error("Erreur Fill:", e);
      }
    }
    else if (result.property === "Stroke") {
      try {
        if (node.strokes && Array.isArray(node.strokes) && typeof result.strokeIndex === 'number') {
          var strokeIndex = result.strokeIndex;
          if (strokeIndex < node.strokes.length) {
            var targetStroke = node.strokes[strokeIndex];
            var isAlreadyBound = node.boundVariables &&
                                 node.boundVariables.strokes &&
                                 node.boundVariables.strokes[strokeIndex];

            if (!isAlreadyBound && targetStroke && targetStroke.type === 'SOLID') {
              var clonedStrokes = JSON.parse(JSON.stringify(node.strokes));
              if (!clonedStrokes[strokeIndex].boundVariables) {
                clonedStrokes[strokeIndex].boundVariables = {};
              }

              // 🔥 CORRECTION CRITIQUE : Utiliser un alias de variable
              clonedStrokes[strokeIndex].boundVariables.color = {
                type: 'VARIABLE_ALIAS',
                id: variable.id
              };

              try {
                node.strokes = clonedStrokes;
                appliedCount++;
              } catch (strokeError) {
                console.error("Erreur spécifique Stroke:", strokeError);
              }
            }
          }
        }
      } catch (e) {
        console.error("Erreur Stroke:", e);
      }
    }
    else {
      // Propriétés de radius - node.setBoundVariable accepte directement l'objet variable
      try {
        var figmaProperty = result.figmaProperty;
        if (figmaProperty) {
          var isAlreadyBound = node.boundVariables && node.boundVariables[figmaProperty];
          if (!isAlreadyBound) {
            node.setBoundVariable(figmaProperty, variable);
            appliedCount++;
          }
        }
      } catch (e) {
        console.error("Erreur Radius:", e);
      }
    }

  } catch (e) {
    console.error("Erreur générale lors de l'application d'une correction individuelle:", e);
  }

  return appliedCount;
}

// ============================================
// HELPER FUNCTION FOR GROUP FIXES
// ============================================

function applyFixToNode(nodeId, variableId, property, result) {
  var appliedCount = 0;

  try {
    var node = figma.getNodeById(nodeId);
    if (!node) return 0;

    var variable = figma.variables.getVariableById(variableId);
    if (!variable) return 0;

    // Logique de confiance : On fait confiance au scan effectué récemment
    if (property === "Fill") {
      try {
        if (node.fills && Array.isArray(node.fills) && typeof result.fillIndex === 'number') {
          var fillIndex = result.fillIndex;
          if (fillIndex < node.fills.length) {
            var targetFill = node.fills[fillIndex];
            var isAlreadyBound = node.boundVariables &&
                                 node.boundVariables.fills &&
                                 node.boundVariables.fills[fillIndex];

            if (!isAlreadyBound && targetFill && targetFill.type === 'SOLID') {
              // Clonage Sécurisé
              var clonedFills = JSON.parse(JSON.stringify(node.fills));
              if (!clonedFills[fillIndex].boundVariables) {
                clonedFills[fillIndex].boundVariables = {};
              }

              // 🔥 CORRECTION CRITIQUE : Utiliser un alias de variable
              clonedFills[fillIndex].boundVariables.color = {
                type: 'VARIABLE_ALIAS',
                id: variable.id
              };

              try {
                node.fills = clonedFills;
                appliedCount++;
              } catch (textError) {
                console.error("Erreur spécifique Fill:", textError);
              }
            }
          }
        }
      } catch (e) {
        console.error("Erreur Fill:", e);
      }
    }
    else if (property === "Stroke") {
      try {
        if (node.strokes && Array.isArray(node.strokes) && typeof result.strokeIndex === 'number') {
          var strokeIndex = result.strokeIndex;
          if (strokeIndex < node.strokes.length) {
            var targetStroke = node.strokes[strokeIndex];
            var isAlreadyBound = node.boundVariables &&
                                 node.boundVariables.strokes &&
                                 node.boundVariables.strokes[strokeIndex];

            if (!isAlreadyBound && targetStroke && targetStroke.type === 'SOLID') {
              var clonedStrokes = JSON.parse(JSON.stringify(node.strokes));
              if (!clonedStrokes[strokeIndex].boundVariables) {
                clonedStrokes[strokeIndex].boundVariables = {};
              }

              // 🔥 CORRECTION CRITIQUE : Utiliser un alias de variable
              clonedStrokes[strokeIndex].boundVariables.color = {
                type: 'VARIABLE_ALIAS',
                id: variable.id
              };

              try {
                node.strokes = clonedStrokes;
                appliedCount++;
              } catch (strokeError) {
                console.error("Erreur spécifique Stroke:", strokeError);
              }
            }
          }
        }
      } catch (e) {
        console.error("Erreur Stroke:", e);
      }
    }
    else if (property.includes("Radius")) {
      try {
        var radiusValue = parseFloat(result.value);
        if (!isNaN(radiusValue)) {
          var figmaProperty = result.figmaProperty || 'cornerRadius';
          var isAlreadyBound = node.boundVariables && node.boundVariables[figmaProperty];

          if (!isAlreadyBound) {
            node.setBoundVariable(figmaProperty, variable);
            appliedCount++;
          }
        }
      } catch (e) {
        console.error("Erreur Radius:", e);
      }
    }
    else if (property.includes("Spacing") || property === "Item Spacing") {
      try {
        var spacingValue = parseFloat(result.value);
        if (!isNaN(spacingValue)) {
          var isAlreadyBound = node.boundVariables &&
                               node.boundVariables.itemSpacing;

          if (!isAlreadyBound) {
            node.setBoundVariable('itemSpacing', variable);
            appliedCount++;
          }
        }
      } catch (e) {
        console.error("Erreur Spacing:", e);
      }
    }
    else if (property.includes("Padding")) {
      try {
        var paddingValue = parseFloat(result.value);
        if (!isNaN(paddingValue)) {
          var figmaProperty = result.figmaProperty;
          if (figmaProperty) {
            var isAlreadyBound = node.boundVariables && node.boundVariables[figmaProperty];

            if (!isAlreadyBound) {
              node.setBoundVariable(figmaProperty, variable);
              appliedCount++;
            }
          }
        }
      } catch (e) {
        console.error("Erreur Padding:", e);
      }
    }

  } catch (e) {
    console.error("Erreur générale lors de l'application d'une correction à un nœud:", e);
  }

  return appliedCount;
}

function applyAllFixes() {
  var appliedCount = 0;

  if (!lastScanResults || lastScanResults.length === 0) {
    return 0;
  }

  // Note: figma.groupOperations has been removed in newer Figma API versions
  // Each operation will now be undoable individually
  // Appliquer chaque correction individuellement
  for (var i = 0; i < lastScanResults.length; i++) {
    var result = lastScanResults[i];

    try {
      var node = figma.getNodeById(result.nodeId);
      if (!node) continue;

      var variable = figma.variables.getVariableById(result.suggestedVariableId);
      if (!variable) continue;

      // Logique de confiance : On fait confiance au scan effectué 2 secondes avant
      if (result.property === "Fill") {
        try {
          if (node.fills && Array.isArray(node.fills) && typeof result.fillIndex === 'number') {
            var fillIndex = result.fillIndex;
            if (fillIndex < node.fills.length) {
              var targetFill = node.fills[fillIndex];
              var isAlreadyBound = node.boundVariables &&
                                   node.boundVariables.fills &&
                                   node.boundVariables.fills[fillIndex];

              if (!isAlreadyBound && targetFill && targetFill.type === 'SOLID') {
                // Clonage Sécurisé
                var clonedFills = JSON.parse(JSON.stringify(node.fills));
                if (!clonedFills[fillIndex].boundVariables) {
                  clonedFills[fillIndex].boundVariables = {};
                }
                
                // 🔥 CORRECTION CRITIQUE : Utiliser un alias de variable au lieu de l'objet variable
                clonedFills[fillIndex].boundVariables.color = {
                  type: 'VARIABLE_ALIAS',
                  id: variable.id
                };

                try {
                  node.fills = clonedFills;
                  appliedCount++;
                } catch (textError) {
                  console.error("Erreur spécifique Fill:", textError);
                }
              }
            }
          }
        } catch (e) {
          console.error("Erreur Fill:", e);
        }
      }
      else if (result.property === "Stroke") {
        try {
          if (node.strokes && Array.isArray(node.strokes) && typeof result.strokeIndex === 'number') {
            var strokeIndex = result.strokeIndex;
            if (strokeIndex < node.strokes.length) {
              var targetStroke = node.strokes[strokeIndex];
              var isAlreadyBound = node.boundVariables &&
                                   node.boundVariables.strokes &&
                                   node.boundVariables.strokes[strokeIndex];

              if (!isAlreadyBound && targetStroke && targetStroke.type === 'SOLID') {
                var clonedStrokes = JSON.parse(JSON.stringify(node.strokes));
                if (!clonedStrokes[strokeIndex].boundVariables) {
                  clonedStrokes[strokeIndex].boundVariables = {};
                }
                
                // 🔥 CORRECTION CRITIQUE : Utiliser un alias de variable
                clonedStrokes[strokeIndex].boundVariables.color = {
                  type: 'VARIABLE_ALIAS',
                  id: variable.id
                };

                try {
                  node.strokes = clonedStrokes;
                  appliedCount++;
                } catch (strokeError) {
                  console.error("Erreur spécifique Stroke:", strokeError);
                }
              }
            }
          }
        } catch (e) {
          console.error("Erreur Stroke:", e);
        }
      }
      else {
        // Propriétés numériques (radius, spacing, padding, etc.) - node.setBoundVariable accepte directement l'objet variable
        try {
          var figmaProperty = result.figmaProperty;
          if (figmaProperty) {
            var isAlreadyBound = node.boundVariables && node.boundVariables[figmaProperty];
            if (!isAlreadyBound) {
              node.setBoundVariable(figmaProperty, variable);
              appliedCount++;
            }
          }
        } catch (e) {
          console.error("Erreur propriété numérique:", e);
        }
      }

    } catch (e) {
      console.error("Erreur générale lors de l'application d'une correction:", e);
    }
  }

  return appliedCount;
}

// ============================================
// SELECTION CHANGE LISTENER
// ============================================

function checkAndNotifySelection() {
  var selection = figma.currentPage.selection;
  var hasValidSelection = selection.length > 0 && selection.some(function(node) {
    return node.type === "FRAME" ||
           node.type === "GROUP" ||
           node.type === "COMPONENT" ||
           node.type === "INSTANCE" ||
           node.type === "SECTION";
  });

  // Récupérer le nom de la première frame valide sélectionnée
  var selectedFrameName = null;
  if (hasValidSelection) {
    var firstValidNode = selection.find(function(node) {
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

  figma.ui.postMessage({
    type: "selection-checked",
    hasSelection: hasValidSelection,
    selectedFrameName: selectedFrameName
  });
}

figma.on("selectionchange", function() {
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
      console.error(e);
      figma.notify("❌ Erreur lors de l'import depuis le fichier");
    }
  }

  if (msg.type === "scan-frame") {
    try {
      var results = scanSelection();
      console.log("Scan completed, sending", results.length, "results to UI");
      figma.ui.postMessage({
        type: "scan-results",
        results: results
      });
    } catch (e) {
      console.error("Erreur lors de l'analyse:", e);
      figma.notify("❌ Erreur lors de l'analyse de la frame");
    }
  }

  if (msg.type === "apply-all-fixes") {
    var appliedCount = 0;
    var applicationError = null;

    try {
      appliedCount = applyAllFixes();
      if (appliedCount > 0 && !applicationError) {
        figma.notify("✅ " + appliedCount + " correction(s) appliquée(s) (Ctrl+Z pour annuler)");
      }
    } catch (e) {
      console.error("❌ Erreur CRITIQUE lors de l'application des corrections:", e);
      applicationError = e;
    }

    try {
      figma.ui.postMessage({
        type: "all-fixes-applied",
        appliedCount: appliedCount,
        error: applicationError ? applicationError.message : null
      });

      if (!applicationError) {
        figma.notify("✅ " + appliedCount + " correction(s) appliquée(s) avec succès");
      }
    } catch (uiError) {
      console.error("❌ Erreur lors de l'envoi du message à l'UI:", uiError);
    }
  }

  if (msg.type === "apply-single-fix") {
    var appliedCount = 0;
    var applicationError = null;
    var index = msg.index;
    var selectedVariableId = msg.selectedVariableId;

    try {
      appliedCount = applySingleFix(index, selectedVariableId);
    } catch (e) {
      console.error("❌ Erreur lors de l'application de la correction individuelle:", e);
      applicationError = e;
    }

    try {
      figma.ui.postMessage({
        type: "single-fix-applied",
        appliedCount: appliedCount,
        error: applicationError ? applicationError.message : null
      });

      if (!applicationError && appliedCount > 0) {
        figma.notify("✅ Correction appliquée avec succès");
      }
    } catch (uiError) {
      console.error("❌ Erreur lors de l'envoi du message à l'UI:", uiError);
    }
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
      console.warn("Erreur lors du redimensionnement:", error);
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
      var nodeIds = indices.map(function(index) {
        return lastScanResults[index] ? lastScanResults[index].nodeId : null;
      }).filter(function(nodeId) { return nodeId !== null; });

      if (nodeIds.length === 0) return;

      // Obtenir les nodes et les sélectionner
      var nodes = nodeIds.map(function(nodeId) {
        return figma.getNodeById(nodeId);
      }).filter(function(node) { return node !== null; });

      if (nodes.length > 0) {
        // Ne pas sélectionner les nodes, juste les mettre en vue
        figma.viewport.scrollAndZoomIntoView(nodes);
      }
    } catch (e) {
      console.error("Erreur lors du highlight des nodes:", e);
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
      indices.forEach(function(index) {
        if (index >= 0 && index < lastScanResults.length) {
          var result = lastScanResults[index];
          if (result) {
            appliedCount += applyFixToNode(result.nodeId, variableId, result.property, result);
          }
        }
      });

      figma.notify("✅ " + appliedCount + " correction(s) appliquée(s) au groupe");

      // Rescanner pour mettre à jour l'UI
      var updatedResults = scanSelection();
      figma.ui.postMessage({
        type: "scan-results",
        results: updatedResults
      });

    } catch (e) {
      console.error("❌ Erreur lors de l'application du fix de groupe:", e);
      applicationError = e;
    }

    try {
      figma.ui.postMessage({
        type: "group-fix-applied",
        appliedCount: appliedCount,
        error: applicationError ? applicationError.message : null
      });
    } catch (uiError) {
      console.error("❌ Erreur lors de l'envoi du message à l'UI:", uiError);
    }
  }
};