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
		'type Props = { children: unknown }; function Box(props: Props) { if (true) { const { children } = props; return <View>{children}</View>; } return null; }',
		'type Props = { title: string }; const Box = (props: Props) => null; function helper() { type Props = { children: unknown }; }',

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
			code: 'type Props = { children: unknown }; function Box(props: Props) { const Props = 0; return null; }',
			errors: [{ messageId: 'unused' }],
		},
		{
			code: 'type Props = { children: unknown }; function Box(props: Props) { { const props = { children: null }; return <View>{props.children}</View>; } }',
			errors: [{ messageId: 'unused' }],
		},
		{
			code: 'type Props = { children: unknown }; const Box = (props: Props) => null; function helper() { type Props = { title: string }; }',
			errors: [{ messageId: 'unused' }],
		},

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

ruleTester.run('require-children-usage qualified types', rule, {
	valid: [
		{
			name: 'qualified member does not borrow outer children type',
			code: [
				'type Props = { children: unknown };',
				'namespace UI { export type Props = { title: string }; }',
				'const Box = (props: UI.Props) => null;',
			].join('\n'),
		},
		{
			name: 'unresolved qualified member does not borrow outer type',
			code: [
				'type Props = { children: unknown };',
				'const Box = (props: Missing.Props) => null;',
			].join('\n'),
		},
		{
			name: 'imported namespace does not borrow outer type',
			code: [
				'import type * as UI from "./external";',
				'type Props = { children: unknown };',
				'const Box = (props: UI.Props) => null;',
			].join('\n'),
		},
		{
			name: 'missing local namespace member does not borrow outer type',
			code: [
				'type Props = { children: unknown };',
				'namespace UI { export type Other = { title: string }; }',
				'const Box = (props: UI.Props) => null;',
			].join('\n'),
		},
		{
			name: 'nested member resolves the whole namespace path',
			code: [
				'type Props = { children: unknown };',
				'namespace UI { export namespace Layout { export type Props = { title: string }; } }',
				'const Box = (props: UI.Layout.Props) => null;',
			].join('\n'),
		},
		{
			name: 'inner namespace shadows outer namespace',
			code: [
				'namespace UI { export type Props = { children: unknown }; }',
				'namespace Host {',
				'  export namespace UI { export type Props = { title: string }; }',
				'  export const Box = (props: UI.Props) => null;',
				'}',
			].join('\n'),
		},
		{
			name: 'namespace member ignores same-named local type',
			code: [
				'namespace UI { export type Props = { title: string }; }',
				'function factory() {',
				'  type Props = { children: unknown };',
				'  const Box = (props: UI.Props) => null;',
				'  return Box;',
				'}',
			].join('\n'),
		},
		{
			name: 'qualified children property is used',
			code: [
				'namespace UI { export type Props = { children: unknown }; }',
				'const Box = (props: UI.Props) => <View>{props.children}</View>;',
			].join('\n'),
		},
		{
			name: 'qualified children binding is used',
			code: [
				'namespace UI { export interface Props { children: unknown } }',
				'const Box = ({ children }: UI.Props) => <View>{children}</View>;',
			].join('\n'),
		},
		{
			name: 'custom namespace helper is not React PropsWithChildren',
			code: [
				'namespace UI { export type PropsWithChildren<T> = { title: string }; }',
				'const Box = (props: UI.PropsWithChildren<{ title: string }>) => null;',
			].join('\n'),
		},
		{
			name: 'React qualified helper with used children',
			code: [
				'const Box = (props: React.PropsWithChildren<{ title: string }>) => props.children;',
			].join('\n'),
		},
		{
			name: 'import-equals local namespace alias without children',
			code: [
				'type Props = { children: unknown };',
				'namespace UI { export type Props = { title: string }; }',
				'import Local = UI;',
				'const Box = (props: Local.Props) => null;',
			].join('\n'),
		},
	],
	invalid: [
		{
			name: 'qualified member declares children despite outer non-children type',
			code: [
				'type Props = { title: string };',
				'namespace UI { export type Props = { children: unknown }; }',
				'const Box = (props: UI.Props) => null;',
			].join('\n'),
			errors: [{ messageId: 'unused' }],
		},
		{
			name: 'qualified member declares children without outer type',
			code: [
				'namespace UI { export type Props = { children: unknown }; }',
				'const Box = (props: UI.Props) => null;',
			].join('\n'),
			errors: [{ messageId: 'unused' }],
		},
		{
			name: 'nested namespace member declares children',
			code: [
				'namespace UI { export namespace Layout { export type Props = { children: unknown }; } }',
				'const Box = (props: UI.Layout.Props) => null;',
			].join('\n'),
			errors: [{ messageId: 'unused' }],
		},
		{
			name: 'dotted namespace member declares children',
			code: [
				'namespace UI.Layout { export type Props = { children: unknown }; }',
				'const Box = (props: UI.Layout.Props) => null;',
			].join('\n'),
			errors: [{ messageId: 'unused' }],
		},
		{
			name: 'local type alias resolves qualified member',
			code: [
				'namespace UI { export type Props = { children: unknown }; }',
				'type BoxProps = UI.Props;',
				'const Box = (props: BoxProps) => null;',
			].join('\n'),
			errors: [{ messageId: 'unused' }],
		},
		{
			name: 'import-equals alias resolves local namespace',
			code: [
				'namespace UI { export type Props = { children: unknown }; }',
				'import Local = UI;',
				'const Box = (props: Local.Props) => null;',
			].join('\n'),
			errors: [{ messageId: 'unused' }],
		},
		{
			name: 'import-equals alias resolves nested local namespace',
			code: [
				'namespace UI { export namespace Layout { export type Props = { children: unknown }; } }',
				'import Local = UI.Layout;',
				'const Box = (props: Local.Props) => null;',
			].join('\n'),
			errors: [{ messageId: 'unused' }],
		},
		{
			name: 'namespace declared after component',
			code: [
				'const Box = (props: UI.Props) => null;',
				'namespace UI { export type Props = { children: unknown }; }',
			].join('\n'),
			errors: [{ messageId: 'unused' }],
		},
		{
			name: 'namespace interface directly declares children',
			code: [
				'namespace UI { export interface Props { children: unknown } }',
				'const Box = (props: UI.Props) => null;',
			].join('\n'),
			errors: [{ messageId: 'unused' }],
		},
		{
			name: 'namespace interface extends namespace-local base',
			code: [
				'namespace UI {',
				'  export interface Base { children: unknown }',
				'  export interface Props extends Base { title: string }',
				'}',
				'const Box = (props: UI.Props) => props.title;',
			].join('\n'),
			errors: [{ messageId: 'unused' }],
		},
		{
			name: 'local interface extends qualified namespace base',
			code: [
				'namespace UI { export interface Base { children: unknown } }',
				'interface Props extends UI.Base { title: string }',
				'const Box = (props: Props) => props.title;',
			].join('\n'),
			errors: [{ messageId: 'unused' }],
		},
		{
			name: 'qualified member ignores shadowing local type',
			code: [
				'namespace UI { export type Props = { children: unknown }; }',
				'function factory() {',
				'  type Props = { title: string };',
				'  const Box = (props: UI.Props) => null;',
				'  return Box;',
				'}',
			].join('\n'),
			errors: [{ messageId: 'unused' }],
		},
		{
			name: 'inner namespace supplies children instead of outer namespace',
			code: [
				'namespace UI { export type Props = { title: string }; }',
				'namespace Host {',
				'  export namespace UI { export type Props = { children: unknown }; }',
				'  export const Box = (props: UI.Props) => null;',
				'}',
			].join('\n'),
			errors: [{ messageId: 'unused' }],
		},
		{
			name: 'React qualified helper preserves unused-children contract',
			code: [
				'const Box = (props: React.PropsWithChildren<{ title: string }>) => null;',
			].join('\n'),
			errors: [{ messageId: 'unused' }],
		},
		{
			name: 'custom namespace helper can declare children',
			code: [
				'namespace UI { export type PropsWithChildren = { children: unknown }; }',
				'const Box = (props: UI.PropsWithChildren) => null;',
			].join('\n'),
			errors: [{ messageId: 'unused' }],
		},
	],
});

