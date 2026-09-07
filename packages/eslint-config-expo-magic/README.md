# eslint-config-expo-magic

[![npm version](https://img.shields.io/npm/v/eslint-config-expo-magic.svg)](https://www.npmjs.com/package/eslint-config-expo-magic)
[![npm downloads](https://img.shields.io/npm/dm/eslint-config-expo-magic.svg)](https://www.npmjs.com/package/eslint-config-expo-magic)
[![CI](https://github.com/JoaoPauloCMarra/eslint-config-expo-magic/actions/workflows/ci.yml/badge.svg)](https://github.com/JoaoPauloCMarra/eslint-config-expo-magic/actions/workflows/ci.yml)
[![Release](https://github.com/JoaoPauloCMarra/eslint-config-expo-magic/actions/workflows/release.yml/badge.svg)](https://github.com/JoaoPauloCMarra/eslint-config-expo-magic/actions/workflows/release.yml)
[![Documentation](https://img.shields.io/badge/docs-guides-blue.svg)](https://github.com/JoaoPauloCMarra/eslint-config-expo-magic/tree/main/docs)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/JoaoPauloCMarra/eslint-config-expo-magic/blob/main/LICENSE)

Type-safe flat ESLint configuration for Expo, React Native, and TypeScript projects. Version 5 adds an opinionated mobile-app profile that replaces large application-owned configs with one import.

## Contents

- [Install](#install)
- [Quick start](#quick-start)
- [Presets](#presets)
- [Options](#options)
- [Included integrations](#included-integrations)
- [Focused configurations](#focused-configurations)
- [Agent setup](#agent-setup)
- [Compatibility](#compatibility)
- [Upgrading to 5.0.0](#upgrading-to-500)
- [Troubleshooting](#troubleshooting)

## Install

The package owns ESLint, Prettier, and all ESLint integration plugins. TypeScript remains a required peer because the application owns its compiler version. Expo and React are optional peers because an Expo application normally already owns them:

```bash
bun add --dev eslint-config-expo-magic typescript@^6.0.3
```

The repository uses Bun 1.4.0. Consumer projects may use Bun, npm, pnpm, or Yarn. They do not need separate ESLint, Prettier, config, or plugin dependencies.

## Quick start

For a production Expo mobile app, create `eslint.config.js`:

```js
module.exports = require('eslint-config-expo-magic/mobile-app');
```

Then point Prettier at the shared config in `package.json`:

```json
{
	"prettier": "eslint-config-expo-magic/prettier"
}
```

The mobile-app profile owns formatting, semantic colors, native UI boundaries, feature architecture, storage boundaries, naming conventions, and focused console allowances. Set `ESLINT_CONFIG_PRESET=fast` for the syntax-focused lane. The generic root configuration remains available for libraries and incremental adoption.

Run the package-owned tools with normal project scripts:

```bash
bunx eslint .
bunx eslint . --fix
bunx prettier . --check
bunx prettier . --write
```

These commands use the package-owned ESLint and Prettier versions. Existing `eslint` and `prettier` package scripts continue to work without direct tool dependencies in the consumer.

Formatting and testing integrations are included. Opt in only when the project wants their rules:

```js
const { createConfig } = require('eslint-config-expo-magic');

module.exports = createConfig({
	prettier: true,
	testing: true,
});
```

## Presets

The root export is a flat config array and also exposes the named presets below. `createConfig` is useful when a project needs a small, explicit composition.

| Preset     | Import                                | Behavior                                                                                                                           |
| ---------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Base       | `eslint-config-expo-magic/base`       | Expo baseline, resolver setup, and the smallest project surface                                                                    |
| Default    | `eslint-config-expo-magic`            | Core Expo, TypeScript, React Native, import, app, workspace, and cycle rules; formatting, testing, and hardening layers are opt-in |
| Fast       | `eslint-config-expo-magic/fast`       | Core syntax and hooks without type-aware analysis, React Compiler diagnostics, or import-cycle traversal                           |
| Typed      | `eslint-config-expo-magic/typed`      | Default rules plus maintained type-checked TypeScript rules                                                                        |
| Strict     | `eslint-config-expo-magic/strict`     | Default rules plus strict TypeScript diagnostics and `no-console: error`                                                           |
| Agent      | `eslint-config-expo-magic/agent`      | Default rules plus agent-safe suppression, test, type, and patch guardrails                                                        |
| Mobile app | `eslint-config-expo-magic/mobile-app` | Opinionated production Expo app profile with formatting, architecture, UIKit, storage, naming, and agent guardrails                |

The fast preset still includes the core React and React Native hooks. It checks `./tsconfig.json` by default and skips project-wide type-aware parsing, compiler diagnostics, and cycle traversal. Pass `tsconfigProjects` or use `createConfig` when the project needs a different syntax-only scope.

```js
const { createConfig } = require('eslint-config-expo-magic');

module.exports = createConfig({ preset: 'fast' });
```

Typed and strict configurations require a compatible TypeScript installation. Their type-aware rules can add startup cost and should be used where the project wants those diagnostics.

## Options

`createConfig(options)` accepts these top-level options:

| Option               | Default            | Purpose                                                          |
| -------------------- | ------------------ | ---------------------------------------------------------------- |
| `preset`             | `'default'`        | Select `'base'`, `'default'`, or `'fast'` composition            |
| `prettier`           | `false`            | Enable `eslint-plugin-prettier` and the `prettier/prettier` rule |
| `testing`            | `false`            | Enable Jest and Testing Library rules                            |
| `typeChecked`        | `false`            | Add TypeScript ESLint type-checked rules                         |
| `strict`             | `false`            | Add strict TypeScript rules and `no-console: error`              |
| `importCycles`       | `true` except fast | Enable graph-wide `import-x/no-cycle` traversal                  |
| `tsconfigProjects`   | Project globs      | Override TypeScript project discovery                            |
| `extraIgnores`       | `[]`               | Add ignore globs to the shared configuration                     |
| `agent`              | `false`            | Enable agent-safe defaults or provide agent options              |
| `appGuardrails`      | `false`            | Enable application guardrails                                    |
| `componentStructure` | `false`            | Enforce component structure conventions                          |
| `deprecatedApis`     | `false`            | Restrict deprecated React and React Native APIs                  |
| `featureBoundaries`  | `false`            | Enable feature and service boundary policies                     |
| `inlineStyles`       | `false`            | Warn or error on inline styles in TSX                            |
| `nativeUi`           | `false`            | Restrict native primitive imports                                |
| `reactCompiler`      | `false`            | Enable React Compiler diagnostics                                |
| `reanimated`         | `false`            | Enable Reanimated hardening                                      |
| `semanticColors`     | `false`            | Enforce semantic color tokens                                    |
| `storybook`          | `false`            | Apply Storybook file overrides                                   |
| `worklets`           | `false`            | Enable Worklets scheduling hardening                             |

Options that accept `true` also accept a focused options object where that configuration supports one. Agent mode supplies the default app, deprecated-API, Reanimated, and Worklets hardening; explicit top-level values still take precedence.

## Included integrations

Prettier, Jest, Testing Library, and feature-boundary integrations ship with the package. Enable the rule families selected by the project with `createConfig`:

```js
const { createConfig } = require('eslint-config-expo-magic');

module.exports = createConfig({
	prettier: true,
	testing: true,
	featureBoundaries: true,
});
```

The default and fast presets keep these rule families disabled. This preserves the lightweight default without making each consumer manage the underlying lint dependencies.

## Focused configurations

The root export exposes focused factories and configs for projects that want to compose one guardrail at a time:

- `createAppGuardrailsConfig()` / `appGuardrails`
- `createComponentStructureConfig()` / `componentStructure`
- `createDeprecatedApiConfig()` / `deprecatedApis`
- `createFeatureBoundaryConfig()` from `eslint-config-expo-magic/feature-boundaries`
- `createNativeUiConfig()` / `nativeUi`
- `createReanimatedConfig()` / `reanimated`
- `createSemanticColorsConfig()` / `semanticColors`
- `reactCompiler`, `storybook`, and `worklets`

Focused configurations remain opt-in so a project can adopt a rule family incrementally.

## Agent setup

The package ships `expo-magic-init` and the compatible `expo-magic-init-agent` alias. It prints a dry-run plan by default and writes only missing config files when invoked with `--write`:

```bash
bunx expo-magic-init
bunx expo-magic-init --write
```

The generated ESLint file uses the mobile-app profile and adds the shared Prettier setting. Existing files and script values are preserved.

The package also exports `agent-guardrails` and `pr-guardrails` surfaces for repositories that need guardrail-only composition.

## Compatibility

Version 5.0.0 supports the following tested range:

| Surface               | Supported range or lane                                                      |
| --------------------- | ---------------------------------------------------------------------------- |
| Node.js               | `^20.19.0 \|\| ^22.13.0 \|\| >=24`                                           |
| Bun                   | `>=1.4.0`; repository package manager is `bun@1.4.0`                         |
| ESLint                | `^10.10.0`                                                                   |
| TypeScript            | `>=5.9.3 <6.1.0`                                                             |
| TypeScript ESLint     | `^8.69.0`                                                                    |
| Expo                  | SDK 54, 55, 56, and 57 smoke lanes; SDK 57 fixture is 57.0.20                |
| React Native          | Expo-coupled; SDK 57.0.20 uses RN 0.86.3                                     |
| React                 | SDK 57.0.20 fixture uses React 19.2.3                                        |
| React Test Renderer   | SDK 57.0.20 fixture uses 19.2.3                                              |
| Jest Expo / RN preset | `jest-expo` 57.0.5 / `@react-native/jest-preset` 0.86.3 in the SDK57 fixture |

The SDK57 fixture intentionally stays on Expo Doctor's verified React 19.2.3 and React Test Renderer 19.2.3 tuple; newer React patch releases shown by `bun outdated` are not promoted without matching fixture proof.

TypeScript 7 and the React Native/Jest preset 0.87 line remain intentional future holds until the matching compatibility proof is available. React Native support is advertised through Expo SDK lanes rather than as an independent version promise.

## Upgrading to 5.0.0

Install the new package and its TypeScript peer explicitly:

```bash
bun add --dev eslint-config-expo-magic typescript@^6.0.3
```

Mobile apps can replace their package-owned integration configuration with:

```js
module.exports = require('eslint-config-expo-magic/mobile-app');
```

Set `prettier` to `eslint-config-expo-magic/prettier` and remove direct ESLint, Prettier, config, resolver, and plugin dependencies now owned by this package. Keep only application-specific overrides after the shared array. TypeScript is the only required toolchain peer; Expo and React remain optional application peers. See [docs/MIGRATING.md](https://github.com/JoaoPauloCMarra/eslint-config-expo-magic/blob/main/docs/MIGRATING.md) for the full checklist.

Review any local ESLint config that imports a removed export, then run:

```bash
bun install
bunx eslint .
bunx tsc --noEmit
```

## Troubleshooting

### Missing peer dependency

Install a compatible TypeScript version explicitly. ESLint, Prettier, and the integration plugins are bundled with this package.

### Type-aware linting is slow

Use `eslint-config-expo-magic/fast` or `createConfig({ preset: 'fast' })` for syntax-focused checks. It uses only `./tsconfig.json` by default and skips project services, compiler diagnostics, and import-cycle traversal.

### TypeScript ESLint version mismatch

Keep the TypeScript ESLint family on the v8 line and TypeScript below 6.1. Mixed major versions are the usual cause of parser and rule loading failures. Reinstall the lockfile after changing those ranges.

### Rules from an included plugin are not found

Check that the matching `createConfig` option is enabled, then reinstall `eslint-config-expo-magic` if the bundled plugin is missing from the lockfile.

### Further reading

- [Detailed rule rationale](https://github.com/JoaoPauloCMarra/eslint-config-expo-magic/blob/main/RULES.md)
- [Migration guide](https://github.com/JoaoPauloCMarra/eslint-config-expo-magic/blob/main/docs/MIGRATING.md)
- [Recipes](https://github.com/JoaoPauloCMarra/eslint-config-expo-magic/blob/main/docs/RECIPES.md)
- [Agent recipe](https://github.com/JoaoPauloCMarra/eslint-config-expo-magic/blob/main/docs/AGENTS_RECIPE.md)
- [Configuration report](https://github.com/JoaoPauloCMarra/eslint-config-expo-magic/blob/main/docs/CONFIG_DIFF.md)
