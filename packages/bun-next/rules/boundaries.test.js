'use strict';

const { afterAll, describe, expect, it } = require('bun:test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { Linter } = require('eslint');
const tsParser = require('@typescript-eslint/parser');

const port = require('./boundaries.js');

const utilsDirectory = path.resolve(
	__dirname,
	'../../eslint-config-expo-magic/utils',
);
const featureBoundaries = require(
	path.join(utilsDirectory, 'feature-boundaries.js'),
);
const allExtensions = require(path.join(utilsDirectory, 'extensions.js'));
const { createTypeScriptImportResolverConfig } = require(
	path.join(utilsDirectory, 'config-core.js'),
);

const scratchRoot = fs.realpathSync(
	fs.mkdtempSync(path.join(os.tmpdir(), 'boundaries-port-')),
);

afterAll(() => {
	fs.rmSync(scratchRoot, { recursive: true, force: true });
});

function createProject(files) {
	const root = fs.mkdtempSync(path.join(scratchRoot, 'project-'));
	for (const [relative, content] of Object.entries(files)) {
		const target = path.join(root, relative);
		fs.mkdirSync(path.dirname(target), { recursive: true });
		fs.writeFileSync(target, content);
	}
	return root;
}

const SOURCE_FILE = /\.(?:ts|tsx|js|jsx|mjs|cjs)$/;

function listSources(root, directory = root) {
	return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
		if (entry.name === 'node_modules') return [];
		const full = path.join(directory, entry.name);
		if (entry.isDirectory()) return listSources(root, full);
		return SOURCE_FILE.test(entry.name) ? [path.relative(root, full)] : [];
	});
}

function withPlugin(entries, plugin) {
	if (!plugin) return entries;
	return entries.map((entry) =>
		entry.plugins?.boundaries
			? { ...entry, plugins: { ...entry.plugins, boundaries: plugin } }
			: entry,
	);
}

function lintProject(root, entries, options = {}) {
	const warn = console.warn;
	console.warn = () => {};
	try {
		return lintQuietly(root, entries, options);
	} finally {
		console.warn = warn;
	}
}

function lintQuietly(root, entries, { plugin, files, settings = {} }) {
	const linter = new Linter({ cwd: root, configType: 'flat' });
	const config = [
		{
			files: ['**/*.{ts,tsx,js,jsx,mjs,cjs}'],
			languageOptions: { parser: tsParser, sourceType: 'module' },
		},
		...withPlugin(entries, plugin),
		{ settings: { 'boundaries/root-path': root, ...settings } },
	];
	const results = {};
	for (const relative of files ?? listSources(root).sort()) {
		const absolute = path.join(root, relative);
		results[relative] = linter
			.verify(fs.readFileSync(absolute, 'utf8'), config, { filename: absolute })
			.map(
				({ ruleId, severity, line, column, endLine, endColumn, message }) => ({
					ruleId,
					severity,
					line,
					column,
					endLine,
					endColumn,
					message,
				}),
			);
	}
	return results;
}

function compare(root, entries, options) {
	const original = lintProject(root, entries, options);
	const ported = lintProject(root, entries, { ...options, plugin: port });
	expect(ported).toEqual(original);
	return original;
}

function findings(results) {
	return Object.values(results).flat();
}

function messagesOf(results, relative) {
	return results[relative].map((entry) => entry.message);
}

function resolverEntry(root, projects = ['./tsconfig.json'], extra = {}) {
	return {
		settings: {
			'import/resolver': {
				node: { extensions: allExtensions },
				typescript: {
					...createTypeScriptImportResolverConfig(
						projects.map((project) => path.resolve(root, project)),
					),
					tsconfigRootDir: root,
				},
			},
		},
		...extra,
	};
}

function featureEntries(root, options) {
	return [
		...featureBoundaries.createFeatureBoundaryConfig(options),
		resolverEntry(root),
	];
}

