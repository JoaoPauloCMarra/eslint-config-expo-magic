const plugin = require('./plugin/index.js');
const { defaultRestrictions } = require('./native-ui.js');
const { baseRestrictedImports } = require('./restricted-imports.js');
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
const CODE = '{ts,tsx,js,jsx,mts,cts}';
const VIEW_CODE = '{tsx,jsx}';

const IMPORTS_RULE = 'no-restricted-imports';
const SYNTAX_RULE = 'no-restricted-syntax';

const COLLECTION_METHODS = '/^(map|filter|reduce|sort|flatMap)$/';

function assertObject(value, label) {
	if (value === null || typeof value !== 'object' || Array.isArray(value)) {
		throw new TypeError(`${label} must be an object.`);
	}
}

function escapeRegex(value) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
 * A layer-direction ban covers the aliased specifier and the relative one that
 * climbs out of the importing layer into the banned folder.
 */
function layerBanPatterns(aliasPrefix, folders, message) {
	return [
		{
			group: folders.flatMap((folder) => [
				`${aliasPrefix}/${folder}`,
				`${aliasPrefix}/${folder}/**`,
			]),
			message,
		},
		{
			regex: `^(\\.\\./)+(${folders.map(escapeRegex).join('|')})(/|$)`,
			message,
		},
	];
}

function restrictionKey(restriction) {
	return JSON.stringify([
		restriction.name,
		restriction.importNames ?? null,
		restriction.allowImportNames ?? null,
	]);
}

function patternKey(pattern) {
	return JSON.stringify([
		pattern.group ?? null,
		pattern.regex ?? null,
		pattern.importNames ?? null,
		pattern.importNamePattern ?? null,
	]);
}

function dedupeBy(items, keyOf) {
	const deduped = new Map();

	for (const item of items) {
		deduped.set(keyOf(item), item);
	}

	return [...deduped.values()];
}

function isOffValue(value) {
	const severity = Array.isArray(value) ? value[0] : value;

	return severity === 'off' || severity === 0 || severity === undefined;
}

function normalizeImportsValue(value) {
	const normalized = { paths: [], patterns: [] };
	if (isOffValue(value) || !Array.isArray(value)) {
		return normalized;
	}

	for (const option of value.slice(1)) {
		if (typeof option === 'string') {
			normalized.paths.push({ name: option });
			continue;
		}

		if (option === null || typeof option !== 'object') {
			continue;
		}

		if (typeof option.name === 'string') {
			normalized.paths.push(option);
			continue;
		}

		for (const entry of option.paths ?? []) {
			normalized.paths.push(
				typeof entry === 'string' ? { name: entry } : entry,
			);
		}

		for (const entry of option.patterns ?? []) {
			normalized.patterns.push(
				typeof entry === 'string' ? { group: [entry] } : entry,
			);
		}
	}

	return normalized;
}

function normalizeSyntaxValue(value) {
	if (isOffValue(value) || !Array.isArray(value)) {
		return [];
	}

	return value
		.slice(1)
		.map((entry) => (typeof entry === 'string' ? { selector: entry } : entry));
}

/**
 * Each rule value is kept in normalised form while the blocks are composed, so
 * every union and subtraction works on plain lists. `drop` removes entries that
 * an exemption block must not inherit from what it overrides.
 */
const ruleKinds = {
	[IMPORTS_RULE]: {
		normalize: normalizeImportsValue,
		empty: () => ({ paths: [], patterns: [] }),
		union: (a, b) => ({
			paths: dedupeBy([...a.paths, ...b.paths], restrictionKey),
			patterns: dedupeBy([...a.patterns, ...b.patterns], patternKey),
		}),
		subtract: (value, drop) => ({
			paths: value.paths.filter(
				(entry) =>
					!drop.pathKeys?.has(restrictionKey(entry)) &&
					(!drop.keepOnlyPathKeys ||
						drop.keepOnlyPathKeys.has(restrictionKey(entry))),
			),
			patterns: value.patterns.filter(
				(entry) => !drop.patternKeys?.has(patternKey(entry)),
			),
		}),
		toRule: (value) => {
			if (value.paths.length === 0 && value.patterns.length === 0) {
				return 'off';
			}

			return [
				'error',
				{
					...(value.paths.length > 0 ? { paths: value.paths } : {}),
					...(value.patterns.length > 0 ? { patterns: value.patterns } : {}),
				},
			];
		},
	},
	[SYNTAX_RULE]: {
		normalize: normalizeSyntaxValue,
		empty: () => [],
		union: (a, b) => dedupeBy([...a, ...b], (entry) => entry.selector),
		subtract: (value, drop) =>
			value.filter((entry) => !drop.selectors?.has(entry.selector)),
		toRule: (value) => (value.length === 0 ? 'off' : ['error', ...value]),
	},
};

