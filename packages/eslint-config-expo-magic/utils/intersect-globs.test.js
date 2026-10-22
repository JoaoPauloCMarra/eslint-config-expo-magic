const { describe, expect, test } = require('bun:test');

const profiles = require('../../../test-project/bun-golden/profiles.js');
const {
	createArchitectureConfig: createFlatArchitectureConfig,
} = require('./architecture.js');
const { createConfig } = require('./create-config.js');
const { expandBraces, intersectGlobs } = require('./intersect-globs.js');
const { createMobileAppConfig } = require('./mobile-app.js');

const globCache = new Map();

function matches(pattern, path) {
	let glob = globCache.get(pattern);
	if (!glob) {
		glob = new Bun.Glob(pattern);
		globCache.set(pattern, glob);
	}

	return glob.match(path);
}

function matchesAny(patterns, path) {
	return patterns.some((pattern) => matches(pattern, path));
}

describe('expandBraces', () => {
	test('expands nested and repeated alternatives', () => {
		expect(expandBraces('a/*.{ts,tsx}')).toEqual(['a/*.ts', 'a/*.tsx']);
		expect(expandBraces('{a,b}/{c,d}')).toEqual(['a/c', 'a/d', 'b/c', 'b/d']);
		expect(expandBraces('x.{a,{b,c}}')).toEqual(['x.a', 'x.b', 'x.c']);
		expect(expandBraces('plain')).toEqual(['plain']);
	});

	test('rejects unbalanced braces', () => {
		expect(() => expandBraces('a/{b')).toThrow(/unbalanced/);
		expect(() => expandBraces('a/b}')).toThrow(/unbalanced/);
	});
});

describe('intersectGlobs shapes', () => {
	test('a single pattern is its own expansion', () => {
		expect(intersectGlobs(['src/**/*.ts'])).toEqual(['src/**/*.ts']);
	});

	test('narrows a directory scope', () => {
		expect(intersectGlobs(['src/**/*.ts', 'src/features/**/*.ts'])).toEqual([
			'src/features/**/*.ts',
		]);
	});

	test('intersects extension alternatives', () => {
		expect(
			intersectGlobs(['src/**/*.{ts,tsx,js}', 'src/**/*.{tsx,jsx,js}']).sort(),
		).toEqual(['src/**/*.js', 'src/**/*.tsx']);
	});

	test('returns null for disjoint extensions or directories', () => {
		expect(intersectGlobs(['src/**/*.ts', 'src/**/*.tsx'])).toBeNull();
		expect(intersectGlobs(['src/a/*.ts', 'src/b/*.ts'])).toBeNull();
	});

	test('combines a basename suffix with a directory scope', () => {
		expect(
			intersectGlobs(['src/features/**/*-view.tsx', 'src/**/*.tsx']),
		).toEqual(['src/features/**/*-view.tsx']);
	});

	test('keeps a literal basename inside a recursive scope', () => {
		const result = intersectGlobs([
			'src/**/*.ts',
			'src/services/logger/logger.ts',
		]);

		expect(result).toEqual(['src/services/logger/logger.ts']);
	});

	test('treats a trailing ** as one or more segments', () => {
		expect(intersectGlobs(['src/services/**', 'src/**/*.ts'])).toEqual([
			'src/services/**/*.ts',
		]);
	});

	test('combines directory wildcards', () => {
		const result = intersectGlobs([
			'src/features/*/components/**/*.tsx',
			'src/features/**/index.tsx',
		]);

		expect(result).toEqual(['src/features/*/components/**/index.tsx']);
	});

	test('interleaves segment wildcards', () => {
		const result = intersectGlobs(['src/**/*.test.ts', 'src/**/*-view.*']);

		expect(result).not.toBeNull();
		expect(matchesAny(result, 'src/a/x-view.test.ts')).toBe(true);
		expect(matchesAny(result, 'src/a/x-view.ts')).toBe(false);
	});

	test('intersects more than two patterns', () => {
		expect(
			intersectGlobs([
				'src/**/*.{ts,tsx}',
				'src/uikit/**/*.tsx',
				'src/uikit/components/*.{tsx,jsx}',
			]),
		).toEqual(['src/uikit/components/*.tsx']);
	});

	test('rejects unsupported syntax and empty input', () => {
		expect(() => intersectGlobs(['src/[id].ts', 'src/**'])).toThrow(
			/unsupported glob syntax/,
		);
		expect(() => intersectGlobs(['src/?.ts', 'src/**'])).toThrow(
			/unsupported glob syntax/,
		);
		expect(() => intersectGlobs(['!src/**', 'src/**'])).toThrow(
			/unsupported glob syntax/,
		);
		expect(() => intersectGlobs([])).toThrow(/non-empty/);
	});
});

const architectureOptionSets = [
	{},
	{ nativeUi: true },
	{
		layers: {
			routes: 'core',
			ui: 'shared',
			tokens: 'shared/theme',
			components: 'shared/ui',
		},
	},
	{
		nativeUi: { allowFiles: ['src/uikit/components/toggle/*.tsx'] },
		nativeWrappers: ['src/uikit/wrappers/*.tsx'],
	},
	{ srcRoot: 'source', tokenModule: 'uikit/tokens', loggerModule: 'lib/log' },
];

