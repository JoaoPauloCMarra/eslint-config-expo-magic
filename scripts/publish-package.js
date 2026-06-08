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

function isNpmAlwaysIncludedFile(targetPath) {
	return /^(package\.json|readme(\.[^/]*)?|license(\.[^/]*)?)$/i.test(
		targetPath,
	);
}

function splitGlobEntry(entry) {
	const wildcardIndex = entry.indexOf('*');
	if (wildcardIndex === -1) {
		return null;
	}

	const prefix = entry.slice(0, wildcardIndex);
	const lastSlashIndex = prefix.lastIndexOf('/');
	const dir = lastSlashIndex === -1 ? '.' : prefix.slice(0, lastSlashIndex);
	const filePrefix =
		lastSlashIndex === -1 ? prefix : prefix.slice(lastSlashIndex + 1);

	return {
		dir: path.join(PKG_DIR, dir),
		prefix: filePrefix,
		suffix: entry.slice(wildcardIndex + 1),
	};
}

function packageFilesEntryExists(entry) {
	const glob = splitGlobEntry(entry);
	if (!glob) {
		return fs.existsSync(path.join(PKG_DIR, entry));
	}

	if (!fs.existsSync(glob.dir)) {
		return false;
	}

	return fs
		.readdirSync(glob.dir)
		.some((file) => file.startsWith(glob.prefix) && file.endsWith(glob.suffix));
}

function packageFilesEntryIncludesPath(entry, targetPath) {
	if (entry === targetPath) {
		return true;
	}

	if (!entry.includes('*')) {
		return targetPath.startsWith(`${entry.replace(/\/$/, '')}/`);
	}

	const wildcardIndex = entry.indexOf('*');
	const prefix = entry.slice(0, wildcardIndex);
	const suffix = entry.slice(wildcardIndex + 1);
	return targetPath.startsWith(prefix) && targetPath.endsWith(suffix);
}

function ensureRequiredFiles() {
	const packageJson = JSON.parse(
		fs.readFileSync(path.join(PKG_DIR, 'package.json'), 'utf8'),
	);
	const packageFiles = packageJson.files ?? [];
	const requiredFiles = collectRequiredFiles(packageJson);

	let allPresent = true;
	console.log('Checking package entrypoints:\n');
	for (const file of requiredFiles) {
		const filePath = path.join(PKG_DIR, file);
		if (fs.existsSync(filePath)) {
			console.log(`  OK  ${file}`);
			continue;
		}

		console.log(`  MISSING  ${file}`);
		allPresent = false;
	}

	console.log('\nChecking package file allowlist:\n');
	for (const entry of packageFiles) {
		if (packageFilesEntryExists(entry)) {
			console.log(`  OK  ${entry}`);
			continue;
		}

		console.log(`  MISSING  ${entry}`);
		allPresent = false;
	}

	for (const file of requiredFiles) {
		if (isNpmAlwaysIncludedFile(file)) {
			continue;
		}

		if (packageFiles.some((entry) => packageFilesEntryIncludesPath(entry, file))) {
			continue;
		}

		console.log(`  NOT LISTED  ${file}`);
		allPresent = false;
	}

	if (!allPresent) {
		console.log('\nRelease checks failed: required package files are missing.');
		process.exit(1);
	}
}

function runReleaseCheck() {
	console.log('\nRunning release checks...');
	run('node', [path.join(ROOT_DIR, 'scripts', 'release-check.js')], {
		cwd: ROOT_DIR,
	});
}

function main() {
	const args = process.argv.slice(2);
	const shouldPublish = args.includes('--publish');
	const publishArgs = args.filter((arg) => arg !== '--publish');

	ensureRequiredFiles();
	runReleaseCheck();

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
