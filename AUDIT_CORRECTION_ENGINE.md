# Audit du Moteur de Correction (Scan & Fix)

## 1. État des Lieux Technique

L'audit du fichier `code.js` a révélé plusieurs bugs critiques qui expliquent pourquoi les corrections pour le Spacing et le Radius ne fonctionnent pas comme attendu.

### 🔴 Bugs Identifiés (Critiques)

1.  **ReferenceError sur `contextModeId`** : 
    - Dans les fonctions `checkCornerRadiusSafely` et `checkNumericPropertiesSafely`, la variable `contextModeId` est utilisée mais n'est pas définie dans le scope local (paramètre manquant).
    - **Impact** : Le scan numérique plante ou passe `undefined`, rendant le matching par mode impossible.

2.  **Filtrage Sémantique trop strict** :
    - La fonction `isSemanticVariable` exclut actuellement les tokens qui n'ont pas de slash (`/`) ou un préfixe spécifique (`radius-`, `spacing-`, etc.).
    - Si l'utilisateur possède une collection "Spacing" avec des variables nommées simplement "Small", "Medium", elles sont ignorées.

3.  **Filtrage par Scopes Figma** :
    - La fonction `filterVariableByScopes` est stricte : si une variable n'a aucun scope défini (cas fréquent sur des variables importées ou créées via API sans configuration), elle est exclue du scan.
    - **Impact** : Invisibilité totale des variables valides mais non configurées.

4.  **Incomplétude du Scoring** :
    - La fonction `calculateScore` est optimisée pour les couleurs (`Fill`, `Stroke`) mais ne donne aucun bonus contextuel pour le `SPACING` ou le `RADIUS`.

---

## 2. Plan de Refonte

### A. Core Engine (Indexation & Suggestion)
- **Synchronisation Totale** : S'assurer que `isSemanticVariable` est la seule source de vérité pour l'indexation ET pour les suggestions.
- **Assouplissement Intelligent** : Si une variable appartient à une collection nommée "Spacing" ou "Radius", elle doit être considérée comme sémantique même sans préfixe spécial.
- **Moteur V2 Partout** : Uniformiser l'usage de `findColorSuggestionsV2` et `findNumericSuggestionsV2`.

### B. Fiabilité du Contexte (Modes)
- **Détecteur de Mode Robuste** : Améliorer `detectNodeModeId` pour qu'il soit plus intelligent sur l'héritage des modes et la détection de la collection sémantique.
- **Injection Systématique** : Fixer le passage de `contextModeId` dans TOUTES les fonctions de scan.

### C. Qualité des Suggestions
- **Smart Scoring Spacing/Radius** : Booster les tokens qui contiennent "spacing" ou "radius" dans leur nom lorsque la propriété scannée correspond.
- **Filtrage de Scopes Progressif** : Si une variable n'a aucun scope, on l'autorise par défaut s'il n'y a pas d'autre match exact.

### D. Expérience Utilisateur (UI)
- **Nettoyage Post-Fix** : Garantir qu'après une application de correctif, le re-scan automatique filtre bien les propriétés maintenant liées (`IssueStatus.BOUND`).
