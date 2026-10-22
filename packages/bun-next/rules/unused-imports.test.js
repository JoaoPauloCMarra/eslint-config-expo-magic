const { describe, expect, test } = require('bun:test');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const { Linter } = require('eslint');
const tsParser = require('@typescript-eslint/parser');
const original = require('eslint-plugin-unused-imports');
const port = require('./unused-imports.js');

const root = path.resolve(__dirname, '../../..');
const testProject = path.join(root, 'test-project');
const react = createRequire(require.resolve('eslint-config-expo/package.json'))(
	'eslint-plugin-react',
);

function createConfig(plugin, name) {
	return [
		{
			files: ['**/*.{js,jsx,ts,tsx}'],
			languageOptions: {
				parser: tsParser,
				sourceType: 'module',
				parserOptions: { ecmaFeatures: { jsx: true } },
			},
			plugins: { react, [name]: plugin },
			rules: {
				'react/jsx-uses-vars': 'error',
				'react/jsx-uses-react': 'error',
				[`${name}/no-unused-imports`]: 'error',
			},
		},
	];
}

const origConfig = createConfig(original, 'orig');
const portConfig = createConfig(port, 'port');

function normalize(messages) {
	return messages
		.filter((message) =>
			/^(orig|port)\/no-unused-imports$/.test(message.ruleId),
		)
		.map((message) => ({
			ruleId: message.ruleId.replace(/^(orig|port)\//, ''),
			line: message.line,
			column: message.column,
			endLine: message.endLine,
			endColumn: message.endColumn,
			message: message.message,
			severity: message.severity,
			fix: message.fix,
		}));
}

function compare(code, filename) {
	const linter = new Linter();
	const expected = normalize(linter.verify(code, origConfig, { filename }));
	const actual = normalize(linter.verify(code, portConfig, { filename }));

	expect(actual).toEqual(expected);
	expect(linter.verifyAndFix(code, portConfig, { filename }).output).toBe(
		linter.verifyAndFix(code, origConfig, { filename }).output,
	);

	return actual;
}

const goldenFiles = [
	...new Set(
		['default', 'testing'].flatMap((profile) => {
			const text = fs.readFileSync(
				path.join(testProject, 'bun-golden', `${profile}.json`),
				'utf8',
			);

			return [
				...text.matchAll(
					/"([^"]+?):\d+:\d+ unused-imports\/no-unused-imports/g,
				),
			].map((match) => match[1]);
		}),
	),
].sort();

