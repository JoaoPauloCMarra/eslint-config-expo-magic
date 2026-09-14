const plugin = require('./plugin/index.js');
const { defaultRestrictions } = require('./native-ui.js');
const {
	createRestrictedSyntaxGroups: createSemanticColorGroups,
} = require('./semantic-colors.js');

/**
 * Layer vocabulary. The kit keeps two lanes with deliberately different names,
 * so this takes explicit paths rather than a lane enum.
 */
const DEFAULT_LAYERS = Object.freeze({
	routes: 'app',
	ui: 'uikit',
	tokens: 'uikit/tokens',
	components: 'uikit/components',
});

const GLOBAL_OBJECTS = ['globalThis', 'global', 'window', 'self'];

/**
 * A type-stripped JavaScript app is a first-class lane, so every layer glob
 * covers .js/.jsx too. A TypeScript app has no .js under src, so matching both
 * costs nothing there.
 */
const CODE = '{ts,tsx,js,jsx}';

function assertObject(value, label) {
	if (value === null || typeof value !== 'object' || Array.isArray(value)) {
		throw new TypeError(`${label} must be an object.`);
	}
}

/**
 * `no-restricted-globals` is a scope-analysis rule: it sees `fetch(...)` but not
 * `globalThis.fetch(...)`, because the latter contains no identifier reference
 * to `fetch`. These selectors close that hole.
 */
function globalMemberSelectors(names, message) {
	return names.map((name) => ({
		selector: `MemberExpression[object.name=/^(${GLOBAL_OBJECTS.join('|')})$/][property.name="${name}"]`,
		message,
	}));
}

const HTTP_MESSAGE =
	'HTTP clients belong in services. Do not call fetch/XMLHttpRequest from features, views or routes.';
const CONSOLE_MESSAGE =
	'Use the owned logger. `console.*` is banned outside the logger module.';

function httpRestrictedPatterns(message) {
	return [
		{ group: ['axios', 'axios/*'], message },
		{ group: ['ky', 'ky/*'], message },
		{ group: ['got', 'got/*'], message },
		{ group: ['node-fetch'], message },
		{ group: ['superagent'], message },
		{ group: ['undici'], message },
	];
}

/**
 * Every returned block re-states the base restrictions it must not lose.
 *
 * ESLint flat config REPLACES rule options when a later entry supplies them, so
 * a layer block that sets only its own `no-restricted-imports` silently deletes
 * the owned-primitive ban for every file it matches. Composing the base list
 * into each block is what keeps both active.
 */
function restrictedImports(basePaths, extraPaths, patterns) {
	return [
		'error',
		{
			paths: [...basePaths, ...extraPaths],
			patterns,
		},
	];
}

function restrictedSyntax(baseSelectors, extraSelectors) {
	return ['error', ...baseSelectors, ...extraSelectors];
}


/**
 * Cross-feature access is contracts-only.
 *
 * A denylist of known subfolders (api/, hooks/, screens/, ...) cannot see the
 * flat files that pragmatic feature folders are made of, and an import-pattern
 * ban cannot tell "another feature" from "this feature". A dedicated rule
 * compares the two feature segments directly, so it needs no import resolver
 * and no filesystem reads.
 */
function createFeatureIsolationConfig(src, aliasPrefix) {
	return [
		{
			name: 'architecture/feature-isolation',
			files: [`${src}/features/**/*.${CODE}`],
			ignores: [`${src}/features/**/*.{test,spec}.${CODE}`],
			plugins: { 'expo-magic': plugin },
			rules: {
				'expo-magic/no-cross-feature-imports': [
					'error',
					{ aliasPrefix, srcRoot: src },
				],
			},
		},
	];
}

