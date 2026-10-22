const { prettier: prettierConfig } = require('./external-config.json');

// Rationale: https://github.com/JoaoPauloCMarra/eslint-config-expo-magic/blob/main/RULES.md#formatting
module.exports = [
	{
		plugins: {
			prettier: {},
		},
		rules: {
			'prettier/prettier': 'error',
		},
	},
	prettierConfig,
];
