import { describe, expect, it } from 'bun:test';
import type { Linter } from 'eslint';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { pathToFileURL } = require('node:url');
const { ESLint, RuleTester } = require('eslint');
const tsParser = require('@typescript-eslint/parser');
const expoFlatConfig = require('eslint-config-expo/flat');
const config = require('./index.js');
const agentSubpath = require('./agent.js');
const agentGuardrailsSubpath = require('./agent-guardrails.js');
const baseSubpath = require('./base.js');
const fastSubpath = require('./fast.js');
const strictSubpath = require('./strict.js');
const typedSubpath = require('./typed.js');
const appGuardrailsSubpath = require('./app-guardrails.js');
const componentStructureSubpath = require('./component-structure.js');
const deprecatedApisSubpath = require('./deprecated-apis.js');
const featureBoundariesSubpath = require('./feature-boundaries.js');
const nativeUiSubpath = require('./native-ui.js');
const prGuardrails = require('./pr-guardrails.js');
const reactCompilerSubpath = require('./react-compiler.js');
const reanimatedSubpath = require('./reanimated.js');
const semanticColorsSubpath = require('./semantic-colors.js');
const storybookSubpath = require('./storybook.js');
const workletsSubpath = require('./worklets.js');
const expoMagicPlugin = require('./utils/plugin/index.js');
const { collectLintRuleResults } = require('../../test-project/validation-results.js');
const {
	findLegacyImportRules,
	isValidationPassing,
} = require('../../test-project/validate-comprehensive.js');

type FlatConfig = Linter.Config;
type ModuleLoadProbeResult = {
	configLength: number;
	loaded: string[];
};
const rootDir = path.resolve(__dirname, '../..');

async function runPresetLint(presetModulePath: string, targets: string[]) {
	return runDirectoryLint(rootDir, require(presetModulePath), targets);
}

function loadConfigAtCwd(cwd: string, configPath: string): FlatConfig[] {
	const absoluteCwd = path.resolve(cwd);
	const previousCwd = process.cwd();

	if (previousCwd === absoluteCwd) {
		return require(configPath) as FlatConfig[];
	}

	process.chdir(absoluteCwd);
	try {
		return require(configPath) as FlatConfig[];
	} finally {
		process.chdir(previousCwd);
	}
}

function withExplicitLintRoot(config: FlatConfig[], cwd: string): FlatConfig[] {
	return [
		...config,
		{
			settings: {
				'boundaries/root-path': cwd,
			},
		},
	];
}

function getRuleMessages(
	results: Array<{
		messages: Array<{ ruleId: string | null; severity: number }>;
	}>,
) {
	return results.flatMap((result) => result.messages ?? []);
}

async function runDirectoryLint(
	cwd: string,
	configOrPath: string | FlatConfig[],
	targets: string[],
) {
	const absoluteCwd = path.resolve(cwd);
	const loadedConfig =
		typeof configOrPath === 'string'
			? loadConfigAtCwd(absoluteCwd, configOrPath)
			: configOrPath;
	const eslint = new ESLint({
		cwd: absoluteCwd,
		overrideConfig: withExplicitLintRoot(loadedConfig, absoluteCwd),
		overrideConfigFile: true,
	});

	return eslint.lintFiles(
		targets.map((target) => path.resolve(absoluteCwd, target)),
	);
}

