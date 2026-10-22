const { describe, expect, test } = require('bun:test');
const fs = require('node:fs');
const path = require('node:path');
const { Linter } = require('eslint');
const tsParser = require('@typescript-eslint/parser');

const port = require('./expo.js');

const repoRoot = path.resolve(__dirname, '../../..');
const configExpoDir = path.dirname(
	require.resolve('eslint-config-expo/package.json', { paths: [repoRoot] }),
);
const original = require(
	require.resolve('eslint-plugin-expo', { paths: [configExpoDir] }),
);

const ruleNames = Object.keys(port.rules);

function lint(plugin, prefix, ruleName, code, filename, fix) {
	const linter = new Linter({ configType: 'flat' });
	const isTs = /\.(ts|tsx|mts|cts)$/.test(filename);
	const config = [
		{
			files: ['**/*.{js,jsx,ts,tsx,mts,cts}'],
			plugins: { [prefix]: plugin },
			languageOptions: isTs
				? { parser: tsParser, parserOptions: { ecmaFeatures: { jsx: true } } }
				: {
						ecmaVersion: 'latest',
						sourceType: 'module',
						parserOptions: { ecmaFeatures: { jsx: true } },
					},
			rules: { [`${prefix}/${ruleName}`]: 'error' },
		},
	];
	if (fix) {
		const out = linter.verifyAndFix(code, config, { filename });
		return {
			output: out.output,
			fixed: out.fixed,
			messages: normalize(out.messages, prefix),
		};
	}
	return normalize(linter.verify(code, config, { filename }), prefix);
}

function normalize(messages, prefix) {
	return messages.map((m) => ({
		ruleId:
			m.ruleId && m.ruleId.startsWith(`${prefix}/`)
				? m.ruleId.slice(prefix.length + 1)
				: m.ruleId,
		line: m.line,
		column: m.column,
		endLine: m.endLine,
		endColumn: m.endColumn,
		message: m.message,
		messageId: m.messageId,
		severity: m.severity,
		fix: m.fix,
		suggestions: m.suggestions,
		fatal: m.fatal,
	}));
}

function compare(ruleName, code, filename) {
	const a = lint(original, 'orig', ruleName, code, filename, false);
	const b = lint(port, 'port', ruleName, code, filename, false);
	expect(b).toEqual(a);
	const fa = lint(original, 'orig', ruleName, code, filename, true);
	const fb = lint(port, 'port', ruleName, code, filename, true);
	expect(fb).toEqual(fa);
	return a;
}

function goldenFiles() {
	const files = new Set();
	for (const profile of ['default', 'full']) {
		const json = JSON.parse(
			fs.readFileSync(
				path.join(repoRoot, 'test-project/bun-golden', `${profile}.json`),
				'utf8',
			),
		);
		const walk = (value) => {
			if (typeof value === 'string') {
				const m = /^(.+?):\d+:\d+ expo\/[\w-]+ \d+$/.exec(value);
				if (m) files.add(m[1]);
			} else if (Array.isArray(value)) value.forEach(walk);
			else if (value && typeof value === 'object')
				Object.values(value).forEach(walk);
		};
		walk(json);
	}
	return [...files].sort();
}

describe('meta', () => {
	test('exposes exactly the four expo rules', () => {
		expect(port.meta).toEqual({ name: 'expo' });
		expect(ruleNames.sort()).toEqual([
			'no-dynamic-env-var',
			'no-env-var-destructuring',
			'prefer-box-shadow',
			'use-dom-exports',
		]);
	});

	for (const name of ruleNames) {
		test(`${name} meta matches the original`, () => {
			expect(port.rules[name].meta).toEqual(original.rules[name].meta);
			expect(port.rules[name].defaultOptions).toEqual(
				original.rules[name].defaultOptions,
			);
		});
	}
});

describe('golden fixtures', () => {
	const files = goldenFiles();

	test('golden data references expo rule files', () => {
		expect(files.length).toBeGreaterThan(0);
	});

	for (const file of files) {
		for (const name of ruleNames) {
			test(`${file} / ${name}`, () => {
				const filename = path.join(repoRoot, 'test-project', file);
				const code = fs.readFileSync(filename, 'utf8');
				compare(name, code, filename);
			});
		}
	}

	test('every rule reports on its golden fixtures', () => {
		const seen = new Set();
		for (const file of files) {
			const filename = path.join(repoRoot, 'test-project', file);
			const code = fs.readFileSync(filename, 'utf8');
			for (const name of ruleNames) {
				const messages = lint(port, 'port', name, code, filename, false);
				expect(messages.every((m) => m.ruleId === name)).toBe(true);
				if (messages.length > 0) seen.add(name);
			}
		}
		expect([...seen].sort()).toEqual([...ruleNames].sort());
	});
});

