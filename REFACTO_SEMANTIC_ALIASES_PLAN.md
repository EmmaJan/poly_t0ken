# 🔧 REFACTO SAFE - Semantic Aliases Implementation Plan

**Date** : 23 décembre 2025  
**Objectif** : Implémenter les alias sémantiques → primitives sans casser le fonctionnel  
**Contrainte** : Rollback en 1 ligne via feature flag

---

## 📋 1. FEATURE FLAGS

### 1.1 Flags Globaux (code.js, ligne ~22)

```javascript
// Après USE_CORE_ENGINE et DEBUG
const USE_SEMANTIC_ALIASES = false;  // 🚩 FEATURE FLAG PRINCIPAL (default: false pour rollout progressif)
const STRICT_SEMANTIC_ALIAS_VALIDATION = false;  // 🚩 Si true, erreur si alias non résolvable (default: false)
```

**Rollback** : Mettre `USE_SEMANTIC_ALIASES = false` → comportement actuel restauré

---

## 📊 2. CONVENTION DE STRUCTURE

### 2.1 Format Token Sémantique

```javascript
// ACTUEL (après mapSemanticTokens)
{
  'bg.canvas': {
    type: 'COLOR',
    modes: {
      light: {
        resolvedValue: '#FAFAFA',  // ✅ Valeur résolue
        aliasRef: { category: 'gray', key: '50' }  // ✅ Référence primitive (DÉJÀ PRÉSENT)
      },
      dark: {
        resolvedValue: '#0A0A0A',
        aliasRef: { category: 'gray', key: '950' }
      }
    }
  }
}
```

### 2.2 Format après Import Figma (avec USE_SEMANTIC_ALIASES=true)

```javascript
// Dans Figma Variables API
variable.setValueForMode(lightModeId, {
  type: 'VARIABLE_ALIAS',
  id: primitiveVariableId  // ✅ Alias créé vers gray.50
});

// Fallback si alias non résolvable
variable.setValueForMode(lightModeId, hexToRgb('#FAFAFA'));  // ❌ Valeur hardcodée (comportement actuel)
```

---

## 🔧 3. MODIFICATIONS REQUISES

### 3.1 Fichier: `code.js`

#### A) Ajouter Feature Flags (ligne ~22)
```javascript
const USE_SEMANTIC_ALIASES = false;
const STRICT_SEMANTIC_ALIAS_VALIDATION = false;
```

#### B) Modifier `importTokensToFigma` (ligne 5709-5960)

**Localisation** : Ligne 5937-5953 (application des valeurs sémantiques)

**AVANT** :
```javascript
// Ligne 5937-5953
var semanticValueData = {
  resolvedValue: resolvedValue,
  type: variableType,
  aliasTo: resolvedAliasTo  // ❌ Calculé mais jamais utilisé pour créer alias
};

applySemanticValue(variable, semanticValueData, key, modeInfo.modeId);
```

**APRÈS** :
```javascript
// 🚩 FEATURE FLAG: USE_SEMANTIC_ALIASES
if (USE_SEMANTIC_ALIASES && resolvedAliasTo && resolvedAliasTo.variableId) {
  // ✅ Créer un vrai alias Figma
  try {
    variable.setValueForMode(modeInfo.modeId, {
      type: 'VARIABLE_ALIAS',
      id: resolvedAliasTo.variableId
    });
    console.log(`✅ [ALIAS_CREATED] ${key} (${modeInfo.name}) → alias to variableId: ${resolvedAliasTo.variableId}`);
  } catch (aliasError) {
    console.error(`❌ [ALIAS_FAILED] ${key} (${modeInfo.name}):`, aliasError);
    
    if (STRICT_SEMANTIC_ALIAS_VALIDATION) {
      throw new Error(`Failed to create alias for ${key}: ${aliasError.message}`);
    }
    
    // Fallback: valeur hardcodée
    var semanticValueData = {
      resolvedValue: resolvedValue,
      type: variableType,
      aliasTo: null  // Pas d'alias
    };
    applySemanticValue(variable, semanticValueData, key, modeInfo.modeId);
  }
} else {
  // ❌ Comportement actuel (valeur hardcodée)
  var semanticValueData = {
    resolvedValue: resolvedValue,
    type: variableType,
    aliasTo: resolvedAliasTo  // Gardé pour debug mais non utilisé
  };
  applySemanticValue(variable, semanticValueData, key, modeInfo.modeId);
  
  if (USE_SEMANTIC_ALIASES && !resolvedAliasTo) {
    console.warn(`⚠️ [ALIAS_MISSING] ${key} (${modeInfo.name}): no aliasRef found, using hardcoded value`);
  }
}
```

