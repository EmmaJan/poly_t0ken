# 🎯 Solution : Collision Scoped par Scope + Mode

## 🔴 Problème Réel Identifié

Le système de collision actuel bloque **TOUTE** réutilisation d'une primitive, même entre scopes différents :

```javascript
// ACTUEL (FAUX)
resolveSemanticAliasFromMap.usedVariables = new Set();
// Stocke : variableId

// Exemple :
bg.elevated → gray-200 (ID: 1:30) ✅ ajouté au Set
border.default → gray-200 (ID: 1:30) ❌ REJETÉ car déjà dans le Set
```

**Mais c'est incorrect !** `border.default` et `bg.elevated` ont des **scopes différents**, donc ils **PEUVENT** partager la même primitive.

---

## ✅ Règle de Collision Correcte

**Une collision existe SEULEMENT si :**
1. ✅ Même **scope** (bg, text, border, action, status, on)
2. ✅ Même **primitive** (variableId)
3. ✅ Même **mode** (light ou dark)

**Exemples :**

| Token A | Token B | Même Scope ? | Même Primitive ? | Même Mode ? | Collision ? |
|---------|---------|--------------|------------------|-------------|-------------|
| `bg.elevated` (light) | `bg.surface` (light) | ✅ bg | ✅ gray-200 | ✅ light | ❌ **OUI** |
| `bg.elevated` (light) | `border.default` (light) | ❌ bg ≠ border | ✅ gray-200 | ✅ light | ✅ **NON** |
| `bg.elevated` (light) | `bg.elevated` (dark) | ✅ bg | ✅ gray-200 | ❌ light ≠ dark | ✅ **NON** |
| `text.inverse` (light) | `border.muted` (light) | ❌ text ≠ border | ✅ gray-100 | ✅ light | ✅ **NON** |

---

## 🛠️ Solution : Clé de Collision Composite

Au lieu de stocker juste `variableId`, on stocke une **clé composite** :

```javascript
// NOUVEAU (CORRECT)
const scope = semanticKey.split('.')[0]; // "bg", "text", "border", etc.
const collisionKey = `${scope}:${variableId}:${modeName || 'light'}`;

// Exemples de clés :
// "bg:1:30:light"       → bg.elevated en mode light utilise gray-200
// "border:1:30:light"   → border.default en mode light utilise gray-200 (OK !)
// "bg:1:30:dark"        → bg.elevated en mode dark utilise gray-200 (OK !)
```

---

## 📝 Modifications à Apporter

### Modification 1 : Initialisation (ligne 5318)

**AVANT :**
```javascript
resolveSemanticAliasFromMap.usedVariables = resolveSemanticAliasFromMap.usedVariables || new Set();
```

**APRÈS :**
```javascript
// Cache pour éviter les collisions DANS LE MÊME SCOPE + MODE
// Format de clé : "scope:variableId:mode" (ex: "bg:1:30:light")
resolveSemanticAliasFromMap.usedVariables = resolveSemanticAliasFromMap.usedVariables || new Set();
```

### Modification 2 : Vérification de Collision (ligne 5386)

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
  (function () { return function () { } })() && console.log(`⚠️ [COLLISION_AVOIDED] ${semanticKey} -> '${searchKey}' already used by another token in scope '${scope}' for mode '${currentMode}' (ID: ${variableId}), skipping`);
  continue;
}
```

### Modification 3 : Marquage comme Utilisé (ligne 5413)

**AVANT :**
```javascript
resolveSemanticAliasFromMap.usedVariables.add(variableId);
console.log(`✅ [ALIAS_RESOLVE] Found via map: ${semanticKey} → ${possibleKeys[j]} (${variable.name}) - marked as used`);
```

**APRÈS :**
```javascript
resolveSemanticAliasFromMap.usedVariables.add(collisionKey);
(function () { return function () { } })() && console.log(`✅ [ALIAS_RESOLVE] Found via map: ${semanticKey} → ${possibleKeys[j]} (${variable.name}) - marked as used for scope '${scope}' in mode '${currentMode}' (key: ${collisionKey})`);
```

---

## 🎯 Résultat Attendu

Après cette modification, les logs devraient montrer :

```
✅ [ALIAS_RESOLVE] bg.elevated → gray/200 (gray-200) - marked as used for scope 'bg' in mode 'light' (key: bg:1:30:light)
✅ [ALIAS_RESOLVE] border.default → gray/200 (gray-200) - marked as used for scope 'border' in mode 'light' (key: border:1:30:light)
✅ [ALIAS_RESOLVE] text.inverse → gray/200 (gray-200) - marked as used for scope 'text' in mode 'light' (key: text:1:30:light)

⚠️ [COLLISION_AVOIDED] bg.surface -> 'gray/200' already used by another token in scope 'bg' for mode 'light' (ID: 1:30), skipping
✅ [ALIAS_RESOLVE] bg.surface → gray/300 (gray-300) - marked as used for scope 'bg' in mode 'light' (key: bg:1:31:light)
```

---

## 📊 Impact

**Tokens Affectés (Corrigés) :**
- `border.default` → Pourra utiliser `gray-200` même si `bg.elevated` l'utilise déjà ✅
- `border.muted` → Pourra utiliser `gray-100` même si `bg.surface` l'utilise déjà ✅
- `text.inverse` → Pourra utiliser `gray-50` même si utilisé ailleurs ✅
- `action.primary.disabled` → Pourra utiliser `gray-300` même si utilisé ailleurs ✅

**Effort :** ~10 minutes  
**Risque :** Très faible  
**Bénéfice :** Résout complètement le problème de collision inter-scopes
