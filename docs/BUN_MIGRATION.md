# Bun-only migration (6.0)

Status: in progress, release held. Plan written against `4a91ed6`.

## Decision

The next major version drops ESLint, Prettier and every ESLint plugin package. Linting runs on `bun lint` with an oxlint-format config. Formatting runs on `bun fmt`.

The work happens on `main` in a separate, unpublished workspace package, `packages/bun-next` (`private: true`). The published `packages/eslint-config-expo-magic` (5.x) stays unchanged until release day, so the existing CI jobs keep running on stable Bun.

**Release gate:** a stable Bun release ships `bun lint`, and every golden test passes on that stable release. Bun 1.4.4 (2026-10-22) ships `bun fmt` only. On release day, `packages/bun-next` replaces `packages/eslint-config-expo-magic` and is published as `eslint-config-expo-magic@6.0.0`.

## Facts the design rests on (Bun canary, 2026-10-22)

| Fact                                                                                                                                                                                      | Consequence                                                                                                                                                                                      |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `oxlint.config.ts` can `export default createConfig({...})`, and Bun loads it without the `oxlint` package                                                                                | The `createConfig(options)` API stays. It returns an oxlint config object instead of a flat-config array.                                                                                        |
| In oxlint mode, the `typescript`, `react`, `react-hooks`, `import`, `jest`, `unicorn` plugins and `bun/format` run natively without packages                                              | ESLint, typescript-eslint, eslint-config-expo, the react, react-hooks, import-x, jest and prettier plugins, and Prettier itself are dropped.                                                     |
| A plugin left out of `plugins` silently disables its rules                                                                                                                                | The converter always emits `plugins`. The golden tests catch any rule that goes silent.                                                                                                          |
| oxlint mode enables the `correctness` category by default                                                                                                                                 | The config sets `categories: { correctness: "off" }`, so only the rules we configure run.                                                                                                        |
| `extends` replaces a rule's options instead of merging them                                                                                                                               | The package does not ship layer files to `extends`. `createConfig` composes in JavaScript and emits a single merged config.                                                                      |
| `jsPlugins` accepts absolute paths and `{ name, specifier }`                                                                                                                              | Local rules load from the package directory under their original prefixes.                                                                                                                       |
| `import/resolver.node.extensions` resolves `.ios.tsx` / `.android.tsx`                                                                                                                    | React Native platform files keep resolving.                                                                                                                                                      |
| `eslint-plugin-expo`, `react-native`, `react-19-upgrade`, `testing-library`, `unused-imports` and `boundaries` all peer-depend on `eslint`, and some also need `@typescript-eslint/utils` | These 23 rules are ported into local JavaScript rules (all MIT, with attribution) or replaced by native rules. Their rule IDs stay the same, so existing `eslint-disable` comments keep working. |

## Architecture

```
createConfig(options)                      packages/bun-next/utils/create-config.js
  └─ composes layers (same order and options as 5.x)
       └─ flat-style entries with rule data only (no plugin objects)
  └─ toOxlintConfig(entries)               packages/bun-next/utils/to-oxlint.js
       ├─ base rules + overrides[{ files, excludeFiles, rules, globals }]
       ├─ rule-name map: @typescript-eslint/* → typescript/*, import-x/* → import/*
       ├─ plugins + categories + settings + globals + ignorePatterns
       └─ jsPlugins: local rules under original prefixes
consumer oxlint.config.ts → export default createConfig({...}) → bun lint
consumer bunfig.toml [fmt] or the package .prettierrc.js → bun fmt
```

External presets (the eslint-config-expo, typescript-eslint and react-hooks recommended rule tables) are snapshotted once into `utils/external-rules.json` by `scripts/snapshot-external-rules.js`, so the package needs no runtime dependency on them.

## Tests first (golden master from 5.5.0)

All golden data comes from the current package running on ESLint and Prettier, and is committed before any implementation:

| Test              | Source of truth                                                                                   | Pass condition                                                                                                |
| ----------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Findings          | `eslint -f json` on `test-project` for each profile in `test-project/bun-golden/profiles.js`      | `bun lint` reports the same `file:line:col rule severity` set, apart from entries in `known-divergences.json` |
| Autofix           | `eslint --fix-dry-run` output for each fixable file and profile                                   | `bun lint --fix-dry-run` produces byte-identical output                                                       |
| Format            | `prettier --check` file list and `prettier` output for each file                                  | `bun fmt --check` gives the same file list and the same output                                                |
| Consumer contract | packed `bun-next` in a temporary consumer project with no `eslint`, `prettier` or plugin packages | `bun lint` and `bun fmt` run, report the expected findings, and exit with the expected codes                  |
| Local rules       | existing RuleTester cases in `utils/plugin/rules/*.test.ts`                                       | the same cases pass through `bun lint` fixtures                                                               |

