const { describe, expect, test } = require('bun:test');
const fs = require('node:fs');
const path = require('node:path');
const { Linter } = require('eslint');
const tsParser = require('@typescript-eslint/parser');
const original = require('eslint-plugin-react-native');
const port = require('./react-native.js');

const repoRoot = path.resolve(__dirname, '../../..');
const projectRoot = path.join(repoRoot, 'test-project');

function legacyContext(context) {
	return new Proxy(Object.create(null), {
		get(_empty, key) {
			const target = context;
			if (key === 'getSourceCode') return () => target.sourceCode;
			if (key === 'getFilename') return () => target.filename;
			if (key === 'report') {
				return (first, second, third) => {
					if (typeof second === 'string') {
						target.report({
							node: first,
							message: second,
							...(third ? { data: third } : {}),
						});
					} else {
						target.report(first);
					}
				};
			}
			const value = target[key];
			return typeof value === 'function' ? value.bind(target) : value;
		},
	});
}

function wrapOriginal(rule) {
	return {
		meta: rule.meta,
		create: (context) => rule.create(legacyContext(context)),
	};
}

const origPlugin = {
	rules: Object.fromEntries(
		Object.entries(original.rules).map(([name, rule]) => [
			name,
			wrapOriginal(rule),
		]),
	),
};

function configFor(pluginName, plugin, rule, options, filename) {
	const isTs = /\.tsx?$/.test(filename);
	return [
		{
			files: ['**/*.{js,jsx,ts,tsx}'],
			plugins: { [pluginName]: plugin },
			languageOptions: {
				...(isTs ? { parser: tsParser } : {}),
				parserOptions: { ecmaFeatures: { jsx: true } },
			},
			rules: { [`${pluginName}/${rule}`]: ['error', ...options] },
		},
	];
}

function normalize(messages, pluginName) {
	return messages.map((m) => ({
		ruleId: m.ruleId && m.ruleId.replace(`${pluginName}/`, ''),
		severity: m.severity,
		line: m.line,
		column: m.column,
		endLine: m.endLine,
		endColumn: m.endColumn,
		message: m.message,
		messageId: m.messageId,
		fix: m.fix,
		suggestions: m.suggestions,
	}));
}

function run(rule, options, code, filename) {
	const linter = new Linter();
	const orig = linter.verify(
		code,
		configFor('orig', origPlugin, rule, options, filename),
		{
			filename,
		},
	);
	const ported = linter.verify(
		code,
		configFor('port', port, rule, options, filename),
		{
			filename,
		},
	);
	const origFixed = linter.verifyAndFix(
		code,
		configFor('orig', origPlugin, rule, options, filename),
		{ filename },
	);
	const portFixed = linter.verifyAndFix(
		code,
		configFor('port', port, rule, options, filename),
		{ filename },
	);
	return { orig, ported, origFixed, portFixed };
}

function expectIdentical(rule, options, code, filename) {
	const { orig, ported, origFixed, portFixed } = run(
		rule,
		options,
		code,
		filename,
	);
	expect(orig.every((m) => m.ruleId && !m.fatal)).toBe(true);
	expect(normalize(ported, 'port')).toEqual(normalize(orig, 'orig'));
	expect(portFixed.output).toBe(origFixed.output);
	expect(normalize(portFixed.messages, 'port')).toEqual(
		normalize(origFixed.messages, 'orig'),
	);
	return orig;
}

function collectGoldenKeys() {
	const keys = new Set();
	const visit = (value) => {
		if (typeof value === 'string') {
			const match = /^(.+?):\d+:\d+ react-native\//.exec(value);
			if (match) keys.add(match[1]);
		} else if (Array.isArray(value)) {
			value.forEach(visit);
		} else if (value && typeof value === 'object') {
			Object.values(value).forEach(visit);
		}
	};
	for (const profile of ['default', 'full']) {
		visit(
			JSON.parse(
				fs.readFileSync(
					path.join(projectRoot, 'bun-golden', `${profile}.json`),
					'utf8',
				),
			),
		);
	}
	return [...keys].sort();
}

const goldenFiles = collectGoldenKeys();

function goldenPositions() {
	const positions = new Set();
	for (const profile of ['default', 'full']) {
		const text = fs.readFileSync(
			path.join(projectRoot, 'bun-golden', `${profile}.json`),
			'utf8',
		);
		for (const match of text.matchAll(
			/"([^"]+?):(\d+):(\d+) react-native\/([a-z-]+) \d"/g,
		)) {
			positions.add(`${match[1]}:${match[2]}:${match[3]} ${match[4]}`);
		}
	}
	return [...positions].sort();
}
const RULES = [
	'no-unused-styles',
	'split-platform-components',
	'no-single-element-style-arrays',
	'no-inline-styles',
];

