const TEST_PREFIXES = ['test', 'spec'];

const typeScriptFiles = [
	'**/*.ts',
	'**/*.tsx',
	'**/*.mts',
	'**/*.cts',
	'**/*.d.ts',
	'**/*.d.mts',
	'**/*.d.cts',
];

const typeScriptFilesWithoutTsx = [
	'**/*.ts',
	'**/*.mts',
	'**/*.cts',
	'**/*.d.ts',
	'**/*.d.mts',
	'**/*.d.cts',
];

const tsxFiles = ['**/*.tsx'];

const tsAndTsxFiles = ['**/*.ts', '**/*.tsx'];

function createTestFilePatterns({
	ts = false,
	tsx = false,
	moduleExtensions = false,
} = {}) {
	const extensions = [];

	if (ts) {
		extensions.push('ts');
	}

	if (moduleExtensions) {
		extensions.push('mts', 'cts');
	}

	if (tsx) {
		extensions.push('tsx');
	}

	return TEST_PREFIXES.flatMap((prefix) =>
		extensions.map((extension) => `**/*.${prefix}.${extension}`),
	);
}

const testTypeScriptFiles = createTestFilePatterns({
	ts: true,
	moduleExtensions: true,
});

const testTsxFiles = createTestFilePatterns({ tsx: true });

const tsAndTsxTestFiles = createTestFilePatterns({ ts: true, tsx: true });

const testFiles = createTestFilePatterns({
	ts: true,
	tsx: true,
	moduleExtensions: true,
});

module.exports = {
	createTestFilePatterns,
	tsAndTsxFiles,
	tsAndTsxTestFiles,
	tsxFiles,
	testFiles,
	testTsxFiles,
	testTypeScriptFiles,
	typeScriptFiles,
	typeScriptFilesWithoutTsx,
};
