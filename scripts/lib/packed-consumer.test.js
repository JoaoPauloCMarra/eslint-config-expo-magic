const fs = require('node:fs');
const path = require('node:path');
const { describe, expect, test } = require('bun:test');
const {
	readSdk57FixtureVersions,
	run,
	validateToolVersion,
	validatePackedFiles,
	withTempConsumer,
	writeJson,
} = require('./packed-consumer.js');

const rootDir = path.resolve(__dirname, '../..');
const fixtureDevDependencies = JSON.parse(
	fs.readFileSync(path.join(rootDir, 'test-project', 'package.json'), 'utf8'),
).devDependencies;

describe('SDK 57 fixture versions', () => {
	test('reads the SDK 57 tuple from the test-project manifest', () => {
		const versions = readSdk57FixtureVersions();

		for (const packageName of [
			'@react-native/jest-preset',
			'@types/react',
			'expo',
			'expo-status-bar',
			'jest-expo',
			'react',
			'react-native',
			'react-test-renderer',
		]) {
			expect(versions[packageName]).toBe(fixtureDevDependencies[packageName]);
		}
	});

	test('fails when the manifest lacks a tuple package', () => {
		expect(() =>
			readSdk57FixtureVersions({ devDependencies: { expo: '57.0.0' } }),
		).toThrow(/react/);
	});

	test('smoke scripts do not hard-code SDK 57 versions', () => {
		for (const script of [
			'smoke-packed-consumer.js',
			'smoke-clean-sdk57-consumer.js',
		]) {
			const source = fs.readFileSync(
				path.join(rootDir, 'scripts', script),
				'utf8',
			);
			expect(source).not.toMatch(/['"]~?57\.\d+\.\d+['"]/);
		}
	});
});

function toolFixture(dir, tool, version) {
	const root = path.join(dir, 'node_modules', 'eslint-config-expo-magic');
	const nested = path.join(root, 'node_modules', tool);
	fs.mkdirSync(nested, { recursive: true });
	fs.mkdirSync(path.join(dir, 'node_modules', '.bin'), { recursive: true });
	writeJson(path.join(dir, 'package.json'), { private: true });
	writeJson(path.join(root, 'package.json'), {
		name: 'eslint-config-expo-magic',
		bin: { [tool]: 'launcher.js' },
	});
	writeJson(path.join(nested, 'package.json'), {
		name: tool,
		version,
		bin: tool === 'prettier' ? 'cli.js' : { [tool]: 'cli.js' },
	});
	const output = tool === 'eslint' ? `v${version}` : version;
	const toolExecutable = path.join(nested, 'cli.js');
	fs.writeFileSync(toolExecutable, `console.log(${JSON.stringify(output)});`);
	fs.writeFileSync(
		path.join(root, 'launcher.js'),
		`console.log(${JSON.stringify(output)});`,
	);
	fs.symlinkSync(
		path.join(root, 'launcher.js'),
		path.join(dir, 'node_modules', '.bin', tool),
	);
	const command = path.join(dir, 'command.js');
	fs.writeFileSync(command, `console.log(${JSON.stringify(output)});`);
	return { root, command, toolExecutable };
}

describe('package-owned CLI contracts', () => {
	for (const [tool, version] of [
		['eslint', '10.10.0'],
		['prettier', '3.9.6'],
	]) {
		test(`${tool} accepts a bin linked directly to its package-resolved executable`, () => {
			withTempConsumer('direct-tool-bin', (dir) => {
				const { command, toolExecutable } = toolFixture(dir, tool, version);
				const bin = path.join(dir, 'node_modules', '.bin', tool);
				fs.unlinkSync(bin);
				fs.symlinkSync(toolExecutable, bin);
				expect(
					validateToolVersion(dir, tool, process.execPath, [command]),
				).toBe(version);
			});
		});
		test(`${tool} resolves its nested version despite a different root version`, () => {
			withTempConsumer('tool-version', (dir) => {
				const { command } = toolFixture(dir, tool, version);
				const rootTool = path.join(dir, 'node_modules', tool);
				fs.mkdirSync(rootTool);
				writeJson(path.join(rootTool, 'package.json'), {
					name: tool,
					version: '1.0.0',
				});
				expect(
					validateToolVersion(dir, tool, process.execPath, [command]),
				).toBe(version);
			});
		});
	}

	test('rejects a successful consumer invocation of the wrong ESLint version', () => {
		withTempConsumer('wrong-version', (dir) => {
			const { command } = toolFixture(dir, 'eslint', '10.10.0');
			fs.writeFileSync(command, "console.log('v9.39.4');");
			// The old exit-status-only smoke accepted this exact result.
			expect(
				run(process.execPath, [command, 'eslint', '--version']).status,
			).toBe(0);
			expect(() =>
				validateToolVersion(dir, 'eslint', process.execPath, [command]),
			).toThrow(/version mismatch.*v10.10.0.*v9.39.4/);
		});
	});

	test('rejects a launcher returning a different version', () => {
		withTempConsumer('wrong-launcher', (dir) => {
			const { root, command } = toolFixture(dir, 'prettier', '3.9.6');
			fs.writeFileSync(path.join(root, 'launcher.js'), "console.log('3.0.0');");
			expect(() =>
				validateToolVersion(dir, 'prettier', process.execPath, [command]),
			).toThrow(/version mismatch/);
		});
	});

	test('rejects an unrelated same-version consumer bin', () => {
		withTempConsumer('wrong-bin', (dir) => {
			const { command } = toolFixture(dir, 'eslint', '10.10.0');
			const bin = path.join(dir, 'node_modules', '.bin', 'eslint');
			fs.unlinkSync(bin);
			fs.symlinkSync(command, bin);
			expect(() =>
				validateToolVersion(dir, 'eslint', process.execPath, [command]),
			).toThrow(/package-owned launcher/);
		});
	});
});

describe('packed content contracts', () => {
	const manifest = {
		exports: {
			'.': {
				types: './index.d.ts',
				import: './index.mjs',
				require: './index.js',
			},
		},
		bin: { eslint: 'bin/eslint.js' },
	};
	const entries = [
		'package.json',
		'README.md',
		'types.d.ts',
		'.prettierrc.js',
		'index.d.ts',
		'index.mjs',
		'index.js',
		'bin/eslint.js',
	].map((file) => `package/${file}`);
	test('accepts all declared targets', () => {
		expect(() => validatePackedFiles(manifest, entries)).not.toThrow();
	});
	test('rejects a missing declaration or launcher', () => {
		for (const target of ['index.d.ts', 'bin/eslint.js']) {
			expect(() =>
				validatePackedFiles(
					manifest,
					entries.filter((file) => file !== `package/${target}`),
				),
			).toThrow(/missing declared target/);
		}
	});
	test('rejects shipped test sources', () => {
		expect(() =>
			validatePackedFiles(manifest, [
				...entries,
				'package/utils/plugin/rules/example.test.js',
			]),
		).toThrow(/development-only/);
	});
});

test('temporary consumers are removed when a subprocess times out', () => {
	let tempDir;
	expect(() =>
		withTempConsumer('timeout', (dir) => {
			tempDir = dir;
			run(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], {
				timeout: 50,
			});
		}),
	).toThrow();
	expect(fs.existsSync(tempDir)).toBe(false);
});
