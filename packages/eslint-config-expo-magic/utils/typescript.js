const { typeScriptFiles } = require('./file-patterns.js');

// Rationale: https://github.com/JoaoPauloCMarra/eslint-config-expo-magic/blob/main/RULES.md#typescript
const syntaxRules = {
	'no-unused-vars': 'off',
	'@typescript-eslint/array-type': 'warn',
	'@typescript-eslint/consistent-type-assertions': 'warn',
	'@typescript-eslint/consistent-type-definitions': ['error', 'type'],
	'@typescript-eslint/consistent-type-imports': [
		'error',
		{
			prefer: 'type-imports',
			disallowTypeAnnotations: false,
		},
	],
	'@typescript-eslint/no-empty-object-type': 'warn',
	'@typescript-eslint/no-explicit-any': 'error',
	'@typescript-eslint/no-extra-non-null-assertion': 'warn',
	'@typescript-eslint/no-import-type-side-effects': 'error',
	'@typescript-eslint/no-non-null-assertion': 'warn',
	'@typescript-eslint/no-unnecessary-type-constraint': 'error',
	'@typescript-eslint/no-unused-vars': [
		'error',
		{
			vars: 'all',
			args: 'none',
			ignoreRestSiblings: true,
			caughtErrors: 'all',
			argsIgnorePattern: '^_',
			varsIgnorePattern: '^_',
		},
	],
	'@typescript-eslint/no-useless-constructor': 'warn',
	'@typescript-eslint/no-wrapper-object-types': 'warn',
	'@typescript-eslint/triple-slash-reference': 'error',
};

const typeAwareRules = {
	'@typescript-eslint/await-thenable': 'error',
	'@typescript-eslint/naming-convention': [
		'warn',
		{
			selector: 'typeLike',
			format: ['PascalCase'],
			leadingUnderscore: 'forbid',
		},
		{
			selector: 'enumMember',
			format: ['UPPER_CASE'],
		},
	],
	'@typescript-eslint/no-confusing-void-expression': 'error',
	'@typescript-eslint/no-floating-promises': 'error',
	'@typescript-eslint/no-meaningless-void-operator': 'error',
	'@typescript-eslint/no-unnecessary-type-assertion': 'error',
	'@typescript-eslint/prefer-nullish-coalescing': 'off',
	'@typescript-eslint/prefer-optional-chain': 'warn',
	'@typescript-eslint/prefer-readonly': 'warn',
};

function createTypeScriptConfig({ typeChecked = true } = {}) {
	return [
		{
			files: typeScriptFiles,
			ignores: ['**/node_modules/**'],
			languageOptions: {
				parserOptions: {
					...(typeChecked ? { projectService: true } : {}),
					ecmaVersion: 'latest',
					sourceType: 'module',
					ecmaFeatures: {
						jsx: true,
					},
					warnOnUnsupportedTypeScriptVersion: true,
				},
			},
			rules: {
				...syntaxRules,
				...(typeChecked ? typeAwareRules : {}),
			},
		},
	];
}

const config = createTypeScriptConfig();

module.exports = config;
module.exports.createTypeScriptConfig = createTypeScriptConfig;
module.exports.typeScriptFiles = typeScriptFiles;
