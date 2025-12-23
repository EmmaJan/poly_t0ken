# 🔍 Analyse Approfondie : Perte d'Alias en Mode Light

## 📊 Résumé Exécutif

**Problème :** Certains tokens sémantiques perdent leur alias même en mode light, créant des valeurs brutes au lieu de références vers les primitives.

**Cause Racine :** Logique de fallback défectueuse qui crée des collisions inter-catégories entre `gray` et `brand` primitives.

---

## 🔴 Bug #1 : Collisions Inter-Catégories

### Symptômes

Les tokens suivants **trouvent** leur primitive cible mais **créent un alias vers la mauvaise catégorie** :

| Token Sémantique | Cible Attendue | Alias Créé (FAUX) | Raison |
|------------------|----------------|-------------------|--------|
| `border.default` | `gray-200` | `primary-200` ❌ | Collision avec `bg.elevated` |
| `border.muted` | `gray-100` | `primary-100` ❌ | Collision avec `bg.surface` |
| `text.inverse` | `gray-50` | `primary-50` ❌ | Collision avec `bg.canvas` |
| `action.primary.disabled` | `gray-300` | `primary-300` ❌ | Collision avec `bg.muted` |

### Flux Bugué

```
1. border.default cherche gray/200
   ↓
2. gray/200 trouvé (VariableID:1:30)
   ↓
3. ⚠️ COLLISION_AVOIDED → déjà utilisé par bg.elevated
   ↓
4. Essai de la clé suivante : '200' (clé nue)
   ↓
5. '200' trouvé → VariableID:1:5 (primary-200) ✅
   ↓
6. Vérification collection : "Brand Colors" ≠ "gray" ❌
   ↓
7. Continue la boucle... mais aucune autre clé ne fonctionne
   ↓
8. Fallback vers resolveSemanticAliasFromMapLegacy
   ↓
9. ⚠️ No alias found → Valeur brute utilisée
```

### Code Problématique

**Fichier :** `code.js`  
**Lignes :** 5354-5356

```javascript
// 2. Clé exacte seule (ex: 100) - seulement si numérique pur
if (/^\d+$/.test(targetKey)) {
  possibleKeys.push(targetKey);  // ← 🔴 PROBLÈME ICI
}
```

**Pourquoi c'est un bug :**
- La clé nue `'200'` est ambiguë : elle peut matcher `primary-200`, `gray-200`, `success-200`, etc.
- Quand `gray/200` est déjà utilisé, le système essaie `'200'` qui matche **la première variable trouvée** dans la map globale
- La map globale contient les primitives dans l'ordre de création : Brand → System → Gray
- Donc `'200'` matche `primary-200` avant `gray-200`

---

## 🟡 Bug #2 : Vérification de Collection Trop Tardive

### Problème

La vérification `isCollectionCategory(collection.name, mapping.category)` (ligne 5396) arrive **APRÈS** que la variable a été trouvée et marquée comme collision potentielle.

### Flux Actuel

```javascript
for (var j = 0; j < possibleKeys.length; j++) {
  var searchKey = possibleKeys[j];
  var variableId = globalVariableMap.get(searchKey);  // ← Trouve primary-200
  
  if (variableId) {
    if (resolveSemanticAliasFromMap.usedVariables.has(variableId)) {
      continue;  // Collision
    }
    
    var variable = figma.variables.getVariableById(variableId);
    var collection = figma.variables.getVariableCollectionById(variable.variableCollectionId);
    
    if (collection && isCollectionCategory(collection.name, mapping.category)) {
      // ← Cette vérification arrive trop tard !
      return { ... };
    }
    // Si la collection ne matche pas, on continue... mais on ne retourne rien
  }
}
```

### Conséquence

