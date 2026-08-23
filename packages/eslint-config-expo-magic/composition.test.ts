import { describe, expect, it } from 'bun:test';
import type { Linter } from 'eslint';

const { ESLint } = require('eslint');
const fs = require('node:fs');
const path = require('node:path');
const config = require('./index.js');
const {
	RESTRICTED_SYNTAX_SCOPES,
	createComposedRestrictedSyntaxConfigs,
} = require('./utils/restricted-syntax.js');
const { createAppGuardrailsConfig } = require('./utils/app-guardrails.js');

type FlatConfig = Linter.Config;
const testProjectDir = path.resolve(__dirname, '../../test-project');
const repoRoot = path.resolve(__dirname, '../..');

async function calculateConfig(
	options: Record<string, unknown>,
	filePath: string,
) {
	const eslint = new ESLint({
		overrideConfigFile: true,
		overrideConfig: config.createConfig(options),
		cwd: repoRoot,
	});

	return eslint.calculateConfigForFile(filePath);
}

async function lint(
	options: Record<string, unknown>,
	filePath: string,
	source: string,
) {
	const tempDir = fs.mkdtempSync(
		path.join(testProjectDir, 'composition-fixture-'),
	);
	const targetPath = path.join(tempDir, filePath);
	fs.mkdirSync(path.dirname(targetPath), { recursive: true });
	fs.writeFileSync(targetPath, source);
	const eslint = new ESLint({
		overrideConfigFile: true,
		overrideConfig: config.createConfig(options),
		cwd: repoRoot,
	});

	try {
		const [result] = await eslint.lintText(source, { filePath: targetPath });
		const fatalMessage = result.messages.find((message) => message.fatal);
		if (fatalMessage) {
			throw new Error(fatalMessage.message);
		}
		return result.messages;
	} finally {
		fs.rmSync(tempDir, { recursive: true, force: true });
	}
}

function getRestrictedSyntaxMessages(
	messages: Array<{ ruleId: string | null; message: string }>,
) {
	return messages.filter(
		(message) => message.ruleId === 'no-restricted-syntax',
	);
}

