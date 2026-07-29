const path = require('node:path');
const { describe, expect, test } = require('bun:test');
const {
	collectLintRuleResults,
	findMissingRuleFileCoverage,
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
