# Évaluation Legacy Engine vs Core Engine

## État Actuel

```javascript
const USE_CORE_ENGINE = false; // Legacy Engine ACTIF
```

## Analyse du Code

### Branchement Principal (L3589-3686)

Le code contient un branchement `if (USE_CORE_ENGINE)` qui sélectionne entre :

**Core Engine** (L3589-3633) :
- `generateCorePrimitives()`
- `generateCoreSemantics()`
- `validateAndAdjustForRgaa()`
- `projectCoreToLegacyShape()`

**Legacy Engine** (L3634-3686) :
- `generateBrandColors()`
- `generateGrayscale()`
- `generateSystemColors()`
- `generateSpacing()`
- `generateRadius()`
- `generateTypography()`
- `generateBorder()`
- `generateSemanticTokens()`

### Sections de Code Impactées

| Section | Lignes | Usage | Status |
|---------|--------|-------|--------|
| Branchement principal | 3589-3686 | Sélection engine | ✅ Actif |
| Core Engine functions | 9902-10068 | Core uniquement | ❌ Dead code (USE_CORE_ENGINE=false) |
| Core Engine functions | 10068-10329 | Core uniquement | ❌ Dead code |
| Legacy Engine functions | 10329+ | Legacy uniquement | ✅ Actif |

### Estimation Taille Code

**Core Engine** (inutilisé actuellement) :
- Fonctions Core : ~500 lignes (L9902-10329)
- Branche Core : ~45 lignes (L3589-3633)
- **Total Core** : ~545 lignes

**Legacy Engine** (utilisé actuellement) :
- Fonctions Legacy : ~600+ lignes (L10329+)
- Branche Legacy : ~52 lignes (L3634-3686)
- **Total Legacy** : ~652+ lignes

## Décision Recommandée

### ⚠️ **GARDER LES DEUX ENGINES (pour l'instant)**

**Raisons** :

1. **Legacy Engine est actuellement actif** (`USE_CORE_ENGINE = false`)
2. **Pas de tests comparatifs** entre Core et Legacy
3. **Risque élevé** de casser la génération de tokens
4. **Core Engine non validé** en production

### 📋 Plan d'Évaluation Recommandé

#### Phase 1 : Tests Comparatifs (2-3h)

Créer des tests pour comparer Core vs Legacy :

```javascript
// tests/unit/engine-comparison.test.js
describe('Core vs Legacy Engine Comparison', () => {
  const testCases = [
    { color: '#6366F1', naming: 'tailwind' },
    { color: '#EC4899', naming: 'mui' },
    { color: '#10B981', naming: 'ant' },
    { color: '#F59E0B', naming: 'bootstrap' },
    { color: '#8B5CF6', naming: 'chakra' }
  ];

  testCases.forEach(({ color, naming }) => {
    test(`should generate same tokens for ${naming}`, () => {
      // Generate with Legacy
      const legacyTokens = generateWithLegacy(color, naming);
      
      // Generate with Core
      const coreTokens = generateWithCore(color, naming);
      
      // Compare
      expect(coreTokens.brand).toEqual(legacyTokens.brand);
      expect(coreTokens.gray).toEqual(legacyTokens.gray);
      expect(coreTokens.semantic).toMatchObject(legacyTokens.semantic);
    });
  });
});
```

#### Phase 2 : Activation Core Engine (1 semaine)

Si tests comparatifs OK :

```javascript
const USE_CORE_ENGINE = true; // Activer Core
```

Tester en production pendant 1 semaine :
- ✅ Vérifier génération tokens
- ✅ Vérifier semantic tokens
- ✅ Vérifier export (CSS, JSON, etc.)
- ✅ Collecter feedback utilisateurs

#### Phase 3 : Suppression Legacy (si Core stable)

Si Core Engine stable après 1 semaine :

**Suppressions possibles** :
- ❌ Branche Legacy (L3634-3686) : ~52 lignes
- ❌ `generateBrandColors()` : ~80 lignes
- ❌ `generateGrayscale()` : ~60 lignes
- ❌ `generateSystemColors()` : ~100 lignes
- ❌ `generateSemanticTokens()` (legacy) : ~300 lignes
- ❌ Autres fonctions legacy : ~100 lignes

**Total économisé** : ~692 lignes

**Garder** :
- ✅ Core Engine functions (L9902-10329)
- ✅ Branche Core (L3589-3633)

## Risques

### Risque Élevé ⚠️

**Supprimer Legacy maintenant** :
- ❌ Pas de tests comparatifs
- ❌ Core Engine non validé
- ❌ Peut casser génération tokens
- ❌ Pas de rollback facile

### Risque Faible ✅

**Garder les deux** :
- ✅ Flexibilité pour basculer
- ✅ Fallback si Core a des bugs
- ✅ Temps pour valider Core
- ⚠️ Mais : +692 lignes de code

## Recommandation Finale

### Court Terme (Maintenant)

**GARDER LES DEUX ENGINES** ✅

Raisons :
- Legacy est actif et fonctionne
- Pas de tests comparatifs
- Risque trop élevé

### Moyen Terme (1-2 mois)

**TESTER CORE ENGINE** 📋

Actions :
1. Créer tests comparatifs
2. Activer Core Engine
3. Tester en production
4. Collecter feedback

### Long Terme (3-6 mois)

**SUPPRIMER LEGACY** si Core stable ✅

Bénéfices :
- -692 lignes de code
- Maintenance simplifiée
- Code plus clair

## Prochaine Action Immédiate

### Option A : Créer Tests Comparatifs (Recommandé)

Créer `tests/unit/engine-comparison.test.js` pour valider que Core génère les mêmes tokens que Legacy.

**Effort** : 2-3h

### Option B : Documenter et Reporter

Documenter la décision de garder les deux engines et reporter l'évaluation à plus tard.

**Effort** : 30min

### Option C : Activer Core Immédiatement (Risqué)

Changer `USE_CORE_ENGINE = true` et tester manuellement.

**Effort** : 1h
**Risque** : ⚠️ Élevé

## Conclusion

**Recommandation** : **Option A** - Créer tests comparatifs

Cela permettra de :
- ✅ Valider que Core fonctionne correctement
- ✅ Identifier les différences entre Core et Legacy
- ✅ Prendre une décision basée sur des données
- ✅ Minimiser les risques

Une fois les tests créés et validés, on pourra activer Core Engine en toute confiance.
