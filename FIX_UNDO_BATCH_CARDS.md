# Fix Undo Batch - Cards Réapparition

## Problème Diagnostiqué

Après un batch de corrections suivi d'un "Annuler", les corrections étaient bien annulées côté Figma, mais les cards ne réapparaissaient pas dans l'UI.

### Cause Racine

Le système confondait deux états distincts:
1. **Ignored** (ignoré par l'utilisateur) - devrait être permanent
2. **Applied** (correction appliquée) - devrait être réversible par undo

Les deux états utilisaient le même tableau `ignoredResultIndices`, ce qui causait:
- Les cards appliquées étaient marquées comme "ignorées"
- Les filtres (`generateUnifiedCleaningContent`, `applyFilter`, `shouldExcludeCard`) excluaient ces cards
- Après undo, même avec un rescan, les cards restaient filtrées

## Solution Implémentée

### 1. Séparation des États (ui.html)

**Ajout d'un nouvel état global:**
```javascript
var ignoredResultIndices = []; // Indices ignorés par l'utilisateur (permanent)
var appliedResultIndices = [];  // Indices appliqués (réversible par undo)
```

### 2. Modification de handleSingleFixApplied (ui.html)

**Avant:**
```javascript
ignoredResultIndices.push(index); // ❌ Pollue l'état "ignored"
```

**Après:**
```javascript
appliedResultIndices.push(index); // ✅ État séparé "applied"
```

### 3. Modification de handleGroupFixApplied (ui.html)

Ajout de la synchronisation dans `appliedResultIndices` global:
```javascript
// 🔥 CRITICAL: Ajouter aussi dans appliedResultIndices global pour le undo
if (appliedResultIndices.indexOf(index) === -1) {
  appliedResultIndices.push(index);
}
```

### 4. Mise à Jour des Filtres (ui.html)

**generateUnifiedCleaningContent:**
- Ne filtre QUE les `ignoredResultIndices`
- Les `appliedResultIndices` ne sont PAS filtrés
- Ajout de commentaires explicites

**applyFilter:**
- Vérifie uniquement `ignoredResultIndices`
- Les cards "applied" peuvent être masquées visuellement mais ne sont pas exclues

**shouldExcludeCard:**
- N'exclut QUE les cards avec indices dans `ignoredResultIndices`
- Ajout de commentaire: "Les appliedResultIndices ne sont PAS exclus"

### 5. Fix Handler batch-undo-complete (ui.html)

**Nettoyage de appliedResultIndices:**
```javascript
// 🔥 CRITICAL FIX: Retirer les indices annulés de appliedResultIndices
if (undoneIndices.length > 0) {
  appliedResultIndices = appliedResultIndices.filter(function(idx) {
    return undoneIndices.indexOf(idx) === -1;
  });
}
```

**Fallback si msg.indices n'est pas fourni:**
```javascript
// Reconstruction depuis lastBatchHistory
var reconstructedIndices = [];
lastBatchHistory.forEach(function(item) {
  if (item.index !== undefined) {
    reconstructedIndices.push(item.index);
  }
});
```

**Reset de lastScannedSelectionId:**
```javascript
// 🔥 CRITICAL: Reset pour forcer le rescan
window.lastScannedSelectionId = null;
```

### 6. Amélioration Backend (code.js)

**Extraction et envoi des indices annulés:**
```javascript
// Extraire les indices des corrections annulées
var undoneIndices = [];
for (var i = 0; i < batchHistory.length; i++) {
  var item = batchHistory[i];
  if (item.indices && Array.isArray(item.indices)) {
    item.indices.forEach(function(idx) {
      if (!seenIndices[idx]) {
        undoneIndices.push(idx);
        seenIndices[idx] = true;
      }
    });
  } else if (item.index !== undefined) {
    // Fallback pour format legacy
  }
}

figma.ui.postMessage({ 
  type: "batch-undo-complete", 
  undoneCount: undoneCount,
  nodeIds: nodeIds,
  indices: undoneIndices  // 🔥 Nouveau champ
});
```

### 7. Reset lors de Nouveau Scan (ui.html)

Ajout de la réinitialisation de `appliedResultIndices` dans deux endroits:
- Bouton "Scan" manuel
- Scan automatique après changement de sélection

```javascript
ignoredResultIndices = [];
appliedResultIndices = []; // Reset aussi les indices appliqués
```

## Acceptance Criteria - Validation

✅ **Appliquer plusieurs corrections** → cards disparaissent
- Les cards sont masquées (`display: none`)
- Les indices sont ajoutés à `appliedResultIndices`
- Les indices NE SONT PAS ajoutés à `ignoredResultIndices`

✅ **Cliquer "Annuler"** → valeurs Figma reviennent ET cards réapparaissent
- Backend restaure les valeurs originales
- Backend envoie `msg.indices` avec les indices annulés
- Frontend nettoie `appliedResultIndices`
- Frontend reset `lastScannedSelectionId`
- Frontend relance le scan
- Les cards réapparaissent car elles ne sont plus filtrées

✅ **Ignorer une card** → reste permanent même après undo
- `ignoreGroupedItems` ajoute dans `ignoredResultIndices`
- Ces indices restent filtrés même après undo
- Distinction claire entre "ignored" et "applied"

✅ **Compteurs d'onglets** → ne considèrent pas les "applied" comme "ignored"
- `shouldExcludeCard` ne filtre que les `ignoredResultIndices`
- Les compteurs restent corrects

## Architecture Finale

```
États Séparés:
├── ignoredResultIndices    → Permanent (action utilisateur "Ignorer")
└── appliedResultIndices    → Temporaire (réversible par undo)

Filtres:
├── generateUnifiedCleaningContent → Filtre UNIQUEMENT ignoredResultIndices
├── applyFilter                    → Filtre UNIQUEMENT ignoredResultIndices
└── shouldExcludeCard              → Filtre UNIQUEMENT ignoredResultIndices

Undo Flow:
1. Backend extrait indices depuis batchHistory
2. Backend envoie msg.indices
3. Frontend nettoie appliedResultIndices
4. Frontend reset lastScannedSelectionId
5. Frontend relance scan
6. Cards réapparaissent (non filtrées)
```

## Robustesse

- **Fallback**: Si `msg.indices` n'est pas fourni, reconstruction depuis `lastBatchHistory`
- **Compatibilité**: Support des deux formats (`item.indices` array et `item.index` scalar)
- **Reset propre**: `appliedResultIndices` est réinitialisé lors de chaque nouveau scan
- **Logs**: Ajout de logs explicites pour debugging (`🔄`, `🔥 CRITICAL`)

## Notes Techniques

- Les cards "applied" sont masquées visuellement (`display: none`) mais ne sont pas supprimées du DOM
- Le rescan force la régénération complète des cards
- La séparation des états permet une gestion claire des différents workflows
- Les commentaires explicites dans le code facilitent la maintenance future
