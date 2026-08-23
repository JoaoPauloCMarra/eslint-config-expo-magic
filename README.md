# eslint-config-expo-magic

[![npm version](https://img.shields.io/npm/v/eslint-config-expo-magic.svg)](https://www.npmjs.com/package/eslint-config-expo-magic)
[![npm downloads](https://img.shields.io/npm/dm/eslint-config-expo-magic.svg)](https://www.npmjs.com/package/eslint-config-expo-magic)
[![CI](https://github.com/JoaoPauloCMarra/eslint-config-expo-magic/actions/workflows/ci.yml/badge.svg)](https://github.com/JoaoPauloCMarra/eslint-config-expo-magic/actions/workflows/ci.yml)
[![Release](https://github.com/JoaoPauloCMarra/eslint-config-expo-magic/actions/workflows/release.yml/badge.svg)](https://github.com/JoaoPauloCMarra/eslint-config-expo-magic/actions/workflows/release.yml)
[![Documentation](https://img.shields.io/badge/docs-guides-blue.svg)](https://github.com/JoaoPauloCMarra/eslint-config-expo-magic/tree/main/docs)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/JoaoPauloCMarra/eslint-config-expo-magic/blob/main/LICENSE)

Type-safe flat ESLint configuration for Expo, React Native, and TypeScript projects. Version 4 keeps the core mobile rules lightweight, while optional formatting, testing, and feature-boundary integrations can be enabled explicitly.

## Contents

- [Install](#install)
- [Quick start](#quick-start)
- [Presets](#presets)
- [Options](#options)
- [Optional integrations](#optional-integrations)
- [Focused configurations](#focused-configurations)
- [Agent setup](#agent-setup)
- [Compatibility](#compatibility)
- [Upgrading to 4.0.0](#upgrading-to-400)
- [Troubleshooting](#troubleshooting)

## Install

The package declares ESLint and TypeScript as required peers. Expo and React are optional peers because an Expo application normally already owns them. Install the package with the peers required by the project:

```bash
bun add --dev eslint@^10.9.0 eslint-config-expo-magic typescript@^6.0.3
```

The repository uses Bun 1.4.0. Consumer projects may use Bun, npm, pnpm, or Yarn, but they must install the required peers themselves. The package does not rely on package-manager auto-installation of optional peers.

## Quick start

Create `eslint.config.js`:

```js
const { createConfig } = require('eslint-config-expo-magic');

module.exports = createConfig();
```

Or use the ESM export:

```js
import expoMagic from 'eslint-config-expo-magic';

export default expoMagic;
```

The v4 root configuration is the lightweight default: formatting and test-plugin rules are off, while the core Expo, TypeScript, React Native, import, app, and workspace overrides remain active. Hardening layers such as deprecated-API, React Compiler, Reanimated, Worklets, app guardrails, and semantic colors are opt-in. Run ESLint with your normal project script:

```bash
bunx eslint .
```

To enable the optional formatting and testing integrations, install their peers and opt in:

```bash
bun add --dev eslint-config-prettier eslint-plugin-prettier prettier
bun add --dev eslint-plugin-jest eslint-plugin-testing-library
```

```js
const { createConfig } = require('eslint-config-expo-magic');

module.exports = createConfig({
	prettier: true,
	testing: true,
});
```

## Presets

The root export is a flat config array and also exposes the named presets below. `createConfig` is useful when a project needs a small, explicit composition.

| Preset | Import | Behavior |
| --- | --- | --- |
| Base | `eslint-config-expo-magic/base` | Expo baseline, resolver setup, and the smallest project surface |
| Default | `eslint-config-expo-magic` | Core Expo, TypeScript, React Native, import, app, workspace, and cycle rules; formatting, testing, and hardening layers are opt-in |
| Fast | `eslint-config-expo-magic/fast` | Core syntax and hooks without type-aware analysis, React Compiler diagnostics, or import-cycle traversal |
| Typed | `eslint-config-expo-magic/typed` | Default rules plus maintained type-checked TypeScript rules |
| Strict | `eslint-config-expo-magic/strict` | Default rules plus strict TypeScript diagnostics and `no-console: error` |
| Agent | `eslint-config-expo-magic/agent` | Default rules plus agent-safe suppression, test, type, and patch guardrails |

The fast preset still includes the core React and React Native hooks. It checks `./tsconfig.json` by default and skips project-wide type-aware parsing, compiler diagnostics, and cycle traversal. Pass `tsconfigProjects` or use `createConfig` when the project needs a different syntax-only scope.

```js
const { createConfig } = require('eslint-config-expo-magic');

module.exports = createConfig({ preset: 'fast' });
```

Typed and strict configurations require a compatible TypeScript installation. Their type-aware rules can add startup cost and should be used where the project wants those diagnostics.

## Options

`createConfig(options)` accepts these top-level options:

| Option | Default | Purpose |
| --- | --- | --- |
| `preset` | `'default'` | Select `'base'`, `'default'`, or `'fast'` composition |
| `prettier` | `false` | Enable `eslint-plugin-prettier` and the `prettier/prettier` rule |
| `testing` | `false` | Enable Jest and Testing Library rules |
| `typeChecked` | `false` | Add TypeScript ESLint type-checked rules |
| `strict` | `false` | Add strict TypeScript rules and `no-console: error` |
| `importCycles` | `true` except fast | Enable graph-wide `import-x/no-cycle` traversal |
| `tsconfigProjects` | Project globs | Override TypeScript project discovery |
| `extraIgnores` | `[]` | Add ignore globs to the shared configuration |
| `agent` | `false` | Enable agent-safe defaults or provide agent options |
| `appGuardrails` | `false` | Enable application guardrails |
| `componentStructure` | `false` | Enforce component structure conventions |
| `deprecatedApis` | `false` | Restrict deprecated React and React Native APIs |
| `featureBoundaries` | `false` | Enable feature and service boundary policies |
| `inlineStyles` | `false` | Warn or error on inline styles in TSX |
| `nativeUi` | `false` | Restrict native primitive imports |
| `reactCompiler` | `false` | Enable React Compiler diagnostics |
| `reanimated` | `false` | Enable Reanimated hardening |
| `semanticColors` | `false` | Enforce semantic color tokens |
| `storybook` | `false` | Apply Storybook file overrides |
| `worklets` | `false` | Enable Worklets scheduling hardening |

Options that accept `true` also accept a focused options object where that configuration supports one. Agent mode supplies the default app, deprecated-API, Reanimated, and Worklets hardening; explicit top-level values still take precedence.

## Optional integrations

Optional peer integrations are kept out of the published runtime dependency graph. Install only the integrations used by the project:

```bash
# Formatting
bun add --dev eslint-config-prettier eslint-plugin-prettier prettier

# Jest and Testing Library
bun add --dev eslint-plugin-jest eslint-plugin-testing-library

# Feature boundaries
bun add --dev eslint-plugin-boundaries
```

Then enable them with `createConfig`:

```js
const { createConfig } = require('eslint-config-expo-magic');

module.exports = createConfig({
	prettier: true,
	testing: true,
	featureBoundaries: true,
});
```

The default and fast packed-consumer paths work with only the required ESLint and TypeScript peers. An integration path must install its selected optional peers explicitly.

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

The package ships `expo-magic-init-agent`. It prints a dry-run plan by default and writes only missing config files when invoked with `--write`:

```bash
bunx expo-magic-init-agent
bunx expo-magic-init-agent --write
```

The generated configuration uses `createConfig({ agent: true })`; v4's default already leaves optional formatting and testing integrations disabled. Existing files and script values are preserved.

The package also exports `agent-guardrails` and `pr-guardrails` surfaces for repositories that need guardrail-only composition.

## Compatibility

Version 4.0.0 supports the following tested range:

| Surface | Supported range or lane |
| --- | --- |
| Node.js | `^20.19.0 || ^22.13.0 || >=24` |
| Bun | `>=1.4.0`; repository package manager is `bun@1.4.0` |
| ESLint | `^10.9.0` |
| TypeScript | `>=5.9.3 <6.1.0` |
| TypeScript ESLint | `^8.67.0` |
| Expo | SDK 54, 55, 56, and 57 smoke lanes; SDK 57 fixture is 57.0.15 |
| React Native | Expo-coupled; SDK 57.0.15 uses RN 0.86.2 |
| React | SDK 57.0.15 fixture uses React 19.2.3 |
| React Test Renderer | SDK 57.0.15 fixture uses 19.2.3 |
| Jest Expo / RN preset | `jest-expo` 57.0.4 / `@react-native/jest-preset` 0.86.2 in the SDK57 fixture |

The SDK57 fixture intentionally stays on Expo Doctor's verified React 19.2.3 and React Test Renderer 19.2.3 tuple; newer React patch releases shown by `bun outdated` are not promoted without matching fixture proof.

TypeScript 7 and the React Native/Jest preset 0.87 line remain intentional future holds until the matching compatibility proof is available. React Native support is advertised through Expo SDK lanes rather than as an independent version promise.

## Upgrading to 4.0.0

Install the new package and its required peers explicitly:

```bash
bun add --dev eslint@^10.9.0 eslint-config-expo-magic typescript@^6.0.3
```

The root configuration is now lightweight. Projects that previously relied on package-provided formatting and test rules should install the optional peers and use:

```js
const { createConfig } = require('eslint-config-expo-magic');

module.exports = createConfig({
	prettier: true,
	testing: true,
});
```

The legacy formatter-free aliases and subpath were removed in v4; the root default now provides that behavior without a separate export. Root-level `createFeatureBoundaryConfig` and `featureBoundaries` named exports were also removed; import the dedicated `eslint-config-expo-magic/feature-boundaries` subpath or use `createConfig({ featureBoundaries: true })`. ESLint and TypeScript are required peers, while Expo, React, formatting, testing, and feature-boundary integrations are optional peers that must be installed when selected. See [docs/MIGRATING.md](https://github.com/JoaoPauloCMarra/eslint-config-expo-magic/blob/main/docs/MIGRATING.md) for the full 3.x migration checklist.

Review any local ESLint config that imports a removed export, then run:

```bash
bun install
bunx eslint .
bunx tsc --noEmit
```

## Troubleshooting

### Missing peer dependency

Install ESLint and TypeScript explicitly. If an option enables formatting, testing, or boundaries, install the corresponding optional peer set shown above. Optional peers are not bundled into the package.

### Type-aware linting is slow

Use `eslint-config-expo-magic/fast` or `createConfig({ preset: 'fast' })` for syntax-focused checks. It uses only `./tsconfig.json` by default and skips project services, compiler diagnostics, and import-cycle traversal.

### TypeScript ESLint version mismatch

Keep the TypeScript ESLint family on the v8 line and TypeScript below 6.1. Mixed major versions are the usual cause of parser and rule loading failures. Reinstall the lockfile after changing those ranges.

### Rules from an optional plugin are not found

Check that the plugin is installed in the same consumer project as this package and that its matching `createConfig` option is enabled. A minimal configuration should not enable an integration whose peer is absent.

### Further reading

- [Detailed rule rationale](https://github.com/JoaoPauloCMarra/eslint-config-expo-magic/blob/main/RULES.md)
- [Migration guide](https://github.com/JoaoPauloCMarra/eslint-config-expo-magic/blob/main/docs/MIGRATING.md)
- [Recipes](https://github.com/JoaoPauloCMarra/eslint-config-expo-magic/blob/main/docs/RECIPES.md)
- [Agent recipe](https://github.com/JoaoPauloCMarra/eslint-config-expo-magic/blob/main/docs/AGENTS_RECIPE.md)
- [Configuration report](https://github.com/JoaoPauloCMarra/eslint-config-expo-magic/blob/main/docs/CONFIG_DIFF.md)
