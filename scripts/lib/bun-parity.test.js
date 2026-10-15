const { describe, expect, test } = require('bun:test');
const {
	compareFormat,
	compareLint,
	lintFindingKeys,
	parseCheckOutput,
} = require('./bun-parity.js');

const rootDir = '/repo/test-project';

function result(file, messages) {
	return { filePath: `${rootDir}/${file}`, messages };
}

function message(line, ruleId, severity = 2) {
	return { line, column: 1, ruleId, severity };
}

describe('bun parity', () => {
	test('keys findings by relative file, position, rule and severity', () => {
		const keys = lintFindingKeys(
			[result('App.tsx', [message(3, 'no-console', 1)])],
			rootDir,
		);

		expect(keys).toEqual(['App.tsx:3:1 no-console 1']);
	});

	test('reports findings only one linter produced', () => {
		const comparison = compareLint({
			eslint: [result('a.ts', [message(1, 'eqeqeq'), message(2, 'no-var')])],
			bun: [result('a.ts', [message(1, 'eqeqeq'), message(5, 'curly')])],
			rootDir,
		});

		expect(comparison.matched).toBe(1);
		expect(comparison.missingInBun).toEqual(['a.ts:2:1 no-var 2']);
		expect(comparison.unexpectedInBun).toEqual(['a.ts:5:1 curly 2']);
	});

	test('accepts known divergences for their rule and file only', () => {
		const comparison = compareLint({
			eslint: [],
			bun: [
				result('App.tsx', [message(4, 'react-hooks/refs')]),
				result('Other.tsx', [message(4, 'react-hooks/refs')]),
			],
			rootDir,
			knownDivergences: [
				{ ruleId: 'react-hooks/refs', file: 'App.tsx', reason: 'upstream' },
			],
		});

		expect(comparison.knownInBun).toEqual(['App.tsx:4:1 react-hooks/refs 2']);
		expect(comparison.unexpectedInBun).toEqual([
			'Other.tsx:4:1 react-hooks/refs 2',
		]);
		expect(comparison.staleDivergences).toEqual([]);
	});

	test('flags known divergences that no longer occur', () => {
		const divergence = {
			ruleId: 'react-hooks/refs',
			file: 'App.tsx',
			reason: 'upstream',
		};
		const comparison = compareLint({
			eslint: [],
			bun: [],
			rootDir,
			knownDivergences: [divergence],
		});

		expect(comparison.staleDivergences).toEqual([divergence]);
	});

	test('reads file names from prettier-style check output', () => {
		const output = [
			'Checking formatting...',
			'[warn] src/b.ts',
			'[warn] src/a.ts',
			'[warn] Code style issues found in 2 files. Run Prettier with --write to fix.',
		].join('\n');

		expect(parseCheckOutput(output)).toEqual(['src/a.ts', 'src/b.ts']);
	});

	test('reads file names from colored check output', () => {
		const output = [
			'Checking formatting...',
			'[\u001b[33mwarn\u001b[39m] src/a.ts',
			'[\u001b[33mwarn\u001b[39m] Code style issues found in the above file.',
		].join('\n');

		expect(parseCheckOutput(output)).toEqual(['src/a.ts']);
	});

	test('reports files only one formatter flagged', () => {
		expect(
			compareFormat({
				prettierFiles: ['a.ts', 'b.ts'],
				bunFiles: ['b.ts', 'c.ts'],
			}),
		).toEqual({ onlyPrettier: ['a.ts'], onlyBun: ['c.ts'] });
	});
});
