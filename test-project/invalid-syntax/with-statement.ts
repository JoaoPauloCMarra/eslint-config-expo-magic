// Invalid in a module on purpose: bun lint reports a parse error here, ESLint
// reports the rules below (docs/BUN_MIGRATION.md).

const obj = { a: 1 };

// ❌ This should trigger no-with and no-restricted-syntax
with (obj) {
}
