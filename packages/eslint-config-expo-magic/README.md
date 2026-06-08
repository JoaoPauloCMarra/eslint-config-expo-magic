# eslint-config-expo-magic

An opinionated ESLint flat config for Expo, React Native, and TypeScript projects.

`eslint-config-expo-magic` is an ESLint config for Expo apps that builds on top of `eslint-config-expo/flat` and adds stricter TypeScript, React, React Native, import-order, Jest, Testing Library, and optional Prettier integration.

ESLint and Prettier are bundled with the config package. Consumer projects still need the peer dependencies for Expo, React, React Test Renderer, and TypeScript.

## Why use this ESLint config for Expo and React Native?

- Built for Expo and React Native projects using ESLint flat config
- Stronger TypeScript defaults than `eslint-config-expo`
- Import ordering, unused import cleanup, and path alias support
- React, React Native, Jest, and Testing Library rules in one package
- Optional `base`, `typed`, `strict`, and `no-prettier` presets
- Optional production app hardening layers for React Compiler, Worklets, native UI wrappers, feature boundaries, Storybook, and PR guardrails
- Monorepo-friendly config factory for custom `tsconfig` layouts
- Validated against packed consumer apps, not only local fixtures

## Validation coverage

- Full fixture-app validation on Expo SDK 56.0.9 / React Native 0.85.3 / React 19.2.3
- Packed-consumer smoke validation on Expo SDK 54.0.33, 55.0.9, and 56.0.9

## Compatibility

- Node.js `>=18`
- Expo `54.x`, `55.x`, and `56.x`
- React `19.1.x || 19.2.x`
- React Test Renderer `19.1.x || 19.2.x`
- TypeScript `>=5.9.3 <7`

React Native support follows stable Expo SDK releases. Newer standalone RN versions should be treated as preview-only until the corresponding Expo SDK is stable.
Preview smoke coverage is available for Expo canary via `bun run smoke:preview`.

## Install

```bash
bun add -d eslint-config-expo-magic
```

No need to add `eslint` or `prettier`; they are provided by this package.

## Quick start

Create `eslint.config.js` in your project root:

```js
module.exports = require('eslint-config-expo-magic');
```

ESM (`eslint.config.mjs`) also works directly:

```js
import expoMagic from 'eslint-config-expo-magic';

export default [...expoMagic];
```

Then run `bun run lint` (add `"lint": "eslint ."` to your `package.json` scripts).

## What this package adds over `eslint-config-expo`

- More TypeScript rules, including consistent type imports and stronger async safety
- React Native and React 19 upgrade rules beyond Expo's minimal baseline
- Import sorting and unused import cleanup
- Jest and Testing Library rules
- Optional lint-time Prettier integration
- Additional presets for low-opinion, strict, and type-aware setups

## `eslint-config-expo-magic` vs `eslint-config-expo`

- Use `eslint-config-expo` if you want Expo's minimal baseline and plan to compose the rest yourself.
- Use `eslint-config-expo-magic` if you want a precomposed Expo setup with stronger defaults for TypeScript, imports, tests, and React/React Native.
- Do not compare this package to `eslint-plugin-expo` directly. The Expo plugin is a small set of Expo-specific rules. This package is a higher-level config built on Expo's config.

## Presets

### Base preset

For a low-opinion entrypoint that stays close to Expo's defaults while still applying package-level compatibility support and `expo/prefer-box-shadow`:

```js
const base = require('eslint-config-expo-magic/base');

module.exports = [...base];
```

Use this when you want the package to stay close to `eslint-config-expo` before opting into the stricter default presets below.

### Default preset

The main export is the recommended preset for most Expo and React Native apps:

```js
module.exports = require('eslint-config-expo-magic');
```

It includes TypeScript, React, import-order, Jest, Testing Library, app-level rules, and lint-time Prettier.

### Strict preset

For stricter enforcement (e.g. `no-console: error`, stricter TypeScript rules):

```js
const { strict } = require('eslint-config-expo-magic');
module.exports = [...strict];
```

### Typed preset

For opt-in type-aware rules from `typescript-eslint`'s maintained type-checked configs:

```js
const typed = require('eslint-config-expo-magic/typed');

module.exports = [...typed];
```

This preset enables `parserOptions.projectService = true`, so it expects a reachable `tsconfig.json`.

