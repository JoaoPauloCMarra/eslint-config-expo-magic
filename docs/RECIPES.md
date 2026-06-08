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

## Production Expo app hardening

```js
const { createConfig } = require('eslint-config-expo-magic');

module.exports = createConfig({
	extraIgnores: [
		'.eas/**',
		'.expo/**',
		'.github/**',
		'.vscode/**',
		'assets/**',
		'e2e/**',
		'targets/**',
		'expo-env.d.ts',
	],
	prettier: false,
	appGuardrails: true,
	reactCompiler: true,
	worklets: true,
	storybook: true,
	nativeUi: {
		allowFiles: [
			'**/uikit/components/pressables.tsx',
			'**/uikit/components/scroll-view.tsx',
			'**/uikit/components/modal.tsx',
			'**/hooks/use-navigator.ts',
		],
	},
	featureBoundaries: {
		sharedComponentPatterns: [
			'features/*/components/focus-selection-form.tsx',
			'features/*/components/request-user-phone-flow.tsx',
		],
	},
});
```

## React Compiler hardening only

```js
const { createConfig } = require('eslint-config-expo-magic');

module.exports = createConfig({
	reactCompiler: true,
});
```

## Reanimated and Worklets `scheduleOnRN`

```js
const { createConfig } = require('eslint-config-expo-magic');

module.exports = createConfig({
	worklets: true,
});
```

## Native UI wrapper restrictions

```js
const { createConfig } = require('eslint-config-expo-magic');

module.exports = createConfig({
	nativeUi: {
		allowFiles: [
			'**/uikit/components/pressables.tsx',
			'**/uikit/components/scroll-view.tsx',
			'**/uikit/components/modal.tsx',
		],
	},
});
```

## Feature folder dependency boundaries

```js
const { createConfig } = require('eslint-config-expo-magic');

module.exports = createConfig({
	featureBoundaries: {
		sharedComponentPatterns: [
			'features/*/components/focus-selection-form.tsx',
		],
	},
});
```

## PR guardrails CLI

```json
{
	"scripts": {
		"validate:pr-guardrails": "expo-magic-pr-guardrails"
	}
}
```

The CLI reads `GITHUB_EVENT_NAME`, `GITHUB_EVENT_PATH`, and the pull request diff from Git. For local tests or custom CI integrations, import `validateGuardrails` from `eslint-config-expo-magic/pr-guardrails`.
