// Cases for the expo-magic port, carried over from the RuleTester suites of the
// 5.x local plugin (utils/plugin/rules/*.test.ts and the plugin block of
// index.test.ts) and recorded with scripts/record-port-expectations.js.

const path = require('node:path');

const pluginDir = path.resolve(
	__dirname,
	'../../../eslint-config-expo-magic/utils/plugin',
);

function loadOriginalPlugin() {
	return require(path.join(pluginDir, 'index.js'));
}

const tsx = 'a.tsx';
const ts = 'a.ts';

function codeCases(rule, filename, entries) {
	return entries.map(([title, code, options]) => ({
		name: `${rule}: ${title}`,
		rule,
		code,
		filename,
		...(options ? { options } : {}),
	}));
}

const defaultExportPlacement = codeCases('default-export-placement', ts, [
	[
		'valid displayName',
		'function Foo() { return null; }\nFoo.displayName = "Foo";\nexport default Foo;',
	],
	[
		'valid displayName and defaultProps',
		'const Foo = () => null;\nFoo.displayName = "Foo";\nFoo.defaultProps = {};\nexport default Foo;',
	],
	['valid plain', 'const Foo = () => null;\nexport default Foo;'],
	[
		'valid default function after helpers',
		'const Foo = () => null;\nconst styles = {};\nexport default function Bar() { return Foo; }',
	],
	[
		'invalid foreign displayName',
		'const Foo = () => null;\nBar.displayName = "Bar";\nexport default Foo;',
	],
	[
		'invalid helper after displayName',
		'const Foo = () => null;\nFoo.displayName = "Foo";\nconst helper = 1;\nexport default Foo;',
	],
	[
		'invalid call statement',
		'const Foo = () => null;\nregister(Foo);\nexport default Foo;',
	],
	[
		'invalid export before declaration',
		'export default Foo;\nconst Foo = () => null;\nFoo.displayName = "Foo";\nconst x = 1;',
	],
	[
		'invalid trailing comment on declaration',
		'const Foo = () => null; // component\nconst styles = {};\nexport default Foo;',
	],
	[
		'invalid comment before export',
		'const Foo = () => null;\nconst styles = {};\n// the entry\nexport default Foo;',
	],
	[
		'invalid comment after export',
		'const Foo = () => null;\nconst styles = {};\nexport default Foo; // entry',
	],
	['index valid arrow', 'const Foo = () => null;\nexport default Foo;'],
	['index valid function', 'function Foo() { return null; }\nexport default Foo;'],
	['index valid import', "import Foo from './foo';\nexport default Foo;"],
	[
		'index valid non component',
		'const foo = 1;\nconst bar = 2;\nexport default foo;',
	],
	[
		'index invalid helper arrow',
		'const Foo = () => null;\nconst helper = () => null;\nexport default Foo;',
	],
	[
		'index invalid styles',
		'function Foo() { return null; }\nconst styles = {};\nexport default Foo;',
	],
]);

const kebabCode = 'export {};';

const kebabEntries = [
	['valid home-screen', 'r/src/home-screen.tsx'],
	['valid test file', 'r/src/use-home-screen.test.ts'],
	['valid index', 'r/app/index.tsx'],
	['valid layout', 'r/app/_layout.tsx'],
	['valid not-found', 'r/app/+not-found.tsx'],
	['valid html', 'r/app/+html.tsx'],
	['valid dynamic id', 'r/app/[id].tsx'],
	['valid dynamic userId', 'r/app/[userId].tsx'],
	['valid catch all', 'r/app/[...slug].tsx'],
	['valid catch all uppercase', 'r/app/[...Slug].tsx'],
	['valid group', 'r/app/(tabs).tsx'],
	['valid group uppercase', 'r/app/(Tabs).tsx'],
	['valid dotfile', 'r/.eslintrc.js'],
	[
		'valid ignore option bracket',
		'r/src/[userId].tsx',
		[{ ignore: ['^\\+.*', '^\\[.*\\]'] }],
	],
	[
		'valid ignore option legacy',
		'r/src/LegacyModule.tsx',
		[{ ignore: ['^Legacy'] }],
	],
	['invalid HomeScreen', 'r/src/HomeScreen.tsx'],
	['invalid snake_case', 'r/src/snake_case.ts'],
	['invalid directory is not checked', 'r/src/+NotFound-screen/HomeScreen.tsx'],
	[
		'invalid ignore option mismatch',
		'r/src/LegacyModule.tsx',
		[{ ignore: ['^Other'] }],
	],
];

