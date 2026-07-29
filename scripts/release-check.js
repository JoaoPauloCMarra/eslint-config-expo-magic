#!/usr/bin/env node

const path = require('path');
const { spawnSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');

function run(command, args) {
	const result = spawnSync(command, args, {
		cwd: rootDir,
		stdio: 'inherit',
	});

	if (result.status !== 0) {
		process.exit(result.status ?? 1);
	}
}

const checks = [
	'check-pm',
	'report:config',
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
