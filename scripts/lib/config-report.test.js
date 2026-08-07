const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { describe, expect, test } = require('bun:test');
const {
	createAggregateConfigReport,
	createConfigReport,
	createMarkdownReport,
	writeConfigReportFiles,
} = require('./config-report.js');

describe('config report', () => {
	test('preserves effective file scopes and aggregate compatibility', async () => {
		const report = await createConfigReport();

		expect(Object.keys(report.scopes)).toEqual([
			'app',
			'package',
			'test',
			'story',
			'config',
			'web',
		]);
		expect(report.scopes.app.filePath).toBe('apps/mobile/App.tsx');
		expect(
			report.scopes.test.presets.default.rules['jest/expect-expect'],
		).toBeDefined();
		expect(
			report.scopes.app.presets.default.rules['jest/expect-expect'],
		).toBeUndefined();
		expect(report.presets.default.rules).toEqual(
			createAggregateConfigReport().presets.default.rules,
		);
		expect(report.presets.fast.rules).toEqual(
			createAggregateConfigReport().presets.fast.rules,
		);
		expect(report.deltas.fastVsDefault).toBeDefined();
	});

	test('writes fresh JSON and Markdown from same report', async () => {
		const outputDir = fs.mkdtempSync(
			path.join(os.tmpdir(), 'expo-magic-config-report-'),
		);

		try {
			const report = await createConfigReport();
			await writeConfigReportFiles(outputDir, report);

			expect(
				JSON.parse(
					fs.readFileSync(path.join(outputDir, 'config-diff.json'), 'utf8'),
				),
			).toEqual(report);
			expect(
				fs.readFileSync(path.join(outputDir, 'CONFIG_DIFF.md'), 'utf8'),
			).toBe(createMarkdownReport(report));
		} finally {
			fs.rmSync(outputDir, { force: true, recursive: true });
		}
	});
});
