# Qualified children types: local audit

Candidate: `fix/qualified-children-types`, based on main
`44b5a055ea5bf667a30357703b7adae4c8fdf0e8` (package 5.2.1).
Target version: 5.2.2. This candidate is prepared for draft review, not a release
or full-gate result.

## Defects and behavior

The released `require-children-usage` rule stripped qualified type names before
lexical lookup. `Model.Props` could incorrectly resolve an outer `Props`, or miss
a namespace member that actually declared children. Independent differential
probes confirmed both regressions against 5.2.0 and 5.2.1.

The candidate preserves qualified paths, resolves same-file namespace members and
local namespace aliases, and respects private members and lexical shadowing.
Merged namespaces share exported members; dotted declarations retain implicit
parents. Recognized React helper imports remain supported, including renamed and
`import = require` forms. Arbitrary external types remain unresolved.

Public exports, options, rule severity and dependency versions are unchanged.
The package and workspace lock entry target patch version 5.2.2. Corrected missed warnings can affect warning budgets; incorrect
warnings caused by borrowing an unrelated type are removed.

## Coverage matrix

| Behavior | Focused evidence | Status |
| --- | --- | --- |
| Outer terminal-name collisions | Qualified type with unrelated outer Props | Pass |
| Namespace aliases/interfaces/inheritance | Direct, nested, dotted, interface extends | Pass |
| Scope and visibility | Private members, local namespace/type-parameter shadows | Pass |
| Merged declarations | Exported aliases, interfaces and nested namespaces; private controls | Pass |
| Dotted parents | Explicit/dotted merging and implicit-parent sibling lookup | Pass |
| Import aliases | Local import-equals chains and cycle termination | Pass |
| React helper recognition | Implicit, named, renamed, namespace and import-equals forms | Pass |
| External types | No borrowing of unrelated local declarations | Pass |
| Actual children usage | Existing rendering/props forwarding and scope cases | Pass |
| Other local plugin rules | Six colocated rule test files | Pass |
| Full package/config/export consumers | Full test, validate, typecheck, packed SDK consumers | Pending heavy-test slot |

## Verification receipts

- Initial red suite against unchanged release: 33 passed, 21 failed (all 27
  original tests passed). `/tmp/namespace-children-red-test.log`.
- Additional boundary regressions: `/tmp/namespace-merged-red-test.log` and
  `/tmp/namespace-merged-members-red.log`; six and three failures respectively
  before the corresponding fixes.
- Final lightweight command:
  `bun test packages/eslint-config-expo-magic/utils/plugin/rules`.
  157 passed, zero failed across six files, including 80 children-usage cases.
  Receipt: `/tmp/namespace-plugin-regressions.log`.
- Rule/test formatting and `git diff --check` passed.
- Independent final review repeated merged-interface, nested-namespace, dotted-
  sibling and private-shadow probes; no remaining blockers within that bounded
  review. It did not run full gates or assert checker-equivalent resolution.

Observed runtime: Bun 1.4.2, Node 22.23.3, ESLint 10.10.0,
@typescript-eslint/parser 8.69.0, TypeScript 6.0.3 and Prettier 3.9.6.

Tests use task-owned node_modules symlinks into the previously installed
release-candidate checkout. These direct colocated tests load the edited rule,
but do not establish fresh-install or workspace package resolution. Before full
verification, replace only those two task-created symlinks (root and package)
with a frozen Bun installation in this candidate. No persistent service is needed.

## Remaining limits and next gate

Obtain the parent's heavy-test slot before installs, full suites or packed
consumer work. Run the repository's rule-change gate (`test` and `validate`),
then the complete applicable release gate before calling this release-ready.
A draft PR is authorized for remote CI. Do not merge until all required
exact-head gates pass; local full validation remains queued.

This is syntactic same-file analysis, not TypeScript checker equivalence.
Pre-existing transitive value aliases (props -> first -> second) and same-scope
interface declaration overwrites remain separate follow-up defects. Cross-file
re-exports, generic substitution, and arbitrary TypeScript type computation are
not established by these tests. CLI lint workflows are relevant; no UI/native
app interaction or framework runtime validation is claimed.
