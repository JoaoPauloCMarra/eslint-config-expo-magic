// Compares a rule port, run through `bun lint`, with what the original ESLint
// plugin reported for the same cases (rules/__expectations__/<plugin>.json).

const { beforeAll, describe, expect, test } = require('bun:test');
const path = require('node:path');
const { runCases } = require('./rule-harness.js');

// A reviewed divergence `{ reason, output: 'source' }` records that Bun skips
// a fix the original applied: ESLint's result would not parse.
function expectedOutput(testCase) {
	if (testCase.divergence?.output !== 'source') return testCase.output;

	return Object.fromEntries(
		testCase.lint.map((file) => [file, testCase.files[file]]),
	);
}

function checkPort(plugin, pluginPath) {
	const port = require(pluginPath);
	const { meta, cases } = require(
		path.join(__dirname, '__expectations__', `${plugin}.json`),
	);
	let actual;

	beforeAll(() => {
		actual = runCases({ plugin, pluginPath, cases });
	}, 600_000);

	// Ports may drop docs, options or messages they never use (unused-imports
	// only reimplements the import half); what they keep must match.
	describe(`${plugin} meta`, () => {
		for (const [rule, originalMeta] of Object.entries(meta)) {
			test(`${rule} meta matches the original plugin`, () => {
				const portMeta = port.rules[rule].meta;

				expect(portMeta.type).toBe(originalMeta.type);
				expect(portMeta.fixable).toBe(originalMeta.fixable);
				expect(originalMeta.messages ?? {}).toMatchObject(
					portMeta.messages ?? {},
				);
			});
		}
	});

	describe(`${plugin} cases`, () => {
		for (const testCase of cases) {
			test(testCase.name, () => {
				if (testCase.divergence) {
					expect(testCase.output).not.toEqual(expectedOutput(testCase));
				}
				expect(actual[testCase.name]).toEqual({
					messages: testCase.messages,
					output: expectedOutput(testCase),
				});
			});
		}
	});
}

module.exports = { checkPort };
