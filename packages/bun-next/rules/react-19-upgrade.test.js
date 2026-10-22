const { describe, expect, test } = require('bun:test');
const fs = require('node:fs');
const path = require('node:path');
const { Linter } = require('eslint');
const tsParser = require('@typescript-eslint/parser');

const repoRoot = path.resolve(__dirname, '../../..');
const original = require(
	path.join(repoRoot, 'node_modules/eslint-plugin-react-19-upgrade'),
);
const port = require('./react-19-upgrade');

const RULES = [
	'no-default-props',
	'no-prop-types',
	'no-legacy-context',
	'no-string-refs',
	'no-factories',
];

function collectGoldenFiles(rule) {
	const golden = JSON.parse(
		fs.readFileSync(
			path.join(repoRoot, 'test-project/bun-golden/default.json'),
			'utf8',
		),
	);
	const files = new Set();
	const pattern = new RegExp(`^(.+):\\d+:\\d+ react-19-upgrade/${rule} \\d+$`);
	const walk = (value) => {
		if (typeof value === 'string') {
			const match = pattern.exec(value);
			if (match) files.add(match[1]);
		} else if (Array.isArray(value)) {
			value.forEach(walk);
		} else if (value && typeof value === 'object') {
			Object.keys(value).forEach((key) => {
				walk(key);
				walk(value[key]);
			});
		}
	};
	walk(golden);
	return [...files];
}

function createConfig(pluginName, plugin, rule, options) {
	return [
		{
			files: ['**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx'],
			plugins: { [pluginName]: plugin },
			languageOptions: {
				parser: tsParser,
				ecmaVersion: 'latest',
				sourceType: 'module',
				parserOptions: { ecmaFeatures: { jsx: true } },
			},
			linterOptions: { reportUnusedDisableDirectives: 'off' },
			rules: {
				[`${pluginName}/${rule}`]: options ? ['error', ...options] : 'error',
			},
		},
	];
}

function normalize(messages, pluginName) {
	return messages.map((message) => ({
		line: message.line,
		column: message.column,
		endLine: message.endLine,
		endColumn: message.endColumn,
		message: message.message,
		messageId: message.messageId,
		severity: message.severity,
		fix: message.fix,
		suggestions: message.suggestions,
		ruleId: message.ruleId && message.ruleId.replace(`${pluginName}/`, ''),
	}));
}

function compare(rule, code, filename, options) {
	const linter = new Linter();
	const origConfig = createConfig('orig', original, rule, options);
	const portConfig = createConfig('port', port, rule, options);
	const origMessages = normalize(
		linter.verify(code, origConfig, { filename }),
		'orig',
	);
	const portMessages = normalize(
		linter.verify(code, portConfig, { filename }),
		'port',
	);
	expect(portMessages).toEqual(origMessages);
	const origFixed = linter.verifyAndFix(code, origConfig, { filename });
	const portFixed = linter.verifyAndFix(code, portConfig, { filename });
	expect(portFixed.output).toBe(origFixed.output);
	expect(normalize(portFixed.messages, 'port')).toEqual(
		normalize(origFixed.messages, 'orig'),
	);
	return { messages: portMessages, output: portFixed.output };
}

