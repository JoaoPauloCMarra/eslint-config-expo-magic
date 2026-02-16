#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '../..');
const bunLockfile = path.join(projectRoot, 'bun.lock');

if (!fs.existsSync(bunLockfile)) {
	console.error('❌ No bun.lock file found!');
	console.error('🚀 Please run: bun install');
	process.exit(1);
}

const otherLockfiles = ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml'];
const existingLockfiles = otherLockfiles.filter((lockfile) =>
	fs.existsSync(path.join(projectRoot, lockfile)),
);

if (existingLockfiles.length > 0) {
	console.error('❌ Found lockfiles from other package managers:');
	existingLockfiles.forEach((lockfile) => console.error(`   - ${lockfile}`));
	console.error('🧹 Please remove them and use bun instead');
	console.error('💡 Run: rm package-lock.json yarn.lock pnpm-lock.yaml');
	process.exit(1);
}

console.log('✅ Package manager check passed! Using bun correctly.');
