# Changelog

All notable, consumer-facing changes to `eslint-config-expo-magic` are documented here. This project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html). Releases prior to `2.7.0` are recorded in the [GitHub releases](https://github.com/JoaoPauloCMarra/eslint-config-expo-magic/releases).

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
