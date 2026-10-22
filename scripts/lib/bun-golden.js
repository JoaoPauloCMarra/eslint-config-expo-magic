const crypto = require('node:crypto');
const path = require('node:path');

const lintableFile = /\.(?:[cm]?[jt]sx?)$/;
const goldenDir = 'bun-golden/';

function selectGoldenFiles(trackedFiles) {
	return trackedFiles
		.filter((file) => lintableFile.test(file) && !file.startsWith(goldenDir))
		.sort();
}

function hashText(text) {
	return crypto.createHash('sha256').update(text).digest('hex');
}

// ESLint warns about explicitly passed files that no config matches; those
// carry no rule and are not findings.
function isFinding(message) {
	return message.ruleId !== null || message.fatal === true;
}

function goldenFromResults({ profile, results, rootDir }) {
	const findings = [];
	const fixes = {};

	for (const result of results) {
		const file = path.relative(rootDir, result.filePath);

		for (const message of result.messages.filter(isFinding)) {
			findings.push(
				`${file}:${message.line}:${message.column} ${message.ruleId} ${message.severity}`,
			);
		}
		if (typeof result.output === 'string')
			fixes[file] = hashText(result.output);
	}

	return { profile, findings: findings.sort(), fixes };
}

const eslintPrefixes = {
	typescript: '@typescript-eslint',
	import: 'import-x',
};

// oxlint codes look like `react(display-name)`; core rules use `eslint(...)`.
// Semantic parse errors have no code and match ESLint's fatal `null` rule.
function normalizeBunRuleId(code) {
	if (!code) return 'null';

	const match = /^(.+)\((.+)\)$/.exec(code);
	if (!match) return code;

	const [, plugin, rule] = match;
	if (plugin === 'eslint') return rule;
	if (plugin === 'bun' && rule === 'format') return 'prettier/prettier';

	return `${eslintPrefixes[plugin] ?? plugin}/${rule}`;
}

const typeScriptFile = /\.[cm]?tsx?$/;

// oxlint files react-hooks rules under `react` and reports typescript-eslint
// extension rules under their core name. Use the name the golden data knows.
function goldenRuleName(ruleId, filename, goldenRules) {
	const typeScriptName = `@typescript-eslint/${ruleId}`;
	if (typeScriptFile.test(filename) && goldenRules.has(typeScriptName)) {
		return typeScriptName;
	}
	if (goldenRules.has(ruleId)) return ruleId;

	const hooksName = ruleId.replace(/^react\//, 'react-hooks/');

	return goldenRules.has(hooksName) ? hooksName : ruleId;
}

function bunFindingKeys(report, goldenRules) {
	return report.diagnostics.map((diagnostic) => {
		const { line, column } = diagnostic.labels[0].span;
		const severity = diagnostic.severity === 'error' ? 2 : 1;
		const ruleId = goldenRuleName(
			normalizeBunRuleId(diagnostic.code),
			diagnostic.filename,
			goldenRules,
		);

		return `${diagnostic.filename}:${line}:${column} ${ruleId} ${severity}`;
	});
}

function countByRule(keys) {
	const counts = new Map();

	for (const key of keys) {
		const rule = key.split(' ')[1];
		counts.set(rule, (counts.get(rule) ?? 0) + 1);
	}

	return [...counts].sort((a, b) => b[1] - a[1]);
}

// Fixtures in invalid-syntax/ hold code TypeScript rejects. ESLint still lints
// them; Bun must report a parse error instead.
const invalidSyntaxDir = 'invalid-syntax/';

function fileOf(key) {
	return key.split(' ')[0].split(':')[0];
}

// `a.ts:3:1 rule 2` -> `a.ts rule 2`. oxlint implementations report some rules
// on another node or a different number of times (import/no-duplicates once
// per module), so the gate is whether each rule fires in each file.
function pairCounts(keys) {
	const counts = new Map();

	for (const key of keys) {
		const [, ...rest] = key.split(' ');
		const pair = [fileOf(key), ...rest].join(' ');
		counts.set(pair, (counts.get(pair) ?? 0) + 1);
	}

	return counts;
}

function compareGolden({ golden, report, divergences = [] }) {
	const isInvalid = (key) => fileOf(key).startsWith(invalidSyntaxDir);
	const goldenRules = new Set(golden.findings.map((key) => key.split(' ')[1]));
	const bunKeys = bunFindingKeys(report, goldenRules);
	const parseErrorFiles = new Set(
		bunKeys
			.filter((key) => isInvalid(key) && key.split(' ')[1] === 'null')
			.map(fileOf),
	);
	const acceptedInvalidFiles = [
		...new Set(golden.findings.filter(isInvalid).map(fileOf)),
	].filter((file) => !parseErrorFiles.has(file));
	const expected = pairCounts(golden.findings.filter((key) => !isInvalid(key)));
	const actual = pairCounts(bunKeys.filter((key) => !isInvalid(key)));
	const used = new Set();
	const isDivergence = (pair, side) => {
		const divergence = divergences.find(
			(entry) => entry.pair === pair && entry.side === side,
		);
		if (divergence) used.add(divergence);

		return Boolean(divergence);
	};
	const allMissing = [...expected.keys()].filter((pair) => !actual.has(pair));
	const allExtra = [...actual.keys()].filter((pair) => !expected.has(pair));
	const missing = allMissing.filter((pair) => !isDivergence(pair, 'missing'));
	const extra = allExtra.filter((pair) => !isDivergence(pair, 'extra'));

	return {
		matched: expected.size - allMissing.length,
		acceptedInvalidFiles,
		countDiffs: [...expected]
			.filter(([pair, count]) => actual.has(pair) && actual.get(pair) !== count)
			.map(([pair, count]) => [pair, count, actual.get(pair)]),
		staleDivergences: divergences.filter((entry) => !used.has(entry)),
		missing,
		extra,
		byRule: [
			...countByRule(missing).map(([rule, count]) => [
				`missing ${rule}`,
				count,
			]),
			...countByRule(extra).map(([rule, count]) => [`extra ${rule}`, count]),
		],
	};
}

function compareFixes(goldenFixes, bunFixes) {
	const files = [
		...new Set([...Object.keys(goldenFixes), ...Object.keys(bunFixes)]),
	].sort();

	return {
		matched: files.filter(
			(file) => goldenFixes[file] && goldenFixes[file] === bunFixes[file],
		),
		different: files.filter(
			(file) =>
				goldenFixes[file] &&
				bunFixes[file] &&
				goldenFixes[file] !== bunFixes[file],
		),
		missing: files.filter((file) => goldenFixes[file] && !bunFixes[file]),
		extra: files.filter((file) => !goldenFixes[file] && bunFixes[file]),
	};
}

module.exports = {
	compareFixes,
	compareGolden,
	goldenFromResults,
	hashText,
	normalizeBunRuleId,
	selectGoldenFiles,
};
