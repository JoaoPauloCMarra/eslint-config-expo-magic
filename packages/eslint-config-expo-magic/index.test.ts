import { describe, expect, it } from 'bun:test';
import type { Linter } from 'eslint';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { pathToFileURL } = require('node:url');
const expoFlatConfig = require('eslint-config-expo/flat');
const { createConfigReport } = require('../../scripts/lib/config-report.js');
const config = require('./index.js');
const baseSubpath = require('./base.js');
const strictSubpath = require('./strict.js');
const noPrettierSubpath = require('./no-prettier.js');
const typedSubpath = require('./typed.js');
const appGuardrailsSubpath = require('./app-guardrails.js');
const featureBoundariesSubpath = require('./feature-boundaries.js');
const nativeUiSubpath = require('./native-ui.js');
const prGuardrails = require('./pr-guardrails.js');
const reactCompilerSubpath = require('./react-compiler.js');
const storybookSubpath = require('./storybook.js');
const workletsSubpath = require('./worklets.js');

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

		return runDirectoryLint(rootDir, configPath, targets);
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

function runDirectoryLint(
	cwd: string,
	configPath: string,
	targets: string[],
) {
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
			cwd,
			encoding: 'utf8',
		},
	);

	if (![0, 1].includes(result.status ?? -1)) {
		throw new Error(result.stderr || result.stdout);
	}

	return JSON.parse(result.stdout || '[]') as Array<{
		messages: Array<{ ruleId: string | null; severity: number }>;
	}>;
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

		it('has a base preset', () => {
			expect(Array.isArray(config.base)).toBe(true);
			expect(config.base.length).toBeLessThan(config.length);
		});

		it('exports base subpath', () => {
			expect(Array.isArray(baseSubpath)).toBe(true);
			expect(baseSubpath).toBe(config.base);
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

		it('exports app hardening subpaths', () => {
			expect(Array.isArray(appGuardrailsSubpath)).toBe(true);
			expect(typeof featureBoundariesSubpath.createFeatureBoundaryConfig).toBe(
				'function',
			);
			expect(typeof nativeUiSubpath.createNativeUiConfig).toBe('function');
			expect(typeof prGuardrails.validateGuardrails).toBe('function');
			expect(Array.isArray(reactCompilerSubpath)).toBe(true);
			expect(Array.isArray(storybookSubpath)).toBe(true);
			expect(Array.isArray(workletsSubpath)).toBe(true);
		});

		it('exports createConfig factory', () => {
			expect(typeof config.createConfig).toBe('function');
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

		it('createConfig accepts custom tsconfig projects', () => {
			const customConfig = config.createConfig({
				tsconfigProjects: ['./apps/mobile/tsconfig.json'],
			});
			const settingsConfig = customConfig.find(
				(entry: FlatConfig) =>
					entry.settings &&
					entry.settings['import/resolver'] &&
					entry.settings['import-x/resolver'],
			);

			expect(settingsConfig).toBeDefined();
			expect(settingsConfig.settings['import/resolver'].typescript.project).toEqual(
				['./apps/mobile/tsconfig.json'],
			);
			expect(
				settingsConfig.settings['import-x/resolver'].typescript.project,
			).toEqual(['./apps/mobile/tsconfig.json']);
		});

		it('createConfig accepts extra ignore patterns', () => {
			const customConfig = config.createConfig({
				extraIgnores: ['**/.eas/**', 'expo-env.d.ts'],
			});
			const ignoreConfig = customConfig.find((entry: FlatConfig) => entry.ignores);

			expect(ignoreConfig.ignores).toContain('**/.eas/**');
			expect(ignoreConfig.ignores).toContain('expo-env.d.ts');
			expect(ignoreConfig.ignores).toContain('**/node_modules/**');
		});

		it('has browser and mobile globals', () => {
			const globalsConfig = config.find(
				(c: FlatConfig) =>
					c.languageOptions &&
					c.languageOptions.globals &&
					(c.languageOptions.globals as Record<string, unknown>).__DEV__ ===
						'readonly',
			);
			const globals = globalsConfig?.languageOptions?.globals as
				| Record<string, unknown>
				| undefined;

			expect(globalsConfig).toBeDefined();
			expect(globals?.fetch).toBe(false);
			expect(globals?.__DEV__).toBe('readonly');
		});

		it('has node globals for config files', () => {
			const nodeConfig = config.find(
				(c: FlatConfig) =>
					c.files &&
					c.files.includes('**/*.config.{js,cjs,mjs,ts,mts,cts}') &&
					c.languageOptions &&
					c.languageOptions.globals &&
					(c.languageOptions.globals as Record<string, unknown>).module !==
						undefined,
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

		it('keeps synchronous effect state updates opt-in', () => {
			const hooksConfig = config.find(
				(c: FlatConfig) =>
					c.rules && c.rules['react-hooks/set-state-in-effect'],
			);
			expect(hooksConfig).toBeDefined();
			expect(hooksConfig.rules['react-hooks/set-state-in-effect']).toBe('off');
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
		it('base preset keeps Expo plus low-noise package rules only', () => {
			const baseConsoleRule = baseSubpath.find(
				(c: FlatConfig) => c.rules && c.rules['no-console'],
			);
			const baseImportOrderRule = baseSubpath.find(
				(c: FlatConfig) => c.rules && c.rules['import-x/order'],
			);
			const basePrettierRule = baseSubpath.find(
				(c: FlatConfig) => c.rules && c.rules['prettier/prettier'],
			);

			expect(baseConsoleRule).toBeUndefined();
			expect(baseImportOrderRule).toBeUndefined();
			expect(basePrettierRule).toBeUndefined();
		});

		it('createConfig can disable testing and prettier layers', () => {
			const customConfig = config.createConfig({
				prettier: false,
				testing: false,
			});
			const prettierRule = customConfig.find(
				(entry: FlatConfig) => entry.rules && entry.rules['prettier/prettier'],
			);
			const jestRule = customConfig.find(
				(entry: FlatConfig) =>
					entry.rules && entry.rules['jest/no-disabled-tests'],
			);

			expect(prettierRule).toBeUndefined();
			expect(jestRule).toBeUndefined();
		});

		it('createConfig custom config runs end to end', () => {
			const tempDir = fs.mkdtempSync(
				path.join(rootDir, '.tmp-eslint-config-expo-magic-factory-'),
			);
			const configPath = path.join(tempDir, 'eslint.config.js');
			const targetPath = path.join(tempDir, 'factory-smoke.ts');
			const tsconfigPath = path.join(tempDir, 'tsconfig.json');

			try {
				fs.writeFileSync(
					configPath,
					[
						"const { createConfig } = require(",
						`\t${JSON.stringify(path.join(__dirname, 'index.js'))},`,
						');',
						'',
						'module.exports = [',
						'\t...createConfig({',
						"\t\ttsconfigProjects: ['./tsconfig.json'],",
						'\t\tprettier: false,',
						'\t\ttesting: false,',
						'\t}),',
						'];',
						'',
					].join('\n'),
				);

				fs.writeFileSync(
					tsconfigPath,
					`${JSON.stringify(
						{
							compilerOptions: {
								module: 'esnext',
								target: 'es2022',
								moduleResolution: 'bundler',
							},
							include: ['factory-smoke.ts'],
						},
						null,
						2,
					)}\n`,
				);

				fs.writeFileSync(
					targetPath,
					[
						"import zlib from 'node:zlib';",
						"import path from 'node:path';",
						'',
						'console.log(path.sep,zlib.constants.Z_BEST_SPEED)',
						'',
					].join('\n'),
				);

				const results = runPresetLint(configPath, [targetPath]);
				const messages = getRuleMessages(results);

				expect(messages.some((message) => message.ruleId === 'no-console')).toBe(
					true,
				);
				expect(
					messages.some((message) => message.ruleId === 'import-x/order'),
				).toBe(true);
				expect(
					messages.some((message) => message.ruleId === 'prettier/prettier'),
				).toBe(false);
				expect(
					messages.some(
						(message) => message.ruleId === 'jest/no-disabled-tests',
					),
				).toBe(false);
			} finally {
				fs.rmSync(tempDir, { recursive: true, force: true });
			}
		}, 15_000);

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

		it('adds native UI restrictions without replacing defaults', () => {
			const nativeUiConfig = config.createNativeUiConfig({
				additionalRestrictions: [
					{
						name: 'expo-router',
						importNames: ['Link'],
						message: 'Use app link wrapper.',
					},
				],
			});
			const restrictionEntry = nativeUiConfig.find(
				(entry: FlatConfig) => entry.rules?.['no-restricted-imports'],
			);
			const restrictedPaths =
				restrictionEntry.rules['no-restricted-imports'][1].paths;

			expect(restrictedPaths).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						name: 'react-native',
						importNames: expect.arrayContaining(['SafeAreaView']),
					}),
					expect.objectContaining({
						name: 'expo-router',
						importNames: expect.arrayContaining(['Link']),
					}),
				]),
			);
		});

		it('prefers box shadow', () => {
			const appConfig = config.find(
				(c: FlatConfig) => c.rules && c.rules['expo/prefer-box-shadow'],
			);
			expect(appConfig).toBeDefined();
			expect(appConfig.rules['expo/prefer-box-shadow']).toBe('warn');
		});

		it('composes optional production app hardening rules', () => {
			const tempDir = fs.mkdtempSync(
				path.join(rootDir, '.tmp-eslint-config-expo-magic-app-'),
			);
			const configPath = path.join(tempDir, 'eslint.config.js');
			const targetPath = path.join(tempDir, 'hardening-smoke.tsx');
			const storyPath = path.join(tempDir, 'hardening.stories.tsx');
			const tsconfigPath = path.join(tempDir, 'tsconfig.json');

			try {
				fs.writeFileSync(
					configPath,
					[
						"const { createConfig } = require(",
						`\t${JSON.stringify(path.join(__dirname, 'index.js'))},`,
						');',
						'',
						'module.exports = createConfig({',
						"\tprettier: false,",
						"\ttesting: false,",
						"\tappGuardrails: true,",
						"\tnativeUi: true,",
						"\treactCompiler: true,",
						"\tstorybook: true,",
						"\tworklets: true,",
						'});',
						'',
					].join('\n'),
				);

				fs.writeFileSync(
					tsconfigPath,
					`${JSON.stringify(
						{
							compilerOptions: {
								module: 'esnext',
								target: 'es2022',
								moduleResolution: 'bundler',
								jsx: 'react-jsx',
							},
							include: ['*.ts', '*.tsx'],
						},
						null,
						2,
					)}\n`,
				);

				fs.writeFileSync(
					targetPath,
					[
						"import { Button } from 'react-native';",
						'',
						'declare const value: unknown;',
						'declare function useGetPeople(): { data: string[] };',
						'declare function scheduleOnRN(callback: () => void): void;',
						'',
						'type QueryResult = ReturnType<typeof useGetPeople>;',
						'const unsafeValue = value as unknown as string;',
						'const queryResult = {} as QueryResult;',
						'',
						'export function HardeningSmoke() {',
						'\ttry {',
						'\t\tvalue?.toString();',
						'\t} finally {',
						'\t\tscheduleOnRN(() => {});',
						'\t}',
						'',
						'\treturn <Button title={`${unsafeValue}:${queryResult.data.length}`} />;',
						'}',
						'',
					].join('\n'),
				);

				fs.writeFileSync(
					storyPath,
					[
						'export const Story = () => {',
						"\tconsole.log('story diagnostics');",
						'\treturn null;',
						'};',
						'',
					].join('\n'),
				);

				const results = runPresetLint(configPath, [targetPath, storyPath]);
				const messages = getRuleMessages(results);

				expect(
					messages.some((message) => message.ruleId === 'no-restricted-imports'),
				).toBe(true);
				expect(
					messages.filter((message) => message.ruleId === 'no-restricted-syntax')
						.length,
				).toBeGreaterThanOrEqual(4);
				expect(
					messages.some((message) => message.ruleId === 'no-console'),
				).toBe(false);
			} finally {
				fs.rmSync(tempDir, { recursive: true, force: true });
			}
		}, 15_000);

		it('creates feature boundary config with shared component patterns', () => {
			const boundaryConfig = config.createFeatureBoundaryConfig({
				sharedComponentPatterns: [
					'features/*/components/focus-selection-form.tsx',
				],
			});
			const boundaryEntry = boundaryConfig.find(
				(entry: FlatConfig) => entry.rules?.['boundaries/dependencies'],
			);

			expect(boundaryEntry).toBeDefined();
			expect(boundaryEntry.plugins.boundaries).toBeDefined();
			expect(boundaryEntry.settings['boundaries/elements']).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						type: 'feature-shared-component',
						pattern: 'features/*/components/focus-selection-form.tsx',
					}),
				]),
			);
		});

		it('adds feature boundary patterns without replacing defaults', () => {
			const boundaryConfig = config.createFeatureBoundaryConfig({
				additionalSharedComponentPatterns: [
					'features/*/components/request-user-phone-flow.tsx',
				],
			});
			const boundaryEntry = boundaryConfig.find(
				(entry: FlatConfig) => entry.rules?.['boundaries/dependencies'],
			);

			expect(boundaryEntry.settings['boundaries/elements']).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						type: 'feature-api',
						pattern: 'features/*/api/**/*',
					}),
					expect.objectContaining({
						type: 'feature-shared-component',
						pattern: 'features/*/components/request-user-phone-flow.tsx',
					}),
				]),
			);
		});

		it('runs feature boundary rules end to end', () => {
			const tempDir = fs.mkdtempSync(
				path.join(rootDir, '.tmp-eslint-config-expo-magic-boundaries-'),
			);
			const configPath = path.join(tempDir, 'eslint.config.js');
			const uikitDir = path.join(tempDir, 'uikit');
			const featureApiDir = path.join(tempDir, 'features', 'people', 'api');

			try {
				fs.mkdirSync(uikitDir, { recursive: true });
				fs.mkdirSync(featureApiDir, { recursive: true });
				fs.writeFileSync(
					configPath,
					[
						"const { createConfig } = require(",
						`\t${JSON.stringify(path.join(__dirname, 'index.js'))},`,
						');',
						'',
						'module.exports = createConfig({',
						"\tprettier: false,",
						"\ttesting: false,",
						"\tfeatureBoundaries: true,",
						'});',
						'',
					].join('\n'),
				);
				fs.writeFileSync(
					path.join(tempDir, 'tsconfig.json'),
					`${JSON.stringify(
						{
							compilerOptions: {
								module: 'esnext',
								target: 'es2022',
								moduleResolution: 'bundler',
								strict: true,
							},
							include: ['**/*.ts'],
						},
						null,
						2,
					)}\n`,
				);
				fs.writeFileSync(
					path.join(featureApiDir, 'client.ts'),
					"export const peopleClient = 'people';\n",
				);
				fs.writeFileSync(
					path.join(uikitDir, 'button.ts'),
					[
						"import { peopleClient } from '../features/people/api/client';",
						'',
						'export const buttonLabel = peopleClient;',
						'',
					].join('\n'),
				);

				const messages = getRuleMessages(
					runDirectoryLint(tempDir, configPath, ['uikit/button.ts']),
				);

				expect(
					messages.some(
						(message) => message.ruleId === 'boundaries/dependencies',
					),
				).toBe(true);
			} finally {
				fs.rmSync(tempDir, { recursive: true, force: true });
			}
		}, 15_000);
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
		it('runs base preset end to end', () => {
			const results = runPresetLint(path.join(__dirname, 'base.js'), [
				'test-project/App.tsx',
			]);
			const messages = getRuleMessages(results);

			expect(
				messages.some(
					(message) => message.ruleId === 'expo/no-dynamic-env-var',
				),
			).toBe(true);
			expect(
				messages.some(
					(message) => message.ruleId === 'expo/no-env-var-destructuring',
				),
			).toBe(true);
			expect(
				messages.some((message) => message.ruleId === 'prettier/prettier'),
			).toBe(false);
			expect(messages.some((message) => message.ruleId === 'no-console')).toBe(
				false,
			);
		}, 15_000);

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
			const baseEsm = await import(
				pathToFileURL(path.join(__dirname, 'base.mjs')).href
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
			const appGuardrailsEsm = await import(
				pathToFileURL(path.join(__dirname, 'app-guardrails.mjs')).href
			);
			const featureBoundariesEsm = await import(
				pathToFileURL(path.join(__dirname, 'feature-boundaries.mjs')).href
			);
			const nativeUiEsm = await import(
				pathToFileURL(path.join(__dirname, 'native-ui.mjs')).href
			);
			const prGuardrailsEsm = await import(
				pathToFileURL(path.join(__dirname, 'pr-guardrails.mjs')).href
			);
			const reactCompilerEsm = await import(
				pathToFileURL(path.join(__dirname, 'react-compiler.mjs')).href
			);
			const storybookEsm = await import(
				pathToFileURL(path.join(__dirname, 'storybook.mjs')).href
			);
			const workletsEsm = await import(
				pathToFileURL(path.join(__dirname, 'worklets.mjs')).href
			);

			expect(Array.isArray(indexEsm.default)).toBe(true);
			expect(Array.isArray(indexEsm.base)).toBe(true);
			expect(Array.isArray(indexEsm.strict)).toBe(true);
			expect(Array.isArray(indexEsm.typed)).toBe(true);
			expect(Array.isArray(indexEsm.noPrettier)).toBe(true);
			expect(Array.isArray(baseEsm.default)).toBe(true);
			expect(Array.isArray(noPrettierEsm.default)).toBe(true);
			expect(Array.isArray(noPrettierEsm.strict)).toBe(true);
			expect(Array.isArray(noPrettierEsm.typed)).toBe(true);
			expect(Array.isArray(strictEsm.default)).toBe(true);
			expect(Array.isArray(typedEsm.default)).toBe(true);
			expect(Array.isArray(typedEsm.noPrettier)).toBe(true);
			expect(Array.isArray(appGuardrailsEsm.default)).toBe(true);
			expect(typeof featureBoundariesEsm.createFeatureBoundaryConfig).toBe(
				'function',
			);
			expect(typeof nativeUiEsm.createNativeUiConfig).toBe('function');
			expect(typeof prGuardrailsEsm.validateGuardrails).toBe('function');
			expect(Array.isArray(reactCompilerEsm.default)).toBe(true);
			expect(Array.isArray(storybookEsm.default)).toBe(true);
			expect(Array.isArray(workletsEsm.default)).toBe(true);
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

	describe('pr guardrails helper', () => {
		function guardrailBody(extraLines: string[] = []) {
			return [
				'- [x] `bun run lint:ci`',
				'- [x] `bun run typecheck`',
				'- [x] `bun run test:unit`',
				'- [x] `bun run validate:pr-guardrails`',
				'- [x] Watched GitHub CI after the latest push until `Validate Code` passed or a blocker was documented',
				'- [x] No skipped tests, loosened types, broad ignores, fake mocks, or unrelated rewrites to make CI pass',
				'- [x] No unrelated `package.json` or `bun.lock` changes',
				...extraLines,
			].join('\n');
		}

		it('validates reusable PR guardrails', () => {
			const result = prGuardrails.validateGuardrails({
				eventName: 'pull_request',
				prBody: guardrailBody(),
				labels: [],
				changedFiles: ['package.json'],
				changedPatch: '+const value: any = input;\n',
			});

			expect(result.passed).toBe(false);
			expect(result.failures).toEqual(
				expect.arrayContaining([
					expect.stringContaining('Protected files changed'),
					expect.stringContaining('explicit any'),
				]),
			);
		});

		it('accepts mobile flow files with runtime evidence and coverage', () => {
			const result = prGuardrails.validateGuardrails(
				{
					eventName: 'pull_request',
					prBody: guardrailBody([
						'- [x] Confirmed this machine can build and run the app in iOS Simulator or Android Emulator',
						'- [x] Simulator/emulator target used for validation is named in the PR body',
						'Validated on iPhone 16 Simulator.',
					]),
					labels: [],
					changedFiles: [
						'features/home/screens/home-screen.tsx',
						'features/home/screens/home-screen.test.tsx',
					],
					changedPatch: '+const value = 1;\n',
				},
				{ preset: 'mobileApp' },
			);

			expect(result.passed).toBe(true);
		});

		it('keeps default PR guardrails generic', () => {
			const options = prGuardrails.createPrGuardrailOptions();

			expect(options.requiredCheckboxes).toEqual([]);
			expect(
				options.protectedFilePatterns.some((pattern: RegExp) =>
					pattern.test('features/auth/login.ts'),
				),
			).toBe(false);
		});

		it('supports additive PR guardrail options', () => {
			const options = prGuardrails.createPrGuardrailOptions({
				additionalRequiredCheckboxes: ['Custom check'],
				additionalProtectedFilePatterns: [/^custom\//],
				additionalRiskyPatterns: [
					{ name: 'debugger', pattern: /^\+.*\bdebugger\b/m },
				],
			});

			expect(options.requiredCheckboxes).toContain('Custom check');
			expect(
				options.protectedFilePatterns.some((pattern: RegExp) =>
					pattern.test('custom/file.ts'),
				),
			).toBe(true);
			expect(
				options.riskyPatterns.map((pattern: { name: string }) => pattern.name),
			).toContain('debugger');
		});

		it('ignores configured files for risky patch checks', () => {
			const result = prGuardrails.validateGuardrails(
				{
					eventName: 'pull_request',
					prBody: guardrailBody(),
					labels: ['owner-approved'],
					changedFiles: ['scripts/validate-pr-guardrails.ts'],
					changedPatch: [
						'diff --git a/scripts/validate-pr-guardrails.ts b/scripts/validate-pr-guardrails.ts',
						'+++ b/scripts/validate-pr-guardrails.ts',
						'+const value: any = input;',
					].join('\n'),
				},
				{
					preset: 'mobileApp',
					ignoredRiskyFilePatterns: [/scripts\/validate-pr-guardrails\.ts/],
				},
			);

			expect(result.failures).not.toEqual(
				expect.arrayContaining([expect.stringContaining('explicit any')]),
			);
		});

		it('reads PR guardrail options from a config file', () => {
			const tempDir = fs.mkdtempSync(
				path.join(rootDir, '.tmp-eslint-config-expo-magic-guardrails-'),
			);

			try {
				fs.writeFileSync(
					path.join(tempDir, 'expo-magic.pr-guardrails.cjs'),
					"module.exports = { preset: 'mobileApp', additionalRequiredCheckboxes: ['Custom CI'] };\n",
				);

				const options = prGuardrails.readCliOptionsFromEnv(tempDir);
				const resolvedOptions = prGuardrails.createPrGuardrailOptions(options);

				expect(resolvedOptions.requiredCheckboxes).toContain(
					'`bun run lint:ci`',
				);
				expect(resolvedOptions.requiredCheckboxes).toContain('Custom CI');
			} finally {
				fs.rmSync(tempDir, { recursive: true, force: true });
			}
		});
	});

	describe('repo guardrails', () => {
		it('keeps checked-in config diff artifact current', () => {
			const currentReport = createConfigReport();
			const checkedInReport = JSON.parse(
				fs.readFileSync(
					path.join(rootDir, 'docs', 'config-diff.json'),
					'utf8',
				),
			);

			expect(checkedInReport).toEqual(currentReport);
		});

		it('keeps Expo plugin rules enabled from eslint-config-expo', () => {
			const expoRuleNames = new Set(
				expoFlatConfig.flatMap((entry: FlatConfig) =>
					Object.keys(entry.rules ?? {}).filter((ruleName) =>
						ruleName.startsWith('expo/'),
					),
				),
			);

			const packageRuleNames = new Set(
				config.flatMap((entry: FlatConfig) =>
					Object.keys(entry.rules ?? {}).filter((ruleName) =>
						ruleName.startsWith('expo/'),
					),
				),
			);

			expect(expoRuleNames.size).toBeGreaterThan(0);
			for (const ruleName of expoRuleNames) {
				expect(packageRuleNames.has(ruleName)).toBe(true);
			}
		});

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
