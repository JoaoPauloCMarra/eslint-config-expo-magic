import { describe, expect, it } from 'bun:test';
import type { Linter } from 'eslint';

const { ESLint } = require('eslint');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const { createConfig } = require('./utils/create-config.js');
const plugin = require('./utils/plugin/index.js');
const fixtureRoot = path.resolve(__dirname, '../../test-project');

// All-off, all-on, and every singleton cover all four states of every option
// pair. Keep the coverage assertion below when adding a public boolean toggle.
const toggles = [
	'prettier',
	'testing',
	'typeChecked',
	'strict',
	'importCycles',
	'agent',
	'appGuardrails',
	'componentStructure',
	'deprecatedApis',
	'featureBoundaries',
	'inlineStyles',
	'nativeUi',
	'reactCompiler',
	'reanimated',
	'semanticColors',
	'storybook',
	'worklets',
];
const optionRows = [
	Object.fromEntries(toggles.map((name) => [name, false])),
	Object.fromEntries(toggles.map((name) => [name, true])),
	...toggles.map((enabled) =>
		Object.fromEntries(toggles.map((name) => [name, name === enabled])),
	),
];

function engine(options: Record<string, unknown>, fix = false) {
	return new ESLint({
		cwd: fixtureRoot,
		overrideConfigFile: true,
		overrideConfig: createConfig(options),
		fix,
	});
}

function assertParsed(result: Linter.LintMessage[]) {
	expect(result.filter((message) => message.fatal)).toEqual([]);
	expect(
		result.some((message) =>
			/no matching configuration|ignored/i.test(message.message),
		),
	).toBe(false);
}

describe('release option interaction contract', () => {
	it('covers every boolean option pair in both states', () => {
		for (let left = 0; left < toggles.length; left += 1) {
			for (let right = left + 1; right < toggles.length; right += 1) {
				expect(
					new Set(
						optionRows.map(
							(row) => `${row[toggles[left]]}/${row[toggles[right]]}`,
						),
					).size,
				).toBe(4);
			}
		}
	});

	for (const preset of ['base', 'fast', 'default']) {
		for (const [index, options] of optionRows.entries()) {
			it(`${preset} pairwise row ${index} parses JS, JSX, TS, TSX and TS modules`, async () => {
				const eslint = engine({ preset, ...options });
				for (const [file, source] of [
					['release-example.js', 'export const value = 1;'],
					['release-example.jsx', 'export const Widget = () => <div />;'],
					['module.ts', 'export const value: number = 1;'],
					['test.web.tsx', 'export const Widget = () => <div />;'],
					['module-file.mts', 'export const value: number = 1;'],
					['module-file.cts', 'export const value: number = 1;'],
				]) {
					const [result] = await eslint.lintText(source, {
						filePath: path.join(fixtureRoot, file),
					});
					assertParsed(result.messages);
				}
			}, 30_000);
		}
	}
});

describe('release scope and autofix contracts', () => {
	it('preserves generated/native/build ignores and caller extra ignores', async () => {
		for (const preset of ['base', 'fast', 'default']) {
			const eslint = engine({ preset, extraIgnores: ['**/generated/**'] });
			for (const file of [
				'.expo/types/router.d.ts',
				'android/build/example.js',
				'ios/build/example.js',
				'dist/example.js',
				'build/example.js',
				'node_modules/example/index.js',
				'src/generated/example.ts',
			]) {
				expect(await eslint.isPathIgnored(path.join(fixtureRoot, file))).toBe(
					true,
				);
			}
			expect(
				await eslint.isPathIgnored(path.join(fixtureRoot, 'module.ts')),
			).toBe(false);
		}
	});

	it('keeps story overrides scoped, while strict deliberately wins', async () => {
		for (const strict of [false, true]) {
			const eslint = engine({ preset: 'fast', storybook: true, strict });
			const story = await eslint.calculateConfigForFile(
				path.join(fixtureRoot, 'widget.stories.tsx'),
			);
			const source = await eslint.calculateConfigForFile(
				path.join(fixtureRoot, 'widget.tsx'),
			);
			expect(story.rules['no-console'][0]).toBe(strict ? 2 : 0);
			expect(source.rules['no-console'][0]).toBe(strict ? 2 : 1);
		}
	});

	it('does not rewrite custom diagnostics that need a human decision', async () => {
		const eslint = new ESLint({
			cwd: fixtureRoot,
			overrideConfigFile: true,
			fix: true,
			overrideConfig: [
				{
					files: ['**/*.tsx'],
					languageOptions: { parser: require('@typescript-eslint/parser') },
					plugins: { 'expo-magic': plugin },
					rules: {
						'expo-magic/require-children-usage': 'error',
						'expo-magic/default-export-placement': 'error',
					},
				},
			],
		});
		const source =
			'type Props = { children: unknown }; const Widget = (props: Props) => null; const helper = 1; export default Widget;';
		const [result] = await eslint.lintText(source, { filePath: 'widget.tsx' });
		expect(
			result.messages.map((message: Linter.LintMessage) => message.ruleId),
		).toContain('expo-magic/require-children-usage');
		expect(
			result.messages.map((message: Linter.LintMessage) => message.ruleId),
		).toContain('expo-magic/default-export-placement');
		expect(result.output).toBeUndefined();
	});

	it('autofix reaches a fixed point and preserves representative runtime values', async () => {
		const eslint = engine({ preset: 'fast', prettier: true }, true);
		const examples = [
			'interface Counter { value: number }; export const numbers: Array<number> = [1,2]; export const result: Counter = {value:numbers.length};',
			'export const result = { label: "a\\nb", values: [0, false, null], answer: 6 * 7 };',
		];
		function evaluate(source: string) {
			const output = ts.transpileModule(source, {
				compilerOptions: {
					module: ts.ModuleKind.CommonJS,
					target: ts.ScriptTarget.ES2022,
				},
			}).outputText;
			const context = { exports: {} };
			vm.runInNewContext(output, context, { timeout: 1000 });
			return JSON.stringify(context.exports);
		}
		for (const source of examples) {
			const [first] = await eslint.lintText(source, { filePath: 'module.ts' });
			assertParsed(first.messages);
			expect(first.output).toBeDefined();
			const [second] = await eslint.lintText(first.output, {
				filePath: 'module.ts',
			});
			assertParsed(second.messages);
			expect(second.output).toBeUndefined();
			expect(evaluate(first.output)).toBe(evaluate(source));
		}
	});
});
