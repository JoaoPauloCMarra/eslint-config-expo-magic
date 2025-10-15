const jestPlugin = require('eslint-plugin-jest');
const testingLibraryPlugin = require('eslint-plugin-testing-library');

module.exports = [
  {
    plugins: {
      jest: jestPlugin,
      'testing-library': testingLibraryPlugin,
    },

    files: ['**/*.test.js', '**/*.test.ts', '**/*.test.tsx', '**/*.spec.js', '**/*.spec.ts', '**/*.spec.tsx', 'jest.setup.js'],

    languageOptions: {
      globals: {
        jest: 'readonly',
        expect: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        beforeAll: 'readonly',
        beforeEach: 'readonly',
        afterAll: 'readonly',
        afterEach: 'readonly',
      },
    },

    rules: {
      ...jestPlugin.configs.recommended.rules,
      // jest/no-disabled-tests: Disallow disabled tests
      'jest/no-disabled-tests': 'error',
      // jest/no-test-prefixes: Disallow using f and x prefixes to define Jest tests
      'jest/no-test-prefixes': 'warn',
      // jest/prefer-hooks-on-top: Suggest using hooks at the top level of describe blocks
      'jest/prefer-hooks-on-top': 'error',
      // jest/prefer-to-be: Suggest using toBe() instead of toEqual() for primitive values
      'jest/prefer-to-be': 'warn',

      // testing-library/await-async-queries: Enforce promises from async queries to be handled
      'testing-library/await-async-queries': 'error',
      // testing-library/no-await-sync-queries: Disallow unnecessary await for sync queries
      'testing-library/no-await-sync-queries': 'error',
      // testing-library/no-debugging-utils: Disallow the use of debugging utilities like debug
      'testing-library/no-debugging-utils': 'warn',
      // testing-library/no-dom-import: Disallow importing from DOM Testing Library in RTL setup
      'testing-library/no-dom-import': 'error',
    },
  },
];
