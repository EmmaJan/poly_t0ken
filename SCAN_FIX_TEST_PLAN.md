# Plan de Tests - Feature Scan & Fix

## 🎯 Objectif
Créer une batterie de tests complète pour la feature Scan & Fix afin de détecter et corriger tous les bugs.

## 📋 Fonctionnalités à Tester

### 1. **Scan de Nodes** ⭐⭐⭐
**État actuel** : Tests basiques existants ✅
**À ajouter** :

#### 1.1 Scan de Sélection
- [ ] Scan d'un seul node
- [ ] Scan de plusieurs nodes sélectionnés
- [ ] Scan de nodes imbriqués (frames dans frames)
- [ ] Scan avec sélection vide → erreur appropriée
- [ ] Scan de nodes verrouillés → skip ou warning

#### 1.2 Scan de Page
- [ ] Scan de page vide
- [ ] Scan de page avec 1-10 nodes
- [ ] Scan de page avec 100+ nodes (performance)
- [ ] Scan de page avec nodes cachés
- [ ] Progress reporting pendant le scan

#### 1.3 Scan de Frame
- [ ] Scan de frame simple
- [ ] Scan de frame avec auto-layout
- [ ] Scan de frame avec composants
- [ ] Scan de frame avec instances de composants

### 2. **Détection de Propriétés** ⭐⭐⭐
**État actuel** : Tests basiques ✅
**À ajouter** :

#### 2.1 Propriétés de Couleur
- [x] Détection Fill
- [x] Détection Stroke
- [x] Détection Text
- [ ] Détection Effect Color (shadows, glows)
- [ ] Détection de gradients
- [ ] Détection de couleurs avec opacité

#### 2.2 Propriétés Numériques
- [x] Détection Corner Radius
- [x] Détection Padding
- [x] Détection Gap (Item Spacing)
- [ ] Détection Stroke Weight
- [ ] Détection Font Size
- [ ] Détection Line Height
- [ ] Détection Letter Spacing

#### 2.3 Cas Spéciaux
- [ ] Propriétés mixtes (mixed values)
- [ ] Propriétés héritées
- [ ] Propriétés avec variables déjà liées
- [ ] Propriétés avec styles locaux

### 3. **Matching de Variables** ⭐⭐⭐
**État actuel** : Tests basiques ✅
**À améliorer** :

#### 3.1 Matching de Couleurs
- [x] Distance euclidienne RGB
- [ ] Matching exact (distance = 0)
- [ ] Matching proche (distance < seuil)
- [ ] Matching avec tolérance configurable
- [ ] Priorité des matches (exact > proche > lointain)
- [ ] Matching avec mode light/dark

#### 3.2 Matching de Valeurs Numériques
- [x] Matching exact
- [x] Matching avec tolérance
- [ ] Matching avec arrondi
- [ ] Matching de valeurs calculées (ex: 16 * 1.5 = 24)

#### 3.3 Validation de Scopes
- [x] Validation scopes couleur
- [x] Validation scopes numériques
- [ ] Validation scopes multiples
- [ ] Validation ALL_SCOPES
- [ ] Gestion des scopes manquants

### 4. **Génération de Suggestions** ⭐⭐⭐
**État actuel** : Non testé ❌
**À créer** :

#### 4.1 Suggestions Exactes
- [ ] Suggestion avec match exact (isExact: true)
- [ ] Suggestion avec variable correcte
- [ ] Suggestion avec scope valide
- [ ] Suggestion avec collection correcte

#### 4.2 Suggestions Approximatives
- [ ] Suggestion avec match proche (isExact: false)
- [ ] Suggestion avec distance calculée
- [ ] Suggestion avec score de confiance
- [ ] Top 3 suggestions triées par pertinence

#### 4.3 Cas Sans Suggestion
- [ ] Aucune variable disponible
- [ ] Aucune variable avec scope compatible
- [ ] Valeur trop éloignée de toutes les variables
- [ ] Status: NO_MATCH

### 5. **Application de Fixes** ⭐⭐⭐
**État actuel** : Non testé ❌
**À créer** :

#### 5.1 Fix Unique (APPLY_SINGLE_FIX)
- [ ] Application réussie
- [ ] Vérification de la liaison variable
- [ ] Vérification de la valeur appliquée
- [ ] Gestion d'erreur si node supprimé
- [ ] Gestion d'erreur si variable supprimée
- [ ] Undo/Redo support

#### 5.2 Fix de Groupe (APPLY_GROUP_FIX)
- [ ] Application de 2-5 fixes
- [ ] Application de 10+ fixes
- [ ] Gestion des erreurs partielles
- [ ] Rollback en cas d'erreur
- [ ] Progress reporting

