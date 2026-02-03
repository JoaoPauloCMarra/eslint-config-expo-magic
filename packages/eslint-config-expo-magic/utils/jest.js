/** @type {import('eslint').Linter.Config[]} */
// Rationale: https://github.com/JoaoPauloCMarra/eslint-config-expo-magic/blob/main/RULES.md#-testing
const jest = require('eslint-plugin-jest');
const testingLibraryPlugin = require('eslint-plugin-testing-library');

module.exports = [
	{
		plugins: {
			jest: jest,
			'testing-library': testingLibraryPlugin,
		},

		files: [
			'**/*.test.[jt]s',
			'**/*.test.[jt]sx',
			'**/*.spec.[jt]s',
			'**/*.spec.[jt]sx',
			'jest.setup.js',
		],

		languageOptions: {
			globals: {
				...jest.environments.globals.globals,
			},
		},

		rules: {
			...jest.configs.recommended.rules,
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
