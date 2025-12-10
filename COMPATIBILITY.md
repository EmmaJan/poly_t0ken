# Compatibilité JavaScript - Plugin Figma

## Problème identifié

Le plugin Figma utilise directement des fichiers `.js` sans transpilation, ce qui signifie que le code est exécuté directement par le moteur JavaScript de Figma. Ce moteur ne supporte pas certaines syntaxes ES2020+ comme l'Optional Chaining (`?.`).

## Syntaxes interdites

Les syntaxes suivantes ne sont **PAS** supportées et doivent être évitées :

- ❌ `obj?.property` (Optional Chaining)
- ❌ `obj ?? default` (Nullish Coalescing)
- ❌ `() => {}` (Arrow Functions)
- ❌ `\`${variable}\`` (Template Literals avec interpolation)

## Syntaxes autorisées

Utilisez uniquement des syntaxes compatibles avec ES5/ES6 :

- ✅ `obj && obj.property`
- ✅ `obj || default`
- ✅ `function() {}`
- ✅ `"string " + variable`

## Règles de codage

### Vérifications d'objets imbriqués

**❌ Incorrect :**
```javascript
if (node.boundVariables?.fills?.[index]) {
  // code
}
```

**✅ Correct :**
```javascript
if (node.boundVariables && node.boundVariables.fills && node.boundVariables.fills[index]) {
  // code
}
```

### Gestion des valeurs par défaut

**❌ Incorrect :**
```javascript
var value = obj?.property ?? "default";
```

**✅ Correct :**
```javascript
var value = (obj && obj.property) || "default";
```

## Vérification automatique

Pour éviter les régressions, exécutez régulièrement :

```bash
node -c code.js
```

Cette commande vérifie que le fichier JavaScript est syntaxiquement valide selon les standards ES5+.

## Migration future

Si le projet évolue vers un système de build (webpack, esbuild, etc.), considérez :

1. **Target ES2017** ou inférieur dans la configuration
2. **Polyfills** si nécessaire pour des APIs manquantes
3. **Tests** dans un environnement similaire à Figma

## Historique des corrections

- **2025-01-XX** : Correction de l'Optional Chaining dans `applyFix()` (lignes 871, 890)</contents>
</xai:function_call">Créer un fichier de documentation sur la compatibilité JavaScript