describe('unused-imports/no-unused-imports port', () => {
	test('golden data names fixture files', () => {
		expect(goldenFiles.length).toBeGreaterThan(0);
	});

	for (const file of goldenFiles) {
		test(`matches the original on test-project/${file}`, () => {
			const filename = path.join(testProject, file);
			const reports = compare(fs.readFileSync(filename, 'utf8'), filename);

			expect(reports.length).toBeGreaterThan(0);
		});
	}

	const cases = {
		'lone default import': ["import a from 'a';\n", 1],
		'lone namespace import': ["import * as ns from 'ns';\nconst x = 1;\n", 1],
		'one of several named specifiers (first)': [
			"import { a, b, c } from 'x';\nexport const v = [b, c];\n",
			1,
		],
		'one of several named specifiers (middle)': [
			"import { a, b, c } from 'x';\nexport const v = [a, c];\n",
			1,
		],
		'one of several named specifiers (last)': [
			"import { a, b, c } from 'x';\nexport const v = [a, b];\n",
			1,
		],
		'lone named specifier': ["import { a } from 'x';\n", 1],
		'default plus unused named': [
			"import d, { a } from 'x';\nexport const v = d;\n",
			1,
		],
		'default unused plus used named': [
			"import d, { a } from 'x';\nexport const v = a;\n",
			1,
		],
		'default plus namespace': [
			"import d, * as ns from 'x';\nexport const v = d;\n",
			1,
		],
		'side effect import kept': [
			"import 'side-effect';\nimport { a } from 'x';\n",
			1,
		],
		'import type declaration': [
			"import type { T } from 'x';\nexport const v = 1;\n",
			1,
		],
		'inline type specifier': [
			"import { type T, a } from 'x';\nexport const v = a;\n",
			1,
		],
		'inline type specifier used': [
			"import { type T, a } from 'x';\nexport const v: T = a;\n",
			0,
		],
		'aliased specifier': ["import { a as b } from 'x';\n", 1],
		'whole declaration with blank lines': [
			"import { a } from 'x';\n\n\nimport { b } from 'y';\nexport const v = b;\n",
			1,
		],
		'jsx element use': [
			"import { View } from 'rn';\nexport const A = () => <View />;\n",
			0,
		],
		'jsx member use': [
			"import * as UI from 'ui';\nexport const A = () => <UI.Card.Body />;\n",
			0,
		],
		'jsx lowercase tag is not a use': [
			"import { div } from 'rn';\nexport const A = () => <div />;\n",
			1,
		],
		'react pragma with jsx': [
			"import React from 'react';\nexport const A = () => <p />;\n",
			0,
		],
		'react unused without jsx': [
			"import React from 'react';\nexport const A = 1;\n",
			1,
		],
		'fragment pragma': [
			"import { Fragment } from 'react';\nexport const A = () => <></>;\n",
			0,
		],
		'jsx pragma comment': [
			"/** @jsx h */\nimport { h } from 'preact';\nexport const A = () => <p />;\n",
			0,
		],
		'type annotation use': [
			"import { T } from 'x';\nexport const v: T = null as never;\n",
			0,
		],
		'generic type argument use': [
			"import { T } from 'x';\nexport const v = [] as Array<T>;\n",
			0,
		],
		'qualified type use': [
			"import * as NS from 'x';\nexport const v: NS.Thing = null as never;\n",
			0,
		],
		'implements use': [
			"import { I } from 'x';\nexport class C implements I {}\n",
			0,
		],
		'interface extends use': [
			"import { I } from 'x';\nexport interface J extends I {}\n",
			0,
		],
		'typeof only use is not reported': [
			"import { v } from 'x';\nexport type T = typeof v;\n",
			0,
		],
		'typeof use of type import counts': [
			"import type { v } from 'x';\nexport type T = typeof v;\n",
			0,
		],
		'typeof plus value use': [
			"import { v } from 'x';\nexport type T = typeof v;\nexport const w = v;\n",
			0,
		],
		're-export specifier use': ["import { a } from 'x';\nexport { a };\n", 0],
		're-export aliased use': [
			"import { a } from 'x';\nexport { a as b };\n",
			0,
		],
		'export default use': ["import a from 'x';\nexport default a;\n", 0],
		'export from is not a use': [
			"import { a } from 'x';\nexport { a as b } from 'y';\n",
			1,
		],
		'shadowed by parameter': [
			"import { a } from 'x';\nexport const f = (a: number) => a;\n",
			1,
		],
		'shadowed by local const': [
			"import { a } from 'x';\nexport function f() {\n  const a = 1;\n  return a;\n}\n",
			1,
		],
		'shadowed jsx name': [
			"import { View } from 'rn';\nexport const A = (View: any) => <View />;\n",
			1,
		],
		'shadowed type parameter': [
			"import { T } from 'x';\nexport function f<T>(v: T) { return v; }\n",
			1,
		],
		'jsdoc link use': [
			"import { a } from 'x';\n/** {@link a} */\nexport const v = 1;\n",
			0,
		],
		'jsdoc param type use': [
			"import { a } from 'x';\n/** @param {a} v */\nexport const f = (v) => v;\n",
			0,
		],
		'used in value position': [
			"import { a, b } from 'x';\nexport const v = a();\n",
			1,
		],
		'multiline named specifiers': [
			"import {\n  a,\n  b,\n  c,\n} from 'x';\nexport const v = b;\n",
			2,
		],
		'unused import in typescript namespace': [
			"import { a } from 'x';\nnamespace N {\n  export const a = 1;\n}\nexport { N };\n",
			1,
		],
		'import equals is ignored': [
			"import fs = require('fs');\nexport const v = 1;\n",
			0,
		],
	};

	for (const [name, [code, count]] of Object.entries(cases)) {
		test(`focused: ${name}`, () => {
			const reports = compare(code, path.join(root, 'focused.tsx'));

			expect(reports.length).toBe(count);
		});
	}

	test('focused cases cover at least 12 scenarios', () => {
		expect(Object.keys(cases).length).toBeGreaterThanOrEqual(12);
	});
});
