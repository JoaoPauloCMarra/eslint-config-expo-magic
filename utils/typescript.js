module.exports = [
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.d.ts'],
    ignores: ['**/node_modules/**'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
        warnOnUnsupportedTypeScriptVersion: true,
      },
    },
    rules: {
      // @typescript-eslint/await-thenable: Prevent awaiting non-Promise values that could cause runtime errors
      '@typescript-eslint/await-thenable': 'error',
      // @typescript-eslint/no-floating-promises: Ensure Promises are properly handled to avoid unhandled rejections
      '@typescript-eslint/no-floating-promises': 'error',
      // @typescript-eslint/no-misused-promises: Prevent using Promises in contexts where they're not expected
      '@typescript-eslint/no-misused-promises': 'off',
      // @typescript-eslint/no-unnecessary-type-assertion: Remove redundant type assertions that don't change the type
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      // @typescript-eslint/prefer-nullish-coalescing: Use nullish coalescing for better null/undefined handling
      '@typescript-eslint/prefer-nullish-coalescing': 'warn',
      // @typescript-eslint/prefer-optional-chain: Use optional chaining for safer property access
      '@typescript-eslint/prefer-optional-chain': 'warn',
      // @typescript-eslint/no-confusing-void-expression: Prevent void expressions in confusing positions
      '@typescript-eslint/no-confusing-void-expression': 'error',
      // @typescript-eslint/no-meaningless-void-operator: Avoid void operator when it doesn't affect types
      '@typescript-eslint/no-meaningless-void-operator': 'error',

      // @typescript-eslint/array-type: Prefer T[] syntax over Array<T> for consistency and readability
      '@typescript-eslint/array-type': [
        'warn',
        {
          default: 'array',
        },
      ],

      // @typescript-eslint/consistent-type-definitions: Prefer type aliases over interfaces for consistency and performance
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      // @typescript-eslint/no-empty-object-type: Avoid empty object types that provide no type safety
      '@typescript-eslint/no-empty-object-type': 'warn',
      // @typescript-eslint/no-explicit-any: Maintain type safety by avoiding the any type
      '@typescript-eslint/no-explicit-any': 'error',
      // @typescript-eslint/no-unnecessary-type-constraint: Remove unnecessary generic constraints
      '@typescript-eslint/no-unnecessary-type-constraint': 'error',
      // @typescript-eslint/no-wrapper-object-types: Avoid wrapper object types that can cause issues
      '@typescript-eslint/no-wrapper-object-types': 'warn',
      // @typescript-eslint/triple-slash-reference: Avoid triple-slash references in favor of modern import methods
      '@typescript-eslint/triple-slash-reference': 'error',

      // @typescript-eslint/consistent-type-assertions: Use 'as' syntax for consistent type assertions
      '@typescript-eslint/consistent-type-assertions': [
        'warn',
        {
          assertionStyle: 'as',
          objectLiteralTypeAssertions: 'allow',
        },
      ],

      // @typescript-eslint/no-extra-non-null-assertion: Avoid unnecessary double non-null assertions
      '@typescript-eslint/no-extra-non-null-assertion': 'warn',
      // @typescript-eslint/no-non-null-assertion: Discourage non-null assertions that can hide type issues
      '@typescript-eslint/no-non-null-assertion': 'warn',

      // @typescript-eslint/no-dupe-class-members: Prevent duplicate class members that cause conflicts
      '@typescript-eslint/no-dupe-class-members': 'error',
      // @typescript-eslint/no-redeclare: Avoid variable redeclaration that can cause confusion
      '@typescript-eslint/no-redeclare': 'warn',

      // @typescript-eslint/no-unused-vars: Remove unused variables to reduce bundle size and improve clarity
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          vars: 'all',
          args: 'none',
          ignoreRestSiblings: true,
          caughtErrors: 'all',
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],

      // @typescript-eslint/no-useless-constructor: Remove unnecessary constructors that add no value
      '@typescript-eslint/no-useless-constructor': 'warn',

      // @typescript-eslint/naming-convention: Enforce consistent naming conventions for better code readability
      '@typescript-eslint/naming-convention': [
        'warn',
        {
          selector: 'typeLike',
          format: ['PascalCase'],
          leadingUnderscore: 'forbid',
        },
        {
          selector: 'enumMember',
          format: ['UPPER_CASE'],
        },
      ],

      // @typescript-eslint/consistent-type-imports: Use type-only imports for better tree-shaking
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
          disallowTypeAnnotations: false,
        },
      ],
      // @typescript-eslint/no-import-type-side-effects: Ensure type imports don't have runtime side effects
      '@typescript-eslint/no-import-type-side-effects': 'error',
    },
  },
];