const CASES = {
	'no-default-props': {
		invalid: [
			`function Button({ label }) { return <b>{label}</b>; }\nButton.defaultProps = { label: 'x' };`,
			`const Button = ({ label, size }) => <b>{label}{size}</b>;\nButton.defaultProps = { label: 'x', size: 2 };`,
			`const Button = ({ label: text, ...rest }) => <b {...rest}>{text}</b>;\nButton.defaultProps = { label: 'x', extra: 1 };`,
			`const Button = (props) => <b {...props} />;\nButton.defaultProps = { label: 'x' };`,
			`function Button({ a = 1 }) { return null; }\nButton.defaultProps = { 'a': 2, [k]: 3 };`,
			`const Impl = ({ a }) => null;\nconst Alias = Impl;\nAlias.defaultProps = { a: 1 };`,
			`function Button({ a }) { return null; }\nfoo = Button.defaultProps = { a: 1 };`,
		],
		valid: [
			`class Card extends React.Component { render() { return null; } }\nCard.defaultProps = { a: 1 };`,
			`const Card = class extends React.Component {};\nCard.defaultProps = { a: 1 };`,
			`function Button({ a = 1 }) { return null; }`,
			`Button.defaultProps = other;`,
		],
	},
	'no-prop-types': {
		invalid: [
			`import PropTypes from 'prop-types';\nimport { string, number } from 'prop-types';`,
			`const PropTypes = require('prop-types');`,
			`function Foo() { return null; }\nFoo.propTypes = { a: 1 };`,
			`class Foo extends React.Component { static propTypes = { a: 1 }; }`,
			`const Bar = class extends React.Component { static propTypes = {}; static 'propTypes' = {}; };`,
			`export default class extends React.Component { static propTypes = {}; }`,
		],
		valid: [
			`import x from 'other';`,
			`foo.propTypes = {};`,
			`Foo['propTypes'] = {};`,
			`class Foo { propTypes = {}; static other = 1; static [propTypes] = 2; }`,
		],
	},
	'no-legacy-context': {
		invalid: [
			`class A extends React.Component { static childContextTypes = {}; }`,
			`class A extends React.Component { static contextTypes = {}; }`,
			`class A extends React.Component { getChildContext() { return {}; } }`,
			`const A = class extends React.Component { contextTypes = {}; getChildContext() {} };`,
			`class A { static childContextTypes = {}; static contextTypes = {}; getChildContext() {} }`,
		],
		valid: [
			`class A extends React.Component { static contextType = Ctx; }`,
			`class A { render() { return null; } }`,
			`function A() {}`,
		],
	},
	'no-string-refs': {
		invalid: [
			`const a = <div ref="x" />;`,
			`const a = <div ref={'x'} />;`,
			`class A extends React.Component { render() { return <input ref="input" />; } }`,
			`const a = <Foo ref="a"><div ref={"b"} /></Foo>;`,
			`const a = <div ref='single' />;`,
		],
		valid: [
			`const a = <div ref={fn} />;`,
			`const a = <div ref={useRef()} />;`,
			`const a = <div ref />;`,
			`const a = <div ref={\`x\`} />;`,
			`const a = <div id="ref" />;`,
		],
	},
	'no-factories': {
		invalid: [
			`import { createFactory } from 'react';`,
			`import React, { createFactory as cf } from 'react';`,
			`const el = React.createFactory('div');`,
			`const el = require('react').createFactory('div');`,
			`const cf = React.createFactory;\nconst a = cf('div');\nconst b = cf('span');`,
			`const { createFactory } = React;\ncreateFactory('div');`,
			`const { createFactory: make = x } = require('react');\nmake('div');\nconst z = make;`,
			`function Factory() { return { render: function () { return null; } }; }`,
			`const Factory = () => { return { render: function () {} }; };`,
			`function Factory() { return { render() {} }; }`,
		],
		valid: [
			`import { useState } from 'react';`,
			`const cf = other.createFactory;\ncf('div');`,
			`React['createFactory']('div');`,
			`function factory() { return { render: function () {} }; }`,
			`function Factory() { return { render: () => null }; }`,
			`const { createFactory } = other;\ncreateFactory('div');`,
		],
	},
};

describe('react-19-upgrade port', () => {
	test('exports exactly the five ported rules', () => {
		expect(port.meta.name).toBe('react-19-upgrade');
		expect(Object.keys(port.rules).sort()).toEqual([...RULES].sort());
		for (const rule of RULES) {
			expect(port.rules[rule].meta).toEqual(original.rules[rule].meta);
		}
	});

	for (const rule of RULES) {
		describe(rule, () => {
			const goldenFiles = collectGoldenFiles(rule);

			test('golden data references at least one file', () => {
				expect(goldenFiles.length).toBeGreaterThan(0);
			});

			for (const file of goldenFiles) {
				test(`matches original on test-project/${file}`, () => {
					const code = fs.readFileSync(
						path.join(repoRoot, 'test-project', file),
						'utf8',
					);
					const { messages } = compare(rule, code, `test-project/${file}`);
					expect(messages.length).toBeGreaterThan(0);
				});
			}

			CASES[rule].invalid.forEach((code, index) => {
				for (const ext of ['tsx', 'js']) {
					test(`invalid case ${index} (.${ext}) matches original`, () => {
						const { messages } = compare(rule, code, `case.${ext}`);
						expect(messages.length).toBeGreaterThan(0);
					});
				}
			});

			CASES[rule].valid.forEach((code, index) => {
				test(`valid case ${index} matches original`, () => {
					const { messages } = compare(rule, code, 'case.tsx');
					expect(messages).toEqual([]);
				});
			});
		});
	}
});
