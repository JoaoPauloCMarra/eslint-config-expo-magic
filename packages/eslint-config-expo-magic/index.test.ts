import { describe, expect, it } from 'bun:test';
import type { Linter } from 'eslint';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { pathToFileURL } = require('node:url');
const config = require('./index.js');
const strictSubpath = require('./strict.js');
const noPrettierSubpath = require('./no-prettier.js');
const typedSubpath = require('./typed.js');

type FlatConfig = Linter.Config;
const rootDir = path.resolve(__dirname, '../..');

function runPresetLint(presetModulePath: string, targets: string[]) {
	const tempDir = fs.mkdtempSync(
		path.join(rootDir, '.tmp-eslint-config-expo-magic-'),
	);
	const configPath = path.join(tempDir, 'eslint.config.js');

	try {
		fs.writeFileSync(
			configPath,
			`const preset = require(${JSON.stringify(presetModulePath)});\n\nmodule.exports = [...preset];\n`,
		);

		const result = spawnSync(
			'bunx',
			[
				'eslint',
				...targets,
				'--no-config-lookup',
				'--config',
				configPath,
				'--format=json',
			],
			{
				cwd: rootDir,
				encoding: 'utf8',
			},
		);

		if (![0, 1].includes(result.status ?? -1)) {
			throw new Error(result.stderr || result.stdout);
		}

		return JSON.parse(result.stdout || '[]') as Array<{
			messages: Array<{ ruleId: string | null; severity: number }>;
		}>;
	} finally {
		fs.rmSync(tempDir, { recursive: true, force: true });
	}
}

function getRuleMessages(
	results: Array<{
		messages: Array<{ ruleId: string | null; severity: number }>;
	}>,
) {
	return results.flatMap((result) => result.messages ?? []);
}

