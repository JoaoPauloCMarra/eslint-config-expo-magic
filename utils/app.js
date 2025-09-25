module.exports = [
  {
    rules: {
      // expo/prefer-box-shadow: Enforce using box-shadow instead of deprecated shadow props in Expo
      'expo/prefer-box-shadow': 'warn',
      // no-restricted-syntax: Disallow specified syntax patterns, here TypeScript interfaces
      'no-restricted-syntax': [
        'error',
        {
          selector: 'TSInterfaceDeclaration',
          message:
            'Avoid using interfaces, prefer types for better performance and consistency.',
        },
      ],
      // no-restricted-imports: Disallow specified modules or module members from being imported
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
      // no-console: Disallow calls to methods of the console object
      'no-console': 'warn',
    },
  },
];
