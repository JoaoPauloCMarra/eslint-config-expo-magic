# ESLint Config Expo Magic - Validation Project

This is a test project to validate that `eslint-config-expo-magic` is working correctly with all its rules and configurations.

## 🚀 Quick Validation

Run the following commands to test the ESLint configuration:

```bash
# Test all files (should show many linting errors intentionally)
bun run lint

# Test TypeScript files specifically
bun run lint:ts

# Test with auto-fix (should fix some issues)
bun run lint:fix

# Run Jest tests (should show testing-related linting errors)
bun test
```

## 📋 Expected Behavior

This project contains **intentional errors** to validate that the ESLint configuration is working correctly. You should see errors for:

### TypeScript Rules ✅
- `@typescript-eslint/no-explicit-any` - Using `any` type
- `@typescript-eslint/no-floating-promises` - Unhandled promises
- `@typescript-eslint/no-confusing-void-expression` - Confusing void returns
- `@typescript-eslint/no-unused-vars` - Unused variables
- `@typescript-eslint/consistent-type-definitions` - Using interfaces instead of types

### React Rules ✅
- `react/no-unstable-nested-components` - Components defined inside render
- `react-hooks/exhaustive-deps` - Missing dependencies in hooks
- `react/jsx-no-useless-fragment` - Unnecessary fragments

### React Native Rules ✅
- `react-native/no-inline-styles` - Inline styles usage
- `no-restricted-imports` - Importing SafeAreaView from react-native

### Import Rules ✅
- `import/order` - Incorrect import ordering
- `import/no-anonymous-default-export` - Anonymous default exports
- `unused-imports/no-unused-imports` - Unused imports

### Jest Rules ✅
- `jest/no-disabled-tests` - Disabled tests (xit)
- `jest/no-focused-tests` - Focused tests (fit)
- `testing-library/await-async-queries` - Missing await for async queries

### Environment-Specific Rules ✅
- Node.js globals in config files (metro.config.js, babel.config.js)
- Browser globals in React components

## 🎯 Validation Checklist

After running `bun run lint`, you should see errors for all the rules above. If you don't see errors for any of these categories, there might be an issue with the configuration.

## 🔧 Fixing Issues

If you find that some rules are not triggering as expected:

1. Check that the file patterns match in your ESLint config
2. Verify that the plugins are properly installed
3. Ensure that the rule names are correct
4. Check that there are no conflicting rules

## 📁 Project Structure

```
test-project/
├── App.tsx                    # Main app with various rule violations
├── components/
│   ├── UnusedComponent.tsx    # Unused component
│   └── BadImports.tsx         # Import order violations
├── utils/
│   └── helpers.ts            # Unused helpers
├── __tests__/
│   └── App.test.tsx          # Jest rule violations
├── metro.config.js           # Node.js environment rules
├── babel.config.js           # Node.js environment rules
└── eslint.config.js          # ESLint configuration
```