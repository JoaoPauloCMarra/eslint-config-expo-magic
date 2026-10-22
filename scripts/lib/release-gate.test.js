const { describe, expect, test } = require('bun:test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

function exercise({ fail = '' } = {}) {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-release-gate-'));
	try {
		fs.mkdirSync(path.join(dir, 'scripts'));
		fs.mkdirSync(path.join(dir, 'packages/eslint-config-expo-magic'), {
			recursive: true,
		});
		fs.mkdirSync(path.join(dir, 'bin'));
		fs.copyFileSync(
			path.join(__dirname, '../release-check.js'),
			path.join(dir, 'scripts/release-check.js'),
		);
		for (const command of ['bun']) {
			fs.writeFileSync(
				path.join(dir, 'bin', command),
				`#!/usr/bin/env node\nconst fs = require('node:fs'); const entry = ${JSON.stringify(command)} + ' ' + process.argv.slice(2).join(' '); fs.appendFileSync(process.env.GATE_TRACE, entry + '\\n'); if (entry.includes(process.env.GATE_FAIL || '\\0')) process.exit(17);\n`,
				{ mode: 0o755 },
			);
		}
		const trace = path.join(dir, 'trace.txt');
		const result = spawnSync(
			process.execPath,
			[path.join(dir, 'scripts/release-check.js')],
			{
				encoding: 'utf8',
				timeout: 10_000,
				env: {
					...process.env,
					PATH: `${path.join(dir, 'bin')}${path.delimiter}${process.env.PATH}`,
					GATE_TRACE: trace,
					GATE_FAIL: fail,
				},
			},
		);
		if (result.error) throw result.error;
		return {
			status: result.status,
			commands: fs.readFileSync(trace, 'utf8').trim().split('\n'),
		};
	} finally {
		fs.rmSync(dir, { recursive: true, force: true });
	}
}

describe('release gate execution', () => {
	test('runs every required gate before packing', () => {
		const result = exercise();
		expect(result.status).toBe(0);
		expect(result.commands).toEqual([
			'bun run test',
			'bun run typecheck',
			'bun run golden:bun',
			'bun run smoke:bun-consumer',
			'bun pm pack --dry-run',
		]);
	});

	for (const failure of ['run test', 'typecheck', 'golden:bun', 'smoke:bun-consumer']) {
		test(`stops before packing when ${failure} fails`, () => {
			const result = exercise({ fail: failure });
			expect(result.status).toBe(17);
			expect(result.commands.at(-1)).toContain(failure);
			expect(result.commands).not.toContain('bun pm pack --dry-run');
		});
	}
});

