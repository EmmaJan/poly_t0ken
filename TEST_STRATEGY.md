# Stratégie de Tests - Emma Plugin

## 📊 État Actuel

✅ **234 tests passent** (13 suites)
- Coverage: ~80% sur les modules refactorisés (MessageBus, StateManager, TokenService)
- 2 tests skipped (comparaison Core vs Legacy)

## 🎯 Objectifs

1. **Stabilité** : Assurer que toutes les fonctionnalités critiques sont testées
2. **Non-régression** : Détecter automatiquement les bugs lors des modifications
3. **Confiance** : Pouvoir refactoriser en toute sécurité
4. **Documentation** : Les tests servent de documentation vivante

## 🏗️ Architecture des Tests

### Tests Unitaires (Unit Tests)
Testent des fonctions isolées sans dépendances externes.

**Existants** :
- ✅ `utils.test.js` - Fonctions utilitaires
- ✅ `storage.test.js` - Persistence des données
- ✅ `tokens.test.js` - Génération et manipulation de tokens
- ✅ `semantic.test.js` - Tokens sémantiques et alias
- ✅ `scanner.test.js` - Scan et détection d'écarts
- ✅ `engine-comparison.test.js` - Comparaison Core vs Legacy
- ✅ `MessageBus.test.js` - Bus de messages
- ✅ `StateManager.test.js` - Gestion d'état
- ✅ `TokenService.test.js` - Service de tokens
- ✅ `architecture.test.js` - Standards d'architecture
- ✅ `refactoring_check.test.js` - Validation du refactoring

**À ajouter** :
- [ ] `color-conversion.test.js` - Conversions de couleurs (RGB, HSL, Hex)
- [ ] `export.test.js` - Export vers différents formats (CSS, JSON, Tailwind, SCSS)
- [ ] `import.test.js` - Import depuis différents formats
- [ ] `wcag.test.js` - Validation WCAG AA/AAA
- [ ] `scope-validation.test.js` - Validation des scopes Figma

### Tests d'Intégration (Integration Tests)
Testent l'interaction entre plusieurs modules.

**Existants** :
- ✅ `message-flow.test.js` - Flux de messages UI ↔ Plugin
- ✅ `end-to-end.test.js` - Scénarios complets

**À ajouter** :
- [ ] `token-generation-flow.test.js` - Flux complet de génération
- [ ] `scan-fix-flow.test.js` - Flux complet scan → fix → apply
- [ ] `import-export-flow.test.js` - Flux complet import → modify → export
- [ ] `theme-switching.test.js` - Changement de thème light/dark
- [ ] `library-switching.test.js` - Changement de librairie

### Tests E2E (End-to-End)
Testent le plugin dans un environnement Figma simulé complet.

**À créer** :
- [ ] `e2e/full-workflow.test.js` - Workflow complet utilisateur
- [ ] `e2e/error-recovery.test.js` - Récupération d'erreurs
- [ ] `e2e/performance.test.js` - Tests de performance

## 📋 Fonctionnalités Critiques à Tester

### 1. Génération de Tokens ⭐⭐⭐
**Priorité : CRITIQUE**

- [x] Génération de palette Brand (10 nuances)
- [x] Génération de palette Gray (10 nuances)
- [x] Génération de palette System (success, warning, error, info)
- [x] Génération de tokens sémantiques (text, bg, border, action, status)
- [x] Génération de spacing scale
- [x] Génération de radius scale
- [x] Génération de typography scale
- [ ] Validation WCAG AA pour les contrastes
- [ ] Support multi-librairies (Tailwind, MUI, Ant, Bootstrap, Chakra)

### 2. Scan et Détection ⭐⭐⭐
**Priorité : CRITIQUE**

- [x] Scan de sélection
- [x] Scan de page
- [x] Scan de frame
- [x] Détection des propriétés non liées
- [x] Calcul de distance de couleurs
- [x] Matching de valeurs numériques
- [x] Filtrage des résultats (auto/manual/all)
- [x] Validation des scopes
- [ ] Scan de propriétés complexes (gradients, effects)
- [ ] Détection de tokens obsolètes

### 3. Application de Corrections ⭐⭐⭐
**Priorité : CRITIQUE**

- [x] Application d'une correction unique
- [x] Application d'un groupe de corrections
- [x] Application de toutes les corrections
- [x] Preview avant application
- [x] Rollback après application
- [ ] Undo/Redo multiple
- [ ] Batch processing avec progress

### 4. Import/Export ⭐⭐
**Priorité : HAUTE**

- [x] Import depuis JSON
- [x] Import depuis CSS
- [ ] Import depuis Tailwind config
- [ ] Import depuis fichier SCSS
- [ ] Export vers CSS
- [ ] Export vers JSON
- [ ] Export vers Tailwind config
- [ ] Export vers SCSS
- [ ] Export vers Tokens Studio format

### 5. Tokens Sémantiques ⭐⭐⭐
**Priorité : CRITIQUE**

- [x] Création d'alias vers primitives
- [x] Résolution d'alias
- [x] Gestion des états (VALUE/ALIAS_RESOLVED/ALIAS_UNRESOLVED)
- [x] Support multi-mode (light/dark)
- [x] Fallback values
- [ ] Alias circulaires (détection et prévention)
- [ ] Validation de cohérence des alias

### 6. Persistence ⭐⭐
**Priorité : HAUTE**

