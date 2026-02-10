# 📜 Configuration Rationale (The "Why")

This document explains the reasoning behind the opinionated rules enforced by `eslint-config-expo-magic`.

## 🔷 TypeScript

### `@typescript-eslint/consistent-type-definitions`

- **Rule**: Prefer `type` over `interface`.
- **Rationale**: Types provide better performance for the TS compiler and offer more flexible features (unions, intersections).

### `@typescript-eslint/consistent-type-imports`

- **Rule**: Force `import type`.
- **Rationale**: Ensures code is optimized for tree-shaking and clearly separates compile-time dependencies from runtime dependencies.

### `@typescript-eslint/no-unused-vars`

- **Rule**: Error on unused variables, but allow `_` prefix.
- **Rationale**: Cleans up dead code while allowing intentional placeholders for arguments or variables that must be present (e.g., in destructuring).

### `@typescript-eslint/no-explicit-any`

- **Rule**: Error on `any` usage.
- **Rationale**: Defeats the purpose of TypeScript. Use `unknown` or proper types to ensure type safety.

### `@typescript-eslint/no-misused-promises`

- **Rule**: Prevent promises where they are not expected.
- **Rationale**: Catch cases where an async function is passed to a synchronous callback or prop where the returned promise would be ignored.

### `@typescript-eslint/no-redeclare`

- **Rule**: Prevent variable redeclaration.
- **Rationale**: Avoids confusion and potential bugs from accidental redeclaration.

### `@typescript-eslint/no-require-imports`

- **Rule**: Prefer ES6 imports over require().
- **Rationale**: Ensures consistent import style and better tree-shaking support.

### `@typescript-eslint/naming-convention`

- **Rule**: PascalCase for types, UPPER_CASE for enum members.
- **Rationale**: Standardizes terminology and makes code more readable through visual cues.

### Other TypeScript Rules

- **`array-type`**: Prefers `T[]` for consistency.
- **`await-thenable`**: Ensures you don't `await` non-promises.
- **`consistent-type-assertions`**: Enforces `as` syntax instead of angle brackets.
- **`no-confusing-void-expression`**: Prevents assigning `void` results to variables.
- **`no-import-type-side-effects`**: Enforces `import type` to prevent accidental side-effect imports.

## ⚛️ React & React Native

### `react-hooks/exhaustive-deps`

- **Rule**: Error on missing dependencies.
- **Rationale**: Missing dependencies are a leading cause of stale values. We treat this as an error for stability.

### `react-native/no-unused-styles`

- **Rule**: Detect unused `StyleSheet` rules.
- **Rationale**: Keeps mobile bundles lean by identifying dead code in styles.

### `react/jsx-key`

- **Rule**: Hard error on missing keys in lists.
- **Rationale**: Missing keys cause unpredictable UI behavior and performance issues during list reconciliation.

### `react/jsx-no-leaked-render`

- **Rule**: Prevent `0` or `NaN` from rendering in JSX (`{count && <View />}`).
- **Rationale**: In React Native, rendering strings (like `0`) outside of a `<Text>` component causes a crash.

### `react/self-closing-comp`

- **Rule**: Force self-closing for components without children.
- **Rationale**: Cleaner JSX structure and improved readability.

### `react-native/split-platform-components`

- **Rule**: Prevent using platform-specific components on the wrong platform.
- **Rationale**: Catches crashes before they happen on devices.

### `react-native/no-single-element-style-arrays`

- **Rule**: Disallow single-element arrays in style props (e.g. `style={[styles.foo]}`).
- **Rationale**: Use the object directly for clarity and to avoid unnecessary array allocation.

### React Compiler Rules

- **`react-hooks/immutability`**: Ensures proper immutable updates in React components.
- **`react-hooks/refs`**: Prevents accessing refs during render and other ref-related issues.
- **`react-hooks/purity`**: Ensures component functions remain pure (no side effects during render).
- **`react-hooks/unsupported-syntax`**: Blocks syntax that cannot be optimized by React Compiler.
- **`react-hooks/set-state-in-render`**: Prevents calling setState during render (causes infinite loops).
- **`react-hooks/preserve-manual-memoization`**: Ensures manual memoization doesn't conflict with compiler optimizations.

**Rationale**: These rules work with React Compiler to catch performance issues and ensure components can be safely optimized.

## 📦 Imports & Organization

### `unused-imports/no-unused-imports`

- **Rule**: Auto-remove unused imports.
- **Rationale**: Keeps files clean and prevents tree-shaking failures.

### `import-x/order`