#### C) Modifier `analyzeSemanticTokensStats` (ligne 116-155)

**Ajouter compteur d'alias** :

```javascript
// Ligne ~145 (dans la boucle d'analyse)
var aliasCount = 0;
var totalTokens = 0;

for (var key in tokens) {
  if (!tokens.hasOwnProperty(key)) continue;
  totalTokens++;
  
  var tokenData = tokens[key];
  if (tokenData && tokenData.modes) {
    var lightData = tokenData.modes.light || {};
    var darkData = tokenData.modes.dark || {};
    
    if (lightData.aliasRef || darkData.aliasRef) {
      aliasCount++;
    }
  }
}

console.log(`📊 [SEMANTIC_STATS] Alias coverage: ${aliasCount}/${totalTokens} (${Math.round(aliasCount/totalTokens*100)}%)`);
```

#### D) Modifier Exports (optionnel, Phase 2)

**Localisation** : Chercher `function exportToCSS`, `exportToJSON`, etc.

**Pour CSS** :
```javascript
// Si USE_SEMANTIC_ALIASES et token a aliasRef
if (USE_SEMANTIC_ALIASES && token.aliasRef) {
  cssOutput += `  --${cssName}: var(--${token.aliasRef.category}-${token.aliasRef.key});\n`;
} else {
  cssOutput += `  --${cssName}: ${token.resolvedValue};\n`;
}
```

**Pour JSON** :
```javascript
// Préserver aliasRef dans l'export
{
  "bg.canvas": {
    "value": "#FAFAFA",
    "type": "color",
    "aliasTo": "gray.50"  // ✅ Si USE_SEMANTIC_ALIASES
  }
}
```

---

## ✅ 4. TESTS & VALIDATIONS

### 4.1 Tests Unitaires (à ajouter dans `tests/unit/semantic.test.js`)

```javascript
describe('Semantic Aliases (USE_SEMANTIC_ALIASES=true)', () => {
  beforeEach(() => {
    // Mock USE_SEMANTIC_ALIASES = true
  });
  
  test('should generate aliasRef for semantic tokens', () => {
    const primitives = {
      gray: { '50': '#FAFAFA', '950': '#0A0A0A' },
      brand: { '500': '#6366F1' }
    };
    
    const semantics = mapSemanticTokens(primitives, presetTailwind, {});
    
    expect(semantics['bg.canvas'].modes.light.aliasRef).toEqual({
      category: 'gray',
      key: '50'
    });
  });
  
  test('should create Figma alias when USE_SEMANTIC_ALIASES=true', async () => {
    // Mock Figma API
    const mockVariable = {
      setValueForMode: jest.fn()
    };
    
    // Test import with alias
    await importTokensToFigma(tokens, 'tailwind', false);
    
    expect(mockVariable.setValueForMode).toHaveBeenCalledWith(
      lightModeId,
      expect.objectContaining({
        type: 'VARIABLE_ALIAS',
        id: expect.any(String)
      })
    );
  });
  
  test('should fallback to hardcoded value if alias fails', async () => {
    // Mock setValueForMode to throw
    const mockVariable = {
      setValueForMode: jest.fn().mockImplementationOnce(() => {
        throw new Error('Alias failed');
      })
    };
    
    // Should not throw, should fallback
    await expect(importTokensToFigma(tokens, 'tailwind', false)).resolves.not.toThrow();
  });
});
```