const kebabCaseFilenames = kebabEntries.map(([title, filename, options]) => ({
	name: `kebab-case-filenames: ${title} ${filename}`,
	rule: 'kebab-case-filenames',
	code: kebabCode,
	filename,
	...(options ? { options } : {}),
}));

const billingFile = 'r/src/features/billing/screens/a.ts';

const crossFeatureEntries = [
	[
		'valid parent segments kept in alias',
		"import x from '@/../features/auth/private';",
		billingFile,
	],
	[
		'valid alias dotdot back to billing',
		"import x from '@/features/auth/../billing/private';",
		billingFile,
	],
	[
		'valid alias dotdot into contracts',
		"import x from '@/features/auth/internal/../contracts/session';",
		billingFile,
	],
	['valid same folder', "import x from './total';", billingFile],
	['valid sibling folder', "import x from '../hooks/use-total';", billingFile],
	[
		'valid own feature alias',
		"import x from '@/features/billing/hooks';",
		billingFile,
	],
	[
		'valid contracts alias',
		"import x from '@/features/auth/contracts/session';",
		billingFile,
	],
	[
		'valid contracts relative',
		"import x from '../../auth/contracts/session';",
		billingFile,
	],
	[
		'valid lib features relative',
		"import x from '../../../lib/features/flags';",
		billingFile,
	],
	[
		'valid lib features alias',
		"import x from '@/lib/features/flags';",
		billingFile,
	],
	[
		'valid file outside features',
		"import x from '../features/auth/total';",
		'r/src/lib/a.ts',
	],
	[
		'valid other root features',
		"import x from '../../../../other/features/auth/total';",
		billingFile,
	],
	[
		'valid dynamic import contracts',
		"const x = import('../../auth/contracts/session');",
		billingFile,
	],
	[
		'valid custom srcRoot outside',
		"import x from '../../auth/total';",
		'r/src/features/billing/screens/a.test.ts',
		[{ srcRoot: 'app' }],
	],
	...[
		'@/features/auth/contracts/../private',
		'@/features/billing/../auth/private',
		'@/lib/../features/auth/private',
	].map((source) => [
		`invalid alias ${source}`,
		`import x from '${source}';`,
		billingFile,
	]),
	[
		'invalid custom srcRoot',
		"import x from '../billing/total';",
		'repo/apps/mobile/src/features/cart/cart.ts',
		[{ srcRoot: 'apps/mobile/src' }],
	],
	[
		'invalid alias hooks',
		"import x from '@/features/auth/hooks/use-session';",
		billingFile,
	],
	[
		'invalid relative hooks',
		"import x from '../../auth/hooks/use-session';",
		billingFile,
	],
	['invalid export all', "export * from '../../auth/total';", billingFile],
	[
		'invalid export named',
		"export { total } from '@/features/auth/total';",
		billingFile,
	],
	[
		'invalid dynamic import',
		"const x = import('@/features/auth/total');",
		billingFile,
	],
	[
		'invalid custom alias prefix',
		"import x from '~/features/auth/total';",
		billingFile,
		[{ aliasPrefix: '~' }],
	],
];

const noCrossFeatureImports = crossFeatureEntries.map(
	([title, code, filename, options]) => ({
		name: `no-cross-feature-imports: ${title} (${filename})`,
		rule: 'no-cross-feature-imports',
		code,
		filename,
		...(options ? { options } : {}),
	}),
);

