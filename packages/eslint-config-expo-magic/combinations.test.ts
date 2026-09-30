import { describe, expect, it } from 'bun:test';

const { ESLint } = require('eslint');
const fs = require('node:fs');
const path = require('node:path');
const { createConfig } = require('./utils/create-config.js');

const testProjectDir = path.resolve(__dirname, '../../test-project');
const testProjectTsconfig = path.join(testProjectDir, 'tsconfig.json');
const lintTargets = ['module.ts', 'test.web.tsx'];
const presets = ['default', 'base', 'fast'] as const;
const optionSets: Array<[string, Record<string, unknown>]> = [
	['no options', {}],
	['typeChecked', { typeChecked: true }],
	['strict', { strict: true }],
	['agent', { agent: true }],
	['reactCompiler', { reactCompiler: true }],
	['tsconfigProjects', { tsconfigProjects: [testProjectTsconfig] }],
	[
		'typeChecked with tsconfigProjects',
		{ typeChecked: true, tsconfigProjects: [testProjectTsconfig] },
	],
	[
		'strict with tsconfigProjects',
		{ strict: true, tsconfigProjects: [testProjectTsconfig] },
	],
];

async function lintCombination(options: Record<string, unknown>) {
	const eslint = new ESLint({
		overrideConfigFile: true,
		overrideConfig: createConfig(options),
		cwd: testProjectDir,
	});
	const results = [];

	for (const target of lintTargets) {
		const filePath = path.join(testProjectDir, target);
		const [result] = await eslint.lintText(
			fs.readFileSync(filePath, 'utf8'),
			{ filePath },
		);
		results.push(result);
	}

	return results;
}

describe('createConfig option combinations', () => {
	for (const preset of presets) {
		for (const [label, options] of optionSets) {
			it(`lints TS and TSX files with preset ${preset} and ${label}`, async () => {
				const results = await lintCombination({ preset, ...options });

				for (const result of results) {
					expect(
						result.messages.filter(
							(message: { fatal?: boolean }) => message.fatal,
						),
					).toEqual([]);
				}
			}, 60_000);
		}
	}

	for (const preset of presets) {
		it(`passes custom tsconfigProjects to the parser without projectService for preset ${preset}`, async () => {
			const eslint = new ESLint({
				overrideConfigFile: true,
				overrideConfig: createConfig({
					preset,
					typeChecked: true,
					tsconfigProjects: ['./tsconfig.json'],
				}),
				cwd: testProjectDir,
			});
			const calculated = await eslint.calculateConfigForFile(
				path.join(testProjectDir, 'module.ts'),
			);

			expect(calculated.languageOptions.parserOptions.project).toEqual([
				'./tsconfig.json',
			]);
			expect(
				calculated.languageOptions.parserOptions.projectService,
			).toBeUndefined();
		});
	}

	it('keeps package rule levels when typeChecked adds TypeScript ESLint presets', async () => {
		for (const options of [
			{ typeChecked: true },
			{ preset: 'fast', typeChecked: true },
			{ typeChecked: true, agent: true },
		]) {
			const eslint = new ESLint({
				overrideConfigFile: true,
				overrideConfig: createConfig(options),
				cwd: testProjectDir,
			});
			const calculated = await eslint.calculateConfigForFile(
				path.join(testProjectDir, 'module.ts'),
			);

			expect(
				calculated.rules['@typescript-eslint/prefer-nullish-coalescing'],
			).toEqual([0]);
			expect(calculated.rules['@typescript-eslint/array-type'][0]).toBe(1);
			expect(
				calculated.rules['@typescript-eslint/consistent-type-assertions'][0],
			).toBe(1);
			expect(
				calculated.rules['@typescript-eslint/no-empty-object-type'][0],
			).toBe(1);
		}
	});

	it('keeps projectService when tsconfigProjects is not set', async () => {
		for (const options of [
			{ typeChecked: true },
			{ preset: 'fast', typeChecked: true },
			{ preset: 'fast', strict: true },
		]) {
			const eslint = new ESLint({
				overrideConfigFile: true,
				overrideConfig: createConfig(options),
				cwd: testProjectDir,
			});
			const calculated = await eslint.calculateConfigForFile(
				path.join(testProjectDir, 'module.ts'),
			);

			expect(calculated.languageOptions.parserOptions.projectService).toBe(
				true,
			);
			expect(calculated.languageOptions.parserOptions.project).toBeUndefined();
		}
	});
});
