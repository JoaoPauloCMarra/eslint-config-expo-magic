// Cases for the unused-imports port, recorded against eslint-plugin-unused-imports
// with scripts/record-port-expectations.js.

const fs = require('node:fs');
const { createRequire } = require('node:module');
const path = require('node:path');

const root = path.resolve(__dirname, '../../../..');
const testProject = path.join(root, 'test-project');

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

const focused = {
	'lone default import': "import a from 'a';\n",
	'lone namespace import': "import * as ns from 'ns';\nconst x = 1;\n",
	'one of several named specifiers (first)':
		"import { a, b, c } from 'x';\nexport const v = [b, c];\n",
	'one of several named specifiers (middle)':
		"import { a, b, c } from 'x';\nexport const v = [a, c];\n",
	'one of several named specifiers (last)':
		"import { a, b, c } from 'x';\nexport const v = [a, b];\n",
	'lone named specifier': "import { a } from 'x';\n",
	'default plus unused named': "import d, { a } from 'x';\nexport const v = d;\n",
	'default unused plus used named':
		"import d, { a } from 'x';\nexport const v = a;\n",
	'default plus namespace':
		"import d, * as ns from 'x';\nexport const v = d;\n",
	'side effect import kept': "import 'side-effect';\nimport { a } from 'x';\n",
	'import type declaration':
		"import type { T } from 'x';\nexport const v = 1;\n",
	'inline type specifier':
		"import { type T, a } from 'x';\nexport const v = a;\n",
	'inline type specifier used':
		"import { type T, a } from 'x';\nexport const v: T = a;\n",
	'aliased specifier': "import { a as b } from 'x';\n",
	'whole declaration with blank lines':
		"import { a } from 'x';\n\n\nimport { b } from 'y';\nexport const v = b;\n",
	'jsx element use':
		"import { View } from 'rn';\nexport const A = () => <View />;\n",
	'jsx member use':
		"import * as UI from 'ui';\nexport const A = () => <UI.Card.Body />;\n",
	'jsx lowercase tag is not a use':
		"import { div } from 'rn';\nexport const A = () => <div />;\n",
	'react pragma with jsx':
		"import React from 'react';\nexport const A = () => <p />;\n",
	'react unused without jsx': "import React from 'react';\nexport const A = 1;\n",
	'fragment pragma':
		"import { Fragment } from 'react';\nexport const A = () => <></>;\n",
	'jsx pragma comment':
		"/** @jsx h */\nimport { h } from 'preact';\nexport const A = () => <p />;\n",
	'type annotation use':
		"import { T } from 'x';\nexport const v: T = null as never;\n",
	'generic type argument use':
		"import { T } from 'x';\nexport const v = [] as Array<T>;\n",
	'qualified type use':
		"import * as NS from 'x';\nexport const v: NS.Thing = null as never;\n",
	'implements use': "import { I } from 'x';\nexport class C implements I {}\n",
	'interface extends use':
		"import { I } from 'x';\nexport interface J extends I {}\n",
	'typeof only use is not reported':
		"import { v } from 'x';\nexport type T = typeof v;\n",
	'typeof use of type import counts':
		"import type { v } from 'x';\nexport type T = typeof v;\n",
	'typeof plus value use':
		"import { v } from 'x';\nexport type T = typeof v;\nexport const w = v;\n",
	're-export specifier use': "import { a } from 'x';\nexport { a };\n",
	're-export aliased use': "import { a } from 'x';\nexport { a as b };\n",
	'export default use': "import a from 'x';\nexport default a;\n",
	'export from is not a use':
		"import { a } from 'x';\nexport { a as b } from 'y';\n",
	'shadowed by parameter':
		"import { a } from 'x';\nexport const f = (a: number) => a;\n",
	'shadowed by local const':
		"import { a } from 'x';\nexport function f() {\n  const a = 1;\n  return a;\n}\n",
	'shadowed jsx name':
		"import { View } from 'rn';\nexport const A = (View: any) => <View />;\n",
	'shadowed type parameter':
		"import { T } from 'x';\nexport function f<T>(v: T) { return v; }\n",
	'jsdoc link use':
		"import { a } from 'x';\n/** {@link a} */\nexport const v = 1;\n",
	'jsdoc param type use':
		"import { a } from 'x';\n/** @param {a} v */\nexport const f = (v) => v;\n",
	'used in value position':
		"import { a, b } from 'x';\nexport const v = a();\n",
	'multiline named specifiers':
		"import {\n  a,\n  b,\n  c,\n} from 'x';\nexport const v = b;\n",
	'unused import in typescript namespace':
		"import { a } from 'x';\nnamespace N {\n  export const a = 1;\n}\nexport { N };\n",
	'import equals is ignored':
		"import fs = require('fs');\nexport const v = 1;\n",
};

const rule = 'no-unused-imports';

const cases = [
	...goldenFiles.map((file) => ({
		name: `${rule}: test-project/${file}`,
		rule,
		code: fs.readFileSync(path.join(testProject, file), 'utf8'),
		filename: file,
	})),
	...Object.entries(focused).map(([title, code]) => ({
		name: `${rule}: focused: ${title}`,
		rule,
		code,
		filename: 'focused.tsx',
	})),
];

function loadOriginalPlugin() {
	return require('eslint-plugin-unused-imports');
}

// The original only sees JSX pragma and Fragment uses through these rules;
// the port detects them itself.
function loadOriginalConfig() {
	const react = createRequire(
		require.resolve('eslint-config-expo/package.json'),
	)('eslint-plugin-react');

	return {
		plugins: { react },
		rules: { 'react/jsx-uses-vars': 'error', 'react/jsx-uses-react': 'error' },
	};
}

module.exports = { cases, loadOriginalPlugin, loadOriginalConfig };
