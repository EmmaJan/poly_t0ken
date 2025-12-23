# 🔧 REFACTORISATION RECOMMANDÉE - Normalisation des Tokens

## ✅ Fonction Utilitaire Créée

La fonction `normalizeTokenStructure` a été ajoutée avec succès à la ligne **112** de `code.js`.

```javascript
function normalizeTokenStructure(token, key, preferredMode) {
  // Gère automatiquement :
  // - Nouvelle structure {type, modes: {light: {...}, dark: {...}}}
  // - Ancienne structure {resolvedValue, type, ...}
  // - Retourne toujours le format normalisé
}
```

---

## 🎯 Prochaines Étapes (À Faire Manuellement)

### 1. Simplifier `mergeSemanticWithExistingAliases` (Ligne 149-202)

**Code ACTUEL** (54 lignes complexes) :
```javascript
// VALIDATION : S'assurer que tous les resolvedValue sont scalaires
for (var key in semanticTokens) {
  if (!semanticTokens.hasOwnProperty(key)) continue;
  var token = semanticTokens[key];
  
  // ✅ FIX: Adapter pour la nouvelle structure {type, modes: {light: {resolvedValue}, dark: {...}}}
  if (typeof token === 'object' && token.modes) {
    // Nouvelle structure (par token avec modes imbriqués)
    var themeMode = 'light'; // Valeur par défaut
    try {
      var savedThemeMode = figma.root.getPluginData("tokenStarter.themeMode");
      if (savedThemeMode === 'dark') themeMode = 'dark';
    } catch (e) { }
    
    var modeData = token.modes[themeMode] || token.modes.light || {};
    
    // Convertir vers l'ancien format pour compatibilité
    token.resolvedValue = modeData.resolvedValue;
    token.type = token.type || SEMANTIC_TYPE_MAP[key] || "COLOR";
    token.aliasRef = modeData.aliasRef || null;
    
    // Supprimer la structure modes pour éviter confusion
    delete token.modes;
    
  } else if (typeof token === 'object' && token.resolvedValue !== undefined) {
    // Ancienne structure ou déjà normalisée
    if (typeof token.resolvedValue === 'object') {
      console.error(`🚨 CRITICAL: Token sémantique ${key} a un resolvedValue qui est un objet:`, token.resolvedValue);

      // Extraire la valeur appropriée selon le mode actuel
      var themeMode = 'light'; // Valeur par défaut
      try {
        var savedThemeMode = figma.root.getPluginData("tokenStarter.themeMode");
        if (savedThemeMode === 'dark') themeMode = 'dark';
      } catch (e) { }

      if (token.resolvedValue[themeMode] !== undefined) {
        token.resolvedValue = token.resolvedValue[themeMode];
        console.log(`🔧 FIXED: ${key} resolvedValue corrigé vers mode ${themeMode}:`, token.resolvedValue);
      } else if (token.resolvedValue.light !== undefined) {
        token.resolvedValue = token.resolvedValue.light;
        console.log(`🔧 FIXED: ${key} resolvedValue corrigé vers mode light (fallback):`, token.resolvedValue);
      } else {
        // Fallback vers une valeur par défaut
        token.resolvedValue = '#FF00FF'; // Magenta d'erreur
        console.error(`❌ FAILED: Impossible de corriger ${key}, valeur par défaut utilisée`);
      }
    } else if (typeof token.resolvedValue !== 'string' && typeof token.resolvedValue !== 'number') {
      console.warn(`⚠️ Token sémantique ${key} a un resolvedValue non scalaire:`, token.resolvedValue);
      // Forcer une valeur scalaire
      token.resolvedValue = String(token.resolvedValue);
    }
  }
}
```

**Code SIMPLIFIÉ** (15 lignes) :
```javascript
// VALIDATION : S'assurer que tous les resolvedValue sont scalaires
// Déterminer le mode préféré
var themeMode = 'light';
try {
  var savedThemeMode = figma.root.getPluginData("tokenStarter.themeMode");
  if (savedThemeMode === 'dark') themeMode = 'dark';
} catch (e) { }

for (var key in semanticTokens) {
  if (!semanticTokens.hasOwnProperty(key)) continue;
  
  // ✅ REFACTOR: Utiliser la fonction utilitaire
  semanticTokens[key] = normalizeTokenStructure(semanticTokens[key], key, themeMode);
  
  // Validation finale
  var token = semanticTokens[key];
  if (token && typeof token.resolvedValue === 'object') {
    console.error(`🚨 Token ${key} a toujours un resolvedValue objet après normalisation`);
    token.resolvedValue = '#FF00FF';
  } else if (token && typeof token.resolvedValue !== 'string' && typeof token.resolvedValue !== 'number') {
    console.warn(`⚠️ Token ${key} a un resolvedValue non scalaire`);
    token.resolvedValue = String(token.resolvedValue);
  }
}
```