describe('optional layer composition', () => {
	it('keeps agent base guardrails stricter than app guardrails', async () => {
		const calculated = await calculateConfig(
			{ agent: true, prettier: false, testing: false },
			'src/value.ts',
		);
		const banTsComment = calculated.rules[
			'@typescript-eslint/ban-ts-comment'
		] as [number, { minimumDescriptionLength: number }];
		const warningComments = calculated.rules['no-warning-comments'] as [
			number,
			{ terms: string[] },
		];

		expect(banTsComment[1].minimumDescriptionLength).toBe(10);
		expect(warningComments[1].terms).toEqual(['todo', 'fixme', 'hack']);
	});

	it('uses one agent diagnostic for overlapping app selectors', async () => {
		const messages = await lint(
			{ agent: true, prettier: false, testing: false },
			'src/value.test.ts',
			[
				'const value = {} as unknown as string;',
				'expect(value).toMatchSnapshot();',
			].join('\n'),
		);
		const restrictedMessages = getRestrictedSyntaxMessages(messages);

		expect(
			restrictedMessages.filter((message) =>
				message.message.includes('Do not use double assertions'),
			),
		).toHaveLength(1);
		expect(
			restrictedMessages.filter((message) =>
				message.message.includes('broad snapshot assertions'),
			),
		).toHaveLength(1);
		expect(
			restrictedMessages.some((message) =>
				message.message.includes('agent changes'),
			),
		).toBe(true);
	});

	it('allows native UI imports without removing baseline import restrictions', async () => {
		const messages = await lint(
			{
				nativeUi: { allowFiles: ['**/allowed.tsx'] },
				prettier: false,
				testing: false,
			},
			'src/allowed.tsx',
			[
				"import { Button, SafeAreaView } from 'react-native';",
				'export const Example = () => <SafeAreaView><Button title="Save" /></SafeAreaView>;',
			].join('\n'),
		);
		const importMessages = messages.filter(
			(message) => message.ruleId === 'no-restricted-imports',
		);

		expect(importMessages).toHaveLength(1);
		expect(importMessages[0].message).toContain(
			'react-native-safe-area-context',
		);
	});

	it('preserves baseline imports when native UI restrictions are replaced', async () => {
		const messages = await lint(
			{
				nativeUi: {
					allowFiles: ['**/allowed.tsx'],
					restrictions: [
						{
							name: 'react-native',
							importNames: ['Button'],
							message: 'Use the app button.',
						},
					],
				},
				prettier: false,
				testing: false,
			},
			'src/allowed.tsx',
			[
				"import { Button, SafeAreaView } from 'react-native';",
				'export const Example = () => <SafeAreaView><Button title="Save" /></SafeAreaView>;',
			].join('\n'),
		);
		const importMessages = messages.filter(
			(message) => message.ruleId === 'no-restricted-imports',
		);

		expect(importMessages).toHaveLength(1);
		expect(importMessages[0].message).toContain(
			'react-native-safe-area-context',
		);
	});

	it('allows semantic colors without removing agent or worklets restrictions', async () => {
		const messages = await lint(
			{
				agent: {
					semanticColors: {
						allowFiles: ['**/uikit/tokens/colors.ts'],
					},
				},
				prettier: false,
				testing: false,
			},
			'src/uikit/tokens/colors.ts',
			[
				"const raw = '#fff';",
				'const value: any = raw;',
				'scheduleOnRN(() => value);',
			].join('\n'),
		);
		const restrictedMessages = getRestrictedSyntaxMessages(messages);

		expect(
			restrictedMessages.some((message) =>
				message.message.includes('raw color literals'),
			),
		).toBe(false);
		expect(
			restrictedMessages.some((message) =>
				message.message.includes('Do not introduce `any`'),
			),
		).toBe(true);
		expect(
			restrictedMessages.some((message) =>
				message.message.includes('Pass an RN-runtime function'),
			),
		).toBe(true);
	});

	it('allows top-level semantic colors allow files in agent mode', async () => {
		const messages = await lint(
			{
				agent: true,
				semanticColors: {
					allowFiles: ['**/uikit/tokens/colors.ts'],
				},
				prettier: false,
				testing: false,
			},
			'src/uikit/tokens/colors.ts',
			[
				"const raw = '#fff';",
				'const value: any = raw;',
				'scheduleOnRN(() => value);',
			].join('\n'),
		);
		const restrictedMessages = getRestrictedSyntaxMessages(messages);

		expect(
			restrictedMessages.some((message) =>
				message.message.includes('raw color literals'),
			),
		).toBe(false);
		expect(
			restrictedMessages.some((message) =>
				message.message.includes('Do not introduce `any`'),
			),
		).toBe(true);
	});

	it('lets top-level false disable agent-default app guardrails', async () => {
		const messages = await lint(
			{
				agent: true,
				appGuardrails: false,
				prettier: false,
				testing: false,
			},
			'src/value.test.ts',
			"toMatchSnapshot();",
		);
		const restrictedMessages = getRestrictedSyntaxMessages(messages);

		expect(
			restrictedMessages.filter((message) =>
				message.message.includes('broad snapshot assertions'),
			),
		).toHaveLength(1);
		expect(
			restrictedMessages.some((message) =>
				message.message.includes('Prefer focused assertions over snapshots'),
			),
		).toBe(false);
	});

	it('does not leak test snapshot restrictions into semantic token allow files', async () => {
		const messages = await lint(
			{
				agent: {
					semanticColors: {
						allowFiles: ['**/uikit/tokens/colors.ts'],
					},
				},
				prettier: false,
				testing: false,
			},
			'src/uikit/tokens/colors.ts',
			['expect(value).toMatchSnapshot();'].join('\n'),
		);
		const restrictedMessages = getRestrictedSyntaxMessages(messages);

		expect(
			restrictedMessages.filter((message) =>
				message.message.includes('broad snapshot assertions'),
			),
		).toHaveLength(0);
	});

	it('keeps raw color restrictions outside semantic token allow file when hardening layers are enabled', async () => {
		const messages = await lint(
			{
				appGuardrails: true,
				componentStructure: true,
				deprecatedApis: true,
				featureBoundaries: true,
				inlineStyles: true,
				nativeUi: true,
				reactCompiler: true,
				reanimated: true,
				semanticColors: {
					allowFiles: ['**/uikit/tokens/colors.ts'],
				},
				storybook: true,
				worklets: true,
				prettier: false,
				testing: false,
			},
			'src/feature.ts',
			["const rawColor = '#f0f0f0';"].join('\n'),
		);
		const restrictedMessages = getRestrictedSyntaxMessages(messages);

		expect(
			restrictedMessages.some((message) =>
				message.message.includes('raw color literals'),
			),
		).toBe(true);
	});

	it.each([
		'src/value.ts',
		'src/value.tsx',
		'src/value.mts',
		'src/value.cts',
		'src/value.d.ts',
		'src/value.d.mts',
		'src/value.d.cts',
	])('applies TypeScript guardrails to %s', async (filePath) => {
		const messages = await lint(
			{ agent: true, prettier: false, testing: false },
			filePath,
			'type Value = any;',
		);
		const restrictedMessages = getRestrictedSyntaxMessages(messages);

		expect(
			restrictedMessages.filter((message) =>
				message.message.includes('Do not introduce `any`'),
			),
		).toHaveLength(1);
	});

	it.each([
		'src/value.test.ts',
		'src/value.test.tsx',
		'src/value.test.mts',
		'src/value.test.cts',
		'src/value.spec.ts',
		'src/value.spec.tsx',
		'src/value.spec.mts',
		'src/value.spec.cts',
	])('applies test guardrails to %s', async (filePath) => {
		const messages = await lint(
			{ agent: true, prettier: false, testing: false },
			filePath,
			["test.only('value', () => {});", 'expect(1).toMatchSnapshot();'].join(
				'\n',
			),
		);
		const restrictedMessages = getRestrictedSyntaxMessages(messages);

		expect(
			restrictedMessages.filter((message) =>
				message.message.includes('focused tests'),
			),
		).toHaveLength(1);
		expect(
			restrictedMessages.filter((message) =>
				message.message.includes('broad snapshot assertions'),
			),
		).toHaveLength(1);
	});

	it('preserves unknown narrowed file scopes', () => {
		const groups = [
			{
				files: ['src/**/*.ts'],
				selectors: [
					{
						selector: 'TSAnyKeyword',
						message: 'Avoid any.',
					},
				],
			},
			{
				files: ['**/*.{ts,tsx}'],
				selectors: [
					{
						selector: 'TSAsExpression',
						message: 'Avoid assertions.',
					},
				],
			},
		];

		expect(createComposedRestrictedSyntaxConfigs(groups)).toEqual([
			{
				files: ['src/**/*.ts'],
				rules: {
					'no-restricted-syntax': [
						'error',
						{
							selector: 'TSAnyKeyword',
							message: 'Avoid any.',
						},
					],
				},
			},
			{
				files: ['**/*.{ts,tsx}'],
				rules: {
					'no-restricted-syntax': [
						'error',
						{
							selector: 'TSAsExpression',
							message: 'Avoid assertions.',
						},
					],
				},
			},
		]);
	});

	it('preserves narrowed restrictions inside capability allow files', () => {
		const composed = createComposedRestrictedSyntaxConfigs([
			{
				files: ['src/**/*.ts'],
				selectors: [
					{
						selector: 'TSAnyKeyword',
						message: 'Avoid any.',
					},
				],
			},
			{
				allowFiles: ['**/tokens.ts'],
				capability: 'semantic-colors',
				files: ['**/*.ts'],
				scope: RESTRICTED_SYNTAX_SCOPES.TYPESCRIPT,
				selectors: [
					{
						selector: 'Literal[value=/^#/]',
						message: 'Avoid raw colors.',
					},
				],
			},
		]) as FlatConfig[];
		const preservationConfig = composed.find((entry) =>
			Array.isArray(entry.files) && entry.files.length === 1 && entry.files.includes('**/tokens.ts'),
		);
		const selectors = preservationConfig?.rules?.['no-restricted-syntax'] ?? [];

		expect(selectors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ selector: 'TSAnyKeyword' }),
			]),
		);
		expect(selectors).not.toEqual(
			expect.arrayContaining([
				expect.objectContaining({ selector: 'Literal[value=/^#/]' }),
			]),
		);
	});

	it('composes standalone app guardrails across test module scopes', () => {
		const appConfig = createAppGuardrailsConfig() as FlatConfig[];

		for (const filePattern of ['**/*.test.mts', '**/*.spec.cts']) {
			const matchingConfig = appConfig.find((entry) =>
				entry.files?.includes(filePattern),
			);
			const selectors = matchingConfig?.rules?.['no-restricted-syntax'];

			expect(selectors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						selector: 'TSAsExpression > TSAsExpression',
					}),
					expect.objectContaining({
						selector: expect.stringContaining('toMatchSnapshot'),
					}),
				]),
			);
		}
	});
});

