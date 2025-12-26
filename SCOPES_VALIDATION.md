# 🔍 VALIDATION DES SCOPES SÉMANTIQUES

## ⚠️ Points à Valider

### **1. `status` : Scopes trop permissifs ?**

**Actuel :**
```javascript
status: ["FRAME_FILL", "SHAPE_FILL", "TEXT_FILL", "STROKE_COLOR"]
```

**Question :** Voulez-vous vraiment que `status/success`, `status/error`, etc. soient suggérés pour :
- ✅ Les **fonds de badges** ? (FRAME_FILL, SHAPE_FILL)
- ❓ Les **textes normaux** ? (TEXT_FILL)
- ❓ Les **bordures** ? (STROKE_COLOR)

**Recommandation :**
```javascript
// Option 1 : Badges uniquement
status: ["FRAME_FILL", "SHAPE_FILL"]

// Option 2 : Garder actuel si vous voulez des textes/bordures colorés par statut
status: ["FRAME_FILL", "SHAPE_FILL", "TEXT_FILL", "STROKE_COLOR"]
```

---

### **2. `on` : Vraiment deprecated ?**

**Actuel :**
```javascript
on: ["TEXT_FILL"]  // DEPRECATED
```

**Question :** Si c'est deprecated, pourquoi le garder ?

**Recommandation :**
```javascript
// Option 1 : Supprimer complètement
// (supprimer la ligne)

// Option 2 : Désactiver
on: []  // DEPRECATED - Ne plus suggérer

// Option 3 : Garder pour rétrocompatibilité
on: ["TEXT_FILL"]  // LEGACY - Utiliser action.*.text à la place
```

---

### **3. `fontWeight` : Pas de scope**

**Actuel :**
```javascript
fontWeight: []
```

**Conséquence :** Les tokens `fontWeight/*` ne seront **jamais suggérés** dans le scan.

**Question :** Est-ce voulu ? (Probablement oui, car fontWeight est un nombre, pas une dimension visuelle)

**Recommandation :** ✅ Garder tel quel

---

### **4. Manque `INDIVIDUAL_PADDING` ?**

**Problème :** Aucun token sémantique n'a le scope `INDIVIDUAL_PADDING` !

**Question :** Voulez-vous des tokens sémantiques de padding ?

**Options :**

**Option A : Créer une famille `padding`**
```javascript
padding: ["INDIVIDUAL_PADDING"]  // padding/sm, padding/md, padding/lg
```

**Option B : Utiliser `space` pour TOUT**
```javascript
space: ["GAP", "INDIVIDUAL_PADDING"]  // space/* pour gap ET padding
```

**Option C : Garder actuel**
```javascript
space: ["GAP"]  // Uniquement pour gap, pas de tokens de padding
```

---

## 📊 Tableau Récapitulatif des Options

| Famille | Scopes Actuels | Recommandation | Raison |
|---------|---------------|----------------|--------|
| `status` | `FRAME_FILL`, `SHAPE_FILL`, `TEXT_FILL`, `STROKE_COLOR` | ❓ À valider | Peut-être trop permissif |
| `on` | `TEXT_FILL` | ❌ Supprimer ou `[]` | Si deprecated, ne pas suggérer |
| `fontWeight` | `[]` | ✅ Garder | Normal (nombre, pas dimension) |
| `padding` | *(n'existe pas)* | ❓ À créer ? | Manque pour `INDIVIDUAL_PADDING` |
| `space` | `GAP` | ❓ Ajouter `INDIVIDUAL_PADDING` ? | Ou créer `padding` séparé |

---

## 🎯 Mes Recommandations Finales

### **Scénario 1 : Strict (Recommandé)**
```javascript
status: ["FRAME_FILL", "SHAPE_FILL"],  // Badges uniquement
on: [],  // DEPRECATED - Ne plus suggérer
space: ["GAP"],  // Gap uniquement
padding: ["INDIVIDUAL_PADDING"],  // Nouveau : tokens de padding
```

### **Scénario 2 : Permissif**
```javascript
status: ["FRAME_FILL", "SHAPE_FILL", "TEXT_FILL", "STROKE_COLOR"],  // Garder actuel
on: ["TEXT_FILL"],  // Garder pour rétrocompatibilité
space: ["GAP", "INDIVIDUAL_PADDING"],  // space/* pour tout
```

### **Scénario 3 : Actuel (Minimal)**
```javascript
// Garder tel quel
// Pas de tokens de padding sémantiques
```

---

## ❓ Questions pour Vous

1. **`status`** : Voulez-vous que les tokens de statut soient suggérés pour les textes et bordures ?
2. **`on`** : Faut-il supprimer ou désactiver les tokens `on/*` ?
3. **`padding`** : Voulez-vous des tokens sémantiques de padding (`padding/sm`, `padding/md`, etc.) ?
4. **`space`** : Doit-il être utilisé pour GAP uniquement, ou aussi pour PADDING ?

---

**Date** : 2024-12-24  
**Statut** : ⏳ En attente de validation
