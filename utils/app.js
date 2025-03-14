module.exports = [
  {
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'TSInterfaceDeclaration',
          message:
            'Avoid using interfaces, prefer types for better performance and consistency.',
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
