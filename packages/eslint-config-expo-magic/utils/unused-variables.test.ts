import { describe, expect, it } from 'bun:test';
import type { ESLint, Linter } from 'eslint';

const appConfig: Linter.Config[] = require('./app.js');
const importsConfig: Linter.Config[] = require('./imports.js');
const typescriptConfig: Linter.Config[] = require('./typescript.js');
const eslint: typeof import('eslint') = require('eslint');
const tsParser: typeof import('@typescript-eslint/parser') = require('@typescript-eslint/parser');
const typescriptEslint: typeof import('typescript-eslint') = require('typescript-eslint');
const unusedImports: ESLint.Plugin = require('eslint-plugin-unused-imports');

function mergeRules(configs: Linter.Config[]): Linter.RulesRecord {
	return Object.assign(
		{},
		...configs.map((config) => config.rules ?? {}),
	) as Linter.RulesRecord;
}

describe('unused variable rule ownership', () => {
	it('uses TypeScript-aware diagnostics for TypeScript files', () => {
		const rules = mergeRules([
			...appConfig.filter((config) => !config.files),
			...importsConfig.filter((config) => !config.files),
			...typescriptConfig,
		]);

		expect(rules['no-unused-vars']).toBe('off');
		expect(rules['@typescript-eslint/no-unused-vars']).toEqual([
			'error',
			expect.any(Object),
		]);
		expect(rules['unused-imports/no-unused-imports']).toBe('error');
	});

	it('keeps core diagnostics for JavaScript files', () => {
		const javaScriptConfig = appConfig.find((config) =>
			config.files?.includes('**/*.js'),
		);

		expect(javaScriptConfig?.rules?.['no-unused-vars']).toEqual([
			'error',
			expect.any(Object),
		]);
	});

	it('reports one unused-variable diagnostic per TypeScript binding', () => {
		const rules = mergeRules([
			...importsConfig,
			...typescriptConfig,
			...appConfig.filter((config) => !config.files),
		]);
		const messages = new eslint.Linter().verify(
			'const unusedValue = 1;',
			[
				{
					files: ['**/*.ts'],
					languageOptions: {
						parser: tsParser,
					},
					plugins: {
						'@typescript-eslint': typescriptEslint.plugin,
						'unused-imports': unusedImports,
					},
					rules: {
						'no-unused-vars': rules['no-unused-vars'],
						'@typescript-eslint/no-unused-vars':
							rules['@typescript-eslint/no-unused-vars'],
						'unused-imports/no-unused-imports':
							rules['unused-imports/no-unused-imports'],
					},
				},
			],
			{ filename: 'fixture.ts' },
		);

		expect(messages.map((message) => message.ruleId).filter(Boolean)).toEqual([
			'@typescript-eslint/no-unused-vars',
		]);
	});
});
