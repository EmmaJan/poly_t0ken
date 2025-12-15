# 🔍 Guide de débogage : Styles locaux Figma

## Problème rapporté
Le live preview ne fonctionne pas pour les styles locaux détectés.

## Étapes de diagnostic

### 1. Vérifier la présence de styles locaux dans Figma

**Dans Figma :**
- Sélectionnez un élément
- Ouvrez le panneau "Design" (Shift+0)
- Regardez les propriétés Fill/Stroke
- Si vous voyez un losange 🟦 au lieu d'un cercle plein ⭕, c'est un style local
- Cliquez sur le losange pour voir le nom du style local

### 2. Vérifier que le scan détecte les styles locaux

**Dans le plugin :**
- Cliquez sur "Auditer la sélection"
- Vérifiez que des résultats apparaissent avec "Local Fill Style" ou "Local Stroke Style"
- Si aucun résultat n'apparaît, les styles locaux ne sont pas détectés

### 3. Tester le live preview

**Test du live preview :**
- Survolez une suggestion de correction pour un style local
- Le live preview devrait s'activer automatiquement
- Vérifiez dans Figma si l'élément change de couleur en temps réel

## Causes possibles et solutions

### Cause 1 : Aucun style local dans la sélection
**Solution :**
- Créez un style local dans Figma :
  1. Sélectionnez un élément avec une couleur
  2. Cliquez droit sur la propriété Fill/Stroke
  3. Choisissez "Create style"
  4. Appliquez ce style à d'autres éléments
  5. Relancez le scan

### Cause 2 : Problème de variables correspondantes
**Solution :**
- Assurez-vous d'avoir des variables de couleur définies
- Les variables doivent avoir exactement la même couleur que le style local

### Cause 3 : Erreur dans le code du plugin
**Solution :**
- Ouvrez la console développeur de Figma (Menu > Plugins > Development > Open console)
- Cherchez des erreurs JavaScript lors du scan ou du preview

## Code de débogage ajouté

J'ai ajouté des logs de débogage dans la fonction `checkLocalStylesSafely`. Pour les voir :

1. Ouvrez la console développeur de Figma
2. Relancez un scan
3. Cherchez les messages commençant par "Local Style Detection:"

## Test rapide

Pour tester rapidement, créez :
1. Un rectangle rouge (#FF0000)
2. Créez un style local nommé "Red Style"
3. Appliquez ce style à un autre rectangle
4. Créez une variable de couleur rouge (#FF0000)
5. Lancez le scan - vous devriez voir "Local Fill Style" détecté

## Logs de débogage ajoutés

Les logs suivants devraient apparaître dans la console Figma :

```
Local Style Detection: Checking node [nodeId] for local styles
Local Style Detection: Found fillStyleId: [styleId]
Local Style Detection: Retrieved local style: [styleName]
Local Style Detection: Style color: #[hex]
Local Style Detection: Found suggestions: [count]
Local Style Detection: Added result for Local Fill Style
```

Si ces logs n'apparaissent pas, le problème est dans la détection.
Si les logs apparaissent mais pas le live preview, le problème est dans l'application.