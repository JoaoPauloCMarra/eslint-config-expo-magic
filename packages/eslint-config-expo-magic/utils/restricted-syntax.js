const typeScriptFilesWithoutTsx = [
	'**/*.ts',
	'**/*.mts',
	'**/*.cts',
	'**/*.d.ts',
	'**/*.d.mts',
	'**/*.d.cts',
];

const tsxFiles = ['**/*.tsx'];

const testTypeScriptFiles = ['**/*.test.ts', '**/*.spec.ts'];
const testTsxFiles = ['**/*.test.tsx', '**/*.spec.tsx'];

function createRestrictedSyntaxConfigs(groups) {
	return groups.map((group) => ({
		files: group.files,
		rules: {
			'no-restricted-syntax': ['error', ...group.selectors],
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

function hasAnyPattern(files, patterns) {
	return patterns.some((pattern) => files.includes(pattern));
}

function selectorKey(selector) {
	return `${selector.selector}\0${selector.message ?? ''}`;
}

function dedupeSelectors(selectors) {
	const seen = new Set();
	const deduped = [];

	for (const selector of selectors) {
		const key = selectorKey(selector);
		if (seen.has(key)) {
			continue;
		}

		seen.add(key);
		deduped.push(selector);
	}

	return deduped;
}

function collectSelectors(groups, shouldIncludeGroup) {
	return dedupeSelectors(
		groups.flatMap((group) =>
			shouldIncludeGroup(group) ? group.selectors : [],
		),
	);
}

function createComposedRestrictedSyntaxConfigs(groups) {
	const typedGroups = mergeRestrictedSyntaxGroups(groups);
	const appliesToTypeScript = (group) =>
		hasAnyPattern(group.files, typeScriptFilesWithoutTsx);
	const appliesToTsx = (group) => hasAnyPattern(group.files, tsxFiles);
	const appliesToTestTypeScript = (group) =>
		appliesToTypeScript(group) || hasAnyPattern(group.files, testTypeScriptFiles);
	const appliesToTestTsx = (group) =>
		appliesToTsx(group) || hasAnyPattern(group.files, testTsxFiles);

	return createRestrictedSyntaxConfigs(
		[
			{
				files: typeScriptFilesWithoutTsx,
				selectors: collectSelectors(typedGroups, appliesToTypeScript),
			},
			{
				files: tsxFiles,
				selectors: collectSelectors(typedGroups, appliesToTsx),
			},
			{
				files: testTypeScriptFiles,
				selectors: collectSelectors(typedGroups, appliesToTestTypeScript),
			},
			{
				files: testTsxFiles,
				selectors: collectSelectors(typedGroups, appliesToTestTsx),
			},
		].filter((group) => group.selectors.length > 0),
	);
}

module.exports = {
	createComposedRestrictedSyntaxConfigs,
	createRestrictedSyntaxConfigs,
	mergeRestrictedSyntaxGroups,
};
