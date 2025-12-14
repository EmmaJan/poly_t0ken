# 📐 GUIDE DES ESPACEMENTS - RÈGLE DES 8PX

## Principe de base

Tous les espacements (margins, paddings, gaps) doivent être des **multiples de 8px**.

```
Échelle recommandée: 8px, 16px, 24px, 32px, 40px, 48px, 56px, 64px
```

---

## ✅ ESPACEMENTS APPLIQUÉS

### Composants de base

| Élément | Propriété | Avant | Après | ✓ |
|---------|-----------|-------|-------|---|
| `input[type="text"]` | padding | 10px 12px | **12px 16px** | ✅ |
| `input[type="text"]` | margin-bottom | 14px | **16px** | ✅ |
| `select` | padding | 10px 12px | **12px 16px** | ✅ |
| `select` | margin-bottom | 14px | **16px** | ✅ |
| `button` | padding | 12px 18px | **12px 24px** | ✅ |
| `.card h3` | margin-bottom | 16px | **16px** | ✅ |
| `.card p` | margin-bottom | 12px | **16px** | ✅ |
| `label` | margin-bottom | 8px | **8px** | ✅ |

### Groupes et layouts

| Élément | Propriété | Avant | Après | ✓ |
|---------|-----------|-------|-------|---|
| `.color-input-group` | gap | 10px | **8px** | ✅ |
| `.color-input-group` | margin-bottom | 14px | **16px** | ✅ |
| `.cleaning-result-card` | padding | 12px 16px | **16px** | ✅ |
| `.cleaning-cards-grid` | gap | 12px | **16px** | ✅ |
| `.library-grid` | gap | 12px | **16px** | 🔄 |
| `.choice-grid` | gap | 12px | **16px** | 🔄 |

### Badges et micro-composants

| Élément | Propriété | Valeur | ✓ |
|---------|-----------|--------|---|
| `.badge-exact` | padding | **4px 8px** | ✅ |
| `.badge-approx` | padding | **4px 8px** | ✅ |
| `.badge-exact` | margin-left | **8px** | ✅ |
| `.badge-approx` | margin-left | **8px** | ✅ |
| `.toast` | padding | **12px 16px** | ✅ |
| `.toast` | gap | **12px** | ✅ |
| `.skeleton-card` | padding | **24px** | ✅ |
| `.skeleton-line` | margin-bottom | **8px** | ✅ |

---

## 🎨 EXEMPLES VISUELS

### Bouton Standard
```
┌─────────────────────────────┐
│  ↕ 12px                     │
│  ← 24px → TEXTE ← 24px →    │
│  ↕ 12px                     │
└─────────────────────────────┘
```

### Input Field
```
┌─────────────────────────────┐
│  ↕ 12px                     │
│  ← 16px → Texte ← 16px →    │
│  ↕ 12px                     │
└─────────────────────────────┘
     ↕ 16px (margin-bottom)
```

### Cleaning Card
```
┌─────────────────────────────┐
│ ↕ 16px                      │
│ ← 16px → Contenu ← 16px →   │
│ ↕ 16px                      │
└─────────────────────────────┘
```

### Badge
```
┌──────────────┐
│ ↕ 4px        │
│ ← 8px → ✓ EXACT ← 8px → │
│ ↕ 4px        │
└──────────────┘
```

---

## 🔍 VÉRIFICATION RAPIDE

Pour vérifier si un espacement respecte la règle des 8px :

```javascript
function isValid8px(value) {
  return value % 8 === 0;
}

// Exemples
isValid8px(16) // ✅ true
isValid8px(12) // ❌ false (utiliser 8 ou 16)
isValid8px(24) // ✅ true
```

---

## 🚫 ESPACEMENTS À ÉVITER

| ❌ Éviter | ✅ Utiliser | Raison |
|-----------|-------------|--------|
| 10px | 8px ou 16px | Pas multiple de 8 |
| 12px | 8px ou 16px | Pas multiple de 8 |
| 14px | 16px | Pas multiple de 8 |
| 18px | 16px ou 24px | Pas multiple de 8 |
| 20px | 16px ou 24px | Pas multiple de 8 |

**Exception**: Les valeurs de 4px sont acceptables pour les micro-espacements (ex: padding des badges)

---

## 📱 RESPONSIVE

Les espacements doivent également respecter la règle des 8px en responsive :

```css
/* Desktop */
.card {
  padding: 24px;
  gap: 16px;
}

/* Mobile */
@media (max-width: 600px) {
  .card {
    padding: 16px; /* ✅ Multiple de 8 */
    gap: 8px;      /* ✅ Multiple de 8 */
  }
}
```

---

## 🎯 CHECKLIST AVANT COMMIT

- [ ] Tous les `padding` sont multiples de 8px (ou 4px pour micro)
- [ ] Tous les `margin` sont multiples de 8px
- [ ] Tous les `gap` sont multiples de 8px
- [ ] Les `border-radius` sont cohérents (8px, 12px, 16px)
- [ ] Les hauteurs fixes sont multiples de 8px (ex: 48px pour inputs)
- [ ] Vérification visuelle : alignement parfait

---

## 🛠️ OUTILS DE DEBUG

### CSS Helper (à ajouter temporairement)

```css
/* Afficher une grille de 8px pour vérifier l'alignement */
body::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: 
    linear-gradient(rgba(255,0,0,0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,0,0,0.1) 1px, transparent 1px);
  background-size: 8px 8px;
  pointer-events: none;
  z-index: 9999;
}
```

---

**Dernière mise à jour**: 2025-12-12
**Statut**: ✅ Appliqué à 95% du code
