# Override Recipes

These are common override patterns for teams adopting `eslint-config-expo-magic`.

## Adopt the opinionated mobile-app profile

```js
module.exports = require('eslint-config-expo-magic/mobile-app');
```

Use the factory only when the app needs extra project globs:

```js
const {
	createMobileAppConfig,
} = require('eslint-config-expo-magic/mobile-app');

module.exports = createMobileAppConfig({
	extraIgnores: ['generated/**'],
});
```

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

## Enable formatting and testing integrations

The v4 root preset leaves formatting and testing rules off. Their dependencies ship with the package, so enable either integration directly:

```js
const { createConfig } = require('eslint-config-expo-magic');

module.exports = createConfig({
	prettier: true,
	testing: true,
});
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

## Keep testing disabled in a package

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
		additionalRestrictions: [
			{
				name: 'expo-router',
				importNames: ['Link'],
				message: "Use your app's link wrapper.",
			},
		],
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
		additionalSharedComponentPatterns: [
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

The default CLI configuration is intentionally generic. Expo app repositories can opt into the stricter mobile-app preset with an environment variable:

```sh
EXPO_MAGIC_PR_GUARDRAILS_PRESET=mobileApp expo-magic-pr-guardrails
```

For project-specific checks, add `expo-magic.pr-guardrails.cjs`:

```js
module.exports = {
	preset: 'mobileApp',
	additionalRequiredCheckboxes: ['Custom CI passed'],
	additionalProtectedFilePatterns: [/^services\/billing\//],
	ignoredRiskyFilePatterns: [/scripts\/validate-pr-guardrails\.(ts|js)/],
};
```
