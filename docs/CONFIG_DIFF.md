# Config Diff

Package version: `5.0.0`
Expo config version: `57.0.2`

## Effective Rule Counts

| Scope | File | expo | agent | base | default | fast | typed | strict | productionApp |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| app | `apps/mobile/App.tsx` | 83 | 130 | 36 | 122 | 100 | 191 | 123 | 132 |
| package | `packages/shared/src/index.ts` | 83 | 130 | 36 | 122 | 100 | 191 | 123 | 130 |
| test | `apps/mobile/src/__tests__/App.test.tsx` | 83 | 130 | 36 | 122 | 100 | 191 | 123 | 132 |
| story | `apps/mobile/src/components/Button.stories.tsx` | 83 | 130 | 36 | 122 | 100 | 191 | 123 | 132 |
| config | `metro.config.js` | 72 | 97 | 25 | 95 | 82 | 95 | 95 | 97 |
| web | `apps/mobile/src/App.web.tsx` | 83 | 130 | 36 | 122 | 100 | 191 | 123 | 132 |

## Effective Delta Counts

| Scope | Comparison | Added | Changed | Removed |
| --- | --- | ---: | ---: | ---: |
| app | baseVsExpo | 1 | 0 | 48 |
| app | defaultVsExpo | 48 | 3 | 9 |
| app | typedVsDefault | 69 | 14 | 0 |
| app | strictVsDefault | 1 | 2 | 0 |
| app | productionAppVsDefault | 10 | 5 | 0 |
| app | fastVsDefault | 0 | 1 | 22 |
| package | baseVsExpo | 1 | 0 | 48 |
| package | defaultVsExpo | 48 | 3 | 9 |
| package | typedVsDefault | 69 | 14 | 0 |
| package | strictVsDefault | 1 | 1 | 0 |
| package | productionAppVsDefault | 8 | 4 | 0 |
| package | fastVsDefault | 0 | 1 | 22 |
| test | baseVsExpo | 1 | 0 | 48 |
| test | defaultVsExpo | 48 | 3 | 9 |
| test | typedVsDefault | 69 | 14 | 0 |
| test | strictVsDefault | 1 | 2 | 0 |
| test | productionAppVsDefault | 10 | 5 | 0 |
| test | fastVsDefault | 0 | 1 | 22 |
| story | baseVsExpo | 1 | 0 | 48 |
| story | defaultVsExpo | 48 | 3 | 9 |
| story | typedVsDefault | 69 | 14 | 0 |
| story | strictVsDefault | 1 | 2 | 0 |
| story | productionAppVsDefault | 10 | 6 | 0 |
| story | fastVsDefault | 0 | 1 | 22 |
| config | baseVsExpo | 1 | 0 | 48 |
| config | defaultVsExpo | 32 | 3 | 9 |
| config | typedVsDefault | 0 | 0 | 0 |
| config | strictVsDefault | 0 | 1 | 0 |
| config | productionAppVsDefault | 2 | 3 | 0 |
| config | fastVsDefault | 0 | 1 | 13 |
| web | baseVsExpo | 1 | 0 | 48 |
| web | defaultVsExpo | 48 | 3 | 9 |
| web | typedVsDefault | 69 | 14 | 0 |
| web | strictVsDefault | 1 | 2 | 0 |
| web | productionAppVsDefault | 10 | 5 | 0 |
| web | fastVsDefault | 0 | 1 | 22 |

## Aggregate Compatibility

| Preset | Rule count |
| --- | ---: |
| expo | 84 |
| agent | 130 |
| agentGuardrails | 7 |
| base | 36 |
| default | 122 |
| fast | 100 |
| typed | 191 |
| strict | 123 |
| appGuardrails | 4 |
| componentStructure | 4 |
| deprecatedApis | 2 |
| nativeUi | 1 |
| reactCompiler | 7 |
| reanimated | 2 |
| semanticColors | 1 |
| storybook | 1 |
| worklets | 1 |
| productionApp | 132 |

### baseVsExpo

#### Added

- `expo/prefer-box-shadow`

#### Changed

- None

#### Removed

