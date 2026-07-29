const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { createConfigReport, createRuleDiff } = require('./config-report.js');

const rootDir = path.resolve(__dirname, '../..');
const packagePath = 'packages/eslint-config-expo-magic/package.json';

function readJson(filePath) {
	return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function formatValue(value) {
	return `\`${typeof value === 'string' ? value : JSON.stringify(value)}\``;
}

function formatRuleList(ruleNames, limit = 8) {
	if (ruleNames.length === 0) {
		return 'none';
	}

	const displayedRules = ruleNames
		.slice(0, limit)
		.map((ruleName) => `\`${ruleName}\``);
	if (ruleNames.length > limit) {
		displayedRules.push(`and ${ruleNames.length - limit} more`);
	}

	return displayedRules.join(', ');
}

function createRecordDiff(previous = {}, current = {}) {
	const previousKeys = new Set(Object.keys(previous));
	const currentKeys = new Set(Object.keys(current));
	const added = [];
	const removed = [];
	const changed = [];

	for (const name of currentKeys) {
		if (!previousKeys.has(name)) {
			added.push({ name, value: current[name] });
			continue;
		}

		if (JSON.stringify(previous[name]) !== JSON.stringify(current[name])) {
			changed.push({
				currentValue: current[name],
				name,
				previousValue: previous[name],
			});
		}
	}

	for (const name of previousKeys) {
		if (!currentKeys.has(name)) {
			removed.push({ name, value: previous[name] });
		}
	}

	const byName = (left, right) => left.name.localeCompare(right.name);
	return {
		added: added.sort(byName),
		changed: changed.sort(byName),
		removed: removed.sort(byName),
	};
}

function appendRecordDiff(sections, title, diff) {
	if (
		diff.added.length === 0 &&
		diff.changed.length === 0 &&
		diff.removed.length === 0
	) {
		return false;
	}

	sections.push('', `## ${title}`, '');
	for (const entry of diff.added) {
		sections.push(`- Added \`${entry.name}\`: ${formatValue(entry.value)}`);
	}
	for (const entry of diff.changed) {
		sections.push(
			`- Updated \`${entry.name}\`: ${formatValue(entry.previousValue)} → ${formatValue(entry.currentValue)}`,
		);
	}
	for (const entry of diff.removed) {
		sections.push(`- Removed \`${entry.name}\`: ${formatValue(entry.value)}`);
	}
	return true;
}

function createScopedRuleChanges(previousReport, currentReport) {
	const previousScopes = previousReport.scopes ?? {
		aggregate: {
			filePath: 'aggregate',
			presets: previousReport.presets ?? {},
		},
	};
	const currentScopes = currentReport.scopes ?? {
		aggregate: {
			filePath: 'aggregate',
			presets: currentReport.presets ?? {},
		},
	};
	const groupedChanges = new Map();

	for (const scopeName of Object.keys(currentScopes).sort()) {
		const previousScope = previousScopes[scopeName];
		const currentScope = currentScopes[scopeName];
		if (!previousScope) {
			continue;
		}

		for (const presetName of Object.keys(currentScope.presets).sort()) {
			const previousPreset = previousScope.presets[presetName];
			const currentPreset = currentScope.presets[presetName];
			if (!previousPreset) {
				continue;
			}

			const delta = createRuleDiff(previousPreset.rules, currentPreset.rules);
			if (
				delta.added.length === 0 &&
				delta.changed.length === 0 &&
				delta.removed.length === 0
			) {
				continue;
			}

			const changeKey = JSON.stringify({ delta, presetName });
			const existingChange = groupedChanges.get(changeKey);
			if (existingChange) {
				existingChange.scopeNames.push(scopeName);
			} else {
				groupedChanges.set(changeKey, {
					delta,
					presetName,
					scopeNames: [scopeName],
				});
			}
		}
	}

	return [...groupedChanges.values()].sort((left, right) => {
		const presetOrder = left.presetName.localeCompare(right.presetName);
		if (presetOrder !== 0) {
			return presetOrder;
		}
		return left.scopeNames[0].localeCompare(right.scopeNames[0]);
	});
}

function appendRuleChanges(sections, changes) {
	if (changes.length === 0) {
		return false;
	}

	sections.push('', '## Effective rules', '');
	for (const { delta, presetName, scopeNames } of changes) {
		sections.push(
			`- \`${presetName}\` (${scopeNames.map((scopeName) => `\`${scopeName}\``).join(', ')}): ${delta.added.length} added, ${delta.changed.length} changed, ${delta.removed.length} removed.`,
		);
		if (delta.added.length > 0) {
			sections.push(`  - Added: ${formatRuleList(delta.added)}`);
		}
		if (delta.changed.length > 0) {
			sections.push(`  - Changed: ${formatRuleList(delta.changed)}`);
		}
		if (delta.removed.length > 0) {
			sections.push(`  - Removed: ${formatRuleList(delta.removed)}`);
		}
	}
	return true;
}

function stringifySorted(value) {
	return JSON.stringify(
		Object.entries(value || {})
			.sort(([left], [right]) => left.localeCompare(right))
			.reduce((acc, [key, manifestValue]) => {
				acc[key] = manifestValue;
				return acc;
			}, {}),
	);
}

function hasDependencyManifestDifferences(previousManifest, currentManifest) {
	for (const field of [
		'dependencies',
		'devDependencies',
		'peerDependencies',
		'optionalDependencies',
	]) {
		if (
			stringifySorted(previousManifest[field]) !==
			stringifySorted(currentManifest[field])
		) {
			return true;
		}
	}

	return false;
}

function createReleaseNotes({
	currentManifest,
	currentReport,
	previousManifest,
	previousRef,
	previousReport,
}) {
	const sections = [
		'# Changes',
		'',
		`Compared \`${previousRef}\` package \`${previousManifest.version}\` with current package \`${currentManifest.version}\`.`,
	];
	let hasChanges = false;

	if (previousManifest.version !== currentManifest.version) {
		sections.push(
			'',
			'## Package',
			'',
			`- Version: \`${previousManifest.version}\` → \`${currentManifest.version}\``,
		);
		hasChanges = true;
	}

	const exportDiff = createRecordDiff(
		previousManifest.exports,
		currentManifest.exports,
	);
	hasChanges = appendRecordDiff(sections, 'Exports', exportDiff) || hasChanges;

	const binDiff = createRecordDiff(previousManifest.bin, currentManifest.bin);
	hasChanges = appendRecordDiff(sections, 'Executables', binDiff) || hasChanges;

	const peerDiff = createRecordDiff(
		previousManifest.peerDependencies,
		currentManifest.peerDependencies,
	);
	hasChanges =
		appendRecordDiff(sections, 'Peer compatibility', peerDiff) || hasChanges;

	const engineDiff = createRecordDiff(
		previousManifest.engines,
		currentManifest.engines,
	);
	hasChanges =
		appendRecordDiff(sections, 'Runtime compatibility', engineDiff) ||
		hasChanges;

	const dependencyDiff = createRecordDiff(
		previousManifest.dependencies,
		currentManifest.dependencies,
	);
	hasChanges =
		appendRecordDiff(sections, 'Dependencies', dependencyDiff) || hasChanges;

	const dependencyManifestsChanged = hasDependencyManifestDifferences(
		previousManifest,
		currentManifest,
	);
	if (dependencyManifestsChanged) {
		sections.push(
			'',
			'## Effective rules',
			'',
			'- Omitted: rule diff unavailable because dependency graphs differ.',
		);
		hasChanges = true;
	} else {
		const ruleChanges = createScopedRuleChanges(previousReport, currentReport);
		hasChanges = appendRuleChanges(sections, ruleChanges) || hasChanges;
	}

	if (!hasChanges) {
		sections.push('', '- No package changes detected.');
	}

	return `${sections.join('\n')}\n`;
}

