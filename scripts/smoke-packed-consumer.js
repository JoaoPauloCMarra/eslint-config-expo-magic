#!/usr/bin/env bun

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const packageDir = path.join(rootDir, 'packages', 'eslint-config-expo-magic');

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
		throw new Error(result.stderr || result.stdout || `${command} failed`);
	}

	return result;
}

function listTarballs() {
	return fs
		.readdirSync(packageDir)
		.filter((file) => file.endsWith('.tgz'))
		.sort((a, b) => {
			const aPath = path.join(packageDir, a);
			const bPath = path.join(packageDir, b);
			return fs.statSync(bPath).mtimeMs - fs.statSync(aPath).mtimeMs;
		});
}

function createFixturePackageJson(tarballPath) {
	return {
		name: 'eslint-config-expo-magic-smoke',
		private: true,
		type: 'commonjs',
		devDependencies: {
			eslint: '^10.0.0',
			expo: '^54.0.33',
			react: '19.1.0',
			'react-test-renderer': '19.1.0',
			typescript: '^5.9.3',
			'eslint-config-expo-magic': `file:${tarballPath}`,
		},
	};
}

function main() {
	const tarballsBefore = new Set(listTarballs());
	let generatedTarballPath;
	let tempProjectDir;

	try {
		console.log('Packing local tarball...');
		run('bun', ['pm', 'pack'], { cwd: packageDir });

		const newTarball = listTarballs().find((file) => !tarballsBefore.has(file));
		if (!newTarball) {
			throw new Error('Could not find generated tarball from bun pm pack.');
		}
		generatedTarballPath = path.join(packageDir, newTarball);

		tempProjectDir = fs.mkdtempSync(
			path.join(os.tmpdir(), 'eslint-config-expo-magic-smoke-'),
		);
		const fixturePackageJsonPath = path.join(tempProjectDir, 'package.json');
		fs.writeFileSync(
			fixturePackageJsonPath,
			`${JSON.stringify(
				createFixturePackageJson(generatedTarballPath),
				null,
				2,
			)}\n`,
		);

		console.log('Installing fixture dependencies...');
		run('bun', ['install'], { cwd: tempProjectDir });

		fs.writeFileSync(
			path.join(tempProjectDir, 'eslint.config.js'),
			"const strict = require('eslint-config-expo-magic/strict');\n\nmodule.exports = [...strict];\n",
		);
		fs.writeFileSync(
			path.join(tempProjectDir, 'sample.js'),
			"console.log('smoke');\n",
		);

		const lintResult = spawnSync(
			'bunx',
			['eslint', 'sample.js', '--no-config-lookup', '--config', 'eslint.config.js'],
			{
				cwd: tempProjectDir,
				encoding: 'utf8',
			},
		);

		if (lintResult.status === 2) {
			throw new Error(lintResult.stderr || lintResult.stdout);
		}

		const lintCombinedOutput = `${lintResult.stdout}\n${lintResult.stderr}`;
		if (
			lintCombinedOutput.includes(
				'could not find plugin "@typescript-eslint"',
			)
		) {
			throw new Error(lintCombinedOutput);
		}

		run('node', ['-e', "require('eslint-config-expo-magic/no-prettier')"], {
			cwd: tempProjectDir,
		});

		console.log('Pack smoke checks passed.');
	} finally {
		if (tempProjectDir) {
			fs.rmSync(tempProjectDir, { recursive: true, force: true });
		}
		if (generatedTarballPath && fs.existsSync(generatedTarballPath)) {
			fs.unlinkSync(generatedTarballPath);
		}
	}
}

main();
