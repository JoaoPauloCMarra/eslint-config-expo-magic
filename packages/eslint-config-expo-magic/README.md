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
- [Layered architecture](#layered-architecture)
- [Agent setup](#agent-setup)
- [Compatibility](#compatibility)
- [Upgrading to 5.0.0](#upgrading-to-500)
- [Troubleshooting](#troubleshooting)

## Install

The package owns ESLint, Prettier, and all ESLint integration plugins. TypeScript remains a required peer because the application owns its compiler version. Expo and React are optional peers because an Expo application normally already owns them:

```bash
bun add --dev eslint-config-expo-magic typescript@~6.0.3
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

Use these project scripts to select the package-owned tools deterministically in a conventional `node_modules` installation:

```json
{
 "scripts": {
  "lint": "node node_modules/eslint-config-expo-magic/bin/eslint.js .",
  "lint:fix": "node node_modules/eslint-config-expo-magic/bin/eslint.js . --fix",
  "format:check": "node node_modules/eslint-config-expo-magic/bin/prettier.js . --check",
  "format": "node node_modules/eslint-config-expo-magic/bin/prettier.js . --write"
 }
}
```

Run them with your package manager, for example `npm run lint` or `bun run lint`. Generic `eslint` / `prettier` commands (including `npx` and `bunx`) use whichever executable the package manager linked into `.bin`; another dependency can own that name. In a clean npm consumer, a transitive ESLint 9 can take the generic bin while this config owns ESLint 10. The explicit launchers resolve the tools from this package instead.

Existing scripts are preserved by `expo-magic-init`; migrate generic tool scripts to the explicit paths above when package-owned dispatch is required. The initializer uses the explicit ESLint launcher only when adding a missing `lint` script. These paths assume project-root `node_modules`; Yarn Plug'n'Play is not covered by this invocation example.

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

The fast preset still includes the core React and React Native hooks. It resolves imports against `./tsconfig.json` by default and skips project-wide type-aware parsing, compiler diagnostics, and cycle traversal. Pass `tsconfigProjects` when imports resolve through other TypeScript projects.

```js
const { createConfig } = require('eslint-config-expo-magic');

module.exports = createConfig({ preset: 'fast' });
```

The base preset does no type-aware parsing by itself. `createConfig({ preset: 'base', strict: true })` or `typeChecked: true` turns it on through the TypeScript project service, so each linted file needs a `tsconfig.json` that the service can find. The `testing`, `importCycles`, and `inlineStyles` options also work with `preset: 'base'`.

Typed and strict configurations require a compatible TypeScript installation. Their type-aware rules can add startup cost and should be used where the project wants those diagnostics.

## Options

`createConfig(options)` accepts these top-level options:

| Option               | Default                 | Purpose                                                          |
| -------------------- | ----------------------- | ---------------------------------------------------------------- |
| `preset`             | `'default'`             | Select `'base'`, `'default'`, or `'fast'` composition            |
| `prettier`           | `false`                 | Enable `eslint-plugin-prettier` and the `prettier/prettier` rule |
| `testing`            | `false`                 | Enable Jest and Testing Library rules                            |
| `typeChecked`        | `false`                 | Add TypeScript ESLint type-checked rules                         |
| `strict`             | `false`                 | Add strict TypeScript rules and `no-console: error`              |
| `importCycles`       | `true` for default only | Enable graph-wide `import-x/no-cycle` traversal                  |
| `tsconfigProjects`   | Project globs           | Set the TypeScript projects for import resolution                |
| `extraIgnores`       | `[]`                    | Add ignore globs to the shared configuration                     |
| `agent`              | `false`                 | Enable agent-safe defaults or provide agent options              |
| `appGuardrails`      | `false`                 | Enable application guardrails                                    |
| `componentStructure` | `false`                 | Enforce component structure conventions                          |
| `deprecatedApis`     | `false`                 | Restrict deprecated React and React Native APIs                  |
| `featureBoundaries`  | `false`                 | Enable feature and service boundary policies                     |
| `inlineStyles`       | `false`                 | Warn or error on inline styles in TSX                            |
| `nativeUi`           | `false`                 | Restrict native primitive imports                                |
| `reactCompiler`      | `false`                 | Promote React Compiler diagnostics to `error`                    |
| `reanimated`         | `false`                 | Enable Reanimated hardening                                      |
| `semanticColors`     | `false`                 | Enforce semantic color tokens                                    |
| `storybook`          | `false`                 | Apply Storybook file overrides                                   |
| `worklets`           | `false`                 | Enable Worklets scheduling hardening                             |

Options that accept `true` also accept a focused options object where that configuration supports one. Agent mode supplies the default app, deprecated-API, Reanimated, and Worklets hardening, and turns on `reactCompiler` when the preset is type-aware. An explicit top-level option always wins over the agent value, for example `createConfig({ agent: true, reanimated: false })`.

`importCycles` defaults to `true` only for `preset: 'default'` and the presets built on it (typed, strict, agent). It defaults to `false` for base and fast.

`tsconfigProjects` paths are relative to the directory ESLint runs from. The list always goes to the import resolvers. It goes to the parser as `parserOptions.project` only when `typeChecked` is `true`. In all other cases, type-aware parsing keeps `projectService`, which finds the nearest `tsconfig.json` for each file. When the option is not passed, the default and base presets use `./tsconfig.json`, `./apps/*/tsconfig.json`, `./packages/*/tsconfig.json`, and `./test-project/tsconfig.json`, and fast uses `./tsconfig.json`.

`typeChecked` adds the `recommendedTypeChecked` and `stylisticTypeChecked` configs from TypeScript ESLint. Among other changes, this raises `@typescript-eslint/no-require-imports` from the `warn` level set by `eslint-config-expo` to `error`.

In the default preset, most React Compiler diagnostics are already `error`. `reactCompiler: true` promotes only `react-hooks/incompatible-library` and `react-hooks/unsupported-syntax` from `warn` to `error`. The option matters most with `preset: 'fast'`, which has no compiler diagnostics: there it adds `incompatible-library`, `unsupported-syntax`, `immutability`, `purity`, `preserve-manual-memoization`, `set-state-in-render`, and `static-components` at `error`.

`nativeUi: { restrictions }` replaces only the native-UI import list. The `SafeAreaView` import ban from `react-native` always stays. Use `additionalRestrictions` to extend the default list instead of replacing it.

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

- `createAgentGuardrailsConfig()` / `agentGuardrails`
- `createAppGuardrailsConfig()` / `appGuardrails`
- `createComponentStructureConfig()` / `componentStructure`
- `createDeprecatedApiConfig()` / `deprecatedApis`
- `createArchitectureConfig()` from `eslint-config-expo-magic/architecture`
- `createFeatureBoundaryConfig()` from `eslint-config-expo-magic/feature-boundaries`
- `createNativeUiConfig()` / `nativeUi`
- `createReanimatedConfig()` / `reanimated`
- `createSemanticColorsConfig()` / `semanticColors`
- `reactCompiler`, `storybook`, and `worklets`

Focused configurations remain opt-in so a project can adopt a rule family incrementally.

Several layers (agent and app guardrails, Reanimated, semantic colors, and Worklets) set `no-restricted-syntax`. ESLint flat config replaces a rule's options when a later entry sets the same rule, so if you spread two of these standalone configs into one array, only the last one's selectors apply to a file. Enable them through `createConfig` options instead, which composes their selectors into one rule entry:

```js
const { createConfig } = require('eslint-config-expo-magic');

module.exports = createConfig({ semanticColors: true, worklets: true });
```

### Subpath exports

Each entry below is also available as `eslint-config-expo-magic/<subpath>` for both `require` and `import`, with TypeScript declarations.

| Subpath               | Export                                                                                          |
| --------------------- | ----------------------------------------------------------------------------------------------- |
| `base`                | Base preset config array                                                                        |
| `fast`                | Fast preset config array                                                                        |
| `typed`               | Typed preset config array                                                                       |
| `strict`              | Strict preset config array                                                                      |
| `agent`               | Agent preset config array                                                                       |
| `mobile-app`          | Mobile-app profile; see [Quick start](#quick-start)                                             |
| `architecture`        | See [Layered architecture](#layered-architecture)                                               |
| `agent-guardrails`    | Config array plus `createAgentGuardrailsConfig`, `base`, `syntaxBase`, `restrictedSyntaxGroups` |
| `app-guardrails`      | Config array plus `createAppGuardrailsConfig`, `base`, `restrictedSyntaxGroups`                 |
| `component-structure` | Config array plus `createComponentStructureConfig`, `plugin`, `recommended`                     |
| `deprecated-apis`     | Config array plus `createDeprecatedApiConfig`, `recommended`                                    |
| `feature-boundaries`  | `createFeatureBoundaryConfig`, `recommended`                                                    |
| `native-ui`           | `createNativeUiConfig`, `defaultRestrictions`, `recommended`                                    |
| `react-compiler`      | Config array                                                                                    |
| `reanimated`          | Config array plus `createReanimatedConfig`, `createSharedValueUsageConfig`                      |
| `semantic-colors`     | Config array plus `createSemanticColorsConfig`, `createAllowConfig`                             |
| `storybook`           | Config array                                                                                    |
| `worklets`            | Config array                                                                                    |
| `prettier`            | Shared Prettier options                                                                         |
| `pr-guardrails`       | `validateGuardrails`, `runCli`, presets, and helpers; see [Agent setup](#agent-setup)           |

## Layered architecture

`eslint-config-expo-magic/architecture` enforces a layered `src/` application on
top of any preset. It is for projects that keep routes, features, services and a
UI layer as separate layers with a `@/` alias.

```js
const { createConfig } = require('eslint-config-expo-magic');
const {
	createArchitectureConfig,
} = require('eslint-config-expo-magic/architecture');

const nativeUi = true;
const base = createConfig({
	prettier: true,
	nativeUi,
	semanticColors: { tokenModule: 'uikit/tokens/colors' },
});

module.exports = [
	...base,
	...createArchitectureConfig({
		layers: {
			routes: 'app',
			ui: 'uikit',
			tokens: 'uikit/tokens',
			components: 'uikit/components',
		},
		baseConfig: base,
		nativeUi,
	}),
];
```

Pass the config you spread first as `baseConfig`, and pass the same `nativeUi`
value to both calls. See [Composition](#composition) below.

Layer names are explicit rather than a preset enum, so a project that calls its
route host `core` and its UI layer `shared` passes those names instead.

What it enforces:

- Cross-feature imports are contracts-only, matched on the feature segment of
  both paths. Catches aliased and relative specifiers alike, works with flat
  feature folders, and needs no import resolver.
- Owned primitives: raw React Native `Button`, `Image`, `Pressable`,
  `ScrollView`, `FlatList` and `Modal` stay inside the wrapper files listed in
  `nativeWrappers` (and `nativeUi.allowFiles`). Wrapper files are exempt from
  the primitive ban only; the layer bans still apply to them.
- Raw colour literals stay out of every layer, including views.
- Layer direction: services never import features or routes, and the UI layer
  never imports either. Aliased (`aliasPrefix`) and relative specifiers are
  both checked.
- HTTP belongs to services. `fetch`, `XMLHttpRequest` and HTTP client packages
  are banned elsewhere, including the `globalThis.fetch` form.
- `console.*` belongs to the owned logger, including `globalThis.console`.
- No barrels at any depth, and no `domain/` / `application/` / `ui/` trees
  inside a feature.
- Views render and wire only: no effects, no chained collection pipelines (a
  single `.map` for list rendering is fine), and no query or client-state
  imports. `*-view` files and feature components receive props; only a screen
  host may call a feature hook, including flat `use-*` hook files.
- Test files keep the base `SafeAreaView` ban.
- File names are lowercase kebab-case, with router conventions such as
  `+not-found` and `[id]` exempt.

### Composition

ESLint flat config _replaces_ a rule's options when a later entry sets the
same rule. The architecture blocks compose instead: for each file, one
`no-restricted-imports` and one `no-restricted-syntax` entry holds every
restriction that applies to it, and exemptions (wrappers, the logger, the
token module) remove only their own restriction. `.tsx` views keep the same
layer bans as `.ts` files.

With `baseConfig`, the `no-restricted-imports` and `no-restricted-syntax`
entries of the config you spread first (agent guardrails, Reanimated, Worklets,
semantic colors, your own bans) are restated inside every architecture block.
Wrapper and test files drop only the primitive and native-library bans. ESLint
has one severity per rule and file, so a restated restriction is reported as an
error inside `src/` even when the base config sets it to `warn`.
Without `baseConfig`, only the native-UI and semantic-colour restrictions that
architecture knows about are kept inside `src/`, and other layers' selectors
are replaced there.

Options: `layers`, `srcRoot`, `aliasPrefix`, `tokenModule` (the colour module
path, as in `semanticColors`; the `layers.tokens` directory form resolves to its
`colors` module), `loggerModule`, `nativeWrappers`, `extraNativeUiRestrictions`,
`extraNativeLibPatterns` (`group` or `regex` entries), `nativeUi`, and
`baseConfig`.

Between these rules and the `importCycles` option, the layer direction,
cross-feature isolation, and cycle checks that projects usually delegate to a
separate dependency-graph tool are covered by ESLint alone.

## Agent setup

The package ships `expo-magic-init` and the compatible `expo-magic-init-agent` alias. It prints a dry-run plan by default and writes only missing config files when invoked with `--write`:

```bash
bunx expo-magic-init
bunx expo-magic-init --write
```

With `--write`, the command:

- Writes `eslint.config.js` with the mobile-app profile, or `eslint.config.cjs` when `package.json` sets `"type": "module"`. It skips this step when any `eslint.config.{js,mjs,cjs,ts,mts,cts}` file exists.
- Writes `expo-magic.pr-guardrails.cjs` with the `agentMobileApp` preset when that file is missing.
- Adds the `lint`, `typecheck`, and `validate:pr-guardrails` scripts when they are missing. Existing script values are preserved.
- Adds `"prettier": "eslint-config-expo-magic/prettier"` unless `package.json` already has a `prettier` key or the project has a `.prettierrc*` or `prettier.config.*` file.
- Keeps the indentation and trailing newline of `package.json`.
- Exits with an error when the current directory has no `package.json`. Run it from the project root.

The package also exports `agent-guardrails` and `pr-guardrails` surfaces for repositories that need guardrail-only composition. The `expo-magic-pr-guardrails` CLI checks pull requests in CI:

- A broad ESLint disable is a directive without a rule name, or any file-level `eslint-disable` comment. `eslint-disable-line` and `eslint-disable-next-line` that name a rule are allowed.
- When runtime files change, the PR body must name the simulator, emulator, or device. Only prose or a checked custom checklist item counts. The preset's own checklist labels and unchecked items do not.
- Each changed screen or component file needs a changed test or story nearby: in the same directory, in a `__tests__` or `__stories__` folder there, or in the same `features/<name>` root. Test and story files end in `.test`, `.spec`, or `.stories` with a `js`, `jsx`, `ts`, `tsx`, `mjs`, `cjs`, `mts`, or `cts` extension, or sit in a `__tests__` or `__stories__` folder. The owner-approval label skips this check.
- The `mobileApp` and `agentMobileApp` presets match both root paths and `src/` paths, for example `features/` and `src/features/`.

See [docs/RECIPES.md](https://github.com/JoaoPauloCMarra/eslint-config-expo-magic/blob/main/docs/RECIPES.md#pr-guardrails-cli) for CI setup.

## Compatibility

The 5.x release line supports the following tested range:

| Surface               | Supported range or lane                                                      |
| --------------------- | ---------------------------------------------------------------------------- |
| Node.js               | `^20.19.0 \|\| ^22.13.0 \|\| >=24`                                           |
| Bun                   | `>=1.4.0`; repository package manager is `bun@1.4.0`                         |
| ESLint                | `^10.10.0`                                                                   |
| TypeScript            | `>=5.9.3 <6.1.0`                                                             |
| TypeScript ESLint     | `^8.69.0`                                                                    |
| Expo                  | SDK 54, 55, 56, and 57 smoke lanes; SDK 57 fixture is 57.0.26                |
| React Native          | Expo-coupled; SDK 57.0.26 uses RN 0.86.3                                     |
| React                 | SDK 57.0.26 fixture uses React 19.2.3                                        |
| React Test Renderer   | SDK 57.0.26 fixture uses 19.2.3                                              |
| Jest Expo / RN preset | `jest-expo` 57.0.5 / `@react-native/jest-preset` 0.86.3 in the SDK57 fixture |

The SDK 57 smoke lanes read these versions from `test-project/package.json`, so the fixture is the single source for the SDK 57 tuple. The SDK57 fixture intentionally stays on Expo Doctor's verified React 19.2.3 and React Test Renderer 19.2.3 tuple; newer React patch releases shown by `bun outdated` are not promoted without matching fixture proof.

TypeScript 7 and the React Native/Jest preset 0.87 line remain intentional future holds until the matching compatibility proof is available. React Native support is advertised through Expo SDK lanes rather than as an independent version promise.

## Upgrading to 5.0.0

Install the new package and its TypeScript peer explicitly:

```bash
bun add --dev eslint-config-expo-magic typescript@~6.0.3
```

Mobile apps can replace their package-owned integration configuration with:

```js
module.exports = require('eslint-config-expo-magic/mobile-app');
```

Set `prettier` to `eslint-config-expo-magic/prettier` and remove direct ESLint, Prettier, config, resolver, and plugin dependencies now owned by this package. Keep only application-specific overrides after the shared array. TypeScript is the only required toolchain peer; Expo and React remain optional application peers. See [docs/MIGRATING.md](https://github.com/JoaoPauloCMarra/eslint-config-expo-magic/blob/main/docs/MIGRATING.md) for the full checklist.

Review any local ESLint config that imports a removed export, then run:

```bash
bun install
bun run lint
bunx tsc --noEmit
```

## Troubleshooting

### Missing peer dependency

Install a compatible TypeScript version explicitly. ESLint, Prettier, and the integration plugins are bundled with this package.

### Type-aware linting is slow

Use `eslint-config-expo-magic/fast` or `createConfig({ preset: 'fast' })` for syntax-focused checks. It resolves imports against `./tsconfig.json` by default and skips project services, compiler diagnostics, and import-cycle traversal.

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
