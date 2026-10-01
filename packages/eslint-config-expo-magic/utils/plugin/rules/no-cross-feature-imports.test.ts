import { describe, it } from 'bun:test';
import type { Rule } from 'eslint';

const eslint: typeof import('eslint') = require('eslint');
const tsParser: typeof import('@typescript-eslint/parser') = require('@typescript-eslint/parser');
const rule: Rule.RuleModule = require('./no-cross-feature-imports.js');

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

const billingFile = '/r/src/features/billing/screens/a.ts';

ruleTester.run('no-cross-feature-imports', rule, {
	valid: [
		{
			code: "import x from '@/../features/auth/private';",
			filename: billingFile,
		},
		{
			code: "import x from '@/features/auth/../billing/private';",
			filename: billingFile,
		},
		{
			code: "import x from '@/features/auth/internal/../contracts/session';",
			filename: billingFile,
		},
		{ code: "import x from './total';", filename: billingFile },
		{ code: "import x from '../hooks/use-total';", filename: billingFile },
		{
			code: "import x from '@/features/billing/hooks';",
			filename: billingFile,
		},
		{
			code: "import x from '@/features/auth/contracts/session';",
			filename: billingFile,
		},
		{
			code: "import x from '../../auth/contracts/session';",
			filename: billingFile,
		},
		{
			code: "import x from '../../../lib/features/flags';",
			filename: billingFile,
		},
		{ code: "import x from '@/lib/features/flags';", filename: billingFile },
		{
			code: "import x from '../features/auth/total';",
			filename: '/r/src/lib/a.ts',
		},
		{
			code: "import x from '../../../../other/features/auth/total';",
			filename: billingFile,
		},
		{
			code: "const x = import('../../auth/contracts/session');",
			filename: billingFile,
		},
		{
			code: "import x from '../../auth/contracts/session';",
			filename: 'C:\\r\\src\\features\\billing\\screens\\a.ts',
		},
		{
			code: "import x from '../../auth/total';",
			filename: '/r/src/features/billing/screens/a.test.ts',
			options: [{ srcRoot: 'app' }],
		},
	],
	invalid: [
		...[
			'@/features/auth/contracts/../private',
			'@/features/billing/../auth/private',
			'@/lib/../features/auth/private',
		].map((source) => ({
			code: `import x from '${source}';`,
			filename: billingFile,
			errors: [{ messageId: 'crossFeature' }],
		})),
		{
			code: "import x from '../billing/total';",
			filename: '/repo/apps/mobile/src/features/cart/cart.ts',
			options: [{ srcRoot: 'apps/mobile/src' }],
			errors: [{ messageId: 'crossFeature' }],
		},
		{
			code: "import x from '@/features/auth/hooks/use-session';",
			filename: billingFile,
			errors: [{ messageId: 'crossFeature' }],
		},
		{
			code: "import x from '../../auth/hooks/use-session';",
			filename: billingFile,
			errors: [{ messageId: 'crossFeature' }],
		},
		{
			code: "export * from '../../auth/total';",
			filename: billingFile,
			errors: [{ messageId: 'crossFeature' }],
		},
		{
			code: "export { total } from '@/features/auth/total';",
			filename: billingFile,
			errors: [{ messageId: 'crossFeature' }],
		},
		{
			code: "const x = import('@/features/auth/total');",
			filename: billingFile,
			errors: [{ messageId: 'crossFeature' }],
		},
		{
			code: "import x from '../../auth/total';",
			filename: 'C:\\r\\src\\features\\billing\\screens\\a.ts',
			errors: [{ messageId: 'crossFeature' }],
		},
		{
			code: "import x from '~/features/auth/total';",
			filename: billingFile,
			options: [{ aliasPrefix: '~' }],
			errors: [{ messageId: 'crossFeature' }],
		},
	],
});
