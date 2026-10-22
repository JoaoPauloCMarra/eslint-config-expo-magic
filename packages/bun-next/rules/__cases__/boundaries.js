// Cases for the boundaries port, recorded against eslint-plugin-boundaries 7.2.0
// with scripts/record-port-expectations.js.
//
// Every case lints a project in its own root, so Bun sees the files under
// `case-0/`. The Bun settings therefore use relative paths (`case-0`), while the
// recorder gets the same settings with absolute paths through `originalSettings`
// (`<root>` is replaced by the temporary project directory).

const assert = require('node:assert');
const path = require('node:path');

const utilsDirectory = path.resolve(
	__dirname,
	'../../../eslint-config-expo-magic/utils',
);
const featureBoundaries = require(
	path.join(utilsDirectory, 'feature-boundaries.js'),
);
const allExtensions = require(path.join(utilsDirectory, 'extensions.js'));
const { createTypeScriptImportResolverConfig } = require(
	path.join(utilsDirectory, 'config-core.js'),
);

const BUN_ROOT = 'case-0';
const ORIGINAL_ROOT = '<root>';
const SOURCE_FILE = /\.(?:ts|tsx|js|jsx|mjs|cjs)$/;

function sourcesOf(files) {
	return Object.keys(files)
		.filter((file) => !file.startsWith('node_modules/') && SOURCE_FILE.test(file))
		.sort();
}

function fullResolver(root, projects = ['./tsconfig.json']) {
	return {
		node: { extensions: allExtensions },
		typescript: {
			...createTypeScriptImportResolverConfig(
				projects.map((project) => path.posix.join(root, project)),
			),
			tsconfigRootDir: root,
		},
	};
}

function nodeOnlyResolver() {
	return { node: { extensions: ['.js', '.ts', '.tsx'] } };
}

function typescriptOnlyResolver(root) {
	return { typescript: { tsconfigRootDir: root } };
}

const noResolver = () => undefined;

function withSettings(settings, root, resolver) {
	const result = { ...settings, 'boundaries/root-path': root };
	const resolved = resolver(root);
	if (resolved) result['import/resolver'] = resolved;

	return result;
}

function projectCase({
	name,
	rule,
	options,
	files,
	lint,
	settings = {},
	resolver = fullResolver,
}) {
	return {
		name,
		rule,
		...(options ? { options } : {}),
		files,
		lint: lint ?? sourcesOf(files),
		isolate: true,
		settings: withSettings(settings, BUN_ROOT, resolver),
		originalSettings: withSettings(settings, ORIGINAL_ROOT, resolver),
	};
}

