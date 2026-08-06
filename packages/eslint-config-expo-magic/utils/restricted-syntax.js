const {
	testTsxFiles,
	testTypeScriptFiles,
	tsxFiles,
	typeScriptFilesWithoutTsx,
} = require('./file-patterns.js');

const RESTRICTED_SYNTAX_SCOPES = Object.freeze({
	TYPESCRIPT: 'typescript',
	TYPESCRIPT_WITHOUT_TSX: 'typescript-without-tsx',
	TSX: 'tsx',
	TEST: 'test',
	TEST_TYPESCRIPT: 'test-typescript',
	TEST_TSX: 'test-tsx',
});

const knownScopePatterns = [
	...typeScriptFilesWithoutTsx,
	...tsxFiles,
	...testTypeScriptFiles,
	...testTsxFiles,
];

const knownScopePatternSet = new Set(knownScopePatterns);

function createRestrictedSyntaxRule(selectors) {
	if (selectors.length === 0) {
		return 'off';
	}

	return ['error', ...selectors];
}

function createRestrictedSyntaxConfigs(groups) {
	return groups.map((group) => ({
		files: group.files,
		rules: {
			'no-restricted-syntax': createRestrictedSyntaxRule(group.selectors),
		},
	}));
}

function mergeRestrictedSyntaxGroups(groups) {
	const merged = new Map();

	for (const group of groups) {
		const key = group.files.join('\0');
		const existing = merged.get(key);
		if (existing) {
			existing.selectors.push(...group.selectors);
			continue;
		}

		merged.set(key, {
			files: group.files,
			selectors: [...group.selectors],
		});
	}

	return [...merged.values()];
}

function hasPatternIntersection(patternsA, patternsB) {
	if (!Array.isArray(patternsA) || !Array.isArray(patternsB)) {
		return false;
	}

	const extensionsA = new Set();
	const extensionsB = new Set();

	for (const pattern of patternsA) {
		for (const extension of extractExtensionsFromPattern(pattern)) {
			extensionsA.add(extension);
		}
	}

	for (const pattern of patternsB) {
		for (const extension of extractExtensionsFromPattern(pattern)) {
			extensionsB.add(extension);
		}
	}

	if (extensionsA.size === 0 || extensionsB.size === 0) {
		return false;
	}

	for (const extension of extensionsA) {
		if (extensionsB.has(extension)) {
			return true;
		}
	}

	return false;
}

function isGlobPattern(pattern) {
	const baseName = pattern.split('/').pop() ?? '';

	return /[\*?\[]/.test(baseName) || baseName.includes('{');
}

function isTestFilePattern(pattern) {
	const baseName = pattern.split('/').pop() ?? '';

	return /\.(test|spec)\./.test(baseName);
}

function hasBoundedPatternIntersection(patternsA, patternsB) {
	if (!Array.isArray(patternsA) || !Array.isArray(patternsB)) {
		return false;
	}

	for (const patternA of patternsA) {
		for (const patternB of patternsB) {
			if (!hasPatternIntersection([patternA], [patternB])) {
				continue;
			}

			if (
				!isGlobPattern(patternA) &&
				!isGlobPattern(patternB) &&
				isTestFilePattern(patternA) !== isTestFilePattern(patternB)
			) {
				continue;
			}

			if (
				!isGlobPattern(patternA) &&
				isGlobPattern(patternB) &&
				isTestFilePattern(patternA) !== isTestFilePattern(patternB)
			) {
				continue;
			}

			if (
				isGlobPattern(patternA) &&
				!isGlobPattern(patternB) &&
				isTestFilePattern(patternA) !== isTestFilePattern(patternB)
			) {
				continue;
			}

			return true;
		}
	}

	return false;
}

function extractExtensionsFromPattern(pattern) {
	const specialExtensions = ['d.ts', 'd.mts', 'd.cts'];
	for (const extension of specialExtensions) {
		if (pattern.endsWith(`.${extension}`)) {
			return [extension];
		}
	}

	const braceMatch = pattern.match(/\.\{([^}]+)\}/);
	if (braceMatch) {
		return braceMatch[1].split(',');
	}

	const suffix = pattern.split('.').pop();
	if (!suffix || suffix.includes('/')) {
		return [];
	}

	return [suffix];
}

function isKnownScopePatternGroup(group) {
	return group.files.every((pattern) => knownScopePatternSet.has(pattern));
}

function selectorHasDoubleAssertionMessage(selector) {
	return selector.message.includes('double assertions');
}

function shouldKeepSelector(existing, candidate) {
	if (existing.selector !== candidate.selector) {
		return true;
	}

	if (existing.message === candidate.message) {
		return false;
	}

	if (
		selectorHasDoubleAssertionMessage(existing) &&
		selectorHasDoubleAssertionMessage(candidate)
	) {
		return false;
	}

	return true;
}

