const prettierConfig = require('eslint-config-prettier/flat');
const pluginPrettier = require('eslint-plugin-prettier');

/** @type {import('eslint').Linter.Config[]} */
// Rationale: https://github.com/JoaoPauloCMarra/eslint-config-expo-magic/blob/main/RULES.md#formatting
module.exports = [
	{
		plugins: {
			prettier: pluginPrettier,
		},
		rules: {
			'prettier/prettier': 'error',
		},
	},
	prettierConfig,
];
