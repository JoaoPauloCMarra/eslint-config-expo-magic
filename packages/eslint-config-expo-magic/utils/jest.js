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
      // jest/no-disabled-tests: Prevent accidentally committed disabled tests that won't run in CI
      'jest/no-disabled-tests': 'error',
      // jest/no-test-prefixes: Avoid focused/skipped tests that might be accidentally committed
      'jest/no-test-prefixes': 'warn',
      // jest/prefer-hooks-on-top: Keep hooks at the top level for better test organization and readability
      'jest/prefer-hooks-on-top': 'error',
      // jest/prefer-to-be: Use toBe() for primitives to avoid potential issues with toEqual() comparisons
      'jest/prefer-to-be': 'warn',

      // testing-library/await-async-queries: Ensure async queries are properly awaited to prevent race conditions
      'testing-library/await-async-queries': 'error',
      // testing-library/no-await-sync-queries: Avoid unnecessary awaits that can slow down tests
      'testing-library/no-await-sync-queries': 'error',
      // testing-library/no-debugging-utils: Prevent debugging utilities from being committed to production code
      'testing-library/no-debugging-utils': 'warn',
      // testing-library/no-dom-import: Prevent DOM Testing Library imports in React Native testing setup
      'testing-library/no-dom-import': 'error',
    },
  },
];
