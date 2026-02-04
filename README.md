# eslint-config-expo-magic

> 🚀 **The Ultimate ESLint Configuration for React Native & Expo Projects** - Save hours of configuration and ship high-quality code.

[![npm version](https://img.shields.io/npm/v/eslint-config-expo-magic.svg)](https://www.npmjs.com/package/eslint-config-expo-magic)
[![CI](https://github.com/JoaoPauloCMarra/eslint-config-expo-magic/actions/workflows/ci.yml/badge.svg)](https://github.com/JoaoPauloCMarra/eslint-config-expo-magic/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

**Stop wasting time fighting with ESLint configs.** Get a production-ready, performance-optimized setup that enforces best practices for React Native, Expo, and TypeScript projects in seconds.

## ✨ Features

- ⚡ **Instant Setup** - Flat config ready. Just install and go.
- 🔧 **Zero Noise** - Opinionated defaults that actually make sense for mobile development.
- 🚀 **Performance Optimized** - Includes rules for React Compiler and advanced TypeScript performance.
- 📱 **Mobile-First** - Deep integration with Expo SDK and React Native specific pitfalls.
- 🔮 **Future-Proof** - Built-in React 19 upgrade path and modern ECMAScript support.
- 🎪 **All-in-One** - Consolidates 10+ plugins into a single, cohesive package.

## 📦 Installation

```bash
# Recommended: Use bun
bun add --dev eslint-config-expo-magic
```

### Prerequisites

- **Node.js** 18.0.0+
- **Bun** 1.0.0+
- **ESLint** 9.39.2+ (Flat Config)
- **Expo SDK** 54.0.33+
- **TypeScript** 5.9.3+
- **React** 19.2.3+
- **React Test Renderer** 19.2.3+

### Peer Dependencies

Ensure your `package.json` includes these minimum versions:

```json
{
	"devDependencies": {
		"eslint": ">=9.39.2",
		"expo": ">=54.0.33",
		"react": ">=19.2.3",
		"react-test-renderer": ">=19.2.3",
		"typescript": ">=5.9.3"
	}
}
```

## 🚀 Quick Start

Create an `eslint.config.js` in your project root:

```javascript
const expoMagic = require('eslint-config-expo-magic');

module.exports = [
	...expoMagic,
	// Your custom overrides here
];
```

For strict enforcement:

```javascript
const { strict } = require('eslint-config-expo-magic');

module.exports = [...strict];
```

## 🛡️ Pre-commit Workflow

Stop shipping broken code. Integrate with `husky` and `lint-staged` to automatically lint and fix code before every commit:

1. Install dependencies:

   ```bash
   bun add --dev husky lint-staged
   ```

2. Add this to your `package.json`:
   ```json
   {
   	"lint-staged": {
   		"*.{js,jsx,ts,tsx}": ["eslint --fix", "prettier --write"],
   		"*.{json,md,yml}": ["prettier --write"]
   	}
   }
   ```

## 📋 What's Included

- **🔷 TypeScript**: Advanced type-checking, `import type` enforcement, and naming consistency.
- **⚛️ React 19 & Hooks**: Future-proof rules for React 19 and advanced Hook dependency checking.
- **📱 Expo & Mobile**: Platform-specific component checks and Expo performance optimizations.
- **📦 Import Excellence**: Smart sorting, circular dependency detection, and auto-cleanup of unused imports.
- **🧪 Testing**: Optimized rules for Jest and React Native Testing Library.
- **💅 Formatting**: Seamless Prettier integration (ready to work with your `.prettierrc`).

Check [RULES.md](./RULES.md) for the full list of opinionated rules and their rationales.

## 🎛️ Customization

Simply add an object after the spread config to override anything:

```javascript
const expoMagic = require('eslint-config-expo-magic');

module.exports = [
	...expoMagic,
	{
		rules: {
			'no-console': 'error',
			'@typescript-eslint/no-explicit-any': 'off',
		},
	},
];
```

## 🆚 Comparison

| Feature             | Manual Setup       | expo-magic        |
| ------------------- | ------------------ | ----------------- |
| Setup Time          | 2-4 hours          | 30 seconds        |
| Maintenance         | High (10+ plugins) | Low (1 package)   |
| React 19 Readiness  | Manual             | Built-in          |
| Mobile Optimization | Generic            | Tailored for Expo |
| Complexity          | Very High          | Zero              |

## 🤝 Contributing

Each rule category is modular and lives in `utils/`. We welcome bug reports and feature requests!

---

<div align="center">
**Made with ❤️ for the React Native & Expo community**

[⭐ Star us on GitHub](https://github.com/JoaoPauloCMarra/eslint-config-expo-magic) • [🐛 Report Issues](https://github.com/JoaoPauloCMarra/eslint-config-expo-magic/issues)

</div>
