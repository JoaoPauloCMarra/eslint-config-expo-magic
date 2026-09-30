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
			errors: [{ messageId: 'inline' }],
		},
		{
			code: 'function Foo({ a }: { a: string }) { return a; }',
			errors: [{ messageId: 'inline' }],
		},
		{
			code: 'const Foo = memo(({ a }: { a: string }) => a);',
			errors: [{ messageId: 'inline' }],
		},
		{
			code: 'export default function ({ a }: { a: string }) { return a; }',
			errors: [{ messageId: 'inline' }],
		},
		{
			code: 'const Foo = ({ a }: { a: string } = { a: "" }) => a;',
			errors: [{ messageId: 'inline' }],
		},
		{
			code: 'const helper = (props: { a: string } = { a: "" }) => props;',
			errors: [{ messageId: 'inline' }],
		},
		{
			code: 'function Foo(props: { a: string }) { return props; }',
			errors: [{ messageId: 'inline' }],
		},
	],
});