ruleTester.run('require-children-usage namespace resolution boundaries', rule, {
	valid: [
		{
			name: 'private namespace member stays unresolved outside',
			code: 'type Props = { children: unknown }; namespace UI { type Props = { children: unknown }; } const Box = (props: UI.Props) => null;',
		},
		{
			name: 'private nested namespace stays unresolved outside',
			code: 'type Props = { children: unknown }; namespace UI { namespace Layout { export type Props = { children: unknown }; } } const Box = (props: UI.Layout.Props) => null;',
		},
		{
			name: 'type parameter shadows outer namespace',
			code: 'namespace UI { export type Props = { children: unknown }; } function factory<UI>() { const Box = (props: UI.Props) => null; return Box; }',
		},
		{
			name: 'external import-equals alias does not borrow local type',
			code: 'import UI = require("external"); type Props = { children: unknown }; const Box = (props: UI.Props) => null;',
		},
		{
			name: 'local helper spelling does not override its declaration',
			code: 'type PropsWithChildren<T> = { title: string }; const Box = (props: PropsWithChildren<{}>) => null;',
		},
		{
			name: 'local React namespace shadows implicit helper',
			code: 'namespace React { export type PropsWithChildren<T> = { title: string }; } const Box = (props: React.PropsWithChildren<{}>) => null;',
		},
		{
			name: 'non-React imported helper stays unresolved',
			code: 'import type { PropsWithChildren } from "external"; const Box = (props: PropsWithChildren<{}>) => null;',
		},
		{
			name: 'cyclic local namespace aliases terminate',
			code: 'import First = Second; import Second = First; type Props = { children: unknown }; const Box = (props: First.Props) => null;',
		},
	],
	invalid: [
		{
			name: 'ambient namespace exports members implicitly',
			code: 'declare namespace UI { interface Props { children: unknown } } const Box = (props: UI.Props) => null;',
			errors: [{ messageId: 'unused' }],
		},
		{
			name: 'merged namespaces retain the matching exported member',
			code: 'namespace UI { export type Props = { children: unknown }; } namespace UI { export type Other = { title: string }; } const Box = (props: UI.Props) => null;',
			errors: [{ messageId: 'unused' }],
		},
		{
			name: 'exported import-equals member resolves its namespace',
			code: 'namespace Types { export type Props = { children: unknown }; } namespace UI { export import Layout = Types; } const Box = (props: UI.Layout.Props) => null;',
			errors: [{ messageId: 'unused' }],
		},
		{
			name: 'renamed React namespace helper remains recognized',
			code: 'import type * as R from "react"; const Box = (props: R.PropsWithChildren<{}>) => null;',
			errors: [{ messageId: 'unused' }],
		},
		{
			name: 'renamed React helper remains recognized',
			code: 'import type { PropsWithChildren as WithChildren } from "react"; const Box = (props: WithChildren<{}>) => null;',
			errors: [{ messageId: 'unused' }],
		},
		{
			name: 'React import-equals helper remains recognized',
			code: 'import React = require("react"); const Box = (props: React.PropsWithChildren<{}>) => null;',
			errors: [{ messageId: 'unused' }],
		},
	],
});

