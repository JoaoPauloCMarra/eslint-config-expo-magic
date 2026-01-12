import { describe, expect, it } from 'bun:test';

const config = require('./index.js');

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

		it('includes ignore patterns', () => {
			const ignoreConfig = config.find((c: any) => c.ignores);
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
					(c: any) => c.plugins && Object.keys(c.plugins).includes(name),
				);
				expect(hasPlugin).toBe(true);
			});
		});
	});

	describe('typescript rules', () => {
		it('has typescript config for .ts/.tsx files', () => {
			const tsConfig = config.find(
				(c: any) =>
					c.files &&
					(c.files.includes('**/*.ts') || c.files.includes('**/*.tsx')),
			);
			expect(tsConfig).toBeDefined();
		});

		it('enforces consistent-type-imports', () => {
			const tsConfig = config.find(
				(c: any) =>
					c.rules && c.rules['@typescript-eslint/consistent-type-imports'],
			);
			expect(tsConfig).toBeDefined();
			expect(
				tsConfig.rules['@typescript-eslint/consistent-type-imports'][0],
			).toBe('error');
		});

		it('enforces no-explicit-any', () => {
			const tsConfig = config.find(
				(c: any) => c.rules && c.rules['@typescript-eslint/no-explicit-any'],
			);
			expect(tsConfig).toBeDefined();
			expect(tsConfig.rules['@typescript-eslint/no-explicit-any']).toBe(
				'error',
			);
		});

		it('prefers type over interface', () => {
			const tsConfig = config.find(
				(c: any) =>
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
				(c: any) => c.settings && c.settings['import-x/extensions'],
			);
			expect(settingsConfig).toBeDefined();
			expect(settingsConfig.settings['import-x/extensions']).toBeDefined();
		});

		it('has browser and mobile globals', () => {
			const globalsConfig = config.find(
				(c: any) =>
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
				(c: any) =>
					c.files &&
					c.files.includes('metro.config.js') &&
					c.languageOptions &&
					c.languageOptions.globals &&
					c.languageOptions.globals.module !== undefined,
			);
			expect(nodeConfig).toBeDefined();
		});
	});

	describe('react rules', () => {
		it('enables react-hooks/exhaustive-deps', () => {
			const hasRule = config.some(
				(c: any) =>
					c.rules &&
					(c.rules['react-hooks/exhaustive-deps'] ||
						(c.plugins && c.plugins['react-hooks'])),
			);
			expect(hasRule).toBe(true);
		});

		it('enables react-native rules', () => {
			const rnConfig = config.find(
				(c: any) =>
					c.rules &&
					(c.rules['react-native/no-unused-styles'] ||
						c.rules['react-native/split-platform-components']),
			);
			expect(rnConfig).toBeDefined();
			expect(rnConfig.rules['react-native/no-unused-styles']).toBe('error');
		});

		it('enables react-19-upgrade rules', () => {
			const r19Config = config.find(
				(c: any) => c.rules && c.rules['react-19-upgrade/no-default-props'],
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
				(c: any) => c.rules && c.rules['unused-imports/no-unused-imports'],
			);
			expect(importConfig).toBeDefined();
			expect(importConfig.rules['unused-imports/no-unused-imports']).toBe(
				'error',
			);
		});

		it('enables import-x/order', () => {
			const importConfig = config.find(
				(c: any) => c.rules && c.rules['import-x/order'],
			);
			expect(importConfig).toBeDefined();
			expect(importConfig.rules['import-x/order'][0]).toBe('error');
		});
	});

	describe('prettier rules', () => {
		it('enables prettier/prettier', () => {
			const prettierRule = config.find(
				(c: any) => c.rules && c.rules['prettier/prettier'],
			);
			expect(prettierRule).toBeDefined();
			expect(prettierRule.rules['prettier/prettier']).toBe('error');
		});
	});

	describe('app rules', () => {
		it('warns on console', () => {
			const appConfig = config.find(
				(c: any) => c.rules && c.rules['no-console'] === 'warn',
			);
			expect(appConfig).toBeDefined();
		});

		it('restricts SafeAreaView import', () => {
			const appConfig = config.find(
				(c: any) => c.rules && c.rules['no-restricted-imports'],
			);
			expect(appConfig).toBeDefined();
			const rule = appConfig.rules['no-restricted-imports'];
			expect(rule[1].paths[0].name).toBe('react-native');
			expect(rule[1].paths[0].importNames).toContain('SafeAreaView');
		});

		it('prefers box shadow', () => {
			const appConfig = config.find(
				(c: any) => c.rules && c.rules['expo/prefer-box-shadow'],
			);
			expect(appConfig).toBeDefined();
			expect(appConfig.rules['expo/prefer-box-shadow']).toBe('warn');
		});
	});

	describe('test environments', () => {
		it('enables jest rules for test files', () => {
			const testConfig = config.find(
				(c: any) =>
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
				(c: any) =>
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
				(c: any) => c.files && c.files.includes('apps/**'),
			);
			expect(appsConfig).toBeDefined();
			expect(appsConfig.rules['no-console']).toBe('warn');
		});

		it('has packages/ override with error for no-console', () => {
			const pkgConfig = config.find(
				(c: any) => c.files && c.files.includes('packages/**'),
			);
			expect(pkgConfig).toBeDefined();
			expect(pkgConfig.rules['no-console']).toBe('error');
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
			const strictExtra = config.strict[config.strict.length - 1];
			expect(
				strictExtra.rules['@typescript-eslint/no-non-null-assertion'],
			).toBe('error');
		});
	});
});
