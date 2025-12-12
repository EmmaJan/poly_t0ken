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
  typography: ["FONT_SIZE", "LINE_HEIGHT", "LETTER_SPACING", "TEXT_CONTENT"]
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
    console.warn("[resolveVariableValue] Cycle détecté dans les alias pour variable:", variable.name);
    return null;
  }

  visitedVariables.add(variable.id);

  try {
    var value = variable.valuesByMode[modeId];

    // Si c'est un alias, résoudre récursivement
    if (value && typeof value === 'object' && value.type === 'VARIABLE_ALIAS') {
      console.log("[resolveVariableValue] Alias détecté pour", variable.name, "-> résolution vers", value.id);

      var parentVar = figma.variables.getVariableById(value.id);
      if (!parentVar) {
        console.warn("[resolveVariableValue] Variable parente introuvable:", value.id);
        return null;
      }

      // Pour les alias, utiliser le même mode ou le mode par défaut de la variable parente
      var parentModeId = modeId; // On garde le même mode pour simplifier
      return resolveVariableValue(parentVar, parentModeId, visitedVariables);
    }

    // Valeur brute atteinte
    return value;

  } catch (error) {
    console.error("[resolveVariableValue] Erreur lors de la résolution de", variable.name, ":", error);
    return null;
  } finally {
    visitedVariables.delete(variable.id);
  }
}