ruleTester.run('require-children-usage merged namespace lexical lookup', rule, {
	valid: [
		{
			name: 'merged exported member shadows outer type',
			code: 'type Base = { children: unknown }; namespace UI { export type Base = { title: string }; } namespace UI { export type Props = Base; } const Box = (props: UI.Props) => null;',
		},
		{
			name: 'private sibling member is not visible',
			code: 'namespace UI { type Base = { children: unknown }; } namespace UI { export type Props = Base; } const Box = (props: UI.Props) => null;',
		},
		{
			name: 'current private member wins over merged export',
			code: 'namespace UI { export type Base = { children: unknown }; } namespace UI { type Base = { title: string }; export type Props = Base; } const Box = (props: UI.Props) => null;',
		},
		{
			name: 'external import-equals is not React helper',
			code: 'import React = require("external"); const Box = (props: React.PropsWithChildren<{}>) => null;',
		},
	],
	invalid: [
		{
			name: 'merged interface sees exported base',
			code: 'namespace UI { export type Base = { children: unknown }; } namespace UI { export interface Props extends Base {} } const Box = (props: UI.Props) => null;',
			errors: [{ messageId: 'unused' }],
		},
		{
			name: 'merged declaration sees nested namespace',
			code: 'namespace UI { export namespace Layout { export type Props = { children: unknown }; } } namespace UI { export type Props = Layout.Props; } const Box = (props: UI.Props) => null;',
			errors: [{ messageId: 'unused' }],
		},
		{
			name: 'dotted namespaces merge with explicit nesting',
			code: 'namespace UI { export namespace Layout { export type Base = { children: unknown }; } } namespace UI.Layout { export type Props = Base; } const Box = (props: UI.Layout.Props) => null;',
			errors: [{ messageId: 'unused' }],
		},
		{
			name: 'dotted namespace sees parent exports',
			code: 'namespace UI { export type Base = { children: unknown }; } namespace UI.Layout { export type Props = Base; } const Box = (props: UI.Layout.Props) => null;',
			errors: [{ messageId: 'unused' }],
		},
	],
});