function ruleName(fullName) {
	return fullName.replace(/^boundaries\//, '');
}

function ruleArguments(value) {
	return Array.isArray(value) ? value.slice(1) : [];
}

function matchesFiles(entry, file) {
	if (!entry.files) return true;

	return entry.files.some((pattern) => new Bun.Glob(pattern).match(file));
}

// Resolves flat config entries to one case per boundaries rule and distinct
// rule options, linting the files each set of options applies to.
function configCases({ name, entries, files, lint, projects }) {
	const targets = lint ?? sourcesOf(files);
	const settings = {};
	for (const entry of entries) {
		for (const [key, value] of Object.entries(entry.settings ?? {})) {
			if (key.startsWith('boundaries/')) settings[key] = value;
		}
	}
	const groups = new Map();
	for (const target of targets) {
		const effective = {};
		for (const entry of entries) {
			if (!matchesFiles(entry, target)) continue;
			for (const [rule, value] of Object.entries(entry.rules ?? {})) {
				if (rule.startsWith('boundaries/')) effective[rule] = value;
			}
		}
		for (const [rule, value] of Object.entries(effective)) {
			const key = `${rule}\u0000${JSON.stringify(ruleArguments(value))}`;
			const group = groups.get(key) ?? { rule, value, targets: [] };
			group.targets.push(target);
			groups.set(key, group);
		}
	}
	const perRule = new Map();
	for (const group of groups.values()) {
		perRule.set(group.rule, (perRule.get(group.rule) ?? 0) + 1);
	}
	const seen = new Map();

	return [...groups.values()].map((group) => {
		const index = seen.get(group.rule) ?? 0;
		seen.set(group.rule, index + 1);
		const suffix = perRule.get(group.rule) > 1 ? ` #${index + 1}` : '';
		const options = ruleArguments(group.value);

		return projectCase({
			name: `${name}: ${ruleName(group.rule)}${suffix}`,
			rule: ruleName(group.rule),
			...(options.length > 0 ? { options } : {}),
			files,
			lint: group.targets,
			settings,
			resolver: (root) => fullResolver(root, projects),
		});
	});
}

function featureEntries(options) {
	return featureBoundaries.createFeatureBoundaryConfig(options);
}

function featureCase(name, files, extra = {}) {
	const [entry] = featureEntries(extra.featureOptions);

	return projectCase({
		name,
		rule: 'dependencies',
		options: ruleArguments(entry.rules['boundaries/dependencies']),
		files,
		lint: extra.lint,
		settings: { ...entry.settings, ...extra.settings },
		resolver: extra.resolver,
	});
}

const stub = (...imports) =>
	`${imports.map((specifier) => `import '${specifier}';`).join('\n')}\nexport const value = 1;\n`;

const plain = 'export const value = 1;\n';

const tsconfig = `{
  // comments and trailing commas are valid in tsconfig
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"],
      "~feature/*": ["features/*"],
      "#exact": ["services/analytics/track.ts"],
    },
  },
}
`;

const featureLayout = {
	'tsconfig.json': tsconfig,
	'package.json': '{"name":"fixture"}',
	'node_modules/dep-pkg/index.js': plain,
	'node_modules/dep-pkg/package.json': '{"name":"dep-pkg","main":"index.js"}',
	'features/billing/api/client.ts': plain,
	'features/billing/api/nested/deep/client.ts': plain,
	'features/billing/atoms.ts': plain,
	'features/billing/atoms.tsx': plain,
	'features/billing/atoms/state.ts': plain,
	'features/billing/components/summary.tsx': plain,
	'features/billing/hooks/use-total.ts': plain,
	'features/billing/private/secret.ts': plain,
	'features/billing/screens/checkout-screen.tsx': stub(
		'../api/client',
		'../api/nested/deep/client',
		'../components/summary',
		'../hooks/use-total',
		'../private/secret',
		'../atoms',
		'../atoms/state',
		'../../orders/api/client',
		'../../orders/atoms',
		'../../orders/atoms/state',
		'../../orders/components/summary',
		'../../orders/hooks/use-orders',
		'../../orders/screens/orders-screen',
		'../../orders/private/secret',
		'../../../services/analytics/track',
		'../../../hooks/use-thing',
		'../../../uikit/button',
		'../../../app/root',
		'../../../scripts/tool',
		'react',
		'react-native',
		'dep-pkg',
		'node:fs',
		'path',
		'./missing',
		'@/missing',
		'@/features/orders/api/client',
		'~feature/orders/screens/orders-screen',
		'#exact',
		'@/uikit/button',
		'../../../data.json',
	),
	'features/billing/components/uses-private.tsx': stub(
		'../private/secret',
		'../api/client',
	),
	'features/billing/api/uses-api.ts': stub(
		'../../orders/api/client',
		'./client',
		'../hooks/use-total',
	),
	'features/billing/hooks/uses-api.ts': stub(
		'../api/client',
		'../../orders/hooks/use-orders',
	),
	'features/billing/private/uses-all.ts': stub(
		'../screens/checkout-screen',
		'../../../services/analytics/track',
	),
	'features/orders/api/client.ts': plain,
	'features/orders/atoms.ts': plain,
	'features/orders/atoms/state.ts': plain,
	'features/orders/components/summary.tsx': plain,
	'features/orders/hooks/use-orders.ts': plain,
	'features/orders/private/secret.ts': plain,
	'features/orders/screens/orders-screen.tsx': stub(
		'../api/client',
		'../../billing/screens/checkout-screen',
	),
	'services/analytics/track.ts': stub(
		'../../hooks/use-thing',
		'../../uikit/button',
		'../../features/billing/api/client',
	),
	'hooks/use-thing.ts': stub(
		'../services/analytics/track',
		'../features/billing/atoms',
		'../features/billing/api/client',
		'../app/root',
	),
	'uikit/button.tsx': stub(
		'../hooks/use-thing',
		'../services/analytics/track',
		'../features/billing/atoms',
	),
	'app/root.tsx': stub(
		'../features/billing/screens/checkout-screen',
		'../features/billing/components/summary',
		'../features/billing/hooks/use-total',
		'../features/billing/api/client',
		'../features/billing/atoms',
		'../features/billing/atoms/state',
		'../features/billing/private/secret',
		'../services/analytics/track',
		'../hooks/use-thing',
		'../uikit/button',
		'./sub/page',
	),
	'app/sub/page.tsx': stub('../root', '../../features/orders/private/secret'),
	'scripts/tool.ts': stub('../features/billing/api/client'),
	'data.json': '{}',
};

const mobileLayout = {
	'tsconfig.json': tsconfig,
	'package.json': '{"name":"mobile"}',
	'expo-env.d.ts': plain,
	'assets/logo.ts': stub('../features/orders/screens/orders'),
	'app/index.tsx': stub(
		'../features/billing/screens/checkout',
		'../features/dev/tools',
		'../hooks/use-thing',
		'../services/analytics',
		'../utils/format',
		'../types/models',
		'../uikit/button',
		'../modules/payments/client',
		'./dev/panel',
		'../package.json',
		'../assets/logo',
	),
	'app/dev/panel.tsx': stub('../index', '../../features/billing/screens/checkout'),
	'features/dev/tools.ts': stub('../billing/screens/checkout'),
	'features/billing/screens/checkout.tsx': stub(
		'../components/summary',
		'../hooks/use-total',
		'../services/api',
		'../contracts/types',
		'../../orders/services/api',
		'../../orders/screens/orders',
		'../../../hooks/use-thing',
		'../../../services/analytics',
		'../../../utils/format',
		'../../../types/models',
		'../../../uikit/button',
		'../../../modules/payments/client',
		'../../../modules/other/client',
		'../../../app/index',
		'../../../assets/logo',
		'../../../package.json',
		'@/features/orders/screens/orders',
		'react',
		'expo-router',
		'./missing',
	),
	'features/billing/components/summary.tsx': stub(
		'../hooks/use-total',
		'../../orders/components/card',
	),
	'features/billing/hooks/use-total.ts': stub('../services/api'),
	'features/billing/services/api.ts': plain,
	'features/billing/contracts/types.ts': stub('../services/api'),
	'features/billing/domain.ts': stub('./services/api'),
	'features/orders/screens/orders.tsx': plain,
	'features/orders/components/card.tsx': plain,
	'features/orders/services/api.ts': plain,
	'hooks/use-thing.ts': stub(
		'../services/analytics',
		'../uikit/button',
		'../features/billing/hooks/use-total',
	),
	'services/analytics.ts': stub(
		'../utils/format',
		'../hooks/use-thing',
		'../types/models',
	),
	'utils/format.ts': stub('../types/models', '../services/analytics'),
	'types/models.ts': stub('../utils/format', '../services/analytics'),
	'uikit/button.tsx': stub(
		'../hooks/use-thing',
		'../services/analytics',
		'../app/index',
	),
	'modules/payments/client.ts': stub(
		'../../services/analytics',
		'../other/client',
		'../../hooks/use-thing',
		'./helpers',
	),
	'modules/payments/helpers.ts': plain,
	'modules/other/client.ts': plain,
	'scripts/outside.ts': stub('../app/index'),
	'features/loose.ts': stub('./billing/domain', '../utils/format'),
	'utils/uses-loose.ts': stub(
		'../features/loose',
		'../assets/logo',
		'../package.json',
		'node:path',
		'lodash',
	),
};

function boundariesEntries(config) {
	return config.flatMap((entry) => {
		const settingKeys = Object.keys(entry.settings ?? {}).filter((key) =>
			key.startsWith('boundaries/'),
		);
		const ruleEntries = Object.entries(entry.rules ?? {}).filter(([name]) =>
			name.startsWith('boundaries/'),
		);
		if (!settingKeys.length && ruleEntries.length === 0) return [];
		const kept = {};
		if (entry.files) kept.files = entry.files;
		if (settingKeys.length) {
			kept.settings = Object.fromEntries(
				settingKeys.map((key) => [key, entry.settings[key]]),
			);
		}
		if (ruleEntries.length > 0) kept.rules = Object.fromEntries(ruleEntries);
		return [kept];
	});
}

const cases = [];

// boundaries/dependencies with the feature-boundaries layers.
cases.push(
	featureCase('feature layers: lints the feature-boundaries layers', featureLayout),
);

cases.push(
	featureCase('feature layers: report positions for every dependency node kind', {
		'tsconfig.json': '{}',
		'features/billing/api/client.ts': plain,
		'features/orders/screens/orders-screen.tsx': plain,
		'features/orders/components/summary.tsx': plain,
		'features/billing/screens/checkout-screen.tsx': `import type { A } from '../../orders/screens/orders-screen';
import { b, type B } from '../../orders/components/summary';
export * from '../../orders/components/summary';
export * as ns from '../../orders/components/summary';
export type * from '../../orders/screens/orders-screen';
export { c } from '../../orders/components/summary';
export type { D } from '../../orders/screens/orders-screen';
const lazy = import('../../orders/screens/orders-screen');
const old = require('../../orders/components/summary');
const dynamic = require(someVariable);
const nonLiteral = import(otherVariable);
export const value = [A, b, B, lazy, old, dynamic, nonLiteral];
`,
	}),
);

const platformCategories = [
	{ category: 'ios', pattern: '**/*.ios.*' },
	{ category: 'android', pattern: '**/*.android.*' },
	{ category: 'web', pattern: '**/*.web.*' },
	{ category: 'native', pattern: '**/*.native.*' },
	{ category: 'declaration', pattern: '**/*.d.ts' },
	{ category: 'index', pattern: '**/index.*' },
	{ category: 'entry', pattern: '**/entry.ts' },
	{ category: 'tsx', pattern: '**/*.tsx' },
];

cases.push(
	featureCase(
		'feature layers: platform suffixes follow the resolver settings order',
		{
			'tsconfig.json': tsconfig,
			'features/orders/hooks/only-ios.ios.ts': plain,
			'features/orders/hooks/ios-android.ios.ts': plain,
			'features/orders/hooks/ios-android.android.ts': plain,
			'features/orders/hooks/web-plain.web.ts': plain,
			'features/orders/hooks/web-plain.ts': plain,
			'features/orders/hooks/native-plain.native.ts': plain,
			'features/orders/hooks/native-plain.ts': plain,
			'features/orders/hooks/native-web.native.tsx': plain,
			'features/orders/hooks/native-web.web.tsx': plain,
			'features/orders/hooks/types-only.d.ts': plain,
			'features/orders/hooks/types-only.ts': plain,
			'features/orders/hooks/folder/index.ios.ts': plain,
			'features/orders/hooks/folder/index.ts': plain,
			'features/orders/hooks/pkg/package.json': '{"main":"./entry.ts"}',
			'features/orders/hooks/pkg/entry.ts': plain,
			'features/orders/hooks/js-alias.ts': plain,
			'features/orders/hooks/explicit.ios.ts': plain,
			'features/billing/screens/checkout-screen.tsx': stub(
				'../../orders/hooks/only-ios',
				'../../orders/hooks/ios-android',
				'../../orders/hooks/web-plain',
				'../../orders/hooks/native-plain',
				'../../orders/hooks/native-web',
				'../../orders/hooks/types-only',
				'../../orders/hooks/folder',
				'../../orders/hooks/pkg',
				'../../orders/hooks/js-alias.js',
				'../../orders/hooks/explicit.ios',
				'../../orders/hooks/explicit.ios.ts',
				'@/features/orders/hooks/only-ios',
				'@/features/orders/hooks/js-alias',
				'@/features/orders/hooks/types-only',
			),
		},
		{
			lint: ['features/billing/screens/checkout-screen.tsx'],
			settings: {
				'boundaries/files': [
					...platformCategories,
					{ category: 'source', pattern: '**/*.{ts,tsx}' },
				],
			},
		},
	),
);

cases.push(
	featureCase('tsconfig: aliases, extends chains and baseUrl with a single project', {
		'tsconfig.base.json': `{"compilerOptions": {"paths": {"@base/*": ["./features/*"]}}}`,
		'tsconfig.json': `{"extends": "./tsconfig.base.json", "compilerOptions": {"baseUrl": "."}, "include": ["features"]}`,
		'features/orders/api/client.ts': plain,
		'features/orders/api/nested/x/client.ts': plain,
		'src/features/orders/api/client.ts': plain,
		'features/billing/screens/checkout-screen.tsx': stub(
			'@base/orders/api/client',
			'features/orders/api/client',
			'@base/orders/api/nested/x/client',
			'@base/missing/thing',
			'src/features/orders/api/client',
		),
		'services/analytics/track.ts': stub(
			'@base/orders/api/client',
			'features/orders/api/client',
		),
	}),
);

cases.push(
	featureCase(
		'tsconfig: several projects by include and affinity',
		{
			'tsconfig.base.json': `{"compilerOptions": {"paths": {"@base/*": ["./features/*"]}}}`,
			'tsconfig.json': `{"extends": "./tsconfig.base.json", "compilerOptions": {"baseUrl": "."}, "include": ["features", "app"]}`,
			'tools/extra/tsconfig.json': `{"include": ["../../features/billing"], "compilerOptions": {"paths": {"@extra/*": ["../../features/*"]}}}`,
			'apps/mobile/tsconfig.json': `{"include": ["src"], "compilerOptions": {"paths": {"@mobile/*": ["../../features/*"]}}}`,
			'apps/mobile/src/main.ts': plain,
			'features/orders/api/client.ts': plain,
			'features/billing/screens/checkout-screen.tsx': stub(
				'@base/orders/api/client',
				'@extra/orders/api/client',
				'@mobile/orders/api/client',
				'features/orders/api/client',
			),
			'features/orders/screens/orders-screen.tsx': stub(
				'@base/billing/screens/checkout-screen',
				'@extra/billing/screens/checkout-screen',
			),
			'services/analytics/track.ts': stub(
				'@mobile/orders/api/client',
				'@extra/orders/api/client',
				'@base/orders/api/client',
			),
		},
		{
			resolver: (root) =>
				fullResolver(root, [
					'./tsconfig.json',
					'./tools/*/tsconfig.json',
					'./apps/*/tsconfig.json',
				]),
		},
	),
);

const resolverLayout = {
	'features/orders/api/client.ts': plain,
	'features/billing/screens/checkout-screen.tsx': stub(
		'../../orders/api/client',
		'./local.js',
	),
	'features/billing/screens/local.js': plain,
};

cases.push(
	featureCase('resolver: node resolver only', resolverLayout, {
		lint: ['features/billing/screens/checkout-screen.tsx'],
		resolver: nodeOnlyResolver,
	}),
	featureCase('resolver: typescript resolver only', resolverLayout, {
		lint: ['features/billing/screens/checkout-screen.tsx'],
		resolver: typescriptOnlyResolver,
	}),
);

cases.push(
	featureCase(
		'feature options: sharedComponentPatterns and custom feature element types',
		{
			'tsconfig.json': '{}',
			'features/billing/shared/button.tsx': plain,
			'features/orders/shared/button.tsx': plain,
			'features/billing/widgets/card.tsx': plain,
			'features/billing/screens/checkout-screen.tsx': stub(
				'../shared/button',
				'../widgets/card',
				'../../orders/shared/button',
			),
			'features/billing/widgets/uses-shared.tsx': stub(
				'../shared/button',
				'../../orders/shared/button',
			),
			'app/root.tsx': stub(
				'../features/billing/shared/button',
				'../features/billing/widgets/card',
			),
		},
		{
			featureOptions: {
				sharedComponentPatterns: ['features/*/shared/**/*'],
				additionalFeatureElementTypes: ['feature-widget'],
			},
		},
	),
);

// The recommended preset and the createConfig composition must lint the same.
{
	const { createConfig } = require(path.join(utilsDirectory, 'create-config.js'));
	const homeLayout = {
		'tsconfig.json': '{}',
		'features/home/home-screen.tsx': stub(
			'../settings/api/client',
			'../../services/log',
			'./local',
		),
		'features/home/local.ts': plain,
		'features/settings/api/client.ts': plain,
		'services/log.ts': plain,
	};
	const recommended = configCases({
		name: 'home screen: recommended preset',
		entries: boundariesEntries(featureBoundaries.recommended),
		files: homeLayout,
	});
	const composed = configCases({
		name: 'home screen: createConfig composition',
		entries: boundariesEntries(
			createConfig({ preset: 'fast', featureBoundaries: true }),
		),
		files: homeLayout,
	});

	assert.deepStrictEqual(
		composed.map(({ rule, options, settings, lint }) => ({
			rule,
			options,
			settings,
			lint,
		})),
		recommended.map(({ rule, options, settings, lint }) => ({
			rule,
			options,
			settings,
			lint,
		})),
	);
	cases.push(...recommended, ...composed);
}

// mobile-app architecture policies.
{
	const { createMobileAppConfig } = require(path.join(utilsDirectory, 'mobile-app.js'));
	const entries = boundariesEntries(createMobileAppConfig());

	cases.push(
		...configCases({
			name: 'mobile-app preset',
			entries,
			files: mobileLayout,
		}),
	);

	const typesLayout = {
		...mobileLayout,
		'features/billing/screens/types.ts': `type Orders = import('../../orders/services/api').Api;
import legacy = require('../../orders/screens/orders');
import type { X } from '../../orders/components/card';
export type Combined = Orders | X | typeof legacy;
`,
	};

	cases.push(
		...configCases({
			name: 'mobile-app preset: type imports and import-equals',
			entries,
			files: typesLayout,
			lint: ['features/billing/screens/types.ts'],
		}),
	);
}

// Rule options and settings beyond the generated presets.
{
	const baseSettings = {
		'boundaries/elements': [
			{
				type: 'feature',
				pattern: 'features/*',
				partialMatch: false,
				capture: ['name'],
			},
			{ type: 'shared', pattern: 'shared', partialMatch: false },
			{
				type: ['legacy-shared'].join(),
				pattern: ['shared', 'common'],
				partialMatch: false,
			},
			{
				type: 'service',
				pattern: 'services/*',
				partialMatch: false,
				capture: ['service'],
			},
		],
		'boundaries/files': [
			{ category: 'test', pattern: '**/*.test.ts', capture: ['stem'] },
		],
	};
	const layout = {
		'tsconfig.json': '{}',
		'features/a/index.ts': stub(
			'../b/index',
			'../../shared/util',
			'../../services/db/index',
			'lodash',
			'node:fs',
			'../../services/db/index.test',
		),
		'features/b/index.ts': plain,
		'features/a/index.test.ts': stub('./index', '../b/index'),
		'shared/util.ts': stub('../features/a/index'),
		'common/util.ts': plain,
		'services/db/index.ts': stub('../../features/a/index'),
		'services/db/index.test.ts': plain,
		'vendor/skip.ts': stub('../features/a/index'),
	};
	const optionsCase = (name, options, extraSettings = {}) =>
		projectCase({
			name: `dependencies options: ${name}`,
			rule: 'dependencies',
			options: [options],
			files: layout,
			settings: { ...baseSettings, ...extraSettings },
		});

	cases.push(
		optionsCase('matched deny policies with the default message', {
			default: 'allow',
			policies: [
				{
					from: { element: { type: 'feature', captured: { name: '*' } } },
					disallow: {
						to: { element: { type: 'feature', captured: { name: 'b' } } },
					},
				},
				{
					from: { element: { type: 'feature' } },
					disallow: [
						{ to: { element: { type: 'service' } } },
						{ to: { file: { categories: 'test' } } },
					],
					allow: { to: { element: { type: 'shared' } } },
				},
			],
		}),
		optionsCase('last-match-wins, templates, array queries and file selectors', {
			default: 'disallow',
			policies: [
				{
					from: { element: { types: { anyOf: ['feature', 'service'] } } },
					allow: {
						to: {
							element: {
								types: { noneOf: ['legacy-shared'] },
								captured: { name: '{{from.element.captured.name}}' },
							},
						},
					},
				},
				{
					from: {
						element: {
							type: 'feature',
							captured: { name: '{{ from.element.captured.name }}' },
						},
					},
					allow: [
						{ to: { element: { type: 'shared' } } },
						{
							to: {
								element: { type: 'feature', captured: { name: ['a', 'b'] } },
							},
						},
						{
							to: {
								file: {
									categories: { anyOf: ['test'] },
									captured: { stem: 'index.test' },
								},
							},
						},
					],
				},
				{
					to: { element: { type: 'service' } },
					disallow: { from: { element: { type: 'shared' } } },
				},
			],
		}),
		optionsCase('legacy templates, checkAllOrigins, checkInternals and unknown locals', {
			default: 'disallow',
			checkAllOrigins: true,
			checkUnknownLocals: true,
			checkInternals: true,
			policies: [
				{
					from: { element: { type: 'feature' } },
					allow: {
						to: {
							element: { type: 'feature', captured: { name: '${name}' } },
						},
					},
				},
			],
		}),
		optionsCase(
			'handlebars templates without legacy templates',
			{
				default: 'disallow',
				checkAllOrigins: true,
				policies: [
					{
						from: { element: { type: 'feature' } },
						allow: {
							to: {
								element: {
									type: 'feature',
									captured: { name: '{{from.element.captured.name}}' },
								},
							},
						},
					},
				],
			},
			{ 'boundaries/legacy-templates': false },
		),
		optionsCase('custom messages with legacy and handlebars placeholders', {
			default: 'disallow',
			message:
				'Global ${from.type} -> ${dependency.type} via ${dependency.source} ({{dependency.source}})',
			policies: [
				{
					from: { element: { type: 'shared' } },
					disallow: { to: { element: { type: 'feature' } } },
					message:
						'Policy {{policy.index}} {{from.element.type}} -> {{to.element.captured.name}} ${report.path}',
				},
			],
		}),
		optionsCase(
			'multiple element matches',
			{ default: 'disallow', policies: [] },
			{ 'boundaries/elements-single-match': false },
		),
		optionsCase(
			'ignore setting with files-single-match',
			{ default: 'disallow', policies: [] },
			{
				'boundaries/ignore': ['shared/**', 'vendor/*'],
				'boundaries/files-single-match': true,
			},
		),
		optionsCase(
			'include setting',
			{ default: 'disallow', policies: [] },
			{ 'boundaries/include': ['features/**', 'services/**'] },
		),
		optionsCase(
			'flag-as-external, dependency-nodes and additional nodes',
			{ default: 'disallow', checkAllOrigins: true, policies: [] },
			{
				'boundaries/flag-as-external': {
					outsideRootPath: true,
					customSourcePatterns: ['../*/index'],
					unresolvableAlias: false,
				},
				'boundaries/dependency-nodes': ['import', 'export'],
				'boundaries/additional-dependency-nodes': [
					{
						selector: 'CallExpression[callee.name=load] > Literal',
						kind: 'value',
						name: 'load',
					},
				],
			},
		),
	);
}

// no-unknown-dependencies and no-unknown-files.
{
	const settings = {
		'boundaries/elements': [
			{
				type: 'feature',
				pattern: 'features/*',
				partialMatch: false,
				capture: ['name'],
			},
		],
		'boundaries/files': [{ category: 'test', pattern: '**/*.test.ts' }],
		'boundaries/ignore': ['vendor/**'],
	};
	const layout = {
		'tsconfig.json': '{}',
		'node_modules/dep-pkg/index.js': plain,
		'features/a/index.ts': stub(
			'./other',
			'../b/index',
			'../../misc/loose',
			'../../misc/loose.test',
			'../../vendor/skip',
			'../../unknown.json',
			'./missing',
			'react',
			'dep-pkg',
			'node:fs',
		),
		'features/a/other.ts': plain,
		'features/b/index.ts': plain,
		'misc/loose.ts': stub('../features/a/index', '../misc/other'),
		'misc/loose.test.ts': plain,
		'misc/other.ts': plain,
		'vendor/skip.ts': stub('../features/a/index', '../misc/loose'),
		'unknown.json': '{}',
		'other/readme.js': stub('../misc/loose'),
	};
	const unknownCase = (name, rule, options) =>
		projectCase({
			name: `unknown rules: ${name}`,
			rule,
			...(options ? { options } : {}),
			files: layout,
			settings,
		});

	for (const mode of [undefined, 'any', 'element', 'file', 'all']) {
		cases.push(
			unknownCase(
				`no-unknown-dependencies require ${mode ?? 'default'}`,
				'no-unknown-dependencies',
				[mode ? { require: mode } : {}],
			),
		);
	}
	cases.push(
		unknownCase('no-unknown-dependencies bare severity', 'no-unknown-dependencies'),
		unknownCase('no-unknown-files', 'no-unknown-files'),
		unknownCase('combined: dependencies', 'dependencies', [
			{ default: 'allow', policies: [] },
		]),
		unknownCase('combined: no-unknown-dependencies', 'no-unknown-dependencies', [
			{ require: 'element' },
		]),
		unknownCase('combined: no-unknown-files', 'no-unknown-files'),
	);
}

// Glob matching, fuzzed against micromatch through the original plugin.
{
	const tree = [
		'a.ts',
		'ab.ts',
		'a.test.ts',
		'a.spec.tsx',
		'b/a.ts',
		'b/c/a.test.ts',
		'app/index.ts',
		'app/dev/x.ts',
		'app/deep/er/y.ts',
		'app/deep/er/est/z.tsx',
		'features/home/atoms.ts',
		'features/home/atoms.tsx',
		'features/home/api/client.ts',
		'features/home/api/a/b/client.ts',
		'features/home/api/a/b/c/d.ts',
		'features/home/screens/s.tsx',
		'features/billing/atoms/one.ts',
		'features/billing/components/x/y/z.tsx',
		'features/x.ts',
		'.cfg/x.ts',
		'src/.hidden/y.ts',
		'src/xa/yb.ts',
		'src/xb/ya.ts',
		'src/x/y.ts',
	];
	const globFiles = { 'tsconfig.json': '{}' };
	for (const file of tree) globFiles[file] = plain;
	globFiles['zz/src.ts'] = tree.map((file) => `import '../${file}';`).join('\n');

	const pool = [
		'app',
		'features',
		'home',
		'api',
		'*',
		'**',
		'a*',
		'*x',
		'*.ts',
		'*.{ts,tsx}',
		'{app,features}',
		'x?',
		'a?',
		'*a*',
		'src',
		'.hidden',
		'*.test.*',
		'atoms',
		'billing',
		'deep',
		'er',
		'dev',
		'x',
		'b',
		'screens',
		'client.ts',
		'atoms.ts',
	];

	function patterns() {
		const result = new Set([
			...pool,
			'features/*/atoms.ts',
			'features/*/atoms.tsx',
			'features/*/screens/**/*',
			'features/*/api/**/*',
			'features/*/**',
			'features/*',
			'features/*/*',
			'app/**',
			'app/dev',
			'src/*/*.ts',
			'assets/**',
			'**/*.{test,spec}.{ts,tsx,js,jsx}',
			'**/*.{ts,tsx,js,jsx,mjs,cjs,json}',
			'**/atoms.*',
			'**/*.ts',
			'**/deep/**/*.tsx',
			'*/*/atoms.{ts,tsx}',
			'features/**/client.ts',
			'features/*/*/**/d.ts',
			'features/home/api/**/**/client.ts',
		]);
		let seed = 20260101;
		const next = (bound) => {
			seed = (seed * 1103515245 + 12345) % 2147483648;
			return seed % bound;
		};
		while (result.size < 700) {
			const length = 2 + next(3);
			result.add(Array.from({ length }, () => pool[next(pool.length)]).join('/'));
		}
		return [...result];
	}

	const captureNames = ['one', 'two', 'three', 'four'];
	const dependencyOptions = [
		{ default: 'disallow', checkUnknownLocals: true, policies: [] },
	];
	const globCase = (name, settings) =>
		projectCase({
			name,
			rule: 'dependencies',
			options: dependencyOptions,
			files: globFiles,
			lint: ['zz/src.ts'],
			settings,
			resolver: noResolver,
		});
	const all = patterns();
	const batchSize = 14;
	const batches = [];
	for (let start = 0; start < all.length; start += batchSize) {
		batches.push(all.slice(start, start + batchSize));
	}

	// One case lints a batch of patterns at once: every pattern gets its own
	// category or type and its own capture names, so one mismatch shows up in
	// the reported messages.
	batches.forEach((batch, batchIndex) => {
		const label = `${batchIndex * batchSize + 1}-${batchIndex * batchSize + batch.length}`;

		cases.push(
			globCase(`glob fuzz: file descriptors ${label}`, {
				'boundaries/files': [
					{ category: 'any', pattern: '**' },
					...batch.map((pattern, index) => ({
						category: `c${index}`,
						pattern,
						capture: captureNames.map((capture) => `${capture}${index}`),
					})),
				],
			}),
			globCase(`glob fuzz: element descriptors ${label}`, {
				'boundaries/elements-single-match': false,
				'boundaries/elements': batch.map((pattern, index) => ({
					type: `t${index}`,
					pattern,
					partialMatch: false,
					capture: captureNames.map((capture) => `${capture}${index}`),
				})),
				'boundaries/files': [{ category: 'any', pattern: '**' }],
			}),
		);
	});

	// Ignore patterns cannot be told apart in a batch, so each one is its own case.
	for (const pattern of all.slice(0, 110)) {
		cases.push(
			globCase(`glob fuzz: ignore ${pattern}`, {
				'boundaries/ignore': [pattern],
				'boundaries/files': [{ category: 'any', pattern: '**' }],
			}),
		);
	}
}

const names = new Set(cases.map((testCase) => testCase.name));
assert.strictEqual(names.size, cases.length, 'case names must be unique');

function loadOriginalPlugin() {
	return featureBoundaries.createFeatureBoundaryConfig()[0].plugins.boundaries;
}

module.exports = { cases, loadOriginalPlugin };
