# Tokens Stricts par Librairie - Référence Officielle

## 1. MUI (Material-UI) - Structure Stricte

### Palette (Obligatoire)
```javascript
palette: {
  // Primary (4 tokens)
  primary: { main, light, dark, contrastText },
  
  // Secondary (4 tokens)
  secondary: { main, light, dark, contrastText },
  
  // Error (4 tokens)
  error: { main, light, dark, contrastText },
  
  // Warning (4 tokens)
  warning: { main, light, dark, contrastText },
  
  // Info (4 tokens)
  info: { main, light, dark, contrastText },
  
  // Success (4 tokens)
  success: { main, light, dark, contrastText },
  
  // Grey (10 tokens)
  grey: { 50, 100, 200, 300, 400, 500, 600, 700, 800, 900 },
  
  // Common (2 tokens)
  common: { black, white },
  
  // Text (3 tokens)
  text: { primary, secondary, disabled },
  
  // Background (2 tokens)
  background: { default, paper },
  
  // Action (6 tokens)
  action: { active, hover, selected, disabled, disabledBackground, focus },
  
  // Divider (1 token)
  divider
}

// Shape (1 token)
shape: { borderRadius }

// Spacing (fonction, pas de tokens directs)
// Typography (structure complexe, pas de tokens simples)
```

**Total MUI : ~50 tokens**

---

## 2. Ant Design v5 - Structure Stricte

### Seed Tokens (Fondation)
```javascript
{
  colorPrimary,
  colorSuccess,
  colorWarning,
  colorError,
  colorInfo,
  colorTextBase,
  colorBgBase,
  
  fontSize,
  borderRadius
}
```

### Map Tokens (Dérivés)
```javascript
{
  // Primary Colors
  colorPrimaryBg,
  colorPrimaryBgHover,
  colorPrimaryBorder,
  colorPrimaryBorderHover,
  colorPrimaryHover,
  colorPrimaryActive,
  colorPrimaryTextHover,
  colorPrimaryText,
  colorPrimaryTextActive
}
```

### Alias Tokens (UI Spécifiques)
```javascript
{
  // Background
  colorBgContainer,
  colorBgElevated,
  colorBgLayout,
  colorBgSpotlight,
  colorBgMask,
  
  // Text
  colorText,
  colorTextSecondary,
  colorTextTertiary,
  colorTextQuaternary,
  colorTextDisabled,
  
  // Border
  colorBorder,
  colorBorderSecondary,
  
  // Fill
  colorFill,
  colorFillSecondary,
  colorFillTertiary,
  colorFillQuaternary,
  
  // Component Tokens
  controlHeight,
  controlHeightSM,
  controlHeightLG,
  lineWidth,
  lineType,
  
  // Motion
  motionDurationSlow,
  motionDurationMid,
  motionDurationFast,
  motionEaseInOut,
  motionEaseOut,
  motionEaseIn
}
```

**Total Ant Design : ~60 tokens**

---

## 3. Bootstrap 5 - Variables Sass Strictes

### Theme Colors (8 tokens)
```scss
$primary
$secondary
$success
$info
$warning
$danger
$light
$dark
```

### Body (4 tokens)
```scss
$body-bg
$body-color
$body-secondary-bg
$body-secondary-color
```

### Typography (6 tokens)
```scss
$font-family-base
$font-size-base
$font-size-sm
$font-size-lg
$font-weight-base
$font-weight-bold
```

### Spacing (1 token + multiplicateurs)
```scss
$spacer  // Base unit (1rem = 16px)
// Utilisé avec multiplicateurs: 0, 1, 2, 3, 4, 5
```

### Borders (4 tokens)
```scss
$border-width
$border-color
$border-radius
$border-radius-sm
$border-radius-lg
$border-radius-pill
```

### Links (2 tokens)
```scss
$link-color
$link-decoration
```

### Grid (optionnel mais recommandé)
```scss
$grid-columns
$grid-gutter-width
$grid-breakpoints
```

**Total Bootstrap : ~30 tokens essentiels**

---

## 4. Chakra UI - Structure Stricte

### Colors (Semantic Tokens)
```javascript
colors: {
  // Brand colors (scale 50-950)
  brand: { 50, 100, 200, ..., 900, 950 },
  
  // Gray colors (scale 50-950)
  gray: { 50, 100, 200, ..., 900, 950 },
  
  // Semantic colors
  bg: { canvas, default, subtle, muted, emphasized },
  fg: { default, muted, subtle, onAccent },
  border: { default, muted, emphasized },
  
  // Status colors
  success: { solid, contrast, fg, muted, subtle, emphasized },
  error: { solid, contrast, fg, muted, subtle, emphasized },
  warning: { solid, contrast, fg, muted, subtle, emphasized },
  info: { solid, contrast, fg, muted, subtle, emphasized }
}
```

