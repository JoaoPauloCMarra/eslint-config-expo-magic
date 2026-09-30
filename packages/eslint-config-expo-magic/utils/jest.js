/** @type {import('eslint').Linter.Config[]} */
// Rationale: https://github.com/JoaoPauloCMarra/eslint-config-expo-magic/blob/main/RULES.md#-testing
const jest = require('eslint-plugin-jest');
const testingLibraryPlugin = require('eslint-plugin-testing-library');
const { createTestFilePatterns } = require('./file-patterns.js');

module.exports = [
	{
		plugins: {
			jest: jest,
			'testing-library': testingLibraryPlugin,
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