const noInlineProps = codeCases('no-inline-props', tsx, [
	[
		'valid declared type',
		'type FooProps = { a: string };\nconst Foo = ({ a }: FooProps) => a;',
	],
	['valid lowercase param', 'function Foo(value: { a: string }) { return value; }'],
	['valid lowercase function', 'function parse({ a }: { a: string }) { return a; }'],
	['valid lowercase arrow', 'const toLabel = ({ a }: { a: string }) => a;'],
	[
		'valid default value',
		'type FooProps = { a: string };\nconst Foo = (props: FooProps = { a: "" }) => props;',
	],
	['valid untyped', 'const Foo = ({ a }) => a;'],
	['invalid arrow', 'const Foo = ({ a }: { a: string }) => a;'],
	['invalid function', 'function Foo({ a }: { a: string }) { return a; }'],
	['invalid memo', 'const Foo = memo(({ a }: { a: string }) => a);'],
	[
		'invalid anonymous default function',
		'export default function ({ a }: { a: string }) { return a; }',
	],
	['invalid anonymous default arrow', 'export default ({ a }: { a: string }) => a;'],
	[
		'invalid arrow with default value',
		'const Foo = ({ a }: { a: string } = { a: "" }) => a;',
	],
	[
		'invalid lowercase with default value',
		'const helper = (props: { a: string } = { a: "" }) => props;',
	],
	['invalid function props param', 'function Foo(props: { a: string }) { return props; }'],
	['invalid exported arrow', 'export const Foo = ({ a }: { a: string }) => a;'],
	[
		'invalid exported default function',
		'export default function Foo({ a }: { a: string }) { return a; }',
	],
	[
		'invalid function expression',
		'const Foo = function ({ a }: { a: string }) { return a; };',
	],
	[
		'invalid comments and multiline type',
		'import x from "x";\n\n// Renders foo.\n/** Docs */\nexport function Foo({ a }: {\n\ta: string;\n\tb?: number;\n}) { return a; }',
	],
	[
		'invalid existing local type name',
		'type FooProps = { b: number };\nconst Foo = ({ a }: { a: string }) => a;',
	],
	[
		'invalid imported type name',
		'import type { FooProps } from "./types";\nconst Foo = ({ a }: { a: string }) => a;',
	],
	['invalid generic function', 'function Foo<T>({ a }: { a: T }) { return a; }'],
	['invalid generic arrow', 'const Foo = <T,>({ a }: { a: T[] }) => a;'],
	[
		'invalid unused generic',
		'function Foo<T>({ a }: { a: string }) { return a; }',
	],
	[
		'invalid nested component',
		'function outer() {\n\tconst Foo = ({ a }: { a: string }) => a;\n\treturn Foo;\n}',
	],
	[
		'invalid self referencing typeof',
		'function Foo(props: { a: typeof props }) { return props; }',
	],
	[
		'index valid declared type',
		'type P = { a: string };\nfunction Foo(props: P) { return props; }',
	],
	[
		'index valid lowercase value',
		'function Foo(value: { a: string }) { return value; }',
	],
	[
		'index invalid function',
		'function Foo(props: { a: string }) { return props; }',
	],
	['index invalid arrow', 'const Foo = (props: { a: string }) => props;'],
]);

