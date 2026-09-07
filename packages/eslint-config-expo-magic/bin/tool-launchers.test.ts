import { describe, expect, it } from 'bun:test';

const path = require('node:path');
const { spawnSync } = require('node:child_process');

const packageDir = path.resolve(__dirname, '..');

function runLauncher(fileName: string) {
	return spawnSync(
		process.execPath,
		[path.join(__dirname, fileName), '--version'],
		{
			cwd: packageDir,
			encoding: 'utf8',
		},
	);
}

describe('tool launchers', () => {
	for (const [fileName, packageName] of [
		['eslint.js', 'eslint'],
		['prettier.js', 'prettier'],
	] as const) {
		it(`runs the package-owned ${packageName} executable`, () => {
			const result = runLauncher(fileName);
			const version = require(`${packageName}/package.json`).version;
			const expectedOutput = packageName === 'eslint' ? `v${version}` : version;

			expect(result.error).toBeUndefined();
			expect(result.status).toBe(0);
			expect(result.stderr).toBe('');
			expect(result.stdout.trim()).toBe(expectedOutput);
		});
	}
});
