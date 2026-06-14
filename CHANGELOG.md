# Changelog

All notable, consumer-facing changes to `eslint-config-expo-magic` are documented here. This project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html). Releases prior to `2.7.0` are recorded in the [GitHub releases](https://github.com/JoaoPauloCMarra/eslint-config-expo-magic/releases).

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
