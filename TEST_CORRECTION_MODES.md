# 🧪 Test Rapide - Vérification de la Correction

## ⚡ Test en 3 Minutes

### Étape 1 : Effacer les Données Corrompues (30 secondes)

1. Ouvre Figma
2. Ouvre la console du plugin :
   - Menu → Plugins → Development → Open Console
3. Exécute cette commande :
   ```javascript
   figma.root.setPluginData("tokenStarter.semantic", "{}");
   console.log("✅ Données effacées");
   ```

### Étape 2 : Recharger le Plugin (10 secondes)

1. Menu → Plugins → Development → Reload
2. Ou ferme et rouvre le plugin

### Étape 3 : Regénérer les Tokens (1 minute)

1. Dans le plugin, sélectionne "Tailwind" (ou autre)
2. Clique sur "Générer"
3. Attends la fin de la génération

### Étape 4 : Vérifier dans Figma (1 minute)

1. Ouvre le panneau Variables (Cmd + Option + K sur Mac)
2. Cherche la collection "Semantic"
3. Clique sur une variable (ex: `background/canvas`)
4. **Vérifie qu'elle a 2 modes : Light et Dark**
5. **Vérifie que chaque mode a une valeur différente** :
   - Light → devrait pointer vers `gray-50` ou avoir une couleur claire
   - Dark → devrait pointer vers `gray-950` ou avoir une couleur foncée

### Étape 5 : Vérifier l'Export CSS (30 secondes)

1. Dans le plugin, va dans l'onglet "Développeur"
2. Sélectionne "CSS Variables"
3. Clique sur "Copier"
4. Colle dans un éditeur de texte
5. **Vérifie que `html[data-theme='dark']` a des valeurs différentes de `html[data-theme='light']`**

---

## ✅ Résultats Attendus

### Dans Figma

```
Variable: background/canvas
├─ Mode: Light
│  └─ Valeur: gray-50 (ou #F9FAFB)
└─ Mode: Dark
   └─ Valeur: gray-950 (ou #030712)

Variable: text/primary
├─ Mode: Light
│  └─ Valeur: gray-900 (ou #111827)
└─ Mode: Dark
   └─ Valeur: gray-50 (ou #F9FAFB)
```

### Dans l'Export CSS

```css
/* ✅ CORRECT */
html[data-theme='light'] {
  --background-canvas: var(--gray-50);
  --text-primary: var(--gray-900);
}

html[data-theme='dark'] {
  --background-canvas: var(--gray-950);
  --text-primary: var(--gray-50);
}
```

### ❌ INCORRECT (Avant la correction)

```css
/* ❌ FAUX - Tous les tokens pointent vers white */
html[data-theme='dark'] {
  --background-canvas: var(--gray-white);
  --text-primary: var(--gray-white);
  --background-surface: var(--gray-white);
  /* ... */
}
```

---

## 🚨 Si le Test Échoue

### Problème : Les tokens pointent toujours vers white en mode dark

**Solution :**
1. Vérifie que tu as bien effacé les données (Étape 1)
2. Vérifie que tu as bien rechargé le plugin (Étape 2)
3. Regénère les tokens (Étape 3)
4. Si le problème persiste, partage les logs de la console

### Problème : Les variables n'ont qu'un seul mode

**Solution :**
1. Supprime manuellement la collection "Semantic" dans Figma
2. Regénère les tokens
3. La collection devrait être recréée avec 2 modes

### Problème : L'export CSS est vide

**Solution :**
1. Vérifie que des tokens sont bien générés dans Figma
2. Vérifie que tu es dans l'onglet "Développeur" du plugin
3. Sélectionne "CSS Variables" dans le dropdown

---

## 📊 Checklist Complète

- [ ] Données effacées (console Figma)
- [ ] Plugin rechargé
- [ ] Tokens régénérés
- [ ] Variables Figma ont 2 modes (Light et Dark)
- [ ] Chaque mode a une valeur différente
- [ ] Export CSS a des valeurs différentes pour light et dark
- [ ] Aucun token ne pointe vers `var(--gray-white)` en mode dark (sauf ceux qui devraient)

---

## 🎉 Si Tous les Tests Passent

**Félicitations !** La correction fonctionne. Tu peux maintenant :

1. Utiliser le plugin normalement
2. Exporter les tokens en CSS, JSON, etc.
3. Appliquer les tokens sémantiques dans tes designs Figma
4. Switcher entre light et dark mode sans problème

---

## 📝 Rapport de Test

Une fois les tests terminés, note ici :

- **Date du test :** _____________
- **Résultat :** ✅ Succès / ❌ Échec
- **Notes :** _____________________________________________

---

**Temps total estimé :** 3 minutes  
**Criticité :** 🚨 Test critique pour valider la correction
