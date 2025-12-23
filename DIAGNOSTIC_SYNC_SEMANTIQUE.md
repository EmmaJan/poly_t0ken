# 🔧 Diagnostic : Synchronisation des Tokens Sémantiques

**Date** : 20 décembre 2025  
**Problème** : La synchronisation des tokens sémantiques vers Figma ne fonctionne plus

---

## 🎯 Problème Identifié

La fonction `applySemanticValue` (lignes 5998-6101 dans `code.js`) refuse de synchroniser les tokens sémantiques vers Figma si l'alias vers une primitive n'est pas valide.

### Comportement Actuel

```javascript
// Ligne 6073-6081
if (!norm.isValid) {
  // ❌ PAS D'ALIAS VALIDE : REFUSER LA CRÉATION AVEC VALEUR BRUTE
  console.error(`❌ [APPLY_FAIL] ${semanticKey}: NO ALIAS FOUND - Semantic tokens MUST be aliases`);
  return; // EARLY RETURN - pas d'écrasement
}
```

**Conséquence** : Si la résolution d'alias échoue, les variables Figma restent **vides** ou **ne sont pas créées**.

---

## 🔍 Causes Possibles

### 1. Échec de Résolution d'Alias ⚠️

La fonction `resolveSemanticAliasFromMap` peut échouer si :

- ❌ Les **collections primitives** (Brand Colors, Grayscale, System Colors) n'existent pas dans Figma
- ❌ Les **noms de variables** ne correspondent pas aux patterns attendus
- ❌ Le **`globalVariableMap`** est vide ou mal construit
- ❌ Les **primitives n'ont pas de valeurs** dans les modes Figma

**Exemple** : Si le plugin cherche `gray-900` mais que la variable s'appelle `grey-900` ou `grayscale/900`, la résolution échoue.

### 2. Problème de Timing / Race Condition ⏱️

Même avec un délai de 300ms (ligne 6484), il est possible que :

- ⏳ Les **primitives ne soient pas encore synchronisées** dans Figma
- ⏳ Le **cache de variables** soit obsolète
- ⏳ Les **modes Figma** (Light/Dark) ne soient pas encore créés

### 3. Problème de Nommage 🏷️

Les mappings dans `getPrimitiveMappingForSemantic` (lignes 6732-7070) définissent des correspondances strictes :

```javascript
'action.primary.default': { category: 'brand', keys: ['500'] }
```

Si :
- Le **naming** (tailwind, mui, ant, etc.) ne correspond pas au fichier
- Les **collections ont été renommées** manuellement dans Figma
- Les **variables primitives** ont des noms différents

→ La résolution échoue.

---

## 🛠️ Solutions Appliquées

### ✅ Solution #1 : Logs de Diagnostic (FAIT)

J'ai ajouté des logs détaillés dans `importTokensToFigma` pour tracer :

1. **Avant résolution** : État du token sémantique
2. **Après résolution** : Succès ou échec de l'alias
3. **En cas d'échec** : Détails complets (naming, isDark, taille de la map, etc.)

**Fichier modifié** : `code.js` lignes 6527-6580

**Comment utiliser** :
1. Ouvrir la console développeur Figma (Cmd+Option+I sur Mac)
2. Générer des tokens
3. Cliquer sur "Import to Figma"
4. Observer les logs `[IMPORT_DIAGNOSTIC]`

---

## 🔬 Prochaines Étapes de Diagnostic

### Étape 1 : Vérifier les Logs

Cherchez dans la console :

```
❌ [IMPORT_DIAGNOSTIC] Alias resolution FAILED for action.primary.default (light)
   - naming: tailwind
   - isDark: false
   - globalVariableMap size: 0  ← PROBLÈME ICI !
   - currentAliasTo: null
```

### Étape 2 : Vérifier les Collections Figma

Assurez-vous que ces collections existent avec des variables :

- ✅ **Brand Colors** (avec primary-50, primary-100, ..., primary-900)
- ✅ **Grayscale** (avec gray-50, gray-100, ..., gray-900, white)
- ✅ **System Colors** (avec success, warning, error, info)
- ✅ **Spacing** (avec spacing-xs, spacing-sm, etc.)
- ✅ **Radius** (avec radius-sm, radius-md, etc.)

### Étape 3 : Vérifier les Noms de Variables

Les primitives doivent avoir des noms compatibles :

**Tailwind** :
- `primary-500`, `gray-900`, `system-success`

**Material-UI** :
- `primary/500`, `grey-900`, `system-success`

**Ant Design** :
- `primary-5`, `gray-9`, `system-success`

---

## 💡 Solutions Complémentaires (À Appliquer si Nécessaire)

### Solution #2 : Augmenter le Délai de Synchronisation

Si le problème est un timing, augmenter le délai de 300ms à 1000ms :

```javascript
// Ligne 6484
await new Promise(function (resolve) { setTimeout(resolve, 1000); }); // 300 → 1000
```

### Solution #3 : Fallback sur Valeurs Brutes (Temporaire)

Modifier `applySemanticValue` pour accepter les valeurs brutes en dernier recours :

```javascript
// Ligne 6073-6081
if (!norm.isValid) {
  console.warn(`⚠️ [APPLY_FALLBACK] ${semanticKey}: Using raw value as fallback`);
  // Créer une valeur brute au lieu de return
  processedValue = hexToRgb(semanticData.resolvedValue);
  valueType = 'raw';
}
```

⚠️ **Attention** : Cette solution est un **workaround** et ne respecte pas l'architecture des tokens sémantiques (qui doivent TOUJOURS être des alias).

### Solution #4 : Régénérer les Primitives

Si les primitives sont corrompues ou manquantes :

1. Supprimer toutes les collections dans Figma
2. Cocher "Overwrite existing variables"
3. Régénérer les tokens

---

## 📊 Checklist de Vérification

Avant de continuer, vérifiez :

- [ ] Les logs `[IMPORT_DIAGNOSTIC]` apparaissent dans la console
- [ ] Les collections primitives existent dans Figma
- [ ] Les variables primitives ont des valeurs (pas vides)
- [ ] Le `naming` correspond à la librairie choisie
- [ ] Les modes Light/Dark existent dans la collection Semantic
- [ ] Le `globalVariableMap` a une taille > 0

---

## 🆘 Si le Problème Persiste

1. **Partager les logs** : Copier tous les logs `[IMPORT_DIAGNOSTIC]` et `[ALIAS_RESOLVE]`
2. **Vérifier les collections** : Faire une capture d'écran des collections Figma
3. **Vérifier le naming** : Confirmer quelle librairie est utilisée (tailwind, mui, ant, etc.)

---

**Auteur** : Antigravity AI  
**Dernière mise à jour** : 20 décembre 2025, 18:30
