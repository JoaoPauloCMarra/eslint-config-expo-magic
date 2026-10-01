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

const reportFiles = [
	'docs/CONFIG_DIFF.md',
	'docs/config-diff.json',
	'docs/RELEASE_NOTES.next.md',
];

function assertReportsCommitted() {
	const result = spawnSync(
		'git',
		['diff', 'HEAD', '--exit-code', '--', ...reportFiles],
		{
			cwd: rootDir,
			stdio: 'inherit',
		},
	);

	if (result.error) {
		throw result.error;
	}

	if (result.status !== 0) {
		console.error(
			'\nGenerated release reports differ from the committed files. Run `bun run report:config && bun run report:release-notes` and commit the result.',
		);
		process.exit(result.status ?? 1);
	}
}

const reportChecks = ['check-pm', 'report:config', 'report:release-notes'];
const checks = [
	'audit:deps',
	'test',
	'typecheck',
	'validate',
	'smoke:release',
	'smoke:clean-sdk57',
];

for (const script of reportChecks) {
	run('bun', ['run', script]);
}

assertReportsCommitted();

if (process.argv.includes('--reports-only')) {
	process.exit(0);
}

for (const script of checks) {
	run('bun', ['run', script]);
}

run(
	'bun',
	['pm', 'pack', '--dry-run'],
	path.join(rootDir, 'packages/eslint-config-expo-magic'),
);
