# 🔒 SCOPES FIGMA - RÉFÉRENCE CANONIQUE

> **⚠️ DOCUMENT VERROUILLÉ**  
> Ce document définit le mapping officiel des scopes Figma.  
> **TOUTE MODIFICATION DOIT ÊTRE VALIDÉE PAR LE PROPRIÉTAIRE DU PROJET.**

---

## 📋 Mapping Sémantique → Scopes

### 🎨 **Tokens de Couleur**

| Famille Sémantique | Scopes Figma | Usage | Exemples |
|-------------------|--------------|-------|----------|
| `text` | `TEXT_FILL` | Texte uniquement | `text/primary`, `text/secondary`, `text/muted` |
| `background` | `FRAME_FILL`, `SHAPE_FILL` | Fonds de frames/shapes | `bg/canvas`, `bg/surface`, `bg/elevated` |
| `surface` | `FRAME_FILL`, `SHAPE_FILL` | Surfaces spéciales | `surface/overlay`, `surface/elevated` |
| `border` | `STROKE_COLOR` | Bordures (couleur) | `border/default`, `border/muted`, `border/focus` |
| `ring` | `STROKE_COLOR` | Anneaux de focus | `ring/focus`, `ring/offset` |
| `action` | `FRAME_FILL`, `SHAPE_FILL` | Fonds de boutons | `action/primary/default`, `action/secondary/hover` |
| `status` | `FRAME_FILL`, `SHAPE_FILL`, `STROKE_COLOR` | Badges (fond + bordure) | `status/success`, `status/warning`, `status/error` |
| `on` ⚠️ | *(vide)* | **DEPRECATED** - Ne plus suggérer | `on/primary`, `on/secondary` |
| `accent` ⚠️ | `FRAME_FILL`, `SHAPE_FILL`, `STROKE_COLOR` | **LEGACY** | `accent/default` |

### 📐 **Tokens de Dimension**

| Famille Sémantique | Scopes Figma | Usage | Exemples |
|-------------------|--------------|-------|----------|
| `radius` | `CORNER_RADIUS` | Arrondis | `radius/sm`, `radius/md`, `radius/lg`, `radius/full` |
| `space` | `GAP` | Espacement entre éléments | `space/xs`, `space/sm`, `space/md`, `space/lg` |
| `spacing` ⚠️ | `GAP` | **ALIAS TECHNIQUE** - Ne pas utiliser | Compatibilité interne |
| `padding` | `INDIVIDUAL_PADDING` | Padding interne | `padding/sm`, `padding/md`, `padding/lg` |
| `fontSize` | `FONT_SIZE` | Tailles de police | `fontSize/sm`, `fontSize/md`, `fontSize/lg` |
| `fontWeight` | *(vide)* | Poids de police (nombre) | `fontWeight/normal`, `fontWeight/bold` |

---

## 🔍 Mapping Propriétés Figma → Scopes (Scan)

| Propriété Figma | Scopes Requis | Notes |
|----------------|---------------|-------|
| `Fill` (TEXT) | `TEXT_FILL` | Texte uniquement |
| `Fill` (FRAME/SHAPE) | `FRAME_FILL`, `SHAPE_FILL` | ⚠️ **PAS `ALL_FILLS`** |
| `Local Fill Style` | `FRAME_FILL`, `SHAPE_FILL` | ⚠️ **PAS `ALL_FILLS`** |
| `Stroke` | `STROKE_COLOR` | Couleur de bordure |
| `Local Stroke Style` | `STROKE_COLOR` | Style de bordure |
| `Corner Radius` | `CORNER_RADIUS` | Tous les arrondis |
| `Top/Bottom/Left/Right Radius` | `CORNER_RADIUS` | Arrondis individuels |
| `Item Spacing` | `GAP` | Espacement entre éléments |
| `Padding Left/Right/Top/Bottom` | `INDIVIDUAL_PADDING` | ⚠️ **PAS `GAP`** |
| `Font Size` | `FONT_SIZE` | Taille de police |
| `Stroke Weight` | `STROKE_FLOAT` | Épaisseur de bordure |