ruleTester.run('require-children-usage merged member bindings', rule, {
	valid: [
		{
			name: 'private namespace does not merge with exported sibling',
			code: 'namespace UI { export namespace Layout { export type Base = { children: unknown }; } } namespace UI { namespace Layout { export type Other = {}; } export type Props = Layout.Base; } const Box = (props: UI.Props) => null;',
		},
	],
	invalid: [
		{
			name: 'public interface combines sibling declarations',
			code: 'namespace UI { export interface Base { children: unknown } } namespace UI { export interface Base { title: string } export type Props = Base; } const Box = (props: UI.Props) => null;',
			errors: [{ messageId: 'unused' }],
		},
		{
			name: 'public nested namespace combines sibling declarations',
			code: 'namespace UI { export namespace Layout { export type Base = { children: unknown }; } } namespace UI { export namespace Layout { export type Other = {}; } export type Props = Layout.Base; } const Box = (props: UI.Props) => null;',
			errors: [{ messageId: 'unused' }],
		},
		{
			name: 'implicit parent exposes dotted sibling namespace',
			code: 'namespace UI.Shared { export type Base = { children: unknown }; } namespace UI.Layout { export type Props = Shared.Base; } const Box = (props: UI.Layout.Props) => null;',
			errors: [{ messageId: 'unused' }],
		},
	],
});

