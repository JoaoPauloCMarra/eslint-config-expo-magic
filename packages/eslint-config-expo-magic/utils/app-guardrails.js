const { createRestrictedSyntaxConfigs } = require('./restricted-syntax.js');

const typeScriptFiles = [
	'**/*.ts',
	'**/*.tsx',
	'**/*.mts',
	'**/*.cts',
	'**/*.d.ts',
	'**/*.d.mts',
	'**/*.d.cts',
];

const testFiles = [
	'**/*.test.ts',
	'**/*.test.tsx',
	'**/*.spec.ts',
	'**/*.spec.tsx',
];

const DEFAULT_QUERY_HOOK_PATTERN = '^useGet[A-Z]';

function createRestrictedSyntaxGroups(options = {}) {
	const queryHookPattern =
		options.queryHookPattern ?? DEFAULT_QUERY_HOOK_PATTERN;

	return [
		{
			files: typeScriptFiles,
			selectors: [
				{
					selector: 'TSAsExpression > TSAsExpression',
					message:
						'Avoid double type assertions. Prefer proper type guards or generic typing.',
				},
				{
					selector: `TSTypeReference[typeName.name="ReturnType"] TSTypeQuery > Identifier[name=/${queryHookPattern}/]`,
					message:
						'Avoid `ReturnType<typeof useGet...>` with selector-capable query hooks. Use domain types or shared query-result helpers.',
				},
			],
		},
		{
			files: testFiles,
			selectors: [
				{
					selector:
						'CallExpression[callee.property.name="toMatchSnapshot"], CallExpression[callee.name="toMatchSnapshot"]',
					message:
						'Prefer focused assertions over snapshots for production app regressions.',
				},
			],
		},
	];
}

const restrictedSyntaxGroups = createRestrictedSyntaxGroups();

const base = [
	{
		files: typeScriptFiles,
		rules: {
			'@typescript-eslint/ban-ts-comment': [
				'error',
				{
					'ts-expect-error': 'allow-with-description',
					'ts-ignore': true,
					'ts-nocheck': true,
					'ts-check': false,
					minimumDescriptionLength: 3,
				},
			],
			'@typescript-eslint/no-non-null-assertion': 'error',
		},
	},
	{
		rules: {
			'no-warning-comments': [
				'warn',
				{
					terms: ['todo', 'fixme'],
					location: 'start',
				},
			],
		},
	},
];

function createAppGuardrailsConfig(options = {}) {
	return [
		...base,
		...createRestrictedSyntaxConfigs(createRestrictedSyntaxGroups(options)),
	];
}

const config = createAppGuardrailsConfig();

module.exports = config;
module.exports.base = base;
module.exports.createAppGuardrailsConfig = createAppGuardrailsConfig;
module.exports.createRestrictedSyntaxGroups = createRestrictedSyntaxGroups;
module.exports.restrictedSyntaxGroups = restrictedSyntaxGroups;
