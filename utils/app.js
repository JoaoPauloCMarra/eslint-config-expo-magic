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
          paths: [
            {
              name: 'react-native',
              importNames: ['SafeAreaView'],
              message:
                "Please use 'SafeAreaView' from 'react-native-safe-area-context' instead. It is no longer exported from 'react-native' starting from v0.81.",
            },
          ],
        },
      ],
    },
  },
];