ruleTester.run('require-children-usage transitive value aliases', rule, {
	valid: [
		{
			name: 'second identity alias reads children member',
			code: [
				'type Props = { children: unknown; title: any };',
				'const Box = (props: Props) => {',
				'  const first = props; const second = first; return second.children;',
				'};',
			].join('\n'),
		},
		{
			name: 'second identity alias reads computed children member',
			code: [
				'type Props = { children: unknown; title: any };',
				'const Box = (props: Props) => {',
				'  const first = props; const second = first; return second["children"];',
				'};',
			].join('\n'),
		},
		{
			name: 'three identity aliases read children',
			code: [
				'type Props = { children: unknown; title: any };',
				'const Box = (props: Props) => {',
				'  const first = props; const second = first; const third = second; return third.children;',
				'};',
			].join('\n'),
		},
		{
			name: 'identity alias chain crosses a block',
			code: [
				'type Props = { children: unknown; title: any };',
				'const Box = (props: Props) => {',
				'  const first = props; { const second = first; return second.children; }',
				'};',
			].join('\n'),
		},
		{
			name: 'second identity alias supplies destructured children',
			code: [
				'type Props = { children: unknown; title: any };',
				'const Box = (props: Props) => {',
				'  const first = props; const second = first; const { children: content } = second; return <View>{content}</View>;',
				'};',
			].join('\n'),
		},
		{
			name: 'second identity alias forwards JSX props',
			code: [
				'type Props = { children: unknown; title: any };',
				'const Box = (props: Props) => {',
				'  const first = props; const second = first; return <View {...second} />;',
				'};',
			].join('\n'),
		},
		{
			name: 'second identity alias forwards cloneElement props',
			code: [
				'type Props = { children: unknown; title: any };',
				'const Box = (props: Props) => {',
				'  const first = props; const second = first; return cloneElement(<View />, second);',
				'};',
			].join('\n'),
		},
		{
			name: 'second identity alias forwards React cloneElement props',
			code: [
				'type Props = { children: unknown; title: any };',
				'const Box = (props: Props) => {',
				'  const first = props; const second = first; return React.cloneElement(<View />, second);',
				'};',
			].join('\n'),
		},
		{
			name: 'local rest retaining children forwards JSX props',
			code: [
				'type Props = { children: unknown; title: any };',
				'const Box = (props: Props) => {',
				'  const { title, ...rest } = props; return <View {...rest} />;',
				'};',
			].join('\n'),
		},
		{
			name: 'local rest retaining children reads children',
			code: [
				'type Props = { children: unknown; title: any };',
				'const Box = (props: Props) => {',
				'  const { title, ...rest } = props; return rest.children;',
				'};',
			].join('\n'),
		},
	],
	invalid: [
		{
			name: 'unused identity alias chain still warns',
			code: [
				'type Props = { children: unknown; title: any };',
				'const Box = (props: Props) => {',
				'  const first = props; const second = first; return null;',
				'};',
			].join('\n'),
			errors: [{ messageId: 'unused' }],
		},
		{
			name: 'second identity alias with unrelated property read still warns',
			code: [
				'type Props = { children: unknown; title: any };',
				'const Box = (props: Props) => {',
				'  const first = props; const second = first; return second.title;',
				'};',
			].join('\n'),
			errors: [{ messageId: 'unused' }],
		},
		{
			name: 'shadowed second alias does not consume caller children',
			code: [
				'type Props = { children: unknown; title: any };',
				'const Box = (props: Props) => {',
				'  const first = props; const second = first; { const second = { children: "other" }; return second.children; }',
				'};',
			].join('\n'),
			errors: [{ messageId: 'unused' }],
		},
		{
			name: 'alias chain in nested component does not consume parent children',
			code: [
				'type Props = { children: unknown; title: any };',
				'const Box = (props: Props) => {',
				'  const first = props; const Child = () => { const second = first; return second.children; }; return <Child />;',
				'};',
			].join('\n'),
			errors: [{ messageId: 'unused' }],
		},
		{
			name: 'reassigned second alias does not consume caller children',
			code: [
				'type Props = { children: unknown; title: any };',
				'const Box = (props: Props) => {',
				'  const first = props; let second = first; second = { children: "other", title: "replacement" }; return second.children;',
				'};',
			].join('\n'),
			errors: [{ messageId: 'unused' }],
		},
		{
			name: 'write-only children through second alias still warns',
			code: [
				'type Props = { children: unknown; title: any };',
				'const Box = (props: Props) => {',
				'  const first = props; const second = first; second.children = "replacement"; return null;',
				'};',
			].join('\n'),
			errors: [{ messageId: 'unused' }],
		},
		{
			name: 'overwritten children through second alias still warns',
			code: [
				'type Props = { children: unknown; title: any };',
				'const Box = (props: Props) => {',
				'  const first = props; const second = first; second.children = "replacement"; return second.children;',
				'};',
			].join('\n'),
			errors: [{ messageId: 'unused' }],
		},
		{
			name: 'unrelated destructured property is not a props identity alias',
			code: [
				'type Props = { children: unknown; title: any };',
				'const Box = (props: Props) => {',
				'  const { title } = props; return title.children;',
				'};',
			].join('\n'),
			errors: [{ messageId: 'unused' }],
		},
		{
			name: 'local rest excluding children is not a props identity alias',
			code: [
				'type Props = { children: unknown; title: any };',
				'const Box = (props: Props) => {',
				'  const { children, ...rest } = props; return <View {...rest} />;',
				'};',
			].join('\n'),
			errors: [{ messageId: 'unused' }],
		},
		{
			name: 'alias of local rest excluding children still warns',
			code: [
				'type Props = { children: unknown; title: any };',
				'const Box = (props: Props) => {',
				'  const { children, ...rest } = props; const second = rest; return <View {...second} />;',
				'};',
			].join('\n'),
			errors: [{ messageId: 'unused' }],
		},
	],
});

