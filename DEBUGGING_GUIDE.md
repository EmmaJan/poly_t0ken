# 🔍 Guide de Debugging - Live Preview & Application

## 📋 Logs Ajoutés

J'ai ajouté des logs de debugging détaillés pour tracer le flux d'exécution. Voici ce que vous devriez voir dans la console :

### 1. Live Preview (au clic sur une suggestion)

**Dans la console UI (DevTools)** :
```
[UI PREVIEW] sendPreviewFix called { indices: [...], variableId: "...", livePreviewReady: true }
[UI PREVIEW] Sending message to plugin: { pluginMessage: { type: "preview-fix", ... } }
```

**Dans la console Plugin (Figma)** :
```
[PREVIEW] Received preview-fix message { indices: [...], variableId: "..." }
[PREVIEW] Applying preview to X nodes
[PREVIEW] Applied to node: "Node Name"
[PREVIEW] Preview complete
```

### 2. Application d'un Correctif (au clic sur "Apply")

**Dans la console UI** :
```
(Pas de log UI spécifique pour l'envoi, mais vous devriez voir la réponse)
```

**Dans la console Plugin** :
```
[PLUGIN] Received apply-single-fix message: { nodeId: "...", property: "...", ... }
[PLUGIN] Searching for result... { nodeId: "...", property: "...", totalResults: X }
[PLUGIN] Result found: true
[APPLY] applySingleFix called { nodeId: "...", property: "...", variableId: "..." }
[APPLY] Verification result: { success: true/false, ... }
[PLUGIN] Applied count: 1 (ou 0 si échec)
[PLUGIN] Sending response to UI: { appliedCount: 1, index: X }
```

---

## 🧪 Tests à Effectuer

### Test 1: Live Preview

1. **Ouvrir la console DevTools** (F12) dans Figma
2. **Scanner** une frame
3. **Cliquer** sur une suggestion de couleur
4. **Vérifier** les logs dans la console

**Si vous voyez** :
- ✅ `[UI PREVIEW] sendPreviewFix called` → Le clic est détecté
- ✅ `[UI PREVIEW] Sending message to plugin` → Le message est envoyé
- ✅ `[PREVIEW] Received preview-fix message` → Le plugin reçoit le message
- ✅ `[PREVIEW] Applied to node` → Le preview est appliqué

**Si vous NE voyez PAS** :
- ❌ `[UI PREVIEW] sendPreviewFix called` → Le clic n'est pas détecté (problème UI)
- ❌ `livePreviewReady: false` → Le système n'est pas prêt (scanner d'abord)
- ❌ `[PREVIEW] Variable not found` → L'ID de variable est incorrect
- ❌ `[PREVIEW] No scan results available` → Pas de résultats de scan

---

### Test 2: Application de Correctif

1. **Scanner** une frame
2. **Cliquer** sur une suggestion
3. **Cliquer** sur le bouton "Apply"
4. **Vérifier** les logs dans la console Plugin

**Si vous voyez** :
- ✅ `[PLUGIN] Received apply-single-fix message` → Le message arrive
- ✅ `[PLUGIN] Result found: true` → Le résultat est trouvé
- ✅ `[APPLY] applySingleFix called` → L'application démarre
- ✅ `[APPLY] Verification result: { success: true }` → Succès !
- ✅ `[PLUGIN] Applied count: 1` → 1 correctif appliqué

**Si vous voyez** :
- ❌ `[PLUGIN] Result found: false` → Le résultat n'est pas trouvé
  - Vérifier `nodeId`, `property`, `index` dans les logs
- ❌ `[APPLY] Verification result: { success: false }` → L'application a échoué
  - Regarder les logs d'erreur pour la raison
- ❌ `[PLUGIN] Applied count: 0` → Aucun correctif appliqué

---

## 🐛 Problèmes Possibles

### Problème 1: `livePreviewReady: false`

**Cause**: Le scan n'a pas été effectué ou n'a pas terminé.

**Solution**: 
1. Scanner une frame d'abord
2. Attendre que le scan se termine
3. Vérifier que `livePreviewReady = true` est appelé dans les logs

---

### Problème 2: `[PLUGIN] Result found: false`

**Cause**: Le message `apply-single-fix` ne trouve pas le résultat correspondant.

**Solution**:
1. Vérifier que `msg.nodeId` et `msg.property` correspondent à un résultat de scan
2. Vérifier que `Scanner.lastScanResults` contient des résultats
3. Comparer les valeurs dans les logs

---

### Problème 3: `[PREVIEW] Variable not found`

**Cause**: L'ID de variable est incorrect ou la variable n'existe pas.

**Solution**:
1. Vérifier que `variableId` est correct dans les logs
2. Vérifier que la variable existe dans Figma
3. Vérifier que la variable n'a pas été supprimée

---

### Problème 4: Pas de logs du tout

**Cause**: Le code n'est pas rechargé ou la console n'affiche pas les logs.

**Solution**:
1. **Recharger le plugin** dans Figma (fermer et rouvrir)
2. **Ouvrir la console DevTools** (F12)
3. **Vérifier** que les logs ne sont pas filtrés

---

## 📝 Checklist de Debugging

- [ ] Console DevTools ouverte (F12)
- [ ] Plugin rechargé
- [ ] Frame scannée
- [ ] `livePreviewReady: true` dans les logs
- [ ] Clic sur suggestion → logs `[UI PREVIEW]` visibles
- [ ] Logs `[PREVIEW]` visibles dans la console Plugin
- [ ] Clic sur "Apply" → logs `[PLUGIN]` visibles
- [ ] `[PLUGIN] Applied count: 1` visible

---

## 🚀 Prochaines Étapes

1. **Effectuer les tests** ci-dessus
2. **Copier les logs** de la console
3. **Me les envoyer** pour que je puisse diagnostiquer le problème exact

---

**Date**: 2025-12-29  
**Fichiers modifiés**: `code.js`, `ui.html`  
**Logs ajoutés**: 15+ points de trace
