# Release confidence

Tests reduce known risks; they cannot prove every possible program, option object, Bun release, operating system, or dependency resolution. A green release gate means the following contracts passed for that exact candidate.

6.0 has no ESLint in the repository. Every behavior check compares Bun's output with what 5.5.0 and the original ESLint plugins produced, recorded before ESLint was removed. The recordings are frozen; a change in intended behavior updates them by hand, with the reason in the commit.

| Risk | Executable evidence |
| --- | --- |
| Config drift from 5.x | `create-config.test.js` and `architecture.test.js` compare every profile and architecture option set with the 5.x config converted by `toOxlintConfig` (`__expectations__/configs/`), and every rejected option with the 5.x error. |
| Rule false positives, missed reports, wrong fixes | `rules/*.test.js` run each port through `bun lint` on the cases in `rules/__expectations__/` and require the original plugin's messages, positions and fully fixed output. A probe rule fails any case whose file was not linted. Reviewed `divergence` entries name Bun behavior that differs on purpose. |
| Whole-profile behavior | `bun run golden:bun` lints `test-project` for 10 profiles and requires each rule to fire in each file where 5.x fires it, and nowhere else, plus byte-identical autofix output. Reviewed exceptions live in `test-project/bun-golden/divergences.json`; one that stops occurring fails the run. |
| Converter edge cases | `utils/to-oxlint.test.js`, `intersect-globs.test.js` and the fuzz-tested `negative-prefix.test.js`. |
| Runtime dependencies | `create-config.test.js` fails when a shipped source imports anything but relative files or `node:` built-ins, and builds configs from a copy outside the repository. |
| Real consumer | `bun run smoke:bun-consumer` installs the packed tarball in a clean project, runs `expo-magic-init`, `bun lint` and `bun fmt`, and checks that no ESLint, Prettier or plugin package is installed. |
| Skipped release prerequisite | `release-gate.test.js` executes the actual gate with disposable failing commands and checks that each failure stops before packing. |

## Remaining sampling limits

The recorded cases and fixtures are samples, not every program or option value. Recordings capture 5.5.0 behavior; a newer Bun can change native rules, which `golden:bun` reports. CI uses Linux and local validation uses macOS; Windows path cases are direct rule calls, not Windows execution.
