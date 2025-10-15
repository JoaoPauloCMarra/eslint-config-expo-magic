const tsParser = require('@typescript-eslint/parser');
const { importX } = require('eslint-plugin-import-x');

module.exports = [
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.d.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        projectService: true,
        ecmaVersion: 2022,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
        warnOnUnsupportedTypeScriptVersion: true,
      },
    },
    rules: {
      // @typescript-eslint/await-thenable: Disallow awaiting a value that is not a Thenable. Default: 'off'
      '@typescript-eslint/await-thenable': 'error',
      // @typescript-eslint/no-floating-promises: Require Promise-like statements to be handled appropriately. Default: 'off'
      '@typescript-eslint/no-floating-promises': 'error',
      // @typescript-eslint/no-misused-promises: Avoid using promises in places not designed to handle them. Default: 'off'
      '@typescript-eslint/no-misused-promises': 'error',
      // @typescript-eslint/no-unnecessary-type-assertion: Warns for type assertions that do not change the type of an expression. Default: 'off'
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      // @typescript-eslint/prefer-nullish-coalescing: Enforce using the nullish coalescing operator instead of logical chaining. Default: 'off'
      '@typescript-eslint/prefer-nullish-coalescing': 'warn',
      // @typescript-eslint/prefer-optional-chain: Enforce using the optional chaining operator instead of logical chaining. Default: 'off'
      '@typescript-eslint/prefer-optional-chain': 'warn',
      // @typescript-eslint/no-confusing-void-expression: Require expressions of type void to appear in statement position. Default: 'off'
      '@typescript-eslint/no-confusing-void-expression': 'error',
      // @typescript-eslint/no-meaningless-void-operator: Disallow the void operator when it doesn't affect the type. Default: 'off'
      '@typescript-eslint/no-meaningless-void-operator': 'error',

      // @typescript-eslint/array-type: Require using either T[] or Array<T> for arrays. Default: 'off'
      '@typescript-eslint/array-type': [
        'warn',
        {
          default: 'array',
        },
      ],

      // @typescript-eslint/consistent-type-definitions: Enforce type definitions to consistently use either interface or type. Default: 'off'
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      // @typescript-eslint/no-empty-object-type: Disallow the use of empty interfaces. Default: 'off'
      '@typescript-eslint/no-empty-object-type': 'warn',
      // @typescript-eslint/no-explicit-any: Disallow the use of the any type. Default: 'off'
      '@typescript-eslint/no-explicit-any': 'error',
      // @typescript-eslint/no-unnecessary-type-constraint: Disallow unnecessary constraints on generic types. Default: 'off'
      '@typescript-eslint/no-unnecessary-type-constraint': 'error',
      // @typescript-eslint/no-wrapper-object-types: Disallow the use of the Object type. Default: 'off'
      '@typescript-eslint/no-wrapper-object-types': 'warn',
      // @typescript-eslint/triple-slash-reference: Disallow /// <reference path="" /> comments. Default: 'off'
      '@typescript-eslint/triple-slash-reference': 'error',

      // @typescript-eslint/consistent-type-assertions: Enforce consistent usage of type assertions. Default: 'off'
      '@typescript-eslint/consistent-type-assertions': [
        'warn',
        {
          assertionStyle: 'as',
          objectLiteralTypeAssertions: 'allow',
        },
      ],

      // @typescript-eslint/no-extra-non-null-assertion: Disallow extra non-null assertion. Default: 'off'
      '@typescript-eslint/no-extra-non-null-assertion': 'warn',
      // @typescript-eslint/no-non-null-assertion: Disallow non-null assertions using the ! postfix operator. Default: 'off'
      '@typescript-eslint/no-non-null-assertion': 'warn',

      // @typescript-eslint/no-dupe-class-members: Disallow duplicate class members. Default: 'off'
      '@typescript-eslint/no-dupe-class-members': 'error',
      // @typescript-eslint/no-redeclare: Disallow variable redeclaration. Default: 'off'
      '@typescript-eslint/no-redeclare': 'warn',

      // @typescript-eslint/no-unused-vars: Disallow unused variables. Default: 'off'
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

      // @typescript-eslint/no-useless-constructor: Disallow unnecessary constructors. Default: 'off'
      '@typescript-eslint/no-useless-constructor': 'warn',

      // @typescript-eslint/naming-convention: Enforce naming conventions for everything which is not a React component. Default: 'off'
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

      // @typescript-eslint/consistent-type-imports: Enforce consistent usage of type imports. Default: 'off'
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
          disallowTypeAnnotations: false,
        },
      ],
      // @typescript-eslint/no-import-type-side-effects: Disallow type imports that do not affect the runtime. Default: 'off'
      '@typescript-eslint/no-import-type-side-effects': 'error',
    },
  },
];
