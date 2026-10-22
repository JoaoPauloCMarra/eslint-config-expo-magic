// Invalid TypeScript on purpose: bun lint reports a parse error here, ESLint
// reports the rule below (docs/BUN_MIGRATION.md).

// ❌ This should trigger no-dupe-args
export function dupeArgs(a, a) {}
