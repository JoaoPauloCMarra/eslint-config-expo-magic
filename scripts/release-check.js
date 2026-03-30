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

run('bun', ['run', 'check-pm']);
run('bun', ['run', 'test']);
run('bun', ['run', 'validate']);
run('bun', ['run', 'smoke:pack']);