- `import/default`
- `import/export`
- `import/first`
- `import/named`
- `import/namespace`
- `import/no-duplicates`
- `import/no-named-as-default`
- `import/no-named-as-default-member`
- `import/no-unresolved`
- `import/order`
- `react-hooks/config`
- `react-hooks/error-boundaries`
- `react-hooks/exhaustive-deps`
- `react-hooks/gating`
- `react-hooks/globals`
- `react-hooks/immutability`
- `react-hooks/incompatible-library`
- `react-hooks/preserve-manual-memoization`
- `react-hooks/purity`
- `react-hooks/refs`
- `react-hooks/rules-of-hooks`
- `react-hooks/set-state-in-effect`
- `react-hooks/set-state-in-render`
- `react-hooks/static-components`
- `react-hooks/unsupported-syntax`
- `react-hooks/use-memo`
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
- `react/no-unknown-property`
- `react/no-unsafe`
- `react/prop-types`
- `react/react-in-jsx-scope`
- `react/require-render-return`

### defaultVsExpo

#### Added

- `@typescript-eslint/await-thenable`
- `@typescript-eslint/consistent-type-definitions`
- `@typescript-eslint/consistent-type-imports`
- `@typescript-eslint/naming-convention`
- `@typescript-eslint/no-confusing-void-expression`
- `@typescript-eslint/no-explicit-any`
- `@typescript-eslint/no-floating-promises`
- `@typescript-eslint/no-import-type-side-effects`
- `@typescript-eslint/no-meaningless-void-operator`
- `@typescript-eslint/no-non-null-assertion`
- `@typescript-eslint/no-unnecessary-type-assertion`
- `@typescript-eslint/no-unnecessary-type-constraint`
- `@typescript-eslint/prefer-nullish-coalescing`
- `@typescript-eslint/prefer-optional-chain`
- `@typescript-eslint/prefer-readonly`
- `@typescript-eslint/triple-slash-reference`
- `expo/prefer-box-shadow`
- `import-x/default`
- `import-x/export`
- `import-x/first`
- `import-x/named`
- `import-x/namespace`
- `import-x/no-amd`
- `import-x/no-anonymous-default-export`
- `import-x/no-cycle`
- `import-x/no-duplicates`
- `import-x/no-named-as-default`
- `import-x/no-named-as-default-member`
- `import-x/no-unresolved`
- `import-x/no-webpack-loader-syntax`
- `import-x/order`
- `no-console`
- `no-restricted-imports`
- `react-19-upgrade/no-default-props`
- `react-19-upgrade/no-factories`
- `react-19-upgrade/no-legacy-context`
- `react-19-upgrade/no-prop-types`
- `react-19-upgrade/no-string-refs`
- `react-native/no-inline-styles`
- `react-native/no-raw-text`
- `react-native/no-single-element-style-arrays`
- `react-native/no-unused-styles`
- `react-native/split-platform-components`
- `react/jsx-no-leaked-render`
- `react/jsx-no-useless-fragment`
- `react/no-unstable-nested-components`
- `react/self-closing-comp`
- `unused-imports/no-unused-imports`

#### Changed

- `@typescript-eslint/array-type`
- `@typescript-eslint/consistent-type-assertions`
- `@typescript-eslint/no-unused-vars`
- `no-unused-vars`
- `react-hooks/exhaustive-deps`
- `react-hooks/set-state-in-effect`
- `react/jsx-key`

#### Removed

- `import/default`
- `import/export`
- `import/first`
- `import/named`
- `import/namespace`
- `import/no-duplicates`
- `import/no-named-as-default`
- `import/no-named-as-default-member`
- `import/no-unresolved`
- `import/order`

### typedVsDefault

