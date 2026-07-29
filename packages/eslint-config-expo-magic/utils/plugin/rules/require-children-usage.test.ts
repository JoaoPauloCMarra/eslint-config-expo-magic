import { describe, it } from 'bun:test';
import type { Rule } from 'eslint';

const eslint: typeof import('eslint') = require('eslint');
const tsParser: typeof import('@typescript-eslint/parser') = require('@typescript-eslint/parser');
const rule: Rule.RuleModule = require('./require-children-usage.js');

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

ruleTester.run('require-children-usage component ownership', rule, {
	valid: [
		[
			'type Props = { children: unknown };',
			'const Forwarding = (props: Props) => <View {...props} />;',
		].join('\n'),
		[
			'type Props = { children: unknown };',
			'const AliasUsage = (props: Props) => {',
			'  const alias = props;',
			'  return alias.children;',
			'};',
		].join('\n'),
		[
			'type Props = { children: unknown };',
			'const Rendering = ({ children }: Props) => <View>{children}</View>;',
			'const attrs = { accessibilityLabel: "content" };',
			'const Other = () => <View {...attrs} />;',
		].join('\n'),
	],
	invalid: [
		{
			code: [
				'type IgnoringProps = { children: unknown };',
				'const Ignoring = (props: IgnoringProps) => null;',
				'type RenderingProps = { children: unknown };',
				'const Rendering = (props: RenderingProps) => props.children;',
			].join('\n'),
			errors: [{ messageId: 'unused' }],
		},
		{
			code: [
				'type Props = { children: unknown };',
				'const Ignoring = (props: Props) => null;',
				'const unrelated = { children: "text" };',
				'const Other = () => <View>{unrelated.children}</View>;',
			].join('\n'),
			errors: [{ messageId: 'unused' }],
		},
		{
			code: [
				'type Props = { children: unknown };',
				'const Ignoring = (props: Props) => null;',
				'const attrs = { accessibilityLabel: "content" };',
				'const Other = () => <View {...attrs} />;',
			].join('\n'),
			errors: [{ messageId: 'unused' }],
		},
		{
			code: [
				'type Props = { children: unknown };',
				'const First = ({ children }: Props) => <View>{children}</View>;',
				'const Second = (props: Props) => null;',
			].join('\n'),
			errors: [{ messageId: 'unused' }],
		},
		{
			code: [
				'type Props = { children: unknown };',
				'const First = (props: Props) => {',
				'  const Child = () => {',
				'    const alias = props;',
				'    return alias.children;',
				'  };',
				'  return null;',
				'};',
			].join('\n'),
			errors: [{ messageId: 'unused' }],
		},
	],
});
