# Audit du Code Mort - ui.html
**Date:** 30 Décembre 2025
**Fichier Cible:** `/Users/polyconseil/Desktop/emma-plugin-dev/ui.html`

## 1. Synthèse
L'audit a révélé une quantité significative de code hérité ("Legacy") lié aux anciennes méthodes de rendu des cartes de résultats (Scan & Fix). Environ **300 à 500 lignes de code JavaScript** sont identifiées comme "mortes" ou inutilisées par l'interface actuelle (qui repose sur `generateUnifiedCleaningContent`).

## 2. Fonctions Mortes (Unused Functions)
Ces fonctions ne sont plus appelées par le flux d'exécution principal (`displayScanResults` -> `generateUnifiedCleaningContent`).

| Fonction | Ligne Approx. | Statut | Raison |
| :--- | :--- | :--- | :--- |
| `renderCompactRow` | ~6171 | **MORT** | 0 références d'appel. Ancienne méthode de rendu. |
| `generateColorCard` | ~9593 | **MORT** | 0 références. Remplacé par le rendu unifié. |
| `generateGeometryCard` | ~9625 | **MORT** | 0 références. |
| `generateVariableSelector`| ~9545 | **MORT** | Appelée uniquement par les fonctions mortes ci-dessus. |
| `syncScanResults` | ~10342 | **MORT** | Semble inutilisée (pas d'appelant trouvé). |
| `highlightLayers` | ~6309 | **MORT** | Utilise par `renderCompactRow` (onclic). Remplacée par `selectNodesInFigma`. |
| `applyManualFix` | ~6160 | **MORT** | Helper pour `renderCompactRow`. Remplacée par `applyGroupedFix`. |
| `applyGroupFix` | ~6325 | **MORT** | Ancienne version, appelée seulement par `applyManualFix`. |
| `handleConflictSelectChange`| ~6130 | **MORT** | Helper pour `renderCompactRow`. |

## 3. Listeners Orphelins & Redondants
Ces écouteurs d'événements attendent des éléments qui ne sont plus générés, ou dupliquent une logique existante.

| Listener / Init | Ligne Approx. | Statut | Raison |
| :--- | :--- | :--- | :--- |
| `initVariableSelectors` | ~8707 | **ORPHELIN** | Écoute les classes `.manual-select` et `.variable-selector` qui ne sont plus générées par le nouveau rendu. |
| `initManualSelectors` | ~9100 | **ORPHELIN** | Alias de `initVariableSelectors`. |
| `initCustomDropdowns` | ~8977 | **REDONDANT**| Logique dupliquée par `setupDropdownDelegation` (~6968) qui gère les dropdowns via délégation sur `#unifiedCleaningList`. |

## 4. Plan de Suppression (Strangler Pattern)
Pour supprimer ce code sans risque de régression :

1.  **Désactivation (Disable)** : Commenter les appels d'initialisation dans `DOMContentLoaded` (~L9538).
    *   Commenter `initManualSelectors();` (anciennement `initVariableSelectors`).
    *   Commenter `initCustomDropdowns();` (vérifier que les dropdowns fonctionnent toujours grâce à la délégation).
2.  **Neutralisation (Comment Out)** : Commenter les blocs de définition des fonctions mortes listées ci-dessus.
3.  **Test** :
    *   Lancer le plugin en mode "Scan".
    *   Vérifier que les cartes s'affichent ("Auto" et "Manuel").
    *   Vérifier que les actions "Appliquer" et "Ignorer" fonctionnent.
    *   Vérifier que les dropdowns (suggestions manuelles) s'ouvrent et sélectionnent.
4.  **Suppression (Delete)** : Une fois validé, supprimer définitivement le code commenté.

## 5. Notes Spéciales
*   **Navigation Clavier** : Les fonctions `updateKeyboardSelectableCards` (~9274) et `applyKeyboardSelection` (~9298) contiennent encore des références à `.variable-selector`. Ces branches de code sont mortes ("dead paths") à l'intérieur de fonctions vivantes. Il faudra les nettoyer lors de la suppression.
*   **External Deps** : Si `modules.js` contient un `UIManager` externe, vérifier qu'il ne réinjecte pas de HTML legacy (peu probable, mais à garder en tête).
