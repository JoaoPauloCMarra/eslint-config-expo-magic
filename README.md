# eslint-config-expo-magic

[![npm version](https://img.shields.io/npm/v/eslint-config-expo-magic.svg)](https://www.npmjs.com/package/eslint-config-expo-magic)
[![npm downloads](https://img.shields.io/npm/dm/eslint-config-expo-magic.svg)](https://www.npmjs.com/package/eslint-config-expo-magic)
[![CI](https://github.com/JoaoPauloCMarra/eslint-config-expo-magic/actions/workflows/ci.yml/badge.svg)](https://github.com/JoaoPauloCMarra/eslint-config-expo-magic/actions/workflows/ci.yml)
[![Release](https://github.com/JoaoPauloCMarra/eslint-config-expo-magic/actions/workflows/release.yml/badge.svg)](https://github.com/JoaoPauloCMarra/eslint-config-expo-magic/actions/workflows/release.yml)
[![Documentation](https://img.shields.io/badge/docs-guides-blue.svg)](https://github.com/JoaoPauloCMarra/eslint-config-expo-magic/tree/main/docs)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/JoaoPauloCMarra/eslint-config-expo-magic/blob/main/LICENSE)

Type-safe flat ESLint configuration for Expo, React Native, and TypeScript projects. It combines Expo defaults with React 19, import and test rules, focused production guardrails, agent-safe workflows, and matching CommonJS, ESM, and TypeScript exports.

## Contents

- [Install](#install)
- [Quick start](#quick-start)
- [Presets](#presets)
- [`createConfig`](#createconfig)
- [CLI tools](#cli-tools)
- [Exports and types](#exports-and-types)
- [Behavior and file scope](#behavior-and-file-scope)
- [Compatibility](#compatibility)
- [Upgrade to 3.0.1](#upgrade-to-301)
- [Upgrade to 3.0.0](#upgrade-to-300)
- [Documentation](#documentation)
- [Troubleshooting](#troubleshooting)

## Install

```bash
bun add --dev eslint-config-expo-magic
# or
npm install --save-dev eslint-config-expo-magic
```

The repository itself uses Bun. Consumer projects can use Bun, npm, pnpm, or Yarn. Runtime lint dependencies (ESLint, Prettier, plugins, and TypeScript ESLint tooling) are bundled as package dependencies. Only Expo, React, React Test Renderer, and TypeScript are declared peers, and an existing Expo app normally already provides them:

- Expo
- React
- React Test Renderer
- TypeScript

## Quick start

### Recommended: lint and format separately

Use the `no-prettier` preset when Prettier already runs in your editor, pre-commit hook, or formatter command:

```js
const expoMagic = require('eslint-config-expo-magic/no-prettier');

module.exports = [...expoMagic];
```

This is the recommended setup for faster, quieter lint runs. It keeps the default TypeScript, React, React Native, import, and test rules, but does not run Prettier through `prettier/prettier`.

### Default: Prettier inside ESLint

Use the package root when one ESLint command should also report formatting differences:

```js
const expoMagic = require('eslint-config-expo-magic');

module.exports = [...expoMagic];
```

The default preset includes `eslint-plugin-prettier` and `prettier/prettier`.

### ESM

```js
import expoMagic from 'eslint-config-expo-magic/no-prettier';

export default [...expoMagic];
```

### Type-safe JavaScript config

JSDoc keeps `eslint.config.mjs` directly loadable while giving editors and coding agents the complete option contract:

```js
import { createConfig } from 'eslint-config-expo-magic';

/** @type {import('eslint-config-expo-magic').CreateConfigOptions} */
const options = {
	prettier: false,
	componentStructure: true,
	deprecatedApis: true,
	reanimated: true,
};

export default createConfig(options);
```

### TypeScript config

If your ESLint runtime is configured to load `eslint.config.ts`, use package types directly:

```ts
import {
	createConfig,
	type CreateConfigOptions,
} from 'eslint-config-expo-magic';

const options = {
	prettier: false,
	componentStructure: { propsTypePattern: 'Props$' },
	inlineStyles: 'warn',
	reanimated: { additionalGestureHooks: ['useFlingGesture'] },
	semanticColors: {
		tokenModule: 'theme/palette',
		importName: 'palette',
	},
} satisfies CreateConfigOptions;

export default createConfig(options);
```

These package-name imports work in consumer repositories; no relative import into `node_modules` is required.

## Presets

| Preset      | Import                                 | Adds                                                                                | Prettier rule |
| ----------- | -------------------------------------- | ----------------------------------------------------------------------------------- | ------------- |
| Base        | `eslint-config-expo-magic/base`        | Expo flat-config foundation with minimal package opinion                            | No            |
| Default     | `eslint-config-expo-magic`             | TypeScript, React/RN, imports, app, test, and workspace rules                       | Yes           |
| No Prettier | `eslint-config-expo-magic/no-prettier` | Default behavior without ESLint-driven formatting                                   | No            |
| Typed       | `eslint-config-expo-magic/typed`       | Default plus maintained type-checked TypeScript rules                               | Yes           |
| Strict      | `eslint-config-expo-magic/strict`      | Default plus strict type-aware rules and `no-console: error`                        | Yes           |
| Agent       | `eslint-config-expo-magic/agent`       | Default hardening plus agent-specific suppression, test, type, and patch guardrails | Yes           |

Equivalent factory calls:

```js
const { createConfig } = require('eslint-config-expo-magic');

const base = createConfig({ preset: 'base' });
const standard = createConfig();
const noPrettier = createConfig({ prettier: false });
const typed = createConfig({ typeChecked: true });
const strict = createConfig({ strict: true });
const agent = createConfig({ agent: true });
```

The default, strict, typed, and no-Prettier configurations enable app guardrails, deprecated API checks, React Compiler diagnostics, Reanimated checks, and Worklets checks. Pass `false` to any of those options to opt out. Agent mode keeps those defaults and also adds agent-specific guardrails; semantic colors remain opt-in.

Explicit top-level options customize agent defaults. When `agent` is an options object, its nested value takes precedence over the matching top-level option.

The root export also provides `strictNoPrettier` and `typedNoPrettier` named presets for projects that want strict or type-checked rules without ESLint-driven formatting.

## `createConfig`

```ts
function createConfig(options?: CreateConfigOptions): Linter.Config[];
```

Core options:

| Option             | Default              | Purpose                                               |
| ------------------ | -------------------- | ----------------------------------------------------- |
| `preset`           | `'default'`          | Select `'base'` or `'default'` composition            |
| `prettier`         | `true` except base   | Include Prettier plugin and rule                      |
| `testing`          | `true` except base   | Include Jest and Testing Library rules                |
| `typeChecked`      | `false`              | Add maintained type-aware TypeScript configs          |
| `strict`           | `false`              | Add strict type-aware rules and strict console policy |
| `tsconfigProjects` | Monorepo-aware globs | Override TypeScript project paths                     |
| `extraIgnores`     | `[]`                 | Add repository-specific ignore globs                  |

Optional layers:

| Option               | Accepted value                      | Purpose                                                                      |
| -------------------- | ----------------------------------- | ---------------------------------------------------------------------------- |
| `agent`              | `boolean` or agent options          | Enable coordinated agent-safe defaults                                       |
| `appGuardrails`      | `boolean` or `{ queryHookPattern }` | Guard suppressions, assertions, query hooks, snapshots, and risky syntax     |
| `componentStructure` | `boolean` or `{ propsTypePattern }` | Enforce prop ordering, export placement, inline-prop, and children-use rules |
| `deprecatedApis`     | `boolean` or deprecated-API options | Restrict removed or discouraged React/RN symbols                             |
| `featureBoundaries`  | `boolean` or boundary options       | Enforce feature, app, service, and shared-component boundaries               |
| `inlineStyles`       | `boolean` or ESLint severity        | Enable `react-native/no-inline-styles`; `true` means `warn`                  |
| `nativeUi`           | `boolean` or native-UI options      | Route React Native primitives through project wrappers                       |
| `reactCompiler`      | `boolean`                           | Promote React Compiler diagnostics to errors                                 |
| `reanimated`         | `boolean` or gesture-hook options   | Detect Reanimated SharedValue misuse and unsafe gesture configuration        |
| `semanticColors`     | `boolean` or token options          | Require semantic color tokens                                                |
| `storybook`          | `boolean`                           | Add story-file overrides                                                     |
| `worklets`           | `boolean`                           | Harden Worklets `scheduleOnRN` usage                                         |

Example:

```js
const { createConfig } = require('eslint-config-expo-magic');

module.exports = createConfig({
	prettier: false,
	extraIgnores: ['.eas/**', 'coverage/**'],
	appGuardrails: { queryHookPattern: '^useFetch[A-Z]' },
	componentStructure: { propsTypePattern: 'Props$' },
	deprecatedApis: true,
	inlineStyles: 'warn',
	reactCompiler: true,
	reanimated: {
		additionalGestureHooks: ['useFlingGesture'],
	},
	semanticColors: {
		tokenModule: 'theme/palette',
		importName: 'palette',
		flagDirectAccess: true,
		allowFiles: ['**/theme/**'],
	},
	nativeUi: {
		allowFiles: ['**/uikit/**'],
	},
	worklets: true,
});
```

More project-specific controls are available:

- `deprecatedApis`: `additionalRestrictedProperties`, `additionalRestrictedTypes`
- `featureBoundaries`: feature element types and shared-component patterns
- `nativeUi`: `restrictions`, `additionalRestrictions`, `allowFiles`
- `reanimated`: `gestureHooks`, `additionalGestureHooks`
- `semanticColors`: `tokenModule`, `importName`, `flagDirectAccess`, `allowFiles`

In 3.0.0, `semanticColors.allowFiles` disables only semantic-color selectors for matching files. `nativeUi.allowFiles` relaxes only native-UI wrapper restrictions and preserves unrelated baseline import restrictions.

## CLI tools

The package publishes two command-line tools.

### `expo-magic-init-agent`

Scaffolds the agent preset for a consumer repository:

```bash
bunx expo-magic-init-agent
bunx expo-magic-init-agent --write
```

Default behavior is a dry run: it prints the recommended `eslint.config.js`, `expo-magic.pr-guardrails.cjs`, and `package.json` scripts without writing files. With `--write`, it creates `eslint.config.js` and `expo-magic.pr-guardrails.cjs` only when missing, adds missing `lint`, `typecheck`, and `validate:pr-guardrails` scripts to `package.json`, and leaves existing values untouched.

### `expo-magic-pr-guardrails`

Read-only PR guardrail validation for GitHub Actions `pull_request` events:

```bash
bunx expo-magic-pr-guardrails
```

It reads `expo-magic.pr-guardrails.cjs` or `expo-magic.pr-guardrails.js` when present, plus the GitHub event environment. It prints a `Failure:` line for each unmet guardrail and exits `1` when validation fails. The CLI never writes files, so there is no `--write` mode.

## Exports and types

Every declared config subpath ships matching CommonJS, ESM, and TypeScript entry points.

| Import                                         | Public surface                                                                                  |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `eslint-config-expo-magic`                     | Default config plus named presets, `createConfig`, focused configs, factories, and option types |
| `eslint-config-expo-magic/base`                | Minimal base preset                                                                             |
| `eslint-config-expo-magic/no-prettier`         | Default preset without Prettier                                                                 |
| `eslint-config-expo-magic/typed`               | Type-checked preset                                                                             |
| `eslint-config-expo-magic/strict`              | Strict preset                                                                                   |
| `eslint-config-expo-magic/agent`               | Agent preset                                                                                    |
| `eslint-config-expo-magic/agent-guardrails`    | Focused agent-damage guardrails                                                                 |
| `eslint-config-expo-magic/app-guardrails`      | App guardrails and factory                                                                      |
| `eslint-config-expo-magic/component-structure` | Component rules and factory                                                                     |
| `eslint-config-expo-magic/deprecated-apis`     | Deprecated API rules and factory                                                                |
| `eslint-config-expo-magic/feature-boundaries`  | Boundary rules and factory                                                                      |
| `eslint-config-expo-magic/native-ui`           | Native UI restrictions and factory                                                              |
| `eslint-config-expo-magic/pr-guardrails`       | Reusable PR guardrail validator                                                                 |
| `eslint-config-expo-magic/react-compiler`      | React Compiler diagnostic layer                                                                 |
| `eslint-config-expo-magic/reanimated`          | Reanimated rules and factories                                                                  |
| `eslint-config-expo-magic/semantic-colors`     | Semantic-color rules and factory                                                                |
| `eslint-config-expo-magic/storybook`           | Story-file overrides                                                                            |
| `eslint-config-expo-magic/worklets`            | Worklets hardening layer                                                                        |

The root declaration exposes `CreateConfigOptions`, every focused layer option type, and the public PR guardrail types. Use `satisfies CreateConfigOptions` in TypeScript or JSDoc-typed JavaScript configs. Editors and AI coding tools can then autocomplete valid nested options and reject unknown keys before ESLint runs.

Manual composition remains supported:

```js
const expoMagic = require('eslint-config-expo-magic/no-prettier');
const reactCompiler = require('eslint-config-expo-magic/react-compiler');
const reanimated = require('eslint-config-expo-magic/reanimated');

module.exports = [...expoMagic, ...reactCompiler, ...reanimated];
```

Prefer `createConfig` when several layers contribute `no-restricted-syntax`; it composes those single-slot ESLint rules without one layer replacing another.

## Behavior and file scope

Default ignores:

- `**/node_modules/**`
- `**/dist/**`
- `**/build/**`
- `**/.expo/**`
- `**/ios/**`
- `**/android/**`

Default TypeScript project discovery:

- `./tsconfig.json`
- `./apps/*/tsconfig.json`
- `./packages/*/tsconfig.json`
- `./test-project/tsconfig.json`

Other important behavior:

- `import-x` owns import diagnostics; overlapping legacy `import/*` rules are disabled.
- `@typescript-eslint/no-unused-vars` owns unused bindings in TypeScript. Core `no-unused-vars` remains active for JavaScript.
- App code uses `no-console: warn`; package code uses `no-console: error`. Strict mode uses `error` globally.
- Selector-based hardening groups are composed by file scope instead of replacing one another.
- Module and declaration scopes include `.ts`, `.tsx`, `.mts`, `.cts`, `.d.ts`, `.d.mts`, and `.d.cts`.
- Test guardrails include `.test` and `.spec` files for TypeScript, MTS, and CTS modules.
- `require-children-usage` evaluates each uppercase function component independently.

Append local overrides after this package:

```js
const expoMagic = require('eslint-config-expo-magic/no-prettier');

module.exports = [
	...expoMagic,
	{
		files: ['scripts/**/*.ts'],
		rules: {
			'no-console': 'off',
		},
	},
];
```

## Compatibility

| Surface             | Supported or validated range                                              |
| ------------------- | ------------------------------------------------------------------------- |
| Node.js             | `>=18.0.0`                                                                |
| Bun                 | `>=1.0.0` for repository tooling; current package manager pin is `1.3.14` |
| ESLint              | `10.x`; package currently bundles `^10.8.0`                               |
| TypeScript ESLint   | `8.x`; package currently bundles `^8.66.0`                                |
| Expo                | `^54.0.33 \|\| ^55.0.0 \|\| ^56.0.0 \|\| ^57.0.0`                         |
| React               | `^19.1.0 \|\| ^19.2.0`                                                    |
| React Test Renderer | `^19.1.0 \|\| ^19.2.0`                                                    |
| TypeScript          | `>=5.9.3 <6.1.0`                                                          |

Packed-consumer lanes:

| Expo    | React Native | React  | TypeScript |
| ------- | ------------ | ------ | ---------- |
| 54.0.33 | 0.81.5       | 19.1.0 | 5.9        |
| 55.0.9  | 0.83.4       | 19.2.0 | 5.9        |
| 56.0.9  | 0.85.3       | 19.2.3 | 6.0        |
| 57.0.8  | 0.86.0       | 19.2.3 | 6.0        |

Expo SDK 57.0.8 / React Native 0.86.0 / React 19.2.3 is the reproducible full-fixture lane. The clean external-consumer SDK 57 smoke uses the current doctor-passing versions (Expo 57.0.11, React Native 0.86.2, jest-expo 57.0.3, React 19.2.3, Expo Doctor 1.20.1) and runs both Expo Doctor and ESLint against the packed tarball.

React Native support is Expo-coupled. A standalone React Native release is not advertised as stable until it ships in a supported stable Expo SDK or receives an explicit preview lane.

## Upgrade to 3.0.1

Upgrade to the current patch release, then run ESLint across the full repository:

```bash
bun add --dev eslint-config-expo-magic@^3.0.1
bunx eslint .
```

This release includes the post-3.0.0 configuration and package-surface fixes, plus the TypeScript ESLint 8.66 update:

- Shared TypeScript declarations now cover the root and focused exports, including PR guardrail inputs, results, presets, and React Compiler rule names.
- CommonJS, ESM, and TypeScript entry points stay aligned after the configuration assembly refactor.
- Feature-boundary handling covers file-category metadata and MTS, CTS, declaration, and test module variants.
- The bundled TypeScript ESLint packages are updated to 8.66.
- The root README, packed README, compatibility guidance, config report, and release metadata are synchronized.

If you are upgrading from 2.x, also follow the [3.0.0 migration guidance](#upgrade-to-300) below.

## Upgrade to 3.0.0

If you are upgrading from 2.x, install 3.0.0 or any later 3.x release, then run ESLint across the full repository:

```bash
bun add --dev eslint-config-expo-magic@^3.0.0
bunx eslint .
```

Migration actions:

1. **Agent preset:** expect agent-specific suppression descriptions, warning-comment policy, and overlap messages to take precedence. Update violations instead of depending on the previous duplicate or weaker diagnostic.
2. **Scoped allow files:** matching `semanticColors.allowFiles` and `nativeUi.allowFiles` now preserve unrelated restrictions. Add an explicit local rule override if a file must opt out of those other rules too.
3. **Reanimated suppressions:** replace suppressions for the old `no-restricted-syntax` SharedValue diagnostic with `expo-magic-reanimated/no-shared-value-misuse`.
4. **Manual Reanimated composition:** use `createReanimatedConfig` or `createSharedValueUsageConfig` for SharedValue diagnostics. `createRestrictedSyntaxGroups` now covers gesture selectors only.
5. **Component children:** fix every component that declares `children` without using it. One component can no longer satisfy another component's `require-children-usage` check.
6. **TypeScript unused bindings:** let `@typescript-eslint/no-unused-vars` own TypeScript diagnostics; remove local duplication with core `no-unused-vars` if present.
7. **Module and test files:** review new findings in `.mts`, `.cts`, declaration variants, and `.test`/`.spec` MTS or CTS files.

See the full [migration guide](https://github.com/JoaoPauloCMarra/eslint-config-expo-magic/blob/main/docs/MIGRATING.md), [3.0.0 changelog](https://github.com/JoaoPauloCMarra/eslint-config-expo-magic/blob/main/CHANGELOG.md#300), and [3.0.1 changelog](https://github.com/JoaoPauloCMarra/eslint-config-expo-magic/blob/main/CHANGELOG.md#301).

## Documentation

- [Rule rationale](https://github.com/JoaoPauloCMarra/eslint-config-expo-magic/blob/main/RULES.md)
- [Config diff](https://github.com/JoaoPauloCMarra/eslint-config-expo-magic/blob/main/docs/CONFIG_DIFF.md)
- [Recipes](https://github.com/JoaoPauloCMarra/eslint-config-expo-magic/blob/main/docs/RECIPES.md)
- [Agent setup recipe](https://github.com/JoaoPauloCMarra/eslint-config-expo-magic/blob/main/docs/AGENTS_RECIPE.md)
- [Release notes](https://github.com/JoaoPauloCMarra/eslint-config-expo-magic/releases)
- [Changelog](https://github.com/JoaoPauloCMarra/eslint-config-expo-magic/blob/main/CHANGELOG.md)
- [Issues](https://github.com/JoaoPauloCMarra/eslint-config-expo-magic/issues)

## Troubleshooting

### Flat config does not load

Use ESLint 10 and `eslint.config.js`, `eslint.config.mjs`, or a TypeScript config supported by your runtime. Legacy `.eslintrc*` files are not used.

### `Class extends value undefined`

Mixed `@typescript-eslint/*` major versions are the common cause. Reinstall dependencies and ensure the graph resolves TypeScript ESLint v8 consistently.

### Duplicate `import/*` and `import-x/*` diagnostics

Another config later in the array is probably re-enabling legacy `import/*` rules. Disable those rules in the final local override.

### Unexpected Prettier diagnostics or slow lint runs

Switch from the package root to `eslint-config-expo-magic/no-prettier`, then keep formatting in the editor or a separate formatter command.

## License

[MIT](https://github.com/JoaoPauloCMarra/eslint-config-expo-magic/blob/main/LICENSE)
