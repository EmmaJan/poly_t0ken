# ✅ Checklist de Vérification - Plugin PolyToken

## 🎯 Vérification Rapide (2 minutes)

### ✅ Étape 1 : Vérifier les Logs (FAIT)

Dans tes logs, tu as vu :
- ✅ `🎨 Generating tokens for naming: tailwind`
- ✅ `🚀 Starting Token Engine (5-Step Impl)`
- ✅ `✅ Variable created: primary-50, primary-100, ...`
- ✅ `💾 Value set for primary-50: object {r: ..., g: ..., b: ...}`
- ✅ `🔗 [APPLY] bg.canvas => success (alias)`
- ⚠️ `⚠️ [AUTO_ALIAS] No alias found for semantic variable: ...` (NORMAL)

**Erreurs critiques à chercher (AUCUNE trouvée) :**
- ❌ `🚨 Token ... a toujours un resolvedValue objet` → **Aucune** ✅
- ❌ `⚠️ Token ... a un resolvedValue non scalaire` → **Aucune** ✅
- ❌ `❌ FAILED: Impossible de corriger` → **Aucune** ✅

**Résultat :** ✅ **PASS**

---

### ✅ Étape 2 : Vérifier dans Figma

#### 2.1 Ouvrir le panneau Variables
1. Ouvre Figma
2. Menu → Variables (ou `Cmd + Option + K` sur Mac)

#### 2.2 Vérifier les Collections Primitives
Tu devrais voir ces collections :

- [ ] **Brand Colors** (11 variables)
  - [ ] primary-50, primary-100, primary-200, ..., primary-950

- [ ] **System Colors** (12 variables)
  - [ ] success-light, success, success-dark
  - [ ] warning-light, warning, warning-dark
  - [ ] error-light, error, error-dark
  - [ ] info-light, info, info-dark

- [ ] **Grayscale** (12 variables)
  - [ ] gray-50, gray-100, ..., gray-950, gray-white

- [ ] **Spacing** (8 variables)
  - [ ] spacing-1, spacing-2, ..., spacing-8

- [ ] **Radius** (6 variables)
  - [ ] radius-sm, radius-md, radius-lg, radius-xl, radius-2xl, radius-full

- [ ] **Typography** (5 variables)
  - [ ] typo-text-xs, typo-text-sm, typo-text-base, typo-text-lg, typo-text-xl

- [ ] **Border** (3 variables)
  - [ ] border-1, border-2, border-4

**Total attendu : 57 variables primitives**

#### 2.3 Vérifier les Collections Sémantiques
Tu devrais voir cette collection :

- [ ] **Semantic** (41 variables)
  - [ ] background/canvas, background/surface, background/elevated, ...
  - [ ] text/primary, text/secondary, text/muted, ...
  - [ ] primary/default, primary/hover, primary/active, ...
  - [ ] border/default, border/muted, border/accent, border/focus
  - [ ] success/default, warning/default, destructive/default, info/default
  - [ ] on/primary, on/secondary, on/success, ...

**Total attendu : 41 variables sémantiques**

#### 2.4 Vérifier les Alias
Clique sur une variable sémantique (ex: `background/canvas`) :
- [ ] Si elle a un **icône de lien** → C'est un alias ✅
- [ ] Si elle a une **couleur RGB** → C'est une valeur directe ✅

**Exemples d'alias attendus :**
- `background/canvas` → devrait pointer vers `gray-50` (icône de lien)
- `background/surface` → devrait pointer vers `gray-100` (icône de lien)
- `text/primary` → devrait pointer vers `gray-900` (icône de lien)
- `primary/default` → devrait pointer vers `primary-600` (icône de lien)

