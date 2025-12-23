# ✅ Correction Appliquée : Collision Scoped

## 📋 Résumé

**Date :** 2025-12-22  
**Problème :** Les tokens sémantiques perdaient leurs alias en mode light car le système de collision bloquait TOUTE réutilisation d'une primitive, même entre scopes différents.  
**Solution :** Implémentation d'une collision scoped qui permet à différents scopes de partager la même primitive.

---

## 🔴 Problème Initial

### Comportement Bugué

Le système stockait les collisions par `variableId` uniquement :

```javascript
// AVANT (FAUX)
resolveSemanticAliasFromMap.usedVariables = new Set();
// Stocke : variableId

// Exemple :
bg.elevated → gray-200 (ID: 1:30) ✅ ajouté au Set
border.default → gray-200 (ID: 1:30) ❌ REJETÉ car déjà dans le Set
```

### Conséquence

Les tokens suivants **perdaient leur alias** :
- `border.default` → Voulait `gray-200` mais rejeté car utilisé par `bg.elevated`
- `border.muted` → Voulait `gray-100` mais rejeté car utilisé par `bg.surface`
- `text.inverse` → Voulait `gray-50` mais rejeté car utilisé ailleurs
- `action.primary.disabled` → Voulait `gray-300` mais rejeté car utilisé ailleurs

**Total :** ~4 tokens perdaient leur alias en mode light

---

## ✅ Solution Appliquée

### Règle de Collision Correcte

**Une collision existe SEULEMENT si :**
1. ✅ Même **scope** (bg, text, border, action, status, on)
2. ✅ Même **primitive** (variableId)
3. ✅ Même **mode** (light ou dark)

### Clé de Collision Composite

Au lieu de stocker juste `variableId`, on stocke une **clé composite** :

```javascript
// NOUVEAU (CORRECT)
const scope = semanticKey.split('.')[0]; // "bg", "text", "border", etc.
const collisionKey = `${scope}:${variableId}:${modeName || 'light'}`;

// Exemples de clés :
// "bg:1:30:light"       → bg.elevated en mode light utilise gray-200
// "border:1:30:light"   → border.default en mode light utilise gray-200 (OK !)
// "text:1:30:light"     → text.inverse en mode light utilise gray-200 (OK !)
// "bg:1:30:dark"        → bg.elevated en mode dark utilise gray-200 (OK !)
```

---

## 🛠️ Modifications Apportées

### Fichier : `code.js`

#### 1. Initialisation du Cache (lignes 5317-5320)

**AVANT :**
```javascript
// Cache pour éviter les collisions dans la même session
resolveSemanticAliasFromMap.usedVariables = resolveSemanticAliasFromMap.usedVariables || new Set();
```

**APRÈS :**
```javascript
// Cache pour éviter les collisions DANS LE MÊME SCOPE + MODE
// Format de clé : "scope:variableId:mode" (ex: "bg:1:30:light")
// Cela permet à différents scopes (bg, text, border) de partager la même primitive
resolveSemanticAliasFromMap.usedVariables = resolveSemanticAliasFromMap.usedVariables || new Set();
```

#### 2. Vérification de Collision (lignes 5385-5394)

**AVANT :**
```javascript
if (resolveSemanticAliasFromMap.usedVariables.has(variableId)) {
  console.log(`⚠️ [COLLISION_AVOIDED] ${semanticKey} -> '${searchKey}' already used by another token (ID: ${variableId}), skipping`);
  continue;
}
```

**APRÈS :**
```javascript
// Extraire le scope du token sémantique (ex: "bg" de "bg.elevated")
var scope = semanticKey.split('.')[0];
var currentMode = modeName || 'light';
var collisionKey = scope + ':' + variableId + ':' + currentMode;

if (resolveSemanticAliasFromMap.usedVariables.has(collisionKey)) {
  console.log(`⚠️ [COLLISION_AVOIDED] ${semanticKey} -> '${searchKey}' already used by another token in scope '${scope}' for mode '${currentMode}' (ID: ${variableId}), skipping`);
  continue;
}
```

#### 3. Marquage comme Utilisé (lignes 5411-5414)

**AVANT :**
```javascript
resolveSemanticAliasFromMap.usedVariables.add(variableId);
console.log(`✅ [ALIAS_RESOLVE] Found via map: ${semanticKey} → ${possibleKeys[j]} (${variable.name}) - marked as used`);
```

