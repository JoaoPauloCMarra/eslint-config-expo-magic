const { importX } = require('eslint-plugin-import-x');
const unusedImports = require('eslint-plugin-unused-imports');

module.exports = [
  importX.flatConfigs.recommended,
  importX.flatConfigs.typescript,
  {
    plugins: {
      'unused-imports': unusedImports,
    },
    rules: {
      'sort-imports': 'off',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': 'off',

      'import-x/order': [
        'error',
        {
          'newlines-between': 'never',
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
            'unknown',
            'object',
            'type',
          ],
          pathGroups: [
            {
              pattern: 'react',
              group: 'external',
              position: 'before',
            },
            {
              pattern: 'react-native',
              group: 'external',
              position: 'before',
            },
            {
              pattern: 'expo**',
              group: 'external',
              position: 'before',
            },
            {
              pattern: '@/packages/**',
              group: 'internal',
              position: 'after',
            },
            {
              pattern: '@/**',
              group: 'internal',
              position: 'after',
            },
            {
              pattern: './**',
              group: 'internal',
              position: 'after',
            },
          ],
          pathGroupsExcludedImportTypes: ['react'],
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],
      'import-x/first': 'error',
      'import-x/no-amd': 'error',
      'import-x/no-anonymous-default-export': 'warn',
      'import-x/no-webpack-loader-syntax': 'error',
      'import-x/no-named-as-default': 'error',
      'import-x/prefer-default-export': 'off',
    },
  },
];
