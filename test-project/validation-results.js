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

function collectMessagesByFile(results, rootDir) {
	const messagesByFile = {};

	for (const { filePath, messages = [] } of results) {
		if (!filePath) {
			continue;
		}

		const fileName = normalizeRelativePath(filePath, rootDir);
		messagesByFile[fileName] ??= [];

		for (const message of messages) {
			if (!message.ruleId) {
				continue;
			}

			messagesByFile[fileName].push(message);
		}
	}

	return messagesByFile;
}

function findExpectedFileRuleFailures(messagesByFile, expectedByFile) {
	const failures = [];

	for (const [fileName, expectations] of Object.entries(expectedByFile ?? {})) {
		const messages = messagesByFile[fileName] ?? [];

		for (const expectation of expectations) {
			const match = messages.find(
				(message) => message.ruleId === expectation.ruleId,
			);

			if (!match) {
				failures.push({
					file: fileName,
					reason: 'missing',
					ruleId: expectation.ruleId,
				});
				continue;
			}

			if (
				expectation.severity !== undefined &&
				match.severity !== expectation.severity
			) {
				failures.push({
					file: fileName,
					reason: `severity ${match.severity}, expected ${expectation.severity}`,
					ruleId: expectation.ruleId,
				});
			}
		}
	}

	return failures;
}

function findUnexpectedFileRuleFailures(messagesByFile, forbiddenByFile) {
	const failures = [];

	for (const [fileName, ruleIds] of Object.entries(forbiddenByFile ?? {})) {
		const messages = messagesByFile[fileName] ?? [];

		for (const ruleId of ruleIds) {
			if (messages.some((message) => message.ruleId === ruleId)) {
				failures.push({
					file: fileName,
					reason: 'unexpected',
					ruleId,
				});
			}
		}
	}

	return failures;
}

module.exports = {
	collectMessagesByFile,
	collectLintRuleResults,
	findExpectedFileRuleFailures,
	findMissingRuleFileCoverage,
	findUnexpectedFileRuleFailures,
	normalizeRelativePath,
};
