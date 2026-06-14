/** @type {import('eslint').Linter.Config[]} */
// Rationale: https://github.com/JoaoPauloCMarra/eslint-config-expo-magic/blob/main/RULES.md#mobile-first-infrastructure
const { baseRestrictedImports } = require('./restricted-imports.js');

module.exports = [
	{
		rules: {
			'no-console': 'warn',
			'no-restricted-imports': [
				'error',
				{
					paths: [...baseRestrictedImports],
				},
			],
			'no-unused-vars': [
				'error',
				{
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_',
					caughtErrorsIgnorePattern: '^_',
				},
			],
		},
	},
];
