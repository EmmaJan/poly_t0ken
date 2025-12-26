# 🧪 Test Semantic Aliases - Guide Rapide

**Feature activée** : `USE_SEMANTIC_ALIASES = true` ✅

---

## 📋 Checklist de Test (5 minutes)

### 1. Recharger le Plugin
```
Dans Figma Desktop:
1. Plugins → Development → PolyToken by Emma
2. Clic droit → "Reload plugin"
```

### 2. Générer des Tokens
```
1. Ouvrir le plugin
2. Choisir une couleur (ex: #6366F1)
3. Choisir "Tailwind"
4. Cliquer "Générer"
```

### 3. Vérifier les Alias dans la Console
Ouvre la console Figma (Cmd+Option+I sur Mac) et cherche :
```
✅ [ALIAS_CREATED] bg.canvas (light) → alias to variableId: ...
✅ [ALIAS_CREATED] bg.canvas (dark) → alias to variableId: ...
✅ [ALIAS_CREATED] text.primary (light) → alias to variableId: ...
...

📊 [SEMANTIC_STATS] AUTO_GENERATE: {
  total: 55,
  tokensWithAliasRef: 52,
  aliasPercentage: '95%'
}
```

**Attendu** : ~52 alias créés sur 55 tokens (95%)

### 4. Vérifier dans Figma Variables
```
1. Ouvrir le panel "Variables" dans Figma (icône en bas à gauche)
2. Aller dans la collection "Semantic"
3. Cliquer sur "bg / canvas"
4. Regarder la valeur pour "Light" mode
```

**Attendu** : Tu devrais voir une **icône de lien** 🔗 et le texte "Grayscale / 50"

**Avant** : `#FAFAFA` (valeur hardcodée)  
**Après** : 🔗 `Grayscale / 50` (alias)

### 5. Tester la Propagation
```
1. Dans Variables, aller dans "Grayscale"
2. Modifier "50" → changer la couleur (ex: #FF0000)
3. Retourner dans "Semantic" → "bg / canvas"
```

**Attendu** : La valeur de `bg / canvas` change automatiquement ! 🎉

**C'est ça la magie des alias** : modifier 1 primitive = tous les sémantiques changent.

---

## ✅ Résultat Attendu

### Console
```
📊 [SEMANTIC_STATS] AUTO_GENERATE: {
  total: 55,
  tokensWithAliasRef: 52,
  aliasPercentage: '95%'
}

✅ [ALIAS_CREATED] bg.canvas (light) → alias to variableId: VariableID:123:456
✅ [ALIAS_CREATED] bg.canvas (dark) → alias to variableId: VariableID:123:789
... (52 lignes)

⚠️ [ALIAS_MISSING] font.weight.base (light): no aliasRef found, using hardcoded value
... (3 lignes)
```

### Figma Variables
- Collection "Semantic" existe ✅
- Tokens ont des icônes 🔗 (alias) ✅
- Modifier primitive → sémantique change ✅

---

## 🔄 Rollback (si problème)

Si ça ne marche pas ou si tu veux revenir en arrière :

```javascript
// code.js ligne 36
const USE_SEMANTIC_ALIASES = false;  // ← Remettre à false
```

Puis recharger le plugin.

---

## 🎯 Ce que ça change

### Avant
```
Semantic / bg / canvas (Light) = #FAFAFA
Semantic / bg / canvas (Dark) = #0A0A0A

→ Modifier Grayscale / 50 = rien ne change
→ Chaque semantic est indépendant
```

### Après
```
Semantic / bg / canvas (Light) → 🔗 Grayscale / 50
Semantic / bg / canvas (Dark) → 🔗 Grayscale / 950

→ Modifier Grayscale / 50 = bg.canvas change aussi !
→ Single source of truth
```

---

## 📊 Métriques Attendues

| Métrique | Valeur |
|----------|--------|
| Tokens totaux | 55 |
| Tokens avec alias | 52 (95%) |
| Tokens sans alias | 3 (5%) |
| Alias Light mode | ~52 |
| Alias Dark mode | ~52 |

Les 3 tokens sans alias sont probablement :
- `font.weight.base` (valeur numérique)
- `space.xs` (valeur calculée)
- `radius.lg` (valeur custom)

**C'est normal** : ils utilisent le fallback (valeur hardcodée).

---

## 🐛 Debugging

### Si aucun alias n'est créé
1. Vérifier la console : `USE_SEMANTIC_ALIASES = true` ?
2. Vérifier les logs : `✅ [ALIAS_CREATED]` présents ?
3. Recharger le plugin

### Si certains alias manquent
C'est normal ! Certains tokens n'ont pas de primitive correspondante.
Regarde les logs `⚠️ [ALIAS_MISSING]` pour voir lesquels.

### Si erreur
Regarde les logs `❌ [ALIAS_FAILED]` pour voir quel token a échoué.
Le fallback devrait s'activer automatiquement.

---

**Prêt à tester ?** 🚀

Lance Figma, recharge le plugin, et génère des tokens !
