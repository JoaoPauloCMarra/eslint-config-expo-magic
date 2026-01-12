#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PKG_DIR = path.join(
	__dirname,
	'..',
	'packages',
	'eslint-config-expo-magic',
);

const REQUIRED_FILES = [
	'index.js',
	'package.json',
	'.prettierrc.js',
	'utils/app.js',
	'utils/imports.js',
	'utils/jest.js',
	'utils/prettier.js',
	'utils/react.js',
	'utils/typescript.js',
];

console.log('🔍 Checking package files...\n');

let allPresent = true;
for (const file of REQUIRED_FILES) {
	const filePath = path.join(PKG_DIR, file);
	if (fs.existsSync(filePath)) {
		console.log(`  ✅ ${file}`);
	} else {
		console.log(`  ❌ ${file} — MISSING`);
		allPresent = false;
	}
}

if (!allPresent) {
	console.log('\n🚫 Some required files are missing. Aborting.');
	process.exit(1);
}

console.log('\n📦 Running npm pack (dry-run)...');
try {
	const output = execSync('npm pack --dry-run', {
		cwd: PKG_DIR,
		encoding: 'utf-8',
	});
	console.log(output);
} catch (err) {
	console.error('❌ npm pack failed:', err.message);
	process.exit(1);
}

console.log('✅ All checks passed. Ready to publish.\n');

const readline = require('readline');
const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});

rl.question('Publish to npm? (y/n): ', (answer) => {
	rl.close();
	if (answer.toLowerCase() === 'y') {
		console.log('\n🚀 Publishing...');
		try {
			execSync('npm publish', { cwd: PKG_DIR, stdio: 'inherit' });
			console.log('\n🎉 Published successfully!');
		} catch (err) {
			console.error('❌ Publish failed:', err.message);
			process.exit(1);
		}
	} else {
		console.log('Aborted.');
	}
});
