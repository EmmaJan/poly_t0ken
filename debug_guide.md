# 🔧 Guide de débogage - Bouton "Générer les tokens"

## Problème identifié
Le bouton fonctionne maintenant, mais la génération de tokens produit un tableau vide.

## Étapes de débogage

### 1. Ouvrir la console du plugin Figma
1. Dans Figma, allez dans `Plugins` → `Development` → `Open console`

### 2. Tester la génération
1. Cliquez sur le bouton "Générer les Tokens"
2. Regardez les logs dans la console

### 3. Identifier le problème
Vous devriez voir des logs comme :
```
🔄 Generate tokens request received: {type: "generate", color: "#007ACC", naming: "custom"}
📝 Resolved naming: "custom" -> "custom"
🎨 Generating brand colors...
🔍 generateBrandColors called with: #007ACC custom
🔍 hexToHsl result: {h: 210, s: 100, l: 50}
🔍 palette5 generated: {subtle: "#...", light: "#...", base: "#007ACC", hover: "#...", dark: "#..."}
🔍 generateBrandColors returning: {subtle: "#...", light: "#...", ...}
✅ Brand tokens generated: 5 tokens
```

### 4. Fonctions à vérifier
Si une fonction ne retourne rien, vous verrez :
- `❌ [functionName] returned undefined!`
- `❌ [functionName] returned null!`
- `⚠️ [functionName] returned empty object!`

### 5. Test alternatif
Ouvrez le fichier `test_token_generation_detailed.html` dans votre navigateur pour tester chaque fonction individuellement.

## Solutions possibles

### Si `generateBrandColors` échoue :
- Problème avec les conversions de couleur (`hexToHsl`, `hslToHex`)
- Vérifiez que `hexToRgb` retourne `{r: 0, g: 122, b: 204}` pour `#007ACC`

### Si d'autres fonctions échouent :
- Vérifiez que la fonction existe et est appelée correctement
- Regardez les paramètres passés (naming doit être "custom", "shadcn", etc.)

### Si tout semble fonctionner mais tableau vide :
- Problème dans l'assemblage final des tokens
- Vérifiez que `cachedTokens` est bien défini

## Logs attendus pour un succès
```
🔄 Generate tokens request received: {...}
📝 Resolved naming: "custom" -> "custom"
🎨 Generating brand colors...
🔍 generateBrandColors called with: #007ACC custom
✅ Brand tokens generated: 5 tokens
🎨 Generating system colors...
🔍 generateSystemColors called with: custom
✅ System tokens generated: 12 tokens
🎨 Generating grayscale...
✅ Gray tokens generated: 12 tokens
🎨 Generating spacing...
✅ Spacing tokens generated: 7 tokens
🎨 Generating radius...
✅ Radius tokens generated: 4 tokens
🎨 Generating typography...
✅ Typography tokens generated: 6 tokens
🎨 Generating border...
✅ Border tokens generated: 3 tokens
💾 Tokens cached successfully
📤 Sending tokens-generated message to UI
✅ Message sent successfully
```

## Prochaine étape
Une fois que vous avez identifié quelle fonction pose problème, dites-moi :
1. Quelle fonction échoue ?
2. Quel message d'erreur voyez-vous ?
3. Quels sont les paramètres passés à la fonction ?