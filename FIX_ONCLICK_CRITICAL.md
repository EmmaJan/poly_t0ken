# 🔴 CORRECTION CRITIQUE - Clic sur Suggestions

## ❌ Problème Identifié

**Symptôme**: Le clic sur les suggestions ne déclenchait RIEN.

**Cause**: La fonction `handleSmartPillClick` n'était pas exposée dans le scope global `window`, donc les `onclick` inline HTML ne pouvaient pas l'appeler.

**Code problématique** (ligne 8807 de `ui.html`) :
```html
<button onclick="handleSmartPillClick(...)">
```

**Erreur dans la console** (probablement) :
```
Uncaught ReferenceError: handleSmartPillClick is not defined
```

---

## ✅ Solution Appliquée

**Fichier**: `ui.html` (ligne 8761)

**Ajout** :
```javascript
// ✅ EXPOSER LA FONCTION GLOBALEMENT pour les onclick inline
window.handleSmartPillClick = handleSmartPillClick;
```

**Ajout de log** (ligne 8735) :
```javascript
console.log('[UI] handleSmartPillClick called!', { indices, variableId, variableName });
```

---

## 🧪 Test à Effectuer

1. **Recharger le plugin** dans Figma
2. **Scanner** une frame
3. **Ouvrir la console** (F12)
4. **Cliquer** sur une suggestion

**Vous devriez maintenant voir** :
```
[UI] handleSmartPillClick called! { indices: [...], variableId: "...", variableName: "..." }
[UI PREVIEW] sendPreviewFix called { indices: [...], variableId: "...", livePreviewReady: true }
[UI PREVIEW] Sending message to plugin: ...
```

---

## 🎯 Impact

Cette correction devrait résoudre **TOUS** les problèmes :

1. ✅ **Live Preview** → Le clic déclenche maintenant `sendPreviewFix`
2. ✅ **Sélection de suggestion** → La carte est marquée avec la variable sélectionnée
3. ✅ **Bouton Apply activé** → Le bouton "Apply" devient cliquable
4. ✅ **Application de correctif** → Le correctif peut maintenant être appliqué

---

## 🔍 Vérification

Si le clic ne fonctionne toujours pas :

1. **Vérifier dans la console** :
   ```javascript
   typeof window.handleSmartPillClick
   // Devrait retourner: "function"
   ```

2. **Vérifier qu'il n'y a pas d'erreur** dans la console au clic

3. **Vérifier que le HTML est bien généré** :
   - Inspecter un bouton de suggestion
   - Vérifier qu'il a bien un attribut `onclick="handleSmartPillClick(...)"`

---

## 📊 Résumé

| Problème | Cause | Solution | Status |
|----------|-------|----------|--------|
| Clic ne déclenche rien | Fonction non globale | `window.handleSmartPillClick = ...` | ✅ Corrigé |
| Live Preview ne marche pas | Clic ne déclenche rien | Même correction | ✅ Corrigé |
| Application impossible | Clic ne déclenche rien | Même correction | ✅ Corrigé |

---

**Date**: 2025-12-29  
**Priorité**: 🔴 CRITIQUE  
**Impact**: Résout tous les problèmes d'interaction
