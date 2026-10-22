#!/usr/bin/env bun

// Records what the original ESLint plugins report for every case in
// packages/bun-next/rules/__cases__/<plugin>.js, so the Bun-only port tests
// can compare against them after ESLint leaves the repository. Usage:
// bun scripts/record-port-expectations.js <plugin>...

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { Linter } = require('eslint');
const tsParser = require('@typescript-eslint/parser');
const {
	caseFiles,
	lintTargets,
	sortMessages,
} = require('../packages/bun-next/rules/rule-harness.js');

const rootDir = path.resolve(__dirname, '..');
const rulesDir = path.join(rootDir, 'packages/bun-next/rules');

function languageOptions(filename) {
	return /\.[cm]?tsx?$/.test(filename)
		? { parser: tsParser, parserOptions: { ecmaFeatures: { jsx: true } } }
		: {
				ecmaVersion: 'latest',
				sourceType: 'module',
				parserOptions: { ecmaFeatures: { jsx: true } },
			};
}

function withRoot(value, dir) {
	if (typeof value === 'string') return value.replaceAll('<root>', dir);
	if (Array.isArray(value)) return value.map((item) => withRoot(item, dir));
	if (value && typeof value === 'object') {
		return Object.fromEntries(
			Object.entries(value).map(([key, item]) => [key, withRoot(item, dir)]),
		);
	}

	return value;
}

function recordCase(originalPlugin, originalConfig, testCase) {
	const dir = fs.realpathSync(
		fs.mkdtempSync(path.join(os.tmpdir(), 'record-port-')),
	);

	try {
		for (const [file, content] of Object.entries(caseFiles(testCase))) {
			fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
			fs.writeFileSync(path.join(dir, file), content);
		}

		const linter = new Linter({ configType: 'flat', cwd: dir });
		const messages = [];
		const output = {};

		for (const file of lintTargets(testCase)) {
			const filename = path.join(dir, file);
			const config = [
				{
					files: ['**/*.{js,jsx,mjs,cjs,ts,tsx,mts,cts}'],
					plugins: { ...originalConfig.plugins, orig: originalPlugin },
					languageOptions: languageOptions(file),
					settings: withRoot(testCase.originalSettings ?? testCase.settings ?? {}, dir),
					rules: {
						...originalConfig.rules,
						[`orig/${testCase.rule}`]: ['error', ...(testCase.options ?? [])],
					},
				},
			];
			const code = fs.readFileSync(filename, 'utf8');

			for (const message of linter.verify(code, config, { filename })) {
				// Keep the rule under test and parse errors; helper rules from
				// originalConfig only mark variables as used.
				if (message.ruleId && !message.ruleId.startsWith('orig/')) continue;
				messages.push({
					file,
					rule: message.ruleId?.replace(/^orig\//, '') ?? null,
					line: message.line,
					column: message.column,
					endLine: message.endLine,
					endColumn: message.endColumn,
					message: message.message,
				});
			}
			output[file] = linter.verifyAndFix(code, config, { filename }).output;
		}

		return { messages: sortMessages(messages), output };
	} finally {
		fs.rmSync(dir, { recursive: true, force: true });
	}
}

function main() {
	for (const plugin of process.argv.slice(2)) {
		const { cases, loadOriginalPlugin, loadOriginalConfig } = require(
			path.join(rulesDir, '__cases__', `${plugin}.js`),
		);
		const originalPlugin = loadOriginalPlugin();
		const originalConfig = loadOriginalConfig?.() ?? {};
		const ruleNames = [...new Set(cases.map((testCase) => testCase.rule))].sort();
		const expectations = {
			meta: Object.fromEntries(
				ruleNames.map((rule) => [rule, originalPlugin.rules[rule].meta]),
			),
			// Each case carries its full input, so the expectations stay valid
			// when fixtures change and ESLint is no longer installed.
			cases: cases.map((testCase) => ({
				name: testCase.name,
				rule: testCase.rule,
				files: caseFiles(testCase),
				lint: lintTargets(testCase),
				...(testCase.options ? { options: testCase.options } : {}),
				...(testCase.settings ? { settings: testCase.settings } : {}),
				...(testCase.isolate ? { isolate: true } : {}),
				...(testCase.divergence ? { divergence: testCase.divergence } : {}),
				...recordCase(originalPlugin, originalConfig, testCase),
			})),
		};
		const file = path.join(rulesDir, '__expectations__', `${plugin}.json`);

		fs.mkdirSync(path.dirname(file), { recursive: true });
		fs.writeFileSync(file, `${JSON.stringify(expectations, null, '\t')}\n`);
		console.log(`${plugin}: recorded ${cases.length} cases`);
	}
}

main();
