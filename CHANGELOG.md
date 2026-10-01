# Changelog

All notable, consumer-facing changes to `eslint-config-expo-magic` are documented here. This project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html). Releases prior to `2.7.0` are recorded in the [GitHub releases](https://github.com/JoaoPauloCMarra/eslint-config-expo-magic/releases).

## 5.2.3

### Breaking Changes

- None. Public options, exports, dependency ranges and rule severity are unchanged. Corrected unused-children warnings can affect warning budgets or consumers overriding the rule severity.

### Fixed

- Follow read-only `const` identity chains for children props within component scopes, removing false unused-children warnings for member reads, destructuring and supported forwarding patterns.
- Guard additional alias expansion against reassignment, property mutation, nested alias creation and unknown escapes, including TypeScript-wrapped calls and tagged methods. This remains conservative syntactic analysis rather than general dataflow tracking.
- Stop treating unrelated destructured properties, rest bindings known to exclude children, and write-only member access as evidence that caller children are used. Preserve rest forwarding through known non-children literal keys.

### Validation

- Add 42 focused cases and compare them against 5.2.0, 5.2.1 and 5.2.2; the candidate corrects 17 outcomes without regressions in that sample. Full release validation remains required before publication.

## 5.2.2

### Breaking Changes

- None. Public options, exports, dependency ranges and rule severity are unchanged. Corrected unused-children warnings may affect consumers using warning budgets or overriding the rule severity.

### Fixed

- Resolve qualified same-file children types through their namespace instead of borrowing an unrelated outer type with the same terminal name. This removes false warnings and restores warnings missed by 5.2.1.
- Follow exported members across nested, dotted and merged namespace declarations, including local namespace aliases, while preserving private-member and lexical shadowing boundaries.
- Recognize renamed React `PropsWithChildren` imports and React import-equals helpers without treating unrelated local or external types as React helpers.

### Validation

- Add 53 focused children-usage regression cases covering namespace visibility, declaration merging, alias cycles, helper imports and shadowing. Full release validation is required before publication.

## 5.2.1

Released: 2026-10-01

### Breaking Changes

- None. Existing restrictions now report cases previously missed: raw colors in test files, alias paths crossing feature boundaries, and unused caller children hidden by shadowing. Public options, exports, and dependency ranges are unchanged.

### Fixed

- Correct npm command guidance to use the existing explicit package-owned launchers. Generic bins can belong to other dependencies; launcher dispatch itself was correct. The initializer uses the deterministic command for a missing lint script and preserves existing scripts.
- Preserve semantic-color restrictions when app or agent test-only guardrails are composed.
- Normalize aliased import paths before applying same-feature and contracts exceptions, including traversal above the alias root.
- Resolve children props, destructuring, and local type declarations in their lexical scopes. Rendered block-local children no longer receive a false warning, and unrelated shadowed props/types no longer hide unused children.

### Validation

- Cover every pair of boolean configuration switches in both states for all three presets across JavaScript, JSX, TypeScript, TSX, MTS and CTS fixtures.
- Check ignore/story precedence, representative autofix idempotence and runtime preservation, and non-fixable component diagnostics.
- Require packed entrypoints and exact package-owned ESLint/Prettier launcher versions in Bun and explicit npm scripts, with bounded subprocesses and cleanup tests.
- Check generated release reports against the candidate commit during CI before merging, with a stable previous-version baseline after publication.

## 5.2.0

Released: 2026-09-30

### Breaking Changes

- None. Several fixes make existing rules apply where the documentation already said they did, so code that passed 5.1.2 can report new errors. The cases are listed under **Fixed** and marked _(new reports)_.

### Added

- `createArchitectureConfig({ baseConfig, nativeUi })`: pass the config you spread before the architecture blocks, and the architecture blocks restate its `no-restricted-imports` and `no-restricted-syntax` entries instead of replacing them.
- `createMobileAppConfig({ additionalNativeUiWrapperFiles })` lists extra files that may import the raw primitives they wrap.
- `expo-magic` plugin `meta.version` reports the package version.
- `pr-guardrails` helpers accept optional dependency arguments for testing (`readPullRequestInputFromEnv`, `runCli`, `readCliOptionsFromEnv`, `mentionsRuntimeTarget`, `hasRelatedTestOrStory`).

### Fixed

- **Option combinations that crashed ESLint now load:** `typeChecked` with `preset: 'fast'` or custom `tsconfigProjects` (fatal "Enabling project does nothing when projectService is enabled"), `preset: 'base'` with `reactCompiler` or `agent` (missing `react-hooks` plugin), and `preset: 'base'` with `strict` (type-aware rules without type information).
- **Test-only guardrails stay in test files.** With `agent` or `appGuardrails`, `.only(`, `.skip(` and `toMatchSnapshot()` were reported in application code such as `query.skip(10)`.
- `semanticColors.allowFiles` works when semantic colors is the only `no-restricted-syntax` layer; the token file was still reported. `createAllowConfig()` now returns the allow block instead of an empty array.
- `typeChecked` (and the `typed` preset) no longer overrides the package's own TypeScript rule levels: `prefer-nullish-coalescing` stays off, and `array-type`, `consistent-type-assertions`, `no-empty-object-type`, `no-wrapper-object-types`, `no-extra-non-null-assertion` and `prefer-optional-chain` stay at `warn` instead of `error`.
- An explicit top-level option now wins over the same key in `agent: { … }`, as documented.
- `testing`, `importCycles` and `inlineStyles` now apply under `preset: 'base'`.
- `tsconfigProjects` reaches the parser as `parserOptions.project` when `typeChecked` is set. Without `typeChecked` the parser keeps `projectService`, as before.
- The configured TypeScript import resolver options are kept; the import-x plugin's `{ typescript: true }` replaced them.
- `nativeUi: { restrictions }` keeps the base `SafeAreaView` ban, and an empty list no longer turns the rule off.
- Jest rules apply to `.test`/`.spec` files with `.mts` and `.cts` extensions _(new reports)_.
- Standalone focused configs (`agent-guardrails`, `reanimated`, `semantic-colors`, `worklets`) compose their own selectors; `agent-guardrails` alone no longer drops its source selectors on test files _(new reports)_.
- **`createArchitectureConfig()`** _(new reports)_:
  - `.tsx`/`.jsx` views keep the HTTP, route and layer-direction bans, and barrels and `domain/`/`application/` trees are banned in `.tsx` too.
  - Layer direction honours `aliasPrefix` and also checks relative specifiers; `aliasPrefix` is in the typings.
  - Wrapper files may import the primitives they wrap under `nativeUi: true`, and keep the layer bans.
  - `nativeUi.additionalRestrictions` is honoured. `tokenModule` is the colour module path, as in `semanticColors`, and now defaults to `uikit/tokens/colors`; the directory form (`layers.tokens`) resolves to its `colors` module. Importing the colour map from `@/uikit/tokens/colors` in `src/` is now reported.
  - With `baseConfig`, restated restrictions are reported as errors inside `src/`, and wrapper and test files keep every non-primitive ban.
  - A single `.map` in a view is no longer reported; only chains are. Flat `use-*` hook files count as feature hooks for "views receive props".
  - Test files keep the `SafeAreaView` ban.
- **`mobile-app`** _(new reports)_: wrapper files keep the `SafeAreaView`, UI-kit and `useRouter` bans; ignores match nested app roots; `types/` is default-disallow; storage bans cover `uikit/`, `utils/` and `modules/`; `.js`/`.jsx` files are covered. `preset: 'base'` is rejected with a clear error.
- `feature-boundaries` `recommended` includes the import resolver settings that `createConfig({ featureBoundaries: true })` adds.
- **Plugin rules:**
  - `no-cross-feature-imports` no longer reports relative imports through a non-`src` folder named `features`.
  - `require-children-usage` follows `interface … extends` (including `PropsWithChildren`) _(new reports)_, and accepts children forwarded through `...rest` or `cloneElement(el, props)`.
  - `no-inline-props` checks destructured and defaulted component props _(new reports)_.
  - `props-type-order` checks interfaces and method signatures _(new reports)_.
  - `default-export-placement` allows `Foo.displayName = …` before `export default Foo`.
  - `kebab-case-filenames` ignores Expo Router names (`+not-found`, `[id]`, `[...slug]`, `(tabs)`) by default.
- **`expo-magic-init --write`** keeps existing setups: it skips writing when any `eslint.config.*` or Prettier config exists, writes `eslint.config.cjs` in ESM packages, keeps `package.json` indentation, and stops when there is no `package.json`.
- The `eslint` and `prettier` launchers re-raise a child's termination signal.
- **PR guardrails:** unchecked template lines no longer count as runtime evidence; targeted `eslint-disable-next-line <rule>` is not a broad ignore; `ignoredRiskyFilePatterns` match file paths; `mobileApp` patterns cover `src/`; "nearby" tests and stories are checked per changed screen or component; the CLI handles shallow checkouts and API errors and prints one error line instead of a stack trace.

### Changed

- The Expo SDK 57 fixture uses Expo 57.0.26, and the smoke lanes read the SDK 57 versions from `test-project/package.json`.
- The published package no longer has a `check-pm` script. It pointed at a file the package never shipped.
- The repository lockfile patches `brace-expansion` (GHSA-qhr7-859c-m2p7, GHSA-6j4f-fj2g-mc7p, GHSA-q2hr-2g5m-vwhr). Consumers resolve their own dependency tree.

### Compatibility

- Expo SDK 54 / 55 / 56 / 57, React 19.1–19.2, ESLint 10.10, and TypeScript `>=5.9.3 <6.1.0`. Unchanged from 5.1.2.

## 5.1.2

Released: 2026-09-14

### Breaking Changes

- None.

### Fixed

- `createArchitectureConfig()` banned native-library imports inside `src/services/native/`, the directory its own message points callers to. The owned native wrapper directory is now always exempt, in addition to any `nativeWrappers` the caller passes.

## 5.1.1

Released: 2026-09-14

### Breaking Changes

- None.

### Fixed

- `createArchitectureConfig()` matched only `.ts`/`.tsx`, so a type-stripped JavaScript application silently lost every layer rule: cross-feature isolation, barrels, kebab-case file names, the `globalThis` bypasses, and the HTTP ban all stopped matching. Layer globs now cover `.js`/`.jsx` as well. A TypeScript application has no `.js` under `src`, so matching both changes nothing there.

## 5.1.0

Released: 2026-09-14

### Breaking Changes

- None. `createArchitectureConfig()` is a new opt-in subpath export; existing presets and focused configurations are unchanged.

### Added

- `eslint-config-expo-magic/architecture` exports `createArchitectureConfig()`, which enforces a layered `src/` application (routes, features, services, UI) on top of any preset. Layer names are explicit, so a project that calls its route host `core` and its UI layer `shared` passes those names instead of a lane enum.
- `expo-magic/no-cross-feature-imports` restricts cross-feature access to `contracts/`. It compares the feature segment of the importing file with the feature segment of the specifier, so it works on flat feature folders and needs no import resolver.
- `expo-magic/kebab-case-filenames` requires lowercase kebab-case file names, ignoring extensions and router prefixes such as `+not-found` and `[id]`.
- Views and routes are kept out of the data layer: `@/services/query/**` and `@/services/client-state/**` are not importable from `.tsx`, and `*-view` files and feature components may not import a feature hook. Together with the `importCycles` option this covers the layer-direction and cycle checks that usually need a separate dependency-graph tool.

### Fixed

- Layer configurations composed by `createArchitectureConfig()` re-state the semantic-colour selectors and native-UI restriction paths they extend. ESLint flat config replaces rule options when a later entry supplies them, so a layer block that declared only its own `no-restricted-imports` or `no-restricted-syntax` silently disabled the owned-primitive ban and the raw-colour ban for every file it matched. Applications that hand-wrote per-layer blocks were losing both in exactly the layers that matter.
- `globalThis.fetch`, `globalThis.console` and their `global` / `window` / `self` forms are now caught. `no-restricted-globals` and `no-console` are scope-analysis rules and never saw the member-expression form.
- Barrel files are matched at any depth. The previous single-segment glob missed nested barrels such as `features/<name>/hooks/index.ts`.

## 5.0.0

Released: 2026-09-07

### Breaking Changes

- ESLint, Prettier, their shared configs, and integration plugins are package dependencies instead of consumer peer dependencies. Consumers can remove direct copies and use the package-owned executable shims.
- The initializer now targets the opinionated mobile-app profile and shared Prettier config. The previous `expo-magic-init-agent` command remains available as an alias.

### Added

- Adds `eslint-config-expo-magic/mobile-app`, an opinionated profile with formatting, semantic-color, native-UI, feature-architecture, persistence, naming, and focused console policies.
- Adds `createMobileAppConfig` and `createMobileAppRestrictedImportsConfig` for small application-specific extensions.
- Adds the public `eslint-config-expo-magic/prettier` configuration and the shorter `expo-magic-init` command.
- Adds package-owned `eslint` and `prettier` executable shims and packed-consumer coverage for the complete setup.

### Changed

- Updates ESLint to 10.10.0, TypeScript ESLint to 8.69.0, `eslint-config-expo` to 57.0.2, Jest to 30.5.1, and related compatible dependencies.
- Keeps the generic root and fast profiles lightweight while making production mobile-app adoption one import.

### Compatibility

- Expo SDK 54 / 55 / 56 / 57, React 19.1–19.2, ESLint 10.10, and TypeScript `>=5.9.3 <6.1.0`.

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