function runGit(args, options = {}) {
	const result = spawnSync('git', args, {
		cwd: options.cwd ?? rootDir,
		encoding: options.encoding ?? 'utf8',
		maxBuffer: 100 * 1024 * 1024,
	});

	if (result.status !== 0) {
		throw new Error(
			result.stderr?.trim() ||
				`git ${args.join(' ')} failed with status ${result.status}`,
		);
	}

	return result.stdout;
}

function findLatestReleaseTag(options = {}) {
	const result = spawnSync(
		'git',
		['describe', '--tags', '--match', 'v[0-9]*', '--abbrev=0', 'HEAD'],
		{
			cwd: options.cwd ?? rootDir,
			encoding: 'utf8',
		},
	);

	if (result.status !== 0) {
		return undefined;
	}

	return result.stdout.trim() || undefined;
}

function materializeGitRef(ref, options = {}) {
	if (!ref || ref.startsWith('-')) {
		throw new Error(`Invalid previous release ref: ${ref}`);
	}

	const sourceRoot = options.sourceRoot ?? rootDir;
	const tempRoot = fs.mkdtempSync(
		path.join(os.tmpdir(), 'expo-magic-release-ref-'),
	);
	const archivePath = path.join(tempRoot, 'release.tar');

	try {
		runGit(['archive', '--format=tar', '--output', archivePath, ref], {
			cwd: sourceRoot,
		});
		const extractResult = spawnSync(
			'tar',
			['-xf', archivePath, '-C', tempRoot],
			{
				encoding: 'utf8',
				maxBuffer: 100 * 1024 * 1024,
			},
		);
		if (extractResult.status !== 0) {
			throw new Error(
				extractResult.stderr.trim() ||
					`tar extraction failed with status ${extractResult.status}`,
			);
		}
		fs.rmSync(archivePath);
		fs.symlinkSync(
			path.join(sourceRoot, 'node_modules'),
			path.join(tempRoot, 'node_modules'),
			'dir',
		);
		fs.symlinkSync(
			path.join(sourceRoot, 'packages/eslint-config-expo-magic/node_modules'),
			path.join(tempRoot, 'packages/eslint-config-expo-magic/node_modules'),
			'dir',
		);
		return tempRoot;
	} catch (error) {
		fs.rmSync(tempRoot, { force: true, recursive: true });
		throw error;
	}
}