### 4.2 Tests d'Intégration (à ajouter dans `tests/integration/`)

```javascript
describe('Semantic Aliases End-to-End', () => {
  test('Generate → Import → Verify Aliases in Figma', async () => {
    // 1. Generate tokens
    const tokens = generateSemanticTokens(primitives, { naming: 'tailwind' });
    
    // 2. Import to Figma
    await importTokensToFigma(tokens, 'tailwind', false);
    
    // 3. Verify aliases exist
    const semanticCollection = figma.variables.getLocalVariableCollections()
      .find(c => c.name === 'Semantic');
    
    const bgCanvasVar = semanticCollection.variableIds
      .map(id => figma.variables.getVariableById(id))
      .find(v => v.name === 'bg / canvas');
    
    const lightMode = semanticCollection.modes.find(m => m.name === 'Light');
    const value = bgCanvasVar.valuesByMode[lightMode.modeId];
    
    // Should be alias, not hardcoded value
    expect(value.type).toBe('VARIABLE_ALIAS');
    expect(value.id).toBeDefined();
  });
});
```

### 4.3 Checklist Manuelle

```markdown
## Validation Manuelle - Semantic Aliases

### Pré-requis
- [ ] Code modifié selon plan
- [ ] Tests unitaires passent (npm test)
- [ ] Feature flag `USE_SEMANTIC_ALIASES = false` (rollback ready)

### Test 1: Génération (USE_SEMANTIC_ALIASES=false)
- [ ] Ouvrir Figma
- [ ] Générer tokens (Tailwind, couleur primaire #6366F1)
- [ ] Vérifier console: "Alias coverage: X/Y"
- [ ] Importer dans Figma
- [ ] Vérifier variables sémantiques ont valeurs hardcodées (pas d'alias)
- [ ] Export CSS: valeurs hex directes

### Test 2: Génération (USE_SEMANTIC_ALIASES=true)
- [ ] Changer flag: `USE_SEMANTIC_ALIASES = true`
- [ ] Recharger plugin
- [ ] Générer tokens (Tailwind, couleur primaire #6366F1)
- [ ] Vérifier console: "✅ [ALIAS_CREATED] bg.canvas (light) → alias to variableId: ..."
- [ ] Importer dans Figma
- [ ] Ouvrir variables sémantiques dans Figma
- [ ] Vérifier "bg / canvas" (Light) pointe vers "Grayscale / 50" (icône lien)
- [ ] Vérifier "bg / canvas" (Dark) pointe vers "Grayscale / 950"
- [ ] Modifier "Grayscale / 50" → vérifier "bg / canvas" change aussi
- [ ] Export CSS: `--bg-canvas: var(--gray-50);` (si implémenté)

### Test 3: Fallback (alias manquant)
- [ ] Supprimer manuellement "Grayscale / 50" dans Figma
- [ ] Régénérer tokens
- [ ] Vérifier console: "⚠️ [ALIAS_MISSING] bg.canvas (light): no aliasRef found"
- [ ] Vérifier "bg / canvas" a valeur hardcodée #FAFAFA
- [ ] Pas d'erreur bloquante

### Test 4: Toutes les librairies
- [ ] Tester avec MUI
- [ ] Tester avec Ant Design
- [ ] Tester avec Bootstrap
- [ ] Tester avec Chakra
- [ ] Vérifier alias créés pour chaque librairie

### Test 5: Rollback
- [ ] Changer flag: `USE_SEMANTIC_ALIASES = false`
- [ ] Recharger plugin
- [ ] Régénérer tokens
- [ ] Vérifier comportement identique à Test 1 (pas d'alias)
```

---

## 📊 5. MÉTRIQUES DE SUCCÈS

