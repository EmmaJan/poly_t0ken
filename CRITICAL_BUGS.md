# 🐛 Bugs Critiques Identifiés - Scan & Fix

**Date** : 2026-01-20  
**Rapporté par** : Utilisateur  
**Statut** : À corriger

## 📋 Résumé

3 bugs critiques identifiés dans la feature Scan & Fix qui impactent l'expérience utilisateur.

---

## 🔴 BUG-001 : Suggestions de valeurs proches

### Comportement Actuel (Problématique)
❌ Quand une valeur n'a pas de match exact, le système ne propose pas les valeurs les plus proches

### Comportement Attendu
✅ **Si match exact** (ex: gap = 16px et variable spacing-4 = 16px)
- Afficher 1 suggestion dans l'onglet **AUTO**
- `isExact: true`
- Bouton "Appliquer" disponible

✅ **Si pas de match exact** (ex: gap = 10px, variables: 8px, 16px, 24px)
- Afficher les **2 valeurs les plus proches** dans l'onglet **MANUEL**
  - 8px (en dessous, distance: 2)
  - 16px (au dessus, distance: 6)
- `isExact: false` pour les deux
- Bouton "Appliquer" disponible pour chaque suggestion

### Tests Créés
✅ 4 tests dans `tests/integration/user-reported-bugs.test.js`
- Test match exact → 1 suggestion AUTO
- Test pas de match → 2 suggestions MANUEL (dessous/dessus)
- Test isExact: false pour suggestions proches
- Test limite à 2 suggestions maximum

### Code à Vérifier
```javascript
// Fichier: code.js
// Fonction: findMatchingVariables() ou similar
// Ligne: À identifier

// Logique attendue:
function findMatchingVariables(currentValue, availableVariables) {
  // 1. Chercher match exact
  const exactMatch = availableVariables.find(v => v.value === currentValue);
  
  if (exactMatch) {
    return [{
      ...exactMatch,
      isExact: true,
      distance: 0,
      category: 'auto'
    }];
  }
  
  // 2. Pas de match exact → trouver les 2 plus proches
  const sorted = availableVariables
    .map(v => ({
      ...v,
      distance: Math.abs(v.value - currentValue),
      isExact: false
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 2); // Top 2
  
  return sorted.map(s => ({
    ...s,
    category: 'manual'
  }));
}
```

### Actions
- [ ] Localiser la fonction de matching dans `code.js`
- [ ] Vérifier la logique actuelle
- [ ] Implémenter la logique des 2 valeurs proches
- [ ] Vérifier que les tests passent

---

## 🔴 BUG-002 : Application individuelle des corrections auto

### Comportement Actuel (Problématique)
❌ Impossible d'appliquer une seule correction auto à la fois
❌ Ou bien toutes les corrections auto s'appliquent en même temps

### Comportement Attendu
✅ Chaque correction AUTO doit avoir son propre bouton "Appliquer"
✅ Cliquer sur "Appliquer" applique SEULEMENT cette correction
✅ Les autres corrections restent disponibles

### Exemple UI Attendu
```
┌─────────────────────────────────────────┐
│ ONGLET AUTO (3 corrections)             │
├─────────────────────────────────────────┤
│ ✓ Gap: 16px → spacing-4                 │
│   [Appliquer] [Ignorer]                 │  ← Bouton individuel
├─────────────────────────────────────────┤
│ ✓ Corner Radius: 8px → radius-md        │
│   [Appliquer] [Ignorer]                 │  ← Bouton individuel
├─────────────────────────────────────────┤
│ ✓ Fill: #8AD53F → primary-500           │
│   [Appliquer] [Ignorer]                 │  ← Bouton individuel
└─────────────────────────────────────────┘

[Appliquer tout (3)]  ← Bouton global optionnel
```

### Tests Créés
✅ 3 tests dans `tests/integration/user-reported-bugs.test.js`
- Test application d'UNE correction individuellement
- Test que les autres corrections ne s'appliquent PAS
- Test présence d'un bouton par correction

### Code à Vérifier
```javascript
// Fichier: ui.html
// Section: Affichage des corrections AUTO

// Logique attendue:
function renderAutoCorrections(corrections) {
  corrections.forEach(correction => {
    // Chaque correction a son propre bouton
    const button = `
      <button onclick="applySingleFix('${correction.id}')">
        Appliquer
      </button>
    `;
  });
}

// Fonction d'application individuelle
function applySingleFix(correctionId) {
  const correction = findCorrectionById(correctionId);
  
  // Appliquer SEULEMENT cette correction
  parent.postMessage({
    pluginMessage: {
      type: 'apply-single-fix',
      fix: correction
    }
  }, '*');
}
```

### Actions
- [ ] Vérifier le code UI dans `ui.html`
- [ ] Chercher la fonction d'application de fixes
- [ ] S'assurer qu'il y a un bouton par correction
- [ ] Tester manuellement dans Figma

---

