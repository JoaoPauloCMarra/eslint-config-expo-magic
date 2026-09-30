import { describe, it } from 'bun:test';
import type { Rule } from 'eslint';

const eslint: typeof import('eslint') = require('eslint');
const tsParser: typeof import('@typescript-eslint/parser') = require('@typescript-eslint/parser');
const rule: Rule.RuleModule = require('./kebab-case-filenames.js');

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

const code = 'export {};';

ruleTester.run('kebab-case-filenames', rule, {
	valid: [
		{ code, filename: '/r/src/home-screen.tsx' },
		{ code, filename: '/r/src/use-home-screen.test.ts' },
		{ code, filename: '/r/app/index.tsx' },
		{ code, filename: '/r/app/_layout.tsx' },
		{ code, filename: '/r/app/+not-found.tsx' },
		{ code, filename: '/r/app/+html.tsx' },
		{ code, filename: '/r/app/[id].tsx' },
		{ code, filename: '/r/app/[userId].tsx' },
		{ code, filename: '/r/app/[...slug].tsx' },
		{ code, filename: '/r/app/[...Slug].tsx' },
		{ code, filename: '/r/app/(tabs).tsx' },
		{ code, filename: '/r/app/(Tabs).tsx' },
		{ code, filename: '/r/.eslintrc.js' },
		{ code, filename: 'C:\\r\\src\\home-screen.tsx' },
		{
			code,
			filename: '/r/src/[userId].tsx',
			options: [{ ignore: ['^\\+.*', '^\\[.*\\]'] }],
		},
		{
			code,
			filename: '/r/src/LegacyModule.tsx',
			options: [{ ignore: ['^Legacy'] }],
		},
	],
	invalid: [
		{
			code,
			filename: '/r/src/HomeScreen.tsx',
			errors: [{ messageId: 'notKebab', data: { name: 'HomeScreen.tsx', suggestion: 'home-screen' } }],
		},
		{
			code,
			filename: 'C:\\r\\src\\MyFile.tsx',
			errors: [{ messageId: 'notKebab' }],
		},
		{
			code,
			filename: '/r/src/snake_case.ts',
			errors: [{ messageId: 'notKebab' }],
		},
		{
			code,
			filename: '/r/src/+NotFound-screen/HomeScreen.tsx',
			errors: [{ messageId: 'notKebab' }],
		},
		{
			code,
			filename: '/r/src/LegacyModule.tsx',
			options: [{ ignore: ['^Other'] }],
			errors: [{ messageId: 'notKebab' }],
		},
	],
});
