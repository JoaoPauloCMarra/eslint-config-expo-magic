# eslint-config-expo-magic

[![npm version](https://img.shields.io/npm/v/eslint-config-expo-magic.svg)](https://www.npmjs.com/package/eslint-config-expo-magic)
[![npm downloads](https://img.shields.io/npm/dm/eslint-config-expo-magic.svg)](https://www.npmjs.com/package/eslint-config-expo-magic)
[![CI](https://github.com/JoaoPauloCMarra/eslint-config-expo-magic/actions/workflows/ci.yml/badge.svg)](https://github.com/JoaoPauloCMarra/eslint-config-expo-magic/actions/workflows/ci.yml)
[![Release](https://github.com/JoaoPauloCMarra/eslint-config-expo-magic/actions/workflows/release.yml/badge.svg)](https://github.com/JoaoPauloCMarra/eslint-config-expo-magic/actions/workflows/release.yml)
[![Documentation](https://img.shields.io/badge/docs-guides-blue.svg)](https://github.com/JoaoPauloCMarra/eslint-config-expo-magic/tree/main/docs)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/JoaoPauloCMarra/eslint-config-expo-magic/blob/main/LICENSE)

Lint and format configuration for Expo, React Native, and TypeScript projects, built for Bun's built-in `bun lint` and `bun fmt`. Version 6 has no dependencies: no ESLint, no Prettier, no plugin packages. Most rules run natively in Bun, and the rest ship with the package as plain JavaScript rules.

On this repository's fixtures, `bun lint` is 12–37× faster than the 5.x ESLint setup with 3–8× less memory, and `bun fmt --check` is 13–46× faster than Prettier. See [docs/BENCHMARKS.md](https://github.com/JoaoPauloCMarra/eslint-config-expo-magic/blob/main/docs/BENCHMARKS.md).

## Contents

- [Install](#install)
- [Quick start](#quick-start)
- [Presets](#presets)
- [Options](#options)
- [Layered architecture](#layered-architecture)
- [Agent setup](#agent-setup)
- [Behavior differences from 5.x](#behavior-differences-from-5x)
- [Compatibility](#compatibility)
- [Upgrading to 6.0.0](#upgrading-to-600)
- [Troubleshooting](#troubleshooting)

## Install

```bash
bun add --dev eslint-config-expo-magic
```

The project needs a Bun release with the built-in `bun lint` and `bun fmt` commands. It does not need ESLint, Prettier, TypeScript ESLint, or any ESLint plugin. Type-aware rules use Bun's built-in type checker, so the `typescript` package is optional.

## Quick start

For a production Expo app, run the initializer from the project root:

```bash
bunx expo-magic-init --write
```

Or create the files yourself. `oxlint.config.ts`:

```ts
import { createMobileAppConfig } from 'eslint-config-expo-magic/mobile-app';

export default createMobileAppConfig();
```

`.prettierrc.js`, which `bun fmt` reads:

```js
module.exports = require('eslint-config-expo-magic/prettier');
```

Scripts:

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

A `lint` or `fmt` script replaces the built-in command when you type `bun lint` or `bun fmt`. Keep them pointing at `bun lint` and `bun fmt`, not at `eslint` or `prettier`.

The mobile-app profile covers semantic colors, native UI boundaries, feature architecture, storage boundaries, naming conventions, focused console allowances, Testing Library checks, `react-native/no-inline-styles`, and the component-structure rules outside tests (`no-inline-props`, `props-type-order`, `default-export-placement`, `require-children-usage`). The default preset also enables the strict TypeScript layer. Pass `createMobileAppConfig({ preset: 'fast' })` for the syntax-focused lane without type-aware rules.

For libraries or incremental adoption, use the root export:

```ts
import { createConfig } from 'eslint-config-expo-magic';

export default createConfig({ testing: true });
```

## Presets

Each preset is the default export of its subpath, and `createConfig` builds any combination.

| Preset     | Import                                | Behavior                                                                                                                           |
| ---------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Base       | `eslint-config-expo-magic/base`       | Expo baseline, resolver setup, and the smallest project surface                                                                    |
| Default    | `eslint-config-expo-magic`            | Core Expo, TypeScript, React Native, import, app, workspace, and cycle rules; formatting, testing, and hardening layers are opt-in |
| Fast       | `eslint-config-expo-magic/fast`       | Core syntax and hooks without type-aware analysis, React Compiler diagnostics, or import-cycle traversal                           |
| Typed      | `eslint-config-expo-magic/typed`      | Default rules plus the type-checked TypeScript rules                                                                               |
| Strict     | `eslint-config-expo-magic/strict`     | Default rules plus strict TypeScript diagnostics and `no-console: error`                                                           |
| Agent      | `eslint-config-expo-magic/agent`      | Default rules plus agent-safe suppression, test, type, and patch guardrails                                                        |
| Mobile app | `eslint-config-expo-magic/mobile-app` | Opinionated production Expo app profile with formatting, architecture, UIKit, storage, naming, and agent guardrails                |

```ts
export { default } from 'eslint-config-expo-magic/fast';
```

The default, typed, strict, agent, and mobile-app presets turn on type-aware rules. Bun type checks the project before it runs them, using the nearest `tsconfig.json`.

## Options

`createConfig(options)` accepts the same options as 5.x:

| Option               | Default                 | Purpose                                                  |
| -------------------- | ----------------------- | -------------------------------------------------------- |
| `preset`             | `'default'`             | Select `'base'`, `'default'`, or `'fast'` composition    |
| `prettier`           | `false`                 | Report formatting differences with the `bun/format` rule |
| `testing`            | `false`                 | Enable Jest and Testing Library rules                    |
| `typeChecked`        | `false`                 | Add the type-checked TypeScript rules                    |
| `strict`             | `false`                 | Add strict TypeScript rules and `no-console: error`      |
| `importCycles`       | `true` for default only | Enable graph-wide `import/no-cycle` traversal            |
| `tsconfigProjects`   | Project globs           | Set the TypeScript projects for import resolution        |
| `extraIgnores`       | `[]`                    | Add ignore globs                                         |
| `agent`              | `false`                 | Enable agent-safe defaults or provide agent options      |
| `appGuardrails`      | `false`                 | Enable application guardrails                            |
| `componentStructure` | `false`                 | Enforce component structure conventions                  |
| `deprecatedApis`     | `false`                 | Restrict deprecated React and React Native APIs          |
| `featureBoundaries`  | `false`                 | Enable feature and service boundary policies             |
| `inlineStyles`       | `false`                 | Warn or error on inline styles in TSX                    |
| `nativeUi`           | `false`                 | Restrict native primitive imports                        |
| `reactCompiler`      | `false`                 | Promote React Compiler diagnostics to `error`            |
| `reanimated`         | `false`                 | Enable Reanimated hardening                              |
| `semanticColors`     | `false`                 | Enforce semantic color tokens                            |
| `storybook`          | `false`                 | Apply Storybook file overrides                           |
| `worklets`           | `false`                 | Enable Worklets scheduling hardening                     |

Options that accept `true` also accept the same focused options object as in 5.x. Agent mode supplies the default app, deprecated-API, Reanimated, and Worklets hardening, and turns on `reactCompiler` when the preset is type-aware. An explicit top-level option always wins over the agent value, for example `createConfig({ agent: true, reanimated: false })`.

Each factory returns one complete oxlint config. Unlike ESLint flat-config arrays, oxlint configs cannot be merged by spreading, and `extends` replaces a rule's options instead of merging them. Combine layers through `createConfig` options, which compose every `no-restricted-imports` and `no-restricted-syntax` layer into one entry per file set. To add project rules, edit the returned object:

```ts
import { createConfig } from 'eslint-config-expo-magic';

const config = createConfig({ testing: true });

config.overrides.push({
	files: ['scripts/**'],
	rules: { 'no-console': 'off' },
});

export default config;
```

## Layered architecture

`eslint-config-expo-magic/architecture` enforces a layered `src/` application. Pass the `createConfig` options of the base config as `base`; the result contains both.

```ts
import { createArchitectureConfig } from 'eslint-config-expo-magic/architecture';

const nativeUi = true;

export default createArchitectureConfig({
	base: {
		prettier: true,
		nativeUi,
		semanticColors: { tokenModule: 'uikit/tokens/colors' },
	},
	layers: {
		routes: 'app',
		ui: 'uikit',
		tokens: 'uikit/tokens',
		components: 'uikit/components',
	},
	nativeUi,
});
```

What it enforces:

- Cross-feature imports are contracts-only, matched on the feature segment of both paths, for aliased and relative specifiers alike.
- Raw React Native `Button`, `Image`, `Pressable`, `ScrollView`, `FlatList` and `Modal` stay inside the wrapper files listed in `nativeWrappers` (and `nativeUi.allowFiles`).
- Raw colour literals stay out of every layer, including views.
- Services never import features or routes, and the UI layer never imports either.
- HTTP belongs to services, and `console.*` belongs to the owned logger.
- No barrels, and no `domain/` / `application/` / `ui/` trees inside a feature.
- Views render and wire only: no effects, no chained collection pipelines, and no query or client-state imports.
- File names are lowercase kebab-case, with router conventions such as `+not-found` and `[id]` exempt.

Options: `base`, `layers`, `srcRoot`, `aliasPrefix`, `tokenModule`, `loggerModule`, `nativeWrappers`, `extraNativeUiRestrictions`, `extraNativeLibPatterns`, and `nativeUi`.

## Agent setup

`expo-magic-init` prints a dry-run plan by default and writes only missing files with `--write`:

```bash
bunx expo-magic-init
bunx expo-magic-init --write
```

With `--write`, it writes `oxlint.config.ts` with the mobile-app profile, `.prettierrc.js` with the shared formatter options, and `expo-magic.pr-guardrails.cjs`, and adds the `lint`, `lint:fix`, `format`, and `format:check` scripts. It never overwrites existing files or scripts. It reports a leftover ESLint config, the ESLint and Prettier dependencies that can be removed, scripts that would replace `bun lint` or `bun fmt`, and a `compilerOptions.baseUrl` that Bun's type checker rejects.

The `expo-magic-pr-guardrails` CLI checks pull requests in CI. A broad lint disable is a directive without a rule name, or any file-level `eslint-disable` comment; `bun lint` honours `eslint-disable` comments. See [docs/RECIPES.md](https://github.com/JoaoPauloCMarra/eslint-config-expo-magic/blob/main/docs/RECIPES.md#pr-guardrails-cli) for CI setup.

## Behavior differences from 5.x

The rule set is the same as in 5.x, and the repository's golden tests check that every rule reports in the same files. Bun runs its own implementations of the core, TypeScript, React, React Hooks, import, and Jest rules, so a few results differ:

- Code that TypeScript rejects (duplicate declarations, `with` in a module, duplicate parameters or exports) is a parse error, and Bun reports nothing else in that file.
- Type-aware rules use Bun's type checker, which behaves like TypeScript 7: `compilerOptions.baseUrl` is an error. Write `paths` relative to the tsconfig, for example `"@/*": ["./*"]`.
- Some rules report a different number of times or on another node, for example `import/no-duplicates` reports once per module.
- `import React` counts as used in files with JSX, and `bun:test` is a built-in module.
- `bun lint --fix` applies one pass of fixes; run it again if it reports fixable problems. Some fixes that ESLint offers only as suggestions are applied automatically, such as `@ts-ignore` → `@ts-expect-error`.
- The mobile-app profile's `id-match` rule uses an equivalent pattern without look-ahead, because Bun cannot compile `^(?!handle[A-Z])`; its message shows the longer pattern.
- Reports name TypeScript rules `typescript/<rule>` and import rules `import/<rule>`; `eslint-disable` comments with the `@typescript-eslint/` and `import-x/` names keep working.

## Compatibility

| Surface      | Supported range or lane                                       |
| ------------ | ------------------------------------------------------------- |
| Bun          | A release with the built-in `bun lint` and `bun fmt` commands |
| Expo         | SDK 54, 55, 56, and 57                                        |
| React Native | Expo-coupled; SDK 57 uses RN 0.86                             |
| React        | 19.1 and 19.2                                                 |

The package does not depend on Node.js, ESLint, Prettier, or TypeScript at runtime.

## Upgrading to 6.0.0

See [MIGRATING.md](https://github.com/JoaoPauloCMarra/eslint-config-expo-magic/blob/main/docs/MIGRATING.md). In short:

1. Replace `eslint.config.js` with `oxlint.config.ts` (`bunx expo-magic-init --write` writes it).
2. Replace `"prettier": "eslint-config-expo-magic/prettier"` in `package.json` with a `.prettierrc.js` that requires it.
3. Point the `lint` and `format` scripts at `bun lint` and `bun fmt`.
4. Remove ESLint, Prettier, TypeScript ESLint, and plugin dependencies.
5. Replace `compilerOptions.baseUrl` in tsconfig with relative `paths`.

## Troubleshooting

### `bun lint` runs ESLint

`package.json` has a `lint` script that calls `eslint`. Change it to `bun lint`.

### `bun lint` uses the ESLint config

When both an oxlint config and an ESLint config exist, `bun lint` uses the oxlint config. Remove the old `eslint.config.js` to avoid confusion.

### Type-aware linting reports tsconfig errors

Bun's type checker rejects `compilerOptions.baseUrl`. Use relative `paths` instead.

### Type-aware linting is slow

Use `eslint-config-expo-magic/fast` or `createConfig({ preset: 'fast' })` for syntax-focused checks without type information.

### Further reading

- [Detailed rule rationale](https://github.com/JoaoPauloCMarra/eslint-config-expo-magic/blob/main/RULES.md)
- [Migration guide](https://github.com/JoaoPauloCMarra/eslint-config-expo-magic/blob/main/docs/MIGRATING.md)
- [Recipes](https://github.com/JoaoPauloCMarra/eslint-config-expo-magic/blob/main/docs/RECIPES.md)
- [Benchmarks](https://github.com/JoaoPauloCMarra/eslint-config-expo-magic/blob/main/docs/BENCHMARKS.md)
