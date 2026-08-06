# Changelog

All notable, consumer-facing changes to `eslint-config-expo-magic` are documented here. This project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html). Releases prior to `2.7.0` are recorded in the [GitHub releases](https://github.com/JoaoPauloCMarra/eslint-config-expo-magic/releases).

## 3.0.0

Adds a type-safe configuration factory, focused Expo and React Native hardening layers, and consistent CommonJS, ESM, and TypeScript package surfaces.

### Breaking Changes

- The default, strict, typed, and no-Prettier presets now enable app guardrails, deprecated API checks, React Compiler diagnostics, Reanimated checks, and Worklets checks. Set each option to `false` to preserve a lighter configuration.
- Agent-preset rules now take precedence over overlapping app guardrails. Agent users receive stricter suppression and warning-comment checks plus one authoritative overlap diagnostic.
- `semanticColors.allowFiles` now disables only semantic-color selectors for matching files. `nativeUi.allowFiles` relaxes only native-UI wrapper restrictions and preserves unrelated baseline import restrictions.
- Reanimated SharedValue diagnostics now use `expo-magic-reanimated/no-shared-value-misuse` instead of broad `no-restricted-syntax` selectors. Existing suppressions for the old rule must be migrated.
- `expo-magic/require-children-usage` evaluates every uppercase function component independently. A `children` reference in another component no longer satisfies the component being checked.
- Selector composition and test guardrails now include `.mts`, `.cts`, `.d.mts`, `.d.cts`, and MTS/CTS `.test` and `.spec` files. These files may receive new diagnostics.
- TypeScript unused bindings are owned by `@typescript-eslint/no-unused-vars`; remove conflicting local core-rule configuration for TypeScript files.

### Added

- `createConfig(options)` for composing base, default, typed, strict, agent, testing, formatting, and focused hardening layers.
- Public option types for the root factory and focused layers, including PR guardrail input, output, preset, and risky-pattern types.
- Matching CommonJS, ESM, and TypeScript declarations for the package root and every declared subpath.
- `featureBoundaries`, native UI, deprecated API, component structure, React Compiler, Reanimated, semantic colors, Worklets, Storybook, and agent guardrail entry points and factories.
- `expo-magic-init-agent` and `expo-magic-pr-guardrails` consumer CLI commands.

### Migration

- Run ESLint across the repository and resolve newly enabled hardening diagnostics.
- Set `appGuardrails`, `deprecatedApis`, `reactCompiler`, `reanimated`, or `worklets` to `false` when adopting the factory incrementally.
- Replace SharedValue suppressions for the old `no-restricted-syntax` diagnostic with `expo-magic-reanimated/no-shared-value-misuse`.
- Use `createReanimatedConfig` or `createSharedValueUsageConfig` for manual Reanimated composition.
- Add explicit local overrides when a file needs to opt out of restrictions beyond `semanticColors.allowFiles` or `nativeUi.allowFiles`.
- Fix components that declare but do not use `children`, and review new `.mts`, `.cts`, declaration-module, and MTS/CTS test findings.
- Keep agent-specific values inside the nested `agent` option when both top-level and nested values are present; nested values take precedence.

### Compatibility

- Node.js `>=18.0.0`, ESLint `10.x`, TypeScript `>=5.9.3 <6.1.0`, React `19.1` or `19.2`, and React Test Renderer `19.1` or `19.2`.
- Expo SDK `54`, `55`, `56`, and `57`, with Expo-coupled React Native `0.81`, `0.83`, `0.85`, and `0.86` validation lanes.
- The package bundles its ESLint, TypeScript ESLint, import, Jest, Prettier, React, React Native, Expo, and boundary-rule runtime dependencies. Expo, React, React Test Renderer, and TypeScript remain peer requirements.

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