const propsTypeOrder = codeCases('props-type-order', ts, [
	['valid type literal', 'type FooProps = { a: string; b: string; onPress(): void };'],
	[
		'valid optional before callbacks',
		'type FooProps = { a: string; label?: string; onPress?(): void };',
	],
	[
		'valid interface',
		'interface FooProps { a: string; b?: string; onPress: () => void }',
	],
	['valid other name', 'interface Other { b: string; a: string }'],
	['valid single member', 'interface FooProps { a: string }'],
	[
		'valid index signature',
		'interface FooProps { [key: string]: string; b: string; a: string }',
	],
	[
		'valid word starting with on',
		'type FooProps = { a: string; overlayColor?: string; onVideoEvent?: VideoEventCallback };',
	],
	[
		'valid once is not a callback',
		'type FooProps = { a: string; once?: boolean; onPress: () => void };',
	],
	['invalid method first', 'type FooProps = { onPress(): void; b: string; a: string };'],
	[
		'invalid optional method',
		'type FooProps = { onPress?(): void; label?: string };',
	],
	[
		'invalid optional callback ordering',
		'type FooProps = { a: string; onVideoEvent?: VideoEventCallback; overlayColor?: string };',
	],
	['invalid interface alphabetical', 'interface FooProps { b: string; a: string }'],
	['invalid interface method first', 'interface FooProps { onPress(): void; a: string }'],
	[
		'invalid custom pattern',
		'interface BarModel { b: string; a: string }',
		[{ pattern: 'Model$' }],
	],
	[
		'invalid multiline',
		'type FooProps = {\n\tonPress: () => void;\n\tlabel?: string;\n\tb: string;\n\ta: string;\n};',
	],
	['invalid comma separated', 'type FooProps = {\n\tb: string,\n\ta: string\n};'],
	[
		'invalid nested object member',
		'type FooProps = {\n\tb: {\n\t\tx: number;\n\t};\n\ta: string;\n};',
	],
	['invalid line comment', 'type FooProps = {\n\t// note\n\tb: string;\n\ta: string;\n};'],
	['invalid block comment', 'interface FooProps { b: string; /* x */ a: string }'],
	[
		'index valid ordered',
		'type FooProps = { id: string; title: string; onPress: () => void; };',
	],
	[
		'index valid optional before callback',
		'type FooProps = { id: string; label?: string; onChange: () => void; };',
	],
	['index valid other name', 'type Other = { b: string; a: string; };'],
	['index valid single', 'type FooProps = { value: string; };'],
	[
		'index invalid callback first',
		'type FooProps = { onPress: () => void; title: string; };',
	],
	['index invalid alphabetical', 'type BarProps = { b: string; a: string; };'],
	[
		'index invalid optional before required',
		'type FooProps = { label?: string; id: string; };',
	],
]);

const lines = (...parts) => parts.join('\n');

const aliasComponent = (body) =>
	`type Props = { children: unknown; title?: string }; const Box = (props: Props) => { ${body} };`;

