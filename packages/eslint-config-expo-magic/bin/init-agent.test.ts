import { describe, expect, it } from 'bun:test';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

describe('mobile app initializer', () => {
	it('writes the shared config and preserves existing package settings', () => {
		const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-magic-init-'));
		const packageJsonPath = path.join(tempDir, 'package.json');
		fs.writeFileSync(
			packageJsonPath,
			`${JSON.stringify({ name: 'consumer', scripts: { lint: 'custom-lint' } }, null, 2)}\n`,
		);

		try {
			const result = spawnSync(
				process.execPath,
				[path.join(__dirname, 'init-agent.js'), '--write'],
				{ cwd: tempDir, encoding: 'utf8' },
			);

			expect(result.status).toBe(0);
			expect(
				fs.readFileSync(path.join(tempDir, 'eslint.config.js'), 'utf8'),
			).toBe(
				"module.exports = require('eslint-config-expo-magic/mobile-app');\n",
			);
			const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
			expect(packageJson.name).toBe('consumer');
			expect(packageJson.prettier).toBe('eslint-config-expo-magic/prettier');
			expect(packageJson.scripts).toEqual({
				lint: 'custom-lint',
				typecheck: 'tsc --noEmit',
				'validate:pr-guardrails': 'expo-magic-pr-guardrails',
			});
		} finally {
			fs.rmSync(tempDir, { recursive: true, force: true });
		}
	});
});
