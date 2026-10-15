const path = require('node:path');

const reactHooksDivergence =
	'Bun native react-hooks reports compiler findings that eslint-plugin-react-hooks 7.1.1 does not';

const knownLintDivergences = [
	['App.tsx', 'react-hooks/purity'],
	['App.tsx', 'react-hooks/static-components'],
	['App.tsx', 'react-hooks/immutability'],
	['components/GeneralAdvanced.tsx', 'react-hooks/immutability'],
	['components/GeneralAdvanced.tsx', 'react-hooks/unsupported-syntax'],
	['components/PaginatedPeopleList.tsx', 'react-hooks/refs'],
].map(([file, ruleId]) => ({ file, ruleId, reason: reactHooksDivergence }));

function lintFindingKeys(results, rootDir) {
	return results.flatMap((result) => {
		const file = path.relative(rootDir, path.resolve(rootDir, result.filePath));

		return result.messages.map(
			(message) =>
				`${file}:${message.line}:${message.column} ${message.ruleId} ${message.severity}`,
		);
	});
}

function parseKey(key) {
	const [location, ruleId] = key.split(' ');

	return { file: location.split(':')[0], ruleId };
}

function compareLint({ eslint, bun, rootDir, knownDivergences = [] }) {
	const eslintKeys = new Set(lintFindingKeys(eslint, rootDir));
	const bunKeys = new Set(lintFindingKeys(bun, rootDir));
	const usedDivergences = new Set();
	const knownInBun = [];
	const unexpectedInBun = [];

	for (const key of bunKeys) {
		if (eslintKeys.has(key)) continue;

		const { file, ruleId } = parseKey(key);
		const divergence = knownDivergences.find(
			(entry) => entry.file === file && entry.ruleId === ruleId,
		);

		if (divergence) {
			usedDivergences.add(divergence);
			knownInBun.push(key);
		} else {
			unexpectedInBun.push(key);
		}
	}

	return {
		matched: [...eslintKeys].filter((key) => bunKeys.has(key)).length,
		missingInBun: [...eslintKeys].filter((key) => !bunKeys.has(key)),
		knownInBun,
		unexpectedInBun,
		staleDivergences: knownDivergences.filter(
			(entry) => !usedDivergences.has(entry),
		),
	};
}

// Prettier and `bun fmt --check` (with a Prettier config) print one
// `[warn] <file>` line per unformatted file, then a `[warn]` summary line.
function parseCheckOutput(output) {
	return output
		.split('\n')
		.filter((line) => line.startsWith('[warn] '))
		.map((line) => line.slice('[warn] '.length).trim())
		.filter((file) => !file.startsWith('Code style issues'))
		.sort();
}

function compareFormat({ prettierFiles, bunFiles }) {
	return {
		onlyPrettier: prettierFiles.filter((file) => !bunFiles.includes(file)),
		onlyBun: bunFiles.filter((file) => !prettierFiles.includes(file)),
	};
}

module.exports = {
	compareFormat,
	compareLint,
	knownLintDivergences,
	lintFindingKeys,
	parseCheckOutput,
};