function literalSegments(pattern) {
	const segments = [];

	for (const segment of pattern.split('/')) {
		if (/[*?[\]{}!()]/.test(segment)) {
			break;
		}
		segments.push(segment);
	}

	return segments;
}

function patternExtensions(pattern) {
	const baseName = pattern.split('/').pop() ?? '';
	const braceMatch = baseName.match(/\.\{([^}]+)\}$/);
	if (braceMatch) {
		return braceMatch[1].split(',').map((entry) => entry.split('.').pop());
	}

	const dotMatch = baseName.match(/\.([A-Za-z0-9]+)$/);
	if (dotMatch && /^\*|\*\./.test(baseName)) {
		return [dotMatch[1]];
	}

	return null;
}

/**
 * Proves two string globs cannot match the same file, so a composed block that
 * could never apply is not emitted. Anything it cannot prove stays composed.
 */
function arePatternsDisjoint(a, b) {
	if (typeof a !== 'string' || typeof b !== 'string') {
		return false;
	}

	const segmentsA = literalSegments(a);
	const segmentsB = literalSegments(b);
	const shared = Math.min(segmentsA.length, segmentsB.length);
	for (let index = 0; index < shared; index += 1) {
		if (segmentsA[index] !== segmentsB[index]) {
			return true;
		}
	}

	const extensionsA = patternExtensions(a);
	const extensionsB = patternExtensions(b);
	if (extensionsA && extensionsB) {
		return !extensionsA.some((extension) => extensionsB.includes(extension));
	}

	return false;
}

function isPatternCoveredBy(inner, outer) {
	if (typeof inner !== 'string' || typeof outer !== 'string') {
		return false;
	}

	const outerMatch = outer.match(
		/^((?:[^*?[\]{}!()/]+\/)*)\*\*\/\*\.(\{[^}]+\}|[A-Za-z0-9]+)$/,
	);
	if (!outerMatch) {
		return false;
	}

	const outerPrefix = outerMatch[1];
	const outerExtensions = patternExtensions(`*.${outerMatch[2]}`);
	const innerExtensions = patternExtensions(inner);

	return (
		inner.startsWith(outerPrefix) &&
		innerExtensions !== null &&
		innerExtensions.every((extension) => outerExtensions.includes(extension))
	);
}

/**
 * True when every file `inner` matches is also matched by `outer`, so their
 * intersection is `inner` itself and no composed block is needed.
 */
function isBlockCoveredBy(inner, outer) {
	if (!inner.files || !outer.files) {
		return !outer.files && (outer.ignores ?? []).length === 0;
	}

	const innerIgnores = new Set(inner.ignores ?? []);

	return (
		(outer.ignores ?? []).every((pattern) => innerIgnores.has(pattern)) &&
		inner.files.every((pattern) =>
			toPatternList(pattern).some((part) =>
				outer.files.some((outerPattern) =>
					isPatternCoveredBy(part, outerPattern),
				),
			),
		)
	);
}

function toPatternList(pattern) {
	return Array.isArray(pattern) ? pattern : [pattern];
}

function intersectFiles(filesA, filesB) {
	if (!filesA) {
		return filesB;
	}

	if (!filesB) {
		return filesA;
	}

	const intersection = [];
	for (const patternA of filesA) {
		for (const patternB of filesB) {
			const combined = [...toPatternList(patternA), ...toPatternList(patternB)];
			const disjoint = toPatternList(patternA).some((left) =>
				toPatternList(patternB).some((right) =>
					arePatternsDisjoint(left, right),
				),
			);
			if (!disjoint) {
				intersection.push(combined);
			}
		}
	}

	return intersection;
}

/**
 * A composed block keeps `files`, `ignores` and the one rule it composes. It is
 * emitted only where the two source blocks both apply, so the last matching
 * block for any file always carries the union of everything that applies there.
 */
function intersectBlocks(blockA, blockB, name, ruleName, value) {
	const files = intersectFiles(blockA.files, blockB.files);
	if (files && files.length === 0) {
		return null;
	}

	const ignores = [...(blockA.ignores ?? []), ...(blockB.ignores ?? [])];

	return {
		name,
		...(files ? { files } : {}),
		...(ignores.length > 0 ? { ignores } : {}),
		ruleName,
		value,
	};
}