---

## 🔧 Mapping de Génération (code.js ligne 1056)

```javascript
scopes: {
  Fill: ['ALL_FILLS', 'FRAME_FILL', 'SHAPE_FILL', 'TEXT_FILL'],
  Stroke: ['STROKE_COLOR'],
  'CORNER RADIUS': ['CORNER_RADIUS'],
  'TOP LEFT RADIUS': ['CORNER_RADIUS'],
  'TOP RIGHT RADIUS': ['CORNER_RADIUS'],
  'BOTTOM LEFT RADIUS': ['CORNER_RADIUS'],
  'BOTTOM RIGHT RADIUS': ['CORNER_RADIUS'],
  'Item Spacing': ['GAP'],
  'Padding Left': ['INDIVIDUAL_PADDING'],   // ✅ PAS GAP
  'Padding Right': ['INDIVIDUAL_PADDING'],  // ✅ PAS GAP
  'Padding Top': ['INDIVIDUAL_PADDING'],    // ✅ PAS GAP
  'Padding Bottom': ['INDIVIDUAL_PADDING'], // ✅ PAS GAP
  'Font Size': ['FONT_SIZE']
}
```

---

## 🚫 Tokens Primitifs (Pas de Scopes)

Les tokens primitifs **n'ont AUCUN scope** par design :

- `brand/*` → Aucun scope (forcer l'utilisation des sémantiques)
- `gray/*` → Aucun scope (forcer l'utilisation des sémantiques)
- `system/*` → Aucun scope (forcer l'utilisation des sémantiques)
- `border/*` (primitives) → Aucun scope
- `radius/*` (primitives) → Aucun scope
- `spacing/*` (primitives) → Aucun scope
- `typography/*` (primitives) → Aucun scope

**Raison** : Les primitives ne doivent **jamais** être suggérées directement lors du scan. Seuls les tokens sémantiques doivent être proposés.

---

## ⚙️ Fichiers Concernés

1. **`code.js` ligne 1056** : Mapping de génération (`scopes`)
2. **`code.js` ligne 5002** : Mapping sémantique (`semanticScopesMapping`)
3. **`code.js` ligne 6863** : Mapping de scan (`getScopesForProperty`)

---

## 🔒 Règles de Modification

1. ❌ **INTERDICTION** de modifier ce mapping sans validation explicite
2. ✅ Toute modification doit être documentée dans ce fichier
3. ✅ Les 3 fichiers concernés doivent rester **synchronisés**
4. ✅ Toute incohérence doit être signalée immédiatement

---

## 📅 Historique des Modifications

| Date | Modification | Validé par |
|------|-------------|------------|
| 2025-12-24 | Création du document de référence | Propriétaire |
| 2025-12-24 | Correction `space` : `GAP` uniquement (pas `INDIVIDUAL_PADDING`) | Propriétaire |
| 2025-12-24 | Correction `Fill` : `FRAME_FILL`, `SHAPE_FILL` uniquement (pas `ALL_FILLS`) | Propriétaire |
| 2025-12-24 | Correction `Padding` : `INDIVIDUAL_PADDING` uniquement (pas `GAP`) | Propriétaire |
| 2025-12-24 | Ajout `spacing` : Alias technique pour compatibilité primitives | Propriétaire |
| 2025-12-24 | Correction `status` : Ajout `STROKE_COLOR` pour badges outline | Propriétaire |
| 2025-12-24 | Désactivation `on` : `[]` (deprecated, ne plus suggérer) | Propriétaire |
| 2025-12-24 | Ajout `padding` : `INDIVIDUAL_PADDING` pour tokens de padding | Propriétaire |

---

**Version** : 1.0.0  
**Dernière mise à jour** : 2025-12-24  
**Statut** : 🔒 **VERROUILLÉ**
