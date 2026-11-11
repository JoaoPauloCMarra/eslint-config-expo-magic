# Migration Guide

This guide covers adopting the package from a plain Expo lint setup, moving between presets and package options, the supported Expo SDK lanes, and an upgrade checklist. The version history from 3.x to 6.0 follows at the end.

## From `eslint-config-expo` to `eslint-config-expo-magic`

Use this path when an Expo app already lints with `eslint-config-expo` and wants the package's focused rules and guardrails.

Write the config files and scripts with the initializer:

```bash
bunx expo-magic-init --write
```

By hand, add `oxlint.config.ts`:

```ts
import config from 'eslint-config-expo-magic';

export default config;
```

Add `.prettierrc.js`:

```js
module.exports = require('eslint-config-expo-magic/prettier');
```

Then follow steps 3 to 5 of [From 5.x to 6.0.0](#from-5x-to-600): update the scripts, remove `eslint`, `prettier`, and the plugin packages, and fix `compilerOptions.baseUrl`. Delete the old `eslint.config.js`.

The package adds TypeScript, React, React Native, import organization, unused-import, app, and cycle rules. Deprecated-API, Reanimated, Worklets, and other hardening layers are `createConfig` options. Formatting and testing integrations are opt-in.

For a gradual rollout, adopt the `base` preset first:

```ts
import { createConfig } from 'eslint-config-expo-magic';

export default createConfig({ preset: 'base' });
```

The `eslint-config-expo-magic/base` subpath exports the same config.

## From `base` to default

The default preset adds the package's core TypeScript, React Native, import, and app rules while keeping formatting and testing disabled until selected.

```ts
import config from 'eslint-config-expo-magic';

export default config;
```

Typical new diagnostics include `import-x/order`, `unused-imports/no-unused-imports`, `no-console`, and `no-restricted-imports`. If the project wants formatting or test rules, set `prettier: true` or `testing: true`.

## From default to `typed`

Use the typed preset when the project wants type-aware TypeScript checks:

```ts
import typed from 'eslint-config-expo-magic/typed';

export default typed;
```

Requirements:

- A `tsconfig.json` that Bun finds from the linted files (it uses the nearest one)
- A working type graph for the files being linted

## From default to `strict`

Use strict after the codebase is stable:

```ts
import strict from 'eslint-config-expo-magic/strict';

export default strict;
```

Strict mode makes `no-console` an error and enables selected TypeScript async and assertion rules.

## From local overrides to package options

Projects with local restricted-import, restricted-syntax, feature-boundary, Storybook, or PR guardrail logic can migrate one layer at a time:

```ts
import { createConfig } from 'eslint-config-expo-magic';

export default createConfig({
	appGuardrails: true,
	reactCompiler: true,
	worklets: true,
	nativeUi: true,
	featureBoundaries: true,
	storybook: true,
});
```

Enable `reactCompiler`, `nativeUi`, `storybook`, and `featureBoundaries` directly. Configure `allowFiles`, `additionalRestrictions`, `sharedComponentPatterns`, and `additionalSharedComponentPatterns` before enforcing project-shaped boundaries in CI.

Rules that no option covers go into `config.overrides`. A later entry that sets a rule replaces that rule's options, so an override with only your own `no-restricted-imports` entry drops the package's restrictions for those files. [Restricted imports for one folder](RECIPES.md#restricted-imports-for-one-folder) shows how to keep them. This replaces `createMobileAppRestrictedImportsConfig` from 5.x.

## Expo SDK lanes

The package declares optional peers on `expo` `^54.0.33` through `^58` and `react` `^19.1` through `^19.3`. The fixture in `test-project/package.json` is the source for the tested versions: Expo 58.0.24, React Native 0.88.1, and React 19.3.0. Keep the SDK and React Native versions coupled to the Expo lane; do not advertise an independent React Native line until Expo publishes a matching stable lane.

The repo keeps the fixture in the root Bun workspace. Use the root `bun.lock` rather than a nested fixture lockfile.

## Upgrade checklist

1. Read the `## <version>` section of [CHANGELOG.md](../CHANGELOG.md) for new or stricter rules.
2. Read [Behavior differences from 5.x](../README.md#behavior-differences-from-5x).
3. Enable only the integrations selected in the config.
4. Run `bun lint` and `bun fmt --check` in CI before enabling autofix.
5. Use `base`, `fast`, or explicit `createConfig` options to stage adoption when a project needs a smaller first step.

## Version history

The sections below cover upgrades between major versions, newest first. The 4.x and 3.x sections describe those releases as they were at the time.

## From 5.x to 6.0.0

6.0 replaces ESLint and Prettier with Bun's built-in `bun lint` and `bun fmt`. The rule set and the `createConfig` options stay the same; the config format, file names, and commands change.

### 1. Update Bun and the package

Use a Bun release with the built-in `bun lint` and `bun fmt` commands. Until a stable release ships `bun lint`, that is Bun canary (`bun upgrade --canary`), and 6.0 is published under the npm `next` tag:

```bash
bun add --dev eslint-config-expo-magic@next
```

### 2. Replace the config files

`bunx expo-magic-init --write` does steps 2 and 3 for you and prints what else it finds. By hand:

| 5.x                                                                 | 6.0                                                                                    |
| ------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `eslint.config.js` exporting `require('…/mobile-app')`              | `oxlint.config.ts` exporting `createMobileAppConfig()` from `…/mobile-app`             |
| `eslint.config.js` exporting `createConfig({...})`                  | `oxlint.config.ts` exporting `createConfig({...})`                                     |
| `"prettier": "eslint-config-expo-magic/prettier"` in `package.json` | `.prettierrc.js` with `module.exports = require('eslint-config-expo-magic/prettier');` |

```ts
// oxlint.config.ts
import { createMobileAppConfig } from 'eslint-config-expo-magic/mobile-app';

export default createMobileAppConfig();
```

Delete `eslint.config.js` afterwards. When both exist, `bun lint` uses the oxlint config.

### 3. Update the scripts

```json
{
	"scripts": {
		"lint": "bun lint",
		"lint:fix": "bun lint --fix",
		"format": "bun fmt",
		"format:check": "bun fmt --check"
	}
}
```

A `lint` or `fmt` script that runs `eslint` or `prettier` takes over `bun lint` / `bun fmt`, so change those scripts too, including CI and Git hooks. `bun lint --staged --fix` and `bun fmt --staged` replace lint-staged.

### 4. Remove the old toolchain

Remove `eslint`, `prettier`, `typescript-eslint`, `@typescript-eslint/*`, `eslint-config-*`, `eslint-plugin-*`, and `eslint-import-resolver-*` from `devDependencies`, unless another tool in the project needs them. `typescript` is optional: Bun type checks with its own checker.

### 5. Fix the tsconfig

Bun's type checker behaves like TypeScript 7 and rejects `compilerOptions.baseUrl`. Write `paths` relative to the tsconfig:

```json
{
	"compilerOptions": {
		"paths": { "@/*": ["./*"] }
	}
}
```

### 6. API changes

- Factories return one oxlint config object instead of a flat-config array. Add project rules by pushing to `config.overrides` instead of spreading arrays.
- The focused-layer subpaths are removed: `agent-guardrails`, `app-guardrails`, `component-structure`, `deprecated-apis`, `feature-boundaries`, `native-ui`, `react-compiler`, `reanimated`, `semantic-colors`, `storybook`, and `worklets`. Use the `createConfig` option with the same name (`agentGuardrails` is part of `agent`).
- `createArchitectureConfig` takes `base` (the `createConfig` options) instead of `baseConfig` (a flat-config array), and returns the combined config.
- `createMobileAppRestrictedImportsConfig` is removed.
- The `eslint` and `prettier` bins are removed; `expo-magic-init-agent` is now `expo-magic-init`.
- The mobile-app profile reads the preset from `options.preset`, then the `EXPO_MAGIC_PRESET` environment variable. `ESLINT_CONFIG_PRESET` is still read as a fallback.
- `prettier: true` reports formatting with Bun's `bun/format` rule instead of `prettier/prettier`.

### 7. Expect a few different results

The repository's golden tests check that every rule still reports in the same files as 5.x. Some details differ; see [Behavior differences from 5.x](../README.md#behavior-differences-from-5x).

## From 4.x to 5.0.0

Version 5 can own the complete lint and formatting integration for an Expo mobile app. The generic root preset remains lightweight and compatible with v4 configuration behavior.

1. Upgrade `eslint-config-expo-magic` and keep the application's TypeScript peer.
2. Replace the large local ESLint composition with the mobile-app profile.
3. Point the package manifest at the shared Prettier config.
4. Remove direct ESLint, Prettier, config, resolver, and plugin dependencies that the package now owns.

```js
module.exports = require('eslint-config-expo-magic/mobile-app');
```

```json
{
	"prettier": "eslint-config-expo-magic/prettier"
}
```

Use `createMobileAppConfig` when the app needs additional ignore or TypeScript project globs. Use `createMobileAppRestrictedImportsConfig` for narrowly scoped application-specific import restrictions:

```js
const {
	createMobileAppConfig,
	createMobileAppRestrictedImportsConfig,
} = require('eslint-config-expo-magic/mobile-app');

module.exports = [
	...createMobileAppConfig(),
	...createMobileAppRestrictedImportsConfig({
		files: ['features/payments/**/*.{ts,tsx}'],
		additionalPaths: [
			{
				name: '@/uikit/components/pressables',
				message: 'Use the payment button.',
			},
		],
	}),
];
```

The `expo-magic-init` command generates the shared mobile ESLint and Prettier wiring for new consumers. The old `expo-magic-init-agent` name remains as an alias.

## From 3.x to 4.0.0

Version 4 changes the package's ownership and root defaults. Make the migration in this order:

1. Install the TypeScript peer and the new package.
2. Replace removed exports and opt into integrations explicitly.
3. Run the full lint and typecheck commands before enabling autofix in CI.

```bash
bun add --dev eslint-config-expo-magic typescript@~6.0.3
```

TypeScript is the required toolchain peer. Expo and React are optional peers because an Expo application normally owns them. ESLint, Prettier, and all formatting, testing, and feature-boundary plugins ship with this package.

### Root default behavior

The v4 root configuration keeps core Expo, TypeScript, React Native, import, app, workspace, and cycle rules active. Prettier, testing, and hardening layers such as app guardrails, deprecated APIs, React Compiler diagnostics, Reanimated, Worklets, native UI, and semantic colors are off by default.

Projects that depended on the old default behavior should use an explicit composition:

```js
const { createConfig } = require('eslint-config-expo-magic');

module.exports = createConfig({
	prettier: true,
	testing: true,
});
```

### Removed exports and aliases

The `no-prettier` export and subpath were removed. The `strictNoPrettier` and `typedNoPrettier` named aliases were also removed. Root-level `createFeatureBoundaryConfig` and `featureBoundaries` named exports were also removed. Import `createFeatureBoundaryConfig` from `eslint-config-expo-magic/feature-boundaries`, or use `createConfig({ featureBoundaries: true })`. Do not keep imports of those removed names in a v4 configuration. The v4 root default already omits formatting rules; use `createConfig` when formatting or testing must be enabled.

### Runtime and toolchain requirements

- Node.js `^20.19.0 || ^22.13.0 || >=24`
- Bun `>=1.4.0`; this repository uses `bun@1.4.3`
- ESLint `^10.11.0`
- TypeScript `>=5.9.3 <6.1.0`
- TypeScript ESLint `^8.71.0`

TypeScript 7 and the React Native/Jest preset 0.87 line remain intentional holds until the matching compatibility proof is available. Expo SDK 54 through 57 remain the supported smoke lanes. The SDK 57 lanes read their versions from `test-project/package.json`: Expo 57.0.27, React 19.2.3, React Native 0.86.3, React Test Renderer 19.2.3, `jest-expo` 57.0.5, and `@react-native/jest-preset` 0.86.3.

### v4 verification

```bash
bun install
bunx eslint .
bunx tsc --noEmit
```

If an integration is enabled, its lint dependency is already owned by this package.
