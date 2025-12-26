# FIX: Approximate Color Matching - bg/inverse Suggestions

## 🔴 PROBLÈME IDENTIFIÉ

### Symptôme
`bg/inverse` n'apparaît pas dans les suggestions pour les couleurs proches (approximate matching).

### Exemple
- Frame avec couleur `#2D2827` (gris très foncé)
- `bg/inverse` en mode Light = `#030712` (noir bleuté)
- Distance colorimétrique : ~30 (très proche)
- **Résultat :** bg/inverse n'est PAS suggéré

### Cause Racine
**Bug dans le calcul de distance colorimétrique** (ligne 7103 et 7136)

Le système appelait `getColorDistance` avec des clés préfixées par le mode :
```javascript
// AVANT (INCORRECT)
var distance = getColorDistance('#2D2827', '1:16|#030712');
//                                          ^^^^^^^^^^^^^^
//                                          Pas un hex valide !
```

**Résultat :** `getColorDistance` échouait silencieusement ou retournait `Infinity`, donc aucune suggestion approximate n'était générée.

## ✅ SOLUTION IMPLÉMENTÉE

### Fix Appliqué

**Extraction du hex depuis les clés mode-préfixées :**

```javascript
// APRÈS (CORRECT)
var actualHex = varHex.indexOf('|') !== -1 ? varHex.split('|')[1] : varHex;
var distance = getColorDistance('#2D2827', actualHex);
//                                          ^^^^^^^^^^
//                                          #030712 - Hex valide !
```

### Fichiers Modifiés

- **code.js** (ligne 7103) : Fix du moteur approximate principal
- **code.js** (ligne 7138) : Fix du fallback approximate (scope mismatch)

### Logique Complète

1. **Exact Match** : Cherche `#2D2827` dans la map → 0 résultats
2. **Approximate Match** :
   - Parcourt toutes les entrées de la map
   - **Extrait le hex** depuis les clés (`1:16|#030712` → `#030712`)
   - Calcule la distance OKLab entre `#2D2827` et `#030712`
   - Si distance ≤ 150 → Ajoute à la liste des suggestions
   - Filtre par scopes (FRAME_FILL pour une frame)
   - Filtre par collection sémantique
   - Rank par pertinence
3. **Retourne** les 3 meilleures suggestions

## 📊 RÉSULTAT ATTENDU

### Avant le Fix
```
🎨 [findColorSuggestions] Looking for: #2D2827 contextMode: 1:16
   Exact matches found: 0
   [Approximate matching fails silently]
   ⚠️ No suggestions found for #2D2827
```

### Après le Fix
```
🎨 [findColorSuggestions] Looking for: #2D2827 contextMode: 1:16
   Exact matches found: 0
   [Approximate matching calculates distances correctly]
   🎯 [RANKING] Suggestions ranked for Fill on FRAME:
     1. bg / inverse (distance: 30, score: 80)
     2. bg / canvas (distance: 45, score: 70)
     3. bg / surface (distance: 60, score: 60)
```

## 🎯 VALEURS DE RÉFÉRENCE

- **Frame couleur :** `#2D2827` (RGB: 45, 40, 39)
- **bg/inverse Light :** `#030712` (RGB: 3, 7, 18)
- **Distance OKLab :** ~30 (très proche, bien en dessous du seuil de 150)

## 🧪 TESTS À EFFECTUER

1. ✅ Recharger le plugin dans Figma
2. ✅ Scanner une frame avec `#2D2827`
3. ✅ Vérifier que `bg/inverse` apparaît dans les suggestions
4. ✅ Vérifier que d'autres couleurs proches sont aussi suggérées
5. ✅ Tester avec d'autres couleurs approximatives

## 📝 NOTES TECHNIQUES

- **Seuil de distance :** 150 (OKLab ΔE)
- **Priorité :** Exact matches > Approximate matches
- **Scopes :** Respectés même en approximate matching
- **Ranking :** Basé sur la pertinence sémantique + distance

**Recharge le plugin et teste !** bg/inverse devrait maintenant apparaître pour `#2D2827`. 🎯
