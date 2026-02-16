#!/usr/bin/env bun

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const PKG_DIR = path.join(
	__dirname,
	'..',
	'packages',
	'eslint-config-expo-magic',
);

const REQUIRED_FILES = [
	'index.js',
	'index.mjs',
	'strict.js',
	'strict.mjs',
	'no-prettier.js',
	'no-prettier.mjs',
	'index.d.ts',
	'strict.d.ts',
	'no-prettier.d.ts',
	'package.json',
	'.prettierrc.js',
	'utils/app.js',
	'utils/imports.js',
	'utils/jest.js',
	'utils/prettier.js',
	'utils/react.js',
	'utils/typescript.js',
];

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

function ensureRequiredFiles() {
	console.log('Checking package files:\n');

	let allPresent = true;
	for (const file of REQUIRED_FILES) {
		const filePath = path.join(PKG_DIR, file);
		if (fs.existsSync(filePath)) {
			console.log(`  OK  ${file}`);
			continue;
		}

		console.log(`  MISSING  ${file}`);
		allPresent = false;
	}

	if (!allPresent) {
		console.log('\nRelease checks failed: required package files are missing.');
		process.exit(1);
	}
}

function main() {
	const args = process.argv.slice(2);
	const shouldPublish = args.includes('--publish');
	const publishArgs = args.filter((arg) => arg !== '--publish');

	ensureRequiredFiles();

	console.log('\nRunning tarball dry-run...');
	run('bun', ['pm', 'pack', '--dry-run']);

	console.log('\nRunning registry dry-run...');
	run('bun', ['publish', '--dry-run', ...publishArgs]);

	if (!shouldPublish) {
		console.log(
			'\nDry-run checks passed. Re-run with --publish to publish for real.',
		);
		process.exit(0);
	}

	console.log('\nPublishing package...');
	run('bun', ['publish', ...publishArgs]);
	console.log('\nPublish completed.');
}

main();
