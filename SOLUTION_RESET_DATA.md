# 🔧 SOLUTION : Effacer les Données Corrompues

## 🔴 Problème

Les tokens sémantiques sauvegardés dans Figma sont **corrompus** avec la structure `{type, modes: {...}}` qui n'est pas correctement normalisée au chargement.

Les erreurs persistent :
```
🚨 Token bg.subtle a toujours un resolvedValue objet après normalisation
🚨 Token action.secondary.default a toujours un resolvedValue objet après normalisation
... (20+ tokens)
```

## ✅ Solution : Reset Complet

### Option 1 : Via l'UI du Plugin (Recommandé)

1. Ouvrir le plugin dans Figma
2. Aller dans les paramètres/options
3. Chercher un bouton "Reset" ou "Clear Data"
4. Regénérer les tokens

### Option 2 : Via la Console Figma

Ouvrir la console du plugin et exécuter :

```javascript
// Effacer les tokens sémantiques corrompus
figma.root.setPluginData("tokenStarter.semantic", "{}");

// Recharger le plugin
console.log("✅ Données sémantiques effacées. Rechargez le plugin.");
```

### Option 3 : Ajouter un Bouton de Reset dans le Code

Ajouter cette fonction dans `code.js` :

```javascript
// À ajouter dans la section des message handlers
if (msg.type === 'RESET_SEMANTIC_TOKENS') {
  figma.root.setPluginData("tokenStarter.semantic", "{}");
  figma.ui.postMessage({
    type: 'RESET_COMPLETE',
    message: 'Tokens sémantiques réinitialisés'
  });
}
```

Et dans l'UI, ajouter un bouton qui envoie :
```javascript
parent.postMessage({ pluginMessage: { type: 'RESET_SEMANTIC_TOKENS' } }, '*');
```

---

## 🎯 Après le Reset

1. **Recharger le plugin** dans Figma
2. **Regénérer les tokens** (choisir Tailwind, MUI, etc.)
3. **Vérifier les logs** : Plus d'erreurs `🚨 Token ... a toujours un resolvedValue objet`

---

## 🔍 Pourquoi Ça Arrive ?

Les tokens ont été sauvegardés avec la nouvelle structure `{type, modes: {...}}` **avant** que `normalizeTokenStructure` soit créée. Maintenant, au chargement :

1. Le token est chargé : `{type: 'COLOR', modes: {light: {resolvedValue: '#F00'}}}`
2. `normalizeTokenStructure` est appelée
3. Elle devrait extraire `resolvedValue` depuis `modes.light`
4. **MAIS** quelque chose ne fonctionne pas dans cette extraction

Le reset force une régénération complète avec le code corrigé.

---

## 🚨 Si le Problème Persiste Après Reset

Ça voudrait dire que `normalizeTokenStructure` ne fonctionne pas correctement. Dans ce cas, il faudrait :

1. Ajouter des logs de debug dans `normalizeTokenStructure`
2. Vérifier exactement quelle structure est retournée
3. Corriger la logique d'extraction

Mais normalement, un reset devrait suffire ! ✅