function dedupeSelectors(selectors) {
	const deduped = [];

	for (const selector of selectors) {
		const duplicateIndex = deduped.findIndex(
			(existing) => !shouldKeepSelector(existing, selector),
		);

		if (duplicateIndex === -1) {
			deduped.push(selector);
		}
	}

	return deduped;
}

function collectSelectorsForBucket(groups, isApplicable) {
	return dedupeSelectors(
		groups.flatMap((group) => (isApplicable(group) ? group.selectors : [])),
	);
}

function normalizeScope(scope) {
	if (!scope) {
		return null;
	}

	if (Array.isArray(scope)) {
		return new Set(scope);
	}

	return new Set([scope]);
}

function getScopeBuckets() {
	return [
		{
			scope: RESTRICTED_SYNTAX_SCOPES.TYPESCRIPT_WITHOUT_TSX,
			files: typeScriptFilesWithoutTsx,
		},
		{
			scope: RESTRICTED_SYNTAX_SCOPES.TSX,
			files: tsxFiles,
		},
		{
			scope: RESTRICTED_SYNTAX_SCOPES.TEST_TYPESCRIPT,
			files: testTypeScriptFiles,
		},
		{
			scope: RESTRICTED_SYNTAX_SCOPES.TEST_TSX,
			files: testTsxFiles,
		},
		{
			scope: RESTRICTED_SYNTAX_SCOPES.TYPESCRIPT,
			files: [...typeScriptFilesWithoutTsx, ...tsxFiles],
		},
		{
			scope: RESTRICTED_SYNTAX_SCOPES.TEST,
			files: [...testTypeScriptFiles, ...testTsxFiles],
		},
	];
}

function bucketAppliesToGroup(bucket, group, knownScopeOnly) {
	if (!knownScopeOnly) {
		return false;
	}

	const scopeSet = normalizeScope(group.scope);
	if (scopeSet) {
		return scopeSet.has(bucket.scope);
	}

	return hasPatternIntersection(group.files, bucket.files);
}

function createScopedComposedConfigs(groups) {
	return createRestrictedSyntaxConfigs(
		getScopeBuckets()
			.map((bucket) => ({
				files: bucket.files,
				selectors: collectSelectorsForBucket(groups, (group) =>
					bucketAppliesToGroup(bucket, group, true),
				),
			}))
			.filter((group) => group.selectors.length > 0),
	);
}

function collectSelectorsForAllowedFilePatterns(
	groups,
	excludedGroup,
	filePatterns,
) {
	const bucketGroups = getScopeBuckets();
	const selectorsByInput = [];

	for (const group of groups) {
		if (group === excludedGroup) {
			continue;
		}

		const scopeSet = normalizeScope(group.scope);
		const groupSelectors = [];

		if (scopeSet) {
			for (const bucket of bucketGroups) {
				if (!scopeSet.has(bucket.scope)) {
					continue;
				}

				if (hasBoundedPatternIntersection(filePatterns, bucket.files)) {
					groupSelectors.push(...group.selectors);
					break;
				}
			}
		} else if (hasBoundedPatternIntersection(group.files, filePatterns)) {
			groupSelectors.push(...group.selectors);
		}

		selectorsByInput.push(...groupSelectors);
	}

	return dedupeSelectors(selectorsByInput);
}

function getRelevantFilePatternsForAllowedFiles(allowFiles) {
	return [...new Set(allowFiles)];
}

function createCapabilityAllowConfigs(groups) {
	const capabilityGroups = groups.filter(
		(group) => typeof group.capability === 'string' && group.allowFiles?.length,
	);
	if (capabilityGroups.length === 0) {
		return [];
	}

	const configs = [];

	for (const capabilityGroup of capabilityGroups) {
		const selectors = collectSelectorsForAllowedFilePatterns(
			groups,
			capabilityGroup,
			capabilityGroup.allowFiles,
		);

		if (selectors.length === 0) {
			continue;
		}

		configs.push({
			files: getRelevantFilePatternsForAllowedFiles(capabilityGroup.allowFiles),
			rules: {
				'no-restricted-syntax': createRestrictedSyntaxRule(selectors),
			},
		});
	}

	return configs;
}

function createComposedRestrictedSyntaxConfigs(groups) {
	const directGroups = groups.filter(
		(group) => !isKnownScopePatternGroup(group),
	);
	const scopedGroups = groups.filter((group) =>
		isKnownScopePatternGroup(group),
	);

	return [
		...createRestrictedSyntaxConfigs(mergeRestrictedSyntaxGroups(directGroups)),
		...createScopedComposedConfigs(scopedGroups),
		...createCapabilityAllowConfigs(groups),
	];
}

module.exports = {
	createComposedRestrictedSyntaxConfigs,
	createRestrictedSyntaxConfigs,
	mergeRestrictedSyntaxGroups,
	RESTRICTED_SYNTAX_SCOPES,
};
