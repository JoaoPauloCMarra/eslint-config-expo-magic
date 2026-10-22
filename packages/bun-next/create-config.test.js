const { describe, expect, test } = require('bun:test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const profiles = require('../../test-project/bun-golden/profiles.js');
const bunNext = require('./index.js');
const { toOxlintConfig } = require('./utils/to-oxlint.js');

const bunNextDirectory = __dirname;
const rulesDirectory = path.join(bunNextDirectory, 'rules');
const fiveXDirectory = path.resolve(
	bunNextDirectory,
	'../eslint-config-expo-magic',
);
const fiveX = {
	createConfig: require(fiveXDirectory).createConfig,
	createMobileAppConfig: require(path.join(fiveXDirectory, 'mobile-app.js'))
		.createMobileAppConfig,
};

const portFiles = {
	boundaries: 'boundaries.js',
	expo: 'expo.js',
	'expo-magic': 'expo-magic/index.js',
	'expo-magic-reanimated': 'expo-magic-reanimated.js',
	'react-19-upgrade': 'react-19-upgrade.js',
	'react-native': 'react-native.js',
	'testing-library': 'testing-library.js',
	'unused-imports': 'unused-imports.js',
};

function portPath(name) {
	return path.join(rulesDirectory, portFiles[name]);
}

function existingPorts() {
	return Object.keys(portFiles).filter((name) => fs.existsSync(portPath(name)));
}

function isOff(value) {
	const level = Array.isArray(value) ? value[0] : value;

	return level === 'off' || level === 0;
}

function usedPrefixes(entries) {
	const prefixes = new Set();

	for (const entry of entries) {
		for (const [name, value] of Object.entries(entry.rules ?? {})) {
			const slash = name.lastIndexOf('/');
			if (slash !== -1 && !isOff(value)) prefixes.add(name.slice(0, slash));
		}
	}

	return prefixes;
}

function expectedConverterOptions() {
	const jsPlugins = {};
	const jsPluginRules = {};

	for (const name of existingPorts()) {
		jsPlugins[name] = portPath(name);
		jsPluginRules[name] = new Set(Object.keys(require(portPath(name)).rules));
	}

	return { jsPlugins, jsPluginRules };
}

describe('bun-next createConfig matches the 5.x package through the converter', () => {
	for (const profile of profiles) {
		test(profile.name, () => {
			const entries = fiveX[profile.factory](profile.options);
			const missing = Object.keys(portFiles).filter(
				(name) => !existingPorts().includes(name),
			);
			const prefixes = usedPrefixes(entries);

			if (missing.some((name) => prefixes.has(name))) {
				expect(() => bunNext[profile.factory](profile.options)).toThrow(
					/Port missing/,
				);

				return;
			}

			expect(bunNext[profile.factory](profile.options)).toStrictEqual(
				toOxlintConfig(entries, expectedConverterOptions()),
			);
		});
	}
});

describe('bun-next createConfig keeps 5.x option validation', () => {
	const invalidOptions = [
		null,
		[],
		{ preset: 'nope' },
		{ prettier: 'yes' },
		{ agent: 'yes' },
		{ tsconfigProjects: [1] },
		{ inlineStyles: 'loud' },
	];

	for (const options of invalidOptions) {
		test(JSON.stringify(options), () => {
			let expected;
			try {
				fiveX.createConfig(options);
			} catch (error) {
				expected = error;
			}

			expect(expected).toBeInstanceOf(Error);
			expect(() => bunNext.createConfig(options)).toThrow(expected.message);
		});
	}

	test('createMobileAppConfig rejects an unknown preset', () => {
		let expected;
		try {
			fiveX.createMobileAppConfig({ preset: 'nope' });
		} catch (error) {
			expected = error;
		}

		expect(expected).toBeInstanceOf(Error);
		expect(() => bunNext.createMobileAppConfig({ preset: 'nope' })).toThrow(
			expected.message,
		);
	});
});

describe('bun-next has no npm runtime dependency', () => {
	const packageSources = [
		'index.js',
		'utils',
		'rules/expo-magic',
		'rules/expo-magic-reanimated.js',
	];

	function collectSources(target) {
		const absolute = path.join(bunNextDirectory, target);
		if (fs.statSync(absolute).isFile()) return [absolute];

		return fs
			.readdirSync(absolute, { recursive: true })
			.map((relative) => path.join(absolute, relative))
			.filter((file) => fs.statSync(file).isFile())
			.filter((file) => /\.(?:c|m)?js$/.test(file) && !/\.test\./.test(file));
	}

	test('sources only import relative files or node: built-ins', () => {
		const specifier =
			/(?:\brequire\(\s*|\bawait\s+import\(\s*|^\s*import\b[^\n'"]*?\bfrom\s+|^\s*import\s+)(['"])([^'"]+)\1/gm;
		const offenders = [];

		for (const file of packageSources.flatMap(collectSources)) {
			const source = fs.readFileSync(file, 'utf8');
			for (const match of source.matchAll(specifier)) {
				const value = match[2];
				if (!value.startsWith('.') && !value.startsWith('node:')) {
					offenders.push(`${path.relative(bunNextDirectory, file)}: ${value}`);
				}
			}
		}

		expect(offenders).toEqual([]);
	});

	test('loads and builds configs from a copy outside the repository', () => {
		const temporaryRoot = fs.mkdtempSync(
			path.join(os.tmpdir(), 'bun-next-isolated-'),
		);

		try {
			const copy = path.join(temporaryRoot, 'bun-next');
			fs.cpSync(bunNextDirectory, copy, {
				recursive: true,
				filter: (source) =>
					!source.endsWith('.test.js') &&
					!source.endsWith('.test.ts') &&
					!source.includes(`${path.sep}node_modules`),
			});

			const script = path.join(temporaryRoot, 'check.js');
			fs.writeFileSync(
				script,
				[
					`const { createConfig, createMobileAppConfig } = require(${JSON.stringify(path.join(copy, 'index.js'))});`,
					'const results = {};',
					'const cases = {',
					'	default: () => createConfig(),',
					'	fast: () => createConfig({ preset: "fast" }),',
					'	base: () => createConfig({ preset: "base" }),',
					'	typed: () => createConfig({ typeChecked: true }),',
					'	testing: () => createConfig({ prettier: true, testing: true }),',
					'	mobileApp: () => createMobileAppConfig(),',
					'};',
					'for (const [name, build] of Object.entries(cases)) {',
					'	try {',
					'		build();',
					'		results[name] = "ok";',
					'	} catch (error) {',
					'		results[name] = /^Port missing/.test(error.message) ? "port missing" : error.message;',
					'	}',
					'}',
					'console.log(JSON.stringify(results));',
					'',
				].join('\n'),
			);

			const result = Bun.spawnSync([process.execPath, script], {
				cwd: temporaryRoot,
				stderr: 'pipe',
				stdout: 'pipe',
			});
			const results = JSON.parse(result.stdout.toString());

			expect(result.stderr.toString()).toBe('');
			expect(result.exitCode).toBe(0);
			expect(
				Object.entries(results).filter(
					([, outcome]) => outcome !== 'ok' && outcome !== 'port missing',
				),
			).toEqual([]);
			expect(results.base).toBe('ok');
		} finally {
			fs.rmSync(temporaryRoot, { force: true, recursive: true });
		}
	});
});
