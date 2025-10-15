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
      // unused-imports/no-unused-imports: Eliminate dead code to reduce bundle size and improve maintainability
      'unused-imports/no-unused-imports': 'error',

      // import-x/order: Maintain consistent import organization for better code readability and navigation
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
      // import-x/first: Ensure all imports appear before other statements for consistent code structure
      'import-x/first': 'error',
      // import-x/no-amd: Disallow AMD modules as they're not relevant for modern React Native/Expo projects
      'import-x/no-amd': 'error',
      // import-x/no-anonymous-default-export: Require named exports for better tree-shaking and debugging
      'import-x/no-anonymous-default-export': 'error',
      // import-x/no-webpack-loader-syntax: Prevent webpack-specific syntax that doesn't work in Metro bundler
      'import-x/no-webpack-loader-syntax': 'error',
      // import-x/no-named-as-default: Prevent incorrect import patterns that can cause runtime errors
      'import-x/no-named-as-default': 'error',
      // import-x/no-named-as-default-member: Prevent incorrect import patterns that can cause runtime errors
      'import-x/no-named-as-default-member': 'error',
      // import-x/no-cycle: Prevent circular dependencies that can cause runtime issues and hard-to-debug problems
      'import-x/no-cycle': 'error',
    },
  },
];
