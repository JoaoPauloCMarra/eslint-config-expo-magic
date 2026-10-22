// Cases for the react-19-upgrade port, recorded against
// eslint-plugin-react-19-upgrade with scripts/record-port-expectations.js.

const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '../../../..');
const fixtureDir = path.join(repoRoot, 'test-project');

const focused = {
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
		files: ['App.tsx'],
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
		files: ['App.tsx'],
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
		files: ['App.tsx'],
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
		files: ['App.tsx', 'components/ReactAdvanced.tsx'],
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
		files: ['App.tsx', 'components/ReactAdvanced.tsx'],
	},
};

const brokenFix = {
	reason:
		'The original rewrites `foo = Button.defaultProps = {...}` to `foo = ;`. Bun skips a fix whose result does not parse.',
	output: 'source',
};
const divergences = {
	'no-default-props: invalid 6 (.tsx)': brokenFix,
	'no-default-props: invalid 6 (.js)': brokenFix,
};
// Two `static propTypes` members are a TypeScript error; Bun reports the
// parse error, typescript-eslint parses on. The .js variant keeps the case.
const skipped = new Set(['no-prop-types: invalid 4 (.tsx)']);

const allCases = Object.entries(focused).flatMap(([rule, entry]) => [
	...entry.files.map((file) => ({
		name: `${rule}: test-project/${file}`,
		rule,
		code: fs.readFileSync(path.join(fixtureDir, file), 'utf8'),
		filename: file,
	})),
	...entry.invalid.flatMap((code, index) =>
		['tsx', 'js'].map((ext) => ({
			name: `${rule}: invalid ${index} (.${ext})`,
			rule,
			code,
			filename: `case.${ext}`,
		})),
	),
	...entry.valid.map((code, index) => ({
		name: `${rule}: valid ${index}`,
		rule,
		code,
		filename: 'case.tsx',
	})),
]);

const cases = allCases
	.filter((testCase) => !skipped.has(testCase.name))
	.map((testCase) =>
		divergences[testCase.name]
			? { ...testCase, divergence: divergences[testCase.name] }
			: testCase,
	);

function loadOriginalPlugin() {
	return require(path.join(repoRoot, 'node_modules/eslint-plugin-react-19-upgrade'));
}

module.exports = { cases, loadOriginalPlugin };
