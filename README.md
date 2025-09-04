# eslint-config-expo-magic

> 🚀 **The Ultimate ESLint Configuration for React Native & Expo Projects** - Save hours of configuration and ship better code faster!

[![npm version](https://img.shields.io/npm/v/eslint-config-expo-magic.svg)](https://www.npmjs.com/package/eslint-config-expo-magic)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Downloads](https://img.shields.io/npm/dm/eslint-config-expo-magic.svg)](https://www.npmjs.com/package/eslint-config-expo-magic)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![Expo](https://img.shields.io/badge/Expo-Supported-black.svg)](https://expo.dev/)
[![React Native](https://img.shields.io/badge/React%20Native-Compatible-61dafb.svg)](https://reactnative.dev/)

**Stop wasting time configuring ESLint!** Get a production-ready, performance-optimized configuration that enforces best practices for React Native, Expo, and TypeScript projects in minutes.

## ✨ Why Choose eslint-config-expo-magic?

### 🎯 **Solves Real Problems**
- ❌ **Tired of configuring 10+ ESLint plugins manually?**
- ❌ **Frustrated with inconsistent code quality across your team?**
- ❌ **Want to catch TypeScript errors before they reach production?**
- ❌ **Need React Native and Expo-specific optimizations?**

### ✅ **Our Solution**
- **⚡ 5-minute setup** - Just install and go!
- **🔧 Zero configuration** - Works out of the box with sensible defaults
- **🚀 Performance optimized** - Includes React Compiler and advanced TypeScript rules
- **📱 Mobile-first** - Tailored for React Native and Expo development
- **🔮 Future-proof** - React 19 upgrade rules included

## 🔥 Key Features

| Feature | Benefit |
|---------|---------|
| **🎪 All-in-One** | No need to configure multiple plugins |
| **⚡ Performance** | React Compiler + optimized rules |
| **🔍 TypeScript First** | Advanced type checking and error prevention |
| **📱 Expo Optimized** | Platform-specific rules and optimizations |
| **⚛️ React 19 Ready** | Future-proof with latest React patterns |
| **📦 Smart Imports** | Automatic organization and sorting |
| **🧪 Testing Support** | Jest + Testing Library rules included |
| **💅 Code Formatting** | Prettier integration built-in |

## 🚀 Quick Start

### Prerequisites
- **Node.js** 16.0.0 or higher
- **Bun** 1.0.0 or higher (required - this project uses bun as package manager)
- **Expo SDK** 49+ (recommended: 54+)
- **ESLint** 8.x+ with flat config support

### 📦 Package Manager

This project **requires Bun** as the package manager. Please use bun for all package management operations:

```bash
# ✅ Correct - Use bun
bun install
bun add package-name
bun remove package-name

# ❌ Avoid - Don't use npm/yarn/pnpm
npm install
yarn add package-name
pnpm add package-name
```

**Why Bun?** Faster installs, better performance, and consistent lockfile management.

### Installation

```bash
# 🚀 Recommended: Use bun (required for this project)
bun add --dev eslint-config-expo-magic

# ⚠️  Other package managers are not supported
# npm install --save-dev eslint-config-expo-magic
# yarn add --dev eslint-config-expo-magic
# pnpm add --dev eslint-config-expo-magic
```

### Setup (2 minutes!)

#### Option 1: Flat Config (Recommended)
Create `eslint.config.js` in your project root:

```javascript
const expoMagic = require('eslint-config-expo-magic');

module.exports = [
  ...expoMagic,
  // Your custom overrides here
];
```

#### Option 2: Traditional Config
Create `.eslintrc.js` in your project root:

```javascript
module.exports = {
  root: true,
  extends: ['eslint-config-expo-magic'],
  // Your custom rules here
};
```

**That's it!** 🎉 Your project now has enterprise-grade linting!

## 🛡️ Quality Assurance

This package includes **built-in validation** that runs automatically before publishing:

- ✅ **ESLint Rules Validation** - All 27+ rules tested and working
- ✅ **TypeScript Compatibility** - Advanced type checking verified
- ✅ **React Native & Expo** - Platform-specific rules validated
- ✅ **Testing Suite** - Jest and Testing Library integration tested
- ✅ **Prettier Integration** - Code formatting consistency ensured

The validation runs automatically on `prepublishOnly`, ensuring every published version meets quality standards.

## 📋 What's Included (Complete Rule Set)

### 🔧 Core Technologies
- **JavaScript ES2022+** - Modern syntax support
- **TypeScript 5.x** - Advanced type checking and performance rules
- **React 18/19** - Latest React patterns and hooks
- **React Native** - Mobile-specific optimizations
- **Expo SDK** - Platform integration and environment handling

### 🎯 Enforced Best Practices

#### TypeScript Excellence
- ✅ **No interfaces** (uses types for better performance)
- ✅ **Strict type checking** with smart error handling
- ✅ **Type-only imports** for smaller bundles
- ✅ **Advanced TypeScript rules** for error prevention

#### React & Performance
- ✅ **React Compiler** support for automatic optimization
- ✅ **Exhaustive dependencies** in hooks
- ✅ **No unstable nested components**
- ✅ **Future-proof React 19** upgrade rules

#### React Native & Expo
- ✅ **No inline styles** (performance killer!)
- ✅ **Platform-specific components** properly split
- ✅ **SafeAreaView** from react-native-safe-area-context
- ✅ **Expo environment** variables and globals

#### Code Quality
- ✅ **Smart import sorting** (React → External → Internal)
- ✅ **No unused variables/imports**
- ✅ **Consistent naming conventions**
- ✅ **Self-closing tags** where appropriate

#### Testing & Formatting
- ✅ **Jest** best practices
- ✅ **Testing Library** async/await patterns
- ✅ **Prettier** integration
- ✅ **No debugging utils** in production

## 🆚 Comparison: Manual Setup vs expo-magic

| Feature | Manual Setup | expo-magic |
|---------|--------------|------------|
| **Setup Time** | 2-4 hours | 5 minutes |
| **Plugins** | 10+ separate configs | 1 package |
| **TypeScript** | Basic rules | Advanced + Performance |
| **React Native** | Generic rules | Mobile-optimized |
| **Expo Integration** | Manual config | Built-in |
| **React Compiler** | Manual setup | Ready-to-use |
| **Future Updates** | Manual maintenance | Auto-updated |

## 💡 Real-World Examples

### Before (Common Issues)
```javascript
// ❌ Inline styles (performance killer)
<View style={{ margin: 10, padding: 20 }}>
  <Text>Hello World</Text>
</View>

// ❌ Missing dependencies
useEffect(() => {
  console.log(count); // Missing 'count' in deps
}, []); // Warning: exhaustive-deps

// ❌ Unstable nested component
function BadComponent() {
  const Nested = () => <Text>Hi</Text>; // Recreated every render
  return <Nested />;
}
```

### After (expo-magic enforced)
```typescript
// ✅ Extracted styles (better performance)
const styles = StyleSheet.create({
  container: { margin: 10, padding: 20 }
});

<View style={styles.container}>
  <Text>Hello World</Text>
</View>

// ✅ Proper dependencies
useEffect(() => {
  console.log(count);
}, [count]); // ✅ Fixed!

// ✅ Stable component reference
const StableComponent = () => <Text>Hi</Text>;

function GoodComponent() {
  return <StableComponent />; // ✅ No re-renders
}
```

## 🎛️ Customization

Easily override any rule:

```javascript
// eslint.config.js
const expoMagic = require('eslint-config-expo-magic');

module.exports = [
  ...expoMagic,
  {
    rules: {
      // Downgrade rules for your team
      'react-native/no-inline-styles': 'warn',
      'no-console': 'error',

      // Turn off specific rules
      'react/function-component-definition': 'off',

      // Add your own rules
      'no-alert': 'error',
    },
  },
];
```

## 🚀 Performance Benefits

- **⚡ Faster builds** - Type-only imports reduce bundle size
- **📱 Better runtime performance** - React Compiler optimization
- **🔍 Fewer runtime errors** - Advanced TypeScript checking
- **📦 Smaller apps** - No unused code enforcement
- **🎯 Better UX** - Platform-specific optimizations

## 🏆 Trusted By Developers

> "This config saved me hours of setup time. The React Native rules are spot-on!" - React Native Developer

> "Finally, a TypeScript-first ESLint config that just works with Expo!" - Full-Stack Developer

> "The performance optimizations alone are worth it. My app feels snappier!" - Mobile App Developer

## 📚 Advanced Usage

### Environment-Specific Configs
The config automatically handles different environments:
- **Expo/React Native** - Mobile globals and platform rules
- **Node.js configs** - Metro, Babel config files
- **Web builds** - Browser-specific optimizations

### Monorepo Support
Works perfectly in monorepos with multiple packages:

```javascript
// apps/mobile/eslint.config.js
const expoMagic = require('eslint-config-expo-magic');

module.exports = [
  ...expoMagic,
  {
    ignores: ['../web/**', '../server/**'],
  },
];
```

## 🤝 Contributing

We welcome contributions! See our [Contributing Guide](CONTRIBUTING.md) for details.

**Ways to contribute:**
- 🐛 **Bug reports** - Found an issue? Let us know!
- 💡 **Feature requests** - Have an idea? Share it!
- 📝 **Documentation** - Help improve our docs
- 🧪 **Testing** - Test with your projects and share feedback

## 📄 License

**MIT License** - Use it freely in your projects!

---

<div align="center">

**Made with ❤️ for the React Native & Expo community**

[⭐ Star us on GitHub](https://github.com/JoaoPauloCMarra/eslint-config-expo-magic) • [📖 Documentation](https://github.com/JoaoPauloCMarra/eslint-config-expo-magic) • [🐛 Report Issues](https://github.com/JoaoPauloCMarra/eslint-config-expo-magic/issues)

</div>
