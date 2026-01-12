module.exports = [
	{
		files: ['**/*.ts', '**/*.tsx', '**/*.d.ts'],
		ignores: ['**/node_modules/**'],
		languageOptions: {
			parserOptions: {
				projectService: true,
				ecmaVersion: 'latest',
				sourceType: 'module',
				ecmaFeatures: {
					jsx: true,
				},
				warnOnUnsupportedTypeScriptVersion: true,
			},
		},
		rules: {
			'@typescript-eslint/array-type': 'warn',
			'@typescript-eslint/await-thenable': 'error',
			'@typescript-eslint/consistent-type-assertions': 'warn',
			'@typescript-eslint/consistent-type-definitions': ['error', 'type'],
			'@typescript-eslint/consistent-type-imports': [
				'error',
				{
					prefer: 'type-imports',
					disallowTypeAnnotations: false,
				},
			],
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
			'@typescript-eslint/no-empty-object-type': 'warn',
			'@typescript-eslint/no-explicit-any': 'error',
			'@typescript-eslint/no-extra-non-null-assertion': 'warn',
			'@typescript-eslint/no-floating-promises': 'error',
			'@typescript-eslint/no-import-type-side-effects': 'error',
			'@typescript-eslint/no-meaningless-void-operator': 'error',
			'@typescript-eslint/no-non-null-assertion': 'warn',
			'@typescript-eslint/no-unnecessary-type-assertion': 'error',
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
			'@typescript-eslint/prefer-nullish-coalescing': 'off',
			'@typescript-eslint/prefer-optional-chain': 'warn',
			'@typescript-eslint/prefer-readonly': 'warn',
			'@typescript-eslint/triple-slash-reference': 'error',
		},
	},
];
