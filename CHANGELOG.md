# Changelog

All notable, consumer-facing changes to `eslint-config-expo-magic` are documented here. This project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html). Releases prior to `2.7.0` are recorded in the [GitHub releases](https://github.com/JoaoPauloCMarra/eslint-config-expo-magic/releases).

## 4.0.0

Released: 2026-08-23

### Breaking Changes

- The root preset is now lightweight: Prettier and Jest/Testing Library rules are disabled by default. Enable the optional integrations with `createConfig({ prettier: true, testing: true })` after installing their peers.
- The `no-prettier` export and subpath, plus the `strictNoPrettier` and `typedNoPrettier` aliases, were removed. The v4 root default now provides the formatter-free behavior without a separate export.
- Root-level `createFeatureBoundaryConfig` and `featureBoundaries` named exports were removed. Use `eslint-config-expo-magic/feature-boundaries` or `createConfig({ featureBoundaries: true })` instead.
- ESLint and TypeScript are required peer dependencies. Expo, React, formatting, testing, and feature-boundary integrations are optional peers and are not auto-installed by the package.
- Node.js support is `^20.19.0 || ^22.13.0 || >=24`; the repository requires Bun `>=1.4.0` and uses `bun@1.4.0`.

### Added

- Adds explicit package-export and manifest tests for required versus optional peer ownership and minimal packed consumers.
- Adds an executable `expo-magic-init-agent` bin that generates the v4 agent configuration without redundant formatter options.
- Migrates feature-boundary configuration to the supported eslint-plugin-boundaries v7 `policies` and nested selector API.

### Changed

- Updates the compatible lint stack to ESLint 10.9.0, TypeScript ESLint 8.67.0, eslint-plugin-boundaries 7.2.0, eslint-plugin-jest 29.16.1, globals 17.11.0, Expo SDK 57 fixtures 57.0.15/57.0.4, React 19.2.3, React Native 0.86.2, and Jest typings 30.0.0.
- Keeps TypeScript 6.0.3, the SDK57 React Native/Jest preset pair at 0.86.2, and the SDK 54–57 smoke lanes until the next compatible major lines are proven.
- Keeps nanoid at 3.3.18 or newer through the workspace dependency graph without overriding Metro's supported image-size range.
- Synchronizes the root and packed READMEs, migration/recipe guidance, generated configuration report, release notes, and CI/release Bun version.

### Compatibility

- Expo SDK 54 / 55 / 56 / 57, Expo-coupled React Native 0.81 / 0.83 / 0.85 / 0.86 lanes, React 19.1–19.2, ESLint 10.9, and TypeScript `>=5.9.3 <6.1.0`.

## 3.0.2

Improves lint startup time and strengthens the published configuration API.

### Breaking Changes

- None.

### Added

- Adds the `fast` preset (`eslint-config-expo-magic/fast` and `createConfig({ preset: 'fast' })`) for syntax-focused linting without TypeScript project services, type-aware rules, React Compiler diagnostics, or import-cycle traversal.
- Adds the `importCycles` option to enable or disable `import-x/no-cycle` in factory-created configurations.
- Adds matching CommonJS, ESM, and TypeScript entry points for the fast preset.

### Changed

- Lazily constructs named root presets so importing the package does not assemble every preset eagerly.
- Keeps the default preset's monorepo-aware TypeScript project discovery and uses `./tsconfig.json` by default for the fast preset.
- Expands public TypeScript declarations and compile-time coverage for the fast preset and factory options.

## 3.0.1

Improves the published package surface and editor guidance after the 3.0.0 configuration hardening release.

### Breaking Changes

- None.

### Fixed

- Keeps the runtime configuration assembly aligned across the CommonJS, ESM, and TypeScript package entry points.
- Publishes shared declarations for the root and focused exports, including PR guardrail input, result, preset, and React Compiler rule contracts.
- Extends feature-boundary classification to file-category metadata and covers MTS, CTS, declaration, and test module variants.

### Changed

- Updates the bundled TypeScript ESLint packages from 8.65 to 8.66.
- Expands package validation for published files, dependency boundaries, and packed consumers across the supported Expo SDK lanes.

### Documentation

- Synchronizes the root and packed READMEs, compatibility guidance, generated config reports, and release metadata with the current package surface.

### Compatibility

- Node.js `>=18.0.0`, ESLint `10.x`, TypeScript `>=5.9.3 <6.1.0`, React `19.1` or `19.2`, and React Test Renderer `19.1` or `19.2`.
- Expo SDK `54`, `55`, `56`, and `57`, with Expo-coupled React Native `0.81`, `0.83`, `0.85`, and `0.86` validation lanes.

## 3.0.0

Corrects rule ownership and scoped composition across agent, Reanimated, component, TypeScript, and module configurations.

### Breaking Changes

- Agent-preset rules now take precedence over overlapping app guardrails. Agent users receive the stricter 10-character TypeScript suppression-description requirement, agent-specific warning-comment policy, and one authoritative overlap diagnostic.
- `semanticColors.allowFiles` now disables only semantic-color selectors for matching files. `nativeUi.allowFiles` relaxes only native-UI wrapper restrictions and preserves unrelated baseline import restrictions such as the `SafeAreaView` ban.
- Reanimated SharedValue diagnostics now use the provenance-aware `expo-magic-reanimated/no-shared-value-misuse` rule instead of broad `no-restricted-syntax` selectors. The rule follows Reanimated imports, aliases, namespace access, typed bindings, and variable aliases while ignoring lookalikes and shadowed functions.
- `expo-magic/require-children-usage` now evaluates every uppercase function component independently. A `children` reference in another component, object, or spread no longer satisfies the component being checked.
- Selector composition and test guardrails now include `.mts`, `.cts`, `.d.mts`, `.d.cts`, and `.test` / `.spec` MTS and CTS files. Repositories using these module forms may receive new diagnostics.
- Agent mode now respects explicit top-level hardening options when the matching nested `agent` option is absent. Nested agent options still take precedence.

### Changed

- `@typescript-eslint/no-unused-vars` now exclusively owns unused-binding diagnostics in TypeScript files; core `no-unused-vars` remains enabled for JavaScript.
- CommonJS, ESM, and TypeScript declarations now expose matching public helpers across agent and app guardrails, native UI, PR guardrails, React Compiler, Reanimated, and Worklets.
- `inlineStyles` now uses ESLint's public `RuleSeverity` type.
- Updates the bundled consumer lint stack to ESLint 10.8, TypeScript ESLint 8.65, `eslint-plugin-boundaries` 7.1, `eslint-plugin-jest` 29.16, and Prettier 3.9.6.
- Updates the Expo SDK 57 validation lane from 57.0.4 to 57.0.8.

### Migration

- Run ESLint across the repository after upgrading and resolve newly authoritative agent-preset diagnostics.
- If an allowed semantic-color or native-UI file previously depended on an unrelated restriction being removed, add an explicit local override for that restriction.
- Replace SharedValue suppressions for `no-restricted-syntax` with `expo-magic-reanimated/no-shared-value-misuse`.
- Manual Reanimated compositions should use `createReanimatedConfig` or `createSharedValueUsageConfig`; `createRestrictedSyntaxGroups` now covers gesture selectors only.
- Fix each component that declares but does not use `children`; usage in a sibling component no longer suppresses the report.
- Remove local core `no-unused-vars` duplication for TypeScript and keep TypeScript-specific options on `@typescript-eslint/no-unused-vars`.
- Review `.mts`, `.cts`, declaration-module, and MTS/CTS test files for newly in-scope diagnostics.
- Remove conflicting duplicate agent options or keep the intended value inside the `agent` options object.

### Compatibility

- Expo SDK 54 / 55 / 56 / 57, Expo-coupled React Native 0.81 / 0.83 / 0.85 / 0.86 lanes, React 19.1-19.2, ESLint 10, and TypeScript `>=5.9.3 <6.1`.

## 2.8.0

Adds Expo SDK 57 validation and refreshes the bundled lint stack.

### Breaking Changes

- None.

### Added

- Adds an `agent` preset (`createConfig({ agent: true })` / `eslint-config-expo-magic/agent`) for AI-agent-heavy Expo projects.
- Adds an `agent-guardrails` subpath with focused checks for unsafe suppressions, type weakening, skipped tests, snapshot churn, generated attribution strings, empty catches, and unhandled promises.
- Adds the `agentMobileApp` PR guardrails preset and `expo-magic-init-agent` setup command.
- Adds `docs/AGENTS_RECIPE.md` with copy-paste agent setup, recommended scripts, and PR guardrails config.

### Changed

- Updates the Expo baseline to `eslint-config-expo@57.0.0`.
- Validates the full fixture app on Expo SDK 57.0.4, React Native 0.86.0, and React 19.2.3.
- Keeps packed-consumer smoke coverage for Expo SDK 54.0.33, 55.0.9, 56.0.9, and 57.0.4.
- Adds a clean SDK 57 consumer smoke gate that runs Expo Doctor and ESLint outside the monorepo.
- Updates ESLint, TypeScript ESLint, React Hooks, React 19 upgrade, import, Jest, Prettier, and boundary-rule dependencies to current compatible releases.
- Removes the stale nested `test-project/bun.lock`; the fixture now relies on the root workspace lockfile.

### Compatibility

- Expo SDK 54 / 55 / 56 / 57, React Native 0.86 for the full fixture lane, React 19.1-19.2, ESLint 10, TypeScript `>=5.9.3 <6.1`.

## 2.7.0

Adds opt-in hardening layers distilled from production Expo/React Native usage. The `default`, `strict`, `typed`, and `no-prettier` presets are unchanged, so upgrading is backward compatible unless you opt into the new layers.

### Breaking Changes

- None.

### Added

- **`reanimated` layer** (`createConfig({ reanimated: true })` / `eslint-config-expo-magic/reanimated`) — flags reading shared values in `useSharedValue(...)` initializers, `.get()` inside `useAnimatedStyle`/`useAnimatedReaction`/`useDerivedValue`/`useAnimatedProps` worklet hooks, and inline gesture config passed to RNGH gesture hooks. Configure gesture hook names with `gestureHooks` / `additionalGestureHooks`.
- **`deprecatedApis` layer** (`createConfig({ deprecatedApis: true })` / `eslint-config-expo-magic/deprecated-apis`) — flags `MutableRefObject` (removed from React 19 typings), `StyleSheet.absoluteFillObject`, and `AccessibilityInfo.setAccessibilityFocus`, with their modern replacements.
- **`componentStructure` layer** (`createConfig({ componentStructure: true })` / `eslint-config-expo-magic/component-structure`) — a bundled `expo-magic` plugin with four rules: `props-type-order`, `default-export-placement`, `no-inline-props`, and `require-children-usage`. Configure the prop-type matcher with `propsTypePattern`.
- **`semanticColors` layer** (`createConfig({ semanticColors: true })` / `eslint-config-expo-magic/semantic-colors`) — flags raw color literals (`#rrggbb`, `rgba()`, `hsla()`) and direct color-token access. Configure `tokenModule`, `importName`, `flagDirectAccess`, and `allowFiles`.
- **`inlineStyles` option** (`createConfig({ inlineStyles: true })`) — enables `react-native/no-inline-styles` (`warn` by default; accepts any severity).
- **Configurable `appGuardrails`** — `createConfig({ appGuardrails: { queryHookPattern } })` to match your own query-hook naming.
- **Config factories** — `createAppGuardrailsConfig`, `createComponentStructureConfig`, `createDeprecatedApiConfig`, `createReanimatedConfig`, and `createSemanticColorsConfig` for manual composition.
- **Exported TypeScript types** — `CreateConfigOptions` and every layer's option type are now importable, giving editors and AI tooling accurate autocomplete and misuse detection.

### Changed

- **`reactCompiler` layer** now promotes the React Compiler diagnostics shipped in `eslint-plugin-react-hooks` v7 (`unsupported-syntax`, `incompatible-library`, `immutability`, `purity`, `preserve-manual-memoization`, `set-state-in-render`, `static-components`) to `error`. This replaces the previous `no-restricted-syntax` heuristics, which falsely flagged optional chaining and `throw` inside any `try` block. The `eslint-config-expo-magic/react-compiler` subpath now exposes `rules` instead of `restrictedSyntaxGroups`.
- Selector-based hardening layers (`appGuardrails`, `reanimated`, `worklets`, `semanticColors`) are merged into a single `no-restricted-syntax` configuration per file group, so enabling several layers together no longer overrides one another.

### Compatibility

- Expo SDK 54 / 55 / 56, React Native 0.85, React 19.1–19.2, ESLint 10, TypeScript `>=5.9.3 <7`.