### No-Prettier preset

If you run Prettier separately and do not want lint-time formatting errors, use this as the preferred preset:

```js
const noPrettier = require('eslint-config-expo-magic/no-prettier');

module.exports = [...noPrettier];
```

## Config factory for monorepos and custom TypeScript layouts

For monorepos or non-standard layouts, use the main export's factory instead of forking the package:

```js
const { createConfig } = require('eslint-config-expo-magic');

module.exports = [
	...createConfig({
		tsconfigProjects: [
			'./tsconfig.json',
			'./apps/*/tsconfig.json',
			'./packages/*/tsconfig.json',
		],
		prettier: false,
		testing: false,
	}),
];
```

Supported options:

- `preset`: `'base' | 'default'`
- `tsconfigProjects`: custom TypeScript project globs for import resolution
- `prettier`: include or omit lint-time Prettier
- `testing`: include or omit Jest and Testing Library rules
- `typeChecked`: opt into the broader maintained `typescript-eslint` type-aware presets; the default config already enables project service for the package's selected TypeScript rules
- `strict`: apply the package's strict console and TypeScript overrides
- `extraIgnores`: append generated/native/review-surface ignore globs
- `appGuardrails`: enforce suppression, assertion, query-hook, non-null, and snapshot hygiene
- `reactCompiler`: block React Compiler syntax hazards in component and hook render scope
- `worklets`: block inline `scheduleOnRN` callbacks
- `nativeUi`: restrict direct React Native primitives in favor of app UI wrappers; use `additionalRestrictions` to add project-specific imports without copying defaults
- `featureBoundaries`: add a feature/app/service/UIKit dependency boundary preset
- `storybook`: apply Storybook story-file overrides

## Production app hardening

Use these layers for larger Expo apps that have shared UI wrappers, feature folders, React Compiler, and Reanimated/Worklets:

```js
const { createConfig } = require('eslint-config-expo-magic');

module.exports = createConfig({
	extraIgnores: ['.eas/**', '.github/**', '.vscode/**', 'assets/**'],
	prettier: false,
	appGuardrails: true,
	reactCompiler: true,
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

The hardening layers are also available as subpaths when manual composition is clearer:

```js
const expoMagic = require('eslint-config-expo-magic');
const reactCompiler = require('eslint-config-expo-magic/react-compiler');
const worklets = require('eslint-config-expo-magic/worklets');

module.exports = [...expoMagic, ...reactCompiler, ...worklets];
```

## Rule diff and config comparison

The repository ships a generated rule comparison against `eslint-config-expo` in [`docs/CONFIG_DIFF.md`](../../docs/CONFIG_DIFF.md) and [`docs/config-diff.json`](../../docs/config-diff.json). Regenerate it with:

```bash
bun run report:config
```

## Migration guide and override recipes

- Upgrade paths and adoption order: [`docs/MIGRATING.md`](../../docs/MIGRATING.md)
- Common override snippets: [`docs/RECIPES.md`](../../docs/RECIPES.md)
- Release automation: [`docs/RELEASING.md`](../../docs/RELEASING.md)
- Draft release notes generated from the current config diff: [`docs/RELEASE_NOTES.next.md`](../../docs/RELEASE_NOTES.next.md)

## Path alias support for TypeScript and Expo

Path aliases are resolved automatically through `eslint-import-resolver-typescript`, which reads `./tsconfig.json` from your project root without extra ESLint overrides. This resolver is included as a dependency of the package.

```ts
import UserCard from '@/components/UserCard';
```

Ensure you have an alias configured in `tsconfig.json`:

```json
{
	"compilerOptions": {
		"baseUrl": ".",
		"paths": {
			"@/*": ["*"]
		}
	}
}
```

## FAQ

### Is this better than `eslint-plugin-expo`?

Yes, if you want a full Expo ESLint setup. `eslint-plugin-expo` is only the Expo-specific rule plugin. This package is a full flat config built on top of Expo's config.

### Is this better than `eslint-config-expo`?

It is broader and more opinionated. Use `eslint-config-expo` for a minimal baseline. Use `eslint-config-expo-magic` when you want stronger defaults and fewer manual ESLint decisions.

### Does this work in Expo monorepos?

Yes. The default config already supports common monorepo `tsconfig` globs, and `createConfig()` lets you replace them for custom layouts.