### Avant (USE_SEMANTIC_ALIASES=false)
- ✅ Tokens sémantiques: valeurs hardcodées
- ✅ Alias coverage: 0%
- ✅ Export CSS: valeurs hex directes
- ✅ Changement primitive: ne propage pas aux sémantiques

### Après (USE_SEMANTIC_ALIASES=true)
- ✅ Tokens sémantiques: alias Figma
- ✅ Alias coverage: >95% (objectif)
- ✅ Export CSS: var(--primitive) (si implémenté)
- ✅ Changement primitive: propage aux sémantiques automatiquement

---

## 🚀 6. PLAN D'EXÉCUTION

### Phase 1: Core Implementation (2-3h)
1. ✅ Ajouter feature flags
2. ✅ Modifier `importTokensToFigma` (alias creation)
3. ✅ Modifier `analyzeSemanticTokensStats` (compteur)
4. ✅ Tests unitaires
5. ✅ Tests manuels (USE_SEMANTIC_ALIASES=false)

### Phase 2: Validation (1-2h)
6. ✅ Activer flag (USE_SEMANTIC_ALIASES=true)
7. ✅ Tests manuels (toutes librairies)
8. ✅ Vérifier métriques (>95% alias)
9. ✅ Tests d'intégration

### Phase 3: Export (optionnel, 1-2h)
10. ⏳ Modifier exportToCSS (var() references)
11. ⏳ Modifier exportToJSON (préserver aliasTo)
12. ⏳ Modifier exportToTailwind
13. ⏳ Modifier exportToSCSS

### Phase 4: Production (1h)
14. ✅ Documentation (CHANGELOG.md)
15. ✅ Merge PR
16. ✅ Rollout progressif (flag=false → true après 1 semaine)

---

## 📝 7. FICHIERS MODIFIÉS

| Fichier | Lignes | Modification | Risque |
|---------|--------|--------------|--------|
| `code.js` | ~22 | Ajout feature flags | ⚪ Faible |
| `code.js` | 5937-5953 | Création alias Figma | 🟡 Moyen |
| `code.js` | 116-155 | Compteur alias | ⚪ Faible |
| `code.js` | TBD | Export CSS/JSON (Phase 3) | 🟡 Moyen |
| `tests/unit/semantic.test.js` | Nouveau | Tests alias | ⚪ Faible |
| `tests/integration/` | Nouveau | Tests E2E | ⚪ Faible |

---

## 🔄 8. ROLLBACK PROCEDURE

### En cas de problème

1. **Rollback immédiat** (1 ligne):
   ```javascript
   const USE_SEMANTIC_ALIASES = false;  // ← Changer true → false
   ```

2. **Vérifier**:
   - Régénérer tokens
   - Importer dans Figma
   - Vérifier valeurs hardcodées (pas d'alias)
   - Export identique à avant

3. **Si rollback échoue**:
   - Git revert du commit
   - Republier version précédente

---

## ⚠️ 9. RISQUES & MITIGATIONS

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| Alias non résolvable | Moyenne | Moyen | Fallback valeur hardcodée |
| Performance (création alias) | Faible | Faible | Async déjà présent |
| Régression export | Faible | Moyen | Tests avant/après |
| Incompatibilité librairies | Faible | Haut | Tests toutes libs |

---

## ✅ 10. CRITÈRES D'ACCEPTATION

- [ ] Feature flag `USE_SEMANTIC_ALIASES` fonctionne
- [ ] Rollback en 1 ligne (flag=false)
- [ ] Alias créés pour >95% des tokens sémantiques
- [ ] Fallback valeur hardcodée si alias échoue
- [ ] Pas d'erreur bloquante (STRICT_SEMANTIC_ALIAS_VALIDATION=false)
- [ ] Tests unitaires passent (137 → 145+)
- [ ] Tests manuels OK (5 librairies)
- [ ] Métriques alias visibles dans console
- [ ] Documentation à jour (CHANGELOG.md)
- [ ] Comportement identique si flag=false

---

**Prêt pour implémentation** 🚀
