import { describe, it } from 'bun:test';
import type { Rule } from 'eslint';

const eslint: typeof import('eslint') = require('eslint');
const tsParser: typeof import('@typescript-eslint/parser') = require('@typescript-eslint/parser');
const rule: Rule.RuleModule = require('./default-export-placement.js');

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

ruleTester.run('default-export-placement', rule, {
	valid: [
		'function Foo() { return null; }\nFoo.displayName = "Foo";\nexport default Foo;',
		'const Foo = () => null;\nFoo.displayName = "Foo";\nFoo.defaultProps = {};\nexport default Foo;',
		'const Foo = () => null;\nexport default Foo;',
		'const Foo = () => null;\nconst styles = {};\nexport default function Bar() { return Foo; }',
	],
	invalid: [
		{
			code: 'const Foo = () => null;\nBar.displayName = "Bar";\nexport default Foo;',
			output: 'const Foo = () => null;\nexport default Foo;\nBar.displayName = "Bar";',
			errors: [{ messageId: 'placement' }],
		},
		{
			code: 'const Foo = () => null;\nFoo.displayName = "Foo";\nconst helper = 1;\nexport default Foo;',
			output:
				'const Foo = () => null;\nFoo.displayName = "Foo";\nexport default Foo;\nconst helper = 1;',
			errors: [{ messageId: 'placement' }],
		},
		{
			code: 'const Foo = () => null;\nregister(Foo);\nexport default Foo;',
			output: 'const Foo = () => null;\nexport default Foo;\nregister(Foo);',
			errors: [{ messageId: 'placement' }],
		},
		{
			code: 'export default Foo;\nconst Foo = () => null;\nFoo.displayName = "Foo";\nconst x = 1;',
			output:
				'const Foo = () => null;\nFoo.displayName = "Foo";\nexport default Foo;\nconst x = 1;',
			errors: [{ messageId: 'placement' }],
		},
		{
			code: 'const Foo = () => null; // component\nconst styles = {};\nexport default Foo;',
			output:
				'const Foo = () => null; // component\nexport default Foo;\nconst styles = {};',
			errors: [{ messageId: 'placement' }],
		},
		{
			code: 'const Foo = () => null;\nconst styles = {};\n// the entry\nexport default Foo;',
			output: null,
			errors: [{ messageId: 'placement' }],
		},
		{
			code: 'const Foo = () => null;\nconst styles = {};\nexport default Foo; // entry',
			output: null,
			errors: [{ messageId: 'placement' }],
		},
	],
});
