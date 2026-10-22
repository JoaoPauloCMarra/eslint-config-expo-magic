// Invalid TypeScript on purpose: bun lint reports a parse error here, ESLint
// reports the rules below (docs/BUN_MIGRATION.md).

// ❌ This should trigger @typescript-eslint/no-dupe-class-members and no-dupe-class-members
class Dupe {
	foo() {}
	foo() {}
}
console.log(Dupe);
