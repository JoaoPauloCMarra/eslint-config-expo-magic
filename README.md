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
- [Changelog](#changelog)
- [Contributing](#contributing)

## Compatibility

- Node.js: `>=18.0.0`
- Bun: `>=1.0.0` (recommended for development and publishing)
- ESLint: `10.x` flat config
- Expo: `^54.0.33 || ^55.0.0 || ^56.0.0 || ^57.0.0` (peer dependency)
- React: `^19.1.0 || ^19.2.0` (peer dependency)
- React Test Renderer: `^19.1.0 || ^19.2.0` (peer dependency)
- TypeScript: `>=5.9.3 <6.1.0` (peer dependency)

Validated lanes:

- Full fixture validation: Expo SDK 57.0.4, React Native 0.86.0, React 19.2.3
- Packed-consumer smoke validation: Expo SDK 54.0.33, 55.0.9, 56.0.9, and 57.0.4
- Clean SDK 57 consumer smoke validation with Expo Doctor and ESLint outside this workspace

Support policy:

- Stable support tracks the latest stable Expo SDK.
- Standalone React Native releases newer than Expo stable stay out of stable support claims until a matching Expo SDK ships.
- Preview smoke coverage can be added for Expo canary when a canary lane is active.

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

Use this preset when Prettier already runs in your editor, pre-commit hook, or a dedicated format script. It keeps import/style linting without turning formatting into ESLint noise.

### 5) Typed preset

```js
const typed = require('eslint-config-expo-magic/typed');

module.exports = [...typed];
```

This adds opt-in type-aware rules from `typescript-eslint`'s maintained type-checked configs on top of the base preset.

### 6) Agent preset

```js
const agent = require('eslint-config-expo-magic/agent');

module.exports = [...agent];
```

Use this for AI-agent-heavy mobile repos. Full setup: [`docs/AGENTS_RECIPE.md`](./docs/AGENTS_RECIPE.md).

## API Reference

### Package Exports

This package exposes:

- `eslint-config-expo-magic` -> default config array
- `eslint-config-expo-magic/base` -> low-opinion base config close to Expo defaults
- `eslint-config-expo-magic/agent` -> agent-safe config with app guardrails, React Compiler, Reanimated, Worklets, deprecated API checks, and agent-specific risky syntax checks
- `eslint-config-expo-magic/agent-guardrails` -> focused agent-damage guardrails for unsafe suppressions, type weakening, skipped tests, snapshot churn, attribution strings, empty catches, and unhandled promises
- `eslint-config-expo-magic/strict` -> strict config array
- `eslint-config-expo-magic/no-prettier` -> base config array without Prettier plugin/rules
- `eslint-config-expo-magic/typed` -> base config array plus type-aware TypeScript rules
- `eslint-config-expo-magic/app-guardrails` -> app hygiene layer for suppressions, assertions, query-hook return types, and snapshots (factory accepts a custom `queryHookPattern`)
- `eslint-config-expo-magic/react-compiler` -> promotes the React Compiler diagnostics shipped by `eslint-plugin-react-hooks` v7 (`unsupported-syntax`, `purity`, `immutability`, …) to `error`
- `eslint-config-expo-magic/reanimated` -> Reanimated/RNGH hardening (shared-value render reads, worklet-hook `.get()`, inline gesture config; factory accepts custom gesture hook names)
- `eslint-config-expo-magic/worklets` -> Worklets `scheduleOnRN` hardening layer
- `eslint-config-expo-magic/deprecated-apis` -> flags deprecated React Native / React 19 symbols (`MutableRefObject`, `StyleSheet.absoluteFillObject`, `AccessibilityInfo.setAccessibilityFocus`)
- `eslint-config-expo-magic/component-structure` -> custom `expo-magic` plugin rules for prop-type ordering, default-export placement, inline props, and unused child slots
- `eslint-config-expo-magic/semantic-colors` -> factory enforcing semantic color tokens over raw color literals/direct token access
- `eslint-config-expo-magic/native-ui` -> factory for React Native primitive import restrictions
- `eslint-config-expo-magic/feature-boundaries` -> factory for feature/app/service/UIKit dependency boundaries
- `eslint-config-expo-magic/storybook` -> story-file overrides
- `eslint-config-expo-magic/pr-guardrails` -> reusable PR guardrail validator and CLI

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

### `typed` preset

Type:

```ts
Linter.Config[]
```

Behavior:

- Keeps the default preset behavior
- Adds opt-in type-aware `typescript-eslint` rules from maintained upstream configs
- Reuses the same monorepo-aware TS project resolution as the base preset

### Type Declarations

The package ships declaration files:

- `index.d.ts`
- `strict.d.ts`
- `no-prettier.d.ts`
- `typed.d.ts`
- `app-guardrails.d.ts`
- `react-compiler.d.ts`
- `reanimated.d.ts`
- `worklets.d.ts`
- `deprecated-apis.d.ts`
- `component-structure.d.ts`
- `semantic-colors.d.ts`
- `native-ui.d.ts`
- `feature-boundaries.d.ts`
- `storybook.d.ts`
- `pr-guardrails.d.ts`

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

### Restricted Rule Composition

`no-restricted-imports` and `no-restricted-syntax` are single-slot ESLint rules: the last matching config entry replaces the rule entirely rather than merging. To avoid clobbering:

- All selector-based hardening (`appGuardrails`, `reactCompiler` precursors, `reanimated`, `worklets`, `semanticColors`) is merged into one composed `no-restricted-syntax` config per file group, so enabling several layers together preserves every selector.
- The base `SafeAreaView` import restriction is shared from one source between the default app rules and `nativeUi`. Replacing `nativeUi` restrictions intentionally drops the base set; pass them back via `restrictions` or use `additionalRestrictions` to extend instead.

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

| Goal                                                            | Preset                                 |
| --------------------------------------------------------------- | -------------------------------------- |
| Standard Expo/React Native setup with formatting integrated     | `eslint-config-expo-magic`             |
| Same as base, with stricter TypeScript and `no-console: error`  | `eslint-config-expo-magic/strict`      |
| Same as base, with type-aware TypeScript rules                  | `eslint-config-expo-magic/typed`       |
| Use a separate formatter pipeline (no `prettier/prettier` rule) | `eslint-config-expo-magic/no-prettier` |
| Harden production app flows (React Compiler, Reanimated, deprecated APIs, structure) | `createConfig({ appGuardrails: true, reactCompiler: true, reanimated: true, deprecatedApis: true, componentStructure: true })` |

### Production App Hardening

All hardening layers are opt-in; the default/strict/typed presets are unchanged. Enable any combination:

```js
const { createConfig } = require('eslint-config-expo-magic');

module.exports = createConfig({
	extraIgnores: ['.eas/**', '.github/**', '.vscode/**', 'assets/**'],
	appGuardrails: true,
	componentStructure: true,
	deprecatedApis: true,
	inlineStyles: true,
	reactCompiler: true,
	reanimated: true,
	semanticColors: true,
	worklets: true,
	storybook: true,
	nativeUi: {
		allowFiles: [
			'**/uikit/components/pressables.tsx',
			'**/uikit/components/scroll-view.tsx',
			'**/uikit/components/modal.tsx',
			'**/hooks/use-navigator.ts',
		],
	},
	featureBoundaries: {
		sharedComponentPatterns: [
			'features/*/components/focus-selection-form.tsx',
			'features/*/components/request-user-phone-flow.tsx',
		],
	},
});
```

Each hardening option also accepts configuration for project-specific conventions:

```js
module.exports = createConfig({
	appGuardrails: { queryHookPattern: '^useFetch[A-Z]' },
	reanimated: { additionalGestureHooks: ['useFlingGesture'] },
	semanticColors: { tokenModule: 'theme/palette', importName: 'palette' },
	componentStructure: { propsTypePattern: 'Props$' },
});
```

The optional layers are available as subpaths when manual composition is clearer:

```js
const expoMagic = require('eslint-config-expo-magic');
const reactCompiler = require('eslint-config-expo-magic/react-compiler');
const reanimated = require('eslint-config-expo-magic/reanimated');
const deprecatedApis = require('eslint-config-expo-magic/deprecated-apis');

module.exports = [...expoMagic, ...reactCompiler, ...reanimated, ...deprecatedApis];
```

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

## Changelog

Consumer-facing changes are documented in [`CHANGELOG.md`](./CHANGELOG.md). Per-release notes are also published on the [GitHub releases page](https://github.com/JoaoPauloCMarra/eslint-config-expo-magic/releases).

## Contributing

- Rule rationale: [`RULES.md`](./RULES.md)
- Changelog: [`CHANGELOG.md`](./CHANGELOG.md)
- Main config entry: [`packages/eslint-config-expo-magic/index.js`](./packages/eslint-config-expo-magic/index.js)
- Validation harness: [`test-project/validate-comprehensive.js`](./test-project/validate-comprehensive.js)

Run locally:

```bash
bun install
bun run test
bun run typecheck
bun run validate
bun run smoke:pack
bun run smoke:clean-sdk57
```