describe('react-native port exports', () => {
	test('exposes exactly the four ported rules', () => {
		expect(port.meta.name).toBe('react-native');
		expect(Object.keys(port.rules).sort()).toEqual([...RULES].sort());
		for (const rule of RULES) {
			expect(port.rules[rule].meta.fixable).toBe(
				original.rules[rule].meta.fixable,
			);
			expect(port.rules[rule].meta.schema).toEqual(
				original.rules[rule].meta.schema,
			);
		}
	});
});

describe('golden files match the original plugin', () => {
	test('golden data references react-native files', () => {
		expect(goldenFiles.length).toBeGreaterThan(0);
	});

	test('port reports every golden position', () => {
		const expected = goldenPositions();
		expect(expected.length).toBeGreaterThan(0);
		const actual = new Set();
		for (const file of goldenFiles) {
			const code = fs.readFileSync(path.join(projectRoot, file), 'utf8');
			for (const rule of RULES) {
				const { ported } = run(rule, [], code, file);
				for (const m of ported)
					actual.add(`${file}:${m.line}:${m.column} ${rule}`);
			}
		}
		for (const position of expected) expect(actual.has(position)).toBe(true);
	});

	for (const file of goldenFiles) {
		for (const rule of RULES) {
			test(`${rule} on ${file}`, () => {
				const code = fs.readFileSync(path.join(projectRoot, file), 'utf8');
				expectIdentical(rule, [], code, file);
			});
		}
	}
});

const jsx = (body) =>
	`import React from 'react';\nimport { View, Text, StyleSheet } from 'react-native';\n${body}\n`;