### Sizes (Numeric Scale)
```javascript
sizes: {
  xs, sm, md, lg, xl, 2xl, 3xl, 4xl,
  full, min, max, fit
}
```

### Space (Numeric Scale - Tailwind-inspired)
```javascript
space: {
  0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 7, 8, 9, 10,
  12, 14, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60, 64, 72, 80, 96
}
```

### Radii
```javascript
radii: {
  none, sm, base, md, lg, xl, 2xl, 3xl, full
}
```

**Total Chakra : ~100+ tokens (très extensible)**

---

## 5. Tailwind/Shadcn - Structure Stricte

### Colors (Palette complète)
```javascript
colors: {
  // Gray scale (11 tokens)
  gray: { 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950 },
  
  // Brand/Primary (11 tokens)
  primary: { 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950 },
  
  // Semantic colors
  background, foreground, card, 'card-foreground',
  popover, 'popover-foreground', primary, 'primary-foreground',
  secondary, 'secondary-foreground', muted, 'muted-foreground',
  accent, 'accent-foreground', destructive, 'destructive-foreground',
  border, input, ring
}
```

### Spacing (Tailwind scale)
```javascript
spacing: {
  0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16,
  20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60, 64, 72, 80, 96
}
```

### Border Radius
```javascript
borderRadius: {
  none, sm, DEFAULT, md, lg, xl, 2xl, 3xl, full
}
```

**Total Tailwind/Shadcn : ~80 tokens**

---

## Résumé des Tokens par Librairie

| Librairie | Tokens Essentiels | Tokens Optionnels | Total |
|-----------|-------------------|-------------------|-------|
| **MUI** | 50 | 20 | ~70 |
| **Ant Design** | 40 | 20 | ~60 |
| **Bootstrap** | 30 | 15 | ~45 |
| **Chakra UI** | 60 | 40 | ~100 |
| **Tailwind/Shadcn** | 50 | 30 | ~80 |

---

## Tokens à SUPPRIMER (En trop)

### MUI
- ❌ `palette/background/level1` (non-standard)
- ❌ `palette/background/level2` (non-standard)
- ❌ `shape/borderRadius` → Devrait être `shape.borderRadius` (objet, pas token direct)
- ❌ `spacing/sm`, `spacing/md`, `spacing/lg` → MUI utilise une fonction, pas des tokens nommés

### Ant Design
- ❌ `gray.white` → Devrait être `colorBgContainer` ou valeur directe
- ❌ `gray.10` → Ant utilise des noms sémantiques, pas des numéros au-delà de 9
- ❌ Références à `typography.14`, `typography.12` → Devrait être `fontSize`, `fontSizeSM`

### Bootstrap
- ❌ `gray.white`, `gray.600` → Bootstrap utilise `$white`, `$gray-600` (avec tiret)
- ❌ `brand.500` → Bootstrap n'a pas de scale numérique, juste `$primary`
- ❌ `radius.50` → Devrait être `$border-radius-pill` (9999px)

### Chakra UI
- ❌ Actuellement réutilise Tailwind → Doit avoir sa propre structure sémantique
- ❌ Manque les tokens `bg.*`, `fg.*`, `border.*`

---

## Tokens à AJOUTER (Manquants)

### MUI
- ✅ `palette/grey/*` (10 tokens : 50-900)
- ✅ `palette/common/black`, `palette/common/white`
- ✅ Corriger `palette/error/*`, `palette/warning/*`, `palette/info/*`, `palette/success/*` (light, dark, contrastText)

### Ant Design
- ✅ `controlHeight`, `controlHeightSM`, `controlHeightLG`
- ✅ `lineWidth`, `lineType`
- ✅ `motionDurationSlow`, `motionDurationMid`, `motionDurationFast`
- ✅ `motionEaseInOut`, `motionEaseOut`, `motionEaseIn`

### Bootstrap
- ✅ `$font-family-base`
- ✅ `$border-width`
- ✅ `$link-decoration`

### Chakra UI
- ✅ Créer structure complète avec `bg.*`, `fg.*`, `border.*`
- ✅ Ajouter tokens sémantiques pour status colors
