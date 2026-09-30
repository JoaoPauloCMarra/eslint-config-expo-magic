import { describe, expect, it } from 'bun:test';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const cjsEslintConfig =
	"module.exports = require('eslint-config-expo-magic/mobile-app');\n";

function withTempProject(
	files: Record<string, string>,
	run: (tempDir: string) => void,
) {
	const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-magic-init-'));
	for (const [fileName, contents] of Object.entries(files)) {
		fs.writeFileSync(path.join(tempDir, fileName), contents);
	}

	try {
		run(tempDir);
	} finally {
		fs.rmSync(tempDir, { recursive: true, force: true });
	}
}

function runInit(tempDir: string, args: string[] = ['--write']) {
	return spawnSync(
		process.execPath,
		[path.join(__dirname, 'init-agent.js'), ...args],
		{ cwd: tempDir, encoding: 'utf8' },
	);
}

function readJson(filePath: string) {
	return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

describe('mobile app initializer', () => {
	it('writes the shared config and preserves existing package settings', () => {
		withTempProject(
			{
				'package.json': `${JSON.stringify({ name: 'consumer', scripts: { lint: 'custom-lint' } }, null, 2)}\n`,
			},
			(tempDir) => {
				const result = runInit(tempDir);

				expect(result.status).toBe(0);
				expect(
					fs.readFileSync(path.join(tempDir, 'eslint.config.js'), 'utf8'),
				).toBe(cjsEslintConfig);
				const packageJson = readJson(path.join(tempDir, 'package.json'));
				expect(packageJson.name).toBe('consumer');
				expect(packageJson.prettier).toBe('eslint-config-expo-magic/prettier');
				expect(packageJson.scripts).toEqual({
					lint: 'custom-lint',
					typecheck: 'tsc --noEmit',
					'validate:pr-guardrails': 'expo-magic-pr-guardrails',
				});
			},
		);
	});

	for (const configName of [
		'eslint.config.js',
		'eslint.config.mjs',
		'eslint.config.cjs',
		'eslint.config.ts',
		'eslint.config.mts',
		'eslint.config.cts',
	]) {
		it(`keeps an existing ${configName} as the only ESLint config`, () => {
			withTempProject(
				{
					'package.json': '{ "name": "consumer" }\n',
					[configName]: 'export default [];\n',
				},
				(tempDir) => {
					const result = runInit(tempDir);

					expect(result.status).toBe(0);
					expect(result.stdout).toContain(configName);
					const eslintConfigs = fs
						.readdirSync(tempDir)
						.filter((fileName: string) =>
							fileName.startsWith('eslint.config.'),
						);
					expect(eslintConfigs).toEqual([configName]);
					expect(fs.readFileSync(path.join(tempDir, configName), 'utf8')).toBe(
						'export default [];\n',
					);
				},
			);
		});
	}

	it('writes a CommonJS-safe config in an ESM package', () => {
		withTempProject(
			{ 'package.json': '{ "name": "consumer", "type": "module" }\n' },
			(tempDir) => {
				const result = runInit(tempDir);

				expect(result.status).toBe(0);
				expect(fs.existsSync(path.join(tempDir, 'eslint.config.js'))).toBe(
					false,
				);
				expect(
					fs.readFileSync(path.join(tempDir, 'eslint.config.cjs'), 'utf8'),
				).toBe(cjsEslintConfig);
			},
		);
	});

	it('names the ESM-safe config in the printed plan', () => {
		withTempProject(
			{ 'package.json': '{ "name": "consumer", "type": "module" }\n' },
			(tempDir) => {
				const result = runInit(tempDir, []);

				expect(result.status).toBe(0);
				expect(result.stdout).toContain('Recommended eslint.config.cjs');
				expect(fs.readdirSync(tempDir)).toEqual(['package.json']);
			},
		);
	});

	for (const prettierFile of [
		'.prettierrc',
		'.prettierrc.json',
		'.prettierrc.yaml',
		'.prettierrc.js',
		'prettier.config.js',
		'prettier.config.mjs',
	]) {
		it(`does not shadow an existing ${prettierFile}`, () => {
			withTempProject(
				{
					'package.json': '{ "name": "consumer" }\n',
					[prettierFile]: '{}\n',
				},
				(tempDir) => {
					const result = runInit(tempDir);

					expect(result.status).toBe(0);
					expect(result.stdout).toContain(prettierFile);
					const packageJson = readJson(path.join(tempDir, 'package.json'));
					expect(packageJson.prettier).toBeUndefined();
					expect(packageJson.scripts.lint).toBe('eslint .');
				},
			);
		});
	}

	it('keeps an existing package.json prettier key', () => {
		withTempProject(
			{
				'package.json':
					'{ "name": "consumer", "prettier": "@acme/prettier" }\n',
			},
			(tempDir) => {
				const result = runInit(tempDir);

				expect(result.status).toBe(0);
				expect(readJson(path.join(tempDir, 'package.json')).prettier).toBe(
					'@acme/prettier',
				);
			},
		);
	});

	it('leaves a complete package.json byte-for-byte unchanged', () => {
		const contents = `${JSON.stringify(
			{
				name: 'consumer',
				prettier: 'eslint-config-expo-magic/prettier',
				scripts: {
					lint: 'eslint .',
					typecheck: 'tsc --noEmit',
					'validate:pr-guardrails': 'expo-magic-pr-guardrails',
				},
			},
			null,
			'\t',
		)}\n`;

		withTempProject({ 'package.json': contents }, (tempDir) => {
			const result = runInit(tempDir);

			expect(result.status).toBe(0);
			expect(result.stdout).not.toContain('Updated package.json');
			expect(fs.readFileSync(path.join(tempDir, 'package.json'), 'utf8')).toBe(
				contents,
			);
		});
	});

	it('preserves package.json indentation when it adds scripts', () => {
		withTempProject(
			{
				'package.json': `${JSON.stringify({ name: 'consumer' }, null, '\t')}\n`,
			},
			(tempDir) => {
				const result = runInit(tempDir);
				const written = fs.readFileSync(
					path.join(tempDir, 'package.json'),
					'utf8',
				);

				expect(result.status).toBe(0);
				expect(written).toBe(
					`${JSON.stringify(readJson(path.join(tempDir, 'package.json')), null, '\t')}\n`,
				);
				expect(written).toContain('\n\t"scripts": {\n\t\t"lint"');
			},
		);
	});

	it('stops without writing when there is no package.json', () => {
		withTempProject({}, (tempDir) => {
			const result = runInit(tempDir);

			expect(result.status).not.toBe(0);
			expect(result.stderr).toContain('package.json');
			expect(fs.readdirSync(tempDir)).toEqual([]);
		});
	});
});
