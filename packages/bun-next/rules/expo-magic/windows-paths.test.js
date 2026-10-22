// The rule harness lints real files on POSIX, so it cannot hand a rule a
// Windows filename. These cases, carried over from the 5.x RuleTester tests,
// call the rules directly with one.

const { expect, test } = require('bun:test');

const kebabCaseFilenames = require('./rules/kebab-case-filenames.js');
const noCrossFeatureImports = require('./rules/no-cross-feature-imports.js');

function run(rule, filename, visit) {
	const reports = [];
	const visitors = rule.create({
		filename,
		options: [],
		report: (descriptor) => reports.push(descriptor.messageId),
	});
	visit(visitors);

	return reports;
}

const program = (visitors) => visitors.Program?.({ type: 'Program' });
const importFrom = (source) => (visitors) =>
	visitors.ImportDeclaration?.({
		type: 'ImportDeclaration',
		source: { type: 'Literal', value: source },
	});

test('kebab-case-filenames accepts a kebab-case Windows path', () => {
	expect(run(kebabCaseFilenames, 'C:\\r\\src\\home-screen.tsx', program)).toEqual(
		[],
	);
});

test('kebab-case-filenames reports a PascalCase Windows path', () => {
	expect(run(kebabCaseFilenames, 'C:\\r\\src\\MyFile.tsx', program)).toEqual([
		'notKebab',
	]);
});

const billingFile = 'C:\\r\\src\\features\\billing\\screens\\a.ts';

test('no-cross-feature-imports allows a contracts import from a Windows path', () => {
	expect(
		run(
			noCrossFeatureImports,
			billingFile,
			importFrom('../../auth/contracts/session'),
		),
	).toEqual([]);
});

test('no-cross-feature-imports reports a cross-feature import from a Windows path', () => {
	expect(
		run(noCrossFeatureImports, billingFile, importFrom('../../auth/total')),
	).toEqual(['crossFeature']);
});
