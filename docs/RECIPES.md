# Override Recipes

These are common patterns for teams adopting `eslint-config-expo-magic`. Every config goes in `oxlint.config.ts`, which `bun lint` reads.

Each factory returns one oxlint config object, not an array, so you cannot merge configs with a spread. Pass a `createConfig` option when one exists. Otherwise add a block to the returned object with `config.overrides.push({ files, rules })`. Later overrides win.

An override replaces a rule's options. It does not merge them. A rule set to a bare severity, such as `'import/order': 'warn'`, runs with that rule's default options, not the ones the preset configured. The recipes below copy the preset's options where that matters.

In an override, write a rule name the way the config object has it: `typescript/<rule>` and `import/<rule>`, not `@typescript-eslint/<rule>` and `import-x/<rule>`.

## Adopt the opinionated mobile-app profile

```ts
export { default } from 'eslint-config-expo-magic/mobile-app';
```

Use the factory only when the app needs extra project globs:

```ts
import { createMobileAppConfig } from 'eslint-config-expo-magic/mobile-app';

export default createMobileAppConfig({
	extraIgnores: ['generated/**'],
});
```

## Allow `console` in app code but keep it strict in packages

```ts
import { createConfig } from 'eslint-config-expo-magic';

const config = createConfig();

config.overrides.push({
	files: ['app/**', 'src/**'],
	rules: {
		'no-console': 'off',
	},
});

export default config;
```

## Enable formatting and testing integrations

The root preset leaves formatting and testing rules off. Enable either integration directly:

```ts
import { createConfig } from 'eslint-config-expo-magic';

export default createConfig({
	prettier: true,
	testing: true,
});
```

`prettier: true` reports formatting differences from `bun lint` with the `bun/format` rule. `bun fmt` reads the shared options from `.prettierrc.js`:

```js
module.exports = require('eslint-config-expo-magic/prettier');
```

Testing is off by default, so `createConfig()` needs no `testing: false`.

## Keep the default preset but disable one opinionated rule

```ts
import { createConfig } from 'eslint-config-expo-magic';

const config = createConfig();

config.overrides.push({
	files: ['**/*'],
	rules: {
		'no-restricted-imports': 'off',
	},
});

export default config;
```

This turns off every import restriction the preset sets, including the `SafeAreaView` restriction. To keep the preset's restrictions and add to them, use the folder recipe below.

## Relax import ordering

Copy the preset's `import/order` options so the rule keeps its groups and only changes severity:

```ts
import { createConfig } from 'eslint-config-expo-magic';

const config = createConfig();

const order = config.overrides.findLast(
	(override) => override.rules?.['import/order'] !== undefined,
);
const [, ...orderOptions] = order?.rules?.[
	'import/order'
] as readonly unknown[];

config.overrides.push({
	files: ['**/*'],
	rules: {
		'import/order': ['warn', ...orderOptions],
	},
});

export default config;
```

## Base preset first, then re-add only the rules you want

```ts
import base from 'eslint-config-expo-magic/base';

base.overrides.push({
	files: ['**/*'],
	rules: {
		'no-console': 'warn',
		eqeqeq: 'error',
	},
});

export default base;
```

## Web-only overrides in a mixed Expo project

```ts
import { createConfig } from 'eslint-config-expo-magic';

const config = createConfig({ inlineStyles: true });

config.overrides.push({
	files: ['**/*.web.ts', '**/*.web.tsx'],
	rules: {
		'react-native/no-inline-styles': 'off',
	},
});

export default config;
```

## Production Expo app hardening

```ts
import { createConfig } from 'eslint-config-expo-magic';

export default createConfig({
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

```ts
import { createConfig } from 'eslint-config-expo-magic';

export default createConfig({
	reactCompiler: true,
});
```

## Reanimated and Worklets `scheduleOnRN`

```ts
import { createConfig } from 'eslint-config-expo-magic';

export default createConfig({
	worklets: true,
});
```

## Native UI wrapper restrictions

```ts
import { createConfig } from 'eslint-config-expo-magic';

export default createConfig({
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

## Restricted imports for one folder

`createMobileAppRestrictedImportsConfig` is gone in 6.0, and the package exports no helper that keeps the base restrictions for you. An override's `no-restricted-imports` options replace the options set for the same files, so an override with only your new entry drops the `SafeAreaView` restriction in that folder.

Read the preset's options from the config object and extend them:

```ts
import { createConfig } from 'eslint-config-expo-magic';

const config = createConfig({ nativeUi: true });

const restricted = config.overrides.findLast(
	(override) =>
		override.files.includes('**/*') &&
		override.rules?.['no-restricted-imports'] !== undefined,
);
const [, current] = restricted?.rules?.['no-restricted-imports'] as readonly [
	unknown,
	{ paths: readonly unknown[] },
];

config.overrides.push({
	files: ['features/**'],
	rules: {
		'no-restricted-imports': [
			'error',
			{
				...current,
				paths: [
					...current.paths,
					{ name: 'axios', message: 'Use the shared API client.' },
				],
			},
		],
	},
});

export default config;
```

The lookup takes the last override that applies to `**/*` and sets `no-restricted-imports`. The mobile-app profile also sets `no-restricted-imports` for its source folders and its wrapper files, so for that profile copy the options from the override whose `files` cover your folder.

## Feature folder dependency boundaries

```ts
import { createConfig } from 'eslint-config-expo-magic';

export default createConfig({
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

The CLI reads `GITHUB_EVENT_NAME`, `GITHUB_EVENT_PATH`, and the pull request diff from Git. Events other than `pull_request` pass without checks. When `GITHUB_REPOSITORY` and `GITHUB_TOKEN` are set, the CLI reads the current PR body and labels from the GitHub API instead of the event payload. For local tests or custom CI integrations, import `validateGuardrails` from `eslint-config-expo-magic/pr-guardrails`.

Set `fetch-depth: 0` on the `actions/checkout` step so the CLI can find the merge base. The CLI fetches the base branch from `origin`. In a shallow checkout it tries `git fetch --unshallow` when it finds no merge base. If there is still no merge base, it compares the base and head trees directly and prints a warning, so the diff can include changes from the base branch.

`ignoredRiskyFilePatterns` match the repository-relative file path from the diff, for example `scripts/validate-pr-guardrails.ts`, so patterns anchored with `^` work.

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