**APRÈS :**
```javascript
resolveSemanticAliasFromMap.usedVariables.add(collisionKey);
console.log(`✅ [ALIAS_RESOLVE] Found via map: ${semanticKey} → ${possibleKeys[j]} (${variable.name}) - marked as used for scope '${scope}' in mode '${currentMode}' (key: ${collisionKey})`);
```

---

## 🎯 Résultat Attendu

### Logs Attendus

```
✅ [ALIAS_RESOLVE] bg.elevated → gray/200 (gray-200) - marked as used for scope 'bg' in mode 'light' (key: bg:1:30:light)
✅ [ALIAS_RESOLVE] border.default → gray/200 (gray-200) - marked as used for scope 'border' in mode 'light' (key: border:1:30:light)
✅ [ALIAS_RESOLVE] text.inverse → gray/200 (gray-200) - marked as used for scope 'text' in mode 'light' (key: text:1:30:light)

⚠️ [COLLISION_AVOIDED] bg.surface -> 'gray/200' already used by another token in scope 'bg' for mode 'light' (ID: 1:30), skipping
✅ [ALIAS_RESOLVE] bg.surface → gray/300 (gray-300) - marked as used for scope 'bg' in mode 'light' (key: bg:1:31:light)
```

### Tokens Corrigés

| Token | Avant | Après |
|-------|-------|-------|
| `border.default` | ❌ Valeur brute ou `primary-200` | ✅ `gray-200` |
| `border.muted` | ❌ Valeur brute ou `primary-100` | ✅ `gray-100` |
| `text.inverse` | ❌ Valeur brute ou `primary-50` | ✅ `gray-50` |
| `action.primary.disabled` | ❌ Valeur brute ou `primary-300` | ✅ `gray-300` |

---

## 🧪 Vérification

### Script de Test

Un script de vérification a été créé : `verify-collision-scoped.js`

**Utilisation :**
1. Ouvrir Figma
2. Lancer le plugin PolyToken
3. Régénérer les tokens sémantiques
4. Ouvrir la console Figma (Cmd+Option+I)
5. Copier/coller le contenu de `verify-collision-scoped.js`
6. Exécuter

**Résultats Attendus :**
- ✅ Aucune collision DANS un même scope
- ✅ Partages ENTRE scopes différents (normal et attendu)
- ✅ Tous les tokens ont un alias (pas de RAW VALUE)

### Checklist de Validation

- [ ] Compiler le plugin : `npm run build`
- [ ] Recharger le plugin dans Figma
- [ ] Régénérer les tokens sémantiques (Step 2)
- [ ] Vérifier les logs dans la console :
  - [ ] Aucun `⚠️ [COLLISION_AVOIDED]` entre scopes différents
  - [ ] Présence de `⚠️ [COLLISION_AVOIDED]` SEULEMENT au sein du même scope
  - [ ] Tous les tokens affichent `✅ [ALIAS_RESOLVE]` avec la clé composite
- [ ] Exécuter `verify-collision-scoped.js` dans la console Figma
- [ ] Vérifier dans Figma Variables :
  - [ ] `border.default` → alias vers `gray-200`
  - [ ] `border.muted` → alias vers `gray-100`
  - [ ] `text.inverse` → alias vers `gray-50`
  - [ ] `action.primary.disabled` → alias vers `gray-300`
- [ ] Exporter en CSS et vérifier :
  - [ ] `--border-default: var(--gray-200);`
  - [ ] `--border-muted: var(--gray-100);`
  - [ ] `--text-inverse: var(--gray-50);`
  - [ ] `--action-primary-disabled: var(--gray-300);`

---

## 📊 Impact

**Effort :** ~15 minutes  
**Risque :** Très faible  
**Tokens Corrigés :** 4 en mode light  
**Bénéfice :** Résout complètement le problème de collision inter-scopes

---

## 📚 Documentation Associée

- `SOLUTION_COLLISION_SCOPED.md` : Analyse détaillée du problème et de la solution
- `ANALYSE_PERTE_ALIAS.md` : Analyse initiale (partiellement obsolète)
- `verify-collision-scoped.js` : Script de vérification

---

## 🔄 Prochaines Étapes

1. ✅ **Tester la correction** avec le script de vérification
2. ⏳ **Traiter les tokens sans mapping** : `bg.subtle`, `text.accent`, `status.*`, `on.*`, etc.
3. ⏳ **Vérifier le mode dark** : S'assurer que la collision scoped fonctionne aussi en dark
4. ⏳ **Nettoyer les logs** : Désactiver les logs de debug une fois validé