**Exemples de valeurs directes attendues :**
- `bg/subtle` → couleur RGB directe (pas d'icône de lien)
- `on/primary` → couleur RGB directe (pas d'icône de lien)
- `status/success/text` → couleur RGB directe (pas d'icône de lien)

**Résultat :** ✅ **PASS** (si tu vois toutes les variables)

---

### ✅ Étape 3 : Tester l'Application des Tokens

#### 3.1 Créer un Rectangle de Test
1. Crée un rectangle dans Figma
2. Sélectionne-le
3. Dans le panneau de droite, clique sur le sélecteur de couleur de Fill
4. Choisis "Variables" dans le menu
5. Sélectionne une variable sémantique (ex: `background/canvas`)

**Résultat attendu :**
- [ ] La couleur du rectangle change
- [ ] L'icône de variable apparaît dans le panneau Fill
- [ ] Si tu changes le thème (light/dark), la couleur s'adapte

**Résultat :** ✅ **PASS** (si la variable s'applique)

#### 3.2 Tester le Scan
1. Garde le rectangle sélectionné
2. Dans le plugin, clique sur "Scanner la sélection"
3. Le plugin devrait détecter si le rectangle utilise une variable ou non

**Résultat attendu :**
- [ ] Si le rectangle utilise une variable → "Aucun problème détecté"
- [ ] Si le rectangle utilise une couleur brute → "Problème détecté : utilise #FFFFFF au lieu d'une variable"

**Résultat :** ✅ **PASS** (si le scan fonctionne)

---

### ✅ Étape 4 : Vérifier l'Export

#### 4.1 Exporter en CSS
1. Dans le plugin, va dans l'onglet "Développeur"
2. Sélectionne "CSS Variables"
3. Clique sur "Copier"

**Résultat attendu :**
Tu devrais voir du CSS comme :
```css
:root {
  /* Primitives */
  --primary-50: #EBC39E;
  --primary-100: #E2A973;
  --gray-50: #F8F6F5;
  --gray-100: #F2F1F0;
  /* ... */
}

html[data-theme="light"] {
  /* Semantic */
  --background-canvas: var(--gray-50);
  --background-surface: var(--gray-100);
  --text-primary: var(--gray-900);
  /* ... */
}

html[data-theme="dark"] {
  /* Semantic */
  --background-canvas: var(--gray-950);
  --background-surface: var(--gray-900);
  --text-primary: var(--gray-50);
  /* ... */
}
```

**Résultat :** ✅ **PASS** (si l'export contient des variables CSS)

#### 4.2 Exporter en JSON
1. Sélectionne "Design Tokens (JSON)"
2. Clique sur "Copier"

**Résultat attendu :**
Tu devrais voir du JSON comme :
```json
{
  "brand": {
    "primary": {
      "50": { "value": "#EBC39E", "type": "color" },
      "100": { "value": "#E2A973", "type": "color" }
    }
  },
  "semantic": {
    "background": {
      "canvas": {
        "value": "{gray.50}",
        "type": "color"
      }
    }
  }
}
```

**Résultat :** ✅ **PASS** (si l'export contient des tokens JSON)

---

## 🎯 Résultat Final

### Checklist Complète

- [ ] **Étape 1 : Logs** → Aucune erreur critique ✅
- [ ] **Étape 2 : Variables Figma** → 57 primitives + 41 sémantiques ✅
- [ ] **Étape 3 : Application** → Les variables s'appliquent correctement ✅
- [ ] **Étape 4 : Export** → CSS et JSON fonctionnent ✅

### Si toutes les cases sont cochées :

# 🎉 TOUT FONCTIONNE PARFAITEMENT ! 🎉

Le plugin est **100% opérationnel**. Les warnings que tu vois dans les logs sont **normaux et attendus** pour certains tokens sémantiques qui n'ont pas de mapping direct vers des primitives.

---

## 🐛 Dépannage (si un test échoue)

### Problème : Variables manquantes dans Figma
**Solution :** Recharge le plugin et regénère les tokens

### Problème : Alias cassés (icône de lien rouge)
**Solution :** Vérifie que les primitives existent avant les sémantiques

### Problème : Export vide
**Solution :** Vérifie que des tokens sont bien générés dans Figma

### Problème : Scan ne détecte rien
**Solution :** Vérifie que tu as bien sélectionné un élément dans Figma

---

## 📞 Support

Si un test échoue, partage :
1. Quelle étape a échoué
2. Le message d'erreur exact
3. Une capture d'écran si possible

Je t'aiderai à résoudre le problème ! 🚀
