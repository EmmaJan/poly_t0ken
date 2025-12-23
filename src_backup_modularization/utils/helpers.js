/* eslint-disable no-console */

export function safeStringify(obj, maxLen) {
    maxLen = maxLen || 6000;
    try {
        var str = JSON.stringify(obj, null, 2);
        return str.length > maxLen ? str.substring(0, maxLen) + '... [TRUNCATED]' : str;
    } catch (e) {
        return '[STRINGIFY ERROR: ' + e.message + ']';
    }
}

export function normalizeLibType(naming) {
    if (!naming) return 'tailwind';

    var normalized = naming.toLowerCase().trim();

    // Mapping des variantes vers les types canoniques
    if (normalized === 'shadcn') return 'tailwind';
    if (normalized === 'mui' || normalized === 'material-ui') return 'mui';
    if (normalized === 'ant' || normalized === 'ant-design' || normalized === 'antd') return 'ant';
    if (normalized === 'bootstrap' || normalized === 'bs') return 'bootstrap';
    if (normalized === 'chakra' || normalized === 'chakra-ui') return 'chakra';

    // Par défaut, considérer comme tailwind pour les inconnus
    return 'tailwind';
}

export function isUIFallbackValue(value, tokenType) {
    if (!value) return false;

    var stringValue = typeof value === 'string' ? value : String(value);

    // Valeurs considérées comme des fallbacks UI
    var uiFallbacks = {
        'COLOR': ['#000000', '#ffffff', '#FFFFFF', '#000', '#fff'],
        'FLOAT': ['0', 0]
    };

    var fallbacks = uiFallbacks[tokenType] || [];
    return fallbacks.includes(stringValue) || fallbacks.includes(value);
}

export function rgbToHex(c) {
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

export function hexToRgb(hex) {
    // Si c'est déjà un objet RGB, le retourner tel quel
    if (hex && typeof hex === 'object' && hex.r !== undefined && hex.g !== undefined && hex.b !== undefined) {
        return hex;
    }

    // Sinon, convertir depuis hex string
    if (typeof hex === 'string') {
        hex = hex.replace("#", "");
        if (hex.length === 3) {
            hex = hex.split("").map(function (x) { return x + x; }).join("");
        }
        var num = parseInt(hex, 16);
        if (!isNaN(num)) {
            return {
                r: ((num >> 16) & 255) / 255,
                g: ((num >> 8) & 255) / 255,
                b: (num & 255) / 255
            };
        }
    }

    // Valeur par défaut si format invalide
    return { r: 0, g: 0, b: 0 };
}

export function hexToHsl(hex) {
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

export function hslToHex(h, s, l) {
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