describe('eslint-config-expo-magic', () => {
	describe('config structure', () => {
		it('exports an array', () => {
			expect(Array.isArray(config)).toBe(true);
			expect(config.length).toBeGreaterThan(0);
		});

		it('has a strict preset', () => {
			expect(Array.isArray(config.strict)).toBe(true);
			expect(config.strict.length).toBeGreaterThan(config.length);
		});

		it('exports strict subpath', () => {
			expect(Array.isArray(strictSubpath)).toBe(true);
			expect(strictSubpath).toBe(config.strict);
		});

		it('exports no-prettier subpath', () => {
			expect(Array.isArray(noPrettierSubpath)).toBe(true);
			expect(noPrettierSubpath).toBe(config.noPrettier);
			expect(Array.isArray(noPrettierSubpath.strict)).toBe(true);
			expect(Array.isArray(noPrettierSubpath.typed)).toBe(true);
		});

		it('exports typed subpath', () => {
			expect(Array.isArray(typedSubpath)).toBe(true);
			expect(typedSubpath).toBe(config.typed);
			expect(Array.isArray(typedSubpath.noPrettier)).toBe(true);
		});

		it('includes ignore patterns', () => {
			const ignoreConfig = config.find((c: FlatConfig) => c.ignores);
			expect(ignoreConfig).toBeDefined();
			expect(ignoreConfig.ignores).toContain('**/node_modules/**');
			expect(ignoreConfig.ignores).toContain('**/dist/**');
			expect(ignoreConfig.ignores).toContain('**/.expo/**');
			expect(ignoreConfig.ignores).toContain('**/ios/**');
			expect(ignoreConfig.ignores).toContain('**/android/**');
		});
	});

	describe('plugin registration', () => {
		const expectedPlugins = [
			'react',
			'react-hooks',
			'react-native',
			'react-19-upgrade',
			'jest',
			'prettier',
			'unused-imports',
			'testing-library',
			'import-x',
		];

		expectedPlugins.forEach((name) => {
			it(`registers ${name} plugin`, () => {
				const hasPlugin = config.some(
					(c: FlatConfig) => c.plugins && Object.keys(c.plugins).includes(name),
				);
				expect(hasPlugin).toBe(true);
			});
		});
	});

	describe('typescript rules', () => {
		it('has typescript config for .ts/.tsx files', () => {
			const tsConfig = config.find(
				(c: FlatConfig) =>
					c.files &&
					(c.files.includes('**/*.ts') || c.files.includes('**/*.tsx')),
			);
			expect(tsConfig).toBeDefined();
		});

		it('enforces consistent-type-imports', () => {
			const tsConfig = config.find(
				(c: FlatConfig) =>
					c.rules && c.rules['@typescript-eslint/consistent-type-imports'],
			);
			expect(tsConfig).toBeDefined();
			expect(
				tsConfig.rules['@typescript-eslint/consistent-type-imports'][0],
			).toBe('error');
		});

		it('enforces no-explicit-any', () => {
			const tsConfig = config.find(
				(c: FlatConfig) =>
					c.rules && c.rules['@typescript-eslint/no-explicit-any'],
			);
			expect(tsConfig).toBeDefined();
			expect(tsConfig.rules['@typescript-eslint/no-explicit-any']).toBe(
				'error',
			);
		});

		it('prefers type over interface', () => {
			const tsConfig = config.find(
				(c: FlatConfig) =>
					c.rules && c.rules['@typescript-eslint/consistent-type-definitions'],
			);
			expect(tsConfig).toBeDefined();
			expect(
				tsConfig.rules['@typescript-eslint/consistent-type-definitions'],
			).toEqual(['error', 'type']);
		});
	});

	describe('settings and language options', () => {
		it('includes import-x settings', () => {
			const settingsConfig = config.find(
				(c: FlatConfig) => c.settings && c.settings['import-x/extensions'],
			);
			expect(settingsConfig).toBeDefined();
			expect(settingsConfig.settings['import-x/extensions']).toBeDefined();
		});

		it('supports monorepo tsconfig paths for import resolvers', () => {
			const settingsConfig = config.find(
				(c: FlatConfig) =>
					c.settings &&
					c.settings['import-x/resolver-next'] &&
					c.settings['import-x/resolver'] &&
					c.settings['import/resolver'],
			);
			expect(settingsConfig).toBeDefined();

			const importResolverProjects =
				settingsConfig.settings['import/resolver'].typescript.project;
			const importXResolverProjects =
				settingsConfig.settings['import-x/resolver'].typescript.project;

			expect(Array.isArray(importResolverProjects)).toBe(true);
			expect(Array.isArray(importXResolverProjects)).toBe(true);
			expect(importResolverProjects).toContain('./packages/*/tsconfig.json');
			expect(importResolverProjects).toContain('./apps/*/tsconfig.json');
			expect(importXResolverProjects).toContain('./test-project/tsconfig.json');
			expect(settingsConfig.settings['import/resolver'].typescript.bun).toBe(
				true,
			);
			expect(settingsConfig.settings['import-x/resolver-next']).toHaveLength(2);
		});

		it('has browser and mobile globals', () => {
			const globalsConfig = config.find(
				(c: FlatConfig) =>
					c.languageOptions &&
					c.languageOptions.globals &&
					c.languageOptions.globals.__DEV__ === 'readonly',
			);
			expect(globalsConfig).toBeDefined();
			expect(globalsConfig.languageOptions.globals.fetch).toBe(false);
			expect(globalsConfig.languageOptions.globals.__DEV__).toBe('readonly');
		});

		it('has node globals for config files', () => {
			const nodeConfig = config.find(
				(c: FlatConfig) =>
					c.files &&
					c.files.includes('**/*.config.{js,cjs,mjs,ts,mts,cts}') &&
					c.languageOptions &&
					c.languageOptions.globals &&
					c.languageOptions.globals.module !== undefined,
			);
			expect(nodeConfig).toBeDefined();
		});

		it('includes platform and TypeScript module extensions', () => {
			const settingsConfig = config.find(
				(c: FlatConfig) =>
					c.settings &&
					c.settings['import-x/resolver-next'] &&
					c.settings['import-x/extensions'],
			);
			expect(settingsConfig.settings['import-x/extensions']).toContain(
				'.android.tsx',
			);
			expect(settingsConfig.settings['import-x/extensions']).toContain('.mts');
			expect(settingsConfig.settings['import-x/extensions']).toContain(
				'.d.cts',
			);
		});
	});

	describe('react rules', () => {
		it('enables react-hooks/exhaustive-deps', () => {
			const hasRule = config.some(
				(c: FlatConfig) =>
					c.rules &&
					(c.rules['react-hooks/exhaustive-deps'] ||
						(c.plugins && c.plugins['react-hooks'])),
			);
			expect(hasRule).toBe(true);
		});

		it('enables react-native rules', () => {
			const rnConfig = config.find(
				(c: FlatConfig) =>
					c.rules &&
					(c.rules['react-native/no-unused-styles'] ||
						c.rules['react-native/split-platform-components']),
			);
			expect(rnConfig).toBeDefined();
			expect(rnConfig.rules['react-native/no-unused-styles']).toBe('error');
		});

		it('enables react-19-upgrade rules', () => {
			const r19Config = config.find(
				(c: FlatConfig) =>
					c.rules && c.rules['react-19-upgrade/no-default-props'],
			);
			expect(r19Config).toBeDefined();
			expect(r19Config.rules['react-19-upgrade/no-default-props']).toBe(
				'error',
			);
		});
	});

	describe('import rules', () => {
		it('enables unused-imports/no-unused-imports', () => {
			const importConfig = config.find(
				(c: FlatConfig) =>
					c.rules && c.rules['unused-imports/no-unused-imports'],
			);
			expect(importConfig).toBeDefined();
			expect(importConfig.rules['unused-imports/no-unused-imports']).toBe(
				'error',
			);
		});

		it('enables import-x/order', () => {
			const importConfig = config.find(
				(c: FlatConfig) => c.rules && c.rules['import-x/order'],
			);
			expect(importConfig).toBeDefined();
			expect(importConfig.rules['import-x/order'][0]).toBe('error');
		});
	});

	describe('prettier rules', () => {
		it('enables prettier/prettier', () => {
			const prettierRule = config.find(
				(c: FlatConfig) => c.rules && c.rules['prettier/prettier'],
			);
			expect(prettierRule).toBeDefined();
			expect(prettierRule.rules['prettier/prettier']).toBe('error');
		});

		it('no-prettier preset does not enable prettier/prettier', () => {
			const prettierRule = noPrettierSubpath.find(
				(c: FlatConfig) => c.rules && c.rules['prettier/prettier'],
			);
			expect(prettierRule).toBeUndefined();
		});
	});

	describe('app rules', () => {
		it('warns on console', () => {
			const appConfig = config.find(
				(c: FlatConfig) => c.rules && c.rules['no-console'] === 'warn',
			);
			expect(appConfig).toBeDefined();
		});

		it('restricts SafeAreaView import', () => {
			const appConfig = config.find(
				(c: FlatConfig) => c.rules && c.rules['no-restricted-imports'],
			);
			expect(appConfig).toBeDefined();
			const rule = appConfig.rules['no-restricted-imports'];
			expect(rule[1].paths[0].name).toBe('react-native');
			expect(rule[1].paths[0].importNames).toContain('SafeAreaView');
		});

		it('prefers box shadow', () => {
			const appConfig = config.find(
				(c: FlatConfig) => c.rules && c.rules['expo/prefer-box-shadow'],
			);
			expect(appConfig).toBeDefined();
			expect(appConfig.rules['expo/prefer-box-shadow']).toBe('warn');
		});
	});

	describe('test environments', () => {
		it('enables jest rules for test files', () => {
			const testConfig = config.find(
				(c: FlatConfig) =>
					c.files &&
					c.files.includes('**/*.test.[jt]s') &&
					c.rules &&
					c.rules['jest/no-disabled-tests'],
			);
			expect(testConfig).toBeDefined();
			expect(testConfig.rules['jest/no-disabled-tests']).toBe('error');
		});

		it('enables testing-library rules for test files', () => {
			const testConfig = config.find(
				(c: FlatConfig) =>
					c.files &&
					c.files.includes('**/*.test.[jt]s') &&
					c.rules &&
					c.rules['testing-library/await-async-queries'],
			);
			expect(testConfig).toBeDefined();
			expect(testConfig.rules['testing-library/await-async-queries']).toBe(
				'error',
			);
		});
	});

	describe('workspace overrides', () => {
		it('has apps/ override with warn for no-console', () => {
			const appsConfig = config.find(
				(c: FlatConfig) => c.files && c.files.includes('apps/**'),
			);
			expect(appsConfig).toBeDefined();
			expect(appsConfig.rules['no-console']).toBe('warn');
		});

		it('has packages/ override with error for no-console', () => {
			const pkgConfig = config.find(
				(c: FlatConfig) => c.files && c.files.includes('packages/**'),
			);
			expect(pkgConfig).toBeDefined();
			expect(pkgConfig.rules['no-console']).toBe('error');
		});
	});

	describe('runtime smoke tests', () => {
		it('loads strict config on .js files without plugin errors', () => {
			const strictConfigPath = path.join(__dirname, 'strict.js');
			const result = spawnSync(
				'bunx',
				[
					'eslint',
					'--stdin',
					'--stdin-filename',
					'strict-smoke.js',
					'--no-config-lookup',
					'--config',
					strictConfigPath,
				],
				{
					cwd: path.resolve(__dirname, '../..'),
					encoding: 'utf8',
					input: "console.log('strict smoke');\n",
				},
			);

			expect(result.status).not.toBe(2);
			expect(result.stderr).not.toContain(
				'could not find plugin "@typescript-eslint"',
			);
		});

		it('runs strict preset end to end', () => {
			const results = runPresetLint(path.join(__dirname, 'strict.js'), [
				'test-project/preset-fixtures/strict-only.ts',
			]);
			const messages = getRuleMessages(results);

			expect(messages.some((message) => message.ruleId === 'no-console')).toBe(
				true,
			);
			expect(
				messages.some(
					(message) =>
						message.ruleId === '@typescript-eslint/no-non-null-assertion',
				),
			).toBe(true);
		}, 15_000);

		it('runs no-prettier preset end to end', () => {
			const results = runPresetLint(path.join(__dirname, 'no-prettier.js'), [
				'test-project/preset-fixtures/no-prettier.ts',
			]);
			const messages = getRuleMessages(results);

			expect(
				messages.some((message) => message.ruleId === 'import-x/order'),
			).toBe(true);
			expect(
				messages.some((message) => message.ruleId === 'prettier/prettier'),
			).toBe(false);
		}, 15_000);

		it('runs typed preset end to end', () => {
			const results = runPresetLint(path.join(__dirname, 'typed.js'), [
				'test-project/preset-fixtures/typed-only.ts',
			]);
			const messages = getRuleMessages(results);

			expect(
				messages.some(
					(message) =>
						message.ruleId === '@typescript-eslint/no-base-to-string',
				),
			).toBe(true);
		}, 15_000);

		it('supports ESM entrypoints', async () => {
			const indexEsm = await import(
				pathToFileURL(path.join(__dirname, 'index.mjs')).href
			);
			const noPrettierEsm = await import(
				pathToFileURL(path.join(__dirname, 'no-prettier.mjs')).href
			);
			const strictEsm = await import(
				pathToFileURL(path.join(__dirname, 'strict.mjs')).href
			);
			const typedEsm = await import(
				pathToFileURL(path.join(__dirname, 'typed.mjs')).href
			);

			expect(Array.isArray(indexEsm.default)).toBe(true);
			expect(Array.isArray(indexEsm.strict)).toBe(true);
			expect(Array.isArray(indexEsm.typed)).toBe(true);
			expect(Array.isArray(indexEsm.noPrettier)).toBe(true);
			expect(Array.isArray(noPrettierEsm.default)).toBe(true);
			expect(Array.isArray(noPrettierEsm.strict)).toBe(true);
			expect(Array.isArray(noPrettierEsm.typed)).toBe(true);
			expect(Array.isArray(strictEsm.default)).toBe(true);
			expect(Array.isArray(typedEsm.default)).toBe(true);
			expect(Array.isArray(typedEsm.noPrettier)).toBe(true);
		});
	});

	describe('strict preset', () => {
		it('extends base config', () => {
			expect(config.strict.length).toBeGreaterThan(config.length);
		});

		it('makes no-console an error', () => {
			const strictExtra = config.strict[config.strict.length - 1];
			expect(strictExtra.rules['no-console']).toBe('error');
		});

		it('makes no-non-null-assertion an error', () => {
			const strictTypeScriptConfig = config.strict.find(
				(c: FlatConfig) =>
					c.rules &&
					c.rules['@typescript-eslint/no-non-null-assertion'] === 'error',
			);
			expect(strictTypeScriptConfig).toBeDefined();
		});

		it('exposes typed presets on the main export', () => {
			expect(Array.isArray(config.typed)).toBe(true);
			expect(Array.isArray(config.typedNoPrettier)).toBe(true);
		});
	});

	describe('repo guardrails', () => {
		it('does not import eslint-config-expo flat internals', () => {
			const packageFiles = [
				path.join(__dirname, 'index.js'),
				path.join(__dirname, 'utils', 'react.js'),
			];

			for (const filePath of packageFiles) {
				const fileContents = fs.readFileSync(filePath, 'utf8');
				expect(fileContents.includes('eslint-config-expo/flat/utils/')).toBe(
					false,
				);
			}
		});
	});
});
