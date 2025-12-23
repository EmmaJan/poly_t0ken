# Contributing to Emma Plugin

Merci de votre intérêt pour contribuer à Emma Plugin ! 🎉

## 🧪 Tests Requis

**Tous les tests doivent passer avant de soumettre une PR.**

```bash
# Lancer tous les tests
npm test

# Vérifier la couverture
npm run test:coverage
```

### Ajouter des Tests

Si vous ajoutez une nouvelle fonctionnalité :

1. **Tests unitaires** : Créer un fichier dans `tests/unit/`
2. **Tests d'intégration** : Ajouter des scénarios dans `tests/integration/`
3. **Vérifier** : `npm test` doit passer

Exemple de test unitaire :

```javascript
describe('Ma Nouvelle Fonction', () => {
  test('devrait faire X', () => {
    const result = maNouvellefonction(input);
    expect(result).toBe(expected);
  });
  
  test('devrait gérer les erreurs', () => {
    expect(() => maNouvellefonction(null)).toThrow();
  });
});
```

## ⚙️ Engines (Core vs Legacy)

Le plugin supporte deux engines de génération :

- **Legacy Engine** (actif) : Stable, production-ready
- **Core Engine** (expérimental) : Nouvelle implémentation

Pour basculer :
```javascript
const USE_CORE_ENGINE = true; // Activer Core
```

**Important** : Tester exhaustivement avant de merger si vous activez le Core Engine.

## 📝 Conventions de Code

### Messages de Commit

Utiliser le format :

```
type(scope): description

[body optionnel]
```

Types :
- `feat`: Nouvelle fonctionnalité
- `fix`: Correction de bug
- `refactor`: Refactoring sans changement fonctionnel
- `test`: Ajout/modification de tests
- `docs`: Documentation
- `chore`: Tâches de maintenance

Exemples :
```
feat(tokens): add support for custom color palettes
fix(scan): correct scope validation for padding properties
test(semantic): add tests for alias resolution
refactor(ui): extract message handlers into separate functions
```

### Style de Code

- **Indentation** : 2 espaces
- **Quotes** : Single quotes pour strings
- **Semicolons** : Oui
- **Naming** : camelCase pour variables/fonctions

### Règles Importantes

1. **Pas de breaking changes** sans discussion préalable
2. **Préserver les contrats de messages** UI ↔ Plugin
3. **Ajouter des tests** pour toute nouvelle fonctionnalité
4. **Documenter** les fonctions complexes

## 🔄 Workflow de Contribution

1. **Fork** le repository
2. **Clone** votre fork
   ```bash
   git clone https://github.com/YOUR_USERNAME/emma-plugin-dev.git
   cd emma-plugin-dev
   ```

3. **Installer** les dépendances
   ```bash
   npm install
   ```

4. **Créer** une branche
   ```bash
   git checkout -b feature/ma-fonctionnalite
   ```

5. **Développer** et tester
   ```bash
   npm test
   npm run test:watch  # Mode watch pendant le dev
   ```

6. **Commit** vos changements
   ```bash
   git add .
   git commit -m "feat(scope): description"
   ```

7. **Push** vers votre fork
   ```bash
   git push origin feature/ma-fonctionnalite
   ```

8. **Ouvrir** une Pull Request

## ✅ Checklist PR

Avant de soumettre une PR, vérifier :

- [ ] Tous les tests passent (`npm test`)
- [ ] Couverture de code maintenue ou améliorée
- [ ] Code documenté (commentaires pour logique complexe)
- [ ] README mis à jour si nécessaire
- [ ] Pas de console.log oubliés (sauf debug flags)
- [ ] Commit messages suivent les conventions
- [ ] Branche à jour avec `main`

## 🐛 Rapporter un Bug

Utiliser le template suivant :

```markdown
**Description**
Description claire du bug

**Reproduction**
1. Étape 1
2. Étape 2
3. Voir l'erreur

**Comportement attendu**
Ce qui devrait se passer

**Screenshots**
Si applicable

**Environnement**
- OS: [e.g. macOS 14.0]
- Figma: [e.g. Desktop 116.0]
- Plugin version: [e.g. 1.1.0]
```

## 💡 Proposer une Fonctionnalité

Avant de développer une grosse fonctionnalité :

1. **Ouvrir une issue** pour discuter
2. **Attendre validation** de l'équipe
3. **Développer** avec tests
4. **Soumettre PR**

## 🧪 Tests CI/CD

Les GitHub Actions vont automatiquement :

- ✅ Exécuter tous les tests
- ✅ Vérifier la couverture de code
- ✅ Tester sur Node.js 18.x et 20.x
- ✅ Vérifier la qualité du code

Si les tests échouent, la PR ne pourra pas être mergée.

## 📚 Ressources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Figma Plugin API](https://www.figma.com/plugin-docs/)
- [Tests README](tests/README.md)

## 🙏 Merci !

Merci de contribuer à améliorer Emma Plugin ! 🚀