const cases = {
	'use-dom-exports': [
		[
			'valid default function',
			`'use dom';\nexport default function A() { return null; }\n`,
			'a.tsx',
			0,
		],
		[
			'valid default arrow',
			`'use dom';\nexport default () => null;\n`,
			'a.tsx',
			0,
		],
		[
			'valid default identifier',
			`'use dom';\nconst A = () => null;\nexport default A;\n`,
			'a.tsx',
			0,
		],
		[
			'valid type exports allowed',
			`'use dom';\nexport interface P {}\nexport type T = string;\nexport default function A() { return null; }\n`,
			'a.tsx',
			0,
		],
		['valid no directive', `export const a = 1;\n`, 'a.tsx', 0],
		[
			'valid export default specifier',
			`'use dom';\nconst A = () => null;\nexport { A as default };\n`,
			'a.tsx',
			0,
		],
		[
			'invalid named export',
			`'use dom';\nexport const a = 1;\nexport default function A() { return null; }\n`,
			'a.tsx',
			1,
		],
		[
			'invalid async default',
			`'use dom';\nexport default async function A() { return null; }\n`,
			'a.tsx',
			1,
		],
		[
			'invalid class default',
			`'use dom';\nexport default class A {}\n`,
			'a.tsx',
			1,
		],
		['invalid literal default', `'use dom';\nexport default 5;\n`, 'a.tsx', 1],
		['invalid missing default', `'use dom';\nconst a = 1;\n`, 'a.tsx', 1],
		[
			'invalid two defaults via specifiers',
			`'use dom';\nconst A = 1;\nexport { A as default };\nexport { default } from './x';\n`,
			'a.tsx',
			1,
		],
		[
			'invalid default with other specifier',
			`'use dom';\nconst A = 1, b = 2;\nexport { A as default, b };\n`,
			'a.tsx',
			1,
		],
		[
			'invalid export all as default twice',
			`'use dom';\nexport * as default from './x';\nexport * as default2 from './y';\nexport default function A() {}\n`,
			'a.ts',
			1,
		],
		[
			'invalid export all with default',
			`'use dom';\nexport * from './x';\n`,
			'a.ts',
			1,
		],
	],
	'no-env-var-destructuring': [
		[
			'valid member access',
			`const a = process.env.EXPO_PUBLIC_A;\n`,
			'a.ts',
			0,
		],
		['valid destructure other object', `const { a } = obj.env;\n`, 'a.ts', 0],
		['valid destructure env alias', `const { a } = env;\n`, 'a.ts', 0],
		[
			'invalid destructure',
			`const { EXPO_PUBLIC_A } = process.env;\n`,
			'a.ts',
			1,
		],
		[
			'invalid destructure multiple',
			`const { A, B: b, C = 1 } = process.env;\n`,
			'a.ts',
			3,
		],
		['invalid rest', `const { A, ...rest } = process.env;\n`, 'a.ts', 2],
		[
			'invalid nested pattern',
			`const { A: { b } } = process.env;\n`,
			'a.tsx',
			1,
		],
	],
	'no-dynamic-env-var': [
		[
			'valid static member',
			`const a = process.env.EXPO_PUBLIC_A;\n`,
			'a.ts',
			0,
		],
		['valid computed non-env', `const a = obj[key];\n`, 'a.ts', 0],
		['valid whole env', `const e = process.env;\n`, 'a.ts', 0],
		[
			'invalid computed identifier',
			`const key = 'A';\nconst a = process.env[key];\n`,
			'a.ts',
			1,
		],
		[
			'invalid computed literal',
			`const a = process.env['EXPO_PUBLIC_A'];\n`,
			'a.ts',
			1,
		],
		[
			'invalid computed template',
			'const a = process.env[`EXPO_${x}`];\n',
			'a.ts',
			1,
		],
		['invalid computed numeric', `const a = process.env[0];\n`, 'a.ts', 1],
		[
			'invalid computed expression',
			`const a = process.env[a + b];\n`,
			'a.tsx',
			1,
		],
		['not flagged outside declarator', `foo(process.env[key]);\n`, 'a.ts', 0],
	],
	'prefer-box-shadow': [
		[
			'valid boxShadow',
			`const s = StyleSheet.create({ a: { boxShadow: '0 1px 2px red' } });\n`,
			'a.tsx',
			0,
		],
		[
			'valid computed key',
			`const k = 'shadowColor';\nconst s = { [k]: 'red' };\n`,
			'a.ts',
			0,
		],
		['valid string key', `const s = { 'shadowColor': 'red' };\n`, 'a.ts', 0],
		['valid spread', `const s = { ...shadow };\n`, 'a.ts', 0],
		[
			'invalid StyleSheet.create',
			`const s = StyleSheet.create({ a: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 1, shadowRadius: 2, elevation: 3 } });\n`,
			'a.tsx',
			5,
		],
		[
			'invalid inline style',
			`const el = <View style={{ elevation: 4 }} />;\n`,
			'a.tsx',
			1,
		],
		[
			'invalid shorthand',
			`const shadowRadius = 2;\nconst s = { shadowRadius };\n`,
			'a.ts',
			1,
		],
		[
			'invalid method key',
			`const s = { elevation() { return 1; } };\n`,
			'a.ts',
			1,
		],
		[
			'invalid nested offset object',
			`const s = { shadowOffset: { shadowColor: 'x' } };\n`,
			'a.ts',
			2,
		],
	],
};

for (const name of ruleNames) {
	describe(`${name} focused cases`, () => {
		for (const [title, code, filename, expected] of cases[name]) {
			test(title, () => {
				const result = compare(
					name,
					code,
					path.join(repoRoot, 'test-project', filename),
				);
				expect(result.map((m) => m.ruleId)).toEqual(Array(expected).fill(name));
				expect(result.length).toBe(expected);
			});
		}
	});
}
