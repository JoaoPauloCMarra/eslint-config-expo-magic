# eslint-config-expo-magic

A powerful, opinionated ESLint configuration for React Native and Expo projects with TypeScript support.

[![npm version](https://img.shields.io/npm/v/eslint-config-expo-magic.svg)](https://www.npmjs.com/package/eslint-config-expo-magic)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## Features

✨ **All-in-one configuration** - No need to set up multiple ESLint plugins and configurations  
🚀 **Expo optimized** - Specific rules for Expo development  
🔍 **TypeScript support** - Full TypeScript integration with enhanced linting rules  
⚛️ **React & React Native best practices** - Enforces best practices for React and React Native  
📦 **Import sorting** - Automatic import organization and sorting  
✅ **Testing support** - Rules for Jest and Testing Library  
💅 **Prettier integration** - Code formatting powered by Prettier  
🔧 **Modern JavaScript** - Up-to-date rules for modern JavaScript development  

## Installation

```bash
# Using npm
npm install --save-dev eslint-config-expo-magic

# Using yarn
yarn add --dev eslint-config-expo-magic

# Using pnpm
pnpm add --save-dev eslint-config-expo-magic
```

## Usage

### ESLint Flat Config (Recommended for ESLint 8.x+)

Create an `eslint.config.js` file in your project root:

```js
const expoMagic = require('eslint-config-expo-magic');

module.exports = [
  ...expoMagic,
  // Add your custom rules here
];
```

### Traditional ESLint Config

Create an `.eslintrc.js` file in your project root:

```js
module.exports = {
  root: true,
  extends: ['eslint-config-expo-magic'],
  // Add your custom rules here
};
```

## What's Included

This configuration includes rules for:

- **Core JavaScript** - Sensible defaults for JS development
- **TypeScript** - Type checking and TypeScript-specific rules
- **React & React Hooks** - Best practices for functional components and hooks
- **React Native** - Platform-specific rules and optimizations
- **Expo** - Special handling for Expo environment variables and features
- **Import sorting** - Organized imports with proper grouping
- **Jest & Testing Library** - Testing best practices
- **Prettier** - Code formatting integration

## Key Rules

Some of the enforced rules include:

- Strongly typed components with TypeScript
- Proper organization of imports (React first, then external, internal, etc.)
- Exhaustive deps for React hooks
- No unused variables or imports
- No inline styles in React Native
- Self-closing tags when appropriate
- No interfaces (use types instead)
- And many more best practices for React and React Native development

## Customization

You can override any rules by adding them to your ESLint config file:

```js
// eslint.config.js
const expoMagic = require('eslint-config-expo-magic');

module.exports = [
  ...expoMagic,
  {
    rules: {
      // Your custom rules
      'react-native/no-inline-styles': 'warn', // Downgrade to warning
      'no-console': 'error', // Upgrade to error
      'react/function-component-definition': 'off', // Turn off a rule
    },
  },
];
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT