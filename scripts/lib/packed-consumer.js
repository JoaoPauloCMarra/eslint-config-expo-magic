const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const rootDir = path.resolve(__dirname, '../..');
const packageDir = path.join(rootDir, 'packages', 'eslint-config-expo-magic');
let tempPathSequence = 0;

function run(command, args, options = {}) {
	const result = spawnSync(command, args, {
		encoding: 'utf8',
		stdio: 'pipe',
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

		return callback(tarballPath);
	});
}

function writeJson(filePath, value) {
	fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

module.exports = {
	packageDir,
	rootDir,
	run,
	withPackedTarball,
	withTempConsumer,
	writeJson,
};
