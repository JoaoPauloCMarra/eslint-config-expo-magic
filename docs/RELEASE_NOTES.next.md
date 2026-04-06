# Release Notes 2.4.0

## Summary
- Package version: `2.4.0`
- Expo base version: `55.0.0`

## Base vs Expo
### Added
- `expo/prefer-box-shadow`

### Changed
- None

### Removed
- `react-hooks/exhaustive-deps`
- `react-hooks/rules-of-hooks`
- `react/display-name`
- `react/jsx-key`
- `react/jsx-no-comment-textnodes`
- `react/jsx-no-duplicate-props`
- `react/jsx-no-target-blank`
- `react/jsx-no-undef`
- `react/jsx-uses-react`
- `react/jsx-uses-vars`
- `react/no-children-prop`
- `react/no-danger-with-children`
- `react/no-deprecated`
- `react/no-direct-mutation-state`
- `react/no-find-dom-node`
- `react/no-is-mounted`
- `react/no-render-return-value`
- `react/no-string-refs`
- `react/no-this-in-sfc`
- `react/no-unescaped-entities`
- ...and 5 more

## Default vs Expo
### Added
- `@babel/object-curly-spacing`
- `@babel/semi`
- `@stylistic/array-bracket-newline`
- `@stylistic/array-bracket-spacing`
- `@stylistic/array-element-newline`
- `@stylistic/arrow-parens`
- `@stylistic/arrow-spacing`
- `@stylistic/block-spacing`
- `@stylistic/brace-style`
- `@stylistic/comma-dangle`
- `@stylistic/comma-spacing`
- `@stylistic/comma-style`
- `@stylistic/computed-property-spacing`
- `@stylistic/dot-location`
- `@stylistic/eol-last`
- `@stylistic/func-call-spacing`
- `@stylistic/function-call-argument-newline`
- `@stylistic/function-call-spacing`
- `@stylistic/function-paren-newline`
- `@stylistic/generator-star-spacing`
- ...and 427 more

### Changed
- `@typescript-eslint/array-type`
- `@typescript-eslint/consistent-type-assertions`
- `@typescript-eslint/no-unused-vars`
- `import/export`
- `import/first`
- `import/namespace`
- `import/no-duplicates`
- `import/no-named-as-default`
- `import/no-named-as-default-member`
- `import/no-unresolved`
- `no-unused-vars`
- `react-hooks/exhaustive-deps`
- `react/jsx-key`

### Removed
- None

## Preset deltas
### no-prettier vs default
- `@babel/object-curly-spacing`
- `@babel/semi`
- `@stylistic/array-bracket-newline`
- `@stylistic/array-bracket-spacing`
- `@stylistic/array-element-newline`
- `@stylistic/arrow-parens`
- `@stylistic/arrow-spacing`
- `@stylistic/block-spacing`
- `@stylistic/brace-style`
- `@stylistic/comma-dangle`
- `@stylistic/comma-spacing`
- `@stylistic/comma-style`
- `@stylistic/computed-property-spacing`
- `@stylistic/dot-location`
- `@stylistic/eol-last`
- `@stylistic/func-call-spacing`
- `@stylistic/function-call-argument-newline`
- `@stylistic/function-call-spacing`
- `@stylistic/function-paren-newline`
- `@stylistic/generator-star-spacing`
- ...and 339 more

### typed vs default
- `@typescript-eslint/adjacent-overload-signatures`
- `@typescript-eslint/ban-ts-comment`
- `@typescript-eslint/ban-tslint-comment`
- `@typescript-eslint/class-literal-property-style`
- `@typescript-eslint/consistent-generic-constructors`
- `@typescript-eslint/consistent-indexed-object-style`
- `@typescript-eslint/dot-notation`
- `@typescript-eslint/no-array-constructor`
- `@typescript-eslint/no-array-delete`
- `@typescript-eslint/no-base-to-string`
- `@typescript-eslint/no-confusing-non-null-assertion`
- `@typescript-eslint/no-duplicate-enum-values`
- `@typescript-eslint/no-duplicate-type-constituents`
- `@typescript-eslint/no-empty-function`
- `@typescript-eslint/no-for-in-array`
- `@typescript-eslint/no-implied-eval`
- `@typescript-eslint/no-inferrable-types`
- `@typescript-eslint/no-misused-new`
- `@typescript-eslint/no-misused-promises`
- `@typescript-eslint/no-namespace`
- ...and 66 more

### strict vs default
- `@typescript-eslint/no-misused-promises`
- `@typescript-eslint/no-non-null-assertion`

## Upgrade notes
- Review `docs/CONFIG_DIFF.md` before publishing.
- If a new rule is too aggressive, recommend `base`, `no-prettier`, or `createConfig(...)` overrides in release notes.
