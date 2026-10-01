# 5.2.1 candidate validation

Recorded 2026-10-01. The initial patch is commit
`9814e9305f0982ea015356143c15f4aa96210921`, based on main
`38e7549c0899283784a449995251f32b66a95b92`. The subsequent npm command
correction is described below. Unrelated dependency upgrades and the new
compiler restriction from the existing development branch are excluded.

## Evidence before the npm correction

- Frozen-lock suite: 865 passed; final bin-layout helper suite: 14 passed.
- Public typecheck, intentional lint fixtures, dependency audit and committed-report check passed.
- Independent review found no correctness blockers in that candidate.
- Packed Bun SDK lanes passed: Expo 54.0.33 / RN 0.81.5 / TS 5.9.3; Expo 55.0.9 / RN 0.83.4 / TS 5.9.3; Expo 56.0.9 / RN 0.85.3 / TS 6.0.3; Expo 57.0.26 / RN 0.86.3 / TS 6.0.3.
- All four fresh Bun consumers resolved ESLint 10.11.0 and Prettier 3.9.9. The frozen development lockfile resolves ESLint 10.10.0 and Prettier 3.9.6.

## npm collision and correction

The npm SDK57 consumer installed successfully and its runtime export contract
passed. Its generic `.bin/eslint` targeted root ESLint **9.39.5**, while the config
resolved nested ESLint **10.11.0**. The stronger gate rejected that mismatch;
the old exit-status-only check missed it. The overall packed matrix failed, and
its owned temporary directories were cleaned.

The shipped launcher dispatch itself was correct. The generic command bypassed
it, contradicting the README's unconditional package-owned command guarantee.
The patch now documents the existing explicit launchers for conventional
`node_modules` installs. The initializer adds the deterministic lint script only
when absent, preserving existing scripts. No new CLI names or dependency ranges
are introduced. Existing generic scripts may need migration; see
[MIGRATING.md](MIGRATING.md#deterministic-tool-commands-in-521).

Before the fix, initializer expectations failed. After the fix, **38 targeted
helper, initializer and documentation tests passed**, including the actual
shipped launcher against a competing ESLint 9 bin and preservation of existing
scripts. A lightweight local CLI probe confirmed explicit version, lint and
format behavior with frozen dependencies. This is not packed npm verification.
The npm smoke now verifies the explicit versions and real lint/format behavior;
generic-bin mismatch rejection remains covered independently.

## Pending release gates

- Rerun the packed npm lane on the corrected candidate.
- Run final full tests, clean SDK57/Expo Doctor and the combined release gate.
- Review exact-head PR/main CI and verify the published tarball/installed consumer.
- Local heavy validation is paused while the shared Mac is used for active QA.

No release is claimed. [TESTING.md](TESTING.md) records coverage and sampling limits.