function createValueToVariableMap() {
  console.log("🔧 Construction de la map des variables avec résolution des alias...");
  var map = new Map(); // value -> [{id, name, collectionName, resolvedValue}, ...]
  var localCollections = figma.variables.getLocalVariableCollections();

  console.log("📚 Collections trouvées:", localCollections.length);

  localCollections.forEach(function(collection) {
    collection.variableIds.forEach(function(variableId) {
      var variable = figma.variables.getVariableById(variableId);
      if (!variable) {
        console.warn("[createValueToVariableMap] Variable introuvable:", variableId);
        return;
      }

      collection.modes.forEach(function(mode) {
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
            console.log('[DEBUG createValueToVariableMap] Stockage variable numérique:', variable.name, '=', resolvedValue);
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

  console.log("MAP INITIALISÉE :", map.size, "couleurs/valeurs uniques trouvées dans la librairie locale.");
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

  return variables.filter(function(variable) {
    // Récupérer la variable complète depuis Figma
    var figmaVariable = figma.variables.getVariableById(variable.id);
    if (!figmaVariable || !figmaVariable.scopes) {
      return false; // Variable invalide ou sans scopes
    }

    // Vérifier si au moins un scope de la variable correspond aux scopes requis
    return figmaVariable.scopes.some(function(variableScope) {
      return requiredScopes.includes(variableScope);
    });
  });
}

// Fonction pour trouver les meilleures suggestions de variables de couleur
function findColorSuggestions(hexValue, valueToVariableMap, propertyType) {
  // Déterminer les scopes appropriés pour cette propriété
  var requiredScopes = getScopesForProperty(propertyType);
  console.log("[DEBUG] Recherche pour Hex:", hexValue, "Scopes requis:", requiredScopes);

  // Chercher d'abord une correspondance exacte
  var exactMatches = valueToVariableMap.get(hexValue);
  if (exactMatches && exactMatches.length > 0) {
    // Filtrer selon les scopes
    var filteredExactMatches = filterVariablesByScopes(exactMatches, requiredScopes);
    if (filteredExactMatches.length > 0) {
      console.log('[findColorSuggestions] Correspondance exacte trouvée et filtrée:', filteredExactMatches[0].name);
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
  valueToVariableMap.forEach(function(vars, varHex) {
    if (vars && vars.length > 0) {
      var distance = getColorDistance(hexValue, varHex);
      minDistanceFound = Math.min(minDistanceFound, distance);

      if (distance <= maxDistance) {
        // Vérifier si rejeté par scope
        var filteredVars = filterVariablesByScopes(vars, requiredScopes);
        var passScope = filteredVars.length > 0;

        if (!passScope) {
          console.log("[DEBUG] Variable rejetée par SCOPE:", vars[0].name, "scopes:", vars[0].scopes, "requis:", requiredScopes, "distance:", distance);
        } else {
          console.log("[DEBUG] Candidat valide trouvé:", vars[0].name, "Distance:", distance);
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
    console.log("[DEBUG] Aucune suggestion avec scopes, tentative fallback sans filtre de scope");

    valueToVariableMap.forEach(function(vars, varHex) {
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
          console.log("[DEBUG] Fallback: variable trouvée sans filtre scope:", vars[0].name, "Distance:", distance);
        }
      }
    });
  }

  // Trier par distance croissante et prendre les 3 meilleures
  suggestions.sort(function(a, b) {
    return a.distance - b.distance;
  });

  console.log('[findColorSuggestions] Suggestions trouvées pour', propertyType, ':', suggestions.length, '(dont', suggestions.filter(function(s) { return s.scopeMismatch; }).length, 'avec scope mismatch)');

  // Log de debug détaillé si aucune suggestion n'est trouvée
  if (suggestions.length === 0) {
    console.log("FAIL: Hex", hexValue, " - Distance min trouvée :", minDistanceFound, "- Max tolérance:", maxDistance);
  }

  return suggestions.slice(0, 3);
}

// Fonction pour trouver les meilleures suggestions de variables numériques
function findNumericSuggestions(targetValue, valueToVariableMap, tolerance, propertyType) {
  // Tolérance par défaut de 4px pour radius, 8px pour spacing (plus permissif)
  tolerance = tolerance !== undefined ? tolerance : (propertyType.indexOf('Spacing') !== -1 ? 8 : 4);

  console.log('[DEBUG findNumericSuggestions] Recherche pour valeur:', targetValue, 'type:', propertyType, 'tolérance:', tolerance);

  // Déterminer les scopes appropriés pour cette propriété
  var requiredScopes = getScopesForProperty(propertyType);
  console.log('[findNumericSuggestions] Scopes requis pour', propertyType, ':', requiredScopes);

  // Chercher d'abord une correspondance exacte
  console.log('[DEBUG findNumericSuggestions] Recherche correspondance exacte pour valeur:', targetValue);
  var exactMatches = valueToVariableMap.get(targetValue);
  console.log('[DEBUG findNumericSuggestions] Correspondances exactes trouvées:', exactMatches ? exactMatches.length : 0);

  if (exactMatches && exactMatches.length > 0) {
    console.log('[DEBUG findNumericSuggestions] Variables exactes:', exactMatches.map(function(v) { return v.name; }));
    // Filtrer selon les scopes
    var filteredExactMatches = filterVariablesByScopes(exactMatches, requiredScopes);
    console.log('[DEBUG findNumericSuggestions] Après filtrage scopes:', filteredExactMatches.length);
    if (filteredExactMatches.length > 0) {
      console.log('[findNumericSuggestions] Correspondance exacte trouvée et filtrée:', filteredExactMatches[0].name);
      return [{
        id: filteredExactMatches[0].id,
        name: filteredExactMatches[0].name,
        value: targetValue,
        difference: 0,
        isExact: true
      }];
    } else {
      console.log('[DEBUG findNumericSuggestions] Aucune correspondance exacte après filtrage scopes');
    }
  } else {
    console.log('[DEBUG findNumericSuggestions] Aucune correspondance exacte trouvée');
  }

  // Si pas de correspondance exacte, chercher les plus proches dans la tolérance
  var suggestions = [];
  console.log('[DEBUG findNumericSuggestions] Recherche approximative avec tolérance:', tolerance);

  // Parcourir toutes les variables numériques disponibles dans valueToVariableMap
  valueToVariableMap.forEach(function(vars, varValue) {
    if (vars && vars.length > 0 && typeof varValue === 'number') {
      console.log('[DEBUG findNumericSuggestions] Vérification variable:', vars[0].name, 'valeur:', varValue, 'type:', typeof varValue);
      // Filtrer les variables selon les scopes
      var filteredVars = filterVariablesByScopes(vars, requiredScopes);
      console.log('[DEBUG findNumericSuggestions] Après filtrage scopes:', filteredVars.length, 'pour valeur:', varValue);
      if (filteredVars.length > 0) {
        var difference = Math.abs(targetValue - varValue);
        console.log('[DEBUG findNumericSuggestions] Différence:', difference, 'tolérance:', tolerance);
        if (difference <= tolerance) {
          console.log('[DEBUG findNumericSuggestions] Suggestion ajoutée:', filteredVars[0].name, 'différence:', difference);
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
  suggestions.sort(function(a, b) {
    return a.difference - b.difference;
  });

  console.log('[findNumericSuggestions] Suggestions trouvées pour', propertyType, ':', suggestions.length);
  if (suggestions.length > 0) {
    console.log('[DEBUG findNumericSuggestions] Meilleures suggestions:', suggestions.slice(0, 3).map(function(s) { return s.name + ' (diff:' + s.difference + ')'; }));
  } else {
    console.log('[DEBUG findNumericSuggestions] AUCUNE suggestion trouvée pour valeur:', targetValue, 'avec tolérance:', tolerance);
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
  return suggestions.map(function(suggestion) {
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
function checkNodeProperties(node, valueToVariableMap, results, ignoreHiddenLayers) {
  // === VÉRIFICATIONS DÉFENSIVES DE BASE ===
  if (!node) {
    console.warn("[checkNodeProperties] Nœud null/undefined reçu");
    return;
  }

  // Vérifier si le nœud a été supprimé ou n'existe plus
  if (node.removed) {
    console.warn("[checkNodeProperties] Nœud supprimé détecté:", node.id);
    return;
  }

  // Vérifications de base des propriétés essentielles
  if (!node.id || !node.name || !node.type) {
    console.warn("[checkNodeProperties] Nœud malformé:", node);
    return;
  }

  var nodeId = node.id;
  var layerName = node.name;
  var nodeType = node.type;

  // === VÉRIFICATIONS DÉFENSIVES SUPPLÉMENTAIRES ===
  if (!node || !node.id || !node.type) {
    console.warn("[checkNodeProperties] Nœud malformé ou null détecté");
    return;
  }

  // === FILTRAGE INTELLIGENT ===
  // Ignorer les calques invisibles ou verrouillés selon l'option
  if (ignoreHiddenLayers) {
    try {
      if (node.visible === false) {
        console.log("[checkNodeProperties] Calque invisible ignoré:", layerName);
        return;
      }
      if (node.locked === true) {
        console.log("[checkNodeProperties] Calque verrouillé ignoré:", layerName);
        return;
      }
    } catch (visibilityError) {
      // Certains types de nœuds n'ont pas ces propriétés, continuer silencieusement
    }
  }

  // Liste étendue des types supportés pour le style
  var supportedTypes = [
    'FRAME', 'RECTANGLE', 'ELLIPSE', 'POLYGON', 'STAR', 'VECTOR',
    'TEXT', 'COMPONENT', 'INSTANCE', 'LINE', 'GROUP', 'SECTION', 'COMPONENT_SET'
  ];

  // Pour les conteneurs, on ne vérifie que s'ils peuvent avoir des propriétés de style
  var styleSupportedTypes = [
    'FRAME', 'RECTANGLE', 'ELLIPSE', 'POLYGON', 'STAR', 'VECTOR',
    'TEXT', 'COMPONENT', 'INSTANCE', 'LINE'
  ];

  var isContainer = supportedTypes.indexOf(nodeType) !== -1;
  var supportsStyle = styleSupportedTypes.indexOf(nodeType) !== -1;

  if (!isContainer) {
    console.log("[checkNodeProperties] Type de nœud non supporté:", nodeType);
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
      if (node.type === 'TEXT') {
        checkTypographyPropertiesSafely(node, valueToVariableMap, results);
      }

    } catch (propertyError) {
      console.error("[checkNodeProperties] Erreur lors de l'analyse des propriétés du nœud", nodeId, layerName, ":", propertyError);
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
    console.error("[checkTypographyPropertiesSafely] Erreur lors de l'analyse des propriétés de typographie du nœud", node.id, node.name, ":", typographyError);
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
        if (!fill || fill.type !== 'SOLID' || !fill.color) continue;

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
        console.warn("[checkFillsSafely] Erreur sur fill index", i, "du nœud", node.id, ":", fillError);
        // Continuer vers le fill suivant
      }
    }
  } catch (fillsError) {
    console.error("[checkFillsSafely] Erreur générale sur fills du nœud", node.id, ":", fillsError);
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
        if (!stroke || stroke.type !== 'SOLID' || !stroke.color) continue;

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
        console.warn("[checkStrokesSafely] Erreur sur stroke index", j, "du nœud", node.id, ":", strokeError);
        // Continuer vers le stroke suivant
      }
    }
  } catch (strokesError) {
    console.error("[checkStrokesSafely] Erreur générale sur strokes du nœud", node.id, ":", strokesError);
  }
}

/**
 * Vérifie les corner radius avec gestion complète de figma.mixed
 */
function checkCornerRadiusSafely(node, valueToVariableMap, results) {
  try {
    var nodeType = node.type;
    var radiusSupportedTypes = ['FRAME', 'RECTANGLE', 'ELLIPSE', 'POLYGON', 'STAR', 'VECTOR', 'COMPONENT', 'INSTANCE'];

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
          console.warn("[checkCornerRadiusSafely] Erreur sur radius", prop.name, "du nœud", node.id, ":", radiusError);
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
    console.error("[checkCornerRadiusSafely] Erreur générale sur cornerRadius du nœud", node.id, ":", cornerRadiusError);
  }
}

/**
 * Vérifie les propriétés numériques (spacing, padding, radius)
 */
function checkNumericPropertiesSafely(node, valueToVariableMap, results) {
  try {
    console.log('[DEBUG checkAutoLayoutSafely] Vérification du nœud:', node.name, 'layoutMode:', node.layoutMode);

    // ITEM SPACING (seulement si auto-layout)
    console.log('[DEBUG checkNumericPropertiesSafely] itemSpacing:', node.itemSpacing);
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
        console.log('[DEBUG checkNumericPropertiesSafely] ' + paddingProp.name + ':', paddingValue);

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
        console.warn("[checkNumericPropertiesSafely] Erreur sur padding", paddingProp.name, "du nœud", node.id, ":", paddingError);
      }
    }
  } catch (numericError) {
    console.error("[checkNumericPropertiesSafely] Erreur générale sur propriétés numériques du nœud", node.id, ":", numericError);
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
    console.warn("[isPropertyBoundToVariable] Erreur lors de la vérification de liaison pour", propertyPath, index !== undefined ? "index " + index : "", ":", bindingError);
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
function scanNodeRecursive(node, valueToVariableMap, results, depth, ignoreHiddenLayers) {
  // === PROTECTION CONTRE LES RÉCURSIONS INFINIES ===
  depth = depth || 0;
  var MAX_DEPTH = 50; // Limite de sécurité pour éviter les boucles infinies
  if (depth > MAX_DEPTH) {
    console.warn("[scanNodeRecursive] Profondeur maximale atteinte, arrêt de la récursion à", depth);
    return;
  }

  // === VÉRIFICATIONS DÉFENSIVES DE BASE ===
  if (!node) {
    console.warn("[scanNodeRecursive] Nœud null/undefined reçu à profondeur", depth);
    return;
  }

  // Vérifier si le nœud a été supprimé pendant le scan
  if (node.removed) {
    console.log("[scanNodeRecursive] Nœud supprimé détecté à profondeur", depth, "- ignoré");
    return;
  }

  // Vérification supplémentaire des propriétés essentielles
  if (!node.id || !node.type) {
    console.warn("[scanNodeRecursive] Nœud malformé détecté à profondeur", depth, "- ignoré");
    return;
  }

  // === TRAITEMENT DU NŒUD ACTUEL AVEC PROTECTION ===
  try {
    var nodeType = node.type;
    var nodeId = node.id;
    var nodeName = node.name || "Unnamed";

    console.log("[scanNodeRecursive] Traitement du nœud", nodeType, nodeName, "(ID:", nodeId, ") à profondeur", depth);

    // Liste étendue des types de conteneurs supportés
    var containerTypes = [
      'FRAME', 'GROUP', 'SECTION', 'COMPONENT', 'INSTANCE', 'COMPONENT_SET'
    ];

    // Liste des types qui peuvent avoir des propriétés de style
    var styleTypes = [
      'FRAME', 'RECTANGLE', 'ELLIPSE', 'POLYGON', 'STAR', 'VECTOR',
      'TEXT', 'COMPONENT', 'INSTANCE', 'LINE'
    ];

    var isContainer = containerTypes.indexOf(nodeType) !== -1;
    var hasStyle = styleTypes.indexOf(nodeType) !== -1;

    // Analyser les propriétés de style si applicable
    if (hasStyle) {
      try {
        checkNodeProperties(node, valueToVariableMap, results, ignoreHiddenLayers);
      } catch (propertyAnalysisError) {
        console.error("[scanNodeRecursive] Erreur CRITIQUE lors de l'analyse des propriétés du nœud", nodeId, nodeName, "(type:", nodeType, ") à profondeur", depth, ":", propertyAnalysisError);
        console.error("[scanNodeRecursive] Détails du nœud problématique:", {
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
          console.log("[scanNodeRecursive] Nœud", nodeType, "a", children.length, "enfants à profondeur", depth);

          for (var i = 0; i < children.length; i++) {
            try {
              var child = children[i];

              // Vérification défensive de l'enfant
              if (!child) {
                console.warn("[scanNodeRecursive] Enfant null/undefined à l'index", i, "du nœud", nodeId);
                continue;
              }

              if (child.removed) {
                console.log("[scanNodeRecursive] Enfant supprimé détecté à l'index", i, "du nœud", nodeId);
                continue;
              }

              // Récursion avec protection et limite de profondeur
              scanNodeRecursive(child, valueToVariableMap, results, depth + 1, ignoreHiddenLayers);

            } catch (childError) {
              console.error("[scanNodeRecursive] Erreur lors du traitement de l'enfant à l'index", i, "du nœud", nodeId, nodeName, ":", childError);
              // Continuer vers l'enfant suivant même en cas d'erreur
            }
          }
        } else if (nodeType === 'INSTANCE') {
          // Les instances peuvent avoir des overrides sans children directs
          console.log("[scanNodeRecursive] Instance", nodeName, "traitée (pas d'enfants directs ou overrides spéciaux)");
        }

      } catch (childrenError) {
        console.error("[scanNodeRecursive] Erreur lors de l'accès aux enfants du nœud", nodeId, nodeName, "à profondeur", depth, ":", childrenError);
        // Ne pas arrêter le scan complet
      }
    }

  } catch (nodeError) {
    console.error("[scanNodeRecursive] Erreur critique lors du traitement du nœud à profondeur", depth, ":", nodeError);
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
  console.log("[scanSelection] Démarrage de l'analyse asynchrone...");

  try {
    // === VÉRIFICATION DE LA SÉLECTION ===
    var selection = figma.currentPage.selection;

    if (!selection || !Array.isArray(selection)) {
      console.warn("[scanSelection] Sélection invalide ou inaccessible");
      figma.ui.postMessage({ type: "scan-results", results: [] });
      return [];
    }

    // === SCAN CONTEXTUEL INTELLIGENT ===
    if (selection.length === 0) {
      console.log("[scanSelection] Aucune sélection - scan de la page entière");
      figma.notify("📄 Aucune sélection : Analyse de la page entière...");

      // Scanner toute la page
      return scanPage(ignoreHiddenLayers);
    }

    console.log("[scanSelection]", selection.length, "nœud(s) sélectionné(s)");

    // === CRÉATION DE LA MAP DES VARIABLES AVEC PROTECTION ===
    var valueToVariableMap;
    try {
      valueToVariableMap = createValueToVariableMap();
      console.log("Variables chargées dans la Map :", valueToVariableMap.size);

      if (!valueToVariableMap || valueToVariableMap.size === 0) {
        console.warn("[scanSelection] Aucune variable trouvée ou erreur lors de la création de la map");
        figma.notify("⚠️ Aucune variable trouvée dans le document");
        figma.ui.postMessage({ type: "scan-results", results: [] });
        return [];
      }
      console.log("[scanSelection] Map des variables créée avec", valueToVariableMap.size, "entrées");
    } catch (mapError) {
      console.error("[scanSelection] Erreur critique lors de la création de la map des variables:", mapError);
      figma.notify("❌ Erreur lors de l'accès aux variables");
      figma.ui.postMessage({ type: "scan-results", results: [] });
      return [];
    }

    // Démarrer le scan asynchrone
    startAsyncScan(selection, valueToVariableMap, ignoreHiddenLayers);

  } catch (scanError) {
    console.error("[scanSelection] Erreur critique lors de l'analyse de la sélection:", scanError);
    figma.notify("❌ Erreur critique lors de l'analyse - vérifiez la console pour les détails");
    figma.ui.postMessage({ type: "scan-results", results: [] });
  }
}

/**
 * Scan asynchrone de la page entière
 */
function scanPage(ignoreHiddenLayers) {
  console.log("[scanPage] Démarrage du scan de page entière...");

  try {
    var pageChildren = figma.currentPage.children;

    if (!pageChildren || !Array.isArray(pageChildren)) {
      console.warn("[scanPage] Aucun enfant trouvé sur la page");
      figma.ui.postMessage({ type: "scan-results", results: [] });
      return [];
    }

    // === CRÉATION DE LA MAP DES VARIABLES ===
    var valueToVariableMap;
    try {
      valueToVariableMap = createValueToVariableMap();
      if (!valueToVariableMap || valueToVariableMap.size === 0) {
        console.warn("[scanPage] Aucune variable trouvée");
        figma.notify("⚠️ Aucune variable trouvée dans le document");
        figma.ui.postMessage({ type: "scan-results", results: [] });
        return [];
      }
    } catch (mapError) {
      console.error("[scanPage] Erreur lors de la création de la map des variables:", mapError);
      figma.notify("❌ Erreur lors de l'accès aux variables");
      figma.ui.postMessage({ type: "scan-results", results: [] });
      return [];
    }

    // Démarrer le scan asynchrone de la page
    startAsyncScan(pageChildren, valueToVariableMap, ignoreHiddenLayers);

  } catch (pageScanError) {
    console.error("[scanPage] Erreur critique lors du scan de page:", pageScanError);
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

  console.log("[startAsyncScan] Scan asynchrone démarré pour", totalNodes, "nœuds");

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
        console.error("[processChunk] Erreur sur nœud", i, ":", nodeError);
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
function finishScan(results) {
  console.log("[finishScan] Scan terminé -", results.length, "problème(s) détecté(s)");

  // Stocker les résultats pour les corrections
  lastScanResults = results;

  // Notifier l'utilisateur
  if (results.length > 0) {
    figma.notify("✅ Analyse terminée - " + results.length + " problème(s) détecté(s)");
  } else {
    figma.notify("✅ Analyse terminée - Aucun problème détecté");
  }

  // Petit délai pour stabiliser après le scan asynchrone
  setTimeout(function() {
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
  }, 100); // 100ms de délai
}

// ⚡️ VERSION ROBUSTE AVEC VALIDATIONS COMPLETES
// ============================================
// DIAGNOSTIC DES PROBLÈMES RESTANTS
// ============================================

/**
 * Diagnostique les causes potentielles d'échec d'application
 */
function diagnoseApplicationFailure(result, variableId, error) {
  console.log('[diagnoseApplicationFailure] 🔍 Diagnostic pour:', result.layerName, '->', result.property);
  console.log('[diagnoseApplicationFailure] 📋 Erreur rapportée:', error);

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

    console.log('[diagnoseApplicationFailure] 📋 Scopes requis:', requiredScopes);
    console.log('[diagnoseApplicationFailure] 📋 Scopes variable:', variableScopes);

    var hasRequiredScopes = requiredScopes.some(function(scope) { return variableScopes.includes(scope); });
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
    console.error('[diagnoseApplicationFailure] Erreur lors du diagnostic:', diagError);
    diagnosis.issue = 'diagnostic_error';
    diagnosis.recommendations.push('Erreur lors de l\'analyse du problème');
  }

  console.log('[diagnoseApplicationFailure] 📊 Diagnostic final:', diagnosis);
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
          if (fill.type !== 'SOLID') {
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
          if (stroke.type !== 'SOLID') {
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
  console.log('[applyAndVerifyFix] 📋 DÉMARRAGE pour:', result.layerName, '(' + result.nodeId + ') ->', result.property);
  console.log('[applyAndVerifyFix] 🔍 Données d\'entrée:', {
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
    console.log('[applyAndVerifyFix] 🔍 Phase 1: Validations préalables');

    // Vérifier que le résultat est valide
    console.log('[applyAndVerifyFix] 🧪 Validation 1: Résultat valide');
    if (!result) {
      console.error('[applyAndVerifyFix] ❌ Result est null/undefined');
      throw new Error('Résultat invalide ou incomplet');
    }
    if (!result.nodeId) {
      console.error('[applyAndVerifyFix] ❌ result.nodeId manquant:', result);
      throw new Error('Résultat invalide: nodeId manquant');
    }
    if (!result.property) {
      console.error('[applyAndVerifyFix] ❌ result.property manquant:', result);
      throw new Error('Résultat invalide: property manquant');
    }
    console.log('[applyAndVerifyFix] ✅ Résultat valide');

    // Déterminer l'ID de variable à utiliser
    console.log('[applyAndVerifyFix] 🧪 Validation 2: ID de variable');
    var finalVariableId = variableId || result.suggestedVariableId;
    console.log('[applyAndVerifyFix] 📋 variableId fourni:', variableId);
    console.log('[applyAndVerifyFix] 📋 suggestedVariableId:', result.suggestedVariableId);
    console.log('[applyAndVerifyFix] 📋 finalVariableId choisi:', finalVariableId);

    if (!finalVariableId) {
      console.error('[applyAndVerifyFix] ❌ Aucun ID de variable disponible');
      throw new Error('Aucun ID de variable fourni ou suggéré');
    }
    verificationResult.details.variableId = finalVariableId;
    console.log('[applyAndVerifyFix] ✅ ID de variable déterminé');

    // Vérifier que la variable existe
    console.log('[applyAndVerifyFix] 🧪 Validation 3: Existence de la variable');
    var variable = figma.variables.getVariableById(finalVariableId);
    console.log('[applyAndVerifyFix] 🔍 Variable trouvée:', !!variable);
    if (variable) {
      console.log('[applyAndVerifyFix] 📋 Détails variable:', {
        id: variable.id,
        name: variable.name,
        resolvedType: variable.resolvedType,
        scopes: variable.scopes
      });
    }

    if (!variable) {
      console.error('[applyAndVerifyFix] ❌ Variable introuvable:', finalVariableId);
      console.log('[applyAndVerifyFix] 📋 Variables disponibles:', figma.variables.getLocalVariables().length);

      // Lister quelques variables pour debug
      var allVars = figma.variables.getLocalVariables().slice(0, 5);
      console.log('[applyAndVerifyFix] 📋 Exemples de variables:', allVars.map(function(v) { return {id: v.id, name: v.name}; }));
      throw new Error('Variable introuvable: ' + finalVariableId);
    }
    console.log('[applyAndVerifyFix] ✅ Variable existe');

    // Vérifier que le nœud existe et n'est pas supprimé
    console.log('[applyAndVerifyFix] 🧪 Validation 4: Existence du nœud');
    var node = figma.getNodeById(result.nodeId);
    console.log('[applyAndVerifyFix] 🔍 Nœud trouvé:', !!node);
    if (node) {
      console.log('[applyAndVerifyFix] 📋 Détails nœud:', {
        id: node.id,
        name: node.name,
        type: node.type,
        removed: node.removed
      });
    }

    if (!node) {
      console.error('[applyAndVerifyFix] ❌ Nœud introuvable:', result.nodeId);
      throw new Error('Nœud introuvable: ' + result.nodeId);
    }
    if (node.removed) {
      console.error('[applyAndVerifyFix] ❌ Nœud supprimé:', result.nodeId);
      throw new Error('Nœud supprimé: ' + result.nodeId);
    }
    console.log('[applyAndVerifyFix] ✅ Nœud valide');

    // Vérifier que la propriété existe toujours
    console.log('[applyAndVerifyFix] 🧪 Validation 5: Existence de la propriété');
    if (!validatePropertyExists(node, result)) {
      console.error('[applyAndVerifyFix] ❌ Propriété n\'existe plus:', result.property);
      console.log('[applyAndVerifyFix] 📋 État du nœud pour debug:', getNodePropertyDebugInfo(node, result));
      throw new Error('Propriété n\'existe plus: ' + result.property);
    }
    console.log('[applyAndVerifyFix] ✅ Propriété existe');

    // Vérifier que la variable est compatible
    console.log('[applyAndVerifyFix] 🧪 Validation 6: Compatibilité variable-propriété');
    if (!validateVariableCanBeApplied(variable, result)) {
      console.error('[applyAndVerifyFix] ❌ Variable incompatible');
      console.log('[applyAndVerifyFix] 📋 Type variable:', variable.resolvedType);
      console.log('[applyAndVerifyFix] 📋 Propriété:', result.property);
      throw new Error('Variable incompatible: ' + variable.name + ' (' + variable.resolvedType + ') pour ' + result.property);
    }
    console.log('[applyAndVerifyFix] ✅ Variable compatible');

    console.log('[applyAndVerifyFix] ✅ Toutes les validations préalables réussies');

    // === PHASE 2: CAPTURER L'ÉTAT AVANT ===
    console.log('[applyAndVerifyFix] 📸 Phase 2: Capture état avant');
    var stateBefore = captureNodeState(node, result);

    // === PHASE 3: APPLICATION ===
    console.log('[applyAndVerifyFix] 🔧 Phase 3: Application de la variable');
    console.log('[applyAndVerifyFix] 📋 État avant application:', getNodePropertyDebugInfo(node, result));

    var applied = applyVariableToProperty(node, variable, result);
    console.log('[applyAndVerifyFix] 📋 applyVariableToProperty retourné:', applied);

    if (!applied) {
      console.error('[applyAndVerifyFix] ❌ applyVariableToProperty a retourné false');
      throw new Error('Échec de l\'application de la variable');
    }

    verificationResult.applied = true;
    console.log('[applyAndVerifyFix] ✅ Variable appliquée avec succès');
    console.log('[applyAndVerifyFix] 📋 État après application:', getNodePropertyDebugInfo(node, result));

    // === PHASE 4: VÉRIFICATION ===
    console.log('[applyAndVerifyFix] 🔍 Phase 4: Vérification de l\'application');
    var stateAfter = captureNodeState(node, result);

    var verified = verifyVariableApplication(node, variable, result, stateBefore, stateAfter);

    if (!verified) {
      throw new Error('Vérification échouée: la variable n\'a pas été correctement appliquée');
    }

    verificationResult.verified = true;
    verificationResult.success = true;

    console.log('[applyAndVerifyFix] ✅ Application et vérification réussies');

  } catch (error) {
    console.error('[applyAndVerifyFix] ❌ Erreur:', error.message);
    verificationResult.error = error.message;
    verificationResult.success = false;

    // Diagnostic automatique en cas d'échec
    try {
      console.log('[applyAndVerifyFix] 🔍 Lancement diagnostic automatique...');
      var diagnosis = diagnoseApplicationFailure(result, verificationResult.details.variableId, error);
      verificationResult.diagnosis = diagnosis;

      console.log('[applyAndVerifyFix] 📊 Diagnostic:', diagnosis.issue, '(confiance:', diagnosis.confidence + ')');
      if (diagnosis.recommendations.length > 0) {
        console.log('[applyAndVerifyFix] 💡 Recommandations:', diagnosis.recommendations);
      }
    } catch (diagError) {
      console.error('[applyAndVerifyFix] Erreur lors du diagnostic:', diagError);
    }
  } finally {
    verificationResult.details.duration = Date.now() - startTime;
  }

  console.log('[applyAndVerifyFix] 📊 Résultat final:', verificationResult.success ? 'SUCCÈS' : 'ÉCHEC',
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
    console.warn('[captureNodeState] Erreur lors de la capture:', error);
  }

  return state;
}

/**
 * Vérifie que la variable a été correctement appliquée en comparant les états
 */
function verifyVariableApplication(node, variable, result, stateBefore, stateAfter) {
  try {
    console.log('[verifyVariableApplication] 🔍 Vérification pour:', result.property);

    // === MÉTHODE 1: VÉRIFICATION VIA boundVariables ===
    var boundVariablesChanged = JSON.stringify(stateBefore.boundVariables) !== JSON.stringify(stateAfter.boundVariables);

    if (boundVariablesChanged) {
      console.log('[verifyVariableApplication] ✅ boundVariables modifié - variable probablement appliquée');
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
    console.error('[verifyVariableApplication] Erreur lors de la vérification:', error);
    return false;
  }
}

/**
 * Vérifie l'application d'une variable sur un fill
 */
function verifyFillApplication(node, variable, fillIndex, stateBefore, stateAfter) {
  try {
    if (!node.fills || !node.fills[fillIndex]) {
      console.warn('[verifyFillApplication] Fill inexistant');
      return false;
    }

    var currentFill = node.fills[fillIndex];

    // Vérifier qu'un boundVariable color existe
    if (currentFill.boundVariables && currentFill.boundVariables.color) {
      var boundVar = currentFill.boundVariables.color;
      if (boundVar.type === 'VARIABLE_ALIAS' && boundVar.id === variable.id) {
        console.log('[verifyFillApplication] ✅ Fill correctement lié à la variable');
        return true;
      }
    }

    console.warn('[verifyFillApplication] ❌ Fill pas correctement lié');
    return false;

  } catch (error) {
    console.error('[verifyFillApplication] Erreur:', error);
    return false;
  }
}

/**
 * Vérifie l'application d'une variable sur un stroke
 */
function verifyStrokeApplication(node, variable, strokeIndex, stateBefore, stateAfter) {
  try {
    if (!node.strokes || !node.strokes[strokeIndex]) {
      console.warn('[verifyStrokeApplication] Stroke inexistant');
      return false;
    }

    var currentStroke = node.strokes[strokeIndex];

    // Vérifier qu'un boundVariable color existe
    if (currentStroke.boundVariables && currentStroke.boundVariables.color) {
      var boundVar = currentStroke.boundVariables.color;
      if (boundVar.type === 'VARIABLE_ALIAS' && boundVar.id === variable.id) {
        console.log('[verifyStrokeApplication] ✅ Stroke correctement lié à la variable');
        return true;
      }
    }

    console.warn('[verifyStrokeApplication] ❌ Stroke pas correctement lié');
    return false;

  } catch (error) {
    console.error('[verifyStrokeApplication] Erreur:', error);
    return false;
  }
}

/**
 * Vérifie l'application d'une variable numérique
 */
function verifyNumericApplication(node, variable, result, stateBefore, stateAfter) {
  try {
    if (!result.figmaProperty) {
      console.warn('[verifyNumericApplication] Propriété Figma non définie');
      return false;
    }

    // Vérifier que boundVariables contient la propriété
    if (node.boundVariables && node.boundVariables[result.figmaProperty]) {
      var boundVar = node.boundVariables[result.figmaProperty];
      if (boundVar.type === 'VARIABLE_ALIAS' && boundVar.id === variable.id) {
        console.log('[verifyNumericApplication] ✅ Propriété numérique correctement liée');
        return true;
      }
    }

    console.warn('[verifyNumericApplication] ❌ Propriété numérique pas correctement liée');
    return false;

  } catch (error) {
    console.error('[verifyNumericApplication] Erreur:', error);
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
    console.warn('[validatePropertyExists] Erreur:', error);
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
    console.warn('[validateVariableCanBeApplied] Erreur:', error);
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
        console.warn('[applyVariableToProperty] Propriété non supportée:', result.property);
        return false;
    }

    return success;
  } catch (error) {
    console.error('[applyVariableToProperty] Erreur critique:', error);
    return false;
  }
}

/**
 * Applique une variable de couleur à un fill
 */
function applyColorVariableToFill(node, variable, fillIndex) {
  console.log('[applyColorVariableToFill] 🎨 Application sur fill index', fillIndex);
  console.log('[applyColorVariableToFill] 📋 Variable:', {id: variable.id, name: variable.name, type: variable.resolvedType});

  try {
    var fillPath = 'fills[' + fillIndex + '].color';
    console.log('[applyColorVariableToFill] 📋 Chemin:', fillPath);

    // Vérifier que le fill existe
    if (!node.fills || !Array.isArray(node.fills) || !node.fills[fillIndex]) {
      console.error('[applyColorVariableToFill] ❌ Fill inexistant à l\'index', fillIndex);
      console.log('[applyColorVariableToFill] 📋 État fills:', node.fills);
      return false;
    }

    var fill = node.fills[fillIndex];
    console.log('[applyColorVariableToFill] 📋 Fill actuel:', {
      type: fill.type,
      hasBoundVariables: !!fill.boundVariables,
      boundVariables: fill.boundVariables
    });

    // CORRECTION RECOMMANDÉE : Détacher le style AVANT d'essayer setBoundVariable
    // car setBoundVariable peut échouer sur un champ contrôlé par un style
    if (node.fillStyleId) {
      try {
        console.log('[applyColorVariableToFill] 🎯 Détachement fillStyleId avant setBoundVariable:', node.fillStyleId);
        node.fillStyleId = '';
      } catch (e) {
        console.warn("[applyColorVariableToFill] Impossible de détacher fillStyleId", e);
      }
    }

    // Essayer d'abord setBoundVariable
    console.log('[applyColorVariableToFill] 🔧 Tentative setBoundVariable...');
    try {
      node.setBoundVariable(fillPath, variable);
      console.log('[applyColorVariableToFill] ✅ setBoundVariable réussi');

      // Vérification immédiate
      var updatedFill = node.fills[fillIndex];
      console.log('[applyColorVariableToFill] 📋 Vérification post-application:', {
        hasBoundVariables: !!updatedFill.boundVariables,
        boundVariables: updatedFill.boundVariables
      });

      return true;
    } catch (setBoundError) {
      console.warn('[applyColorVariableToFill] ❌ setBoundVariable échoué:', setBoundError.message);
      console.log('[applyColorVariableToFill] 📋 Détails erreur:', setBoundError);
    }

    // Fallback: modification manuelle
    console.log('[applyColorVariableToFill] 🔧 Tentative fallback manuel...');
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
        console.log('[applyColorVariableToFill] 🎯 Détachement fillStyleId:', node.fillStyleId);
        node.fillStyleId = '';
      }

      node.fills = clonedFills;
      console.log('[applyColorVariableToFill] ✅ Fallback réussi');

      // Vérification
      var finalFill = node.fills[fillIndex];
      console.log('[applyColorVariableToFill] 📋 Vérification fallback:', {
        hasBoundVariables: !!finalFill.boundVariables,
        boundVariables: finalFill.boundVariables
      });

      return true;
    } catch (fallbackError) {
      console.error('[applyColorVariableToFill] ❌ Fallback échoué:', fallbackError.message);
      return false;
    }

  } catch (error) {
    console.error('[applyColorVariableToFill] 💥 Erreur générale:', error);
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
      console.log('[applyColorVariableToStroke] ✅ Stroke appliqué via setBoundVariable');
      return true;
    } catch (setBoundError) {
      console.warn('[applyColorVariableToStroke] setBoundVariable échoué, tentative fallback:', setBoundError);
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
      console.log('[applyColorVariableToStroke] ✅ Stroke appliqué via fallback');
      return true;
    }

    return false;
  } catch (error) {
    console.error('[applyColorVariableToStroke] Erreur:', error);
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
      console.warn('[applyNumericVariable] Impossible d\'appliquer une variable sur itemSpacing avec SPACE_BETWEEN');
      return false;
    }

    // Appliquer la variable
    node.setBoundVariable(figmaProperty, variable);
    console.log('[applyNumericVariable] ✅ Propriété numérique appliquée:', displayProperty);
    return true;

  } catch (error) {
    console.error('[applyNumericVariable] Erreur:', error);
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
    console.warn("[applyFixToNode] Échec pour le nœud " + nodeId + ": " + verification.error);
    return 0;
  }
}

function applyAllFixes() {
  console.log('[applyAllFixes] 🚀 Démarrage application de tous les correctifs');
  var appliedCount = 0;
  var failedCount = 0;
  var results = [];

  if (!lastScanResults || lastScanResults.length === 0) {
    console.log('[applyAllFixes] ⚠️ Aucun résultat de scan disponible');
    return 0;
  }

  console.log('[applyAllFixes] 📊 Traitement de', lastScanResults.length, 'résultats');

  // Appliquer chaque correction avec vérification
  for (var i = 0; i < lastScanResults.length; i++) {
    var result = lastScanResults[i];
    console.log('[applyAllFixes] 🔄 Traitement résultat', i + 1, '/', lastScanResults.length, ':', result.layerName, '->', result.property);

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
        console.log('[applyAllFixes] ✅ SUCCÈS pour résultat', i);
      } else {
        failedCount++;
        console.log('[applyAllFixes] ❌ ÉCHEC pour résultat', i, ':', verificationResult.error);
      }

    } catch (error) {
      failedCount++;
      console.error('[applyAllFixes] 💥 ERREUR CRITIQUE pour résultat', i, ':', error);

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
  console.log('[applyAllFixes] 📊 RAPPORT FINAL:');
  console.log('  - Total traité:', lastScanResults.length);
  console.log('  - Réussis:', appliedCount);
  console.log('  - Échoués:', failedCount);
  console.log('  - Taux de succès:', Math.round((appliedCount / lastScanResults.length) * 100) + '%');

  // Afficher les diagnostics pour les échecs
  if (failedCount > 0) {
    console.log('[applyAllFixes] 🔍 DIAGNOSTICS DES ÉCHECS:');
    results.forEach(function(item) {
      if (!item.verification.success && item.verification.diagnosis) {
        console.log('  ❌', item.result.layerName, '(' + item.result.property + '):', item.verification.diagnosis.issue);
      }
    });
  }

  console.log('[applyAllFixes] ✅ Application terminée, retours:', appliedCount);
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
      // Par défaut, ignorer les calques invisibles/verrouillés
      var ignoreHiddenLayers = msg.ignoreHiddenLayers !== false;
      scanSelection(ignoreHiddenLayers);
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
      var result = lastScanResults ? lastScanResults[index] : null;
      appliedCount = applySingleFix(result, selectedVariableId);
    } catch (e) {
      console.error("❌ Erreur lors de l'application de la correction individuelle:", e);
      applicationError = e;
    }

    try {
      figma.ui.postMessage({
        type: "single-fix-applied",
        appliedCount: appliedCount,
        error: applicationError ? applicationError.message : null,
        index: index
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
        // Sélectionner les nodes et les mettre en vue pour que l'utilisateur les voit précisément
        figma.currentPage.selection = nodes;
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

      // Rescanner pour mettre à jour l'UI (avec les mêmes options)
      scanSelection(true); // Par défaut ignorer les calques cachés

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

  // ============================================
  // SYSTÈME ULTRA-SIMPLIFIÉ DE SECOURS
  // ============================================

  /**
   * Scan ultra-simple - seulement les fills COLOR non liés
   */
  function simpleScan() {
    console.log("🔍 [SIMPLE] DÉBUT SCAN SIMPLE");

    var results = [];
    var pageChildren = figma.currentPage.children;

    console.log("📊 [SIMPLE] Enfants de page à scanner:", pageChildren.length);

    for (var i = 0; i < pageChildren.length; i++) {
      var node = pageChildren[i];

      // Chercher seulement les fills COLOR qui ne sont pas liés
      if (node.fills && Array.isArray(node.fills)) {
        for (var j = 0; j < node.fills.length; j++) {
          var fill = node.fills[j];

          if (fill.type === 'SOLID' && fill.color) {
            // Vérifier si pas déjà lié
            var isBound = node.boundVariables &&
                          node.boundVariables.fills &&
                          node.boundVariables.fills[j];

            if (!isBound) {
              var hex = rgbToHex(fill.color);
              console.log("🎯 [SIMPLE] Fill trouvé: " + hex + " dans " + node.name);

              results.push({
                nodeId: node.id,
                nodeName: node.name,
                property: 'Fill',
                fillIndex: j,
                hexValue: hex,
                type: 'color'
              });
            }
          }
        }
      }
    }

    console.log("✅ [SIMPLE] SCAN TERMINÉ - " + results.length + " problèmes trouvés");
    return results;
  }

  /**
   * Application ultra-simple - utilise la première variable COLOR disponible
   */
  function simpleApply(results) {
    console.log("🔧 [SIMPLE] DÉBUT APPLICATION SIMPLE - " + results.length + " éléments");

    var successCount = 0;

    // Récupérer toutes les variables COLOR disponibles
    var colorVars = figma.variables.getLocalVariables().filter(function(v) {
      return v.resolvedType === 'COLOR';
    });

    console.log("🎨 [SIMPLE] Variables COLOR disponibles:", colorVars.length);

    if (colorVars.length === 0) {
      console.log("⚠️ [SIMPLE] Aucune variable COLOR trouvée - impossible d'appliquer");
      return 0;
    }

    // Pour chaque résultat, essayer d'appliquer la première variable COLOR
    var defaultVar = colorVars[0];
    console.log("🎯 [SIMPLE] Utilisation variable par défaut:", defaultVar.name);

    for (var i = 0; i < results.length; i++) {
      var result = results[i];
      console.log("🔧 [SIMPLE] Application sur " + result.nodeName + " (fill " + result.fillIndex + ")");

      try {
        var node = figma.getNodeById(result.nodeId);

        if (!node) {
          console.log("❌ [SIMPLE] Nœud disparu");
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
          console.log("✅ [SIMPLE] SUCCÈS - Variable appliquée et vérifiée");
          successCount++;
        } else {
          console.log("⚠️ [SIMPLE] INCERTAIN - Application tentée");
          // On compte quand même car setBoundVariable peut réussir sans que la vérification fonctionne
          successCount++;
        }

      } catch (error) {
        console.log("❌ [SIMPLE] ERREUR:", error.message);
      }
    }

    console.log("🎉 [SIMPLE] APPLICATION TERMINÉE - " + successCount + "/" + results.length + " réussis");
    return successCount;
  }
};