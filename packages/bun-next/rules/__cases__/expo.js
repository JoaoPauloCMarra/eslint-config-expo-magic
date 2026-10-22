// Cases for the expo port, recorded against eslint-plugin-expo 1.1.0 with
// scripts/record-port-expectations.js.

const fs = require('node:fs');
const path = require('node:path');

const fixtureDir = path.resolve(__dirname, '../../../../test-project');

const focused = {
	'use-dom-exports': [
		['valid default function', `'use dom';\nexport default function A() { return null; }\n`, 'a.tsx'],
		['valid default arrow', `'use dom';\nexport default () => null;\n`, 'a.tsx'],
		['valid default identifier', `'use dom';\nconst A = () => null;\nexport default A;\n`, 'a.tsx'],
		[
			'valid type exports allowed',
			`'use dom';\nexport interface P {}\nexport type T = string;\nexport default function A() { return null; }\n`,
			'a.tsx',
		],
		['valid no directive', `export const a = 1;\n`, 'a.tsx'],
		['valid export default specifier', `'use dom';\nconst A = () => null;\nexport { A as default };\n`, 'a.tsx'],
		['invalid named export', `'use dom';\nexport const a = 1;\nexport default function A() { return null; }\n`, 'a.tsx'],
		['invalid async default', `'use dom';\nexport default async function A() { return null; }\n`, 'a.tsx'],
		['invalid class default', `'use dom';\nexport default class A {}\n`, 'a.tsx'],
		['invalid literal default', `'use dom';\nexport default 5;\n`, 'a.tsx'],
		['invalid missing default', `'use dom';\nconst a = 1;\n`, 'a.tsx'],
		[
			'invalid two defaults via specifiers',
			`'use dom';\nconst A = 1;\nexport { A as default };\nexport { default } from './x';\n`,
			'a.tsx',
		],
		['invalid default with other specifier', `'use dom';\nconst A = 1, b = 2;\nexport { A as default, b };\n`, 'a.tsx'],
		[
			'invalid export all as default twice',
			`'use dom';\nexport * as default from './x';\nexport * as default2 from './y';\nexport default function A() {}\n`,
			'a.ts',
		],
		['invalid export all with default', `'use dom';\nexport * from './x';\n`, 'a.ts'],
	],
	'no-env-var-destructuring': [
		['valid member access', `const a = process.env.EXPO_PUBLIC_A;\n`, 'a.ts'],
		['valid destructure other object', `const { a } = obj.env;\n`, 'a.ts'],
		['valid destructure env alias', `const { a } = env;\n`, 'a.ts'],
		['invalid destructure', `const { EXPO_PUBLIC_A } = process.env;\n`, 'a.ts'],
		['invalid destructure multiple', `const { A, B: b, C = 1 } = process.env;\n`, 'a.ts'],
		['invalid rest', `const { A, ...rest } = process.env;\n`, 'a.ts'],
		['invalid nested pattern', `const { A: { b } } = process.env;\n`, 'a.tsx'],
	],
	'no-dynamic-env-var': [
		['valid static member', `const a = process.env.EXPO_PUBLIC_A;\n`, 'a.ts'],
		['valid computed non-env', `const a = obj[key];\n`, 'a.ts'],
		['valid whole env', `const e = process.env;\n`, 'a.ts'],
		['invalid computed identifier', `const key = 'A';\nconst a = process.env[key];\n`, 'a.ts'],
		['invalid computed literal', `const a = process.env['EXPO_PUBLIC_A'];\n`, 'a.ts'],
		['invalid computed template', 'const a = process.env[`EXPO_${x}`];\n', 'a.ts'],
		['invalid computed numeric', `const a = process.env[0];\n`, 'a.ts'],
		['invalid computed expression', `const a = process.env[a + b];\n`, 'a.tsx'],
		['not flagged outside declarator', `foo(process.env[key]);\n`, 'a.ts'],
	],
	'prefer-box-shadow': [
		['valid boxShadow', `const s = StyleSheet.create({ a: { boxShadow: '0 1px 2px red' } });\n`, 'a.tsx'],
		['valid computed key', `const k = 'shadowColor';\nconst s = { [k]: 'red' };\n`, 'a.ts'],
		['valid string key', `const s = { 'shadowColor': 'red' };\n`, 'a.ts'],
		['valid spread', `const s = { ...shadow };\n`, 'a.ts'],
		[
			'invalid StyleSheet.create',
			`const s = StyleSheet.create({ a: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 1, shadowRadius: 2, elevation: 3 } });\n`,
			'a.tsx',
		],
		['invalid inline style', `const el = <View style={{ elevation: 4 }} />;\n`, 'a.tsx'],
		['invalid shorthand', `const shadowRadius = 2;\nconst s = { shadowRadius };\n`, 'a.ts'],
		['invalid method key', `const s = { elevation() { return 1; } };\n`, 'a.ts'],
		['invalid nested offset object', `const s = { shadowOffset: { shadowColor: 'x' } };\n`, 'a.ts'],
	],
};

// test-project files where the golden data reports expo rules.
const fixtureFiles = [
	'App.tsx',
	'components/GeneralAdvanced.tsx',
	'preset-fixtures/base-only.ts',
	'test.web.tsx',
];

const cases = [
	...Object.entries(focused).flatMap(([rule, entries]) =>
		entries.map(([title, code, filename]) => ({
			name: `${rule}: ${title}`,
			rule,
			code,
			filename,
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

function loadOriginalPlugin() {
	const configExpoDir = path.dirname(
		require.resolve('eslint-config-expo/package.json', { paths: [fixtureDir] }),
	);

	return require(require.resolve('eslint-plugin-expo', { paths: [configExpoDir] }));
}

module.exports = { cases, loadOriginalPlugin };
