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
	],
	invalid: [
		{
			code: 'const Foo = () => null;\nBar.displayName = "Bar";\nexport default Foo;',
			errors: [{ messageId: 'placement' }],
		},
		{
			code: 'const Foo = () => null;\nFoo.displayName = "Foo";\nconst helper = 1;\nexport default Foo;',
			errors: [{ messageId: 'placement' }],
		},
		{
			code: 'const Foo = () => null;\nregister(Foo);\nexport default Foo;',
			errors: [{ messageId: 'placement' }],
		},
	],
});
