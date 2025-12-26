# FIX: Mode Detection Bug - bg/inverse

## Cause Racine

Le système cherchait `#030712` avec `contextMode: 1:17` (Dark) au lieu de `1:16` (Light).

**Pourquoi ?**
1. `detectFrameMode()` retournait un nom ('light'/'dark') basé sur la luminance
2. Fond noir (`#030712`) → luminance < 0.5 → détecté comme "dark"
3. `getModeIdByName()` convertissait 'dark' → `1:17`
4. Le système cherchait alors `1:17|#030712` dans la map
5. Dans Dark, `bg/inverse` = `#F9FAFB` (blanc), PAS `#030712`
6. Donc `bg/inverse` n'était PAS dans les exact matches
7. Le système trouvait `bg/canvas` à la place (qui a `#030712` en Dark)

## Solution Implémentée

**Nouvelle fonction `detectNodeModeId()`** qui retourne directement le `modeId` au lieu du nom.

### Priorités :
1. **Mode explicite du node** : `node.explicitVariableModes`
2. **Mode explicite du parent** : héritage récursif
3. **Mode Light par défaut** : de la collection Semantic

### Avantages :
- ✅ Pas de conversion nom → ID (source de bugs)
- ✅ Respecte le mode explicite défini dans Figma
- ✅ Hérite du parent si le node n'a pas de mode explicite
- ✅ Fallback intelligent sur Light (pas sur luminance)

## Fichiers Modifiés

### `/Users/polyconseil/Desktop/emma-plugin-dev/code.js`

**Ajouté :**
- `detectNodeModeId()` (ligne ~5079)

**Modifié :**
- `checkFillsSafely()` - scan parent (ligne ~8126)
- `checkFillsSafely()` - scan children (ligne ~8232)

## Tests

### Test 1 : Frame avec mode Light explicite
1. Créer une frame avec fill `#030712` (noir)
2. Définir le mode à "Light" (pas Auto)
3. Lancer le scan
4. **Attendu :** `bg/inverse` suggéré (car `bg/inverse` Light = `#030712`)

### Test 2 : Frame en mode Auto
1. Créer une frame avec fill `#030712` (noir)
2. Laisser le mode en "Auto"
3. Lancer le scan
4. **Attendu :** Le système hérite du parent ou utilise Light par défaut

### Test 3 : Enfants héritent du parent
1. Frame parent en mode "Light"
2. Enfants sans mode explicite
3. Lancer le scan
4. **Attendu :** Tous les enfants utilisent le mode Light du parent

## Logs de Debug

Chercher dans la console :
```
🔍 [DEBUG] Detected modeId for parent: 1:16 node: Sidebar
🔍 [DEBUG] Detected modeId for children: 1:16 node: Sidebar
```

Si tu vois `1:17` au lieu de `1:16`, le mode est toujours mal détecté.

## Points de Vigilance

1. **Recharger le plugin** après modification
2. **Vérifier le mode de la frame** dans Figma (pas Auto)
3. **Vérifier les logs** pour confirmer le bon modeId
4. **Tester avec différents modes** (Light, Dark, Auto)
