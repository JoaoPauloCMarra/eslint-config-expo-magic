# eslint-config-expo-magic

[![npm version](https://img.shields.io/npm/v/eslint-config-expo-magic.svg)](https://www.npmjs.com/package/eslint-config-expo-magic)
[![CI](https://github.com/JoaoPauloCMarra/eslint-config-expo-magic/actions/workflows/ci.yml/badge.svg)](https://github.com/JoaoPauloCMarra/eslint-config-expo-magic/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

Production-focused ESLint flat config for Expo and React Native projects, with TypeScript, React 19, Jest, Testing Library, import hygiene, and Prettier integration prewired.

## Table of Contents

- [Compatibility](#compatibility)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
- [Behavior Reference](#behavior-reference)
- [Customization Patterns](#customization-patterns)
- [Monorepo Usage](#monorepo-usage)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

## Compatibility

- Node.js: `>=18.0.0`
- Bun: `>=1.0.0` (recommended for development and publishing)
- ESLint: `10.x` flat config
- Expo: `>=54.0.33` (peer dependency)
- React: `>=19.1.0` (peer dependency)
- React Test Renderer: `>=19.1.0` (peer dependency)
- TypeScript: `>=5.9.3` (peer dependency)

## Installation

```bash
bun add --dev eslint-config-expo-magic
```

Consumer projects must provide the peer dependencies listed above.

## Quick Start

### 1) Basic (recommended)

Create `eslint.config.js`:

```js
const expoMagic = require('eslint-config-expo-magic');

module.exports = [...expoMagic];
```

### 2) Strict preset

```js
const { strict } = require('eslint-config-expo-magic');

module.exports = [...strict];
```

Or via strict subpath:

```js
const strict = require('eslint-config-expo-magic/strict');

module.exports = [...strict];
```

### 3) ESM config file (`eslint.config.mjs`)

```js
import expoMagic from 'eslint-config-expo-magic';

export default [...expoMagic];
```

### 4) No-Prettier preset

```js
const noPrettier = require('eslint-config-expo-magic/no-prettier');

module.exports = [...noPrettier];
```

## API Reference

### Package Exports

This package exposes:

- `eslint-config-expo-magic` -> base config array
- `eslint-config-expo-magic/strict` -> strict config array
- `eslint-config-expo-magic/no-prettier` -> base config array without Prettier plugin/rules

### `default` export

Type:

```ts
Linter.Config[]
```

Behavior:

- Includes Expo flat config foundation
- Adds TypeScript, React/React Native, import-x, Jest, Testing Library, app rules, and Prettier
- Applies monorepo-aware import resolver settings
- Applies baseline ignore patterns for generated/native folders

### `strict` preset

Type:

```ts
Linter.Config[]
```

Adds stricter overrides on top of base:

- `@typescript-eslint/no-explicit-any: error`
- `@typescript-eslint/no-non-null-assertion: error`
- `@typescript-eslint/await-thenable: error`
- `@typescript-eslint/no-floating-promises: error`
- `@typescript-eslint/no-misused-promises: error`
- `no-console: error`

Type-aware strict TypeScript rules are scoped to TypeScript files only, so strict config can lint plain `.js` files without plugin resolution errors.

### `no-prettier` preset

Type:

```ts
Linter.Config[]
```

Behavior:

- Same rule baseline as the default preset
- Omits `eslint-plugin-prettier` and `prettier/prettier`

### Type Declarations

The package ships declaration files:

- `index.d.ts`
- `strict.d.ts`
- `no-prettier.d.ts`

This improves IntelliSense/autocomplete when composing config arrays.

## Behavior Reference

### Config Modules (composition order)

The base export composes modules in this order:

1. Ignore patterns + import ignore settings
2. Filtered Expo flat config
3. TypeScript rules
4. React / React Native / React 19 upgrade rules
5. Import organization rules
6. Jest and Testing Library rules
7. App-level rules
8. Prettier integration
9. Workspace-specific `no-console` overrides
10. Shared resolver + globals settings

### Ignored Paths

These globs are ignored by default:

- `**/node_modules/**`
- `**/dist/**`
- `**/build/**`
- `**/.expo/**`
- `**/ios/**`
- `**/android/**`

### TypeScript Import Resolution

Import resolution is configured for monorepos and app/package layouts:

- `./tsconfig.json`
- `./apps/*/tsconfig.json`
- `./packages/*/tsconfig.json`
- `./test-project/tsconfig.json`

### Workspace Console Policy

- `apps/**`: `no-console` is `warn`
- `packages/**`: `no-console` is `error`

### Import Rule Policy

`import-x` is treated as the source of truth. Overlapping legacy `import/*` diagnostics are disabled to avoid duplicate noise.

## Customization Patterns

Append your own override object after the preset:

```js
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

Disable a specific rule for one file group:

```js
const expoMagic = require('eslint-config-expo-magic');

module.exports = [
	...expoMagic,
	{
		files: ['scripts/**/*.ts'],
		rules: {
			'@typescript-eslint/no-floating-promises': 'off',
		},
	},
];
```

### Preset Selection

| Goal | Preset |
| --- | --- |
| Standard Expo/React Native setup with formatting integrated | `eslint-config-expo-magic` |
| Same as base, with stricter TypeScript and `no-console: error` | `eslint-config-expo-magic/strict` |
| Use a separate formatter pipeline (no `prettier/prettier` rule) | `eslint-config-expo-magic/no-prettier` |

## Monorepo Usage

For monorepos, this package works best when each app/package has its own `tsconfig.json` and path aliases are defined there.

Recommended:

- Keep `eslint.config.js` at repo root
- Keep per-package/app `tsconfig.json` files
- Use `@/*` aliases in TS config where needed

## Troubleshooting

### `TypeError: Class extends value undefined is not a constructor or null`

Cause:

- Mixed `@typescript-eslint/*` major versions (commonly from older import plugins)

Fix:

1. Use latest `eslint-config-expo-magic`
2. Reinstall dependencies (`bun install`)
3. Ensure only `@typescript-eslint` v8 is installed in dependency graph

### Duplicate import errors with both `import/*` and `import-x/*`

This package disables overlapping legacy `import/*` rules. If you still see duplicates, another config in your stack is re-enabling them. Turn those back off in your local override.

### Flat config not loading

Make sure you are using ESLint 10+ and an `eslint.config.js` or `eslint.config.mjs` file (not legacy `.eslintrc*`).

## Contributing

- Changelog: [`CHANGELOG.md`](./CHANGELOG.md)
- Rule rationale: [`RULES.md`](./RULES.md)
- Main config entry: [`packages/eslint-config-expo-magic/index.js`](./packages/eslint-config-expo-magic/index.js)
- Validation harness: [`test-project/validate-comprehensive.js`](./test-project/validate-comprehensive.js)

Run locally:

```bash
bun install
bun run test
bun run validate
bun run smoke:pack
```
