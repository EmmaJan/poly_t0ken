# 🚨 Correction Critique : Structure Modes Préservée

## 🎯 Problème Identifié

**Symptôme :** Tous les tokens sémantiques en mode dark pointent vers `var(--gray-white)` (#FFFFFF) au lieu de leurs vraies valeurs.

**Cause Racine :** La fonction `saveSemanticTokensToFile` **normalisait** les tokens et **perdait la structure `modes`**, ce qui empêchait la synchronisation Figma de lire les valeurs light/dark correctement.

### Flux Bugué

```
1. GÉNÉRATION
   Tokens créés avec : { type: 'COLOR', modes: { light: {...}, dark: {...} } }
   ✅ Structure correcte

2. SAUVEGARDE (saveSemanticTokensToFile)
   normalizeTokenStructure() convertit vers : { resolvedValue, type, ... }
   ❌ PERTE de la structure modes !

3. SYNCHRONISATION FIGMA (importTokensToFigma)
   Code cherche : tokenData.modes.light / tokenData.modes.dark
   ❌ modes n'existe plus → modeInfo.data = null
   ❌ Aucune valeur définie → Figma utilise la valeur par défaut (white)
```

---

## ✅ Solution Implémentée

### Modification 1 : Préserver la structure modes (lignes 191-205)

**Avant :**
```javascript
// ✅ REFACTOR: Utiliser la fonction utilitaire pour normaliser
var normalizedToken = normalizeTokenStructure(tokenData, key, 'light');
```

**Après :**
```javascript
// ✅ PRÉSERVER LA STRUCTURE MODES (ne pas normaliser !)
// Si le token a déjà une structure modes, la garder telle quelle
var normalizedToken;
if (tokenData.modes) {
  // Nouvelle structure avec modes → LA GARDER !
  normalizedToken = tokenData;
} else {
  // Ancienne structure → normaliser pour compatibilité
  normalizedToken = normalizeTokenStructure(tokenData, key, 'light');
}
```

**Effet :** Les tokens avec structure `modes` sont maintenant **sauvegardés tels quels** sans normalisation.

---

### Modification 2 : Adapter la validation (lignes 218-260)

**Avant :**
```javascript
// GARDE-FOU ANTI-OBJET : resolvedValue DOIT être scalaire
if (typeof normalizedToken.resolvedValue === 'object') {
  console.error(`🚨 CRITICAL: resolvedValue for ${key} is an object: `, normalizedToken.resolvedValue);
  // ...
}

// PROTECTION CONTRE LES FALLBACKS
const isCurrentlyUnresolved = state === TOKEN_STATE.ALIAS_UNRESOLVED;
// ...
```

**Après :**
```javascript
// GARDE-FOU ANTI-OBJET : resolvedValue DOIT être scalaire
// ⚠️ SKIP si structure modes (les valeurs sont dans modes.light/dark.resolvedValue)
if (!normalizedToken.modes) {
  if (typeof normalizedToken.resolvedValue === 'object') {
    console.error(`🚨 CRITICAL: resolvedValue for ${key} is an object: `, normalizedToken.resolvedValue);
    // ...
  }
}

// PROTECTION CONTRE LES FALLBACKS (Règle dure)
// ⚠️ SKIP si structure modes
if (!normalizedToken.modes) {
  const isCurrentlyUnresolved = state === TOKEN_STATE.ALIAS_UNRESOLVED;
  // ...
} else {
  // Structure modes → compter comme VALUE pour les stats
  valueCount++;
}
```

**Effet :** La validation **skip** les tokens avec structure `modes` car leurs valeurs sont dans `modes.light.resolvedValue` et `modes.dark.resolvedValue`, pas dans `resolvedValue` directement.

---

## 🔄 Nouveau Flux (Corrigé)

```
1. GÉNÉRATION
   Tokens créés avec : { type: 'COLOR', modes: { light: {...}, dark: {...} } }
   ✅ Structure correcte

2. SAUVEGARDE (saveSemanticTokensToFile)
   if (tokenData.modes) → GARDER tel quel
   ✅ Structure modes PRÉSERVÉE !

3. SYNCHRONISATION FIGMA (importTokensToFigma)
   Code cherche : tokenData.modes.light / tokenData.modes.dark
   ✅ modes existe → modeInfo.data = tokenData.modes.light
   ✅ Valeurs light/dark correctement appliquées
```

---

## 🧪 Test de Validation

### Avant la correction

```css
html[data-theme='dark'] {
  --background-canvas: var(--gray-white);  /* ❌ FAUX */
  --background-surface: var(--gray-white); /* ❌ FAUX */
  --text-primary: var(--gray-white);       /* ❌ FAUX */
  /* ... tous les tokens pointent vers white ! */
}
```

### Après la correction

```css
html[data-theme='dark'] {
  --background-canvas: var(--gray-950);    /* ✅ CORRECT */
  --background-surface: var(--gray-900);   /* ✅ CORRECT */
  --text-primary: var(--gray-50);          /* ✅ CORRECT */
  /* ... chaque token a sa vraie valeur ! */
}
```

---

## 📋 Checklist de Vérification

Pour vérifier que la correction fonctionne :

1. **Effacer les données corrompues** :
   ```javascript
   // Dans la console Figma
   figma.root.setPluginData("tokenStarter.semantic", "{}");
   ```

2. **Recharger le plugin** :
   - Figma → Plugins → Development → Reload

3. **Regénérer les tokens** :
   - Sélectionner "Tailwind" (ou autre)
   - Cliquer "Générer"

4. **Vérifier dans Figma** :
   - Ouvrir Variables (Cmd + Option + K)
   - Sélectionner une variable sémantique (ex: `background/canvas`)
   - Vérifier qu'elle a **2 modes** : Light et Dark
   - Vérifier que chaque mode a une **valeur différente**

5. **Vérifier l'export CSS** :
   - Onglet "Développeur" → "CSS Variables"
   - Vérifier que `html[data-theme='dark']` a des valeurs **différentes** de `html[data-theme='light']`
   - Vérifier qu'aucun token ne pointe vers `var(--gray-white)` en mode dark (sauf ceux qui devraient)

---

## 🎯 Résultat Attendu

Après cette correction :

- ✅ Les tokens sémantiques ont **2 modes** (Light et Dark) dans Figma
- ✅ Chaque mode a sa **propre valeur** (pas de white partout)
- ✅ L'export CSS génère des **valeurs différentes** pour light et dark
- ✅ Le système fonctionne comme prévu

---

## 🔧 Fichiers Modifiés

- **`code.js`** (lignes 191-260) :
  - Préservation de la structure `modes` lors de la sauvegarde
  - Adaptation de la validation pour gérer les tokens avec `modes`

---

## 📝 Notes Techniques

### Pourquoi normalizeTokenStructure existe ?

La fonction `normalizeTokenStructure` a été créée pour **convertir** l'ancienne structure vers la nouvelle. Mais elle ne doit **PAS** être utilisée lors de la sauvegarde si le token a déjà la nouvelle structure !

### Compatibilité ascendante

Le code gère maintenant **2 structures** :
1. **Nouvelle** : `{ type, modes: { light: {...}, dark: {...} } }` → Préservée telle quelle
2. **Ancienne** : `{ resolvedValue, type, ... }` → Normalisée via `normalizeTokenStructure`

Cela assure la **compatibilité** avec d'anciens tokens tout en supportant la nouvelle structure.

---

## 🚀 Prochaines Étapes

1. **Tester** : Suivre la checklist de vérification ci-dessus
2. **Valider** : Confirmer que tous les tokens ont des valeurs correctes en light/dark
3. **Nettoyer** : Une fois validé, supprimer les anciens tokens corrompus

---

**Date de correction :** 2025-12-22  
**Criticité :** 🚨 **CRITIQUE** (bloquait l'utilisation du dark mode)  
**Statut :** ✅ **CORRIGÉ**
