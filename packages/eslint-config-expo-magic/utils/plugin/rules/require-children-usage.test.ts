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
		[
			'type Props = { children: unknown; title: string };',
			'const Box = ({ title, ...rest }: Props) => <View {...rest}>{title}</View>;',
		].join('\n'),
		[
			'type Props = { children: unknown; title: string };',
			'const Box = ({ title, ...rest }: Props) => <Inner title={title} {...rest} />;',
		].join('\n'),
		[
			'type Props = { children: unknown };',
			'const Clone = (props: Props) => cloneElement(<View />, props);',
		].join('\n'),
		[
			'type Props = { children: unknown };',
			'const Clone = (props: Props) => React.cloneElement(<View />, props);',
		].join('\n'),
		[
			'interface Props extends PropsWithChildren<{ a: string }> {}',
			'const Box = (props: Props) => props.children;',
		].join('\n'),
	],
	invalid: [
		{
			code: [
				'interface Props extends PropsWithChildren<{ a: string }> {}',
				'const Box = (props: Props) => null;',
			].join('\n'),
			errors: [{ messageId: 'unused' }],
		},
		{
			code: [
				'interface Props extends React.PropsWithChildren<{ a: string }> {}',
				'const Box = (props: Props) => null;',
			].join('\n'),
			errors: [{ messageId: 'unused' }],
		},
		{
			code: [
				'type Base = { children: unknown };',
				'interface Props extends Base { a: string }',
				'const Box = (props: Props) => props.a;',
			].join('\n'),
			errors: [{ messageId: 'unused' }],
		},
		{
			code: [
				'interface Base { children: unknown }',
				'interface Props extends Base {}',
				'function Box({ a }: Props) { return a; }',
			].join('\n'),
			errors: [{ messageId: 'unused' }],
		},
		{
			code: [
				'type Props = { children: unknown; title: string };',
				'const Box = ({ children, title, ...rest }: Props) => <View {...rest}>{title}</View>;',
			].join('\n'),
			errors: [{ messageId: 'unused' }],
		},
		{
			code: [
				'type Props = { children: unknown; title: string };',
				'const Box = ({ title, ...rest }: Props) => <View>{title}</View>;',
			].join('\n'),
			errors: [{ messageId: 'unused' }],
		},
		{
			code: [
				'type Props = { children: unknown };',
				'export default function ({ children }: Props) { return null; }',
			].join('\n'),
			errors: [{ messageId: 'unused' }],
		},
		{
			code: [
				'type Props = { children: unknown };',
				'export default (props: Props) => null;',
			].join('\n'),
			errors: [{ messageId: 'unused' }],
		},
		{
			code: [
				'type Props = { children: unknown };',
				'const Log = (props: Props) => { console.log(props); return null; };',
			].join('\n'),
			errors: [{ messageId: 'unused' }],
		},
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