function writeJsonFile(filePath: string, value: unknown) {
	fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

async function runFixtureLint({
	configSource,
	files,
	targets = Object.keys(files),
}: {
	configSource: string;
	files: Record<string, string>;
	targets?: string[];
}) {
	const tempDir = fs.mkdtempSync(
		path.join(rootDir, '.tmp-eslint-config-expo-magic-fixture-'),
	);
	const configPath = path.join(tempDir, 'eslint.config.js');

	try {
		fs.writeFileSync(configPath, configSource);
		writeJsonFile(path.join(tempDir, 'tsconfig.json'), {
			compilerOptions: {
				module: 'esnext',
				target: 'es2022',
				moduleResolution: 'bundler',
				jsx: 'react-jsx',
				strict: true,
			},
			include: ['**/*.ts', '**/*.tsx'],
		});

		for (const [fileName, source] of Object.entries(files)) {
			const filePath = path.join(tempDir, fileName);
			fs.mkdirSync(path.dirname(filePath), { recursive: true });
			fs.writeFileSync(filePath, source);
		}

		const eslint = new ESLint({
			cwd: tempDir,
			overrideConfig: withExplicitLintRoot(
				loadConfigAtCwd(tempDir, configPath),
				tempDir,
			),
			overrideConfigFile: true,
		});
		const results = [];

		for (const target of targets) {
			results.push(
				...(await eslint.lintText(files[target], {
					filePath: path.resolve(tempDir, target),
				})),
			);
		}

		return getRuleMessages(results);
	} finally {
		fs.rmSync(tempDir, { recursive: true, force: true });
	}
}

function createPackageConfigSource(optionsSource: string) {
	return [
		'const { createConfig } = require(',
		`\t${JSON.stringify(path.join(__dirname, 'index.js'))},`,
		');',
		'',
		`module.exports = createConfig(${optionsSource});`,
		'',
	].join('\n');
}

function getRuleMap(configs: FlatConfig[]) {
	return Object.assign(
		{},
		...configs.map((entry) => entry.rules ?? {}),
	) as Record<string, unknown>;
}

function runModuleLoadProbe(source: string) {
	const result = spawnSync('node', ['-e', source], {
		cwd: rootDir,
		encoding: 'utf8',
	});

	if (result.status !== 0) {
		throw new Error(result.stderr || result.stdout);
	}

	return JSON.parse(result.stdout) as ModuleLoadProbeResult;
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

		it('has an agent preset', () => {
			expect(Array.isArray(config.agent)).toBe(true);
			expect(config.agent.length).toBeGreaterThan(config.length);
		});

		it('has a fast preset', () => {
			expect(Array.isArray(config.fast)).toBe(true);
			expect(config.fast).toBe(fastSubpath);
		});

		it('exports agent subpath', () => {
			expect(Array.isArray(agentSubpath)).toBe(true);
			expect(agentSubpath).toBe(config.agent);
		});

		it('exports agent guardrails subpath', () => {
			expect(Array.isArray(agentGuardrailsSubpath)).toBe(true);
			expect(typeof agentGuardrailsSubpath.createAgentGuardrailsConfig).toBe(
				'function',
			);
		});

		it('exports base subpath', () => {
			expect(Array.isArray(baseSubpath)).toBe(true);
			expect(baseSubpath).toBe(config.base);
		});

		it('exports strict subpath', () => {
			expect(Array.isArray(strictSubpath)).toBe(true);
			expect(strictSubpath).toBe(config.strict);
		});

		it('exports typed subpath', () => {
			expect(Array.isArray(typedSubpath)).toBe(true);
			expect(typedSubpath).toBe(config.typed);
		});

		it('exports app hardening subpaths', () => {
			expect(Array.isArray(appGuardrailsSubpath)).toBe(true);
			expect(typeof featureBoundariesSubpath.createFeatureBoundaryConfig).toBe(
				'function',
			);
			expect(typeof nativeUiSubpath.createNativeUiConfig).toBe('function');
			expect(typeof prGuardrails.validateGuardrails).toBe('function');
			expect(Array.isArray(agentGuardrailsSubpath)).toBe(true);
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

	describe('v4 default and fast contracts', () => {
		it('keeps formatting and testing integrations opt-in', () => {
			const defaultRules = getRuleMap(config);
			const factoryRules = getRuleMap(config.createConfig());
			const explicitRules = getRuleMap(
				config.createConfig({ prettier: true, testing: true }),
			);

			expect(defaultRules['prettier/prettier']).toBeUndefined();
			expect(defaultRules['jest/no-disabled-tests']).toBeUndefined();
			expect(
				defaultRules['testing-library/await-async-queries'],
			).toBeUndefined();
			expect(factoryRules['prettier/prettier']).toBeUndefined();
			expect(factoryRules['jest/no-disabled-tests']).toBeUndefined();
			expect(
				factoryRules['testing-library/await-async-queries'],
			).toBeUndefined();
			expect(explicitRules['prettier/prettier']).toBe('error');
			expect(explicitRules['jest/no-disabled-tests']).toBe('error');
			expect(explicitRules['testing-library/await-async-queries']).toBe(
				'error',
			);
		});

		it('keeps only the core React hooks rules in the fast profile', () => {
			const fastRules = getRuleMap(config.createConfig({ preset: 'fast' }));
			const defaultRules = getRuleMap(config.createConfig());

			expect(fastRules['react-hooks/rules-of-hooks']).toBe('error');
			expect(fastRules['react-hooks/exhaustive-deps']).toBe('error');
			expect(fastRules['react-hooks/static-components']).toBeUndefined();
			expect(fastRules['react-hooks/immutability']).toBeUndefined();
			expect(defaultRules['react-hooks/static-components']).toBeDefined();
		});

		it('does not expose the removed no-prettier API', () => {
			expect(config.noPrettier).toBeUndefined();
			expect(config.strictNoPrettier).toBeUndefined();
			expect(config.typedNoPrettier).toBeUndefined();
		});

		it('does not load disabled optional layers for default or fast configs', () => {
			const indexPath = JSON.stringify(path.join(__dirname, 'index.js'));
			const fastPath = JSON.stringify(path.join(__dirname, 'fast.js'));
			const probe = (entryPath: string) =>
				runModuleLoadProbe(
					[
						"const Module = require('node:module');",
						'const originalLoad = Module._load;',
						'const loaded = [];',
						'Module._load = function(request) { loaded.push(request); return originalLoad.apply(this, arguments); };',
						`const config = require(${entryPath});`,
						"if (!Array.isArray(config) || config.length === 0) { throw new Error('config did not load as a non-empty array'); }",
						'process.stdout.write(JSON.stringify({ configLength: config.length, loaded }));',
					].join('\n'),
				);
			const disabledRequests = [
				'./utils/prettier.js',
				'eslint-plugin-prettier',
				'eslint-config-prettier/flat',
				'./utils/jest.js',
				'eslint-plugin-jest',
				'eslint-plugin-testing-library',
				'./utils/feature-boundaries.js',
				'eslint-plugin-boundaries',
			];

			for (const result of [probe(indexPath), probe(fastPath)]) {
				expect(result.configLength).toBeGreaterThan(0);
				for (const request of result.loaded) {
					expect(disabledRequests).not.toContain(request);
				}
			}
		});

		it('loads typescript-eslint only for typed configs', () => {
			const probe = (fileName: string) =>
				runModuleLoadProbe(
					[
						"const Module = require('node:module');",
						'const originalLoad = Module._load;',
						'const loaded = [];',
						'Module._load = function(request) { loaded.push(request); return originalLoad.apply(this, arguments); };',
						`const config = require(${JSON.stringify(path.join(__dirname, fileName))});`,
						"if (!Array.isArray(config) || config.length === 0) { throw new Error('config did not load as a non-empty array'); }",
						'process.stdout.write(JSON.stringify({ configLength: config.length, loaded }));',
					].join('\n'),
				);

			const defaultResult = probe('index.js');
			const fastResult = probe('fast.js');
			const typedResult = probe('typed.js');

			expect(defaultResult.configLength).toBeGreaterThan(0);
			expect(fastResult.configLength).toBeGreaterThan(0);
			expect(typedResult.configLength).toBeGreaterThan(0);
			expect(defaultResult.loaded).not.toContain('typescript-eslint');
			expect(fastResult.loaded).not.toContain('typescript-eslint');
			expect(typedResult.loaded).toContain('typescript-eslint');
		});

		it('builds retained CJS presets directly from createConfig', () => {
			for (const fileName of ['agent.js', 'strict.js', 'typed.js']) {
				const loaded = runModuleLoadProbe(
					[
						"const Module = require('node:module');",
						'const originalLoad = Module._load;',
						'const loaded = [];',
						'Module._load = function(request) { loaded.push(request); return originalLoad.apply(this, arguments); };',
						`const config = require(${JSON.stringify(path.join(__dirname, fileName))});`,
						"if (!Array.isArray(config) || config.length === 0) { throw new Error('config did not load as a non-empty array'); }",
						'process.stdout.write(JSON.stringify({ configLength: config.length, loaded }));',
					].join('\n'),
				);

				expect(loaded.configLength).toBeGreaterThan(0);
				expect(loaded.loaded).not.toContain('./index.js');
			}
		});
	});

	describe('comprehensive validation contracts', () => {
		it('fails when a legacy import diagnostic is reported', () => {
			const passingState = {
				missingRules: [],
				missingRuleFileCoverage: [],
				legacyImportRules: [],
				uncoveredEffectiveRules: [],
				staleConfigOnlyRules: [],
				basePresetPassed: true,
				defaultPresetPassed: true,
				strictPresetPassed: true,
				typedPresetPassed: true,
				focusedPresetPassed: true,
			};
			const { ruleCounts } = collectLintRuleResults(
				[
					{
						filePath: path.join(rootDir, 'test-project', 'App.tsx'),
						messages: [{ ruleId: 'import/order', severity: 2 }],
					},
				],
				rootDir,
			);
			const legacyImportRules = findLegacyImportRules(ruleCounts);

			expect(isValidationPassing(passingState)).toBe(true);
			expect(legacyImportRules).toEqual(['import/order']);
			expect(
				isValidationPassing({ ...passingState, legacyImportRules }),
			).toBe(false);
		});
	});

	describe('plugin registration', () => {
		const expectedPlugins = [
			'react',
			'react-hooks',
			'react-native',
			'react-19-upgrade',
			'unused-imports',
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
					c.settings['import-x/resolver'],
			);
			expect(settingsConfig).toBeDefined();

			const importXResolverProjects =
				settingsConfig.settings['import-x/resolver'].typescript.project;

			expect(Array.isArray(importXResolverProjects)).toBe(true);
			expect(importXResolverProjects).toContain('./test-project/tsconfig.json');
			expect(settingsConfig.settings['import-x/resolver'].typescript.bun).toBe(
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
					entry.settings && entry.settings['import-x/resolver'],
			);

			expect(settingsConfig).toBeDefined();
			expect(
				settingsConfig.settings['import-x/resolver'].typescript.project,
			).toEqual(['./apps/mobile/tsconfig.json']);
		});

		it('keeps the fast preset syntax-only', () => {
			const fastConfig = config.createConfig({
				agent: true,
				preset: 'fast',
			});
			const typescriptConfig = fastConfig.find(
				(entry: FlatConfig) =>
					entry.files?.includes('**/*.ts') && entry.languageOptions,
			);
			const rules = typescriptConfig?.rules ?? {};

			expect(
				typescriptConfig?.languageOptions?.parserOptions?.projectService,
			).toBe(undefined);
			expect(rules['@typescript-eslint/no-floating-promises']).toBeUndefined();
			expect(rules['@typescript-eslint/no-misused-promises']).toBeUndefined();
			expect(
				fastConfig.some(
					(entry: FlatConfig) => entry.rules?.['import-x/no-cycle'] === 'off',
				),
			).toBe(true);
		});

		it('uses the root tsconfig by default for the fast preset', () => {
			const fastConfig = config.createConfig({ preset: 'fast' });
			const settingsConfig = fastConfig.find(
				(entry: FlatConfig) => entry.settings?.['import-x/resolver'],
			);

			expect(settingsConfig).toBeDefined();
			expect(
				settingsConfig.settings['import-x/resolver'].typescript.project,
			).toEqual(['./tsconfig.json']);
		});

		it('uses explicit tsconfig projects for typed linting', () => {
			const customConfig = config.createConfig({
				tsconfigProjects: ['./apps/mobile/tsconfig.json'],
				typeChecked: true,
			});
			const typedEntry = customConfig.find(
				(entry: FlatConfig) =>
					Array.isArray(entry.files) &&
					entry.files.includes('**/*.ts') &&
					entry.languageOptions?.parserOptions?.project,
			);

			expect(typedEntry?.languageOptions?.parserOptions?.project).toEqual([
				'./apps/mobile/tsconfig.json',
			]);
			expect(
				typedEntry?.languageOptions?.parserOptions?.projectService,
			).toBeUndefined();
		});

		it('createConfig accepts extra ignore patterns', () => {
			const customConfig = config.createConfig({
				extraIgnores: ['**/.eas/**', 'expo-env.d.ts'],
			});
			const ignoreConfig = customConfig.find(
				(entry: FlatConfig) => entry.ignores,
			);

			expect(ignoreConfig.ignores).toContain('**/.eas/**');
			expect(ignoreConfig.ignores).toContain('expo-env.d.ts');
			expect(ignoreConfig.ignores).toContain('**/node_modules/**');
		});

		it('rejects unknown presets at the JavaScript boundary', () => {
			expect(() => config.createConfig({ preset: 'legacy' as never })).toThrow(
				'Unknown createConfig preset',
			);
		});

		it('rejects invalid inline style severities at the JavaScript boundary', () => {
			expect(() => config.createConfig({ inlineStyles: 3 as never })).toThrow(
				'inlineStyles must be false, true, or an ESLint rule severity',
			);
		});

		it('rejects malformed project and ignore options at the JavaScript boundary', () => {
			expect(() =>
				config.createConfig({
					tsconfigProjects: ['./tsconfig.json', 42] as never,
				}),
			).toThrow('tsconfigProjects must be an array of strings');
			expect(() =>
				config.createConfig({ extraIgnores: 'coverage/**' as never }),
			).toThrow('extraIgnores must be an array of strings');
		});

		it('rejects malformed boolean and layer options at the JavaScript boundary', () => {
			expect(() => config.createConfig({ testing: 'yes' as never })).toThrow(
				'testing must be a boolean',
			);
			expect(() => config.createConfig({ reanimated: [] as never })).toThrow(
				'reanimated must be false, true, or an options object',
			);
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
				Record<string, unknown> | undefined;

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

		it('keeps JSX helper rules preventing false unused component reports', async () => {
			const messages = await runFixtureLint({
				configSource: createPackageConfigSource(`{
					prettier: false,
					testing: false
				}`),
				files: {
					'jsx-usage.tsx': [
						"import React from 'react';",
						'',
						'const LocalComponent = () => null;',
						'',
						'export const Screen = () => <LocalComponent />;',
						'',
					].join('\n'),
				},
			});

			expect(
				messages.some(
					(message) =>
						message.ruleId === 'no-unused-vars' ||
						message.ruleId === '@typescript-eslint/no-unused-vars',
				),
			).toBe(false);
		}, 15_000);
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
		it('keeps prettier/prettier disabled by default', () => {
			const prettierRule = config.find(
				(c: FlatConfig) => c.rules && c.rules['prettier/prettier'],
			);
			expect(prettierRule).toBeUndefined();
		});

		it('enables prettier/prettier when explicitly requested', () => {
			const prettierRule = config
				.createConfig({ prettier: true })
				.find((c: FlatConfig) => c.rules && c.rules['prettier/prettier']);
			expect(prettierRule?.rules?.['prettier/prettier']).toBe('error');
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

		it('createConfig custom config runs end to end', async () => {
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
						'const { createConfig } = require(',
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

				const results = await runPresetLint(configPath, [targetPath]);
				const messages = getRuleMessages(results);

				expect(
					messages.some((message) => message.ruleId === 'no-console'),
				).toBe(true);
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

		it('can replace native UI restrictions for apps with different wrappers', () => {
			const nativeUiConfig = config.createNativeUiConfig({
				restrictions: [
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

			expect(restrictedPaths).toEqual([
				expect.objectContaining({
					name: 'expo-router',
					importNames: ['Link'],
				}),
			]);
		});

		it('applies native UI allow files after default and additional restrictions', async () => {
			const messages = await runFixtureLint({
				configSource: createPackageConfigSource(`{
					prettier: false,
					testing: false,
					nativeUi: {
						allowFiles: ['allowed.tsx'],
						additionalRestrictions: [
							{
								name: 'expo-router',
								importNames: ['Link'],
								message: 'Use app link wrapper.'
							}
						]
					}
				}`),
				files: {
					'blocked.tsx': [
						"import { Button } from 'react-native';",
						"import { Link } from 'expo-router';",
						'',
						'export const blocked = [Button, Link];',
						'',
					].join('\n'),
					'allowed.tsx': [
						"import { Button } from 'react-native';",
						"import { Link } from 'expo-router';",
						'',
						'export const allowed = [Button, Link];',
						'',
					].join('\n'),
				},
			});

			expect(
				messages.filter(
					(message) => message.ruleId === 'no-restricted-imports',
				),
			).toHaveLength(2);
		}, 15_000);

		it('prefers box shadow', () => {
			const appConfig = config.find(
				(c: FlatConfig) => c.rules && c.rules['expo/prefer-box-shadow'],
			);
			expect(appConfig).toBeDefined();
			expect(appConfig.rules['expo/prefer-box-shadow']).toBe('warn');
		});

		it('composes optional production app hardening rules', async () => {
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
						'const { createConfig } = require(',
						`\t${JSON.stringify(path.join(__dirname, 'index.js'))},`,
						');',
						'',
						'module.exports = createConfig({',
						'\tprettier: false,',
						'\ttesting: false,',
						'\tappGuardrails: true,',
						'\tnativeUi: true,',
						'\treactCompiler: true,',
						'\tstorybook: true,',
						'\tworklets: true,',
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

				const results = await runPresetLint(configPath, [targetPath, storyPath]);
				const messages = getRuleMessages(results);

				expect(
					messages.some(
						(message) => message.ruleId === 'no-restricted-imports',
					),
				).toBe(true);
				expect(
					messages.filter(
						(message) => message.ruleId === 'no-restricted-syntax',
					).length,
				).toBeGreaterThanOrEqual(3);
				expect(
					messages.some((message) => message.ruleId === 'no-console'),
				).toBe(false);
			} finally {
				fs.rmSync(tempDir, { recursive: true, force: true });
			}
		}, 15_000);

		it('creates feature boundary config with shared component patterns', () => {
			const boundaryConfig = featureBoundariesSubpath.createFeatureBoundaryConfig({
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
			const boundaryConfig = featureBoundariesSubpath.createFeatureBoundaryConfig({
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

		it('can replace same-feature dependency selectors and then append custom ones', () => {
			const boundaryConfig = featureBoundariesSubpath.createFeatureBoundaryConfig({
				featureElementTypes: ['feature-screen'],
				additionalFeatureElementTypes: ['feature-model'],
			});
			const boundaryEntry = boundaryConfig.find(
				(entry: FlatConfig) => entry.rules?.['boundaries/dependencies'],
			);
				const dependencyPolicies =
					boundaryEntry.rules['boundaries/dependencies'][1].policies;
				const featureAtomRule = dependencyPolicies.find(
					(rule: { from: { element: { type: string } } }) =>
						rule.from.element.type === 'feature-atom',
				);

			expect(featureAtomRule.allow).toEqual(
				expect.arrayContaining([
				expect.objectContaining({
							to: expect.objectContaining({
								element: expect.objectContaining({
									type: 'feature-screen',
									captured: {
										feature: '{{from.element.captured.feature}}',
									},
								}),
							}),
						}),
						expect.objectContaining({
							to: expect.objectContaining({
								element: expect.objectContaining({
									type: 'feature-model',
								}),
							}),
					}),
					]),
				);
				expect(featureAtomRule.allow).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							to: {
								file: {
									categories: 'feature-atom',
									captured: {
										feature: '{{from.element.captured.feature}}',
									},
								},
							},
						}),
					]),
				);
				expect(featureAtomRule.allow).not.toEqual(
				expect.arrayContaining([
						expect.objectContaining({
							to: expect.objectContaining({
								element: expect.objectContaining({
									type: 'feature-api',
									captured: { feature: '{{from.element.captured.feature}}' },
								}),
							}),
					}),
				]),
			);
		});

		it('uses the supported boundaries v7 policy API without migration warnings', async () => {
			const tempDir = fs.mkdtempSync(
				path.join(rootDir, '.tmp-eslint-config-expo-magic-boundaries-warning-'),
			);
			const uikitDir = path.join(tempDir, 'uikit');
			const featureDir = path.join(tempDir, 'features', 'people', 'api');
			fs.mkdirSync(uikitDir, { recursive: true });
			fs.mkdirSync(featureDir, { recursive: true });
			fs.writeFileSync(
				path.join(uikitDir, 'button.ts'),
				"import { peopleClient } from '../features/people/api/client';\n\nexport const service = peopleClient;\n",
			);
			fs.writeFileSync(
				path.join(featureDir, 'client.ts'),
				"export const peopleClient = 'people';\n",
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

			const warnings: string[] = [];
			const originalWarn = console.warn;
			console.warn = (...args: unknown[]) => {
				warnings.push(args.join(' '));
			};

			try {
				await runDirectoryLint(
					tempDir,
					config.createConfig({
						prettier: false,
						testing: false,
						featureBoundaries: true,
					}),
					['uikit/button.ts'],
				);
			} finally {
				console.warn = originalWarn;
				fs.rmSync(tempDir, { recursive: true, force: true });
			}

			expect(warnings.filter((warning) => warning.includes('[boundaries]'))).toEqual(
				[],
			);
		});

		it('runs feature boundary rules end to end', async () => {
			const tempDir = fs.mkdtempSync(
				path.join(rootDir, '.tmp-eslint-config-expo-magic-boundaries-'),
			);
			const configPath = path.join(tempDir, 'eslint.config.js');
			const uikitDir = path.join(tempDir, 'uikit');
			const featureApiDir = path.join(tempDir, 'features', 'people', 'api');
			const peopleScreenDir = path.join(
				tempDir,
				'features',
				'people',
				'screens',
			);
			const billingFeatureDir = path.join(tempDir, 'features', 'billing');

			try {
				fs.mkdirSync(uikitDir, { recursive: true });
				fs.mkdirSync(featureApiDir, { recursive: true });
				fs.mkdirSync(peopleScreenDir, { recursive: true });
				fs.mkdirSync(billingFeatureDir, { recursive: true });
				fs.writeFileSync(
					configPath,
					[
						'const { createConfig } = require(',
						`\t${JSON.stringify(path.join(__dirname, 'index.js'))},`,
						');',
						'',
						'module.exports = createConfig({',
						'\tprettier: false,',
						'\ttesting: false,',
						'\tfeatureBoundaries: true,',
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
					await runDirectoryLint(tempDir, configPath, ['uikit/button.ts']),
				);

				expect(
					messages.some(
						(message) => message.ruleId === 'boundaries/dependencies',
					),
				).toBe(true);

				fs.writeFileSync(
					path.join(tempDir, 'features', 'people', 'atoms.ts'),
					'export const peopleAtom = 1;\n',
				);
				fs.writeFileSync(
					path.join(billingFeatureDir, 'atoms.ts'),
					'export const billingAtom = 1;\n',
				);
				fs.writeFileSync(
					path.join(peopleScreenDir, 'screen.ts'),
					[
						"import { peopleAtom } from '../atoms';",
						"import { billingAtom } from '../../billing/atoms';",
						'',
						'export const screenValue = peopleAtom + billingAtom;',
						'',
					].join('\n'),
				);
				fs.writeFileSync(
					path.join(peopleScreenDir, 'same-feature-screen.ts'),
					[
						"import { peopleAtom } from '../atoms';",
						'',
						'export const sameFeatureValue = peopleAtom;',
						'',
					].join('\n'),
				);

				const sameFeatureMessages = getRuleMessages(
					await runDirectoryLint(tempDir, configPath, [
						'features/people/screens/same-feature-screen.ts',
					]),
				);
				expect(
					sameFeatureMessages.filter(
						(message) => message.ruleId === 'boundaries/dependencies',
					),
				).toHaveLength(0);

				const directAtomMessages = getRuleMessages(
					await runDirectoryLint(tempDir, configPath, [
						'features/people/screens/screen.ts',
					]),
				);
				const boundaryMessages = directAtomMessages.filter(
					(message) => message.ruleId === 'boundaries/dependencies',
				);

				expect(boundaryMessages).toHaveLength(1);
			} finally {
				fs.rmSync(tempDir, { recursive: true, force: true });
			}
		}, 15_000);

	});

	describe('test environments', () => {
		it('enables jest rules for test files', () => {
			const testConfig = config
				.createConfig({ testing: true })
				.find(
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
			const testConfig = config
				.createConfig({ testing: true })
				.find(
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
		it('runs base preset end to end', async () => {
			const results = await runPresetLint(path.join(__dirname, 'base.js'), [
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

		it('runs strict preset end to end', async () => {
			const results = await runPresetLint(path.join(__dirname, 'strict.js'), [
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

		it('runs typed preset end to end', async () => {
			const results = await runPresetLint(path.join(__dirname, 'typed.js'), [
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

		it('runs agent preset end to end', async () => {
			const results = await runPresetLint(path.join(__dirname, 'agent.js'), [
				'test-project/preset-fixtures/agent-only.test.ts',
			]);
			const messages = getRuleMessages(results);

			expect(
				messages.some(
					(message) => message.ruleId === '@typescript-eslint/ban-ts-comment',
				),
			).toBe(true);
			expect(
				messages.some((message) => message.ruleId === 'no-restricted-syntax'),
			).toBe(true);
			expect(
				messages.some((message) => message.ruleId === 'prettier/prettier'),
			).toBe(false);
		}, 15_000);

		it('supports ESM entrypoints', async () => {
			const indexEsm = await import(
				pathToFileURL(path.join(__dirname, 'index.mjs')).href
			);
			const agentEsm = await import(
				pathToFileURL(path.join(__dirname, 'agent.mjs')).href
			);
			const agentGuardrailsEsm = await import(
				pathToFileURL(path.join(__dirname, 'agent-guardrails.mjs')).href
			);
			const baseEsm = await import(
				pathToFileURL(path.join(__dirname, 'base.mjs')).href
			);
			const fastEsm = await import(
				pathToFileURL(path.join(__dirname, 'fast.mjs')).href
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
			expect(Array.isArray(indexEsm.agent)).toBe(true);
			expect(Array.isArray(indexEsm.agentGuardrails)).toBe(true);
			expect(Array.isArray(agentEsm.default)).toBe(true);
			expect(Array.isArray(agentGuardrailsEsm.default)).toBe(true);
			expect(Array.isArray(indexEsm.base)).toBe(true);
			expect(Array.isArray(indexEsm.fast)).toBe(true);
			expect(Array.isArray(indexEsm.strict)).toBe(true);
			expect(Array.isArray(indexEsm.typed)).toBe(true);
			expect(indexEsm.noPrettier).toBeUndefined();
			expect(indexEsm.strictNoPrettier).toBeUndefined();
			expect(indexEsm.typedNoPrettier).toBeUndefined();
			expect(Array.isArray(baseEsm.default)).toBe(true);
			expect(Array.isArray(fastEsm.default)).toBe(true);
			expect(Array.isArray(strictEsm.default)).toBe(true);
			expect(Array.isArray(typedEsm.default)).toBe(true);
			expect(typedEsm.noPrettier).toBeUndefined();
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

		it('validates agent mobile app PR guardrails', () => {
			const result = prGuardrails.validateGuardrails(
				{
					eventName: 'pull_request',
					prBody: [
						'- [x] Lint passed',
						'- [x] Typecheck passed',
						'- [x] Tests passed',
						'- [x] Runtime target named',
						'- [x] No unrelated lockfile changes',
						'- [x] No skipped tests',
						'- [x] No broad ignores',
						'- [x] `bun run lint:ci`',
						'- [x] `bun run typecheck`',
						'- [x] `bun run test:unit`',
						'- [x] `bun run validate:pr-guardrails`',
						'- [x] Watched GitHub CI after the latest push until `Validate Code` passed or a blocker was documented',
						'- [x] No skipped tests, loosened types, broad ignores, fake mocks, or unrelated rewrites to make CI pass',
						'- [x] No unrelated `package.json` or `bun.lock` changes',
						'- [x] Confirmed this machine can build and run the app in iOS Simulator or Android Emulator',
						'- [x] Simulator/emulator target used for validation is named in the PR body',
						'Validated on iPhone 16 Simulator.',
					].join('\n'),
					labels: [],
					changedFiles: [
						'features/home/screens/home-screen.tsx',
						'features/home/screens/home-screen.test.tsx',
					],
					changedPatch: '+const value = 1;\n',
				},
				{ preset: 'agentMobileApp' },
			);

			expect(result.passed).toBe(true);
		});

		it('rejects unknown PR guardrail presets', () => {
			expect(() =>
				prGuardrails.createPrGuardrailOptions({ preset: 'unknown-preset' }),
			).toThrow('Unknown PR guardrails preset');
		});

		it('allows large PRs only with the large approval label', () => {
			const changedFiles = Array.from(
				{ length: 81 },
				(_value, index) => `src/file-${index}.ts`,
			);
			const withoutApproval = prGuardrails.validateGuardrails({
				eventName: 'pull_request',
				prBody: '',
				labels: [],
				changedFiles,
				changedPatch: '+const value = 1;\n',
			});
			const withApproval = prGuardrails.validateGuardrails({
				eventName: 'pull_request',
				prBody: '',
				labels: ['large-approved'],
				changedFiles,
				changedPatch: '+const value = 1;\n',
			});

			expect(withoutApproval.passed).toBe(false);
			expect(withoutApproval.failures).toEqual(
				expect.arrayContaining([
					expect.stringContaining('PR size exceeds guardrail threshold'),
				]),
			);
			expect(withApproval.failures).not.toEqual(
				expect.arrayContaining([
					expect.stringContaining('PR size exceeds guardrail threshold'),
				]),
			);
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

		it('does not ignore risky additions outside configured files', () => {
			const result = prGuardrails.validateGuardrails(
				{
					eventName: 'pull_request',
					prBody: guardrailBody(),
					labels: ['owner-approved'],
					changedFiles: [
						'scripts/validate-pr-guardrails.ts',
						'features/home/screens/home-screen.tsx',
					],
					changedPatch: [
						'diff --git a/scripts/validate-pr-guardrails.ts b/scripts/validate-pr-guardrails.ts',
						'+++ b/scripts/validate-pr-guardrails.ts',
						'+const value: any = input;',
						'diff --git a/features/home/screens/home-screen.tsx b/features/home/screens/home-screen.tsx',
						'+++ b/features/home/screens/home-screen.tsx',
						'+it.only("focus", () => {});',
					].join('\n'),
				},
				{
					preset: 'mobileApp',
					ignoredRiskyFilePatterns: [/scripts\/validate-pr-guardrails\.ts/],
				},
			);

			expect(result.failures).toEqual(
				expect.arrayContaining([expect.stringContaining('focused test')]),
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

		it('lets the environment preset override config file options', () => {
			const tempDir = fs.mkdtempSync(
				path.join(rootDir, '.tmp-eslint-config-expo-magic-guardrails-env-'),
			);
			const originalPreset = process.env.EXPO_MAGIC_PR_GUARDRAILS_PRESET;

			try {
				fs.writeFileSync(
					path.join(tempDir, 'expo-magic.pr-guardrails.cjs'),
					"module.exports = { preset: 'default' };\n",
				);
				process.env.EXPO_MAGIC_PR_GUARDRAILS_PRESET = 'mobileApp';

				const options = prGuardrails.readCliOptionsFromEnv(tempDir);
				const resolvedOptions = prGuardrails.createPrGuardrailOptions(options);

				expect(resolvedOptions.requiredCheckboxes).toContain(
					'`bun run lint:ci`',
				);
			} finally {
				if (originalPreset === undefined) {
					delete process.env.EXPO_MAGIC_PR_GUARDRAILS_PRESET;
				} else {
					process.env.EXPO_MAGIC_PR_GUARDRAILS_PRESET = originalPreset;
				}
				fs.rmSync(tempDir, { recursive: true, force: true });
			}
		});
	});

	describe('repo guardrails', () => {
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

		it('loads the public config without requesting Expo flat internals', () => {
			const loaded = runModuleLoadProbe(
				[
					"const Module = require('node:module');",
					'const originalLoad = Module._load;',
					"Module._load = function(request) { if (request.startsWith('eslint-config-expo/flat/utils/')) { throw new Error('forbidden Expo internal subpath: ' + request); } return originalLoad.apply(this, arguments); };",
					`const publicConfig = require(${JSON.stringify(path.join(__dirname, 'index.js'))});`,
					"if (!Array.isArray(publicConfig) || publicConfig.length === 0) { throw new Error('public config did not load'); }",
					'process.stdout.write(JSON.stringify({ configLength: publicConfig.length, loaded: [\'public-config\'] }));',
				].join('\n'),
			);

			expect(loaded.configLength).toBeGreaterThan(0);
			expect(loaded.loaded).toEqual(['public-config']);
		});
	});

	describe('expo-magic plugin rules', () => {
		RuleTester.describe = describe;
		RuleTester.it = it;
		RuleTester.itOnly = it;

		const ruleTester = new RuleTester({
			languageOptions: {
				parser: tsParser,
				parserOptions: {
					sourceType: 'module',
					ecmaFeatures: { jsx: true },
				},
			},
		});

		ruleTester.run(
			'props-type-order',
			expoMagicPlugin.rules['props-type-order'],
			{
				valid: [
					'type FooProps = { id: string; title: string; onPress: () => void; };',
					'type FooProps = { id: string; label?: string; onChange: () => void; };',
					'type Other = { b: string; a: string; };',
					'type FooProps = { value: string; };',
				],
				invalid: [
					{
						code: 'type FooProps = { onPress: () => void; title: string; };',
						errors: [{ messageId: 'order' }],
					},
					{
						code: 'type BarProps = { b: string; a: string; };',
						errors: [{ messageId: 'order' }],
					},
					{
						code: 'type FooProps = { label?: string; id: string; };',
						errors: [{ messageId: 'order' }],
					},
				],
			},
		);

		ruleTester.run(
			'default-export-placement',
			expoMagicPlugin.rules['default-export-placement'],
			{
				valid: [
					'const Foo = () => null;\nexport default Foo;',
					'function Foo() { return null; }\nexport default Foo;',
					"import Foo from './foo';\nexport default Foo;",
					'const foo = 1;\nconst bar = 2;\nexport default foo;',
				],
				invalid: [
					{
						code: 'const Foo = () => null;\nconst helper = () => null;\nexport default Foo;',
						errors: [{ messageId: 'placement' }],
					},
					{
						code: 'function Foo() { return null; }\nconst styles = {};\nexport default Foo;',
						errors: [{ messageId: 'placement' }],
					},
				],
			},
		);

		ruleTester.run(
			'no-inline-props',
			expoMagicPlugin.rules['no-inline-props'],
			{
				valid: [
					'type P = { a: string };\nfunction Foo(props: P) { return props; }',
					'function Foo(value: { a: string }) { return value; }',
				],
				invalid: [
					{
						code: 'function Foo(props: { a: string }) { return props; }',
						errors: [{ messageId: 'inline' }],
					},
					{
						code: 'const Foo = (props: { a: string }) => props;',
						errors: [{ messageId: 'inline' }],
					},
				],
			},
		);

		ruleTester.run(
			'require-children-usage',
			expoMagicPlugin.rules['require-children-usage'],
			{
				valid: [
					'type P = { children: unknown };\nconst Foo = (props: P) => props.children;',
					'function Foo({ children }: { children: unknown }) { return children; }',
					'type P = { title: string };\nconst Foo = (props: P) => props.title;',
					'import type { PropsWithChildren } from "react";\nconst Foo = (props: PropsWithChildren) => props.children;',
				],
				invalid: [
					{
						code: 'type P = { children: unknown };\nconst Foo = (props: P) => null;',
						errors: [{ messageId: 'unused' }],
					},
					{
						code: 'import type { PropsWithChildren } from "react";\nconst Foo = (props: PropsWithChildren) => null;',
						errors: [{ messageId: 'unused' }],
					},
				],
			},
		);
	});

	describe('reanimated rules', () => {
		it('flags shared-value reads, hook .get(), and inline gesture config', async () => {
			const messages = await runFixtureLint({
				configSource: createPackageConfigSource(`{
					prettier: false,
					testing: false,
					reanimated: true
				}`),
				files: {
					'anim.ts': [
						"import { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';",
						'declare function usePanGesture(cfg: object): object;',
						'export function build() {',
						'\tconst source = useSharedValue(0);',
						'\tconst alias = source;',
						'\tconst fromGet = useSharedValue(source.get());',
						'\tconst fromValue = useSharedValue(alias.value);',
						'\tconst style = useAnimatedStyle(() => ({ x: source.get() }));',
						'\tconst gesture = usePanGesture({ onStart: () => {} });',
						'\treturn [fromGet, fromValue, style, gesture];',
						'}',
						'',
					].join('\n'),
				},
			});

			expect(
				messages.filter((message) => message.ruleId === 'no-restricted-syntax'),
			).toHaveLength(1);
			expect(
				messages.filter(
					(message) =>
						message.ruleId === 'expo-magic-reanimated/no-shared-value-misuse',
				),
			).toHaveLength(3);
		}, 15_000);

		it('supports custom gesture hook names', async () => {
			const messages = await runFixtureLint({
				configSource: createPackageConfigSource(`{
					prettier: false,
					testing: false,
					reanimated: { additionalGestureHooks: ['useFlingGesture'] }
				}`),
				files: {
					'gesture.ts': [
						'declare function useFlingGesture(cfg: object): object;',
						'export function build() {',
						'\treturn useFlingGesture({ onStart: () => {} });',
						'}',
						'',
					].join('\n'),
				},
			});

			expect(
				messages.some((message) => message.ruleId === 'no-restricted-syntax'),
			).toBe(true);
		}, 15_000);

		it('composes reanimated and worklets selectors without clobbering', async () => {
			const messages = await runFixtureLint({
				configSource: createPackageConfigSource(`{
					prettier: false,
					testing: false,
					reanimated: true,
					worklets: true
				}`),
				files: {
					'compose.ts': [
						"import { useSharedValue } from 'react-native-reanimated';",
						'declare function scheduleOnRN(callback: () => void): void;',
						'export function build() {',
						'\tconst source = useSharedValue(0);',
						'\tconst shared = useSharedValue(source.value);',
						'\tscheduleOnRN(() => {});',
						'\treturn shared;',
						'}',
						'',
					].join('\n'),
				},
			});

			expect(
				messages.filter((message) => message.ruleId === 'no-restricted-syntax'),
			).toHaveLength(1);
			expect(
				messages.filter(
					(message) =>
						message.ruleId === 'expo-magic-reanimated/no-shared-value-misuse',
				),
			).toHaveLength(1);
		}, 15_000);
	});

	describe('deprecated api rules', () => {
		it('flags deprecated symbols and types', async () => {
			const messages = await runFixtureLint({
				configSource: createPackageConfigSource(`{
					prettier: false,
					testing: false,
					deprecatedApis: true
				}`),
				files: {
					'legacy.ts': [
						'declare const StyleSheet: { absoluteFillObject: object };',
						'declare const AccessibilityInfo: { setAccessibilityFocus: () => void };',
						'export const fill = StyleSheet.absoluteFillObject;',
						'export function focus() { AccessibilityInfo.setAccessibilityFocus(); }',
						'export let nodeRef: MutableRefObject<number>;',
						'',
					].join('\n'),
				},
			});

			expect(
				messages.filter(
					(message) => message.ruleId === 'no-restricted-properties',
				),
			).toHaveLength(2);
			expect(
				messages.some(
					(message) =>
						message.ruleId === '@typescript-eslint/no-restricted-types',
				),
			).toBe(true);
		}, 15_000);

		it('accepts additional restricted properties', () => {
			const deprecated = config.createDeprecatedApiConfig({
				additionalRestrictedProperties: [
					{ object: 'Foo', property: 'bar', message: 'No.' },
				],
			});
			const propertiesEntry = deprecated.find(
				(entry: FlatConfig) => entry.rules?.['no-restricted-properties'],
			);

			expect(propertiesEntry.rules['no-restricted-properties']).toEqual(
				expect.arrayContaining([
					expect.objectContaining({ object: 'Foo', property: 'bar' }),
					expect.objectContaining({
						object: 'StyleSheet',
						property: 'absoluteFillObject',
					}),
				]),
			);
		});
	});

	describe('semantic colors rules', () => {
		it('flags raw colors and direct token access but allows the token file', async () => {
			const messages = await runFixtureLint({
				configSource: createPackageConfigSource(`{
					prettier: false,
					testing: false,
					semanticColors: true
				}`),
				files: {
					'screen.ts': [
						"import { colors } from '../uikit/tokens/colors';",
						"export const hex = '#ffffff';",
						"export const translucent = 'rgba(0,0,0,0.5)';",
						'export const raw = colors.primary;',
						'',
					].join('\n'),
					'uikit/tokens/colors.ts': [
						"export const colors = { primary: '#ff0000' };",
						'',
					].join('\n'),
				},
			});

			const screenMessages = messages.filter(
				(message) => message.ruleId === 'no-restricted-syntax',
			);

			expect(screenMessages.length).toBeGreaterThanOrEqual(4);
		}, 15_000);

		it('supports a custom token module path', () => {
			const groups = config.createSemanticColorsConfig({
				tokenModule: 'theme/palette',
				importName: 'palette',
			});
			const restrictionEntry = groups.find(
				(entry: FlatConfig) => entry.rules?.['no-restricted-syntax'],
			);
			const selectors = restrictionEntry.rules['no-restricted-syntax'].slice(1);

			expect(
				selectors.some((selector: { selector: string }) =>
					selector.selector.includes('theme\\/palette'),
				),
			).toBe(true);
			expect(
				selectors.some((selector: { selector: string }) =>
					selector.selector.includes('object.name="palette"'),
				),
			).toBe(true);
		});
	});

	describe('component structure rules', () => {
		it('runs component structure rules end to end', async () => {
			const messages = await runFixtureLint({
				configSource: createPackageConfigSource(`{
					prettier: false,
					testing: false,
					componentStructure: true
				}`),
				files: {
					'Widget.tsx': [
						'type WidgetProps = {',
						'\tonPress: () => void;',
						'\ttitle: string;',
						'};',
						'const Widget = (props: WidgetProps) => props.title;',
						'const helper = () => null;',
						'export default Widget;',
						'export const noop = helper;',
						'',
					].join('\n'),
				},
			});

			expect(
				messages.some(
					(message) => message.ruleId === 'expo-magic/props-type-order',
				),
			).toBe(true);
			expect(
				messages.some(
					(message) => message.ruleId === 'expo-magic/default-export-placement',
				),
			).toBe(true);
		}, 15_000);

		it('supports a custom props type pattern', () => {
			const structure = config.createComponentStructureConfig({
				propsTypePattern: '^Settings$',
			});
			const propTypeEntry = structure.find(
				(entry: FlatConfig) =>
					entry.rules?.['expo-magic/props-type-order'] &&
					entry.files?.includes('**/*.ts'),
			);

			expect(propTypeEntry.rules['expo-magic/props-type-order']).toEqual([
				'warn',
				{ pattern: '^Settings$' },
			]);
		});
	});

	describe('react compiler preset', () => {
		it('promotes react-hooks compiler diagnostics to error', () => {
			expect(reactCompilerSubpath.rules['react-hooks/unsupported-syntax']).toBe(
				'error',
			);
			expect(
				reactCompilerSubpath.rules['react-hooks/incompatible-library'],
			).toBe('error');
		});

		it('no longer ships brittle restricted-syntax selectors', () => {
			expect(reactCompilerSubpath.restrictedSyntaxGroups).toBeUndefined();
			const composed = config.createConfig({ reactCompiler: true });
			const compilerEntry = composed.find(
				(entry: FlatConfig) =>
					entry.rules?.['react-hooks/unsupported-syntax'] === 'error',
			);
			expect(compilerEntry).toBeDefined();
		});
	});

	describe('app guardrails options', () => {
		it('supports a custom query hook pattern', () => {
			const groups = config.createAppGuardrailsConfig({
				queryHookPattern: '^useFetch[A-Z]',
			});
			const restrictionEntry = groups.find(
				(entry: FlatConfig) => entry.rules?.['no-restricted-syntax'],
			);
			const selectors = restrictionEntry.rules['no-restricted-syntax'].slice(1);

			expect(
				selectors.some((selector: { selector: string }) =>
					selector.selector.includes('^useFetch[A-Z]'),
				),
			).toBe(true);
		});
	});

	describe('inline styles option', () => {
		it('enables react-native/no-inline-styles when requested', () => {
			const customConfig = config.createConfig({ inlineStyles: true });
			const inlineStylesEntry = customConfig.find(
				(entry: FlatConfig) =>
					entry.rules?.['react-native/no-inline-styles'] === 'warn',
			);

			expect(inlineStylesEntry).toBeDefined();
			expect(inlineStylesEntry.files).toContain('**/*.tsx');
		});

		it('keeps inline styles disabled by default', () => {
			const inlineStylesEntry = config.find(
				(entry: FlatConfig) =>
					entry.rules?.['react-native/no-inline-styles'] === 'warn',
			);
			expect(inlineStylesEntry).toBeUndefined();
		});
	});

	describe('new subpath exports', () => {
		it('exports component structure, deprecated apis, reanimated, semantic colors', () => {
			expect(
				typeof componentStructureSubpath.createComponentStructureConfig,
			).toBe('function');
			expect(typeof deprecatedApisSubpath.createDeprecatedApiConfig).toBe(
				'function',
			);
			expect(typeof reanimatedSubpath.createReanimatedConfig).toBe('function');
			expect(typeof semanticColorsSubpath.createSemanticColorsConfig).toBe(
				'function',
			);
			expect(Array.isArray(componentStructureSubpath)).toBe(true);
			expect(Array.isArray(deprecatedApisSubpath)).toBe(true);
			expect(Array.isArray(reanimatedSubpath)).toBe(true);
			expect(Array.isArray(semanticColorsSubpath)).toBe(true);
		});

		it('supports ESM entrypoints for new subpaths', async () => {
			const componentStructureEsm = await import(
				pathToFileURL(path.join(__dirname, 'component-structure.mjs')).href
			);
			const deprecatedApisEsm = await import(
				pathToFileURL(path.join(__dirname, 'deprecated-apis.mjs')).href
			);
			const reanimatedEsm = await import(
				pathToFileURL(path.join(__dirname, 'reanimated.mjs')).href
			);
			const semanticColorsEsm = await import(
				pathToFileURL(path.join(__dirname, 'semantic-colors.mjs')).href
			);

			expect(Array.isArray(componentStructureEsm.default)).toBe(true);
			expect(typeof componentStructureEsm.createComponentStructureConfig).toBe(
				'function',
			);
			expect(typeof deprecatedApisEsm.createDeprecatedApiConfig).toBe(
				'function',
			);
			expect(typeof reanimatedEsm.createReanimatedConfig).toBe('function');
			expect(typeof semanticColorsEsm.createSemanticColorsConfig).toBe(
				'function',
			);
		});
	});
});