#### Added

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
- `@typescript-eslint/no-non-null-asserted-optional-chain`
- `@typescript-eslint/no-redundant-type-constituents`
- `@typescript-eslint/no-this-alias`
- `@typescript-eslint/no-unsafe-argument`
- `@typescript-eslint/no-unsafe-assignment`
- `@typescript-eslint/no-unsafe-call`
- `@typescript-eslint/no-unsafe-declaration-merging`
- `@typescript-eslint/no-unsafe-enum-comparison`
- `@typescript-eslint/no-unsafe-function-type`
- `@typescript-eslint/no-unsafe-member-access`
- `@typescript-eslint/no-unsafe-return`
- `@typescript-eslint/no-unsafe-unary-minus`
- `@typescript-eslint/no-unused-expressions`
- `@typescript-eslint/non-nullable-type-assertion-style`
- `@typescript-eslint/only-throw-error`
- `@typescript-eslint/prefer-as-const`
- `@typescript-eslint/prefer-find`
- `@typescript-eslint/prefer-for-of`
- `@typescript-eslint/prefer-function-type`
- `@typescript-eslint/prefer-includes`
- `@typescript-eslint/prefer-namespace-keyword`
- `@typescript-eslint/prefer-promise-reject-errors`
- `@typescript-eslint/prefer-regexp-exec`
- `@typescript-eslint/prefer-string-starts-ends-with`
- `@typescript-eslint/require-await`
- `@typescript-eslint/restrict-plus-operands`
- `@typescript-eslint/restrict-template-expressions`
- `@typescript-eslint/unbound-method`
- `constructor-super`
- `dot-notation`
- `getter-return`
- `no-array-constructor`
- `no-class-assign`
- `no-const-assign`
- `no-empty-function`
- `no-func-assign`
- `no-implied-eval`
- `no-import-assign`
- `no-new-native-nonconstructor`
- `no-new-symbol`
- `no-obj-calls`
- `no-setter-return`
- `no-this-before-super`
- `no-throw-literal`
- `prefer-const`
- `prefer-promise-reject-errors`
- `prefer-rest-params`
- `prefer-spread`
- `require-await`

#### Changed

- `@typescript-eslint/array-type`
- `@typescript-eslint/consistent-type-assertions`
- `@typescript-eslint/consistent-type-definitions`
- `@typescript-eslint/no-empty-object-type`
- `@typescript-eslint/no-extra-non-null-assertion`
- `@typescript-eslint/no-require-imports`
- `@typescript-eslint/no-unused-vars`
- `@typescript-eslint/no-wrapper-object-types`
- `@typescript-eslint/prefer-nullish-coalescing`
- `@typescript-eslint/prefer-optional-chain`
- `no-dupe-args`
- `no-dupe-keys`
- `no-unreachable`
- `no-unsafe-negation`
- `no-unused-expressions`
- `no-unused-vars`
- `no-with`

#### Removed

- None

### strictVsDefault

#### Added

- `@typescript-eslint/no-misused-promises`

#### Changed

- `@typescript-eslint/no-non-null-assertion`

#### Removed

- None

### productionAppVsDefault

#### Added

- `@typescript-eslint/ban-ts-comment`
- `@typescript-eslint/no-restricted-types`
- `expo-magic-reanimated/no-shared-value-misuse`
- `expo-magic/default-export-placement`
- `expo-magic/no-inline-props`
- `expo-magic/props-type-order`
- `expo-magic/require-children-usage`
- `no-restricted-properties`
- `no-restricted-syntax`
- `no-warning-comments`

#### Changed

- `@typescript-eslint/no-non-null-assertion`
- `no-console`
- `no-restricted-imports`
- `react-hooks/incompatible-library`
- `react-hooks/unsupported-syntax`
- `react-native/no-inline-styles`

#### Removed

- None

### fastVsDefault

#### Added

- None

#### Changed

- `import-x/no-cycle`

#### Removed

- `@typescript-eslint/await-thenable`
- `@typescript-eslint/naming-convention`
- `@typescript-eslint/no-confusing-void-expression`
- `@typescript-eslint/no-floating-promises`
- `@typescript-eslint/no-meaningless-void-operator`
- `@typescript-eslint/no-unnecessary-type-assertion`
- `@typescript-eslint/prefer-nullish-coalescing`
- `@typescript-eslint/prefer-optional-chain`
- `@typescript-eslint/prefer-readonly`
- `react-hooks/config`
- `react-hooks/error-boundaries`
- `react-hooks/gating`
- `react-hooks/globals`
- `react-hooks/immutability`
- `react-hooks/incompatible-library`
- `react-hooks/preserve-manual-memoization`
- `react-hooks/purity`
- `react-hooks/refs`
- `react-hooks/set-state-in-render`
- `react-hooks/static-components`
- `react-hooks/unsupported-syntax`
- `react-hooks/use-memo`
