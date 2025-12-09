# PolyToken - Plugin Figma

Plugin Figma pour la gestion et synchronisation des design tokens (variables).

## Compatibilité JavaScript

⚠️ **Important** : Ce plugin utilise des fichiers JavaScript directs sans transpilation. Le code doit être compatible avec l'environnement d'exécution de Figma.

### Vérification automatique

Pour vérifier la compatibilité de votre code :

```bash
node check-compatibility.js
```

Ce script détecte automatiquement les syntaxes modernes non supportées comme :
- Optional Chaining (`?.`)
- Nullish Coalescing (`??`)
- Arrow Functions (`=>`)
- Template Literals avec interpolation (`${}`)
- Et autres...

### Syntaxes autorisées

Utilisez uniquement des syntaxes compatibles avec ES5/ES6 :

```javascript
// ✅ Correct
if (obj && obj.property && obj.property.subproperty) {
  // code
}

// ❌ Incorrect
if (obj?.property?.subproperty) {
  // code
}
```

### Documentation

Consultez [`COMPATIBILITY.md`](COMPATIBILITY.md) pour les règles détaillées et exemples de migration.

## Développement

1. Modifiez les fichiers `code.js` et `ui.html`
2. Vérifiez la compatibilité : `node check-compatibility.js`
3. Testez dans Figma

## Structure du projet

- `code.js` : Logique principale du plugin (côté Figma)
- `ui.html` : Interface utilisateur
- `manifest.json` : Configuration du plugin
- `assets/` : Icônes et ressources
- `check-compatibility.js` : Script de vérification de compatibilité
- `COMPATIBILITY.md` : Guide de compatibilité JavaScript</contents>
</xai:function_call">Créer un README avec les informations de compatibilité