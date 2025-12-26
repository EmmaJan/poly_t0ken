// Conversion RGB vers LAB (espace colorimétrique perceptuel)
function rgbToLab(r, g, b) {
    r = r / 255;
    g = g / 255;
    b = b / 255;
    r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
    g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
    b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;
    var x = r * 0.4124564 + g * 0.3575761 + b * 0.1804375;
    var y = r * 0.2126729 + g * 0.7151522 + b * 0.0721750;
    var z = r * 0.0193339 + g * 0.1191920 + b * 0.9503041;
    x = x / 0.95047;
    y = y / 1.00000;
    z = z / 1.08883;
    x = x > 0.008856 ? Math.pow(x, 1 / 3) : (7.787 * x + 16 / 116);
    y = y > 0.008856 ? Math.pow(y, 1 / 3) : (7.787 * y + 16 / 116);
    z = z > 0.008856 ? Math.pow(z, 1 / 3) : (7.787 * z + 16 / 116);
    return {
        L: (116 * y) - 16,
        a: 500 * (x - y),
        b: 200 * (y - z)
    };
}

// Distance perceptuelle entre deux couleurs (Delta E CIE76)
function getPerceptualColorDistance(hex1, hex2) {
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
    var lab1 = rgbToLab(rgb1.r, rgb1.g, rgb1.b);
    var lab2 = rgbToLab(rgb2.r, rgb2.g, rgb2.b);
    var dL = lab1.L - lab2.L;
    var da = lab1.a - lab2.a;
    var db = lab1.b - lab2.b;
    return Math.sqrt(dL * dL + da * da + db * db);
}