function createArchitectureConfig(options = {}) {
	assertObject(options, 'createArchitectureConfig options');

	const layers = { ...DEFAULT_LAYERS, ...(options.layers ?? {}) };
	assertObject(layers, 'createArchitectureConfig layers');
	for (const key of ['routes', 'ui', 'tokens', 'components']) {
		if (typeof layers[key] !== 'string' || layers[key].length === 0) {
			throw new TypeError(
				`createArchitectureConfig layers.${key} must be a non-empty string.`,
			);
		}
	}

	const src = options.srcRoot ?? 'src';
	const aliasPrefix = options.aliasPrefix ?? '@';
	const tokenModule = options.tokenModule ?? layers.tokens;
	const loggerModule = options.loggerModule ?? 'services/logger/logger';
	const nativeWrappers = options.nativeWrappers ?? [
		`${src}/${layers.components}/*.{ts,tsx,js,jsx}`,
	];
	const extraNativeUiRestrictions = options.extraNativeUiRestrictions ?? [];
	const extraNativeLibPatterns = options.extraNativeLibPatterns ?? [];

	const basePaths = [...defaultRestrictions, ...extraNativeUiRestrictions];
	const baseColorSelectors = createSemanticColorGroups({
		tokenModule,
		allowFiles: [`**/${tokenModule}/colors.{ts,tsx,js,jsx}`],
	}).flatMap((group) => group.selectors);

	const nativeLibPatterns = [
		{
			group: [
				'react-native-vision-camera',
				'react-native-nitro-modules',
				'react-native-nitro-storage',
				'react-native-nitro-markdown',
				'react-native-nitro-qrcode',
				'react-native-nitro-auth',
				'react-native-nitro-amplitude',
			],
			message: `Import native libraries only from the owned wrapper in ${src}/services/native/.`,
		},
		...extraNativeLibPatterns,
	];

	const httpPatterns = httpRestrictedPatterns(HTTP_MESSAGE);
	const sourceGlob = `${src}/**/*.${CODE}`;
	const testGlobs = [
		`${src}/**/*.{test,spec}.${CODE}`,
		`${src}/test/**/*.${CODE}`,
	];

	const featureGlob = `${src}/features/**/*.${CODE}`;
	const featureViewGlob = `${src}/features/**/*.{tsx,jsx}`;

	const viewSelectors = [
		{
			selector:
				'CallExpression[callee.type="MemberExpression"][callee.property.name=/^(map|filter|reduce|sort|flatMap)$/] > MemberExpression[property.name=/^(map|filter|reduce|sort|flatMap)$/]',
			message:
				'Business logic belongs in a `use-*.ts` hook or a pure `.ts` module, not in a view.',
		},
		{
			selector: 'CallExpression[callee.name="useEffect"]',
			message:
				'No effects in views. Move orchestration into the feature hook.',
		},
	];

	const httpBypassSelectors = globalMemberSelectors(
		['fetch', 'XMLHttpRequest'],
		HTTP_MESSAGE,
	);
	const consoleBypassSelectors = globalMemberSelectors(
		['console'],
		CONSOLE_MESSAGE,
	);
	const globalBypassSelectors = [
		...httpBypassSelectors,
		...consoleBypassSelectors,
	];

	viewSelectors.unshift(...globalBypassSelectors);

	return [
		// Owned primitives + native libraries, everywhere under src.
		{
			name: 'architecture/native-ui',
			files: [sourceGlob],
			ignores: [...testGlobs, ...nativeWrappers],
			rules: {
				'no-restricted-imports': restrictedImports(basePaths, [], [
					...nativeLibPatterns,
				]),
			},
		},
		// Features additionally get the cross-feature and HTTP bans.
		{
			name: 'architecture/features',
			files: [featureGlob],
			ignores: testGlobs,
			rules: {
				'no-restricted-imports': restrictedImports(basePaths, [], [
					...nativeLibPatterns,
					...httpPatterns,
					{
						group: [`@/${layers.routes}/*`, `@/${layers.routes}/**`],
						message: `Features must not import ${layers.routes} files.`,
					},
				]),
			},
		},
		// Routes/core import screens, never feature internals.
		{
			name: 'architecture/routes',
			files: [`${src}/${layers.routes}/**/*.${CODE}`],
			ignores: testGlobs,
			rules: {
				'no-restricted-imports': restrictedImports(basePaths, [], [
					...nativeLibPatterns,
					...httpPatterns,
				]),
			},
		},
		// The UI layer stays independent of features and services.
		{
			name: 'architecture/ui',
			files: [`${src}/${layers.ui}/**/*.${CODE}`],
			ignores: [...testGlobs, ...nativeWrappers],
			rules: {
				'no-restricted-imports': restrictedImports(basePaths, [], [
					...nativeLibPatterns,
					{
						group: [`@/features/**`, `@/services/**`, `@/${layers.routes}/**`],
						message: `${layers.ui} must not import features, services or ${layers.routes}.`,
					},
				]),
			},
		},
		// Services own HTTP, so they keep the primitive ban but lose the HTTP ban.
		{
			name: 'architecture/services',
			files: [`${src}/services/**/*.${CODE}`],
			ignores: [...testGlobs, `${src}/services/native/**/*.${CODE}`],
			rules: {
				'no-restricted-imports': restrictedImports(basePaths, [], [
					...nativeLibPatterns,
					{
						group: [`@/features/**`, `@/${layers.routes}/**`],
						message: `Services must not import features or ${layers.routes}.`,
					},
				]),
			},
		},
		// Syntax rules. Each block re-states the semantic-colour selectors so a
		// later, narrower block cannot silently drop the raw-colour ban.
		{
			name: 'architecture/syntax',
			files: [sourceGlob],
			ignores: testGlobs,
			rules: {
				'no-restricted-syntax': restrictedSyntax(
					baseColorSelectors,
					globalBypassSelectors,
				),
			},
		},
		{
			name: 'architecture/no-barrels',
			files: [
				`${src}/features/**/index.${CODE}`,
				`${src}/services/**/index.${CODE}`,
				`${src}/${layers.ui}/**/index.${CODE}`,
				`${src}/${layers.routes}/**/index.{ts,js}`,
			],
			rules: {
				'no-restricted-syntax': restrictedSyntax(baseColorSelectors, [
					{
						selector: 'Program',
						message:
							'No barrels. Cross-feature access is contracts-only; import the module directly.',
					},
				]),
			},
		},
		{
			name: 'architecture/no-clean-architecture-trees',
			files: [`${src}/features/**/{domain,application,ui}/**/*.${CODE}`],
			rules: {
				'no-restricted-syntax': restrictedSyntax(baseColorSelectors, [
					{
						selector: 'Program',
						message:
							'Feature folders are flat. Do not add domain/ application/ ui/ trees.',
					},
				]),
			},
		},
		// Views render and wire only.
		{
			name: 'architecture/views',
			files: [featureViewGlob],
			ignores: testGlobs,
			rules: {
				'no-restricted-syntax': restrictedSyntax(
					baseColorSelectors,
					viewSelectors,
				),
			},
		},
		// Views and routes never reach for the data layer; hooks and services own it.
		{
			name: 'architecture/no-state-modules-in-views',
			files: [`${src}/**/*.{tsx,jsx}`],
			ignores: [`${src}/services/**`, ...testGlobs, ...nativeWrappers],
			rules: {
				'no-restricted-imports': restrictedImports(basePaths, [], [
					...nativeLibPatterns,
					{
						group: [
							`@/services/query/**`,
							`@/services/client-state/**`,
						],
						message:
							'Views and routes do not import query or client-state modules. A `use-*.ts` hook owns that.',
					},
				]),
			},
		},
		// `*-view.tsx` and feature components receive props; screen hosts call hooks.
		{
			name: 'architecture/views-receive-props',
			files: [
				`${src}/features/**/*-view.{tsx,jsx}`,
				`${src}/features/*/components/**/*.{tsx,jsx}`,
			],
			ignores: testGlobs,
			rules: {
				'no-restricted-syntax': restrictedSyntax(baseColorSelectors, [
					...viewSelectors,
					{
						selector:
							'ImportDeclaration[importKind!="type"][source.value=/\\/hooks\\//]',
						message:
							'Views receive props. Only a screen host may call a feature hook.',
					},
				]),
			},
		},
		{
			name: 'architecture/filenames',
			files: [sourceGlob],
			plugins: { 'expo-magic': plugin },
			rules: {
				'expo-magic/kebab-case-filenames': [
					'error',
					{ ignore: ['^\\+.*', '^\\[.*\\]'] },
				],
			},
		},
		{
			name: 'architecture/no-console',
			files: [sourceGlob],
			ignores: [`${src}/${loggerModule}.{ts,tsx,js,jsx}`, ...testGlobs],
			rules: {
				'no-console': 'error',
				'no-restricted-globals': [
					'error',
					{ name: 'fetch', message: HTTP_MESSAGE },
					{ name: 'XMLHttpRequest', message: HTTP_MESSAGE },
				],
			},
		},
		// The owned logger is the one module allowed to reach the console, in
		// either the bare or the `globalThis.` form. Every other rule still applies.
		{
			name: 'architecture/logger',
			files: [`${src}/${loggerModule}.{ts,tsx,js,jsx}`],
			rules: {
				'no-console': 'off',
				'no-restricted-syntax': restrictedSyntax(
					baseColorSelectors,
					httpBypassSelectors,
				),
			},
		},
		{
			name: 'architecture/services-may-fetch',
			files: [`${src}/services/**/*.${CODE}`],
			rules: { 'no-restricted-globals': 'off' },
		},
		// The token module is the one place raw colour literals belong.
		{
			name: 'architecture/token-module',
			files: [`${src}/${tokenModule}/colors.{ts,tsx,js,jsx}`],
			rules: { 'no-restricted-syntax': 'off' },
		},
		...createFeatureIsolationConfig(src, aliasPrefix),
		{
			name: 'architecture/tests',
			files: testGlobs,
			rules: {
				'no-restricted-imports': 'off',
				'no-restricted-globals': 'off',
				'no-console': 'off',
				// Jest mocks are hoisted, so factories legitimately use require().
				'@typescript-eslint/no-require-imports': 'off',
				'expo-magic/kebab-case-filenames': 'off',
				'expo-magic/no-cross-feature-imports': 'off',
			},
		},
	];
}

module.exports = {
	createArchitectureConfig,
	DEFAULT_LAYERS,
};
