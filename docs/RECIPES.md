# Override Recipes

These are common override patterns for teams adopting `eslint-config-expo-magic`.

## Allow `console` in app code but keep it strict in packages

```js
const config = require('eslint-config-expo-magic');

module.exports = [
	...config,
	{
		files: ['app/**', 'src/**'],
		rules: {
			'no-console': 'off',
		},
	},
];
```

## Turn off lint-time Prettier

```js
const noPrettier = require('eslint-config-expo-magic/no-prettier');

module.exports = [...noPrettier];
```

## Keep the default preset but disable one opinionated rule

```js
const config = require('eslint-config-expo-magic');

module.exports = [
	...config,
	{
		rules: {
			'no-restricted-imports': 'off',
		},
	},
];
```

## Relax import ordering

```js
const config = require('eslint-config-expo-magic');

module.exports = [
	...config,
	{
		rules: {
			'import-x/order': 'warn',
		},
	},
];
```

## Disable Jest and Testing Library rules in a package

```js
const { createConfig } = require('eslint-config-expo-magic');

module.exports = [
	...createConfig({
		testing: false,
	}),
];
```

## Custom monorepo `tsconfig` layout

```js
const { createConfig } = require('eslint-config-expo-magic');

module.exports = [
	...createConfig({
		tsconfigProjects: [
			'./tsconfig.json',
			'./apps/*/tsconfig.json',
			'./packages/*/tsconfig.eslint.json',
		],
	}),
];
```

## Base preset first, then re-add only the rules you want

```js
const base = require('eslint-config-expo-magic/base');

module.exports = [
	...base,
	{
		rules: {
			'no-console': 'warn',
			'import-x/order': 'error',
		},
	},
];
```

## Web-only overrides in a mixed Expo project

```js
const config = require('eslint-config-expo-magic');

module.exports = [
	...config,
	{
		files: ['**/*.web.ts', '**/*.web.tsx'],
		rules: {
			'react-native/no-raw-text': 'off',
		},
	},
];
```
