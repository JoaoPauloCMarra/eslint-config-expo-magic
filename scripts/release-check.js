#!/usr/bin/env node

const path = require('path');
const { spawnSync } = require('child_process');

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

const checks = [
	'check-pm',
	'report:config',
	'report:release-notes',
	'audit:deps',
	'test',
	'typecheck',
	'validate',
	'smoke:release',
	'smoke:clean-sdk57',
];

for (const script of checks) {
	run('bun', ['run', script]);
}

run(
	'bun',
	['pm', 'pack', '--dry-run'],
	path.join(rootDir, 'packages/eslint-config-expo-magic'),
);