## Benchmarks

`scripts/bench-lint-format.js` runs each command at least 10 times after a warm-up, on the same machine, and reports the median wall time and peak RSS for:

- ESLint 10 + Prettier 3.9 (5.5.0)
- `bun lint` + `bun fmt` (6.0)

It covers `test-project`, with and without type-aware rules. The results go in `docs/BENCHMARKS.md`.

## Phases

1. Golden data and RED test harness (`test-project/bun-golden/`, `scripts/lib/bun-golden.test.js`).
2. Snapshot of the external rules, plus the `toOxlintConfig` converter with unit tests.
3. `packages/bun-next` `createConfig` for the default profile; the findings golden passes.
4. Port the 23 JavaScript-only rules; the findings and autofix goldens pass for every profile.
5. Format golden and consumer contract.
6. Benchmarks.
7. Release day (gated): swap the packages, bump to 6.0.0, update the CHANGELOG, README, MIGRATING and generated reports, then `release:check`.

## Status (2026-10-22, Bun canary 1.4.4-canary.1+963452075)

Phases 1–4 are done. `packages/bun-next` builds every profile with no npm package at runtime: the external preset tables are snapshotted in `utils/external-config.json` (`bun run snapshot:external`), and the 25 rules that needed ESLint plugin packages are dependency-free ports in `packages/bun-next/rules/` (expo, react-native, react-19-upgrade, testing-library, unused-imports, boundaries). Each port has differential tests that run the original plugin and the port side by side through ESLint and require identical messages, positions and fixes. `packages/bun-next/create-config.test.js` proves that `createConfig` and `createMobileAppConfig` deep-equal the 5.x config converted by `toOxlintConfig` for every profile.

`bun run golden:bun` lints `test-project` with the `bun-next` config for every profile on the latest Bun canary:

| Profile        | Rules matched in files | Findings     | Autofix |
| -------------- | ---------------------- | ------------ | ------- |
| default        | 228                    | ok           | ok      |
| fast           | 189                    | ok           | ok      |
| base           | 57                     | ok           | ok      |
| strict         | 230                    | ok           | ok      |
| typed          | 286                    | ok           | ok      |
| testing        | 276                    | ok           | ok      |
| agent          | 254                    | ok           | ok      |
| react-compiler | 229                    | ok           | ok      |
| full           | 373                    | ok           | ok      |
| mobile-app     | —                      | blocked (B1) | —       |

The findings gate is that each rule fires in each file where 5.x fires it, and nowhere else. oxlint's rule implementations report some rules on another node or a different number of times (for example `import/no-duplicates` once per module), so per-finding counts and positions are informational (`--verbose`).

The autofix gate runs `bun lint --fix` repeatedly until nothing changes (ESLint repeats up to 10 passes; `bun lint --fix` applies one) and requires each fixed file to match ESLint's output byte for byte. Reviewed exceptions for both gates live in `test-project/bun-golden/divergences.json`, and the run fails when one stops occurring.

### Blockers and upstream report candidates

- **B1:** Bun's oxlint config parser rejects the `id-match` pattern `^(?!handle[A-Z])` used by the mobile-app profile ("look-around is not supported"), although Bun documents rule-option patterns as JavaScript regular expressions.
- `bun lint --fix` applies one pass; ESLint repeats until no fix applies.
- oxlint's `no-var` fix rewrites redeclared `var`s to duplicate `const`s, which TypeScript rejects.
- oxlint applies fixes that ESLint offers only as suggestions (`use-isnan`, `no-unsafe-negation`, `@ts-ignore` → `@ts-expect-error`).
- `jest/no-mocks-import` misses a relative `__mocks__` import.

### Consumer-facing changes found so far

- Code that TypeScript rejects (duplicate declarations, `with` in a module, duplicate parameters or exports) is now a parse error, and Bun lints nothing else in that file. The fixtures for those rules moved to `test-project/invalid-syntax/`.
- Type-aware rules use Bun's type checker, which behaves like TypeScript 7: `compilerOptions.baseUrl` is an error. Write `paths` targets relative to the tsconfig instead (`"@/*": ["./*"]`).
- Bun treats `import React` as used in JSX files, and `bun:test` as a built-in module.

## Out of scope until release day

Version bumps, `CHANGELOG.md`, `docs/CONFIG_DIFF.md`, `docs/config-diff.json`, `docs/RELEASE_NOTES.next.md`, and any change to the published 5.x package.
