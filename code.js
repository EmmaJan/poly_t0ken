console.log("🔥 Token Starter Plugin Loaded");

figma.showUI(__html__, { width: 700, height: 820, themeColors: true });

// Check if variables exist and notify UI
var existingCollections = figma.variables.getLocalVariableCollections();
if (existingCollections.length > 0) {
  figma.ui.postMessage({ type: "has-variables", value: true });
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
  var to255 = function (x) { return Math.round(x * 255); };
  var n = (to255(c.r) << 16) | (to255(c.g) << 8) | to255(c.b);
  return "#" + n.toString(16).padStart(6, "0").toUpperCase();
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

  if (!naming || naming === "tailwind" || naming === "chakra" || naming === "custom") {
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
    "white": "#FFFFFF",
  };

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

  return base;
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

    if (naming === "mui") {
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
  if (naming === "mui") {
    return { "1": "8px", "2": "16px", "3": "24px", "4": "32px", "5": "40px" };
  }
  if (naming === "bootstrap") {
    return { "1": "0.25rem", "2": "0.5rem", "3": "1rem", "4": "1.5rem", "5": "3rem" };
  }
  return { "1": "4px", "2": "8px", "3": "12px", "4": "16px", "5": "20px", "6": "24px", "8": "32px" };
}

function generateRadius(naming) {
  if (naming === "mui") {
    return { "xs": "4px", "sm": "8px", "md": "12px", "lg": "16px", "xl": "20px" };
  }
  if (naming === "bootstrap") {
    return { "sm": "0.25rem", "default": "0.375rem", "lg": "0.5rem", "pill": "50rem" };
  }
  return { "sm": "2", "md": "4", "lg": "8", "xl": "12", "2xl": "16", "full": "9999" };
}

function generateTypography(naming) {
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

// ============================================
// DARK MODE UTILITIES
// ============================================

function getDarkHex(hex, type, tokenName) {
  var hsl = hexToHsl(hex);

  if (type === "gray") {
    // For grays: Simple inversion works well
    // White (#FFFFFF, L=100) → Black (#000000, L=0)
    // Light gray (L=90) → Dark gray (L=10)
    var newL = 100 - hsl.l;
    return hslToHex(hsl.h, hsl.s, newL);
  }

  if (type === "brand" || type === "system") {
    // Check if token name contains a numeric scale (50, 100, 200, ... 900)
    var numericMatch = tokenName.match(/(\d+)/);

    if (numericMatch) {
      // Numeric scale detected (e.g., primary-100, primary-500, etc.)
      var scaleValue = parseInt(numericMatch[1]);

      // Invert the scale: 50→900, 100→800, 200→700, etc.
      // This ensures backgrounds and text colors swap appropriately
      var invertedScale = 1000 - scaleValue;

      // Map the inverted scale to a new lightness
      // Scale 50 (L~95) → Scale 900 (L~10)
      // Scale 500 (L~50) → Scale 500 (L~50) - middle stays similar
      // Scale 900 (L~10) → Scale 50 (L~95)

      var newL;
      if (invertedScale <= 100) {
        newL = 95 - (invertedScale / 100) * 5; // 50→95, 100→90
      } else if (invertedScale <= 500) {
        newL = 90 - ((invertedScale - 100) / 400) * 40; // 100→90, 500→50
      } else {
        newL = 50 - ((invertedScale - 500) / 400) * 40; // 500→50, 900→10
      }

      // For dark mode, often we want slightly more saturation for vibrancy
      var newS = Math.min(100, hsl.s * 1.1);

      return hslToHex(hsl.h, newS, newL);
    } else {
      // Semantic color without numeric scale (e.g., "success", "error")
      // Keep hue, increase lightness slightly for visibility on dark bg
      // Typically: L=40-50 in light → L=55-65 in dark
      var newL = Math.min(75, hsl.l + 15);
      var newS = Math.min(100, hsl.s * 1.15); // Slightly more saturated

      return hslToHex(hsl.h, newS, newL);
    }
  }

  return hex;
}

function ensureModes(collection, withDarkMode) {
  // Rename default mode to "Light" if it exists
  if (collection.modes.length > 0) {
    var defaultModeId = collection.modes[0].modeId;
    // We can't easily check name "Mode 1" reliably across locales, but usually 1st is default.
    // Let's just update the first mode to "Light"
    try {
      collection.renameMode(defaultModeId, "Light");
    } catch (e) { }
  }

  var lightModeId = collection.modes[0].modeId;
  var darkModeId = null;

  if (withDarkMode) {
    // Check if "Dark" mode exists
    var existingDark = collection.modes.find(function (m) { return m.name === "Dark"; });
    if (existingDark) {
      darkModeId = existingDark.modeId;
    } else {
      darkModeId = collection.addMode("Dark");
    }
  }

  return { light: lightModeId, dark: darkModeId };
}

function createOrUpdateVariable(collection, modes, name, type, value, category, overwrite, withDarkMode) {
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

  // 3. Update Values
  if (variable) {
    // Light Mode (Always set)
    // If overwrite is FALSE and variable existed, we technically shouldn't touch it?
    // But the user clicked "Import", maybe they want to sync?
    // Let's stick to the previous logic: "Unchecked = Merge/Update".
    variable.setValueForMode(modes.light, value);

    // Dark Mode
    if (withDarkMode && modes.dark) {
      // Calculate Dark Value
      // Only for Colors
      if (type === "COLOR") {
        var darkValue = getDarkHex(rgbToHex(value), category, name);
        variable.setValueForMode(modes.dark, hexToRgb(darkValue));
      } else {
        // For Float/String, usually same value (Spacing, Radius...)
        variable.setValueForMode(modes.dark, value);
      }
    }

    applyScopesForCategory(variable, category);
  }

  return variable;
}

function importTokensToFigma(tokens, naming, overwrite, withDarkMode) {
  // Brand Colors
  if (tokens.brand) {
    var brandCollection = getOrCreateCollection("Brand Colors", overwrite);
    var modes = ensureModes(brandCollection, withDarkMode);

    for (var key in tokens.brand) {
      if (!tokens.brand.hasOwnProperty(key)) continue;

      var varName = "";
      if (naming === "mui") varName = "primary/" + key;
      else if (naming === "ant") varName = "primary-" + key;
      else if (naming === "bootstrap") varName = key;
      else varName = "primary-" + key;

      createOrUpdateVariable(brandCollection, modes, varName, "COLOR", hexToRgb(tokens.brand[key]), "brand", overwrite, withDarkMode);
    }
  }

  // System Colors
  if (tokens.system) {
    var systemCollection = getOrCreateCollection("System Colors", overwrite);
    var modes = ensureModes(systemCollection, withDarkMode);

    for (var sKey in tokens.system) {
      if (!tokens.system.hasOwnProperty(sKey)) continue;
      createOrUpdateVariable(systemCollection, modes, sKey, "COLOR", hexToRgb(tokens.system[sKey]), "system", overwrite, withDarkMode);
    }
  }

  // Grayscale
  if (tokens.gray) {
    var grayCollection = getOrCreateCollection("Grayscale", overwrite);
    var modes = ensureModes(grayCollection, withDarkMode);

    for (var gKey in tokens.gray) {
      if (!tokens.gray.hasOwnProperty(gKey)) continue;

      var grayName = "";
      if (naming === "mui") grayName = "grey-" + gKey;
      else if (naming === "ant") grayName = "gray-" + gKey;
      else grayName = "gray-" + gKey;

      createOrUpdateVariable(grayCollection, modes, grayName, "COLOR", hexToRgb(tokens.gray[gKey]), "gray", overwrite, withDarkMode);
    }
  }

  // Spacing
  if (tokens.spacing) {
    var spacingCollection = getOrCreateCollection("Spacing", overwrite);
    var modes = ensureModes(spacingCollection, false); // No dark mode for spacing usually

    for (var spKey in tokens.spacing) {
      if (!tokens.spacing.hasOwnProperty(spKey)) continue;

      var cleanKey = spKey.replace(/\./g, "-");
      var valueStr = tokens.spacing[spKey];
      var value = parseFloat(valueStr);

      if (valueStr.indexOf("rem") !== -1) {
        value = value * 16;
      }

      createOrUpdateVariable(spacingCollection, modes, "spacing-" + cleanKey, "FLOAT", value, "spacing", overwrite, false);
    }
  }

  // Radius
  if (tokens.radius) {
    var radiusCollection = getOrCreateCollection("Radius", overwrite);
    var modes = ensureModes(radiusCollection, false);

    for (var rKey in tokens.radius) {
      if (!tokens.radius.hasOwnProperty(rKey)) continue;

      var cleanRKey = rKey.replace(/\./g, "-");
      var rValueStr = tokens.radius[rKey];
      var rValue = parseFloat(rValueStr);

      if (rValueStr.indexOf("rem") !== -1) {
        rValue = rValue * 16;
      }

      createOrUpdateVariable(radiusCollection, modes, "radius-" + cleanRKey, "FLOAT", rValue, "radius", overwrite, false);
    }
  }

  // Typography
  if (tokens.typography) {
    var typoCollection = getOrCreateCollection("Typography", overwrite);
    var modes = ensureModes(typoCollection, false);

    for (var tKey in tokens.typography) {
      if (!tokens.typography.hasOwnProperty(tKey)) continue;

      var cleanTKey = tKey.replace(/\./g, "-");
      createOrUpdateVariable(typoCollection, modes, "typo-" + cleanTKey, "STRING", tokens.typography[tKey], "typography", overwrite, false);
    }
  }

  // Border
  if (tokens.border) {
    var borderCollection = getOrCreateCollection("Border", overwrite);
    var modes = ensureModes(borderCollection, false);

    for (var bKey in tokens.border) {
      if (!tokens.border.hasOwnProperty(bKey)) continue;

      var cleanBKey = bKey.replace(/\./g, "-");
      var bValue = parseFloat(tokens.border[bKey]);
      createOrUpdateVariable(borderCollection, modes, "border-" + cleanBKey, "FLOAT", bValue, "border", overwrite, false);
    }
  }

  figma.notify("✅ All tokens imported successfully!");
}

// ============================================
// MESSAGE HANDLER
// ============================================

var cachedTokens = null;

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
      importTokensToFigma(tokensToImport, msg.naming || "custom", msg.overwrite, msg.withDarkMode);
    } else {
      figma.notify("⚠️ Generate tokens first!");
    }
  }

  // ⭐ Nouveau : import direct depuis un fichier JSON / CSS
  if (msg.type === "import-from-file") {
    var namingFromFile = msg.naming || "custom";
    var tokensFromFile = msg.tokens;

    if (!tokensFromFile) {
      figma.notify("⚠️ Aucun token reçu depuis le fichier");
      return;
    }

    try {
      // Note: import-from-file message doesn't have withDarkMode/overwrite flags usually unless we update UI to send them.
      // But the UI now uses "import" type for everything after preview, so this block might be redundant or for direct drag-drop?
      // Let's keep it safe but default to false.
      importTokensToFigma(tokensFromFile, namingFromFile, false, false);
      figma.notify("✅ Tokens importés depuis le fichier");
    } catch (e) {
      console.error(e);
      figma.notify("❌ Erreur lors de l'import depuis le fichier");
    }
  }
};