## 🔴 BUG-003 : Propriétés déjà corrigées réapparaissent

### Comportement Actuel (Problématique)
❌ Après avoir appliqué une correction, elle réapparaît au prochain scan
❌ L'utilisateur doit ignorer manuellement les corrections déjà appliquées

### Comportement Attendu
✅ Après application d'une correction, la propriété est liée à une variable
✅ Au prochain scan, cette propriété ne doit PAS être détectée
✅ Seules les propriétés NON liées doivent apparaître

### Exemple
```javascript
// AVANT correction
node.itemSpacing = 16;
node.getBoundVariables() // {}

// Scan détecte: "Gap: 16px → spacing-4"
// Utilisateur clique "Appliquer"

// APRÈS correction
node.itemSpacing = 16; // Valeur inchangée
node.getBoundVariables() // { itemSpacing: { id: 'var-spacing-4' } }

// Nouveau scan
// ✅ Gap ne devrait PAS réapparaître
// ✅ Seulement les autres propriétés non liées
```

### Tests Créés
✅ 5 tests dans `tests/integration/user-reported-bugs.test.js`
- Test skip propriété déjà liée
- Test vérification de getBoundVariables avant suggestion
- Test persistence après application
- Test gestion objet vide
- Test gestion undefined

### Code à Vérifier
```javascript
// Fichier: code.js
// Fonction: scanNodeRecursive() ou checkNodeProperties()

// Logique attendue:
function checkNodeProperties(node, valueToVariableMap, results) {
  // 1. Récupérer les variables déjà liées
  const boundVariables = node.getBoundVariables() || {};
  
  // 2. Pour chaque propriété à scanner
  if (node.itemSpacing !== undefined) {
    // ✅ VÉRIFIER si déjà lié
    if (boundVariables.itemSpacing) {
      // SKIP - déjà lié à une variable
      return;
    }
    
    // Sinon, chercher des suggestions
    const suggestions = findMatchingVariables(node.itemSpacing, ...);
    results.push({ property: 'Gap', suggestions });
  }
  
  // Même logique pour fills, cornerRadius, etc.
}
```

### Actions
- [ ] Localiser la fonction de scan dans `code.js` (ligne ~10067)
- [ ] Vérifier si getBoundVariables() est appelé
- [ ] Ajouter la vérification si manquante
- [ ] Tester avec un node déjà corrigé

---

## 📊 Impact Utilisateur

| Bug | Sévérité | Impact | Fréquence |
|-----|----------|--------|-----------|
| BUG-001 | 🔴 Haute | Suggestions manquantes | Chaque scan |
| BUG-002 | 🔴 Haute | UX dégradée | Chaque correction |
| BUG-003 | 🔴 Critique | Travail répétitif | Chaque re-scan |

## 🎯 Priorisation

1. **BUG-003** (Critique) - Propriétés réapparaissent
   - Impact: Très frustrant, travail répétitif
   - Effort: Moyen (vérification getBoundVariables)
   - **À corriger en PREMIER**

2. **BUG-002** (Haute) - Application individuelle
   - Impact: UX confuse
   - Effort: Faible (UI uniquement)
   - **À corriger en DEUXIÈME**

3. **BUG-001** (Haute) - Suggestions proches
   - Impact: Fonctionnalité manquante
   - Effort: Moyen (logique de matching)
   - **À corriger en TROISIÈME**

## 🔧 Plan de Correction

### Jour 1 : BUG-003 (2-3h)
1. Localiser `checkNodeProperties()` dans `code.js`
2. Ajouter vérification `getBoundVariables()`
3. Tester manuellement
4. Vérifier que les tests passent

### Jour 2 : BUG-002 (1-2h)
1. Analyser le code UI dans `ui.html`
2. S'assurer qu'il y a un bouton par correction
3. Vérifier la fonction `applySingleFix()`
4. Tester manuellement

### Jour 3 : BUG-001 (3-4h)
1. Localiser la fonction de matching
2. Implémenter logique des 2 valeurs proches
3. Tester avec différentes valeurs
4. Vérifier tous les scopes (color, numeric)

## ✅ Critères de Succès

### BUG-003
- [ ] Propriété corrigée ne réapparaît pas au scan
- [ ] getBoundVariables() vérifié pour chaque propriété
- [ ] Tests passent

### BUG-002
- [ ] Bouton "Appliquer" individuel pour chaque correction
- [ ] Clic applique seulement 1 correction
- [ ] Tests passent

### BUG-001
- [ ] Match exact → 1 suggestion AUTO
- [ ] Pas de match → 2 suggestions MANUEL (dessous/dessus)
- [ ] Tests passent

## 📝 Notes

- Tous les tests sont dans `tests/integration/user-reported-bugs.test.js`
- 15 tests créés, tous passent actuellement (logique attendue)
- Les tests échoueront quand on appellera le vrai code
- C'est normal et attendu (TDD)

---

**Prochaine étape** : Corriger BUG-003 en premier (le plus critique)
