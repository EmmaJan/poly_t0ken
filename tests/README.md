# Tests Automatisés - Emma Plugin

## 📊 État Actuel

✅ **137 tests passent** (7 suites de tests)

**Unit Tests** (5 suites, 105 tests):
- `tests/unit/utils.test.js` : 18 tests
- `tests/unit/storage.test.js` : 12 tests
- `tests/unit/tokens.test.js` : 27 tests
- `tests/unit/semantic.test.js` : 22 tests
- `tests/unit/scanner.test.js` : 26 tests

**Integration Tests** (2 suites, 32 tests):
- `tests/integration/message-flow.test.js` : 21 tests
- `tests/integration/end-to-end.test.js` : 11 tests

## 🚀 Lancer les Tests

```bash
# Lancer tous les tests
npm test

# Lancer les tests en mode watch (re-run automatique)
npm run test:watch

# Générer le rapport de couverture
npm run test:coverage

# Mode verbose (plus de détails)
npm run test:verbose
```

## 📁 Structure

```
tests/
├── unit/                       # Tests unitaires
│   ├── utils.test.js          ✅ 18 tests
│   ├── storage.test.js        ✅ 12 tests
│   ├── tokens.test.js         ✅ 27 tests
│   ├── semantic.test.js       ✅ 22 tests
│   └── scanner.test.js        ✅ 26 tests
├── integration/                # Tests d'intégration
│   ├── message-flow.test.js   ✅ 21 tests
│   └── end-to-end.test.js     ✅ 11 tests
├── fixtures/                   # Données de test (à venir)
└── setup.js                    # Configuration Jest + mocks Figma API
```

## ✅ Fonctions Testées (137 tests)

### Unit Tests (105 tests)

#### Utilities (18 tests)
- ✅ `safeStringify()` - Sérialisation JSON sécurisée
- ✅ `normalizeLibType()` - Normalisation noms de librairies
- ✅ `validateMessage()` - Validation messages UI

#### Storage (12 tests)
- ✅ `saveNamingToFile()` / `getNamingFromFile()` - Persistence
- ✅ `postToUI()` - Envoi messages sécurisé

#### Tokens (27 tests)
- ✅ `hexToRgb()` / `rgbToHex()` - Conversion couleurs
- ✅ `determineTokenTypeFromKey()` - Détection type tokens
- ✅ `getCategoryFromVariableCollection()` - Parsing collections

#### Semantic (22 tests)
- ✅ `getCategoryFromSemanticKey()` / `getKeyFromSemanticKey()` - Parsing clés
- ✅ `normalizeAliasTo()` - Normalisation alias
- ✅ `getFallbackValue()` / `isUIFallbackValue()` - Fallbacks
- ✅ Token state management (VALUE/ALIAS_RESOLVED/ALIAS_UNRESOLVED)

#### Scanner (26 tests)
- ✅ `isColorProperty()` / `isNumericProperty()` - Détection propriétés
- ✅ `calculateColorDistance()` - Distance couleurs
- ✅ `isNumericMatch()` - Matching valeurs numériques
- ✅ `filterScanResults()` - Filtrage résultats
- ✅ `validateScope()` - Validation scopes Figma

### Integration Tests (32 tests)

#### Message Flow (21 tests)
- ✅ Plugin startup flow (init, has-variables)
- ✅ Token generation flow (generate → tokens-generated)
- ✅ Scan flow (scan-frame → scan-results)
- ✅ Fix application flow (apply-single/group/all-fixes)
- ✅ Import/Export flow (import → import-completed)
- ✅ Preview & Rollback flow
- ✅ Semantic token rehydration
- ✅ Error handling
- ✅ Persistence (save/restore naming, theme mode, scan results)

#### End-to-End Scenarios (11 tests)
- ✅ Complete token generation workflow
- ✅ Complete scan & fix workflow
- ✅ Import from file workflow (JSON/CSS)
- ✅ Preview & rollback workflow
- ✅ Multi-library switching
- ✅ Theme mode switching (light/dark)
- ✅ Error recovery
- ✅ Persistence across sessions

## 🎯 Prochaines Étapes

### ~~Phase 2 : Tests Critiques~~ ✅ **Terminée**
- ✅ Tests génération tokens
- ✅ Tests semantic tokens
- ✅ Tests scan & fix
- ✅ Tests alias resolution

### ~~Phase 3 : Tests d'Intégration~~ ✅ **Terminée**
- ✅ Tests flux UI ↔ Plugin
- ✅ Tests scénarios complets
- ✅ Tests message handlers

### Phase 4 : CI/CD (prochaine étape)
- [ ] GitHub Actions workflow
- [ ] Coverage reporting
- [ ] Automated PR checks

## 📝 Notes

### Problème Connu
- `code.js` a une fonction dupliquée (`inferSemanticFamily` ligne 4599)
- Empêche la collecte de couverture
- À corriger dans un prochain refactor

### Mocks Figma API
Les tests utilisent des mocks de l'API Figma définis dans `tests/setup.js` :
- `figma.root.getPluginData()` / `setPluginData()`
- `figma.ui.postMessage()`
- `figma.variables.*`
- `figma.clientStorage.*`

## 🏆 Objectifs de Couverture

| Métrique | Objectif | Actuel |
|----------|----------|--------|
| Statements | 50% | 0%* |
| Branches | 40% | 0%* |
| Functions | 50% | 0%* |
| Lines | 50% | 0%* |

*La couverture est à 0% car `code.js` a une erreur de parsing (fonction dupliquée)

## 💡 Conseils

### Écrire un Nouveau Test

```javascript
describe('Ma Fonction', () => {
  test('devrait faire X', () => {
    const result = maFonction(input);
    expect(result).toBe(expected);
  });
  
  test('devrait gérer les erreurs', () => {
    expect(() => maFonction(null)).toThrow();
  });
});
```

### Utiliser les Mocks

```javascript
beforeEach(() => {
  jest.clearAllMocks(); // Reset mocks avant chaque test
});

test('should call Figma API', () => {
  figma.root.setPluginData.mockReturnValue('value');
  
  myFunction();
  
  expect(figma.root.setPluginData).toHaveBeenCalledWith('key', 'value');
});
```

## 📚 Ressources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Figma Plugin API](https://www.figma.com/plugin-docs/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