function toConfig(block) {
	return {
		name: block.name,
		...(block.files ? { files: block.files } : {}),
		...(block.ignores ? { ignores: block.ignores } : {}),
		rules: { [block.ruleName]: ruleKinds[block.ruleName].toRule(block.value) },
	};
}

/**
 * Composes one rule across architecture blocks. An additive block unions with
 * every earlier block it overlaps; an exemption block re-emits every earlier
 * block it overlaps minus its `drop` set. Both keep "last matching block wins"
 * equal to "everything that applies here".
 */
function composeArchitectureBlocks(ruleName, additive, exemptions) {
	const kind = ruleKinds[ruleName];
	const emitted = [];

	for (const block of additive) {
		const covering = emitted.filter((prior) => isBlockCoveredBy(block, prior));
		const priors = emitted.filter((prior) => !covering.includes(prior));
		const value = [...covering, block].reduce(
			(merged, entry) => kind.union(merged, entry.value),
			kind.empty(),
		);
		emitted.push({ ...block, ruleName, value });
		for (const prior of priors) {
			const composed = intersectBlocks(
				prior,
				block,
				`${block.name} + ${prior.name}`,
				ruleName,
				kind.union(prior.value, value),
			);
			if (composed) {
				emitted.push({ ...composed, drop: prior.drop });
			}
		}
	}

	for (const exemption of exemptions) {
		const priors = [...emitted];
		if (exemption.value) {
			emitted.push({ ...exemption, ruleName });
		}
		for (const prior of priors) {
			const composed = intersectBlocks(
				prior,
				exemption,
				`${exemption.name} + ${prior.name}`,
				ruleName,
				kind.union(
					kind.subtract(prior.value, exemption.drop),
					exemption.value ?? kind.empty(),
				),
			);
			if (composed) {
				emitted.push({ ...composed, drop: exemption.drop });
			}
		}
	}

	return emitted;
}

function isComposableBaseEntry(entry, ruleName) {
	return (
		entry !== null &&
		typeof entry === 'object' &&
		entry.rules !== undefined &&
		Object.prototype.hasOwnProperty.call(entry.rules, ruleName) &&
		entry.basePath === undefined
	);
}

/**
 * Re-states every `baseConfig` entry that sets the rule inside each
 * architecture block it overlaps, in base order, so a later architecture block
 * never deletes a restriction another layer added for the same file.
 */
function composeWithBase(ruleName, blocks, baseConfig) {
	const kind = ruleKinds[ruleName];
	const baseEntries = baseConfig
		.filter((entry) => isComposableBaseEntry(entry, ruleName))
		.map((entry, index) => ({
			name: entry.name ?? `base#${index}`,
			files: entry.files,
			ignores: entry.ignores,
			value: kind.normalize(entry.rules[ruleName]),
		}));
	const configs = [];

	for (const block of blocks) {
		configs.push(toConfig(block));
		for (const baseEntry of baseEntries) {
			const drop = block.drop?.inherited ?? block.drop;
			const inherited = drop
				? kind.subtract(baseEntry.value, drop)
				: baseEntry.value;
			const composed = intersectBlocks(
				block,
				baseEntry,
				`${block.name} + ${baseEntry.name}`,
				ruleName,
				kind.union(inherited, block.value),
			);
			if (composed) {
				configs.push(toConfig(composed));
			}
		}
	}

	return configs;
}

