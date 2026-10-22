// Rationale: https://github.com/JoaoPauloCMarra/eslint-config-expo-magic/blob/main/RULES.md#-testing
const { jest } = require('./external-config.json');
const { createTestFilePatterns } = require('./file-patterns.js');

module.exports = [
	{
		plugins: {
			jest: {},
			'testing-library': {},
		},

		files: [
			...createTestFilePatterns({
				js: true,
				jsx: true,
				ts: true,
				tsx: true,
				moduleExtensions: true,
			}),
			'jest.setup.js',
		],

		languageOptions: {
			globals: {
				...jest.globals,
			},
		},

		rules: {
			...jest.recommendedRules,
			'jest/no-disabled-tests': 'error',
			'jest/no-test-prefixes': 'warn',
			'jest/prefer-hooks-on-top': 'error',
			'jest/prefer-to-be': 'warn',

			'testing-library/await-async-queries': 'error',
			'testing-library/no-await-sync-queries': 'error',
			'testing-library/no-debugging-utils': 'warn',
			'testing-library/no-dom-import': 'error',
		},
	},
];
