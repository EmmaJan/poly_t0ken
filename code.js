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
      console.log("Aucun token extrait");
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
  // Brand Colors
  if (tokens.brand) {
    var brandCollection = getOrCreateCollection("Brand Colors", overwrite);

    for (var key in tokens.brand) {
      if (!tokens.brand.hasOwnProperty(key)) continue;

      var varName = "";
      if (naming === "mui") varName = "primary/" + key;
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
      if (naming === "mui") grayName = "grey-" + gKey;
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
      importTokensToFigma(tokensToImport, msg.naming || "custom", msg.overwrite);
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
      importTokensToFigma(tokensFromFile, namingFromFile, false);
      figma.notify("✅ Tokens importés depuis le fichier");
    } catch (e) {
      console.error(e);
      figma.notify("❌ Erreur lors de l'import depuis le fichier");
    }
  }
};