Quand `'200'` matche `primary-200` :
1. La variable est trouvée ✅
2. Pas de collision (primary-200 n'est pas encore utilisé) ✅
3. Collection = "Brand Colors" ≠ "gray" ❌
4. La condition `isCollectionCategory` échoue
5. **Rien n'est retourné**, la boucle continue
6. Aucune autre clé ne fonctionne
7. Fallback vers legacy → échec

---

## ✅ Solutions Proposées

### Solution 1 : Supprimer les Clés Nues (Recommandé)

**Modifier lignes 5353-5356 :**

```javascript
// AVANT
// 2. Clé exacte seule (ex: 100) - seulement si numérique pur
if (/^\d+$/.test(targetKey)) {
  possibleKeys.push(targetKey);
}

// APRÈS
// 2. Clé exacte seule → SUPPRIMÉ pour éviter les collisions inter-catégories
// Les clés nues comme '200' sont ambiguës entre gray-200, primary-200, etc.
// On garde uniquement les clés préfixées par catégorie
```

**Avantages :**
- ✅ Élimine complètement les collisions inter-catégories
- ✅ Force l'utilisation de clés préfixées (`gray/200`, `gray-200`)
- ✅ Plus simple et plus sûr

**Inconvénients :**
- ⚠️ Peut casser la compatibilité avec d'anciennes maps qui n'utilisent que des clés nues

---

### Solution 2 : Vérifier la Collection AVANT d'Accepter la Variable

**Modifier lignes 5380-5420 :**

```javascript
// Chercher dans la map
for (var j = 0; j < possibleKeys.length; j++) {
  var searchKey = possibleKeys[j];
  var variableId = globalVariableMap.get(searchKey);
  
  if (variableId) {
    // ✅ VÉRIFICATION PRÉCOCE : vérifier la collection AVANT de checker les collisions
    var variable = figma.variables.getVariableById(variableId);
    if (!variable) continue;
    
    var collection = figma.variables.getVariableCollectionById(variable.variableCollectionId);
    if (!collection) continue;
    
    // ✅ FILTRER PAR CATÉGORIE DÈS LE DÉBUT
    if (!isCollectionCategory(collection.name, mapping.category)) {
      console.log(`⚠️ [CATEGORY_MISMATCH] ${semanticKey} -> '${searchKey}' found but wrong category (${collection.name} ≠ ${mapping.category}), skipping`);
      continue;  // ← Passer à la clé suivante
    }
    
    // Maintenant vérifier les collisions
    if (resolveSemanticAliasFromMap.usedVariables.has(variableId)) {
      console.log(`⚠️ [COLLISION_AVOIDED] ${semanticKey} -> '${searchKey}' already used, skipping`);
      continue;
    }
    
    // Variable valide trouvée !
    return { ... };
  }
}
```

**Avantages :**
- ✅ Garde la compatibilité avec les clés nues
- ✅ Filtre correctement par catégorie
- ✅ Évite les faux positifs

**Inconvénients :**
- ⚠️ Plus complexe
- ⚠️ Peut avoir des impacts de performance (plus d'appels à l'API Figma)

---

### Solution 3 : Combiner les Deux (Optimal)

1. **Supprimer les clés nues** pour les catégories ambiguës (`gray`, `brand`)
2. **Garder les clés nues** pour les catégories uniques (`spacing`, `radius`, `typography`)
3. **Vérifier la collection en premier** pour toutes les clés

```javascript
// Générer les clés dans l'ordre de priorité
var possibleKeys = [];

// 1. PRIORITÉ MAX : clé exacte avec category/key
var primaryKey = mapping.category + '/' + targetKey;
possibleKeys.push(primaryKey);

// 2. Clé exacte seule - SEULEMENT pour catégories non-ambiguës
var ambiguousCategories = ['gray', 'brand', 'system'];
if (/^\d+$/.test(targetKey) && ambiguousCategories.indexOf(mapping.category) === -1) {
  possibleKeys.push(targetKey);
}

// 3. FALLBACKS spécifiques
var fallbacks = generateFallbackKeysForMap(targetKey, mapping.category);
// ...
```

---

## 📊 Impact Estimé

### Tokens Affectés par le Bug

**En mode Light :**
- `border.default`, `border.muted` → Alias vers brand au lieu de gray
- `text.inverse` → Alias vers brand au lieu de gray  
- `action.primary.disabled` → Alias vers brand au lieu de gray

**Total :** ~4 tokens en mode light perdent leur alias correct

### Tokens Sans Mapping (Normal)

Ces tokens n'ont pas de mapping défini, donc c'est **attendu** :
- `bg.subtle`, `bg.accent`, `text.accent`, `text.link`, `text.on-inverse`
- `action.secondary.*`, `action.primary.text`
- `border.accent`, `border.focus`
- `status.*`, `on.*`

**Total :** ~20 tokens sans mapping (comportement normal)

---

## 🎯 Recommandation

**Appliquer la Solution 3 (Combinée) :**

1. ✅ Supprimer les clés nues pour `gray`, `brand`, `system`
2. ✅ Vérifier la collection en premier dans la boucle de recherche
3. ✅ Ajouter des logs pour tracer les rejets de catégorie

**Effort :** ~30 minutes  
**Risque :** Faible  
**Impact :** Corrige 4 tokens en mode light + prévient futurs bugs
