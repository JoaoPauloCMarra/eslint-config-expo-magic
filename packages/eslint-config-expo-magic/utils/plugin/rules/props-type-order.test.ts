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
		'type FooProps = { a: string; overlayColor?: string; onVideoEvent?: VideoEventCallback };',
		'type FooProps = { a: string; once?: boolean; onPress: () => void };',
	],
	invalid: [
		{
			code: 'type FooProps = { onPress(): void; b: string; a: string };',
			output: 'type FooProps = { a: string; b: string; onPress(): void };',
			errors: [{ messageId: 'order' }],
		},
		{
			code: 'type FooProps = { onPress?(): void; label?: string };',
			output: 'type FooProps = { label?: string; onPress?(): void };',
			errors: [{ messageId: 'order' }],
		},
		{
			code: 'type FooProps = { a: string; onVideoEvent?: VideoEventCallback; overlayColor?: string };',
			output: 'type FooProps = { a: string; overlayColor?: string; onVideoEvent?: VideoEventCallback };',
			errors: [{ messageId: 'order' }],
		},
		{
			code: 'interface FooProps { b: string; a: string }',
			output: 'interface FooProps { a: string; b: string }',
			errors: [{ messageId: 'order' }],
		},
		{
			code: 'interface FooProps { onPress(): void; a: string }',
			output: 'interface FooProps { a: string; onPress(): void }',
			errors: [{ messageId: 'order' }],
		},
		{
			code: 'interface BarModel { b: string; a: string }',
			options: [{ pattern: 'Model$' }],
			output: 'interface BarModel { a: string; b: string }',
			errors: [{ messageId: 'order' }],
		},
		{
			code: 'type FooProps = {\n\tonPress: () => void;\n\tlabel?: string;\n\tb: string;\n\ta: string;\n};',
			output:
				'type FooProps = {\n\ta: string;\n\tb: string;\n\tlabel?: string;\n\tonPress: () => void;\n};',
			errors: [{ messageId: 'order' }],
		},
		{
			code: 'type FooProps = {\n\tb: string,\n\ta: string\n};',
			output: 'type FooProps = {\n\ta: string,\n\tb: string\n};',
			errors: [{ messageId: 'order' }],
		},
		{
			code: 'type FooProps = {\n\tb: {\n\t\tx: number;\n\t};\n\ta: string;\n};',
			output: 'type FooProps = {\n\ta: string;\n\tb: {\n\t\tx: number;\n\t};\n};',
			errors: [{ messageId: 'order' }],
		},
		{
			code: 'type FooProps = {\n\t// note\n\tb: string;\n\ta: string;\n};',
			output: null,
			errors: [{ messageId: 'order' }],
		},
		{
			code: 'interface FooProps { b: string; /* x */ a: string }',
			output: null,
			errors: [{ messageId: 'order' }],
		},
	],
});
