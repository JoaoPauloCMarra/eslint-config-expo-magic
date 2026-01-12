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
			'no-restricted-syntax': [
				'error',
				{
					selector: 'TSInterfaceDeclaration',
					message: 'Prefer types over interfaces.',
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