function boundariesEntries(config) {
	return config.flatMap((entry) => {
		const settingKeys = Object.keys(entry.settings ?? {}).filter(
			(key) => key.startsWith('boundaries/') || key === 'import/resolver',
		);
		const ruleEntries = Object.entries(entry.rules ?? {}).filter(([name]) =>
			name.startsWith('boundaries/'),
		);
		const rule = ruleEntries.length > 0;
		if (!settingKeys.length && !entry.plugins?.boundaries && !rule) return [];
		const kept = {};
		if (entry.files) kept.files = entry.files;
		if (entry.plugins?.boundaries)
			kept.plugins = { boundaries: entry.plugins.boundaries };
		if (settingKeys.length) {
			kept.settings = Object.fromEntries(
				settingKeys.map((key) => [key, entry.settings[key]]),
			);
		}
		if (rule) kept.rules = Object.fromEntries(ruleEntries);
		return [kept];
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

describe('boundaries/dependencies port against eslint-plugin-boundaries 7.2.0', () => {
	it('lints the feature-boundaries layers like the original plugin', () => {
		const root = createProject(featureLayout);
		const results = compare(root, featureEntries(root));
		const checkout = messagesOf(
			results,
			'features/billing/screens/checkout-screen.tsx',
		);

		expect(checkout.length).toBeGreaterThan(5);
		expect(
			checkout.some((message) =>
				message.includes('captured values: feature="orders"'),
			),
		).toBe(true);
		expect(findings(results).length).toBeGreaterThan(15);
		expect(results['app/root.tsx'].length).toBeGreaterThan(0);
	});

	it('keeps the same report positions for every dependency node kind', () => {
		const root = createProject({
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
		});
		const results = compare(root, featureEntries(root));

		expect(
			results['features/billing/screens/checkout-screen.tsx'].length,
		).toBeGreaterThanOrEqual(8);
	});

	it('resolves platform suffixes in the order of the resolver settings', () => {
		const root = createProject({
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
		});
		const categories = [
			{ category: 'ios', pattern: '**/*.ios.*' },
			{ category: 'android', pattern: '**/*.android.*' },
			{ category: 'web', pattern: '**/*.web.*' },
			{ category: 'native', pattern: '**/*.native.*' },
			{ category: 'declaration', pattern: '**/*.d.ts' },
			{ category: 'index', pattern: '**/index.*' },
			{ category: 'entry', pattern: '**/entry.ts' },
			{ category: 'tsx', pattern: '**/*.tsx' },
		];
		const results = compare(root, featureEntries(root), {
			files: ['features/billing/screens/checkout-screen.tsx'],
			settings: {
				'boundaries/files': [
					...categories,
					{ category: 'source', pattern: '**/*.{ts,tsx}' },
				],
			},
		});
		const messages = messagesOf(
			results,
			'features/billing/screens/checkout-screen.tsx',
		);

		expect(messages.length).toBeGreaterThanOrEqual(8);
		expect(
			messages.some((message) => message.includes('categories "ios"')),
		).toBe(true);
		expect(messages.some((message) => message.includes('"android"'))).toBe(
			true,
		);
	});

	it('resolves tsconfig aliases, extends chains and baseUrl with a single project', () => {
		const root = createProject({
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
		});
		const results = compare(root, featureEntries(root));

		expect(
			messagesOf(results, 'features/billing/screens/checkout-screen.tsx')
				.length,
		).toBe(2);
		expect(messagesOf(results, 'services/analytics/track.ts').length).toBe(2);
	});

	it('picks the matching tsconfig of several projects by include and affinity', () => {
		const root = createProject({
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
		});
		const entries = [
			...featureBoundaries.createFeatureBoundaryConfig(),
			resolverEntry(root, [
				'./tsconfig.json',
				'./tools/*/tsconfig.json',
				'./apps/*/tsconfig.json',
			]),
		];
		const results = compare(root, entries);

		expect(findings(results).length).toBeGreaterThanOrEqual(4);
	});

	it('works without tsconfig projects and with the node resolver only', () => {
		const root = createProject({
			'features/orders/api/client.ts': plain,
			'features/billing/screens/checkout-screen.tsx': stub(
				'../../orders/api/client',
				'./local.js',
			),
			'features/billing/screens/local.js': plain,
		});
		const nodeOnly = [
			...featureBoundaries.createFeatureBoundaryConfig(),
			{
				settings: {
					'import/resolver': { node: { extensions: ['.js', '.ts', '.tsx'] } },
				},
			},
		];
		const results = compare(root, nodeOnly, {
			files: ['features/billing/screens/checkout-screen.tsx'],
		});
		const typescriptOnly = compare(
			root,
			[
				...featureBoundaries.createFeatureBoundaryConfig(),
				{
					settings: {
						'import/resolver': { typescript: { tsconfigRootDir: root } },
					},
				},
			],
			{ files: ['features/billing/screens/checkout-screen.tsx'] },
		);

		expect(findings(results).length).toBeGreaterThan(0);
		expect(findings(typescriptOnly).length).toBeGreaterThan(0);
	});

	it('adds sharedComponentPatterns and custom feature element types', () => {
		const root = createProject({
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
		});
		const options = {
			sharedComponentPatterns: ['features/*/shared/**/*'],
			additionalFeatureElementTypes: ['feature-widget'],
		};
		const results = compare(root, featureEntries(root, options));

		expect(findings(results).length).toBeGreaterThan(0);
	});

	it('matches the recommended and createConfig compositions on the home screen', () => {
		const { createConfig } = require(
			path.join(utilsDirectory, 'create-config.js'),
		);
		const root = createProject({
			'tsconfig.json': '{}',
			'features/home/home-screen.tsx': stub(
				'../settings/api/client',
				'../../services/log',
				'./local',
			),
			'features/home/local.ts': plain,
			'features/settings/api/client.ts': plain,
			'services/log.ts': plain,
		});
		const composed = boundariesEntries(
			createConfig({ preset: 'fast', featureBoundaries: true }),
		);
		const results = [
			compare(root, [...featureBoundaries.recommended, resolverEntry(root)]),
			compare(root, [...composed, resolverEntry(root)]),
		];

		expect(results[0]).toEqual(results[1]);
		expect(findings(results[0]).length).toBeGreaterThan(0);
	});

	describe('mobile-app architecture policies', () => {
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
			'app/dev/panel.tsx': stub(
				'../index',
				'../../features/billing/screens/checkout',
			),
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

		it('lints the mobile-app preset like the original plugin', () => {
			const { createMobileAppConfig } = require(
				path.join(utilsDirectory, 'mobile-app.js'),
			);
			const root = createProject(mobileLayout);
			const entries = [
				...boundariesEntries(createMobileAppConfig()),
				resolverEntry(root),
			];
			const results = compare(root, entries);

			expect(findings(results).length).toBeGreaterThan(10);
			expect(results['assets/logo.ts']).toEqual([]);
			expect(results['scripts/outside.ts']).toEqual([]);
			expect(
				findings(results).some(
					(entry) => entry.ruleId === 'boundaries/no-unknown-dependencies',
				),
			).toBe(true);
		});

		it('lints type imports and import-equals through the additional nodes', () => {
			const { createMobileAppConfig } = require(
				path.join(utilsDirectory, 'mobile-app.js'),
			);
			const root = createProject({
				...mobileLayout,
				'features/billing/screens/types.ts': `type Orders = import('../../orders/services/api').Api;
import legacy = require('../../orders/screens/orders');
import type { X } from '../../orders/components/card';
export type Combined = Orders | X | typeof legacy;
`,
			});
			const entries = [
				...boundariesEntries(createMobileAppConfig()),
				resolverEntry(root),
			];
			const results = compare(root, entries, {
				files: ['features/billing/screens/types.ts'],
			});

			expect(findings(results).length).toBeGreaterThan(0);
		});
	});

	describe('rule options and settings beyond the generated presets', () => {
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

		function run(options, extraSettings = {}, extraRules = {}) {
			const root = createProject(layout);
			const entries = [
				{
					plugins: featureBoundaries.createFeatureBoundaryConfig()[0].plugins,
					settings: { ...baseSettings, ...extraSettings },
					rules: {
						'boundaries/dependencies': ['error', options],
						...extraRules,
					},
				},
				resolverEntry(root),
			];
			return compare(root, entries);
		}

		it('reports matched deny policies with the generated default message', () => {
			const results = run({
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
			});

			expect(findings(results).length).toBeGreaterThan(0);
		});

		it('supports last-match-wins, templates, array queries and file selectors', () => {
			const results = run({
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
			});

			expect(findings(results).length).toBeGreaterThan(0);
		});

		it('handles legacy templates, checkAllOrigins, checkInternals and unknown locals', () => {
			const withLegacy = run({
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
			});
			const withoutLegacy = run(
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
			);

			expect(findings(withLegacy).length).toBeGreaterThan(0);
			expect(findings(withoutLegacy).length).toBeGreaterThan(0);
			expect(
				findings(withLegacy).some((entry) =>
					entry.message.includes('module with origin "external"'),
				),
			).toBe(true);
		});

		it('renders custom messages with legacy and handlebars placeholders', () => {
			const results = run({
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
			});

			expect(
				findings(results).some((entry) =>
					entry.message.startsWith('Policy 0 shared -> a'),
				),
			).toBe(true);
			expect(
				findings(results).some((entry) => entry.message.startsWith('Global')),
			).toBe(true);
		});

		it('supports multiple element matches, ignore and include settings', () => {
			const multiple = run(
				{ default: 'disallow', policies: [] },
				{ 'boundaries/elements-single-match': false },
			);
			const ignored = run(
				{ default: 'disallow', policies: [] },
				{
					'boundaries/ignore': ['shared/**', 'vendor/*'],
					'boundaries/files-single-match': true,
				},
			);
			const included = run(
				{ default: 'disallow', policies: [] },
				{ 'boundaries/include': ['features/**', 'services/**'] },
			);

			expect(findings(multiple).length).toBeGreaterThan(0);
			expect(findings(ignored).length).toBeGreaterThan(0);
			expect(findings(included).length).toBeGreaterThan(0);
		});

		it('supports flag-as-external, dependency-nodes and additional nodes', () => {
			const results = run(
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
			);

			expect(findings(results).length).toBeGreaterThan(0);
		});

		it('rejects unsupported settings and options with a clear error', () => {
			const attempt = (options, settings = {}) => {
				const root = createProject(layout);
				const entries = [
					{
						plugins: featureBoundaries.createFeatureBoundaryConfig()[0].plugins,
						settings: { ...baseSettings, ...settings },
						rules: { 'boundaries/dependencies': ['error', options] },
					},
					resolverEntry(root),
				];
				return () =>
					lintProject(root, entries, {
						plugin: port,
						files: ['features/a/index.ts'],
					});
			};
			const policy = {
				policies: [
					{
						from: { element: { type: 'feature' } },
						allow: { to: { element: { type: 'feature' } } },
					},
				],
			};

			expect(attempt({ ...policy, unknown: true })).toThrow(
				/unsupported property "unknown"/,
			);
			expect(
				attempt({ policies: [{ from: 'feature', allow: ['feature'] }] }),
			).toThrow(/legacy/);
			expect(
				attempt({
					policies: [
						{
							from: { element: { type: 'feature', parent: { type: 'x' } } },
							allow: { to: { element: { type: 'feature' } } },
						},
					],
				}),
			).toThrow(/parent/);
			expect(
				attempt({
					policies: [
						{
							from: { element: { type: 'feature' } },
							allow: {
								dependency: { relationship: { to: 'child' } },
								to: { element: { type: 'feature' } },
							},
						},
					],
				}),
			).toThrow(/relationship/);
			expect(
				attempt({ ...policy, message: 'see ${from.parent.type}' }),
			).toThrow(/parent/);
			expect(attempt({ ...policy, message: '{{#if from}}x{{/if}}' })).toThrow(
				/unsupported template expression/,
			);
			expect(
				attempt({
					...policy,
					policies: [
						{
							from: { element: { type: 'feature' } },
							allow: { to: { element: { type: '{{ #each x }}' } } },
						},
					],
				}),
			).toThrow(/unsupported template expression/);
			expect(attempt(policy, { 'boundaries/types': ['feature'] })).toThrow(
				/unsupported setting "boundaries\/types"/,
			);
			expect(attempt(policy, { 'boundaries/alias': {} })).toThrow(
				/unsupported setting/,
			);
			expect(
				attempt(policy, { 'boundaries/debug': { enabled: true } }),
			).toThrow(/debug/);
			expect(
				attempt(policy, {
					'boundaries/elements': [{ type: 'a', pattern: 'a' }],
				}),
			).toThrow(/partialMatch: false/);
			expect(
				attempt(policy, {
					'boundaries/elements': [
						{ type: 'a', pattern: 'a', partialMatch: false, mode: 'file' },
					],
				}),
			).toThrow(/unsupported property "mode"/);
			expect(attempt(policy, { 'boundaries/elements': ['legacy'] })).toThrow(
				/legacy string/,
			);
			expect(
				attempt(policy, {
					'boundaries/elements': [
						{ type: 'a', pattern: 'a/[bc]', partialMatch: false },
					],
				}),
			).toThrow(/unsupported glob/);
			expect(attempt(policy, { 'import/resolver': { webpack: {} } })).toThrow(
				/unsupported import resolver "webpack"/,
			);
			expect(attempt(policy, { 'boundaries/legacy-templates': 'yes' })).toThrow(
				/must be a boolean/,
			);
		});
	});

	describe('no-unknown-dependencies and no-unknown-files', () => {
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

		function run(rules, extraSettings = {}) {
			const root = createProject(layout);
			const entries = [
				{
					plugins: featureBoundaries.createFeatureBoundaryConfig()[0].plugins,
					settings: { ...settings, ...extraSettings },
					rules,
				},
				resolverEntry(root),
			];
			return compare(root, entries);
		}

		it('reports unknown dependency targets for every require mode', () => {
			const counts = {};
			for (const mode of [undefined, 'any', 'element', 'file', 'all']) {
				const option = mode ? { require: mode } : {};
				const results = run({
					'boundaries/no-unknown-dependencies': ['error', option],
				});
				counts[mode ?? 'default'] = findings(results).length;
			}
			expect(counts.element).toBeGreaterThan(0);
			expect(counts.all).toBeGreaterThanOrEqual(counts.element);
			expect(counts.default).toBe(counts.any);
			expect(counts.all).not.toBe(counts.any);
		});

		it('works without options and with the bare severity form', () => {
			const bare = run({ 'boundaries/no-unknown-dependencies': 'error' });
			const withDefault = run({
				'boundaries/no-unknown-dependencies': ['error', {}],
			});

			expect(bare).toEqual(withDefault);
		});

		it('reports files that no element or file pattern recognizes', () => {
			const results = run({ 'boundaries/no-unknown-files': 'error' });

			expect(findings(results).length).toBeGreaterThan(0);
			expect(results['vendor/skip.ts']).toEqual([]);
			expect(messagesOf(results, 'other/readme.js')).toEqual([
				'File does not match any file pattern and does not belong to any known element',
			]);
		});

		it('combines both rules with dependencies like the mobile-app preset', () => {
			const results = run({
				'boundaries/dependencies': [
					'error',
					{ default: 'allow', policies: [] },
				],
				'boundaries/no-unknown-dependencies': ['error', { require: 'element' }],
				'boundaries/no-unknown-files': 'error',
			});

			expect(findings(results).length).toBeGreaterThan(3);
		});

		it('rejects invalid no-unknown-dependencies options through the schema', () => {
			const root = createProject(layout);
			const entries = [
				{
					plugins: featureBoundaries.createFeatureBoundaryConfig()[0].plugins,
					settings,
					rules: {
						'boundaries/no-unknown-dependencies': [
							'error',
							{ require: 'nope' },
						],
					},
				},
				resolverEntry(root),
			];

			expect(() =>
				lintProject(root, entries, {
					plugin: port,
					files: ['features/a/index.ts'],
				}),
			).toThrow();
		});
	});

	describe('glob matching', () => {
		// Each fuzz suite lints 600+ generated patterns with both plugins.
		const fuzzTimeout = 120_000;

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
		const sources = { 'tsconfig.json': '{}' };
		for (const file of tree) sources[file] = plain;
		const importer = tree.map((file) => `import '../${file}';`).join('\n');
		sources['zz/src.ts'] = importer;
		const root = createProject(sources);

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
				result.add(
					Array.from({ length }, () => pool[next(pool.length)]).join('/'),
				);
			}
			return [...result];
		}

		function lintPattern(descriptors, plugin) {
			const entries = [
				{
					plugins: featureBoundaries.createFeatureBoundaryConfig()[0].plugins,
					settings: descriptors,
					rules: {
						'boundaries/dependencies': [
							'error',
							{ default: 'disallow', checkUnknownLocals: true, policies: [] },
						],
					},
				},
			];
			return lintProject(root, entries, { plugin, files: ['zz/src.ts'] })[
				'zz/src.ts'
			];
		}

		function differential(buildSettings) {
			let compared = 0;
			let unsupported = 0;
			let reported = 0;
			for (const pattern of patterns()) {
				const settings = buildSettings(pattern);
				const original = lintPattern(settings);
				let ported;
				try {
					ported = lintPattern(settings, port);
				} catch (error) {
					expect(String(error.message)).toMatch(/unsupported glob/);
					unsupported += 1;
					continue;
				}
				expect({ pattern, findings: ported }).toEqual({
					pattern,
					findings: original,
				});
				compared += 1;
				if (
					original.some(
						(entry) =>
							entry.message.includes('"c"') || entry.message.includes('"t"'),
					)
				) {
					reported += 1;
				}
			}
			return { compared, unsupported, reported };
		}

		it(
			'matches and captures file descriptor globs like micromatch',
			() => {
				const outcome = differential((pattern) => ({
					'boundaries/files': [
						{ category: 'any', pattern: '**' },
						{
							category: 'c',
							pattern,
							capture: ['one', 'two', 'three', 'four'],
						},
					],
				}));

				expect(outcome.compared).toBeGreaterThan(600);
				expect(outcome.unsupported).toBe(0);
				expect(outcome.reported).toBeGreaterThan(30);
			},
			fuzzTimeout,
		);

		it(
			'matches element descriptor globs and element paths like micromatch',
			() => {
				const outcome = differential((pattern) => ({
					'boundaries/elements': [
						{
							type: 't',
							pattern,
							partialMatch: false,
							capture: ['one', 'two', 'three', 'four'],
						},
					],
					'boundaries/files': [{ category: 'any', pattern: '**' }],
				}));

				expect(outcome.compared).toBeGreaterThan(600);
				expect(outcome.unsupported).toBe(0);
				expect(outcome.reported).toBeGreaterThan(30);
			},
			fuzzTimeout,
		);

		it(
			'matches ignore patterns like micromatch',
			() => {
				const outcome = differential((pattern) => ({
					'boundaries/ignore': [pattern],
					'boundaries/files': [{ category: 'any', pattern: '**' }],
				}));

				expect(outcome.compared).toBeGreaterThan(600);
				expect(outcome.unsupported).toBe(0);
			},
			fuzzTimeout,
		);
	});
});