function collectGroups() {
	const groups = new Map();
	const collect = (entries) => {
		for (const entry of entries) {
			for (const pattern of entry.files ?? []) {
				if (Array.isArray(pattern))
					groups.set(JSON.stringify(pattern), pattern);
			}
		}
	};

	for (const profile of profiles) {
		const entries =
			profile.factory === 'createMobileAppConfig'
				? createMobileAppConfig(profile.options)
				: createConfig(profile.options);
		collect(entries);
		if (profile.factory !== 'createConfig') continue;
		for (const options of architectureOptionSets) {
			collect(
				createFlatArchitectureConfig({ ...options, baseConfig: entries }),
			);
		}
	}

	return [...groups.values()];
}

function createRandom(seed) {
	let state = seed;

	return () => {
		state = (state + 0x6d2b79f5) | 0;
		let t = Math.imul(state ^ (state >>> 15), 1 | state);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;

		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

const extensions = ['ts', 'tsx', 'js', 'jsx', 'mts', 'cts', 'json', 'md'];
const basenames = [
	'x',
	'index',
	'x-view',
	'x.test',
	'x.spec',
	'x-view.test',
	'logger',
	'colors',
	'card',
];
const extraDirectories = [
	'src',
	'app',
	'uikit',
	'tokens',
	'components',
	'services',
	'native',
	'features',
	'home',
	'test',
	'domain',
	'application',
	'ui',
	'hooks',
	'lib',
	'a',
	'b',
	'source',
	'core',
	'shared',
	'theme',
	'wrappers',
	'toggle',
];

function instantiate(pattern, random) {
	return pattern
		.split('/')
		.map((segment) => {
			if (segment === '**') {
				return ['', 'a', 'a/b', 'home/hooks'][Math.floor(random() * 4)];
			}

			return segment.replace(
				/\*/g,
				() => ['x', 'x-view', 'index', 'x.test', ''][Math.floor(random() * 5)],
			);
		})
		.filter((segment) => segment !== '')
		.join('/');
}

function candidatePaths(group, random) {
	const expanded = group.flatMap((pattern) => expandBraces(pattern));
	const bases = new Set();
	for (const pattern of expanded) {
		for (let index = 0; index < 12; index += 1) {
			bases.add(instantiate(pattern, random));
		}
	}

	const directories = new Set(extraDirectories);
	for (const pattern of expanded) {
		for (const segment of pattern.split('/')) {
			if (!/[*]/.test(segment)) directories.add(segment);
		}
	}
	const directoryList = [...directories];
	const pick = (list) => list[Math.floor(random() * list.length)];

	const paths = new Set(bases);
	for (const base of [...bases]) {
		const segments = base.split('/');
		const file = segments.pop();
		const dot = file.indexOf('.');
		const stem = dot === -1 ? file : file.slice(0, dot);
		for (let index = 0; index < 8; index += 1) {
			const mutated = [...segments];
			const kind = Math.floor(random() * 5);
			let name = file;
			if (kind === 0) name = `${stem}.${pick(extensions)}`;
			else if (kind === 1) name = `${pick(basenames)}.${pick(extensions)}`;
			else if (kind === 2) {
				mutated.splice(
					Math.floor(random() * (mutated.length + 1)),
					0,
					pick(directoryList),
				);
			} else if (kind === 3 && mutated.length > 0) {
				mutated[Math.floor(random() * mutated.length)] = pick(directoryList);
			} else {
				mutated.splice(
					Math.floor(random() * (mutated.length + 1)),
					0,
					pick(directoryList),
					pick(directoryList),
				);
			}
			paths.add([...mutated, name].join('/'));
		}
	}

	return [...paths];
}

describe('intersectGlobs property test against Bun.Glob', () => {
	const groups = collectGroups();

	test('the real configs emit AND-groups', () => {
		expect(groups.length).toBeGreaterThan(20);
	});

	test('every emitted group lowers to exactly the paths all members match', () => {
		const random = createRandom(20261022);
		let positives = 0;
		let checked = 0;
		let emptyGroups = 0;

		for (const group of groups) {
			const lowered = intersectGlobs(group);
			if (lowered === null) emptyGroups += 1;

			for (const path of candidatePaths(group, random)) {
				const expected = group.every((pattern) => matches(pattern, path));
				const actual = lowered !== null && matchesAny(lowered, path);
				if (actual !== expected) {
					throw new Error(
						`Group ${JSON.stringify(group)} lowered to ${JSON.stringify(lowered)} disagrees on "${path}": expected ${expected}, got ${actual}.`,
					);
				}
				if (expected) positives += 1;
				checked += 1;
			}
		}

		expect(checked).toBeGreaterThan(5000);
		expect(positives).toBeGreaterThan(500);
		expect(emptyGroups).toBeLessThan(groups.length);
	});
});