describe('import-x-only diagnostics', () => {
	it('keeps the feature-boundaries resolver compatibility setting when enabled', () => {
		const configs = config.createConfig({ featureBoundaries: true });
		const resolverConfig = configs.find(
			(entry: FlatConfig) => entry.settings?.['import/resolver'],
		);

		expect(resolverConfig).toBeDefined();
		expect(resolverConfig?.settings?.['import/resolver']).toEqual(
			expect.objectContaining({
			node: expect.objectContaining({ extensions: expect.any(Array) }),
			typescript: expect.objectContaining({
				project: expect.arrayContaining(['./test-project/tsconfig.json']),
			}),
		}),
	);
	});

	it('keeps import-x settings without legacy import state in fast', () => {
		const configs = config.createConfig({ preset: 'fast' });
		const settingNames = configs.flatMap((entry: FlatConfig) =>
			Object.keys(entry.settings ?? {}),
		);

		for (const entry of configs) {
			expect(entry.plugins?.import).toBeUndefined();
			for (const ruleId of Object.keys(entry.rules ?? {})) {
				expect(ruleId.startsWith('import/')).toBe(false);
			}
			expect(entry.settings?.['import/ignore']).toBeUndefined();
			expect(entry.settings?.['import/resolver']).toBeUndefined();
		}

		expect(settingNames).toContain('import-x/ignore');
		expect(settingNames).toContain('import-x/extensions');
		expect(settingNames).toContain('import-x/resolver');
		expect(settingNames).toContain('import-x/resolver-next');
	});

	it('filters inherited legacy import plugin state', () => {
		const configs = config.createConfig({ prettier: false, testing: false });

		for (const entry of configs) {
			expect(entry.plugins?.import).toBeUndefined();
			for (const ruleId of Object.keys(entry.rules ?? {})) {
				expect(ruleId.startsWith('import/')).toBe(false);
			}
			for (const settingName of Object.keys(entry.settings ?? {})) {
				expect(settingName.startsWith('import/')).toBe(false);
			}
		}
	});

	it.each(['src/value.js', 'src/value.ts'])(
		'keeps equivalent import diagnostics for %s without legacy import rules',
		async (filePath) => {
			const messages = await lint(
				{ prettier: false, testing: false },
				filePath,
				[
					"import local from './local';",
					"import fs from 'node:fs';",
					'export { local, fs };',
				].join('\n'),
			);

			expect(
				messages.some((message) => message.ruleId === 'import-x/order'),
			).toBe(true);
			expect(
				messages.some((message) => message.ruleId?.startsWith('import/')),
			).toBe(false);
		},
	);
});
