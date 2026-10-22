// Cases for the expo-magic-reanimated port: the 5.x RuleTester suite
// (utils/reanimated.test.ts), the index.test.ts and test-project fixtures that
// exercise it, and focused cases for the remaining branches. Recorded with
// scripts/record-port-expectations.js.

const fs = require('node:fs');
const path = require('node:path');

const rule = 'no-shared-value-misuse';
const fixtureDir = path.resolve(__dirname, '../../../../test-project');
const lines = (...parts) => parts.join('\n');
const header = "import { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';";

function loadOriginalPlugin() {
	const reanimated = require(
		path.resolve(
			__dirname,
			'../../../eslint-config-expo-magic/utils/reanimated.js',
		),
	);

	return { rules: { [rule]: reanimated.sharedValueUsageRule } };
}

const entries = [
	[
		'valid foreign values and Map.get',
		lines(
			header,
			'const model = { value: 1 };',
			'const values = new Map<string, number>();',
			'export function Example() {',
			'\tconst source = useSharedValue(values.get("x") ?? model.value);',
			'\tconst style = useAnimatedStyle(() => ({ opacity: model.value, x: values.get("x") ?? 0 }));',
			'\treturn [source, style];',
			'}',
		),
	],
	[
		'valid other library',
		lines(
			"import { useSharedValue } from 'other-library';",
			'const model = { value: 1, get: () => 1 };',
			'const source = useSharedValue(model.value);',
			'const other = useSharedValue(model.get());',
			'export { other, source };',
		),
	],
	[
		'valid shadowed hook name',
		lines(
			"import { useSharedValue } from 'react-native-reanimated';",
			'function build(useSharedValue: (value: number) => number) {',
			'\tconst model = { value: 1 };',
			'\treturn useSharedValue(model.value);',
			'}',
			'export { build, useSharedValue };',
		),
	],
	[
		'valid animated style result is not a shared value',
		lines(
			header,
			'export function Example() {',
			'\tconst style = useAnimatedStyle(() => ({ value: 1 }));',
			'\treturn useSharedValue(style.value);',
			'}',
		),
	],
	[
		'valid animated reaction result is not a shared value',
		lines(
			"import { useAnimatedReaction, useSharedValue } from 'react-native-reanimated';",
			'export function Example() {',
			'\tconst source = useSharedValue(0);',
			'\tconst reaction = useAnimatedReaction(() => source.value, () => { });',
			'\treturn useSharedValue(reaction.value);',
			'}',
		),
	],
	[
		'invalid renamed imports',
		lines(
			"import { useAnimatedStyle as useStyle, useSharedValue as useSV } from 'react-native-reanimated';",
			'export function Example() {',
			'\tconst source = useSV(0);',
			'\tconst alias = source;',
			'\tconst fromGet = useSV(source.get());',
			'\tconst fromValue = useSV(alias.value);',
			'\tconst style = useStyle(() => ({ opacity: source.get() }));',
			'\treturn [fromGet, fromValue, style];',
			'}',
		),
	],
	[
		'invalid SharedValue type annotation',
		lines(
			"import type { SharedValue as Shared } from 'react-native-reanimated';",
			"import { useSharedValue } from 'react-native-reanimated';",
			'export function clone(source: Shared<number>) {',
			'\treturn useSharedValue(source.get());',
			'}',
		),
	],
	[
		'invalid namespace import',
		lines(
			"import * as Reanimated from 'react-native-reanimated';",
			'export function Example() {',
			'\tconst source = Reanimated.useSharedValue(0);',
			'\treturn Reanimated.useAnimatedStyle(() => ({ opacity: source.get() }));',
			'}',
		),
	],
	[
		'index flags shared value reads and hook get',
		lines(
			"import { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';",
			'declare function usePanGesture(cfg: object): object;',
			'export function build() {',
			'\tconst source = useSharedValue(0);',
			'\tconst alias = source;',
			'\tconst fromGet = useSharedValue(source.get());',
			'\tconst fromValue = useSharedValue(alias.value);',
			'\tconst style = useAnimatedStyle(() => ({ x: source.get() }));',
			'\tconst gesture = usePanGesture({ onStart: () => {} });',
			'\treturn [fromGet, fromValue, style, gesture];',
			'}',
		),
	],
	[
		'index composes with worklets',
		lines(
			"import { useSharedValue } from 'react-native-reanimated';",
			'declare function scheduleOnRN(callback: () => void): void;',
			'export function build() {',
			'\tconst source = useSharedValue(0);',
			'\tconst shared = useSharedValue(source.value);',
			'\tscheduleOnRN(() => {});',
			'\treturn shared;',
			'}',
		),
	],
	[
		'type namespace qualified SharedValue',
		lines(
			"import type * as R from 'react-native-reanimated';",
			"import { useSharedValue } from 'react-native-reanimated';",
			'export function clone(source: R.SharedValue<number>) {',
			'\treturn useSharedValue(source.value);',
			'}',
		),
	],
	[
		'type namespace qualified DerivedValue',
		lines(
			"import type * as R from 'react-native-reanimated';",
			"import { useSharedValue } from 'react-native-reanimated';",
			'export function clone(source: R.DerivedValue<number>) {',
			'\treturn useSharedValue(source.get());',
			'}',
		),
	],
	[
		'type namespace qualified other type',
		lines(
			"import type * as R from 'react-native-reanimated';",
			"import { useSharedValue } from 'react-native-reanimated';",
			'export function clone(source: R.Other<number>) {',
			'\treturn useSharedValue(source.value);',
			'}',
		),
	],
	[
		'type from other namespace is not shared value',
		lines(
			"import type * as R from 'other-library';",
			"import { useSharedValue } from 'react-native-reanimated';",
			'export function clone(source: R.SharedValue<number>) {',
			'\treturn useSharedValue(source.value);',
			'}',
		),
	],
	[
		'type union with SharedValue',
		lines(
			"import type { SharedValue } from 'react-native-reanimated';",
			"import { useSharedValue } from 'react-native-reanimated';",
			'export function clone(source: SharedValue<number> | number) {',
			'\treturn useSharedValue(source.value);',
		'}',
		),
	],
	[
		'type intersection with SharedValue',
		lines(
			"import type { SharedValue } from 'react-native-reanimated';",
			"import { useSharedValue } from 'react-native-reanimated';",
			'export function clone(source: SharedValue<number> & { extra: 1 }) {',
			'\treturn useSharedValue(source.value);',
			'}',
		),
	],
	[
		'type parenthesized SharedValue',
		lines(
			"import type { SharedValue } from 'react-native-reanimated';",
			"import { useSharedValue } from 'react-native-reanimated';",
			'export function clone(source: (SharedValue<number>)) {',
			'\treturn useSharedValue(source.value);',
			'}',
		),
	],
	[
		'type array of SharedValue is not shared value',
		lines(
			"import type { SharedValue } from 'react-native-reanimated';",
			"import { useSharedValue } from 'react-native-reanimated';",
			'export function clone(source: SharedValue<number>[]) {',
			'\treturn useSharedValue(source.value);',
			'}',
		),
	],
	[
		'type SharedValue from other module',
		lines(
			"import type { SharedValue } from 'other-library';",
			"import { useSharedValue } from 'react-native-reanimated';",
			'export function clone(source: SharedValue<number>) {',
			'\treturn useSharedValue(source.value);',
			'}',
		),
	],
	[
		'type DerivedValue',
		lines(
			"import type { DerivedValue } from 'react-native-reanimated';",
			"import { useSharedValue } from 'react-native-reanimated';",
			'export function clone(source: DerivedValue<number>) {',
			'\treturn useSharedValue(source.value);',
			'}',
		),
	],
	[
		'useDerivedValue is a shared value',
		lines(
			"import { useDerivedValue, useSharedValue } from 'react-native-reanimated';",
			'export function Example() {',
			'\tconst base = useSharedValue(0);',
			'\tconst derived = useDerivedValue(() => base.value);',
			'\treturn useSharedValue(derived.value);',
			'}',
		),
	],
	[
		'useDerivedValue get inside useDerivedValue',
		lines(
			"import { useDerivedValue, useSharedValue } from 'react-native-reanimated';",
			'export function Example() {',
			'\tconst base = useSharedValue(0);',
			'\treturn useDerivedValue(() => base.get() + 1);',
			'}',
		),
	],
	[
		'value read inside worklet hooks is allowed',
		lines(
			header,
			'export function Example() {',
			'\tconst base = useSharedValue(0);',
			'\treturn useAnimatedStyle(() => ({ opacity: base.value }));',
			'}',
		),
	],
	[
		'get inside useAnimatedReaction',
		lines(
			"import { useAnimatedReaction, useSharedValue } from 'react-native-reanimated';",
			'export function Example() {',
			'\tconst base = useSharedValue(0);',
			'\tuseAnimatedReaction(() => base.get(), () => {});',
			'}',
		),
	],
	[
		'get inside useAnimatedProps',
		lines(
			"import { useAnimatedProps, useSharedValue } from 'react-native-reanimated';",
			'export function Example() {',
			'\tconst base = useSharedValue(0);',
			'\treturn useAnimatedProps(() => ({ opacity: base.get() }));',
			'}',
		),
	],
	[
		'get outside worklet hooks is allowed',
		lines(
			"import { useSharedValue } from 'react-native-reanimated';",
			'export function Example() {',
			'\tconst base = useSharedValue(0);',
			'\tconst read = () => base.get();',
			'\treturn read;',
			'}',
		),
	],
	[
		'get reference without a call is allowed',
		lines(
			header,
			'export function Example() {',
			'\tconst base = useSharedValue(0);',
			'\treturn useAnimatedStyle(() => ({ read: base.get }));',
			'}',
		),
	],
	[
		'computed get call inside worklet hook',
		lines(
			header,
			'export function Example() {',
			'\tconst base = useSharedValue(0);',
			"\treturn useAnimatedStyle(() => ({ opacity: base['get']() }));",
			'}',
		),
	],
	[
		'computed value read in initializer',
		lines(
			header,
			'export function Example() {',
			'\tconst base = useSharedValue(0);',
			"\treturn useSharedValue(base['value']);",
			'}',
		),
	],
	[
		'dynamic computed member is ignored',
		lines(
			header,
			'export function Example(key: string) {',
			'\tconst base = useSharedValue(0);',
			'\treturn useSharedValue(base[key]);',
			'}',
		),
	],
	[
		'type assertion wrappers around hook and object',
		lines(
			header,
			'export function Example() {',
			'\tconst base = (useSharedValue as any)(0);',
			'\tconst copy = useSharedValue((base as any).value);',
			'\tconst nonNull = useSharedValue(base!.value);',
			'\tconst satisfied = useSharedValue((base satisfies object as any).value);',
			'\treturn [copy, nonNull, satisfied];',
			'}',
		),
	],
	[
		'optional chain on shared value',
		lines(
			header,
			'export function Example() {',
			'\tconst base = useSharedValue(0);',
			'\treturn useSharedValue(base?.value);',
			'}',
		),
	],
	[
		'shared value initialized with wrapped call',
		lines(
			header,
			'export function Example() {',
			'\tconst base = useSharedValue(0) as any;',
			'\treturn useSharedValue(base.value);',
			'}',
		),
	],
	[
		'destructured declarator is not tracked',
		lines(
			header,
			'export function Example() {',
			'\tconst { base } = { base: useSharedValue(0) };',
			'\treturn useSharedValue(base.value);',
			'}',
		),
	],
	[
		'declarator without initializer',
		lines(
			header,
			'export function Example() {',
			'\tlet base;',
			'\treturn useSharedValue(base.value);',
			'}',
		),
	],
	[
		'alias chain of shared values',
		lines(
			header,
			'export function Example() {',
			'\tconst first = useSharedValue(0);',
			'\tconst second = first;',
			'\tconst third = second;',
			'\treturn useSharedValue(third.value);',
			'}',
		),
	],
	[
		'alias declared before its source',
		lines(
			header,
			'export function Example() {',
			'\tconst second = first;',
			'\tconst first = useSharedValue(0);',
			'\treturn useSharedValue(second.value);',
			'}',
		),
	],
	[
		'shared value parameter via nested hook argument',
		lines(
			header,
			'export function Example() {',
			'\tconst base = useSharedValue(0);',
			'\treturn useSharedValue(Math.max(base.value, 1));',
			'}',
		),
	],
	[
		'import with string literal name',
		lines(
			"import { useSharedValue as useSV, 'useAnimatedStyle' as useStyle } from 'react-native-reanimated';",
			'export function Example() {',
			'\tconst base = useSV(0);',
			'\treturn useStyle(() => ({ opacity: base.get() }));',
			'}',
		),
	],
	[
		'default import is ignored',
		lines(
			"import Reanimated from 'react-native-reanimated';",
			'export function Example() {',
			'\tconst base = Reanimated.useSharedValue(0);',
			'\treturn Reanimated.useSharedValue(base.value);',
			'}',
		),
	],
	[
		'namespace computed member call',
		lines(
			"import * as R from 'react-native-reanimated';",
			'export function Example() {',
			"\tconst base = R['useSharedValue'](0);",
			'\treturn R.useSharedValue(base.value);',
			'}',
		),
	],
	[
		'namespace dynamic member is ignored',
		lines(
			"import * as R from 'react-native-reanimated';",
			'export function Example(name: string) {',
			'\tconst base = R.useSharedValue(0);',
			'\treturn R[name](base.value);',
			'}',
		),
	],
	[
		'callee that is not an identifier or member',
		lines(
			header,
			'export function Example(factory: () => any) {',
			'\tconst base = useSharedValue(0);',
			'\treturn factory()(base.value);',
			'}',
		),
	],
	[
		'plain call outside hooks',
		lines(
			header,
			'export function Example() {',
			'\tconst base = useSharedValue(0);',
			'\treturn console.log(base.value, base.get());',
			'}',
		),
	],
	[
		'worklet hook with shared value read after callback',
		lines(
			header,
			'export function Example() {',
			'\tconst base = useSharedValue(0);',
			'\treturn useAnimatedStyle(() => ({}), [base.get()]);',
			'}',
		),
	],
	[
		'both messages in one file',
		lines(
			header,
			'export function Example() {',
			'\tconst base = useSharedValue(0);',
			'\tconst style = useAnimatedStyle(() => ({ a: base.get(), b: useSharedValue(base.get()) }));',
			'\treturn style;',
			'}',
		),
	],
	[
		'tsx component',
		lines(
			header,
			'export function Box() {',
			'\tconst base = useSharedValue(0);',
			'\tconst other = useSharedValue(base.value);',
			'\treturn <View>{other.value}</View>;',
			'}',
		),
		'a.tsx',
	],
];

const focused = entries.map(([title, code, filename]) => ({
	name: `${rule}: ${title}`,
	rule,
	code,
	filename: filename ?? 'a.ts',
}));

const fixtureFiles = ['preset-fixtures/reanimated.tsx'];

const fixtures = fixtureFiles.map((file) => ({
	name: `${rule}: test-project/${file}`,
	rule,
	code: fs.readFileSync(path.join(fixtureDir, file), 'utf8'),
	filename: file,
}));

const cases = [...focused, ...fixtures];

module.exports = { cases, loadOriginalPlugin };
