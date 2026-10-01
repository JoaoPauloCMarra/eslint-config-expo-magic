# Guarded props identity chains — candidate evidence

Branch: `fix/guarded-children-aliases`, isolated from the verified 5.2.2 merge
`d349b680cbf4d0f2a5cb525ce335cae862319d02`. Target package version: 5.2.3. Dependency ranges, exports, rule severity and
options are unchanged. Release metadata is prepared for draft review; this is
not a release-ready result.

## Concrete compatibility benefit

A component that returns `second.children` after `const first = props;
const second = first` previously received an incorrect unused-children warning.
The candidate recognizes read-only const identity chains by lexical variable
identity, including block scopes, computed children reads, destructuring,
spreading and the existing cloneElement forwarding contract.

It also removes incorrect props identity from unrelated destructured properties
and rest objects known to exclude children. Direct write-only member access
(assignment, update, deletion or assignment-pattern targets) no longer suppresses
the warning. These changes can restore warnings for unused caller content;
consumers with warning budgets or overridden severity can observe them.

The initial audited defects are present in 5.2.0, 5.2.1 and 5.2.2. They are not
regressions introduced by the namespace patch. The concrete corrected behavior supports the proposed 5.2.3 patch. Publication
remains contingent on all applicable gates, beyond the focused tests.

## Guard boundaries

Only additional const chains use the new expansion. Existing direct alias usage
is retained except the explicit destructuring and write-only corrections.

A bounded variable-identity graph includes local mutable siblings for hazard
checks. Expansion rejects non-initializing binding writes, member writes,
method/constructor/tagged calls, unrecognized object/call/assignment escapes,
and aliases introduced in nested functions. Transparent TypeScript expression
wrappers are normalized for those checks. Unknown references fail conservatively
instead of serving as proof that a chain still carries caller children.

This is syntactic analysis, not complete dataflow. Legacy direct alias/parameter
reassignment can still hide warnings. Assignment-expression aliases, snapshots
around later writes, transitive rest copies, nested-function invocation tracking,
unknown computed destructuring keys, getters/proxies and indirect mutation are
not established by this patch. Existing one-hop treatment of unknown computed
rest keys is preserved; literal keys are classified precisely.

## Coverage matrix and receipts

| Risk | Evidence | Result |
| --- | --- | --- |
| Core chain false positives and destructuring false negatives | 20 new named cases, unchanged 5.2.2 initially 90 pass / 10 fail | Fixed |
| TS wrappers, constructor/object/assignment escapes, computed rest | First adversarial review reproduced eight new regressions before correction | Fixed |
| Tagged method mutation, including TS wrapper | Two red-first cases from final bounded review | Fixed |
| Reassignment, property writes, captured mutations, shadowing | Explicit negative controls; mutation guards inspect sibling identity aliases | Pass |
| Ordinary direct aliases and rest forwarding | Original cases and new literal-key controls | Pass |
| Full local plugin rules | 199 pass, zero fail across six files; 122 children cases | Pass |
| Differential 5.2.0 / 5.2.1 / 5.2.2 / candidate | 42 added cases; 17 corrected vs 5.2.2, zero sampled regressions, zero candidate failures | Pass |
| Independent bounded adversarial review | Initial 20 probes plus two tagged-method probes; all identified blockers resolved | Approved within scope |
| Fresh install and full applicable gates | Deferred behind desktop/native work | Pending |

Receipts:

- `/tmp/value-alias-red-test.log`
- `/tmp/value-alias-adversarial-red.log`
- `/tmp/value-alias-tagged-red.log`
- `/tmp/value-alias-plugin-green.log`
- `/Users/jota/Documents/Codex/2026-10-01/task-8/alias-audit/regression-differential.json`
- Reproducible differential runner beside that JSON: `regression-differential.cjs`.

The initial wider 25-case audit and 22 pure runtime marker oracles are preserved
in the task workspace's `alias-audit` directory. The wider audit deliberately
contains out-of-scope dataflow cases that remain unresolved; the differential
regression suite above does not claim to fix them.

Formatting and whitespace checks passed. Focused tests use two task-created
node_modules symlinks to the installed 5.2.2 candidate, so direct rule behavior is
verified but fresh workspace/package resolution is not. No install or full gate ran during focused validation. A candidate commit and
draft PR are authorized for remote CI; merge and publication remain gated.
Replace those exact
symlinks with a frozen installation only when the parent grants the heavy lane.
Then run repository-required test/validate and applicable release checks before
any release-ready claim. Preserve completed 5.2.2 artifacts and original work.
