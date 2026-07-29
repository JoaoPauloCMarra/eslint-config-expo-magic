const path = require('node:path');

function normalizeRelativePath(filePath, rootDir) {
	return path.relative(rootDir, filePath).split(path.sep).join('/');
}

function collectLintRuleResults(results, rootDir) {
	const ruleCounts = {};
	const ruleFiles = {};
	let totalErrors = 0;
	let totalWarnings = 0;

	for (const { filePath, messages = [] } of results) {
		if (!filePath) {
			continue;
		}

		const fileName = normalizeRelativePath(filePath, rootDir);
		for (const message of messages) {
			if (!message.ruleId) {
				continue;
			}

			ruleCounts[message.ruleId] = (ruleCounts[message.ruleId] ?? 0) + 1;
			ruleFiles[message.ruleId] ??= new Set();
			ruleFiles[message.ruleId].add(fileName);

			if (message.severity === 2) {
				totalErrors++;
			} else if (message.severity === 1) {
				totalWarnings++;
			}
		}
	}

	return {
		ruleCounts,
		ruleFiles,
		totalErrors,
		totalWarnings,
	};
}

function findMissingRuleFileCoverage(expectedRules, ruleFiles) {
	const missingCoverage = [];

	for (const [ruleId, expectedFiles] of Object.entries(expectedRules)) {
		const triggeredFiles = ruleFiles[ruleId];
		if (!triggeredFiles) {
			continue;
		}

		const files = expectedFiles.filter((file) => !triggeredFiles.has(file));
		if (files.length > 0) {
			missingCoverage.push({ files, ruleId });
		}
	}

	return missingCoverage;
}

module.exports = {
	collectLintRuleResults,
	findMissingRuleFileCoverage,
	normalizeRelativePath,
};
