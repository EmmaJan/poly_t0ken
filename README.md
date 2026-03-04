# PolyToken by Emma

Plugin Figma pour générer, gérer et appliquer des design tokens accessibles, alignés sur les standards des principales librairies UI.

## Fonctionnalités

### Génération de tokens
- Choix de la librairie cible : **Tailwind/Shadcn**, **MUI**, **Ant Design**, **Bootstrap**, **Chakra UI**, ou **Custom**
- Sélection d'une couleur primaire avec vérification de l'accessibilité (contraste WCAG)
- Génération automatique de palettes : Brand, System, Gray, Spacing, Radius, Typography, Border, Semantic
- Aperçu des tokens avant import

### Export
Formats disponibles : **CSS**, **JSON**, **Tailwind config**, **SCSS**

### Import dans Figma
Synchronise les tokens générés directement comme variables Figma (modes light/dark inclus).

### Scan et correction
- Analyse la sélection, le frame ou la page entière
- Détecte les éléments n'utilisant pas de variables Figma
- Suggère les variables correspondantes et permet de les appliquer en un clic (auto ou manuel)

## Installation

1. Dans Figma, ouvrir **Plugins > Gérer les plugins**
2. Cliquer sur **+** et choisir **Importer un plugin depuis un manifest**
3. Sélectionner le fichier `manifest.json` de ce dossier

## Développement

```bash
npm install
npm test
```

## Structure

```
manifest.json   # Configuration du plugin Figma
code.js         # Logique principale (backend Figma)
ui.html         # Interface utilisateur
assets/         # Icônes SVG
tokens.css      # Tokens CSS de référence
tests/          # Tests unitaires et d'intégration
```
