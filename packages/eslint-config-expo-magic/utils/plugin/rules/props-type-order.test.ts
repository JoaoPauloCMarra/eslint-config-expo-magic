import { describe, it } from 'bun:test';
import type { Rule } from 'eslint';

const eslint: typeof import('eslint') = require('eslint');
const tsParser: typeof import('@typescript-eslint/parser') = require('@typescript-eslint/parser');
const rule: Rule.RuleModule = require('./props-type-order.js');

const { RuleTester } = eslint;

RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it;

const ruleTester = new RuleTester({
	languageOptions: {
		parser: tsParser,
		parserOptions: {
			sourceType: 'module',
		},
	},
});

ruleTester.run('props-type-order', rule, {
	valid: [
		'type FooProps = { a: string; b: string; onPress(): void };',
		'type FooProps = { a: string; label?: string; onPress?(): void };',
		'interface FooProps { a: string; b?: string; onPress: () => void }',
		'interface Other { b: string; a: string }',
		'interface FooProps { a: string }',
		'interface FooProps { [key: string]: string; b: string; a: string }',
	],
	invalid: [
		{
			code: 'type FooProps = { onPress(): void; b: string; a: string };',
			errors: [{ messageId: 'order' }],
		},
		{
			code: 'type FooProps = { onPress?(): void; label?: string };',
			errors: [{ messageId: 'order' }],
		},
		{
			code: 'interface FooProps { b: string; a: string }',
			errors: [{ messageId: 'order' }],
		},
		{
			code: 'interface FooProps { onPress(): void; a: string }',
			errors: [{ messageId: 'order' }],
		},
		{
			code: 'interface BarModel { b: string; a: string }',
			options: [{ pattern: 'Model$' }],
			errors: [{ messageId: 'order' }],
		},
	],
});