const cases = {
	'no-unused-styles': [
		{
			options: [],
			filename: 'a.js',
			code: jsx(
				`const styles = StyleSheet.create({ a: {}, b: {} });\nconst C = () => <View style={styles.a} />;`,
			),
			reports: 1,
		},
		{
			options: [],
			filename: 'a.js',
			code: jsx(
				`const styles = StyleSheet.create({ a: {} });\nconst C = () => <View style={styles.a} />;`,
			),
			reports: 0,
		},
		{
			options: [],
			filename: 'a.js',
			code: jsx(`const styles = StyleSheet.create({ a: {} });\nconst x = 1;`),
			reports: 0,
		},
		{
			options: [],
			filename: 'a.js',
			code: jsx(
				`const styles = StyleSheet.create({ a: {}, b: {}, ...rest });\nclass C extends React.Component { render() { return <View style={[styles.a, cond && styles.b]} />; } }`,
			),
			reports: 0,
		},
		{
			options: [],
			filename: 'a.tsx',
			code: jsx(
				`const styles = StyleSheet.create({ a: {}, b: { nested: { deep: 1 } } });\nfunction C(): JSX.Element { return <View style={styles.a} />; }`,
			),
			reports: 1,
		},
		{
			options: [],
			filename: 'a.js',
			code: jsx(
				`const s1 = StyleSheet.create({ a: {} });\nconst s2 = StyleSheet.create({ a: {}, z: {} });\nconst C = () => <View style={[s1.a, s2.a]} />;`,
			),
			reports: 1,
		},
		{
			options: [],
			filename: 'a.js',
			code: jsx(
				`const styles = StyleSheet.create({ 'quoted': {}, b: {} });\nconst C = () => { return <View style={styles.b} />; };`,
			),
			reports: 1,
		},
		{
			options: [],
			filename: 'a.js',
			code: jsx(
				`const styles = StyleSheet.create({ a: {} });\nconst C = () => <View style={styles.a.nested} />;`,
			),
			reports: 1,
		},
	],
	'split-platform-components': [
		{
			options: [],
			filename: 'foo.js',
			code: `import { ProgressBarAndroid } from 'react-native';`,
			reports: 1,
		},
		{
			options: [],
			filename: 'foo.android.js',
			code: `import { ProgressBarAndroid } from 'react-native';`,
			reports: 0,
		},
		{
			options: [],
			filename: 'foo.ios.js',
			code: `import { ActivityIndicatorIOS } from 'react-native';`,
			reports: 0,
		},
		{
			options: [],
			filename: 'foo.js',
			code: `import { ActivityIndicatorIOS, ProgressBarAndroid } from 'react-native';`,
			reports: 2,
		},
		{
			options: [],
			filename: 'foo.ios.js',
			code: `import { ActivityIndicatorIOS, ProgressBarAndroid } from 'react-native';`,
			reports: 1,
		},
		{
			options: [],
			filename: 'foo.tsx',
			code: `const { DatePickerIOS } = React;`,
			reports: 1,
		},
		{
			options: [],
			filename: 'foo.js',
			code: `import { View } from 'react-native';\nimport { SomeAndroid } from 'other';`,
			reports: 0,
		},
		{
			options: [
				{ iosPathRegex: '\\.ios\\.js$', androidPathRegex: '\\.droid\\.js$' },
			],
			filename: 'foo.droid.js',
			code: `import { ProgressBarAndroid } from 'react-native';`,
			reports: 0,
		},
		{
			options: [
				{ iosPathRegex: '\\.ios\\.js$', androidPathRegex: '\\.droid\\.js$' },
			],
			filename: 'foo.android.js',
			code: `import { ProgressBarAndroid } from 'react-native';`,
			reports: 1,
		},
		{
			options: [{ iosPathRegex: '\\.native-ios\\.tsx$' }],
			filename: 'x.native-ios.tsx',
			code: `import { PickerIOS } from 'react-native';`,
			reports: 0,
		},
	],
	'no-single-element-style-arrays': [
		{
			options: [],
			filename: 'a.js',
			code: jsx(`const C = () => <View style={[styles.a]} />;`),
			reports: 1,
		},
		{
			options: [],
			filename: 'a.js',
			code: jsx(`const C = () => <View style={[styles.a, styles.b]} />;`),
			reports: 0,
		},
		{
			options: [],
			filename: 'a.js',
			code: jsx(`const C = () => <View style={styles.a} />;`),
			reports: 0,
		},
		{
			options: [],
			filename: 'a.js',
			code: jsx(`const C = () => <View contentContainerStyle={[styles.a]} />;`),
			reports: 0,
		},
		{
			options: [],
			filename: 'a.tsx',
			code: jsx(
				`const C = () => <View style={[{ flex: 1 }]}><Text style={[cond ? a : b]} /></View>;`,
			),
			reports: 2,
		},
		{
			options: [],
			filename: 'a.js',
			code: jsx(`const C = () => <View style={[]} />;`),
			reports: 0,
		},
		{
			options: [],
			filename: 'a.js',
			code: jsx(`const C = () => <View style="x" />;`),
			reports: 0,
		},
	],
	'no-inline-styles': [
		{
			options: [],
			filename: 'a.js',
			code: jsx(`const C = () => <View style={{ flex: 1 }} />;`),
			reports: 1,
		},
		{
			options: [],
			filename: 'a.js',
			code: jsx(`const C = () => <View style={{ flex: n }} />;`),
			reports: 0,
		},
		{
			options: [],
			filename: 'a.js',
			code: jsx(`const C = () => <View style={[styles.a, { margin: -4 }]} />;`),
			reports: 1,
		},
		{
			options: [],
			filename: 'a.js',
			code: jsx(
				`const C = () => <View style={a ? { top: 1 } : { top: +2 }} />;`,
			),
			reports: 2,
		},
		{
			options: [],
			filename: 'a.js',
			code: jsx(`const C = () => <View style={a && { opacity: 0.5 }} />;`),
			reports: 1,
		},
		{
			options: [],
			filename: 'a.js',
			code: jsx(
				`const C = () => <View contentContainerStyle={{ padding: 2, color: x ? 'red' : y }} />;`,
			),
			reports: 1,
		},
		{
			options: [],
			filename: 'a.tsx',
			code: jsx(`const C = () => <View style={styles.a} />;`),
			reports: 0,
		},
		{
			options: [],
			filename: 'a.tsx',
			code: jsx(
				`const C = () => <View><Text style={[{ fontSize: 12 }, { color: 'red' }]} /></View>;`,
			),
			reports: 2,
		},
		{
			options: [],
			filename: 'a.js',
			code: jsx(
				`class C extends React.Component { render() { return <View style={{ flex: 1 }} />; } }`,
			),
			reports: 1,
		},
	],
};

for (const rule of RULES) {
	describe(`${rule} focused cases match the original plugin`, () => {
		cases[rule].forEach((testCase, index) => {
			test(`case ${index + 1} (${testCase.filename}, ${testCase.reports} reports)`, () => {
				const messages = expectIdentical(
					rule,
					testCase.options,
					testCase.code,
					testCase.filename,
				);
				expect(messages).toHaveLength(testCase.reports);
			});
		});
	});
}
