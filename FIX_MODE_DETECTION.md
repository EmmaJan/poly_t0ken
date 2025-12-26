# FIX: Mode Detection - bg/inverse Suggestions

## 🔴 PROBLÈME IDENTIFIÉ

### Symptôme
`bg/inverse` n'apparaît jamais dans les suggestions FILL, même avec un match exact.

### Cause Racine
**Détection de mode incorrecte** dans `detectFrameMode` (ligne 5085)

L'ancienne logique utilisait la **luminance du backgroundColor** pour deviner le mode :
```javascript
// AVANT (INCORRECT)
var luminance = getLuminance(backgroundColor);
var detectedMode = luminance < 0.5 ? 'dark' : 'light';
```

**Problème :**
- Frame Figma en mode **Light** avec `explicitVariableModes = { collectionId: '1:16' }`
- Background de la frame : `#030712` (noir, luminance 0.002)
- **Détection :** "C'est sombre donc c'est Dark" ❌ **FAUX !**

### Impact
1. Le scan détecte le mode comme **Dark** au lieu de **Light**
2. Cherche `bg/inverse` avec la valeur du mode Dark (`#F9FAFB`)
3. La couleur hardcodée est `#030712` (valeur du mode Light)
4. **Pas de match** → bg/inverse n'est jamais suggéré

## ✅ SOLUTION IMPLÉMENTÉE

### Nouvelle Logique (Priorité)

**PRIORITÉ 1 : Utiliser `explicitVariableModes`** (source de vérité Figma)
```javascript
if (node.explicitVariableModes) {
  var collectionIds = Object.keys(node.explicitVariableModes);
  var modeId = node.explicitVariableModes[firstCollectionId];
  
  // Récupérer le nom du mode depuis la collection
  var collection = figma.variables.getVariableCollectionById(firstCollectionId);
  var mode = collection.modes.find(m => m.modeId === modeId);
  
  // Détecter light/dark depuis le nom du mode
  var isLight = modeName.indexOf('light') !== -1 || modeName.indexOf('clair') !== -1;
  var isDark = modeName.indexOf('dark') !== -1 || modeName.indexOf('sombre') !== -1;
  
  return isLight ? 'light' : 'dark';
}
```

**PRIORITÉ 2 : Fallback sur luminance** (si pas de mode explicite)
```javascript
// Ancien comportement conservé pour compatibilité
var luminance = getLuminance(backgroundColor);
return luminance < 0.5 ? 'dark' : 'light';
```

### Logs de Debug

**Avant (luminance) :**
```
🌓 [MODE_DETECTION] Using luminance fallback: {
  nodeName: 'Sidebar',
  backgroundColor: {r: 0.01, g: 0.03, b: 0.07},
  luminance: '0.002',
  detectedMode: 'dark',  ← FAUX!
  source: 'luminance_fallback'
}
```

**Après (explicitVariableModes) :**
```
🌓 [MODE_DETECTION] Using explicit Figma mode: {
  nodeName: 'Sidebar',
  collectionId: '1:15',
  modeId: '1:16',
  modeName: 'Light',
  detectedMode: 'light',  ← CORRECT!
  source: 'explicitVariableModes'
}
```

## 📊 RÉSULTAT ATTENDU

### Avant le Fix
```
Frame en mode Light (explicitVariableModes)
  └─ Background: #030712 (noir)
  └─ Détection: Dark (luminance 0.002) ❌
  └─ Recherche: bg/inverse en mode Dark (#F9FAFB)
  └─ Couleur hardcodée: #030712
  └─ Résultat: PAS DE MATCH
```

### Après le Fix
```
Frame en mode Light (explicitVariableModes)
  └─ Background: #030712 (noir)
  └─ Détection: Light (explicitVariableModes) ✅
  └─ Recherche: bg/inverse en mode Light (#030712)
  └─ Couleur hardcodée: #030712
  └─ Résultat: MATCH EXACT ✅
```

## 🎯 VALEURS DE bg/inverse

Pour référence :
- **Mode Light (`1:16`)** : `#030712` (noir)
- **Mode Dark (`1:17`)** : `#F9FAFB` (blanc)

## 🔧 FICHIERS MODIFIÉS

- **code.js** (ligne 5079-5199) : `detectFrameMode` refactorisé
  - +57 lignes (logique explicitVariableModes)
  - Fallback conservé pour compatibilité

## 🧪 TESTS À EFFECTUER

1. ✅ Frame en mode Light avec fond noir → Doit détecter Light
2. ✅ Frame en mode Dark avec fond blanc → Doit détecter Dark
3. ✅ Frame sans mode explicite → Doit utiliser luminance (fallback)
4. ✅ bg/inverse cassé en mode Light → Doit suggérer bg/inverse

## 📝 NOTES

- La détection par luminance est conservée comme **fallback** pour les frames sans `explicitVariableModes`
- Les noms de mode supportés : "Light", "Dark", "Clair", "Sombre" (case-insensitive)
- Si le nom du mode ne contient ni "light" ni "dark", le fallback luminance est utilisé

**Recharge le plugin et teste !** bg/inverse devrait maintenant apparaître dans les suggestions. 🎯
