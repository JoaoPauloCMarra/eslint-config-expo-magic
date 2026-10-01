# Release confidence

Tests reduce known risks; they cannot prove every possible program, option object,
plugin update, operating system, or dependency resolution. A green release gate
means the following contracts passed for that exact candidate.

| Risk | Executable evidence |
| --- | --- |
| Boolean option interaction crashes | `release-contract.test.ts`: all-off, all-on, and each singleton give all four states of every pair of 17 switches, repeated for base, fast and default. A coverage assertion checks the pair set. Each row lints JS, JSX, TS, TSX, MTS and CTS. |
| Object options, custom tsconfig and precedence | `combinations.test.ts`, `composition.test.ts`, architecture/mobile/native UI tests cover named custom paths, restrictions, wrapper exceptions and top-level overrides. |
| Rule false positives and missed reports | Colocated RuleTester cases, restriction composition tests, and intentional violation fixtures. Every bug fix adds a failing regression before changing the rule. |
| Alias semantics | Cross-feature fixtures cover relative/alias imports, Windows paths, custom roots and prefixes, dot segments, contract escapes and traversal outside the alias root. |
| File scope | Release tests assert generated/native/build ignores, caller ignores, story/strict precedence. Composition fixtures check test-only restrictions and TS declaration/module extensions. |
| Unsafe autofix | Representative TS/formatting fixes must reach a fixed point on the second pass and preserve evaluated exported values. Component decisions without safe fixes must leave source unchanged. This is a bounded sample, not a universal semantic proof. |
| Package exports and contents | CJS/ESM/declaration contracts run against the workspace and installed tarball. Tarball members must contain every declared target and exclude test/development sources. |
| Wrong executable on PATH | Bun/npm consumers must resolve their `.bin` symlink to the package launcher or the exact bundled tool executable and report exactly the version resolved from the installed package for ESLint and Prettier. A successful exit from a different version is a failure. |
| Real consumer compatibility | Sequential packed Expo SDK 54, 55, 56 and 57 consumers lint intentional fixtures and compile export types. The npm SDK57 consumer checks runtime/bin contracts with React Native pinned to the fixture tuple. A clean SDK57 install also runs Expo Doctor. |
| Skipped release prerequisite | `release-gate.test.js` executes the actual gate with disposable failing commands and checks that report/test/smoke failures stop before packing. Release baseline tests keep reports stable after tagging the current version. |

## Candidate process

1. Use an isolated branch from current `main`; do not include unrelated local work.
2. Select patch/minor from the public behavior, documenting new diagnostics. Major
   or breaking proposals require a separate decision. Keep runtime dependency
   upgrades separate unless necessary for the fix.
3. Install the committed lockfile with Bun. Run `test`, `validate`, `typecheck`,
   `audit:deps`, `smoke:pack`, and `smoke:clean-sdk57`. Resource-heavy gates run
   sequentially when sharing a machine. Temporary consumers clean up on failure;
   subprocesses have bounded timeouts. A process-group watchdog is still useful
   because a killed subprocess can have descendants.
4. Bump the package/workspace version and changelog, regenerate configuration and
   release reports, and commit them. `report:check` compares generated reports to
   **HEAD**, so staging a changed report does not bypass the gate. Comparison excludes the current version tag, keeping the baseline stable after publication.
5. Open a draft PR; independently review its exact diff and run CI. CI includes
   report drift, full tests, declaration checks, dependency audit, lint fixtures,
   packed consumers, and clean SDK57 consumers. Mark ready/merge only when the
   current head is reviewed and all required jobs have terminal success.
6. The release workflow checks out the successful main CI run's exact `head_sha`,
   reruns `release:check` before publishing, then verifies registry version/latest
   before creating the GitHub release. Do not bypass a failed job or token/OTP gate.
7. Verify the merged commit, release run, registry tarball/version, and an installed
   published consumer. Publishing success alone is not install verification.

## Remaining sampling limits

The pairwise suite covers boolean toggles, not every value of object options or
all higher-order combinations. The all-on row supplements pairwise coverage but
is not exhaustive. Native framework runtime behavior is outside a lint package's
scope. CI uses Linux and local validation uses macOS; Windows path fixtures are
not Windows execution. Supported SDK patch tuples are examples, not every patch
in each peer range. Caret dependency resolution can move between runs; preserve
resolved version logs and investigate differences. Mutation tooling is not yet a
release requirement; negative contract tests deliberately break bin versions,
packed targets, and gate commands to prove those checks reject faults.