- [x] Sauvegarde de la configuration (naming, theme mode)
- [x] Sauvegarde des tokens générés
- [x] Sauvegarde des résultats de scan
- [x] Restauration après fermeture
- [ ] Migration de données anciennes versions
- [ ] Nettoyage de données obsolètes

### 7. Gestion d'Erreurs ⭐⭐
**Priorité : HAUTE**

- [x] Validation des messages UI
- [x] Gestion des erreurs de parsing
- [x] Gestion des erreurs de l'API Figma
- [ ] Recovery après crash
- [ ] Logging structuré des erreurs
- [ ] Reporting d'erreurs à l'utilisateur

### 8. Performance ⭐
**Priorité : MOYENNE**

- [x] Génération rapide de tokens (\u003c 100ms)
- [ ] Scan rapide de grandes pages (\u003c 5s pour 1000 nodes)
- [ ] Indexation efficace des variables
- [ ] Throttling des updates UI

## 🔧 Tests Manquants Critiques

### Phase 1 : Tests de Validation (Semaine 1)
**Objectif : Assurer la qualité des tokens générés**

1. **WCAG Compliance Tests** (`tests/unit/wcag.test.js`)
   - Validation des contrastes AA/AAA
   - Validation des tailles de texte
   - Validation des zones de clic

2. **Color Conversion Tests** (`tests/unit/color-conversion.test.js`)
   - RGB ↔ Hex
   - RGB ↔ HSL
   - Validation des valeurs

3. **Export Format Tests** (`tests/unit/export.test.js`)
   - Export CSS valide
   - Export JSON valide
   - Export Tailwind valide
   - Export SCSS valide

### Phase 2 : Tests d'Intégration (Semaine 2)
**Objectif : Assurer la cohérence des flux**

1. **Token Generation Flow** (`tests/integration/token-generation-flow.test.js`)
   - Génération → Validation → Persistence → Export

2. **Scan Fix Flow** (`tests/integration/scan-fix-flow.test.js`)
   - Scan → Filtrage → Preview → Apply → Rollback

3. **Theme Switching** (`tests/integration/theme-switching.test.js`)
   - Light → Dark → Light
   - Persistence des préférences
   - Mise à jour des tokens sémantiques

### Phase 3 : Tests E2E (Semaine 3)
**Objectif : Valider l'expérience utilisateur complète**

1. **Full Workflow** (`tests/e2e/full-workflow.test.js`)
   - Nouveau projet → Génération → Scan → Fix → Export

2. **Error Recovery** (`tests/e2e/error-recovery.test.js`)
   - Récupération après erreur réseau
   - Récupération après erreur API Figma
   - Récupération après données corrompues

## 📊 Métriques de Qualité

### Objectifs de Couverture
- **Statements** : \u003e 80%
- **Branches** : \u003e 70%
- **Functions** : \u003e 80%
- **Lines** : \u003e 80%

### Objectifs de Performance
- Génération de tokens : \u003c 100ms
- Scan de 100 nodes : \u003c 1s
- Scan de 1000 nodes : \u003c 5s
- Application de 100 fixes : \u003c 2s

### Objectifs de Fiabilité
- 0 tests flaky (instables)
- 100% des tests passent sur CI
- 0 régression détectée en production

## 🚀 Plan d'Exécution

### Semaine 1 : Fondations
- [ ] Créer les tests WCAG
- [ ] Créer les tests de conversion de couleurs
- [ ] Créer les tests d'export
- [ ] Atteindre 85% de couverture sur les fonctions critiques

### Semaine 2 : Intégration
- [ ] Créer les tests de flux de génération
- [ ] Créer les tests de flux scan/fix
- [ ] Créer les tests de changement de thème
- [ ] Valider tous les flux utilisateur principaux

### Semaine 3 : E2E et CI/CD
- [ ] Créer les tests E2E
- [ ] Configurer GitHub Actions
- [ ] Configurer Codecov
- [ ] Documenter la stratégie de test

### Semaine 4 : Optimisation
- [ ] Optimiser les tests lents
- [ ] Ajouter des tests de performance
- [ ] Ajouter des tests de charge
- [ ] Finaliser la documentation

## 🎓 Bonnes Pratiques

### Écriture de Tests
1. **AAA Pattern** : Arrange → Act → Assert
2. **Un test = un concept**
3. **Noms descriptifs** : `should generate 10 brand color shades`
4. **Isolation** : Chaque test doit être indépendant
5. **Mocks minimaux** : Mocker uniquement les dépendances externes

### Organisation
1. **Grouper par fonctionnalité** : `describe('Token Generation', ...)`
2. **Tests rapides d'abord** : Unit → Integration → E2E
3. **Skip temporaire** : Utiliser `test.skip()` avec un TODO
4. **Fixtures réutilisables** : Centraliser les données de test

### Maintenance
1. **Refactor régulier** : Éviter la duplication
2. **Documentation** : Commenter les tests complexes
3. **Review** : Tous les tests doivent être reviewés
4. **Monitoring** : Suivre les métriques de test

## 📚 Ressources

- [Jest Documentation](https://jestjs.io/)
- [Testing Best Practices](https://testingjavascript.com/)
- [Figma Plugin API](https://www.figma.com/plugin-docs/)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

**Dernière mise à jour** : 2026-01-20
**Statut** : 234/~350 tests (67% complet)
