// Invalid TypeScript on purpose: bun lint reports a parse error here, ESLint
// reports the rule below (docs/BUN_MIGRATION.md).

export const a = 1;
// ❌ This should trigger import-x/export
export const a = 2;
