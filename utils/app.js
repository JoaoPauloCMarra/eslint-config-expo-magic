module.exports = [
	{
		rules: {
			'no-restricted-syntax': [
				'error',
				{
					selector: 'TSInterfaceDeclaration',
					message: 'Avoid using interfaces, prefer types.',
				},
			],
			'no-restricted-imports': [
				'error',
				{
					paths: [],
				},
			],
		},
	},
];