function createComposedRuleConfigs(ruleName, additive, exemptions, baseConfig) {
	const blocks = composeArchitectureBlocks(ruleName, additive, exemptions);

	return composeWithBase(ruleName, blocks, baseConfig);
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

function normalizeNativeUiOption(nativeUi) {
	if (nativeUi === undefined || typeof nativeUi === 'boolean') {
		return {};
	}

	assertObject(nativeUi, 'createArchitectureConfig nativeUi');
	return nativeUi;
}

/**
 * `tokenModule` is the colour module path, as in `semanticColors`. The layer
 * directory form (`uikit/tokens`) is still accepted and resolves to its
 * `colors` module.
 */
function resolveTokenModule(tokenModule, layers) {
	if (tokenModule === undefined || tokenModule === layers.tokens) {
		return `${layers.tokens}/colors`;
	}

	return tokenModule;
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

	const baseConfig = options.baseConfig ?? [];
	if (!Array.isArray(baseConfig)) {
		throw new TypeError(
			'createArchitectureConfig baseConfig must be a flat config array.',
		);
	}

	const src = options.srcRoot ?? 'src';
	const aliasPrefix = options.aliasPrefix ?? '@';
	const tokenModule = resolveTokenModule(options.tokenModule, layers);
	const loggerModule = options.loggerModule ?? 'services/logger/logger';
	const nativeUi = normalizeNativeUiOption(options.nativeUi);
	const nativeWrappers = [
		// The owned native wrapper directory is exactly where these imports
		// belong; the restriction message points callers here.
		`${src}/services/native/**/*.${CODE}`,
		...(options.nativeWrappers ?? [`${src}/${layers.components}/*.${CODE}`]),
		...(nativeUi.allowFiles ?? []),
	];
	const extraNativeUiRestrictions = options.extraNativeUiRestrictions ?? [];
	const extraNativeLibPatterns = options.extraNativeLibPatterns ?? [];

	const nativeUiRestrictions = defaultRestrictions.filter(
		(restriction) => !baseRestrictedImports.includes(restriction),
	);
	const basePaths = dedupeBy(
		[
			...baseRestrictedImports,
			...(nativeUi.restrictions ?? nativeUiRestrictions),
			...(nativeUi.additionalRestrictions ?? []),
			...extraNativeUiRestrictions,
		],
		restrictionKey,
	);
	const colorSelectors = createSemanticColorGroups({
		tokenModule,
		allowFiles: [`**/${tokenModule}.${CODE}`],
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
	const loggerFile = `${src}/${loggerModule}.${CODE}`;

	const httpBypassSelectors = globalMemberSelectors(
		['fetch', 'XMLHttpRequest'],
		HTTP_MESSAGE,
	);
	const consoleBypassSelectors = globalMemberSelectors(
		['console'],
		CONSOLE_MESSAGE,
	);

	const viewSelectors = [
		{
			selector: `CallExpression[callee.property.name=${COLLECTION_METHODS}][callee.object.type="CallExpression"][callee.object.callee.property.name=${COLLECTION_METHODS}]`,
			message:
				'Business logic belongs in a `use-*.ts` hook or a pure `.ts` module, not in a view.',
		},
		{
			selector: 'CallExpression[callee.name="useEffect"]',
			message: 'No effects in views. Move orchestration into the feature hook.',
		},
	];

	const importBlocks = [
		// Owned primitives + native libraries, everywhere under src.
		{
			name: 'architecture/native-ui',
			files: [sourceGlob],
			ignores: testGlobs,
			value: { paths: basePaths, patterns: nativeLibPatterns },
		},
		// Features additionally get the HTTP and route bans.
		{
			name: 'architecture/features',
			files: [`${src}/features/**/*.${CODE}`],
			ignores: testGlobs,
			value: {
				paths: [],
				patterns: [
					...httpPatterns,
					...layerBanPatterns(
						aliasPrefix,
						[layers.routes],
						`Features must not import ${layers.routes} files.`,
					),
				],
			},
		},
		// Routes/core import screens, never HTTP clients.
		{
			name: 'architecture/routes',
			files: [`${src}/${layers.routes}/**/*.${CODE}`],
			ignores: testGlobs,
			value: { paths: [], patterns: httpPatterns },
		},
		// The UI layer stays independent of features and services.
		{
			name: 'architecture/ui',
			files: [`${src}/${layers.ui}/**/*.${CODE}`],
			ignores: testGlobs,
			value: {
				paths: [],
				patterns: layerBanPatterns(
					aliasPrefix,
					['features', 'services', layers.routes],
					`${layers.ui} must not import features, services or ${layers.routes}.`,
				),
			},
		},
		// Services own HTTP, so they keep the primitive ban but lose the HTTP ban.
		{
			name: 'architecture/services',
			files: [`${src}/services/**/*.${CODE}`],
			ignores: testGlobs,
			value: {
				paths: [],
				patterns: layerBanPatterns(
					aliasPrefix,
					['features', layers.routes],
					`Services must not import features or ${layers.routes}.`,
				),
			},
		},
		// Views and routes never reach for the data layer; hooks and services own it.
		{
			name: 'architecture/no-state-modules-in-views',
			files: [`${src}/**/*.${VIEW_CODE}`],
			ignores: [`${src}/services/**`, ...testGlobs],
			value: {
				paths: [],
				patterns: layerBanPatterns(
					aliasPrefix,
					['services/query', 'services/client-state'],
					'Views and routes do not import query or client-state modules. A `use-*.ts` hook owns that.',
				),
			},
		},
	];

	const primitivePathKeys = new Set(
		basePaths
			.filter((entry) => !baseRestrictedImports.includes(entry))
			.map(restrictionKey),
	);
	const nativeLibPatternKeys = new Set(nativeLibPatterns.map(patternKey));
	const importExemptions = [
		// Owned wrappers may import the primitives and native libraries they
		// wrap. Every layer-direction ban and every `baseConfig` ban that is not
		// a primitive still applies to them.
		{
			name: 'architecture/native-wrappers',
			files: nativeWrappers,
			drop: {
				pathKeys: primitivePathKeys,
				keepOnlyPathKeys: new Set(baseRestrictedImports.map(restrictionKey)),
				patternKeys: nativeLibPatternKeys,
				inherited: {
					pathKeys: primitivePathKeys,
					patternKeys: nativeLibPatternKeys,
				},
			},
		},
		// Tests may use primitives freely but keep the base SafeAreaView ban and
		// the non-primitive `baseConfig` bans.
		{
			name: 'architecture/tests-imports',
			files: testGlobs,
			value: { paths: baseRestrictedImports, patterns: [] },
			drop: {
				keepOnlyPathKeys: new Set(baseRestrictedImports.map(restrictionKey)),
				inherited: { pathKeys: primitivePathKeys },
			},
		},
	];

	const syntaxBase = [
		...colorSelectors,
		...httpBypassSelectors,
		...consoleBypassSelectors,
	];
	const programBan = (message) => [{ selector: 'Program', message }];

	const syntaxBlocks = [
		{
			name: 'architecture/syntax',
			files: [sourceGlob],
			ignores: testGlobs,
			value: syntaxBase,
		},
		// Views render and wire only.
		{
			name: 'architecture/views',
			files: [`${src}/features/**/*.${VIEW_CODE}`],
			ignores: testGlobs,
			value: viewSelectors,
		},
		// `*-view.tsx` and feature components receive props; screen hosts call hooks.
		{
			name: 'architecture/views-receive-props',
			files: [
				`${src}/features/**/*-view.${VIEW_CODE}`,
				`${src}/features/*/components/**/*.${VIEW_CODE}`,
			],
			ignores: testGlobs,
			value: [
				{
					selector:
						'ImportDeclaration[importKind!="type"][source.value=/(\\/hooks\\/|\\/use-[^\\/]+$)/]',
					message:
						'Views receive props. Only a screen host may call a feature hook.',
				},
			],
		},
		{
			name: 'architecture/no-barrels',
			files: [
				`${src}/features/**/index.${CODE}`,
				`${src}/services/**/index.${CODE}`,
				`${src}/${layers.ui}/**/index.${CODE}`,
				`${src}/${layers.routes}/**/index.{ts,js,mts,cts}`,
			],
			value: programBan(
				'No barrels. Cross-feature access is contracts-only; import the module directly.',
			),
		},
		{
			name: 'architecture/no-clean-architecture-trees',
			files: [`${src}/features/**/{domain,application,ui}/**/*.${CODE}`],
			value: programBan(
				'Feature folders are flat. Do not add domain/ application/ ui/ trees.',
			),
		},
	];

	const syntaxExemptions = [
		// The owned logger is the one module allowed to reach the console, in
		// either the bare or the `globalThis.` form. Every other rule still applies.
		{
			name: 'architecture/logger',
			files: [loggerFile],
			drop: {
				selectors: new Set(
					consoleBypassSelectors.map((entry) => entry.selector),
				),
			},
		},
		// The token module is the one place raw colour literals belong.
		{
			name: 'architecture/token-module',
			files: [`${src}/${tokenModule}.${CODE}`],
			drop: {
				selectors: new Set(colorSelectors.map((entry) => entry.selector)),
			},
		},
	];

	return [
		...createComposedRuleConfigs(
			IMPORTS_RULE,
			importBlocks,
			importExemptions,
			baseConfig,
		),
		...createComposedRuleConfigs(
			SYNTAX_RULE,
			syntaxBlocks,
			syntaxExemptions,
			baseConfig,
		),
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
			ignores: [loggerFile, ...testGlobs],
			rules: {
				'no-console': 'error',
				'no-restricted-globals': [
					'error',
					{ name: 'fetch', message: HTTP_MESSAGE },
					{ name: 'XMLHttpRequest', message: HTTP_MESSAGE },
				],
			},
		},
		{
			name: 'architecture/logger',
			files: [loggerFile],
			rules: { 'no-console': 'off' },
		},
		{
			name: 'architecture/services-may-fetch',
			files: [`${src}/services/**/*.${CODE}`],
			rules: { 'no-restricted-globals': 'off' },
		},
		...createFeatureIsolationConfig(src, aliasPrefix),
		{
			name: 'architecture/tests',
			files: testGlobs,
			rules: {
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
