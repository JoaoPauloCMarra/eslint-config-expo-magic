import { describe, expect, it } from 'bun:test';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const packageDir = path.resolve(__dirname, '..');

function runLauncher(fileName: string, args: string[] = ['--version']) {
	return spawnSync(
		process.execPath,
		[path.join(__dirname, fileName), ...args],
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

	it('passes a non-zero tool exit code through', () => {
		const result = runLauncher('eslint.js', ['--no-such-flag']);

		expect(result.error).toBeUndefined();
		expect(result.status).toBe(2);
	});

	it('re-raises the signal that terminated the tool', () => {
		const tempDir = fs.mkdtempSync(
			path.join(os.tmpdir(), 'expo-magic-launcher-'),
		);
		const configPath = path.join(tempDir, 'eslint.config.cjs');
		fs.writeFileSync(
			configPath,
			"process.kill(process.pid, 'SIGTERM');\nmodule.exports = [];\n",
		);
		fs.writeFileSync(path.join(tempDir, 'a.js'), 'export {};\n');

		try {
			const result = runLauncher('eslint.js', [
				'--config',
				configPath,
				path.join(tempDir, 'a.js'),
			]);

			expect(result.error).toBeUndefined();
			expect(result.status).toBeNull();
			expect(result.signal).toBe('SIGTERM');
		} finally {
			fs.rmSync(tempDir, { recursive: true, force: true });
		}
	});
});
