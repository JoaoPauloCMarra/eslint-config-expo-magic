const { afterAll, beforeEach, describe, expect, test } = require('bun:test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const expoMagic = require('./index.js');
const {
	expectationsDirectory,
	invalidOptions,
	profiles,
	withPackagePlaceholder,
} = require('./config-cases.js');

const packageDirectory = __dirname;

function recorded(name) {
	return JSON.parse(
		fs.readFileSync(path.join(expectationsDirectory, `${name}.json`), 'utf8'),
	);
}

describe('createConfig matches the configs recorded from 5.x', () => {
	for (const { name, factory, options } of profiles) {
		test(name, () => {
			expect(withPackagePlaceholder(expoMagic[factory](options))).toEqual(
				recorded(`profile-${name}`),
			);
		});
	}
});

describe('option validation matches the errors recorded from 5.x', () => {
	const validation = recorded('validation');

	for (const factory of ['createConfig', 'createMobileAppConfig']) {
		validation[factory].forEach(({ options, error }, index) => {
			test(`${factory} ${JSON.stringify(options)}`, () => {
				expect(invalidOptions[factory][index]).toEqual(options);
				expect(() => expoMagic[factory](options)).toThrow(error.message);
			});
		});
	}
});

describe('createMobileAppConfig reads the preset from the environment', () => {
	const variables = ['EXPO_MAGIC_PRESET', 'ESLINT_CONFIG_PRESET'];
	const saved = variables.map((name) => process.env[name]);
	const { createMobileAppConfig } = expoMagic;

	beforeEach(() => {
		for (const name of variables) delete process.env[name];
	});

	afterAll(() => {
		variables.forEach((name, index) => {
			if (saved[index] === undefined) delete process.env[name];
			else process.env[name] = saved[index];
		});
	});

	test('the profiles differ, so the comparisons below mean something', () => {
		expect(createMobileAppConfig({ preset: 'fast' })).not.toEqual(
			createMobileAppConfig({ preset: 'default' }),
		);
	});

	for (const name of variables) {
		test(`${name} selects the preset`, () => {
			process.env[name] = 'fast';
			expect(createMobileAppConfig()).toEqual(
				createMobileAppConfig({ preset: 'fast' }),
			);
		});
	}

	test('EXPO_MAGIC_PRESET wins over ESLINT_CONFIG_PRESET', () => {
		process.env.EXPO_MAGIC_PRESET = 'default';
		process.env.ESLINT_CONFIG_PRESET = 'fast';
		expect(createMobileAppConfig()).toEqual(
			createMobileAppConfig({ preset: 'default' }),
		);
	});

	test('the preset option wins over the environment', () => {
		const unset = createMobileAppConfig();
		expect(unset).toEqual(createMobileAppConfig({ preset: 'default' }));
		process.env.EXPO_MAGIC_PRESET = 'fast';
		expect(createMobileAppConfig({ preset: 'default' })).toEqual(unset);
	});

	test('an empty variable counts as unset', () => {
		const fast = createMobileAppConfig({ preset: 'fast' });
		process.env.EXPO_MAGIC_PRESET = '';
		process.env.ESLINT_CONFIG_PRESET = 'fast';
		expect(createMobileAppConfig()).toEqual(fast);
		process.env.ESLINT_CONFIG_PRESET = '';
		expect(createMobileAppConfig()).toEqual(
			createMobileAppConfig({ preset: 'default' }),
		);
	});
});

describe('the package has no npm runtime dependency', () => {
	const packageSources = [
		'index.js',
		'utils',
		'rules/expo-magic',
		'rules/expo-magic-reanimated.js',
	];

	function collectSources(target) {
		const absolute = path.join(packageDirectory, target);
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
					offenders.push(`${path.relative(packageDirectory, file)}: ${value}`);
				}
			}
		}

		expect(offenders).toEqual([]);
	});

	test('loads and builds configs from a copy outside the repository', () => {
		const temporaryRoot = fs.mkdtempSync(
			path.join(os.tmpdir(), 'expo-magic-isolated-'),
		);

		try {
			const copy = path.join(temporaryRoot, 'eslint-config-expo-magic');
			fs.cpSync(packageDirectory, copy, {
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
					'		results[name] = error.message;',
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
				Object.entries(results).filter(([, outcome]) => outcome !== 'ok'),
			).toEqual([]);
		} finally {
			fs.rmSync(temporaryRoot, { force: true, recursive: true });
		}
	});
});
