# Bun-only migration (6.0)

Status: swapped on `main` as `6.0.0-next.0`, release held. Plan written against `4a91ed6`.

## Decision

The next major version drops ESLint, Prettier and every ESLint plugin package. Linting runs on `bun lint` with an oxlint-format config. Formatting runs on `bun fmt`.

The Bun-only package was built next to 5.x as `packages/bun-next` and replaced `packages/eslint-config-expo-magic` on `main` as `6.0.0-next.0` (`private: true`). The release workflow skips prerelease versions, so nothing is published or tagged. 5.5.0 stays the published version.

**Release gate:** a stable Bun release ships `bun lint`, and every golden test passes on that stable release. Bun 1.4.4 (2026-10-22) ships `bun fmt` only. On release day the package is published as `eslint-config-expo-magic@6.0.0`.

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
createConfig(options)                      packages/eslint-config-expo-magic/utils/create-config.js
  └─ composes layers (same order and options as 5.x)
       └─ flat-style entries with rule data only (no plugin objects)
  └─ toOxlintConfig(entries)               packages/eslint-config-expo-magic/utils/to-oxlint.js
       ├─ base rules + overrides[{ files, excludeFiles, rules, globals }]
       ├─ rule-name map: @typescript-eslint/* → typescript/*, import-x/* → import/*
       ├─ plugins + categories + settings + globals + ignorePatterns
       └─ jsPlugins: local rules under original prefixes
consumer oxlint.config.ts → export default createConfig({...}) → bun lint
consumer bunfig.toml [fmt] or the package .prettierrc.js → bun fmt
```

External presets (the eslint-config-expo, typescript-eslint and react-hooks recommended rule tables) were snapshotted from 5.5.0 into `utils/external-config.json`, so the package needs no runtime dependency on them.

## Tests first (golden master from 5.5.0)

All golden data came from 5.5.0 running on ESLint and Prettier, and was committed before the implementation. The recorders left the repository with 5.x; the recordings are frozen:

| Test              | Source of truth                                                                                   | Pass condition                                                                                                |
| ----------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Findings          | `eslint -f json` on `test-project` for each profile in `test-project/bun-golden/profiles.js`      | `bun lint` reports the same `file:line:col rule severity` set, apart from entries in `known-divergences.json` |
| Autofix           | `eslint --fix-dry-run` output for each fixable file and profile                                   | `bun lint --fix-dry-run` produces byte-identical output                                                       |
| Format            | `prettier --check` file list and `prettier` output for each file                                  | `bun fmt --check` gives the same file list and the same output                                                |
| Consumer contract | the packed package in a temporary consumer project with no `eslint`, `prettier` or plugin packages | `bun lint` and `bun fmt` run, report the expected findings, and exit with the expected codes                  |
| Rule ports        | the original plugins (and the 5.x RuleTester cases) on each case in `rules/__expectations__/*.json` | `bun lint` gives the same messages, positions and fully fixed output; reviewed `divergence` entries excepted |
| Configs           | 5.x `createConfig`/`createArchitectureConfig` converted by `toOxlintConfig`, in `__expectations__/configs/` | the package returns the same config and the same option errors                                              |

## Benchmarks

`docs/BENCHMARKS.md` records the comparison of ESLint 10 + Prettier 3.9 (5.5.0) with `bun lint` + `bun fmt` (6.0) on `test-project`, with and without type-aware rules: median wall time and peak RSS over at least 10 runs after a warm-up. The benchmark script needed ESLint and left with it.

## Phases

1. Golden data and RED test harness (`test-project/bun-golden/`, `scripts/lib/bun-golden.test.js`). Done.
2. Snapshot of the external rules, plus the `toOxlintConfig` converter with unit tests. Done.
3. `createConfig` for every profile; the findings golden passes. Done.
4. Port the JavaScript-only rules; the findings and autofix goldens pass for every profile. Done.
5. Package surface and consumer contract: `package.json`, exports, types (`type-tests.ts`), `createArchitectureConfig`, `expo-magic-init`, `pr-guardrails`, README and MIGRATING, and `bun run smoke:bun-consumer`. Done.
6. Benchmarks (`docs/BENCHMARKS.md`). Done.
7. Record every ESLint-based test as expectations, then swap the package on `main` as `6.0.0-next.0` and drop 5.x with its scripts. Done.
8. Remove ESLint, Prettier and the plugins from the repository's devDependencies, format the repository with `bun fmt`, and run CI on Bun canary.
9. Release day (gated, see below).

### Release-day checklist

Start only when a stable Bun release ships `bun lint` and `bun run release:check` passes on it.

1. Set the version to `6.0.0`, drop `private`, and set `engines.bun` to that stable release.
2. Rename the CHANGELOG section to `## 6.0.0` with the release date, and remove the "in development" note from both READMEs.
3. Switch CI to the stable release.

## Status (2026-10-22, Bun canary 1.4.4-canary.1+963452075)

Phases 1–7 are done; the release is held for a stable Bun with `bun lint`. The package builds every profile with no npm package at runtime, and the 25 rules that needed ESLint plugin packages are dependency-free ports in `packages/eslint-config-expo-magic/rules/` (expo, react-native, react-19-upgrade, testing-library, unused-imports, boundaries, plus the local expo-magic and expo-magic-reanimated rules).

`bun run golden:bun` lints `test-project` for every profile on the latest Bun canary:

| Profile        | Rules matched in files | Findings | Autofix |
| -------------- | ---------------------- | -------- | ------- |
| default        | 225                    | ok       | ok      |
| fast           | 186                    | ok       | ok      |
| base           | 56                     | ok       | ok      |
| strict         | 227                    | ok       | ok      |
| typed          | 283                    | ok       | ok      |
| testing        | 272                    | ok       | ok      |
| agent          | 251                    | ok       | ok      |
| react-compiler | 226                    | ok       | ok      |
| full           | 369                    | ok       | ok      |
| mobile-app     | 329                    | ok       | ok      |

The findings gate is that each rule fires in each file where 5.x fires it, and nowhere else. oxlint's rule implementations report some rules on another node or a different number of times (for example `import/no-duplicates` once per module), so per-finding counts and positions are informational (`--verbose`).

The autofix gate runs `bun lint --fix` repeatedly until nothing changes (ESLint repeats up to 10 passes; `bun lint --fix` applies one) and requires each fixed file to match ESLint's output byte for byte. Reviewed exceptions for both gates live in `test-project/bun-golden/divergences.json`, and the run fails when one stops occurring.

### Blockers and upstream report candidates

- **B1 (worked around):** Bun's oxlint config parser rejects the `id-match` pattern `^(?!handle[A-Z])` used by the mobile-app profile ("look-around is not supported"), although Bun documents rule-option patterns as JavaScript regular expressions. `toOxlintConfig` rewrites `^(?!P)` patterns into an equivalent pattern without look-around (`utils/negative-prefix.js`, fuzz-tested against the original), so the rule keeps its `id-match` ID and existing disable comments. Still worth reporting upstream.
- `bun lint --fix` applies one pass; ESLint repeats until no fix applies.
- oxlint's `no-var` fix rewrites redeclared `var`s to duplicate `const`s, which TypeScript rejects.
- oxlint applies fixes that ESLint offers only as suggestions (`use-isnan`, `no-unsafe-negation`, `@ts-ignore` → `@ts-expect-error`).
- `jest/no-mocks-import` misses a relative `__mocks__` import.

### Consumer-facing changes found so far

- Code that TypeScript rejects (duplicate declarations, `with` in a module, duplicate parameters or exports) is now a parse error, and Bun lints nothing else in that file. The fixtures for those rules moved to `test-project/invalid-syntax/`.
- Type-aware rules use Bun's type checker, which behaves like TypeScript 7: `compilerOptions.baseUrl` is an error. Write `paths` targets relative to the tsconfig instead (`"@/*": ["./*"]`).
- Bun treats `import React` as used in JSX files, and `bun:test` as a built-in module.

### Coverage changes made when the tests moved to recordings

- The boundaries ignore-pattern fuzz runs 110 of the 700 generated patterns, one case each; file and element descriptor patterns still run all 700, batched.
- `testing-library` `await-async-queries: findBy from dom import` uses an `async` callback: Bun skips a fix whose result does not parse.
- `react-19-upgrade` `no-prop-types: invalid 4` runs only as `.js`: two `static propTypes` members are a TypeScript parse error in Bun.
- Port meta checks compare `type`, `fixable` and the messages the port keeps, not docs or schema (`unused-imports` reimplements only the import half).
- The Windows-path filename cases call the rules directly (`rules/expo-magic/windows-paths.test.js`).
- The golden data no longer lists the deleted ESLint tooling files in `test-project` (`eslint.config.js`, `.eslintrc.js`, `validate-comprehensive.js`, `validation-results*`).
