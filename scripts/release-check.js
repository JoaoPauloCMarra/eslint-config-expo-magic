#!/usr/bin/env bun

const path = require('node:path');
const { spawnSync } = require('node:child_process');

const rootDir = path.resolve(__dirname, '..');

function run(command, args, cwd = rootDir) {
	const result = spawnSync(command, args, {
		cwd,
		stdio: 'inherit',
	});

	if (result.status !== 0) {
		process.exit(result.status ?? 1);
	}
}

const checks = ['test', 'typecheck', 'golden:bun', 'smoke:bun-consumer'];

for (const script of checks) {
	run('bun', ['run', script]);
}

run(
	'bun',
	['pm', 'pack', '--dry-run'],
	path.join(rootDir, 'packages/eslint-config-expo-magic'),
);
