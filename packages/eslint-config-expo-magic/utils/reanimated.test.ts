import { describe, expect, it } from 'bun:test';
import type { Rule } from 'eslint';

const eslint: typeof import('eslint') = require('eslint');
const tsParser: typeof import('@typescript-eslint/parser') = require('@typescript-eslint/parser');
const reanimated: {
	createRestrictedSyntaxGroups: (options?: {
		additionalGestureHooks?: string[];
		gestureHooks?: string[];
	}) => Array<{
		files: string[];
		selectors: Array<{ message: string; selector: string }>;
	}>;
	sharedValueUsageRule: Rule.RuleModule;
} = require('./reanimated.js');

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

ruleTester.run(
	'reanimated SharedValue provenance',
	reanimated.sharedValueUsageRule,
	{
		valid: [
			[
				"import { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';",
				'const model = { value: 1 };',
				'const values = new Map<string, number>();',
				'export function Example() {',
				'\tconst source = useSharedValue(values.get("x") ?? model.value);',
				'\tconst style = useAnimatedStyle(() => ({ opacity: model.value, x: values.get("x") ?? 0 }));',
				'\treturn [source, style];',
				'}',
			].join('\n'),
			[
				"import { useSharedValue } from 'other-library';",
				'const model = { value: 1, get: () => 1 };',
				'const source = useSharedValue(model.value);',
				'const other = useSharedValue(model.get());',
				'export { other, source };',
			].join('\n'),
			[
				"import { useSharedValue } from 'react-native-reanimated';",
				'function build(useSharedValue: (value: number) => number) {',
				'\tconst model = { value: 1 };',
				'\treturn useSharedValue(model.value);',
				'}',
				'export { build, useSharedValue };',
			].join('\n'),
			[
				"import { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';",
				'export function Example() {',
				'\tconst style = useAnimatedStyle(() => ({ value: 1 }));',
				'\treturn useSharedValue(style.value);',
				'}',
			].join('\n'),
			[
				"import { useAnimatedReaction, useSharedValue } from 'react-native-reanimated';",
				'export function Example() {',
				'\tconst source = useSharedValue(0);',
				'\tconst reaction = useAnimatedReaction(() => source.value, () => { });',
				'\treturn useSharedValue(reaction.value);',
				'}',
			].join('\n'),
		],
		invalid: [
			{
				code: [
					"import { useAnimatedStyle as useStyle, useSharedValue as useSV } from 'react-native-reanimated';",
					'export function Example() {',
					'\tconst source = useSV(0);',
					'\tconst alias = source;',
					'\tconst fromGet = useSV(source.get());',
					'\tconst fromValue = useSV(alias.value);',
					'\tconst style = useStyle(() => ({ opacity: source.get() }));',
					'\treturn [fromGet, fromValue, style];',
					'}',
				].join('\n'),
				errors: [
					{ messageId: 'initializeFromSharedValue' },
					{ messageId: 'initializeFromSharedValue' },
					{ messageId: 'getInWorklet' },
				],
			},
			{
				code: [
					"import type { SharedValue as Shared } from 'react-native-reanimated';",
					"import { useSharedValue } from 'react-native-reanimated';",
					'export function clone(source: Shared<number>) {',
					'\treturn useSharedValue(source.get());',
					'}',
				].join('\n'),
				errors: [{ messageId: 'initializeFromSharedValue' }],
			},
			{
				code: [
					"import * as Reanimated from 'react-native-reanimated';",
					'export function Example() {',
					'\tconst source = Reanimated.useSharedValue(0);',
					'\treturn Reanimated.useAnimatedStyle(() => ({ opacity: source.get() }));',
					'}',
				].join('\n'),
				errors: [{ messageId: 'getInWorklet' }],
			},
		],
	},
);

describe('reanimated restricted syntax composition', () => {
	it('keeps gesture restrictions separate from SharedValue provenance', () => {
		const [group] = reanimated.createRestrictedSyntaxGroups();

		expect(group?.selectors).toHaveLength(1);
		expect(group?.selectors[0]?.selector).toContain('usePanGesture');
	});
});
