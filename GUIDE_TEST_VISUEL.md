# 🎬 GUIDE DE TEST VISUEL - CORRECTIONS PREMIUM

## 🎯 Comment Tester les 3 Corrections

---

## ✅ TEST 1 : Toast d'Annulation

### Scénario
Vérifier que le toast affiche les vraies valeurs au lieu de `--`

### Étapes
1. **Créer une frame de test**
   ```
   Frame "Test Toast"
   └── Rectangle (couleur: #8AD53F)
   ```

2. **Lancer l'analyse**
   - Cliquer sur "Lancer l'analyse"
   - Attendre les résultats

3. **Appliquer une correction**
   - Cliquer sur le bouton vert de la variable suggérée
   - Observer l'animation du bouton (✓)

4. **Vérifier le toast**
   - Un toast apparaît en bas à droite
   - **AVANT** : Affichait `-- → --`
   - **APRÈS** : Affiche `#8AD53F → primary-500` (ou similaire)

### Résultat Attendu
```
┌─────────────────────────────────────┐
│ 🔄 Annuler                          │
│ #8AD53F → primary-500               │
│ [Annuler]                           │
└─────────────────────────────────────┘
```

### ❌ Si ça ne marche pas
- Vérifier que `data-current-value` et `data-variable-name` sont présents sur la `.compact-row`
- Ouvrir la console et chercher les erreurs
- Vérifier que `getAttribute()` est bien utilisé

---

## ✅ TEST 2 : Jauge de Progression

### Scénario
Vérifier que la jauge glisse de manière fluide au lieu de sauter

### Étapes
1. **Créer une frame avec 20 problèmes**
   ```
   Frame "Test Jauge"
   ├── Rectangle 1 (couleur: #FF0000)
   ├── Rectangle 2 (couleur: #00FF00)
   ├── Rectangle 3 (couleur: #0000FF)
   └── ... (17 autres rectangles avec couleurs variées)
   ```

2. **Lancer l'analyse**
   - Observer la jauge à 0%
   - Attendre les résultats

3. **Appliquer des corrections**
   - Appliquer 5 corrections
   - **Observer la jauge**

4. **Vérifier l'animation**
   - **AVANT** : La jauge sautait de 0% → 25% instantanément
   - **APRÈS** : La jauge glisse doucement de 0% → 25% en 1 seconde

### Résultat Attendu
```
Animation fluide :
0% ──────────────────────────────────▶ 25%
   (transition de 1 seconde)
```

### Test de Réinitialisation
1. Appliquer toutes les corrections (100%)
2. Relancer une nouvelle analyse
3. **Vérifier** : La jauge repart bien de 0%

### ❌ Si ça ne marche pas
- Vérifier que la transition CSS est appliquée : `transition: stroke-dashoffset 1s ease-out`
- Vérifier que `initialProblemCount = 0` est bien exécuté au clic
- Inspecter le cercle SVG avec DevTools

---

## ✅ TEST 3 : Skeleton Loading

### Scénario
Vérifier que le skeleton s'affiche pendant le chargement

### Étapes
1. **Créer une grosse frame** (pour ralentir le scan)
   ```
   Frame "Test Skeleton"
   └── 100+ rectangles imbriqués
   ```

2. **Lancer l'analyse**
   - Cliquer sur "Lancer l'analyse"
   - **Observer immédiatement**

3. **Vérifier le skeleton**
   - **AVANT** : Écran blanc pendant 2-3 secondes
   - **APRÈS** : 5 cartes skeleton apparaissent instantanément

4. **Observer l'effet shimmer**
   - Les lignes grises "brillent" de gauche à droite
   - Animation continue jusqu'à l'arrivée des résultats

### Résultat Attendu
```
┌─────────────────────────────────────┐
│ ████████████░░░░░░░░░░░░░░░░░░░░░░ │ (60%)
│ ████████████████████░░░░░░░░░░░░░░ │ (80%)
│ ████████░░░░░░░░░░░░░░░░░░░░░░░░░░ │ (40%)
└─────────────────────────────────────┘
   ↑ Effet shimmer animé
```

### Timing
- **0ms** : Clic sur "Lancer l'analyse"
- **10ms** : Skeleton apparaît
- **500-2000ms** : Résultats arrivent et remplacent le skeleton

### ❌ Si ça ne marche pas
- Vérifier que `showSkeleton()` est bien appelée dans `showScanLoading()`
- Vérifier que `#unifiedCleaningList` existe
- Vérifier que les styles `.skeleton-card` et `.skeleton-line` sont présents

---

## 🎨 CHECKLIST VISUELLE COMPLÈTE

### Avant de Tester
- [ ] Plugin rechargé dans Figma
- [ ] Console DevTools ouverte
- [ ] Frame de test créée

### Test 1 : Toast
- [ ] Toast apparaît après application
- [ ] Valeur actuelle affichée (ex: `#8AD53F`)
- [ ] Variable suggérée affichée (ex: `primary-500`)
- [ ] Bouton "Annuler" fonctionne
- [ ] Toast disparaît après 4 secondes

### Test 2 : Jauge
- [ ] Jauge à 0% au démarrage
- [ ] Animation fluide (pas de saut)
- [ ] Transition de 1 seconde visible
- [ ] Couleur change selon le pourcentage
- [ ] Réinitialisation à 0% au nouveau scan

### Test 3 : Skeleton
- [ ] 5 cartes skeleton affichées
- [ ] Effet shimmer visible
- [ ] Animation continue
- [ ] Skeleton remplacé par les résultats
- [ ] Pas d'écran blanc

---

## 🐛 DÉBOGAGE

### Toast affiche toujours `--`
```javascript
// Dans la console DevTools
var card = document.querySelector('.compact-row');
console.log(card.getAttribute('data-current-value')); // Doit afficher la valeur
console.log(card.getAttribute('data-variable-name')); // Doit afficher le nom
```

### Jauge ne glisse pas
```javascript
// Dans la console DevTools
var ring = document.getElementById('progressRing');
console.log(getComputedStyle(ring).transition); // Doit contenir "stroke-dashoffset"
```

### Skeleton ne s'affiche pas
```javascript
// Dans la console DevTools
var list = document.getElementById('unifiedCleaningList');
console.log(list.innerHTML); // Doit contenir des .skeleton-card
```

---

## 📊 TABLEAU DE VALIDATION

| Test | Élément | Attendu | Statut |
|------|---------|---------|--------|
| Toast | Valeur actuelle | `#8AD53F` | ⏳ |
| Toast | Variable | `primary-500` | ⏳ |
| Toast | Disparition | 4 secondes | ⏳ |
| Jauge | Animation | Fluide 1s | ⏳ |
| Jauge | Réinitialisation | 0% au scan | ⏳ |
| Skeleton | Affichage | Immédiat | ⏳ |
| Skeleton | Shimmer | Visible | ⏳ |
| Skeleton | Remplacement | Automatique | ⏳ |

**Légende** : ⏳ À tester | ✅ Validé | ❌ Échoué

---

## 🎥 CAPTURES D'ÉCRAN RECOMMANDÉES

### 1. Toast Fonctionnel
Capturer le toast avec les vraies valeurs affichées

### 2. Jauge en Animation
Capturer la jauge à 50% pendant la transition

### 3. Skeleton Loading
Capturer les 5 cartes skeleton avec l'effet shimmer

---

**Temps estimé de test** : 10-15 minutes
**Niveau de difficulté** : ⭐⭐ Facile
**Prérequis** : Plugin rechargé, frame de test prête
