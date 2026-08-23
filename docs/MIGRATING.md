# Migration Guide

This guide covers the v4 adoption path and the supported Expo, React Native, and TypeScript upgrade lanes.

## From 3.x to 4.0.0

Version 4 changes the package's ownership and root defaults. Make the migration in this order:

1. Install the required peers and the new package.
2. Replace removed exports and opt into integrations explicitly.
3. Run the full lint and typecheck commands before enabling autofix in CI.

```bash
bun add --dev eslint@^10.9.0 eslint-config-expo-magic typescript@^6.0.3
```

ESLint and TypeScript are required peers. Expo and React are optional peers because an Expo application normally owns them. Formatting, testing, and feature-boundary packages are also optional peers; install them only when the matching option is enabled. Only `featureBoundaries` requires the optional `eslint-plugin-boundaries` peer; `reactCompiler`, `nativeUi`, and `storybook` do not require extra integration peers:

```bash
bun add --dev eslint-config-prettier eslint-plugin-prettier prettier
bun add --dev eslint-plugin-jest eslint-plugin-testing-library
bun add --dev eslint-plugin-boundaries
```

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
- Bun `>=1.4.0`; this repository uses `bun@1.4.0`
- ESLint `^10.9.0`
- TypeScript `>=5.9.3 <6.1.0`
- TypeScript ESLint `^8.67.0`

TypeScript 7 and the React Native/Jest preset 0.87 line remain intentional holds until the matching compatibility proof is available. Expo SDK 54 through 57 remain the supported smoke lanes, with SDK 57.0.15 coupled to React 19.2.3, React Native 0.86.2, React Test Renderer 19.2.3, `jest-expo` 57.0.4, and `@react-native/jest-preset` 0.86.2.

### v4 verification

```bash
bun install
bunx eslint .
bunx tsc --noEmit
```

If an optional integration is enabled, verify that its peer is installed in the consumer project. The package does not depend on package-manager auto-installation of optional peers.

## From `eslint-config-expo` to `eslint-config-expo-magic`

Use this path when an Expo app already uses the upstream flat config and wants the package's focused rules and guardrails.

### Before

```js
const expoConfig = require('eslint-config-expo/flat');

module.exports = [...expoConfig];
```

### After

```js
module.exports = require('eslint-config-expo-magic');
```

The package adds TypeScript, React, React Native, import organization, unused-import, app, and cycle rules. Deprecated-API, Reanimated, Worklets, and other hardening layers are available as explicit options or subpaths. Formatting and testing integrations are opt-in in v4.

For a gradual rollout, adopt the `base` preset first:

```js
const base = require('eslint-config-expo-magic/base');

module.exports = [...base];
```

## From `base` to default

The default preset adds the package's core TypeScript, React Native, import, and app rules while keeping formatting and testing disabled until selected.

```js
module.exports = require('eslint-config-expo-magic');
```

Typical new diagnostics include `import-x/order`, `unused-imports/no-unused-imports`, `no-console`, and `no-restricted-imports`. If the project wants formatting or test rules, install their optional peers and set `prettier: true` or `testing: true`.

## From default to `typed`

Use the typed preset when the project wants type-aware TypeScript ESLint checks:

```js
const typed = require('eslint-config-expo-magic/typed');

module.exports = [...typed];
```

Requirements:

- A reachable `tsconfig.json` or explicit `tsconfigProjects`
- A working type graph for the files being linted
- TypeScript `>=5.9.3 <6.1.0`

## From default to `strict`

Use strict after the codebase is stable:

```js
const { strict } = require('eslint-config-expo-magic');

module.exports = [...strict];
```

Strict mode makes `no-console` an error and enables selected TypeScript async and assertion rules.

## From local overrides to package options

Projects with local restricted-import, restricted-syntax, feature-boundary, Storybook, or PR guardrail logic can migrate one layer at a time:

```js
const { createConfig } = require('eslint-config-expo-magic');

module.exports = createConfig({
	appGuardrails: true,
	reactCompiler: true,
	worklets: true,
	nativeUi: true,
	featureBoundaries: true,
	storybook: true,
});
```

Enable `reactCompiler`, `nativeUi`, and `storybook` directly. Install `eslint-plugin-boundaries` before enabling `featureBoundaries`. Configure `allowFiles`, `additionalRestrictions`, `sharedComponentPatterns`, and `additionalSharedComponentPatterns` before enforcing project-shaped boundaries in CI.

## Expo SDK lanes

Version 4 validates SDK 54, 55, 56, and 57 through packed-consumer smoke lanes. The clean SDK57 consumer follows Expo Doctor's SDK 57.0.15 tuple: React 19.2.3, React Native 0.86.2, React Test Renderer 19.2.3, `jest-expo` 57.0.4, and `@react-native/jest-preset` 0.86.2. Keep the SDK and React Native versions coupled to the Expo lane; do not advertise an independent React Native 0.87 support line until Expo publishes a matching stable lane.

The repo keeps the fixture in the root Bun workspace. Use the root `bun.lock` and the packed-consumer smoke tests rather than a nested fixture lockfile.

## Upgrade checklist

1. Read the generated [configuration diff](CONFIG_DIFF.md).
2. Read [release notes](RELEASE_NOTES.next.md) for new or stricter rules.
3. Install required peers and only the optional integrations selected in the config.
4. Run the full lint and typecheck commands in CI before enabling autofix.
5. Use `base`, `fast`, or explicit `createConfig` options to stage adoption when a project needs a smaller first step.
