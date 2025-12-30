# Guide de Test - Scan & Fix Patch

## Préparation
1. Ouvrir Figma
2. Charger le plugin
3. Ouvrir la console développeur (Cmd+Option+I sur Mac)

## Test 1 : Vérification du log V2 ✅
**Objectif** : Confirmer que la version V2 du scan est active

**Étapes** :
1. Recharger le plugin
2. Vérifier dans la console :
   ```
   ✅ Plugin initialized: scopes use setScopes() method only
   ✅ Using V2 scan functions (mode-aware, ValueType.FLOAT, strict scoping)
   ```

**Résultat attendu** : Les deux logs apparaissent au démarrage

---

## Test 2 : GAP exact avec variable sémantique ✅
**Objectif** : Vérifier que les gaps exacts trouvent leurs variables

**Préparation** :
1. Créer une variable sémantique `spacing/gap-4` = 4px
2. Créer un Auto Layout avec `itemSpacing = 4px` (non lié)

**Étapes** :
1. Sélectionner le frame
2. Lancer le scan
3. Vérifier les résultats

**Résultat attendu** :
- ✅ Une issue apparaît pour "Spacing"
- ✅ `numericSuggestions` contient `spacing/gap-4`
- ✅ La suggestion est marquée `isExact: true`
- ✅ L'onglet "Auto" contient cette issue

---

## Test 3 : Tolérance EPSILON pour floats ✅
**Objectif** : Vérifier que les erreurs de précision float sont gérées

**Préparation** :
1. Créer une variable `spacing/gap-4` = 4px
2. Via l'API ou manipulation, créer un gap de 4.0000001px

**Étapes** :
1. Sélectionner le frame
2. Lancer le scan
3. Vérifier les résultats

**Résultat attendu** :
- ✅ La variable `spacing/gap-4` est trouvée
- ✅ Marquée comme `isExact: true`
- ✅ Pas de différence visible avec un gap de 4.0px exact

---

## Test 4 : Logs DEBUG en cas d'erreur ✅
**Objectif** : Vérifier que les erreurs sont loggées avec contexte

**Préparation** :
1. Activer `DEBUG = true` dans code.js (ligne ~25)
2. Créer un node avec des propriétés complexes/mixtes

**Étapes** :
1. Sélectionner le node
2. Lancer le scan
3. Observer la console

**Résultat attendu** :
- ✅ Si erreur, log format : `[SCAN ERROR] functionName { nodeId, nodeName, nodeType, prop, error }`
- ✅ Pas de crash silencieux
- ✅ Le scan continue malgré les erreurs

**Fonctions à surveiller** :
- `checkCornerRadiusSafely:individual`
- `checkStrokesSafely:stroke`
- `checkNumericPropertiesSafely:padding`
- `checkFillsSafely`
- `checkTypographyPropertiesSafely`

---

## Test 5 : UI sans badge "Already bound" ✅
**Objectif** : Confirmer que le badge a été supprimé

**Préparation** :
1. Créer un rectangle avec fill lié à une variable
2. Modifier légèrement la couleur pour créer une issue

**Étapes** :
1. Sélectionner le rectangle
2. Lancer le scan
3. Observer l'UI des résultats

**Résultat attendu** :
- ✅ Aucun badge "Already bound" visible
- ✅ L'issue apparaît normalement
- ✅ Affichage basé uniquement sur status (NO_MATCH/HAS_MATCHES)

---

## Test 6 : numericSuggestions non vide ✅
**Objectif** : Vérifier que les suggestions numériques sont bien remplies

**Préparation** :
1. Créer des variables : `radius/sm = 4px`, `radius/md = 8px`
2. Créer un rectangle avec `cornerRadius = 4px` (non lié)

**Étapes** :
1. Sélectionner le rectangle
2. Lancer le scan
3. Inspecter l'objet issue dans la console

**Résultat attendu** :
```javascript
{
  property: "Corner Radius",
  rawValueType: "FLOAT",
  value: "4px",
  numericSuggestions: [
    { id: "...", name: "radius/sm", resolvedValue: 4, isExact: true }
  ],
  suggestions: [...] // même contenu
}
```

---

## Test 7 : Comportement strict conservé ✅
**Objectif** : Vérifier qu'il n'y a pas de rounding automatique

**Préparation** :
1. Créer une variable `spacing/gap-8` = 8px
2. Créer un gap de 7px

**Étapes** :
1. Sélectionner le frame
2. Lancer le scan
3. Vérifier les suggestions

**Résultat attendu** :
- ✅ `spacing/gap-8` n'est PAS suggéré (7 ≠ 8)
- ✅ Soit NO_MATCH, soit suggestions approximatives (si tolerance > 0)
- ✅ Aucune suggestion marquée `isExact: true`

---

## Checklist de validation finale

- [ ] Log V2 apparaît au démarrage
- [ ] GAP exact trouve sa variable sémantique
- [ ] EPSILON gère les erreurs de float (4.0000001 = 4)
- [ ] Logs DEBUG apparaissent en cas d'erreur
- [ ] Aucun badge "Already bound" visible
- [ ] numericSuggestions est rempli pour les FLOAT
- [ ] Pas de rounding automatique (7 ≠ 8)
- [ ] Syntaxe validée : `node -c code.js` ✅
- [ ] Aucune régression sur les scans existants

---

## Commandes utiles

```bash
# Vérifier la syntaxe
node -c code.js

# Rechercher les catch silencieux restants
grep -n "catch.*{.*}" code.js | grep -v "DEBUG"

# Compter les modifications
git diff --stat
```

## En cas de problème

1. **Pas de suggestions** : Vérifier que `VariableIndex.isBuilt === true`
2. **Erreurs de float** : Vérifier EPSILON = 0.001 dans findNumericSuggestionsV2
3. **Crash silencieux** : Activer DEBUG et chercher les logs
4. **Badge visible** : Vérifier que ui.html ligne 6811-6814 est supprimée
