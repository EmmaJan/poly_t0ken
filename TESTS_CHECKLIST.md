# 🧪 Tests Checklist — Emma Plugin

> **Version**: Post-refacto 31/12/2024
> **Fichiers**: `code.js` (13,022 lignes) + `ui.html` (12,713 lignes)

---

## 🔴 Tests Critiques (P0)

### A. Scan & Détection

| # | Test | Étapes | Résultat attendu | ✓ |
|---|------|--------|------------------|---|
| 1 | Scan Selection vide | Sélectionner rien → Scan | Message "Aucun élément sélectionné" | ☐ |
| 2 | Scan Selection simple | Sélectionner 1 rectangle avec fill hex → Scan | 1 issue détectée (Fill) | ☐ |
| 3 | Scan Selection multiple | Sélectionner 3 éléments → Scan | Issues pour chaque élément | ☐ |
| 4 | Scan Page | Page avec 10+ éléments → Scan Page | Progress bar + résultats complets | ☐ |
| 5 | Scan Frame | Sélectionner 1 frame → Scan Frame | Scan limité au frame | ☐ |

### B. Application de Fixes

| # | Test | Étapes | Résultat attendu | ✓ |
|---|------|--------|------------------|---|
| 6 | Apply Single Fix | Scan → Cliquer "Appliquer" sur 1 issue | Variable appliquée, card disparaît | ☐ |
| 7 | Apply Group Fix | Scan → Sélectionner 3 → "Appliquer groupe" | 3 variables appliquées | ☐ |
| 8 | Apply All Fixes | Scan (5+ issues) → "Appliquer tout" | Toutes les variables appliquées | ☐ |
| 9 | Fix persiste après rescan | Appliquer fix → Re-scanner | L'issue n'apparaît plus | ☐ |

### C. Preview & Rollback

| # | Test | Étapes | Résultat attendu | ✓ |
|---|------|--------|------------------|---|
| 10 | Preview Live | Hover sur suggestion | Élément change temporairement | ☐ |
| 11 | Rollback | Après preview → Cliquer ailleurs | Élément revient à l'original | ☐ |
| 12 | Undo Batch | Appliquer tout → Undo | Tous les éléments restaurés | ☐ |

---

## 🟡 Tests Fonctionnels (P1)

### D. Génération de Tokens

| # | Test | Étapes | Résultat attendu | ✓ |
|---|------|--------|------------------|---|
| 13 | Generate Tailwind | Couleur → Library: Tailwind → Générer | 75 tokens sémantiques créés | ☐ |
| 14 | Generate MUI | Couleur → Library: MUI → Générer | Tokens avec noms MUI | ☐ |
| 15 | Generate Ant | Couleur → Library: Ant → Générer | Tokens avec noms Ant | ☐ |
| 16 | Generate Bootstrap | Couleur → Library: Bootstrap → Générer | Tokens avec noms Bootstrap | ☐ |
| 17 | Generate Chakra | Couleur → Library: Chakra → Générer | Tokens avec noms Chakra | ☐ |

### E. Modes Light/Dark

| # | Test | Étapes | Résultat attendu | ✓ |
|---|------|--------|------------------|---|
| 18 | Light Mode | Générer en Light → Vérifier bg.canvas | gray-50 (clair) | ☐ |
| 19 | Dark Mode | Générer en Dark → Vérifier bg.canvas | gray-950 (foncé) | ☐ |
| 20 | Toggle Preview | Light → Dark dans preview | Couleurs inversées | ☐ |

### F. Types de Propriétés

| # | Type | Étapes | Scope attendu | ✓ |
|---|------|--------|---------------|---|
| 21 | FILL | Rectangle avec fill hex | FILL_COLOR | ☐ |
| 22 | STROKE | Rectangle avec stroke | STROKE_COLOR | ☐ |
| 23 | TEXT_FILL | Text layer couleur | TEXT_FILL | ☐ |
| 24 | CORNER_RADIUS | Rectangle arrondi | CORNER_RADIUS | ☐ |
| 25 | GAP | Auto-layout avec gap | GAP | ☐ |
| 26 | PADDING | Auto-layout avec padding | PADDING | ☐ |
| 27 | STROKE_WEIGHT | Border width | WIDTH_HEIGHT | ☐ |
| 28 | FONT_SIZE | Text avec font-size | FONT_SIZE | ☐ |

---

## 🟢 Tests UI (P2)

### G. Navigation

| # | Test | Étapes | Résultat attendu | ✓ |
|---|------|--------|------------------|---|
| 29 | Wizard Steps | Naviguer 0→1→2→3→4 | Transitions fluides | ☐ |
| 30 | Designer/Dev Toggle | Cliquer Designer ↔ Dev | Vue change | ☐ |
| 31 | Category Tabs | Cliquer Brand/Gray/System/Semantic | Liste change | ☐ |
| 32 | Filter Auto/Manual/All | Cliquer filtres | Cards filtrées correctement | ☐ |

### H. Export

| # | Test | Étapes | Résultat attendu | ✓ |
|---|------|--------|------------------|---|
| 33 | Export CSS | Générer → Export CSS | Variables CSS valides | ☐ |
| 34 | Export JSON | Générer → Export JSON | JSON parsable | ☐ |
| 35 | Export SCSS | Générer → Export SCSS | Variables SCSS valides | ☐ |
| 36 | Export Tailwind | Générer → Export Tailwind | Config Tailwind valide | ☐ |

---

## 🔵 Tests Console (P3)

Ouvrir la console Figma (Plugins → Development → Open Console) et exécuter :

```javascript
// Diagnostic complet
runDuplicationDiagnostic()

// État rapide
pluginState()

// Vérifier les handlers
Object.keys(UI_HANDLERS)
```

### Résultats attendus :

| Commande | Résultat attendu | ✓ |
|----------|------------------|---|
| `runDuplicationDiagnostic()` | 14+ UI_HANDLERS listés | ☐ |
| `pluginState()` | Objet avec step, tokens, naming | ☐ |
| `Scanner.lastScanResults` | Array (peut être vide) | ☐ |

---

## 📋 Procédure de Test Complète

### Avant release :

1. [ ] Exécuter tous les tests P0 (Critiques)
2. [ ] Exécuter tests P1 pour chaque librairie (Tailwind, MUI, Ant, Bootstrap, Chakra)
3. [ ] Vérifier console : aucune erreur rouge
4. [ ] Tester sur fichier Figma réel (pas juste test)

### En cas d'échec :

1. Noter le numéro du test + message d'erreur
2. Vérifier la console Figma
3. Exécuter `runDuplicationDiagnostic()` pour diagnostic

---

## 📊 Historique des Tests

| Date | Testeur | P0 | P1 | P2 | Notes |
|------|---------|----|----|----| ----- |
| 31/12/2024 | - | - | - | - | Checklist créée |

---

*Généré après refacto du 31/12/2024*
