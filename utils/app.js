module.exports = [
  {
    rules: {
      // expo/prefer-box-shadow: Enforces using box-shadow instead of deprecated shadow props
      'expo/prefer-box-shadow': 'warn',
      // no-restricted-syntax: Disallows specified syntax. Default: 'off'
      'no-restricted-syntax': [
        'error',
        {
          selector: 'TSInterfaceDeclaration',
          message:
            'Avoid using interfaces, prefer types for better performance and consistency.',
        },
      ],
      // no-restricted-imports: Disallows specified modules when loaded by import declarations. Default: 'off'
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
      // no-console: Disallows calls to methods of the console object. Default: 'off'
      'no-console': 'warn',
    },
  },
];