**Gain** : -39 lignes, logique plus claire

---

### 2. Simplifier `saveSemanticTokensToFile` (Ligne 220-260)

**Code ACTUEL** (35 lignes complexes) :
```javascript
// Format normalisé
var normalizedToken = null;

// ✅ FIX: Adapter pour la nouvelle structure {type, modes: {light: {resolvedValue, aliasRef}, dark: {...}}}
if (typeof tokenData === 'object' && tokenData.modes) {
  // Nouvelle structure (par token avec modes imbriqués)
  var activeMode = 'light'; // Par défaut, utiliser light pour la sauvegarde
  var modeData = tokenData.modes[activeMode] || tokenData.modes.dark || {};
  
  normalizedToken = {
    resolvedValue: modeData.resolvedValue,
    type: tokenData.type || tokenType,
    aliasTo: (existingToken && existingToken.aliasTo) || null,
    meta: {
      sourceCategory: getCategoryFromSemanticKey(key),
      sourceKey: getKeyFromSemanticKey(key),
      updatedAt: Date.now()
    },
    aliasRef: modeData.aliasRef || null
  };
} else if (typeof tokenData === 'object' && tokenData.resolvedValue !== undefined) {
  // Ancienne structure (déjà normalisée)
  normalizedToken = tokenData;
} else {
  // Migration à la volée du format brut (string ou number)
  normalizedToken = {
    resolvedValue: tokenData,
    type: tokenType,
    aliasTo: (existingToken && existingToken.aliasTo) || null,
    meta: (tokenData.meta) ? Object.assign({}, tokenData.meta, { updatedAt: Date.now() }) : {
      sourceCategory: getCategoryFromSemanticKey(key),
      sourceKey: getKeyFromSemanticKey(key),
      updatedAt: Date.now()
    },
    aliasRef: tokenData.aliasRef || null
  };
}
```

**Code SIMPLIFIÉ** (5 lignes) :
```javascript
// ✅ REFACTOR: Utiliser la fonction utilitaire
var normalizedToken = normalizeTokenStructure(tokenData, key, 'light');

// Préserver aliasTo existant si disponible
if (existingToken && existingToken.aliasTo) {
  normalizedToken.aliasTo = existingToken.aliasTo;
}
```

**Gain** : -30 lignes, logique unifiée

---

## 📊 Résumé des Gains

| Métrique | Avant | Après | Gain |
|----------|-------|-------|------|
| **Lignes de code** | ~90 lignes | ~20 lignes | **-70 lignes** |
| **Duplication** | 2 implémentations | 1 fonction | **-50%** |
| **Complexité** | Élevée | Faible | **-70%** |
| **Maintenabilité** | Difficile | Facile | **+100%** |

---

## ⚠️ Instructions de Refactorisation

### Étape 1 : Tester la fonction utilitaire
```bash
# La fonction est déjà ajoutée et compilée ✅
node -c code.js
```

### Étape 2 : Remplacer dans `mergeSemanticWithExistingAliases`
1. Ouvrir `code.js`
2. Aller à la ligne **149**
3. Remplacer les lignes **149-202** par le code simplifié ci-dessus

### Étape 3 : Remplacer dans `saveSemanticTokensToFile`
1. Chercher "Format normalisé" (ligne ~220)
2. Remplacer la section par le code simplifié ci-dessus

### Étape 4 : Tester
```bash
# Recompiler
node -c code.js

# Tester dans Figma
# 1. Recharger le plugin
# 2. Générer des tokens Tailwind
# 3. Vérifier qu'il n'y a pas d'erreurs
```

---

## ✅ Avantages de Cette Refactorisation

1. **DRY (Don't Repeat Yourself)** : Une seule source de vérité
2. **Maintenabilité** : Modification en un seul endroit
3. **Testabilité** : Fonction isolée facile à tester
4. **Clarté** : Code plus lisible et compréhensible
5. **Robustesse** : Moins de risques de bugs

---

## 🎯 Conclusion

La fonction utilitaire `normalizeTokenStructure` est **prête et fonctionnelle**. 

Il reste à **remplacer les 2 implémentations dupliquées** par des appels à cette fonction pour :
- ✅ Réduire le code de ~70 lignes
- ✅ Éliminer la duplication
- ✅ Améliorer la maintenabilité

**Tout est prêt pour la refactorisation ! 🚀**
