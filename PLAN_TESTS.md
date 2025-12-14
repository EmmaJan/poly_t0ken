# 🧪 PLAN DE TESTS - POLYTOKEN V2.0

## 🎯 Tests Critiques (À faire en priorité)

### 1. Test des Instances Détachées
**Objectif**: Vérifier que le plugin ne crash pas avec des instances dont le composant principal a été supprimé

**Procédure**:
1. Créer un composant dans Figma
2. Créer une instance de ce composant
3. Supprimer le composant principal (main component)
4. Sélectionner la frame contenant l'instance détachée
5. Lancer l'analyse

**Résultat attendu**:
- ✅ Le scan se termine sans erreur
- ✅ L'instance détachée est ignorée avec un log: `"Detached instance detected, skipping"`
- ✅ Les autres nœuds sont analysés normalement

---

### 2. Test des Nœuds Verrouillés
**Objectif**: Vérifier qu'on ne peut pas modifier un calque verrouillé

**Procédure**:
1. Créer une frame avec un rectangle
2. Appliquer une couleur fixe au rectangle (ex: #FF0000)
3. Verrouiller le rectangle (🔒)
4. Lancer l'analyse
5. Tenter d'appliquer une variable au rectangle verrouillé

**Résultat attendu**:
- ✅ Le scan détecte le rectangle
- ✅ L'application de la variable échoue avec erreur: `"Cannot modify locked node"`
- ✅ Un toast d'erreur s'affiche
- ✅ Les autres nœuds non verrouillés sont modifiés

---

### 3. Test de Memory Leak
**Objectif**: Vérifier que la mémoire est bien nettoyée après scan

**Procédure**:
1. Créer une frame avec 500+ nœuds
2. Lancer l'analyse
3. Attendre 6 secondes après la fin du scan
4. Vérifier les logs de la console

**Résultat attendu**:
- ✅ Log après ~5 secondes: `"[Scanner] 🧹 Memory cleaned"`
- ✅ Pas de ralentissement après plusieurs scans successifs
- ✅ La mémoire du plugin reste stable

---

### 4. Test du Cache de Variables
**Objectif**: Vérifier que le cache fonctionne et améliore les performances

**Procédure**:
1. Lancer un premier scan (cache vide)
2. Noter le temps d'exécution
3. Lancer un second scan dans les 30 secondes (cache actif)
4. Noter le temps d'exécution
5. Attendre 35 secondes
6. Lancer un troisième scan (cache expiré)

**Résultat attendu**:
- ✅ Scan 1: Log `"Initializing value to variable map"`
- ✅ Scan 2: Log `"Using cached valueMap"` + **plus rapide**
- ✅ Scan 3: Log `"Initializing value to variable map"` (cache expiré)

---

## 🎨 Tests UX/UI

### 5. Test des Badges Exact/Approx
**Objectif**: Vérifier l'affichage des badges visuels

**Procédure**:
1. Créer une frame avec:
   - Un rectangle avec couleur exacte d'une variable (ex: #8AD53F)
   - Un rectangle avec couleur proche (ex: #8BD540)
2. Lancer l'analyse
3. Vérifier l'affichage dans l'onglet "Auto"

**Résultat attendu**:
- ✅ Badge vert `"✓ EXACT"` pour la correspondance exacte
- ✅ Badge orange `"≈ APPROX"` pour la correspondance approximative
- ✅ Styles corrects (couleurs, bordures, padding)

---

### 6. Test des Toasts Premium
**Objectif**: Vérifier les notifications toast

**Procédure**:
1. Appliquer une correction avec succès
2. Observer l'animation du toast
3. Tenter une correction qui échoue (ex: nœud verrouillé)

**Résultat attendu**:
- ✅ Toast success: slide-in depuis le bas, icône ✓, bordure verte
- ✅ Toast error: slide-in depuis le bas, icône ✕, bordure rouge
- ✅ Auto-dismiss après 3 secondes
- ✅ Animation fluide (cubic-bezier)

---

### 7. Test de la Progression du Scan
**Objectif**: Vérifier le feedback pendant le scan

**Procédure**:
1. Créer une frame avec 100+ nœuds
2. Lancer l'analyse
3. Observer l'UI pendant le scan

**Résultat attendu**:
- ✅ Message de progression affiché tous les 10 nœuds
- ✅ Compteur mis à jour en temps réel
- ✅ UI ne gèle pas pendant le scan

---

### 8. Test de l'Animation Success Ripple
**Objectif**: Vérifier l'animation de succès sur les cards

**Procédure**:
1. Lancer une analyse
2. Appliquer une correction
3. Observer la card correspondante

**Résultat attendu**:
- ✅ Animation de ripple verte autour de la card
- ✅ Durée: 0.6s
- ✅ Card reste visible après l'animation

---

## 📐 Tests des Espacements (Règle des 8px)

### 9. Test Visuel des Espacements
**Objectif**: Vérifier que tous les espacements sont multiples de 8px

**Procédure**:
1. Ouvrir le plugin
2. Inspecter avec DevTools les éléments suivants:
   - Input fields
   - Buttons
   - Cards
   - Grilles

**Résultat attendu**:
- ✅ Padding des inputs: 12px 16px
- ✅ Padding des boutons: 12px 24px
- ✅ Padding des cards: 16px
- ✅ Gap des grilles: 16px
- ✅ Margin-bottom: 16px partout

**Outil de vérification**:
```javascript
// Dans la console DevTools
function checkSpacing(element) {
  const styles = getComputedStyle(element);
  const padding = parseInt(styles.padding);
  const margin = parseInt(styles.margin);
  console.log('Padding:', padding, padding % 8 === 0 ? '✅' : '❌');
  console.log('Margin:', margin, margin % 8 === 0 ? '✅' : '❌');
}

// Exemple
checkSpacing(document.querySelector('.cleaning-result-card'));
```

---

## ⚡ Tests de Performance

### 10. Test de Scan sur Gros Projet
**Objectif**: Vérifier les performances sur un projet réel

**Procédure**:
1. Créer une frame avec 1000+ nœuds imbriqués
2. Lancer l'analyse
3. Mesurer le temps d'exécution
4. Vérifier la fluidité de l'UI

**Résultat attendu**:
- ✅ Scan complété en moins de 5 secondes
- ✅ UI reste responsive
- ✅ Pas de freeze
- ✅ Progression affichée

---

### 11. Test de Scans Successifs
**Objectif**: Vérifier qu'il n'y a pas de dégradation de performance

**Procédure**:
1. Lancer 5 scans successifs sur la même frame
2. Noter le temps de chaque scan
3. Vérifier la mémoire utilisée

**Résultat attendu**:
- ✅ Temps similaire pour chaque scan (grâce au cache)
- ✅ Pas d'accumulation de mémoire
- ✅ Nettoyage automatique entre les scans

---

## 🔧 Tests de Régression

### 12. Test des Fonctionnalités Existantes
**Objectif**: S'assurer que rien n'est cassé

**Checklist**:
- [ ] Génération de tokens fonctionne
- [ ] Import de tokens fonctionne
- [ ] Export CSS/JSON fonctionne
- [ ] Sélection de librairie fonctionne
- [ ] Navigation entre les steps fonctionne
- [ ] Boutons "Retour" fonctionnent
- [ ] Sticky footer s'affiche correctement

---

## 📊 Tableau de Suivi des Tests

| # | Test | Statut | Date | Notes |
|---|------|--------|------|-------|
| 1 | Instances détachées | ⏳ À tester | - | - |
| 2 | Nœuds verrouillés | ⏳ À tester | - | - |
| 3 | Memory leak | ⏳ À tester | - | - |
| 4 | Cache variables | ⏳ À tester | - | - |
| 5 | Badges Exact/Approx | ⏳ À tester | - | - |
| 6 | Toasts premium | ⏳ À tester | - | - |
| 7 | Progression scan | ⏳ À tester | - | - |
| 8 | Success ripple | ⏳ À tester | - | - |
| 9 | Espacements 8px | ⏳ À tester | - | - |
| 10 | Gros projet | ⏳ À tester | - | - |
| 11 | Scans successifs | ⏳ À tester | - | - |
| 12 | Régression | ⏳ À tester | - | - |

**Légende**:
- ⏳ À tester
- ✅ Passé
- ❌ Échoué
- 🔄 En cours

---

## 🐛 Bugs Connus à Surveiller

### Potentiels
1. **figma.mixed sur cornerRadius**: Peut causer un crash si non géré
2. **Appels getNodeById multiples**: Peut ralentir sur gros projets
3. **Toast overlap**: Si plusieurs toasts en même temps

### À vérifier
- Comportement avec des frames très imbriquées (depth > 50)
- Comportement avec des noms de variables contenant des caractères spéciaux
- Comportement en mode responsive (fenêtre < 400px)

---

## 📝 Rapport de Test (Template)

```markdown
## Test: [Nom du test]
**Date**: YYYY-MM-DD
**Testeur**: [Nom]
**Version**: 2.0

### Configuration
- Figma version: 
- Nombre de nœuds: 
- Nombre de variables: 

### Résultats
- [ ] Test passé
- [ ] Test échoué

### Observations
[Notes détaillées]

### Captures d'écran
[Si applicable]

### Actions requises
[Si bugs trouvés]
```

---

**Dernière mise à jour**: 2025-12-12
**Priorité**: 🔴 HAUTE - Tests critiques à faire avant déploiement
