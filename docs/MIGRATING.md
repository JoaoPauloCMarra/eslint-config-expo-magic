# Migration Guide

This guide covers the common upgrade and adoption paths for `eslint-config-expo-magic`.

## From `eslint-config-expo` to `eslint-config-expo-magic`

Use this path when you already lint an Expo app and want stronger defaults without assembling multiple plugins yourself.

### Before

```js
const expoConfig = require('eslint-config-expo/flat');

module.exports = [...expoConfig];
```

### After

```js
module.exports = require('eslint-config-expo-magic');
```

### What changes

- More TypeScript rules
- More React and React Native rules
- Import ordering and unused import cleanup
- Jest and Testing Library rules
- Lint-time Prettier in the default preset

### Lowest-risk path

If you want to move gradually, adopt the `base` preset first:

```js
const base = require('eslint-config-expo-magic/base');

module.exports = [...base];
```

Then move to the default preset once the project is clean enough for stricter rules.

## From `base` to default

Use this path when you already want the package but are not ready for the full default rule set.

### Before

```js
const base = require('eslint-config-expo-magic/base');

module.exports = [...base];
```

### After

```js
module.exports = require('eslint-config-expo-magic');
```

### Typical new failures

- `import-x/order`
- `unused-imports/no-unused-imports`
- `no-console`
- `no-restricted-imports`
- `prettier/prettier`

## From default to `no-prettier`

Use this path if your team formats in editors or CI and does not want formatting failures inside ESLint.

### Before

```js
module.exports = require('eslint-config-expo-magic');
```

### After

```js
const noPrettier = require('eslint-config-expo-magic/no-prettier');

module.exports = [...noPrettier];
```

### What changes

- `prettier/prettier` is removed
- Prettier-compatible ESLint rules still stay disabled where relevant

## From default to `typed`

Use this path when you want type-aware `typescript-eslint` checks.

### Before

```js
module.exports = require('eslint-config-expo-magic');
```

### After

```js
const typed = require('eslint-config-expo-magic/typed');

module.exports = [...typed];
```

### Requirements

- Reachable `tsconfig.json`
- Working type graph for the files being linted

### Typical new failures

- `@typescript-eslint/no-base-to-string`
- Other maintained type-aware rules from `typescript-eslint`

## From default to `strict`

Use this path when the codebase is already stable and you want fewer local exceptions.

### Before

```js
module.exports = require('eslint-config-expo-magic');
```

### After

```js
const { strict } = require('eslint-config-expo-magic');

module.exports = [...strict];
```

### What changes

- `no-console` becomes an error
- Selected TypeScript async and assertion rules become stricter

## Upgrade checklist for new package versions

1. Read the generated config diff in `docs/CONFIG_DIFF.md`.
2. Check release notes for new or stricter rules.
3. Try the new version in CI before enabling autofix.
4. If the new defaults are too aggressive, switch temporarily to `base`, `no-prettier`, or `createConfig(...)` overrides.