#### 5.3 Fix Global (APPLY_ALL_FIXES)
- [ ] Application de tous les fixes auto (isExact: true)
- [ ] Skip des fixes manuels (isExact: false)
- [ ] Gestion de 100+ fixes
- [ ] Performance \u003c 5s pour 100 fixes
- [ ] Rapport de succès/échec

### 6. **Preview & Rollback** ⭐⭐
**État actuel** : Non testé ❌
**À créer** :

#### 6.1 Preview
- [ ] Sauvegarde de l'état original
- [ ] Application temporaire du fix
- [ ] Affichage visuel du changement
- [ ] Pas de modification permanente

#### 6.2 Rollback
- [ ] Restauration de l'état original
- [ ] Vérification des valeurs restaurées
- [ ] Rollback après fix unique
- [ ] Rollback après fix de groupe
- [ ] Rollback après fix global

### 7. **Filtrage des Résultats** ⭐⭐
**État actuel** : Tests basiques ✅
**À améliorer** :

#### 7.1 Filtres
- [x] Filtre "all" (tous les résultats)
- [x] Filtre "auto" (isExact: true)
- [x] Filtre "manual" (isExact: false)
- [ ] Filtre par type de propriété (color, numeric)
- [ ] Filtre par collection
- [ ] Filtre par node

#### 7.2 Tri
- [ ] Tri par distance (meilleurs matches en premier)
- [ ] Tri par type de propriété
- [ ] Tri par node
- [ ] Tri par collection

### 8. **Gestion d'Erreurs** ⭐⭐⭐
**État actuel** : Non testé ❌
**À créer** :

#### 8.1 Erreurs de Scan
- [ ] Node supprimé pendant le scan
- [ ] Page supprimée pendant le scan
- [ ] Permissions insuffisantes
- [ ] Timeout sur gros fichiers

#### 8.2 Erreurs de Fix
- [ ] Node verrouillé
- [ ] Variable supprimée
- [ ] Scope incompatible
- [ ] Valeur invalide

#### 8.3 Recovery
- [ ] Retry automatique
- [ ] Fallback sur valeur par défaut
- [ ] Message d'erreur clair à l'utilisateur
- [ ] Logging des erreurs

### 9. **Performance** ⭐⭐
**État actuel** : Non testé ❌
**À créer** :

#### 9.1 Benchmarks
- [ ] Scan de 10 nodes \u003c 500ms
- [ ] Scan de 100 nodes \u003c 2s
- [ ] Scan de 1000 nodes \u003c 10s
- [ ] Application de 100 fixes \u003c 2s

#### 9.2 Optimisations
- [ ] Indexation des variables (cache)
- [ ] Batch processing des fixes
- [ ] Throttling des updates UI
- [ ] Interruption possible du scan

### 10. **Edge Cases** ⭐⭐
**État actuel** : Partiellement testé ⚠️
**À compléter** :

- [ ] Nodes avec noms spéciaux (emoji, caractères spéciaux)
- [ ] Valeurs extrêmes (0, très grand, négatif)
- [ ] Couleurs avec alpha channel
- [ ] Variables avec modes multiples
- [ ] Collections vides
- [ ] Fichier sans variables

## 🚀 Plan d'Exécution

### Semaine 1 : Tests Critiques
**Jour 1-2** : Scan de Nodes
- Créer `tests/integration/scan-flow.test.js`
- Tester scan selection, page, frame
- Tester détection de propriétés complète

**Jour 3-4** : Matching & Suggestions
- Créer `tests/unit/matching.test.js`
- Tester matching couleurs et numériques
- Tester génération de suggestions

**Jour 5** : Application de Fixes
- Créer `tests/integration/fix-application.test.js`
- Tester single, group, all fixes
- Tester preview & rollback

### Semaine 2 : Tests Complémentaires
**Jour 1-2** : Gestion d'Erreurs
- Créer `tests/integration/error-handling.test.js`
- Tester tous les cas d'erreur
- Tester recovery

**Jour 3-4** : Performance
- Créer `tests/performance/scan-performance.test.js`
- Benchmarks sur différentes tailles
- Optimisations si nécessaire

**Jour 5** : Edge Cases
- Compléter tous les edge cases
- Tests de régression
- Documentation

## 📊 Métriques de Succès

- ✅ **100% des fonctionnalités critiques testées**
- ✅ **0 bugs détectés en production**
- ✅ **Performance : \u003c 2s pour 100 nodes**
- ✅ **Coverage : \u003e 90% sur le code scan/fix**

## 🐛 Bugs Connus à Tester

1. **Scan de nodes verrouillés** → crash ou skip ?
2. **Variables supprimées pendant le fix** → erreur non gérée ?
3. **Scopes incompatibles** → suggestion incorrecte ?
4. **Performance sur gros fichiers** → timeout ?
5. **Rollback incomplet** → état corrompu ?

---

**Prochaine étape** : Commencer par les tests de scan de nodes (Jour 1-2)