const requireChildrenUsage = codeCases('require-children-usage', tsx, [
	[
		'ownership valid nested block destructure',
		'type Props = { children: unknown }; function Box(props: Props) { if (true) { const { children } = props; return <View>{children}</View>; } return null; }',
	],
	[
		'ownership valid shadowed type in helper',
		'type Props = { title: string }; const Box = (props: Props) => null; function helper() { type Props = { children: unknown }; }',
	],
	[
		'ownership valid spread forwarding',
		lines(
			'type Props = { children: unknown };',
			'const Forwarding = (props: Props) => <View {...props} />;',
		),
	],
	[
		'ownership valid alias usage',
		lines(
			'type Props = { children: unknown };',
			'const AliasUsage = (props: Props) => {',
			'  const alias = props;',
			'  return alias.children;',
			'};',
		),
	],
	[
		'ownership valid unrelated spread',
		lines(
			'type Props = { children: unknown };',
			'const Rendering = ({ children }: Props) => <View>{children}</View>;',
			'const attrs = { accessibilityLabel: "content" };',
			'const Other = () => <View {...attrs} />;',
		),
	],
	[
		'ownership valid rest spread to view',
		lines(
			'type Props = { children: unknown; title: string };',
			'const Box = ({ title, ...rest }: Props) => <View {...rest}>{title}</View>;',
		),
	],
	[
		'ownership valid rest spread to inner',
		lines(
			'type Props = { children: unknown; title: string };',
			'const Box = ({ title, ...rest }: Props) => <Inner title={title} {...rest} />;',
		),
	],
	[
		'ownership valid cloneElement',
		lines(
			'type Props = { children: unknown };',
			'const Clone = (props: Props) => cloneElement(<View />, props);',
		),
	],
	[
		'ownership valid React.cloneElement',
		lines(
			'type Props = { children: unknown };',
			'const Clone = (props: Props) => React.cloneElement(<View />, props);',
		),
	],
	[
		'ownership valid PropsWithChildren extends',
		lines(
			'interface Props extends PropsWithChildren<{ a: string }> {}',
			'const Box = (props: Props) => props.children;',
		),
	],
	[
		'ownership invalid shadowed const type name',
		'type Props = { children: unknown }; function Box(props: Props) { const Props = 0; return null; }',
	],
	[
		'ownership invalid shadowed props block',
		'type Props = { children: unknown }; function Box(props: Props) { { const props = { children: null }; return <View>{props.children}</View>; } }',
	],
	[
		'ownership invalid shadowed type in helper',
		'type Props = { children: unknown }; const Box = (props: Props) => null; function helper() { type Props = { title: string }; }',
	],
	[
		'ownership invalid PropsWithChildren extends',
		lines(
			'interface Props extends PropsWithChildren<{ a: string }> {}',
			'const Box = (props: Props) => null;',
		),
	],
	[
		'ownership invalid React.PropsWithChildren extends',
		lines(
			'interface Props extends React.PropsWithChildren<{ a: string }> {}',
			'const Box = (props: Props) => null;',
		),
	],
	[
		'ownership invalid extends type alias base',
		lines(
			'type Base = { children: unknown };',
			'interface Props extends Base { a: string }',
			'const Box = (props: Props) => props.a;',
		),
	],
	[
		'ownership invalid extends interface base',
		lines(
			'interface Base { children: unknown }',
			'interface Props extends Base {}',
			'function Box({ a }: Props) { return a; }',
		),
	],
	[
		'ownership invalid destructured children with rest',
		lines(
			'type Props = { children: unknown; title: string };',
			'const Box = ({ children, title, ...rest }: Props) => <View {...rest}>{title}</View>;',
		),
	],
	[
		'ownership invalid rest not forwarded',
		lines(
			'type Props = { children: unknown; title: string };',
			'const Box = ({ title, ...rest }: Props) => <View>{title}</View>;',
		),
	],
	[
		'ownership invalid anonymous default function',
		lines(
			'type Props = { children: unknown };',
			'export default function ({ children }: Props) { return null; }',
		),
	],
	[
		'ownership invalid anonymous default arrow',
		lines(
			'type Props = { children: unknown };',
			'export default (props: Props) => null;',
		),
	],
	[
		'ownership invalid props logged',
		lines(
			'type Props = { children: unknown };',
			'const Log = (props: Props) => { console.log(props); return null; };',
		),
	],
	[
		'ownership invalid two components',
		lines(
			'type IgnoringProps = { children: unknown };',
			'const Ignoring = (props: IgnoringProps) => null;',
			'type RenderingProps = { children: unknown };',
			'const Rendering = (props: RenderingProps) => props.children;',
		),
	],
	[
		'ownership invalid unrelated children member',
		lines(
			'type Props = { children: unknown };',
			'const Ignoring = (props: Props) => null;',
			'const unrelated = { children: "text" };',
			'const Other = () => <View>{unrelated.children}</View>;',
		),
	],
	[
		'ownership invalid unrelated spread',
		lines(
			'type Props = { children: unknown };',
			'const Ignoring = (props: Props) => null;',
			'const attrs = { accessibilityLabel: "content" };',
			'const Other = () => <View {...attrs} />;',
		),
	],
	[
		'ownership invalid shared props type',
		lines(
			'type Props = { children: unknown };',
			'const First = ({ children }: Props) => <View>{children}</View>;',
			'const Second = (props: Props) => null;',
		),
	],
	[
		'ownership invalid nested child alias',
		lines(
			'type Props = { children: unknown };',
			'const First = (props: Props) => {',
			'  const Child = () => {',
			'    const alias = props;',
			'    return alias.children;',
			'  };',
			'  return null;',
			'};',
		),
	],
	[
		'qualified valid member does not borrow outer type',
		lines(
			'type Props = { children: unknown };',
			'namespace UI { export type Props = { title: string }; }',
			'const Box = (props: UI.Props) => null;',
		),
	],
	[
		'qualified valid unresolved member',
		lines(
			'type Props = { children: unknown };',
			'const Box = (props: Missing.Props) => null;',
		),
	],
	[
		'qualified valid imported namespace',
		lines(
			'import type * as UI from "./external";',
			'type Props = { children: unknown };',
			'const Box = (props: UI.Props) => null;',
		),
	],
	[
		'qualified valid missing local member',
		lines(
			'type Props = { children: unknown };',
			'namespace UI { export type Other = { title: string }; }',
			'const Box = (props: UI.Props) => null;',
		),
	],
	[
		'qualified valid nested member path',
		lines(
			'type Props = { children: unknown };',
			'namespace UI { export namespace Layout { export type Props = { title: string }; } }',
			'const Box = (props: UI.Layout.Props) => null;',
		),
	],
	[
		'qualified valid inner namespace shadows outer',
		lines(
			'namespace UI { export type Props = { children: unknown }; }',
			'namespace Host {',
			'  export namespace UI { export type Props = { title: string }; }',
			'  export const Box = (props: UI.Props) => null;',
			'}',
		),
	],
	[
		'qualified valid member ignores same-named local type',
		lines(
			'namespace UI { export type Props = { title: string }; }',
			'function factory() {',
			'  type Props = { children: unknown };',
			'  const Box = (props: UI.Props) => null;',
			'  return Box;',
			'}',
		),
	],
	[
		'qualified valid children property used',
		lines(
			'namespace UI { export type Props = { children: unknown }; }',
			'const Box = (props: UI.Props) => <View>{props.children}</View>;',
		),
	],
	[
		'qualified valid children binding used',
		lines(
			'namespace UI { export interface Props { children: unknown } }',
			'const Box = ({ children }: UI.Props) => <View>{children}</View>;',
		),
	],
	[
		'qualified valid custom namespace helper',
		lines(
			'namespace UI { export type PropsWithChildren<T> = { title: string }; }',
			'const Box = (props: UI.PropsWithChildren<{ title: string }>) => null;',
		),
	],
	[
		'qualified valid React helper with used children',
		'const Box = (props: React.PropsWithChildren<{ title: string }>) => props.children;',
	],
	[
		'qualified valid import-equals alias without children',
		lines(
			'type Props = { children: unknown };',
			'namespace UI { export type Props = { title: string }; }',
			'import Local = UI;',
			'const Box = (props: Local.Props) => null;',
		),
	],
	[
		'qualified invalid member declares children despite outer type',
		lines(
			'type Props = { title: string };',
			'namespace UI { export type Props = { children: unknown }; }',
			'const Box = (props: UI.Props) => null;',
		),
	],
	[
		'qualified invalid member declares children without outer type',
		lines(
			'namespace UI { export type Props = { children: unknown }; }',
			'const Box = (props: UI.Props) => null;',
		),
	],
	[
		'qualified invalid nested namespace member',
		lines(
			'namespace UI { export namespace Layout { export type Props = { children: unknown }; } }',
			'const Box = (props: UI.Layout.Props) => null;',
		),
	],
	[
		'qualified invalid dotted namespace member',
		lines(
			'namespace UI.Layout { export type Props = { children: unknown }; }',
			'const Box = (props: UI.Layout.Props) => null;',
		),
	],
	[
		'qualified invalid local alias of qualified member',
		lines(
			'namespace UI { export type Props = { children: unknown }; }',
			'type BoxProps = UI.Props;',
			'const Box = (props: BoxProps) => null;',
		),
	],
	[
		'qualified invalid import-equals alias',
		lines(
			'namespace UI { export type Props = { children: unknown }; }',
			'import Local = UI;',
			'const Box = (props: Local.Props) => null;',
		),
	],
	[
		'qualified invalid import-equals nested alias',
		lines(
			'namespace UI { export namespace Layout { export type Props = { children: unknown }; } }',
			'import Local = UI.Layout;',
			'const Box = (props: Local.Props) => null;',
		),
	],
	[
		'qualified invalid namespace declared after component',
		lines(
			'const Box = (props: UI.Props) => null;',
			'namespace UI { export type Props = { children: unknown }; }',
		),
	],
	[
		'qualified invalid namespace interface declares children',
		lines(
			'namespace UI { export interface Props { children: unknown } }',
			'const Box = (props: UI.Props) => null;',
		),
	],
	[
		'qualified invalid namespace interface extends local base',
		lines(
			'namespace UI {',
			'  export interface Base { children: unknown }',
			'  export interface Props extends Base { title: string }',
			'}',
			'const Box = (props: UI.Props) => props.title;',
		),
	],
	[
		'qualified invalid local interface extends qualified base',
		lines(
			'namespace UI { export interface Base { children: unknown } }',
			'interface Props extends UI.Base { title: string }',
			'const Box = (props: Props) => props.title;',
		),
	],
	[
		'qualified invalid member ignores shadowing local type',
		lines(
			'namespace UI { export type Props = { children: unknown }; }',
			'function factory() {',
			'  type Props = { title: string };',
			'  const Box = (props: UI.Props) => null;',
			'  return Box;',
			'}',
		),
	],
	[
		'qualified invalid inner namespace supplies children',
		lines(
			'namespace UI { export type Props = { title: string }; }',
			'namespace Host {',
			'  export namespace UI { export type Props = { children: unknown }; }',
			'  export const Box = (props: UI.Props) => null;',
			'}',
		),
	],
	[
		'qualified invalid React qualified helper',
		'const Box = (props: React.PropsWithChildren<{ title: string }>) => null;',
	],
	[
		'qualified invalid custom namespace helper declares children',
		lines(
			'namespace UI { export type PropsWithChildren = { children: unknown }; }',
			'const Box = (props: UI.PropsWithChildren) => null;',
		),
	],
	[
		'boundaries valid private namespace member',
		'type Props = { children: unknown }; namespace UI { type Props = { children: unknown }; } const Box = (props: UI.Props) => null;',
	],
	[
		'boundaries valid private nested namespace',
		'type Props = { children: unknown }; namespace UI { namespace Layout { export type Props = { children: unknown }; } } const Box = (props: UI.Layout.Props) => null;',
	],
	[
		'boundaries valid type parameter shadows namespace',
		'namespace UI { export type Props = { children: unknown }; } function factory<UI>() { const Box = (props: UI.Props) => null; return Box; }',
	],
	[
		'boundaries valid external import-equals alias',
		'import UI = require("external"); type Props = { children: unknown }; const Box = (props: UI.Props) => null;',
	],
	[
		'boundaries valid local helper spelling',
		'type PropsWithChildren<T> = { title: string }; const Box = (props: PropsWithChildren<{}>) => null;',
	],
	[
		'boundaries valid local React namespace shadows helper',
		'namespace React { export type PropsWithChildren<T> = { title: string }; } const Box = (props: React.PropsWithChildren<{}>) => null;',
	],
	[
		'boundaries valid non-React imported helper',
		'import type { PropsWithChildren } from "external"; const Box = (props: PropsWithChildren<{}>) => null;',
	],
	[
		'boundaries valid cyclic namespace aliases',
		'import First = Second; import Second = First; type Props = { children: unknown }; const Box = (props: First.Props) => null;',
	],
	[
		'boundaries invalid ambient namespace',
		'declare namespace UI { interface Props { children: unknown } } const Box = (props: UI.Props) => null;',
	],
	[
		'boundaries invalid merged namespaces',
		'namespace UI { export type Props = { children: unknown }; } namespace UI { export type Other = { title: string }; } const Box = (props: UI.Props) => null;',
	],
	[
		'boundaries invalid exported import-equals member',
		'namespace Types { export type Props = { children: unknown }; } namespace UI { export import Layout = Types; } const Box = (props: UI.Layout.Props) => null;',
	],
	[
		'boundaries invalid renamed React namespace helper',
		'import type * as R from "react"; const Box = (props: R.PropsWithChildren<{}>) => null;',
	],
	[
		'boundaries invalid renamed React helper',
		'import type { PropsWithChildren as WithChildren } from "react"; const Box = (props: WithChildren<{}>) => null;',
	],
	[
		'boundaries invalid React import-equals helper',
		'import React = require("react"); const Box = (props: React.PropsWithChildren<{}>) => null;',
	],
	[
		'merged valid exported member shadows outer type',
		'type Base = { children: unknown }; namespace UI { export type Base = { title: string }; } namespace UI { export type Props = Base; } const Box = (props: UI.Props) => null;',
	],
	[
		'merged valid private sibling member not visible',
		'namespace UI { type Base = { children: unknown }; } namespace UI { export type Props = Base; } const Box = (props: UI.Props) => null;',
	],
	[
		'merged valid current private member wins',
		'namespace UI { export type Base = { children: unknown }; } namespace UI { type Base = { title: string }; export type Props = Base; } const Box = (props: UI.Props) => null;',
	],
	[
		'merged valid external import-equals not React helper',
		'import React = require("external"); const Box = (props: React.PropsWithChildren<{}>) => null;',
	],
	[
		'merged invalid interface sees exported base',
		'namespace UI { export type Base = { children: unknown }; } namespace UI { export interface Props extends Base {} } const Box = (props: UI.Props) => null;',
	],
	[
		'merged invalid declaration sees nested namespace',
		'namespace UI { export namespace Layout { export type Props = { children: unknown }; } } namespace UI { export type Props = Layout.Props; } const Box = (props: UI.Props) => null;',
	],
	[
		'merged invalid dotted namespaces merge with nesting',
		'namespace UI { export namespace Layout { export type Base = { children: unknown }; } } namespace UI.Layout { export type Props = Base; } const Box = (props: UI.Layout.Props) => null;',
	],
	[
		'merged invalid dotted namespace sees parent exports',
		'namespace UI { export type Base = { children: unknown }; } namespace UI.Layout { export type Props = Base; } const Box = (props: UI.Layout.Props) => null;',
	],
	[
		'bindings valid private namespace does not merge',
		'namespace UI { export namespace Layout { export type Base = { children: unknown }; } } namespace UI { namespace Layout { export type Other = {}; } export type Props = Layout.Base; } const Box = (props: UI.Props) => null;',
	],
	[
		'bindings invalid public interface combines siblings',
		'namespace UI { export interface Base { children: unknown } } namespace UI { export interface Base { title: string } export type Props = Base; } const Box = (props: UI.Props) => null;',
	],
	[
		'bindings invalid public nested namespace combines siblings',
		'namespace UI { export namespace Layout { export type Base = { children: unknown }; } } namespace UI { export namespace Layout { export type Other = {}; } export type Props = Layout.Base; } const Box = (props: UI.Props) => null;',
	],
	[
		'bindings invalid implicit parent exposes dotted sibling',
		'namespace UI.Shared { export type Base = { children: unknown }; } namespace UI.Layout { export type Props = Shared.Base; } const Box = (props: UI.Layout.Props) => null;',
	],
	[
		'alias valid rest spread to view',
		aliasComponent('const { title, ...rest } = props; return <View {...rest} />;'),
	],
	[
		'alias valid rest children read',
		aliasComponent('const { title, ...rest } = props; return rest.children;'),
	],
	[
		'alias valid computed key rest children read',
		aliasComponent(
			"const { ['title']: title, ...rest } = props; return rest.children;",
		),
	],
	[
		'alias valid write then read',
		aliasComponent('props.children = null; return props.children;'),
	],
	[
		'alias invalid member of unrelated binding',
		aliasComponent('const { title } = props; return title.children;'),
	],
	[
		'alias invalid children excluded from rest',
		aliasComponent('const { children, ...rest } = props; return <View {...rest} />;'),
	],
	[
		'alias invalid computed children excluded from rest',
		aliasComponent(
			"const { ['children']: ignored, ...rest } = props; return <View {...rest} />;",
		),
	],
	['alias invalid write only', aliasComponent('props.children = null; return null;')],
	['alias invalid delete', aliasComponent('delete props.children; return null;')],
	[
		'alias invalid array destructuring write',
		aliasComponent('[props.children] = [null]; return null;'),
	],
	[
		'index valid props.children',
		'type P = { children: unknown };\nconst Foo = (props: P) => props.children;',
	],
	[
		'index valid inline children',
		'function Foo({ children }: { children: unknown }) { return children; }',
	],
	[
		'index valid no children',
		'type P = { title: string };\nconst Foo = (props: P) => props.title;',
	],
	[
		'index valid PropsWithChildren used',
		'import type { PropsWithChildren } from "react";\nconst Foo = (props: PropsWithChildren) => props.children;',
	],
	[
		'index invalid children unused',
		'type P = { children: unknown };\nconst Foo = (props: P) => null;',
	],
	[
		'index invalid PropsWithChildren unused',
		'import type { PropsWithChildren } from "react";\nconst Foo = (props: PropsWithChildren) => null;',
	],
]);

const cases = [
	...defaultExportPlacement,
	...kebabCaseFilenames,
	...noCrossFeatureImports,
	...noInlineProps,
	...propsTypeOrder,
	...requireChildrenUsage,
];

module.exports = { cases, loadOriginalPlugin };
