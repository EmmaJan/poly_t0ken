# 🔧 CORRECTIONS URGENTES - Problèmes UI et Status

## 🔴 Problèmes Identifiés

### 1. **[Object Object] dans l'UI** ✅ CORRIGÉ
**Ligne** : 1694-1697
**Problème** : `aliasTo = modeData.aliasRef;` stocke un objet, pas une string
**Solution** : Convertir l'objet en string `category.key`

**Code corrigé** (déjà appliqué) :
```javascript
// ✅ FIX: Convertir aliasRef (objet) en string lisible
var aliasRefObj = modeData.aliasRef;
if (aliasRefObj && aliasRefObj.category && aliasRefObj.key) {
  aliasTo = aliasRefObj.category + '.' + aliasRefObj.key;
} else {
  aliasTo = null;
}
```

---

### 2. **Status tokens avec #000000** ⏳ À CORRIGER MANUELLEMENT
**Ligne** : 1111-1112
**Problème** : Le mapping cherche `statusType` comme clé, mais :
- Pour MUI : la clé est `'main'` (objet `{main: '#4caf50', ...}`)
- Pour Tailwind : la clé est `statusType` directement (string `'#22c55e'`)

**Code ACTUEL** :
```javascript
// ✅ FIX: Utiliser la catégorie correcte (success/warning/error/info) au lieu de 'system'
return { category: statusType, light: statusType, dark: statusType, type: 'COLOR' };
```

**Code À APPLIQUER** :
```javascript
// ✅ FIX: Pour MUI, utiliser 'main', pour les autres, utiliser la clé directe (statusType)
var statusKey = (preset.name === 'mui') ? 'main' : statusType;
return { category: statusType, light: statusKey, dark: statusKey, type: 'COLOR' };
```

**Comment appliquer** :
1. Ouvrir `code.js`
2. Aller à la ligne 1111
3. Remplacer les 2 lignes par les 3 lignes ci-dessus

---

### 3. **Border disparaît** ✅ DEVRAIT ÊTRE CORRIGÉ
**Cause** : Lié au problème #1 ([Object Object])
**Solution** : Une fois le problème #1 corrigé, border devrait réapparaître

---

## 📊 Résumé des Corrections

| Problème | Statut | Action |
|----------|--------|--------|
| [Object Object] dans UI | ✅ Corrigé | Déjà appliqué automatiquement |
| Status #000000 | ⏳ Manuel | Appliquer le code ci-dessus ligne 1111 |
| Border disparaît | ✅ Auto | Devrait être résolu après #1 |

---

## 🧪 Tests Après Correction

1. **Regénérer les tokens**
   - Ouvrir Figma
   - Lancer le plugin
   - Générer des tokens Tailwind
   
2. **Vérifier l'UI**
   - ✅ Plus de `[Object Object]` dans les primitives
   - ✅ Border visible dans la liste
   - ✅ Alias affichés comme `gray.50`, `brand.500`, etc.

3. **Vérifier les status**
   - ✅ `status.success` devrait avoir une couleur verte (pas #000000)
   - ✅ `status.warning` devrait avoir une couleur orange (pas #000000)
   - ✅ `status.error` devrait avoir une couleur rouge (pas #000000)
   - ✅ `status.info` devrait avoir une couleur bleue (pas #000000)

4. **Vérifier dans Figma**
   - Ouvrir la collection "Semantic"
   - Vérifier que `success/default` pointe vers `success` (primitive)
   - Vérifier que `warning/default` pointe vers `warning` (primitive)

---

## 🔍 Logs Attendus Après Correction

**Avant** :
```
⚠️ [RAW_FALLBACK] status.success (light) -> #000000
⚠️ [RAW_FALLBACK] status.warning (light) -> #000000
```

**Après** :
```
✅ [ALIAS_SUCCESS] status.success (light) -> success.main (ou success.success)
✅ [ALIAS_SUCCESS] status.warning (light) -> warning.main (ou warning.warning)
```

---

## 📝 Notes Importantes

### Pourquoi statusType comme clé pour Tailwind ?

Pour Tailwind, les primitives sont créées comme :
```javascript
tokens.success = '#22c55e';  // String directe
tokens.warning = '#f59e0b';
```

Donc la palette ressemble à :
```javascript
{
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6'
}
```

Le mapping doit chercher `success` dans `palettes.success`, donc la clé est `statusType` (='success').

### Pourquoi 'main' pour MUI ?

Pour MUI, les primitives sont créées comme :
```javascript
tokens.success = { 
  main: '#4caf50', 
  light: '#81c784', 
  dark: '#388e3c', 
  contrastText: '#ffffff' 
};
```

Donc la palette ressemble à :
```javascript
{
  success: {
    main: '#4caf50',
    light: '#81c784',
    dark: '#388e3c'
  }
}
```

Le mapping doit chercher `main` dans `palettes.success`, donc la clé est `'main'`.

---

## 🚀 Prochaines Étapes

1. **Appliquer la correction manuelle** (ligne 1111)
2. **Tester la génération**
3. **Vérifier que tout fonctionne**
4. **Si OK, copier vers code.prod.js**

Bonne chance ! 🎯
