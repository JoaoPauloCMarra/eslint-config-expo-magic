/** @type {import('eslint').Linter.Config[]} */
// Rationale: https://github.com/JoaoPauloCMarra/eslint-config-expo-magic/blob/main/RULES.md#mobile-first-infrastructure
module.exports = [
	{
		rules: {
			'expo/prefer-box-shadow': 'warn',
			'no-console': 'warn',
			'no-restricted-imports': [
				'error',
				{
					paths: [
						{
							name: 'react-native',
							importNames: ['SafeAreaView'],
							message:
								"Use 'SafeAreaView' from 'react-native-safe-area-context' instead.",
						},
					],
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
	{
		files: ['**/*.ts', '**/*.tsx'],
		rules: {
			'no-restricted-syntax': [
				'error',
				{
					selector: 'TSInterfaceDeclaration',
					message: 'Prefer types over interfaces.',
				},
				{
					selector:
						"MemberExpression[object.object.name='process'][object.property.name='env'][property.name!=/^EXPO_PUBLIC_/]",
					message:
						'Exposure of environment variables is restricted to those prefixed with EXPO_PUBLIC_.',
				},
			],
		},
	},
];
