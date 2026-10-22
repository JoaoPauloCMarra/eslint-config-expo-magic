const { describe, expect, test } = require('bun:test');
const {
	compareFixes,
	compareGolden,
	goldenFromResults,
	hashText,
	normalizeBunRuleId,
	selectGoldenFiles,
} = require('./bun-golden.js');

const rootDir = '/repo/test-project';

describe('bun golden', () => {
	test('selects tracked JS and TS files outside the golden directory', () => {
		expect(
			selectGoldenFiles([
				'b.tsx',
				'a.ts',
				'mod.cts',
				'README.md',
				'bun-golden/profiles.js',
				'components/x.jsx',
			]),
		).toEqual(['a.ts', 'b.tsx', 'components/x.jsx', 'mod.cts']);
	});

	test('maps oxlint rule codes back to ESLint rule IDs', () => {
		expect(normalizeBunRuleId('eslint(no-var)')).toBe('no-var');
		expect(normalizeBunRuleId('typescript(no-explicit-any)')).toBe(
			'@typescript-eslint/no-explicit-any',
		);
		expect(normalizeBunRuleId('import(no-cycle)')).toBe('import-x/no-cycle');
		expect(normalizeBunRuleId('bun(format)')).toBe('prettier/prettier');
		expect(normalizeBunRuleId('react-native(no-unused-styles)')).toBe(
			'react-native/no-unused-styles',
		);
		expect(normalizeBunRuleId(undefined)).toBe('null');
	});

	test('reports rules that fire in a file for only one linter', () => {
		const comparison = compareGolden({
			golden: { findings: ['a.ts:1:1 no-var 2', 'a.ts:2:1 eqeqeq 2'] },
			report: {
				diagnostics: [
					{
						code: 'eslint(no-var)',
						severity: 'error',
						filename: 'a.ts',
						labels: [{ span: { line: 1, column: 1 } }],
					},
					{
						code: 'eslint(curly)',
						severity: 'warning',
						filename: 'a.ts',
						labels: [{ span: { line: 3, column: 1 } }],
					},
				],
			},
		});

		expect(comparison.matched).toBe(1);
		expect(comparison.missing).toEqual(['a.ts eqeqeq 2']);
		expect(comparison.extra).toEqual(['a.ts curly 1']);
	});

	test('lists count differences without failing on them', () => {
		const duplicate = (line) => ({
			code: 'import(no-duplicates)',
			severity: 'warning',
			filename: 'a.ts',
			labels: [{ span: { line, column: 19 } }],
		});
		const comparison = compareGolden({
			golden: {
				findings: [
					'a.ts:1:1 import-x/no-duplicates 1',
					'a.ts:2:1 import-x/no-duplicates 1',
				],
			},
			report: { diagnostics: [duplicate(1)] },
		});

		expect(comparison.missing).toEqual([]);
		expect(comparison.extra).toEqual([]);
		expect(comparison.countDiffs).toEqual([
			['a.ts import-x/no-duplicates 1', 2, 1],
		]);
	});

	test('accepts reviewed divergences and flags the ones that no longer occur', () => {
		const comparison = compareGolden({
			golden: {
				findings: ['a.ts:1:1 react-hooks/refs 2', 'b.ts:1:1 no-var 2'],
			},
			report: {
				diagnostics: [
					{
						code: 'eslint(no-var)',
						severity: 'error',
						filename: 'b.ts',
						labels: [{ span: { line: 1, column: 1 } }],
					},
				],
			},
			divergences: [
				{ pair: 'a.ts react-hooks/refs 2', side: 'missing', reason: 'oxlint' },
				{ pair: 'b.ts no-var 2', side: 'missing', reason: 'fixed' },
			],
		});

		expect(comparison.missing).toEqual([]);
		expect(comparison.staleDivergences).toEqual([
			{ pair: 'b.ts no-var 2', side: 'missing', reason: 'fixed' },
		]);
	});

	test('maps shared oxlint rule names to the names ESLint reported', () => {
		const diagnostic = (code, filename) => ({
			code,
			severity: 'error',
			filename,
			labels: [{ span: { line: 1, column: 1 } }],
		});
		const comparison = compareGolden({
			golden: {
				findings: [
					'a.tsx:1:1 react-hooks/refs 2',
					'a.tsx:1:1 @typescript-eslint/no-unused-vars 2',
					'b.js:1:1 no-unused-vars 2',
					'a.tsx:1:1 react/jsx-key 2',
				],
			},
			report: {
				diagnostics: [
					diagnostic('react(refs)', 'a.tsx'),
					diagnostic('eslint(no-unused-vars)', 'a.tsx'),
					diagnostic('eslint(no-unused-vars)', 'b.js'),
					diagnostic('react(jsx-key)', 'a.tsx'),
				],
			},
		});

		expect(comparison.missing).toEqual([]);
		expect(comparison.extra).toEqual([]);
	});

	test('expects a parse error instead of ESLint findings in invalid-syntax files', () => {
		const parseError = (filename) => ({
			severity: 'error',
			filename,
			labels: [{ span: { line: 5, column: 1 } }],
		});
		const comparison = compareGolden({
			golden: {
				findings: [
					'invalid-syntax/a.ts:5:1 no-dupe-args 2',
					'invalid-syntax/b.ts:5:1 no-with 2',
				],
			},
			report: { diagnostics: [parseError('invalid-syntax/a.ts')] },
		});

		expect(comparison.missing).toEqual([]);
		expect(comparison.extra).toEqual([]);
		expect(comparison.acceptedInvalidFiles).toEqual(['invalid-syntax/b.ts']);
	});

	test('compares fixed-output hashes per file', () => {
		expect(
			compareFixes(
				{ 'a.ts': 'h1', 'b.ts': 'h2', 'c.ts': 'h3' },
				{ 'a.ts': 'h1', 'b.ts': 'other', 'd.ts': 'h4' },
			),
		).toEqual({
			matched: ['a.ts'],
			different: ['b.ts'],
			missing: ['c.ts'],
			extra: ['d.ts'],
		});
	});

	test('records findings, parse errors and fixed-output hashes', () => {
		const golden = goldenFromResults({
			profile: 'default',
			rootDir,
			results: [
				{
					filePath: `${rootDir}/b.ts`,
					messages: [
						{ line: 2, column: 1, ruleId: 'no-var', severity: 2 },
						{ line: 1, column: 1, ruleId: null, severity: 2, fatal: true },
					],
					output: 'let x;\n',
				},
				{
					filePath: `${rootDir}/ignored.ts`,
					messages: [{ line: 0, column: 0, ruleId: null, severity: 1 }],
				},
			],
		});

		expect(golden).toEqual({
			profile: 'default',
			findings: ['b.ts:1:1 null 2', 'b.ts:2:1 no-var 2'],
			fixes: { 'b.ts': hashText('let x;\n') },
		});
	});
});