const aliasGuardCode = (body: string) =>
	`type Props = { children: unknown; title?: string }; function mutate(value: Props) { value.children = null; } class Mutator { constructor(value: Props) { value.children = null; } } const Box = (props: Props) => { ${body} };`;
ruleTester.run(
	'require-children-usage alias mutation and escape boundaries',
	rule,
	{
		valid: [
			{
				name: 'computed non-children string key retains rest children',
				code: aliasGuardCode(
					"const { ['title']: title, ...rest } = props; return rest.children;",
				),
			},
			{
				name: 'computed numeric key retains rest children',
				code: aliasGuardCode(
					'const { [0]: item, ...rest } = props; return rest.children;',
				),
			},
			{
				name: 'unrelated call does not prevent a safe identity chain',
				code: aliasGuardCode(
					'const first = props; const second = first; Math.abs(1); return second.children;',
				),
			},
			{
				name: 'legacy direct alias read stays recognized before later reassignment',
				code: aliasGuardCode(
					'let first = props; const result = first.children; first = { children: null }; return result;',
				),
			},
		],
		invalid: [
			...[
				[
					'asserted alias mutation',
					'(second as Props).children = null; return second.children;',
				],
				[
					'non-null alias mutation',
					'second!.children = null; return second.children;',
				],
				[
					'asserted alias passed to mutator',
					'mutate(second as Props); return second.children;',
				],
				[
					'tagged method escape',
					'second.mutate`OTHER`; return second.children;',
				],
				[
					'wrapped tagged method escape',
					'(second.mutate as any)`OTHER`; return second.children;',
				],
				['constructor escape', 'new Mutator(second); return second.children;'],
				[
					'object property escape',
					'const holder = { second }; holder.second.children = null; return second.children;',
				],
				[
					'assignment alias escape',
					'let other: Props; other = second; other.children = null; return second.children;',
				],
				['direct call escape', 'mutate(second); return second.children;'],
				[
					'mutable sibling mutation',
					'let other = props; other.children = null; return second.children;',
				],
				[
					'captured alias mutation',
					'const change = () => { first.children = null; }; change(); return second.children;',
				],
				[
					'nested alias mutation',
					'const change = () => { const inner = first; inner.children = null; }; change(); return second.children;',
				],
				[
					'computed key mutation',
					'const key = "children"; second[key] = null; return second.children;',
				],
				[
					'destructuring assignment mutation',
					'({ children: second.children } = { children: null }); return second.children;',
				],
			].map(([name, body]) => ({
				name,
				code: aliasGuardCode(
					'const first = props; const second = first; ' + body,
				),
				errors: [{ messageId: 'unused' }],
			})),
			...[
				[
					'direct write-only member',
					'const first = props; first.children = null; return null;',
				],
				[
					'direct delete-only member',
					'const first = props; delete first.children; return null;',
				],
				[
					'direct destructuring write-only member',
					'const first = props; ({ children: first.children } = { children: null }); return null;',
				],
				[
					'computed children key removes rest children',
					"const { ['children']: ignored, ...rest } = props; return <View {...rest} />;",
				],
			].map(([name, body]) => ({
				name,
				code: aliasGuardCode(body),
				errors: [{ messageId: 'unused' }],
			})),
		],
	},
);
