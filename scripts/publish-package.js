#!/usr/bin/env bun

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT_DIR = path.join(__dirname, '..');
const PKG_DIR = path.join(
	__dirname,
	'..',
	'packages',
	'eslint-config-expo-magic',
);

function run(command, args, options = {}) {
	const result = spawnSync(command, args, {
		cwd: PKG_DIR,
		stdio: 'inherit',
		...options,
	});

	if (result.status !== 0) {
		process.exit(result.status ?? 1);
	}
}

function collectTargetPaths(value, targets = new Set()) {
	if (!value) {
		return targets;
	}

	if (typeof value === 'string') {
		targets.add(value.replace(/^\.\//, ''));
		return targets;
	}

	if (Array.isArray(value)) {
		for (const item of value) {
			collectTargetPaths(item, targets);
		}
		return targets;
	}

	if (typeof value === 'object') {
		for (const item of Object.values(value)) {
			collectTargetPaths(item, targets);
		}
	}

	return targets;
}

function collectRequiredFiles(packageJson) {
	const requiredFiles = new Set();

	for (const field of ['main', 'module', 'types']) {
		collectTargetPaths(packageJson[field], requiredFiles);
	}
	collectTargetPaths(packageJson.exports, requiredFiles);
	collectTargetPaths(packageJson.bin, requiredFiles);

	return [...requiredFiles].sort();
}

// The tarball file list from Bun is the only reliable reading of the package
// `files` patterns, which use `**` and `!` negations.
function packedFiles() {
	const result = spawnSync('bun', ['pm', 'pack', '--dry-run'], {
		cwd: PKG_DIR,
		encoding: 'utf8',
	});
	if (result.status !== 0) {
		process.stderr.write(result.stderr);
		process.exit(result.status ?? 1);
	}

	return new Set(
		result.stdout
			.split('\n')
			.flatMap((line) => line.match(/^packed \S+ (.+)$/)?.[1] ?? []),
	);
}

function ensureRequiredFiles() {
	const packageJson = JSON.parse(
		fs.readFileSync(path.join(PKG_DIR, 'package.json'), 'utf8'),
	);
	const packed = packedFiles();

	let allPresent = true;
	console.log('Checking package entrypoints in the tarball:\n');
	for (const file of collectRequiredFiles(packageJson)) {
		if (packed.has(file)) {
			console.log(`  OK  ${file}`);
			continue;
		}

		console.log(`  NOT PACKED  ${file}`);
		allPresent = false;
	}

	if (!allPresent) {
		console.log('\nRelease checks failed: required package files are missing.');
		process.exit(1);
	}
}

function runReleaseCheck() {
	console.log('\nRunning release checks...');
	run('bun', [path.join(ROOT_DIR, 'scripts', 'release-check.js')], {
		cwd: ROOT_DIR,
	});
}

function main() {
	const args = process.argv.slice(2);
	const shouldPublish = args.includes('--publish');
	const ciVerified = args.includes('--ci-verified');
	const publishArgs = args.filter(
		(arg) => arg !== '--publish' && arg !== '--ci-verified',
	);

	ensureRequiredFiles();
	if (!ciVerified) {
		runReleaseCheck();
	}

	console.log('\nRunning tarball dry-run...');
	run('bun', ['pm', 'pack', '--dry-run']);

	console.log('\nRunning registry dry-run...');
	run('npm', [
		'publish',
		'--dry-run',
		'--ignore-scripts',
		'--access',
		'public',
		...publishArgs,
	]);

	if (!shouldPublish) {
		console.log(
			'\nDry-run checks passed. Re-run with --publish to publish for real.',
		);
		process.exit(0);
	}

	console.log('\nPublishing package...');
	run('npm', [
		'publish',
		'--ignore-scripts',
		'--access',
		'public',
		...(process.env.GITHUB_ACTIONS === 'true' ? ['--provenance'] : []),
		...publishArgs,
	]);
	console.log('\nPublish completed.');
}

main();
