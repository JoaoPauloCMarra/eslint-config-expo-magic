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
      // unused-imports/no-unused-imports: Report unused ES6 imports. Default: 'off'
      'unused-imports/no-unused-imports': 'error',

      // import-x/order: Enforce a convention in the order of require() / import statements. Default: 'off'
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
      // import-x/first: Ensure all imports appear before other statements. Default: 'off'
      'import-x/first': 'error',
      // import-x/no-amd: Disallow AMD require and define calls. Default: 'off'
      'import-x/no-amd': 'error',
      // import-x/no-anonymous-default-export: Disallow anonymous default exports. Default: 'off'
      'import-x/no-anonymous-default-export': 'error',
      // import-x/no-webpack-loader-syntax: Disallow webpack loader syntax in imports. Default: 'off'
      'import-x/no-webpack-loader-syntax': 'error',
      // import-x/no-named-as-default: Disallow named exports as default export. Default: 'off'
      'import-x/no-named-as-default': 'error',
    },
  },
];
