const { describe, expect, test } = require('bun:test');
const { toOxlintConfig } = require('./to-oxlint.js');

const plugin = { rules: {} };

describe('toOxlintConfig', () => {
	test('turns off oxlint default categories', () => {
		expect(toOxlintConfig([]).categories).toEqual({ correctness: 'off' });
	});

	test('keeps entry order as overrides so later entries win', () => {
		const config = toOxlintConfig([
			{ rules: { 'no-console': 'warn' } },
			{
				files: ['**/*.ts'],
				ignores: ['**/*.d.ts'],
				rules: { 'no-console': 'off' },
			},
		]);

		expect(config.overrides).toEqual([
			{ files: ['**/*'], rules: { 'no-console': 'warn' } },
			{
				files: ['**/*.ts'],
				excludeFiles: ['**/*.d.ts'],
				rules: { 'no-console': 'off' },
			},
		]);
	});

	test('maps entries that only ignore files to ignorePatterns', () => {
		expect(
			toOxlintConfig([{ name: 'ignores', ignores: ['dist/**'] }])
				.ignorePatterns,
		).toEqual(['dist/**']);
	});

	test('renames plugin prefixes to the native names and enables the plugins', () => {
		const config = toOxlintConfig([
			{
				plugins: { '@typescript-eslint': plugin, 'import-x': plugin },
				rules: {
					'@typescript-eslint/no-explicit-any': 'error',
					'import-x/no-cycle': ['error', { maxDepth: 3 }],
					'react-hooks/rules-of-hooks': 'error',
					'jest/no-focused-tests': 'error',
					eqeqeq: 'error',
				},
			},
		]);

		expect(config.overrides[0].rules).toEqual({
			'typescript/no-explicit-any': 'error',
			'import/no-cycle': ['error', { maxDepth: 3 }],
			'react-hooks/rules-of-hooks': 'error',
			'jest/no-focused-tests': 'error',
			eqeqeq: 'error',
		});
		expect(config.plugins).toEqual(['import', 'jest', 'react', 'typescript']);
	});

	test('replaces prettier/prettier with bun/format', () => {
		const config = toOxlintConfig([
			{
				rules: { 'prettier/prettier': ['error', {}, { usePrettierrc: true }] },
			},
		]);

		expect(config.overrides[0].rules).toEqual({
			'bun/format': ['error', {}, { usePrettierrc: true }],
		});
	});

	test('loads JavaScript-only plugins under their original prefixes', () => {
		const config = toOxlintConfig(
			[{ rules: { 'react-native/no-unused-styles': 'error' } }],
			{ jsPlugins: { 'react-native': '/pkg/rules/react-native.js' } },
		);

		expect(config.jsPlugins).toEqual([
			{ name: 'react-native', specifier: '/pkg/rules/react-native.js' },
		]);
	});

	test('keeps the typescript-eslint setting when a later entry changes the core rule', () => {
		const config = toOxlintConfig([
			{ rules: { '@typescript-eslint/no-redeclare': 'warn' } },
			{ files: ['**/*.ts'], rules: { 'no-redeclare': 'off' } },
		]);

		expect(config.overrides[1].rules).toEqual({
			'no-redeclare': 'off',
			'typescript/no-redeclare': 'warn',
		});
	});

	test('drops "off" settings for plugins Bun does not have', () => {
		const config = toOxlintConfig([
			{ rules: { '@stylistic/quotes': 'off', '@stylistic/max-len': 0 } },
		]);

		expect(config.overrides).toEqual([]);
	});

	test('drops "off" settings for rules a JavaScript plugin does not define', () => {
		const config = toOxlintConfig(
			[
				{
					rules: {
						'react-native/no-inline-styles': 'warn',
						'react-native/no-raw-text': 'off',
					},
				},
			],
			{
				jsPlugins: { 'react-native': '/pkg/rules/react-native.js' },
				jsPluginRules: { 'react-native': new Set(['no-inline-styles']) },
			},
		);

		expect(config.overrides[0].rules).toEqual({
			'react-native/no-inline-styles': 'warn',
		});
		expect(() =>
			toOxlintConfig([{ rules: { 'react-native/no-raw-text': 'error' } }], {
				jsPlugins: { 'react-native': '/pkg/rules/react-native.js' },
				jsPluginRules: { 'react-native': new Set(['no-inline-styles']) },
			}),
		).toThrow('react-native/no-raw-text');
	});

	test('fails on a rule whose plugin has no native or JavaScript source', () => {
		expect(() =>
			toOxlintConfig([{ rules: { 'unknown-plugin/rule': 'error' } }]),
		).toThrow('unknown-plugin');
	});

	test('carries globals and normalizes their values', () => {
		const config = toOxlintConfig([
			{
				files: ['**/*.js'],
				languageOptions: {
					globals: { __DEV__: true, module: 'writable', x: false },
				},
			},
		]);

		expect(config.overrides[0].globals).toEqual({
			__DEV__: 'readonly',
			module: 'writable',
			x: 'readonly',
		});
	});

	test('enables type-aware rules when the flat config uses type information', () => {
		expect(toOxlintConfig([]).options).toBeUndefined();
		expect(
			toOxlintConfig([
				{ languageOptions: { parserOptions: { projectService: true } } },
			]).options,
		).toEqual({ typeAware: true });
		expect(
			toOxlintConfig([
				{
					languageOptions: { parserOptions: { project: ['./tsconfig.json'] } },
				},
			]).options,
		).toEqual({ typeAware: true });
	});

	test('drops react.version "detect", which oxlint configs reject', () => {
		const config = toOxlintConfig([
			{ settings: { react: { version: 'detect', pragma: 'React' } } },
		]);

		expect(config.settings).toEqual({ react: { pragma: 'React' } });
	});

	test('maps the import-x node resolver settings to import settings', () => {
		const config = toOxlintConfig([
			{
				settings: {
					'import-x/resolver': {
						node: { extensions: ['.ios.tsx', '.tsx'] },
						typescript: { project: ['./tsconfig.json'] },
					},
					react: { version: '19.2' },
				},
			},
		]);

		expect(config.settings).toEqual({
			'import/resolver': { node: { extensions: ['.ios.tsx', '.tsx'] } },
			react: { version: '19.2' },
		});
	});
});
