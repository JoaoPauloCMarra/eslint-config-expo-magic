const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { createRequire } = require('node:module');

const rootDir = path.resolve(__dirname, '../..');
const packageDir = path.join(rootDir, 'packages', 'eslint-config-expo-magic');
const fixtureManifestPath = path.join(rootDir, 'test-project', 'package.json');
const sdk57FixturePackages = [
	'@react-native/jest-preset',
	'@types/react',
	'expo',
	'expo-status-bar',
	'jest-expo',
	'react',
	'react-native',
	'react-test-renderer',
];
let tempPathSequence = 0;

function run(command, args, options = {}) {
	const result = spawnSync(command, args, {
		encoding: 'utf8',
		stdio: 'pipe',
		timeout: 300_000,
		killSignal: 'SIGKILL',
		...options,
	});

	if (result.error) {
		throw result.error;
	}

	if (result.status !== 0) {
		const output = [result.stdout, result.stderr]
			.filter(Boolean)
			.join('\n')
			.trim();
		throw new Error(output || `${command} failed`);
	}

	return result;
}

// Resolve from the installed config, never from the consumer's potentially older tool.
function validateToolVersion(consumerDir, tool, command, prefix = []) {
	const consumerRequire = createRequire(path.join(consumerDir, 'package.json'));
	const manifestPath = consumerRequire.resolve(
		'eslint-config-expo-magic/package.json',
	);
	const packageRequire = createRequire(manifestPath);
	const manifest = packageRequire(manifestPath);
	const toolManifestPath = packageRequire.resolve(`${tool}/package.json`);
	const toolManifest = packageRequire(toolManifestPath);
	const toolBin =
		typeof toolManifest.bin === 'string'
			? toolManifest.bin
			: toolManifest.bin?.[tool];
	if (typeof toolBin !== 'string' || !toolBin) {
		throw new Error(
			`${toolManifestPath} does not declare the ${tool} executable.`,
		);
	}
	const toolExecutable = path.resolve(path.dirname(toolManifestPath), toolBin);
	const wrapper = path.resolve(path.dirname(manifestPath), manifest.bin[tool]);
	const installedBin = path.join(consumerDir, 'node_modules', '.bin', tool);
	const actualTarget = fs.realpathSync(installedBin);
	const allowedTargets = [wrapper, toolExecutable].map((target) =>
		fs.realpathSync(target),
	);
	if (!allowedTargets.includes(actualTarget)) {
		throw new Error(
			`${tool} consumer bin ${installedBin} resolves to ${actualTarget}; expected the package-owned launcher or bundled executable: ${allowedTargets.join(' or ')} (resolved from ${toolManifestPath}).`,
		);
	}
	const expected =
		tool === 'eslint' ? `v${toolManifest.version}` : toolManifest.version;
	// Verify both the launcher itself and the command consumers actually run.
	for (const [executable, args] of [
		['node', [wrapper, '--version']],
		[command, [...prefix, tool, '--version']],
	]) {
		const actual = run(executable, args, { cwd: consumerDir }).stdout.trim();
		if (actual !== expected) {
			throw new Error(
				`${tool} version mismatch: expected ${expected}, got ${JSON.stringify(actual)} (${executable}).`,
			);
		}
	}
	return toolManifest.version;
}

function validatePackedFiles(manifest, entries) {
	const files = new Set(
		entries.map((entry) => entry.replace(/^package\//, '')),
	);
	function targets(value) {
		if (typeof value === 'string') return [value];
		if (!value) return [];
		return Object.values(value).flatMap(targets);
	}
	const required = [
		'package.json',
		'README.md',
		'types.d.ts',
		'.prettierrc.js',
		...targets(manifest.exports),
		...targets(manifest.bin),
		...targets(manifest.main),
		...targets(manifest.module),
		...targets(manifest.types),
	];
	for (const target of required) {
		if (!files.has(target.replace(/^\.\//, ''))) {
			throw new Error(`Packed package is missing declared target: ${target}.`);
		}
	}
	for (const file of files) {
		if (
			/(?:^|\/)(?:node_modules|test-project|__tests__)(?:\/|$)|\.(?:test|spec)\.[cm]?[jt]sx?$|(?:^|\/)(?:AGENTS\.md|check-pm\.js|type-tests\.ts)$/.test(
				file,
			)
		) {
			throw new Error(
				`Packed package contains development-only file: ${file}.`,
			);
		}
	}
}

function createUniqueTempDir(name) {
	const safeName = name.replace(/[^a-z0-9-]/gi, '-').toLowerCase();

	for (let attempt = 0; attempt < 100; attempt += 1) {
		const sequence = tempPathSequence;
		tempPathSequence += 1;
		const tempDir = path.join(
			os.tmpdir(),
			`eslint-config-expo-magic-${safeName}-${process.pid}-${sequence}`,
		);

		try {
			fs.mkdirSync(tempDir);
			return tempDir;
		} catch (error) {
			if (error.code !== 'EEXIST') {
				throw error;
			}
		}
	}

	throw new Error(
		`Could not allocate a unique temporary directory for ${name}.`,
	);
}

function withTempConsumer(name, callback) {
	const tempProjectDir = createUniqueTempDir(name);

	try {
		return callback(tempProjectDir);
	} finally {
		fs.rmSync(tempProjectDir, { recursive: true, force: true });
	}
}

function withPackedTarball(callback) {
	return withTempConsumer('packed-tarball', (tarballDir) => {
		const tarballPath = path.join(
			tarballDir,
			'eslint-config-expo-magic-local.tgz',
		);
		const packageJson = require(path.join(packageDir, 'package.json'));
		const originalBinModes = Object.values(packageJson.bin ?? {}).map(
			(relativePath) => {
				const binPath = path.join(packageDir, relativePath);
				return [binPath, fs.statSync(binPath).mode];
			},
		);

		try {
			run('bun', ['pm', 'pack', '--filename', tarballPath, '--quiet'], {
				cwd: packageDir,
			});
		} finally {
			for (const [binPath, mode] of originalBinModes) {
				fs.chmodSync(binPath, mode);
			}
		}

		if (!fs.existsSync(tarballPath)) {
			throw new Error(`Packed tarball missing at ${tarballPath}.`);
		}

		const entries = run('tar', ['-tzf', tarballPath]).stdout.trim().split('\n');
		validatePackedFiles(packageJson, entries);
		return callback(tarballPath);
	});
}

function readSdk57FixtureVersions(
	manifest = JSON.parse(fs.readFileSync(fixtureManifestPath, 'utf8')),
) {
	const devDependencies = manifest.devDependencies ?? {};
	const missing = sdk57FixturePackages.filter(
		(packageName) => typeof devDependencies[packageName] !== 'string',
	);

	if (missing.length > 0) {
		throw new Error(
			`test-project/package.json is missing SDK 57 fixture versions: ${missing.join(', ')}.`,
		);
	}

	return Object.fromEntries(
		sdk57FixturePackages.map((packageName) => [
			packageName,
			devDependencies[packageName],
		]),
	);
}

function writeJson(filePath, value) {
	fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

module.exports = {
	validateToolVersion,
	validatePackedFiles,
	packageDir,
	readSdk57FixtureVersions,
	rootDir,
	run,
	withPackedTarball,
	withTempConsumer,
	writeJson,
};
