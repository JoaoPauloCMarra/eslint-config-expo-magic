# eslint-config-expo-magic

> 🚀 **The Ultimate ESLint Configuration for React Native & Expo Projects** - Save hours of configuration and ship better code faster!

[![npm version](https://img.shields.io/npm/v/eslint-config-expo-magic.svg)](https://www.npmjs.com/package/eslint-config-expo-magic)
[![CI](https://github.com/JoaoPauloCMarra/eslint-config-expo-magic/actions/workflows/ci.yml/badge.svg)](https://github.com/JoaoPauloCMarra/eslint-config-expo-magic/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

**Stop wasting time configuring ESLint!** Get a production-ready, performance-optimized configuration that enforces best practices for React Native, Expo, and TypeScript projects in minutes.

## ✨ Features

- ⚡ **5-minute setup** - Just install and go!
- 🔧 **Zero configuration** - Works out of the box with sensible defaults
- 🚀 **Performance optimized** - Includes React Compiler and advanced TypeScript rules
- 📱 **Mobile-first** - Tailored for React Native and Expo development
- 🔮 **Future-proof** - React 19 upgrade rules included
- 🎪 **All-in-one** - No need to configure multiple plugins

## 📦 Installation

```bash
# 🚀 Recommended: Use bun (required for this project)
bun add --dev eslint-config-expo-magic
```

### Prerequisites
- **Node.js** 16.0.0+
- **Bun** 1.0.0+ (required)
- **Expo SDK** 49+ (recommended: 54+)
- **ESLint** 9.x+ with flat config
- **React** 18.0.0+
- **TypeScript** 5.0.0+

### Peer Dependencies

Make sure your project has these packages:

```json
{
  "dependencies": {
    "react": ">=18.0.0",
    "expo": ">=49.0.0",
    "react-test-renderer": ">=18.0.0"
  },
  "devDependencies": {
    "eslint": ">=9.0.0",
    "typescript": ">=5.0.0"
  }
}
```

## 🚀 Quick Start

Create `eslint.config.js` in your project root:

```javascript
const expoMagic = require('eslint-config-expo-magic');

module.exports = [
  ...expoMagic,
  // Your custom overrides here
];
```

**That's it!** 🎉 Your project now has enterprise-grade linting!

## 📋 What's Included

### 🔷 TypeScript Rules
Advanced type checking, performance optimizations, and error prevention.

### ⚛️ React & React Native Rules
Performance-focused rules for React and mobile development, including **React Compiler linting** via `eslint-plugin-react-hooks` v7+ (detects impure functions, setState during render, unsupported syntax, and memoization issues).

### 📦 Import Organization
Smart import sorting, unused import detection, and circular dependency prevention.

### 🧪 Testing Rules
Best practices for Jest and Testing Library.

### 💅 Code Formatting
Prettier integration with sensible defaults (your config takes precedence).

### 📱 App-Specific Rules
Expo and React Native optimizations, including platform-specific components.

## 🎛️ Customization

Override any rule by adding to your `eslint.config.js`:

```javascript
const expoMagic = require('eslint-config-expo-magic');

module.exports = [
  ...expoMagic,
  {
    rules: {
      // Change severity
      'react-native/no-inline-styles': 'warn',
      // Turn off rules
      '@typescript-eslint/no-explicit-any': 'off',
      // Add custom rules
      'no-alert': 'error',
    },
  },
];
```

### Common Overrides

```javascript
// Allow inline styles in story files
{
  files: ['**/*.story.*', '**/*.stories.*'],
  rules: {
    'react-native/no-inline-styles': 'off',
  },
}

// Relax rules for config files
{
  files: ['*.config.js', '*.config.ts'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
  },
}
```

## 🆚 Comparison

| Feature | Manual Setup | expo-magic |
|---------|--------------|------------|
| Setup Time | 2-4 hours | 5 minutes |
| Plugins | 10+ configs | 1 package |
| TypeScript | Basic rules | Advanced + Performance |
| React Native | Generic rules | Mobile-optimized |
| Expo Integration | Manual | Built-in |

## 🤝 Contributing

We welcome contributions! The config is modular - each rule category lives in `utils/`.

**Ways to contribute:**
- 🐛 Bug reports
- 💡 Feature requests
- 📝 Documentation improvements
- 🧪 Testing feedback

## 📄 License

**MIT License** - Use it freely in your projects!

---

<div align="center">

**Made with ❤️ for the React Native & Expo community**

[⭐ Star us on GitHub](https://github.com/JoaoPauloCMarra/eslint-config-expo-magic) • [🐛 Report Issues](https://github.com/JoaoPauloCMarra/eslint-config-expo-magic/issues)

</div>