- **Rule**: Logical grouping (React/Expo -> External -> Internal) + Alphabetical sorting.
- **Rationale**: Predictable import blocks and eliminated merge conflicts.

### `import-x/no-cycle`

- **Rule**: Prevent circular dependencies.
- **Rationale**: Circular dependencies cause complex runtime bugs and make code harder to refactor.

### `import-x/no-anonymous-default-export`

- **Rule**: Disallow `export default () => {}`.
- **Rationale**: Anonymous exports make debugging harder by losing name traces in devtools and stack traces.

### `import-x/no-duplicates`

- **Rule**: Disallow duplicated imports from the same module.
- **Rationale**: Prevents redundant imports and keeps import blocks clean and predictable.

### `import-x/no-unresolved`

- **Rule**: Ensure all imports can be resolved.
- **Rationale**: Catches typos and missing dependencies early.

### `import-x/no-named-as-default-member`

- **Rule**: Prevent importing named exports as default members.
- **Rationale**: Ensures correct import syntax and prevents runtime errors.

## 🧪 Testing

### `testing-library/await-async-queries`

- **Rule**: Error on sync queries; use async finders.
- **Rationale**: Ensures tests wait for async UI updates and avoid flaky assertions.

### `testing-library/no-await-sync-queries`

- **Rule**: Error on awaiting sync query APIs.
- **Rationale**: Prevents unnecessary awaits and clarifies intent.

### `jest/prefer-hooks-on-top`

- **Rule**: Keep setup/teardown hooks at the top of the test block.
- **Rationale**: Logical separation of setup code from actual test cases.

### `testing-library/no-debugging-utils`

- **Rule**: Warn on `debug()` in tests.
- **Rationale**: Prevents accidental pollution of CI logs with large DOM snapshots.

### `testing-library/no-dom-import`

- **Rule**: Disallow `@testing-library/dom`.
- **Rationale**: In React Native, you should use `@testing-library/react-native` instead of DOM-based testing utils.

## 🛠️ General & DX

### Core JavaScript Rules

- **`eqeqeq`**: Enforce strict equality (`===` and `!==`).
- **`no-dupe-args`**: Prevent duplicate function parameters.
- **`no-dupe-keys`**: Prevent duplicate object keys.
- **`no-duplicate-case`**: Prevent duplicate case labels in switch statements.
- **`no-empty-pattern`**: Prevent empty destructuring patterns.
- **`no-extend-native`**: Prevent extending native objects.
- **`no-unreachable`**: Prevent unreachable code after return/throw.
- **`no-unsafe-negation`**: Prevent unsafe negation of left side of relational operators.
- **`no-unused-expressions`**: Prevent unused expressions.
- **`no-unused-labels`**: Prevent unused labels.
- **`no-var`**: Prefer `let`/`const` over `var`.
- **`no-with`**: Disallow `with` statements.

**Rationale**: These rules enforce modern JavaScript best practices and prevent common bugs.

### `no-console`

- **Rule**: Warn in apps, Error in packages.
- **Rationale**: Prevents accidental logs in production while allowing them for app debugging.

### `expo/no-dynamic-env-var`

- **Rule**: Prevent dynamic access to `process.env` in Expo apps.
- **Rationale**: Ensures environment variables are statically analyzable for Metro and EAS builds.

### `expo/no-env-var-destructuring`

- **Rule**: Disallow destructuring `process.env` in Expo client code.
- **Rationale**: Encourages explicit, prefixed env var access to avoid bundling secrets.

### `expo/prefer-box-shadow`

- **Rule**: Prefer `boxShadow` prop over legacy shadow props.
- **Rationale**: Modern styling practice for cross-platform consistency in Expo SDK 50+.

### Mobile-first infrastructure

#### `no-restricted-imports` (SafeAreaView)

- **Rule**: Disallow `SafeAreaView` from `react-native`.
- **Rationale**: Forces the use of `react-native-safe-area-context` which is significantly more robust for edge-to-edge layouts.

### `process.env` restriction

- **Rule**: Disabled by default. Enable this rule in project overrides if you want to restrict client-side `process.env` usage.
- **Rationale**: Expo only exposes `EXPO_PUBLIC_` env vars to client bundles. Some teams prefer hard enforcement, others keep this as a local policy.

**Examples**

```ts
// Allowed
const apiUrl = process.env.EXPO_PUBLIC_API_URL;
const env = process.env.NODE_ENV;

// Example restriction when enabled
const secret = process.env.DATABASE_URL;
```

---

_Made with ❤️ for the Expo community._
