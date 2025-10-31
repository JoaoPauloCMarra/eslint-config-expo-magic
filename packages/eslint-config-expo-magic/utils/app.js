module.exports = [
  {
    rules: {
      // expo/prefer-box-shadow: Prefer the newer box-shadow syntax over shadow-* properties for consistency with web standards
      'expo/prefer-box-shadow': 'warn',
      // no-console: Discourage console statements in production code to maintain clean logs
      'no-console': 'warn',
      // no-restricted-imports: Prevent use of deprecated SafeAreaView from react-native, use react-native-safe-area-context instead
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
      // no-restricted-syntax: Prefer type aliases over interfaces for better performance and consistency in TypeScript
      'no-restricted-syntax': [
        'error',
        {
          selector: 'TSInterfaceDeclaration',
          message:
            'Avoid using interfaces, prefer types for better performance and consistency.',
        },
      ],
      // no-unused-vars: Remove unused variables to reduce bundle size and improve clarity, allowing variables/args starting with _ to be ignored
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
