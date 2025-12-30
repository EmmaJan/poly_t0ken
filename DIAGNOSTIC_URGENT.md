# DIAGNOSTIC URGENT - Scan vide

## Problèmes identifiés

### 1. Seulement des GAPs
✅ **FAUX PROBLÈME** - Le code scanne bien :
- Fills ✅
- Strokes ✅  
- Corner Radius ✅
- Numeric Properties (Gap, Padding) ✅
- Typography ✅

Le scan est complet. Si vous ne voyez que des GAPs, c'est que votre sélection ne contient QUE des frames avec gaps.

### 2. Onglet Auto vide malgré la pastille
🔴 **PROBLÈME RÉEL** - Filtrage UI cassé
- Les stats comptent correctement les issues
- Mais `applyFilter('auto')` ne les affiche pas

### 3. "Aucune variable compatible"
🔴 **PROBLÈME CRITIQUE** - `findNumericSuggestionsV2` retourne vide

## Cause racine probable

**Les variables n'ont PAS les scopes Figma définis !**

Le filtrage strict dans `filterVariableByScopes` exclut toutes les variables sans scopes.

## Solution immédiate

### Option A : Vérifier les scopes dans Figma (RECOMMANDÉ)

1. Ouvrir Figma → Variables
2. Sélectionner `spacing/gap-4`
3. Vérifier que le scope "Gap" est coché
4. Si non coché, le cocher
5. Répéter pour toutes les variables

### Option B : Désactiver temporairement le filtrage strict

Dans `code.js`, ligne ~7663, remplacer :

```javascript
if (!meta.scopes || meta.scopes.length === 0) {
  if (DEBUG) {
    console.warn(`[SCOPE_FILTER] Variable excluded (no scopes defined): ${meta.name}`);
  }
  return false; // ← CHANGE TO: return true;
}
```

Par :

```javascript
if (!meta.scopes || meta.scopes.length === 0) {
  if (DEBUG) {
    console.warn(`[SCOPE_FILTER] Variable excluded (no scopes defined): ${meta.name}`);
  }
  // TEMPORAIRE : Accepter les variables sans scopes
  return true; // ← CHANGÉ
}
```

### Option C : Créer les variables via le plugin

Le plugin ajoute automatiquement les bons scopes lors de la création.

## Actions immédiates

1. **Activer DEBUG=true** (ligne ~25 de code.js)
2. **Recharger le plugin**
3. **Lancer un scan**
4. **Copier les logs de la console** et me les envoyer

Vous devriez voir :
```
[SCOPE_FILTER] Variable excluded (no scopes defined): spacing/gap-4
[SCOPE_FILTER] Variable excluded (no scopes defined): spacing/gap-8
...
```

Si c'est le cas, c'est confirmé : **vos variables n'ont pas de scopes**.

## Fix permanent

Une fois le diagnostic confirmé, il faut :
1. Soit ajouter les scopes manuellement dans Figma
2. Soit recréer les variables via le plugin
3. Soit ajuster le code pour être plus tolérant (non recommandé)

**Envoyez-moi les logs de la console pour confirmer le diagnostic !**