async function loadReleaseComparison({
	previousRef,
	rootDir: projectRoot = rootDir,
	currentManifest,
	previousManifest,
	currentReport,
	previousReport,
} = {}) {
	const previousRefToUse =
		previousRef ?? findLatestReleaseTag({ cwd: projectRoot });
	if (!previousRefToUse) {
		throw new Error(
			'No release tag found. Pass --previous-ref <git-ref> to select comparison baseline.',
		);
	}

	const previousRoot = materializeGitRef(previousRefToUse, {
		sourceRoot: projectRoot,
	});

	try {
		const [resolvedCurrentReport, resolvedPreviousReport] = await Promise.all([
			currentReport ?? createConfigReport({ projectRoot }),
			previousReport ??
				createConfigReport({ projectRoot: previousRoot }),
		]);
		return {
			currentManifest:
				currentManifest ??
				readJson(path.join(projectRoot, packagePath)),
			currentReport: resolvedCurrentReport,
			previousManifest:
				previousManifest ??
				readJson(path.join(previousRoot, packagePath)),
			previousRef: previousRefToUse,
			previousReport: resolvedPreviousReport,
		};
	} finally {
		fs.rmSync(previousRoot, { force: true, recursive: true });
	}
}

async function writeReleaseNotesFile(
	outputPath = path.join(rootDir, 'docs/RELEASE_NOTES.next.md'),
	options = {},
) {
	const comparison =
		options.currentManifest && options.previousManifest
			? options
			: await loadReleaseComparison(options);
	const releaseNotes = createReleaseNotes(comparison);
	fs.writeFileSync(outputPath, releaseNotes);
	return releaseNotes;
}

module.exports = {
	createRecordDiff,
	createReleaseNotes,
	createScopedRuleChanges,
	findLatestReleaseTag,
	loadReleaseComparison,
	writeReleaseNotesFile,
};
