// Test de la tolérance des couleurs
console.log("=== Test de la tolérance des couleurs ===");

// Test de la fonction getColorDistance
console.log("Test de distance entre couleurs similaires:");
var distance1 = getColorDistance("#FF0000", "#FF0000"); // Exact match
console.log("Rouge exact:", distance1, "(devrait être 0)");

var distance2 = getColorDistance("#FF0000", "#FE0000"); // Très proche
console.log("Rouge très proche:", distance2, "(devrait être petit)");

var distance3 = getColorDistance("#FF0000", "#00FF00"); // Complètement différent
console.log("Rouge vs Vert:", distance3, "(devrait être grand)");

// Test de rgbToHex avec précision
console.log("\nTest de précision rgbToHex:");
var testRgb = { r: 0.2, g: 0.5019607843137255, b: 0.8 }; // Valeurs avec précision flottante
var hex1 = rgbToHex(testRgb);
var hex2 = rgbToHex(testRgb); // Même valeur, devrait donner le même hex
console.log("RGB:", testRgb);
console.log("Hex 1:", hex1);
console.log("Hex 2:", hex2);
console.log("Consistent:", hex1 === hex2);

// Test avec valeur légèrement différente (test de tolérance)
var testRgb2 = { r: 0.2001, g: 0.502, b: 0.8001 };
var hex3 = rgbToHex(testRgb2);
console.log("RGB similaire:", testRgb2);
console.log("Hex similaire:", hex3);
var distanceSimilar = getColorDistance(hex1, hex3);
console.log("Distance entre similaires:", distanceSimilar);

console.log("\n=== Fin du test ===");