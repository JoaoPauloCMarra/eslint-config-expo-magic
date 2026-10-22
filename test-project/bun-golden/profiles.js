// Option sets recorded as golden data from the 5.x ESLint package. The Bun-only
// package must report the same findings for each profile (docs/BUN_MIGRATION.md).

const fullOptions = {
	prettier: true,
	testing: true,
	strict: true,
	typeChecked: true,
	reactCompiler: true,
	storybook: true,
	worklets: true,
	importCycles: true,
	inlineStyles: 'warn',
	agent: {},
	appGuardrails: {},
	componentStructure: {},
	deprecatedApis: {},
	featureBoundaries: {},
	nativeUi: {},
	reanimated: {},
	semanticColors: {},
};

module.exports = [
	{ name: 'default', factory: 'createConfig', options: {} },
	{ name: 'fast', factory: 'createConfig', options: { preset: 'fast' } },
	{ name: 'base', factory: 'createConfig', options: { preset: 'base' } },
	{ name: 'strict', factory: 'createConfig', options: { strict: true } },
	{ name: 'typed', factory: 'createConfig', options: { typeChecked: true } },
	{
		name: 'testing',
		factory: 'createConfig',
		options: { prettier: true, testing: true },
	},
	{ name: 'agent', factory: 'createConfig', options: { agent: true } },
	{
		name: 'react-compiler',
		factory: 'createConfig',
		options: { reactCompiler: true },
	},
	{ name: 'full', factory: 'createConfig', options: fullOptions },
	{
		name: 'mobile-app',
		factory: 'createMobileAppConfig',
		options: {},
		// Bun's oxlint config parser rejects the id-match lookahead pattern
		// `^(?!handle[A-Z])`, although Bun documents rule-option patterns as
		// JavaScript regular expressions. Upstream report candidate.
		blockedBy:
			'look-around, including look-ahead and look-behind, is not supported',
	},
];
