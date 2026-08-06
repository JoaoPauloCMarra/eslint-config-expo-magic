const path = require('node:path');
const { describe, expect, test } = require('bun:test');
const {
	collectMessagesByFile,
	collectLintRuleResults,
	findExpectedFileRuleFailures,
	findMissingRuleFileCoverage,
	findUnexpectedFileRuleFailures,
} = require('./validation-results.js');

describe('validation result identity', () => {
	test('keeps duplicate basenames distinct', () => {
		const rootDir = path.join(path.sep, 'repo');
		const results = [
			{
				filePath: path.join(rootDir, 'test-project', 'App.tsx'),
				messages: [{ ruleId: 'example/rule', severity: 2 }],
			},
			{
				filePath: path.join(rootDir, 'test-project', 'components', 'App.tsx'),
				messages: [{ ruleId: 'other/rule', severity: 1 }],
			},
		];

		const analysis = collectLintRuleResults(results, rootDir);

		expect([...analysis.ruleFiles['example/rule']]).toEqual([
			'test-project/App.tsx',
		]);
		expect([...analysis.ruleFiles['other/rule']]).toEqual([
			'test-project/components/App.tsx',
		]);
		expect(
			findMissingRuleFileCoverage(
				{ 'example/rule': ['test-project/components/App.tsx'] },
				analysis.ruleFiles,
			),
		).toEqual([
			{
				files: ['test-project/components/App.tsx'],
				ruleId: 'example/rule',
			},
		]);
	});
});

describe('validation per-file expectations', () => {
	const rootDir = path.join(path.sep, 'repo');

	const results = [
		{
			filePath: path.join(rootDir, 'test-project', 'apps', 'entry.ts'),
			messages: [
				{ ruleId: 'no-console', severity: 1 },
				{ ruleId: null, severity: 2 },
			],
		},
		{
			filePath: path.join(rootDir, 'test-project', 'packages', 'entry.ts'),
			messages: [{ ruleId: 'no-console', severity: 2 }],
		},
	];

	test('groups non-empty rule messages by relative file', () => {
		const messagesByFile = collectMessagesByFile(results, rootDir);

		expect(Object.keys(messagesByFile)).toEqual([
			'test-project/apps/entry.ts',
			'test-project/packages/entry.ts',
		]);
		expect(messagesByFile['test-project/apps/entry.ts']).toHaveLength(1);
	});

	test('reports missing rules and severity mismatches', () => {
		const messagesByFile = collectMessagesByFile(results, rootDir);
		const failures = findExpectedFileRuleFailures(messagesByFile, {
			'test-project/apps/entry.ts': [
				{ ruleId: 'no-console', severity: 1 },
				{ ruleId: 'import-x/order', severity: 2 },
			],
			'test-project/packages/entry.ts': [{ ruleId: 'no-console', severity: 1 }],
		});

		expect(failures).toEqual([
			{
				file: 'test-project/apps/entry.ts',
				reason: 'missing',
				ruleId: 'import-x/order',
			},
			{
				file: 'test-project/packages/entry.ts',
				reason: 'severity 2, expected 1',
				ruleId: 'no-console',
			},
		]);
	});

	test('reports forbidden rules present in a file', () => {
		const messagesByFile = collectMessagesByFile(results, rootDir);
		const failures = findUnexpectedFileRuleFailures(messagesByFile, {
			'test-project/apps/entry.ts': ['no-console'],
			'test-project/packages/entry.ts': ['import-x/order'],
		});

		expect(failures).toEqual([
			{
				file: 'test-project/apps/entry.ts',
				reason: 'unexpected',
				ruleId: 'no-console',
			},
		]);
	});
});
