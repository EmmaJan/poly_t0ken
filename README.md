# Emma Plugin - Figma Design Tokens

[![Tests](https://github.com/YOUR_USERNAME/emma-plugin-dev/workflows/Tests/badge.svg)](https://github.com/YOUR_USERNAME/emma-plugin-dev/actions)
[![Code Quality](https://github.com/YOUR_USERNAME/emma-plugin-dev/workflows/Code%20Quality/badge.svg)](https://github.com/YOUR_USERNAME/emma-plugin-dev/actions)
[![codecov](https://codecov.io/gh/YOUR_USERNAME/emma-plugin-dev/branch/main/graph/badge.svg)](https://codecov.io/gh/YOUR_USERNAME/emma-plugin-dev)

> Plugin Figma professionnel pour la génération et gestion de design tokens accessibles et conformes aux standards des librairies UI modernes.

## ✨ Features

- 🎨 **Token Generation** : Génération automatique de palettes complètes (Brand, Gray, System, Semantic)
- 📚 **Multi-Library Support** : Tailwind, MUI, Ant Design, Bootstrap, Chakra UI, Shadcn
- 🔍 **Smart Scan** : Détection automatique des écarts avec suggestions intelligentes
- 🎯 **Auto-Fix** : Application automatique ou manuelle des corrections
- 🌓 **Theme Support** : Gestion des modes light/dark
- 📤 **Export Formats** : CSS, JSON, Tailwind, SCSS
- ♿ **Accessibility** : Tokens conformes WCAG AA
- 🔄 **Semantic Tokens** : Alias et résolution automatique

## 🚀 Quick Start

### Installation

1. Ouvrir Figma Desktop
2. Menu → Plugins → Development → Import plugin from manifest
3. Sélectionner `manifest.json`

### Usage

1. **Generate Tokens** : Choisir une librairie et une couleur primaire
2. **Scan Frame** : Analyser un frame pour détecter les écarts
3. **Apply Fixes** : Appliquer les corrections suggérées
4. **Export** : Exporter les tokens dans le format souhaité

## 🧪 Tests

Le plugin dispose d'une suite de tests complète avec **137 tests** couvrant :

- ✅ Tests unitaires (105 tests)
- ✅ Tests d'intégration (32 tests)
- ✅ Couverture de code > 50%

```bash
# Lancer tous les tests
npm test

# Mode watch
npm run test:watch

# Rapport de couverture
npm run test:coverage
```

Voir [tests/README.md](tests/README.md) pour plus de détails.

## 📊 CI/CD

Le projet utilise GitHub Actions pour :

- ✅ Exécution automatique des tests sur chaque push/PR
- ✅ Tests sur Node.js 18.x et 20.x
- ✅ Rapport de couverture automatique (Codecov)
- ✅ Vérification de la qualité du code
- ✅ Monitoring de la taille des fichiers

## 🏗️ Architecture

```
emma-plugin-dev/
├── code.js              # Plugin backend (10,975 lignes)
├── ui.html              # Plugin UI (11,744 lignes)
├── manifest.json        # Plugin manifest
├── tests/               # Suite de tests (137 tests)
│   ├── unit/           # Tests unitaires
│   └── integration/    # Tests d'intégration
└── docs/               # Documentation
```

## 🛠️ Development

### Prerequisites

- Node.js 18.x ou 20.x
- npm 9.x ou supérieur
- Figma Desktop

### Setup

```bash
# Installer les dépendances
npm install

# Lancer les tests
npm test

# Lancer les tests en mode watch
npm run test:watch
```

### Code Quality

Le projet maintient des standards de qualité élevés :

- ✅ 137 tests automatisés
- ✅ Validation des messages UI ↔ Plugin
- ✅ Error handling robuste
- ✅ Logging centralisé

## 📝 Documentation

- [Tests README](tests/README.md) - Documentation des tests
- [Implementation Plan](docs/IMPLEMENTATION_PLAN.md) - Plan de refactor
- [Future Improvements](docs/FUTURE_IMPROVEMENTS.md) - Roadmap

## 🤝 Contributing

Les contributions sont les bienvenues ! Merci de :

1. Fork le projet
2. Créer une branche (`git checkout -b feature/amazing-feature`)
3. Commit les changements (`git commit -m 'Add amazing feature'`)
4. Push vers la branche (`git push origin feature/amazing-feature`)
5. Ouvrir une Pull Request

**Important** : Tous les tests doivent passer avant merge.

## 📈 Changelog

### v1.1.0 (2025-12-22)

- ✅ Ajout de 137 tests automatisés
- ✅ Setup CI/CD avec GitHub Actions
- ✅ Refactor incrémental (validation, déduplication)
- ✅ Documentation complète

### v1.0.0

- 🎉 Release initiale

## 📄 License

ISC

## 🙏 Acknowledgments

- Figma Plugin API
- Jest Testing Framework
- GitHub Actions

---

**Note** : Remplacer `YOUR_USERNAME` dans les badges par votre nom d'utilisateur GitHub.


