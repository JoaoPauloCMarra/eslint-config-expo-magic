// Cases for the react-native port, recorded against eslint-plugin-react-native
// with scripts/record-port-expectations.js.

const fs = require('node:fs');
const path = require('node:path');

const fixtureDir = path.resolve(__dirname, '../../../../test-project');

const jsx = (body) =>
	`import React from 'react';\nimport { View, Text, StyleSheet } from 'react-native';\n${body}\n`;

const droidOptions = [{ iosPathRegex: '\\.ios\\.js$', androidPathRegex: '\\.droid\\.js$' }];

// [title, filename, code, options?]
const focused = {
	'no-unused-styles': [
		[
			'unused style b',
			'a.js',
			jsx(`const styles = StyleSheet.create({ a: {}, b: {} });\nconst C = () => <View style={styles.a} />;`),
		],
		[
			'all styles used',
			'a.js',
			jsx(`const styles = StyleSheet.create({ a: {} });\nconst C = () => <View style={styles.a} />;`),
		],
		['stylesheet never referenced', 'a.js', jsx(`const styles = StyleSheet.create({ a: {} });\nconst x = 1;`)],
		[
			'spread and class component',
			'a.js',
			jsx(
				`const styles = StyleSheet.create({ a: {}, b: {}, ...rest });\nclass C extends React.Component { render() { return <View style={[styles.a, cond && styles.b]} />; } }`,
			),
		],
		[
			'typescript nested object',
			'a.tsx',
			jsx(
				`const styles = StyleSheet.create({ a: {}, b: { nested: { deep: 1 } } });\nfunction C(): JSX.Element { return <View style={styles.a} />; }`,
			),
		],
		[
			'two stylesheets',
			'a.js',
			jsx(
				`const s1 = StyleSheet.create({ a: {} });\nconst s2 = StyleSheet.create({ a: {}, z: {} });\nconst C = () => <View style={[s1.a, s2.a]} />;`,
			),
		],
		[
			'quoted key',
			'a.js',
			jsx(
				`const styles = StyleSheet.create({ 'quoted': {}, b: {} });\nconst C = () => { return <View style={styles.b} />; };`,
			),
		],
		[
			'nested member access',
			'a.js',
			jsx(`const styles = StyleSheet.create({ a: {} });\nconst C = () => <View style={styles.a.nested} />;`),
		],
	],
	'split-platform-components': [
		['android component in shared file', 'foo.js', `import { ProgressBarAndroid } from 'react-native';`],
		['android component in android file', 'foo.android.js', `import { ProgressBarAndroid } from 'react-native';`],
		['ios component in ios file', 'foo.ios.js', `import { ActivityIndicatorIOS } from 'react-native';`],
		[
			'both components in shared file',
			'foo.js',
			`import { ActivityIndicatorIOS, ProgressBarAndroid } from 'react-native';`,
		],
		[
			'both components in ios file',
			'foo.ios.js',
			`import { ActivityIndicatorIOS, ProgressBarAndroid } from 'react-native';`,
		],
		['destructured from React', 'foo.tsx', `const { DatePickerIOS } = React;`],
		[
			'other module and non-platform import',
			'foo.js',
			`import { View } from 'react-native';\nimport { SomeAndroid } from 'other';`,
		],
		[
			'custom android regex matches',
			'foo.droid.js',
			`import { ProgressBarAndroid } from 'react-native';`,
			droidOptions,
		],
		[
			'custom android regex rejects default',
			'foo.android.js',
			`import { ProgressBarAndroid } from 'react-native';`,
			droidOptions,
		],
		[
			'custom ios regex only',
			'x.native-ios.tsx',
			`import { PickerIOS } from 'react-native';`,
			[{ iosPathRegex: '\\.native-ios\\.tsx$' }],
		],
	],
	'no-single-element-style-arrays': [
		['single element', 'a.js', jsx(`const C = () => <View style={[styles.a]} />;`)],
		['two elements', 'a.js', jsx(`const C = () => <View style={[styles.a, styles.b]} />;`)],
		['not an array', 'a.js', jsx(`const C = () => <View style={styles.a} />;`)],
		['other style prop', 'a.js', jsx(`const C = () => <View contentContainerStyle={[styles.a]} />;`)],
		[
			'two single-element arrays',
			'a.tsx',
			jsx(`const C = () => <View style={[{ flex: 1 }]}><Text style={[cond ? a : b]} /></View>;`),
		],
		['empty array', 'a.js', jsx(`const C = () => <View style={[]} />;`)],
		['string style', 'a.js', jsx(`const C = () => <View style="x" />;`)],
	],
	'no-inline-styles': [
		['literal value', 'a.js', jsx(`const C = () => <View style={{ flex: 1 }} />;`)],
		['variable value', 'a.js', jsx(`const C = () => <View style={{ flex: n }} />;`)],
		['negative number in array', 'a.js', jsx(`const C = () => <View style={[styles.a, { margin: -4 }]} />;`)],
		['conditional objects', 'a.js', jsx(`const C = () => <View style={a ? { top: 1 } : { top: +2 }} />;`)],
		['logical and', 'a.js', jsx(`const C = () => <View style={a && { opacity: 0.5 }} />;`)],
		[
			'content container with ternary',
			'a.js',
			jsx(`const C = () => <View contentContainerStyle={{ padding: 2, color: x ? 'red' : y }} />;`),
		],
		['style reference', 'a.tsx', jsx(`const C = () => <View style={styles.a} />;`)],
		[
			'array of inline objects',
			'a.tsx',
			jsx(`const C = () => <View><Text style={[{ fontSize: 12 }, { color: 'red' }]} /></View>;`),
		],
		[
			'class component',
			'a.js',
			jsx(`class C extends React.Component { render() { return <View style={{ flex: 1 }} />; } }`),
		],
	],
};

// test-project files where the golden data reports react-native rules.
const fixtureFiles = ['App.tsx', 'components/ReactAdvanced.tsx', 'components/SimplePaginatedPeopleList.tsx'];

const cases = [
	...Object.entries(focused).flatMap(([rule, entries]) =>
		entries.map(([title, filename, code, options], index) => ({
			name: `${rule}: ${index + 1} ${title}`,
			rule,
			code,
			filename,
			...(options ? { options } : {}),
		})),
	),
	...fixtureFiles.flatMap((file) =>
		Object.keys(focused).map((rule) => ({
			name: `${rule}: test-project/${file}`,
			rule,
			code: fs.readFileSync(path.join(fixtureDir, file), 'utf8'),
			filename: file,
		})),
	),
];

// The original plugin predates ESLint 9 and calls the legacy context API.
function legacyContext(context) {
	return new Proxy(Object.create(null), {
		get(_empty, key) {
			if (key === 'getSourceCode') return () => context.sourceCode;
			if (key === 'getFilename') return () => context.filename;
			if (key === 'report') {
				return (first, second, third) => {
					if (typeof second === 'string') {
						context.report({
							node: first,
							message: second,
							...(third ? { data: third } : {}),
						});
					} else {
						context.report(first);
					}
				};
			}
			const value = context[key];
			return typeof value === 'function' ? value.bind(context) : value;
		},
	});
}

function loadOriginalPlugin() {
	const original = require('eslint-plugin-react-native');

	return {
		rules: Object.fromEntries(
			Object.entries(original.rules).map(([name, rule]) => [
				name,
				{ meta: rule.meta, create: (context) => rule.create(legacyContext(context)) },
			]),
		),
	};
}

module.exports = { cases, loadOriginalPlugin };
