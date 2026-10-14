import { describe, it } from 'bun:test';
import type { Rule } from 'eslint';

const eslint: typeof import('eslint') = require('eslint');
const tsParser: typeof import('@typescript-eslint/parser') = require('@typescript-eslint/parser');
const rule: Rule.RuleModule = require('./no-inline-props.js');

const { RuleTester } = eslint;

RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it;

const ruleTester = new RuleTester({
	languageOptions: {
		parser: tsParser,
		parserOptions: {
			sourceType: 'module',
			ecmaFeatures: { jsx: true },
		},
	},
});

ruleTester.run('no-inline-props', rule, {
	valid: [
		'type FooProps = { a: string };\nconst Foo = ({ a }: FooProps) => a;',
		'function Foo(value: { a: string }) { return value; }',
		'function parse({ a }: { a: string }) { return a; }',
		'const toLabel = ({ a }: { a: string }) => a;',
		'type FooProps = { a: string };\nconst Foo = (props: FooProps = { a: "" }) => props;',
		'const Foo = ({ a }) => a;',
	],
	invalid: [
		{
			code: 'const Foo = ({ a }: { a: string }) => a;',
			output: 'type FooProps = { a: string };\n\nconst Foo = ({ a }: FooProps) => a;',
			errors: [{ messageId: 'inline' }],
		},
		{
			code: 'function Foo({ a }: { a: string }) { return a; }',
			output:
				'type FooProps = { a: string };\n\nfunction Foo({ a }: FooProps) { return a; }',
			errors: [{ messageId: 'inline' }],
		},
		{
			code: 'const Foo = memo(({ a }: { a: string }) => a);',
			output:
				'type FooProps = { a: string };\n\nconst Foo = memo(({ a }: FooProps) => a);',
			errors: [{ messageId: 'inline' }],
		},
		{
			code: 'export default function ({ a }: { a: string }) { return a; }',
			output: null,
			errors: [{ messageId: 'inline' }],
		},
		{
			code: 'export default ({ a }: { a: string }) => a;',
			output: null,
			errors: [{ messageId: 'inline' }],
		},
		{
			code: 'const Foo = ({ a }: { a: string } = { a: "" }) => a;',
			output:
				'type FooProps = { a: string };\n\nconst Foo = ({ a }: FooProps = { a: "" }) => a;',
			errors: [{ messageId: 'inline' }],
		},
		{
			code: 'const helper = (props: { a: string } = { a: "" }) => props;',
			output:
				'type HelperProps = { a: string };\n\nconst helper = (props: HelperProps = { a: "" }) => props;',
			errors: [{ messageId: 'inline' }],
		},
		{
			code: 'function Foo(props: { a: string }) { return props; }',
			output:
				'type FooProps = { a: string };\n\nfunction Foo(props: FooProps) { return props; }',
			errors: [{ messageId: 'inline' }],
		},
		{
			code: 'export const Foo = ({ a }: { a: string }) => a;',
			output:
				'type FooProps = { a: string };\n\nexport const Foo = ({ a }: FooProps) => a;',
			errors: [{ messageId: 'inline' }],
		},
		{
			code: 'export default function Foo({ a }: { a: string }) { return a; }',
			output:
				'type FooProps = { a: string };\n\nexport default function Foo({ a }: FooProps) { return a; }',
			errors: [{ messageId: 'inline' }],
		},
		{
			code: 'const Foo = function ({ a }: { a: string }) { return a; };',
			output:
				'type FooProps = { a: string };\n\nconst Foo = function ({ a }: FooProps) { return a; };',
			errors: [{ messageId: 'inline' }],
		},
		{
			code: 'import x from "x";\n\n// Renders foo.\n/** Docs */\nexport function Foo({ a }: {\n\ta: string;\n\tb?: number;\n}) { return a; }',
			output:
				'import x from "x";\n\ntype FooProps = {\n\ta: string;\n\tb?: number;\n};\n\n// Renders foo.\n/** Docs */\nexport function Foo({ a }: FooProps) { return a; }',
			errors: [{ messageId: 'inline' }],
		},
		{
			code: 'type FooProps = { b: number };\nconst Foo = ({ a }: { a: string }) => a;',
			output: null,
			errors: [{ messageId: 'inline' }],
		},
		{
			code: 'import type { FooProps } from "./types";\nconst Foo = ({ a }: { a: string }) => a;',
			output: null,
			errors: [{ messageId: 'inline' }],
		},
		{
			code: 'function Foo<T>({ a }: { a: T }) { return a; }',
			output: null,
			errors: [{ messageId: 'inline' }],
		},
		{
			code: 'const Foo = <T,>({ a }: { a: T[] }) => a;',
			output: null,
			errors: [{ messageId: 'inline' }],
		},
		{
			code: 'function Foo<T>({ a }: { a: string }) { return a; }',
			output:
				'type FooProps = { a: string };\n\nfunction Foo<T>({ a }: FooProps) { return a; }',
			errors: [{ messageId: 'inline' }],
		},
		{
			code: 'function outer() {\n\tconst Foo = ({ a }: { a: string }) => a;\n\treturn Foo;\n}',
			output: null,
			errors: [{ messageId: 'inline' }],
		},
		{
			code: 'function Foo(props: { a: typeof props }) { return props; }',
			output: null,
			errors: [{ messageId: 'inline' }],
		},
	],
});
