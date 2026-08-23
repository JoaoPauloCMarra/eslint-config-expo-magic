#!/usr/bin/env bun

const fs = require('fs');
const os = require('os');
const { spawnSync } = require('child_process');
const path = require('path');
const { ESLint } = require('eslint');
const {
	collectMessagesByFile,
	collectLintRuleResults,
	findExpectedFileRuleFailures,
	findMissingRuleFileCoverage,
	findUnexpectedFileRuleFailures,
} = require('./validation-results.js');

// Expected rules that should trigger
const expectedRules = {
	// TypeScript rules
	'@typescript-eslint/await-thenable': ['App.tsx'],
	'@typescript-eslint/consistent-type-definitions': ['App.tsx'],
	'@typescript-eslint/naming-convention': ['App.tsx'],
	'@typescript-eslint/no-confusing-void-expression': ['App.tsx'],
	'@typescript-eslint/no-empty-object-type': ['App.tsx'],
	'@typescript-eslint/no-explicit-any': ['App.tsx'],
	'@typescript-eslint/no-floating-promises': ['App.tsx'],
	'@typescript-eslint/no-non-null-assertion': ['App.tsx'],
	'@typescript-eslint/no-redeclare': ['App.tsx'],
	'@typescript-eslint/no-require-imports': [
		'components/TypeScriptAdvanced.tsx',
	],
	'@typescript-eslint/no-unused-vars': ['__tests__/App.test.tsx', 'App.tsx'],
	'@typescript-eslint/no-useless-constructor': ['App.tsx'],

	// React rules
	'react-19-upgrade/no-factories': ['App.tsx'],
	'react-19-upgrade/no-string-refs': ['App.tsx'],
	'react-hooks/exhaustive-deps': ['App.tsx'],
	'react-native/no-unused-styles': ['components/ReactAdvanced.tsx'],
	'react/display-name': ['BadImports.tsx'],
	'react/jsx-key': ['App.tsx'],
	'react/jsx-no-comment-textnodes': ['App.tsx'],
	'react/jsx-no-duplicate-props': ['App.tsx'],
	'react/jsx-no-undef': ['App.tsx'],
	'react/no-children-prop': ['App.tsx'],
	'react/no-danger-with-children': ['App.tsx'],
	'react/no-string-refs': ['App.tsx'],
	'react/no-unknown-property': ['components/BadImports.tsx'],
	'react/self-closing-comp': ['App.tsx'],

	// Jest rules
	'jest/expect-expect': ['__tests__/App.test.tsx'],
	'jest/no-commented-out-tests': ['__tests__/App.test.tsx'],
	'jest/no-conditional-expect': ['__tests__/App.test.tsx'],
	'jest/no-deprecated-functions': ['__tests__/App.test.tsx'],
	'jest/no-disabled-tests': ['__tests__/App.test.tsx'],
	'jest/no-done-callback': ['__tests__/App.test.tsx'],
	'jest/no-export': ['__tests__/App.test.tsx'],
	'jest/no-focused-tests': ['__tests__/App.test.tsx'],
	'jest/no-identical-title': ['__tests__/App.test.tsx'],
	'jest/no-interpolation-in-snapshots': ['__tests__/App.test.tsx'],
	'jest/no-jasmine-globals': ['__tests__/JestAdvanced.test.tsx'],
	'jest/no-alias-methods': ['__tests__/App.test.tsx'],
	'jest/no-mocks-import': ['__tests__/App.test.tsx'],
	'jest/no-standalone-expect': ['__tests__/standalone.test.ts'],
	'jest/no-test-prefixes': ['__tests__/App.test.tsx'],
	'jest/prefer-hooks-on-top': ['__tests__/App.test.tsx'],
	'jest/prefer-to-be': ['__tests__/App.test.tsx'],
	'jest/valid-describe-callback': ['__tests__/App.test.tsx'],
	'jest/valid-expect': ['__tests__/App.test.tsx'],
	'jest/valid-expect-in-promise': ['__tests__/App.test.tsx'],
	'jest/valid-title': ['__tests__/App.test.tsx'],

	// Testing Library rules
	'testing-library/await-async-queries': ['__tests__/App.test.tsx'],
	'testing-library/no-await-sync-queries': ['__tests__/App.test.tsx'],
	'testing-library/no-debugging-utils': ['__tests__/App.test.tsx'],
	'testing-library/no-dom-import': ['__tests__/App.test.tsx'],

	// Import rules
	'import-x/export': ['duplicate-exports.ts'],
	'import-x/first': ['App.tsx'],
	'import-x/no-amd': ['components/ImportsAdvanced.tsx'],
	'import-x/no-anonymous-default-export': ['BadImports.tsx'],
	'import-x/no-cycle': ['cycleA.ts', 'cycleB.ts'],
	'import-x/no-duplicates': ['App.tsx'],
	'import-x/no-named-as-default': ['App.tsx'],
	'import-x/no-named-as-default-member': ['App.tsx'],
	'import-x/namespace': ['import-violations.ts'],
	'import-x/no-unresolved': [
		'components/ImportsAdvanced.tsx',
		'alias-unresolved.ts',
	],
	'import-x/no-webpack-loader-syntax': ['components/ImportsAdvanced.tsx'],
	'import-x/order': ['App.tsx', 'import-violations.ts'],

	// General rules
	eqeqeq: ['App.tsx'],
	'expo/prefer-box-shadow': ['components/GeneralAdvanced.tsx'],
	'expo/no-dynamic-env-var': ['App.tsx'],
	'expo/no-env-var-destructuring': ['App.tsx'],
	'expo/use-dom-exports': ['test.web.tsx'],
	'no-console': [
		'App.tsx',
		'analyze-rules.js',
		'babel.config.js',
		'find-missing-rules.js',
		'index.js',
		'metro.config.js',
		'validate-comprehensive.js',
	],
	'no-dupe-args': ['components/GeneralAdvanced.tsx'],
	'no-dupe-class-members': ['Legacy.js'],
	'no-dupe-keys': ['App.tsx'],
	'no-duplicate-case': ['App.tsx'],
	'no-empty-character-class': ['App.tsx'],
	'no-empty-pattern': ['App.tsx'],
	'no-extend-native': ['components/GeneralAdvanced.tsx'],
	'no-extra-bind': ['App.tsx'],
	'no-redeclare': ['Legacy.js'],
	'no-restricted-imports': ['App.tsx'],
	'no-undef': ['validate-comprehensive.js'],
	'no-unreachable': ['App.tsx'],
	'no-unsafe-negation': ['App.tsx'],
	'no-unused-expressions': ['App.tsx', 'components/GeneralAdvanced.tsx'],
	'no-unused-labels': ['App.tsx'],
	'no-unused-vars': ['metro.config.js'],
	'no-var': ['App.tsx'],
	'no-with': ['components/GeneralAdvanced.tsx'],
	'unicode-bom': ['bom.js'],
	'unused-imports/no-unused-imports': ['App.tsx'],
	'use-isnan': ['App.tsx'],
	'valid-typeof': ['App.tsx'],

	// Prettier rules
	'prettier/prettier': [
		'.eslintrc.js',
		'components/BadImports.tsx',
		'components/ImportsAdvanced.tsx',
		'components/SimpleList.tsx',
		'components/TestRefAccess.tsx',
		'components/UnusedComponent.tsx',
		'babel.config.js',
		'bom.js',
		'utils/helpers.ts',
		'index.js',
		'jest.config.js',
		'metro.config.js',
	],
};

expectedRules['@typescript-eslint/no-explicit-any'].push(
	'module-file.cts',
	'module-file.mts',
);

Object.assign(expectedRules, {
	'@typescript-eslint/array-type': ['App.tsx'],
	'@typescript-eslint/consistent-type-assertions': ['TsRules.ts'],
	'@typescript-eslint/consistent-type-imports': ['App.tsx'],
	'@typescript-eslint/no-dupe-class-members': ['App.tsx'],
	'@typescript-eslint/no-extra-non-null-assertion': ['App.tsx'],
	'@typescript-eslint/no-import-type-side-effects': ['App.tsx'],
	'@typescript-eslint/no-meaningless-void-operator': ['App.tsx'],
	'@typescript-eslint/no-unnecessary-type-assertion': ['App.tsx'],
	'@typescript-eslint/no-unnecessary-type-constraint': ['App.tsx'],
	'@typescript-eslint/no-wrapper-object-types': ['App.tsx'],
	'@typescript-eslint/prefer-optional-chain': ['App.tsx'],
	'@typescript-eslint/prefer-readonly': ['App.tsx'],
	'@typescript-eslint/triple-slash-reference': ['App.tsx'],
	'react-19-upgrade/no-default-props': ['App.tsx'],
	'react-19-upgrade/no-legacy-context': ['App.tsx'],
	'react-19-upgrade/no-prop-types': ['App.tsx'],
	'react-hooks/error-boundaries': ['components/ReactCompilerTests.tsx'],
	'react-hooks/immutability': ['compiler-rules-test.tsx'],
	'react-hooks/purity': ['components/ReactCompilerTests.tsx'],
	'react-hooks/refs': ['components/ReactCompilerTests.tsx'],
	'react-hooks/rules-of-hooks': [
		'App.tsx',
		'components/ReactCompilerTests.tsx',
	],
	'react-hooks/set-state-in-render': ['components/ReactCompilerTests.tsx'],
	'react-hooks/static-components': ['components/ReactCompilerTests.tsx'],
	'react-hooks/unsupported-syntax': ['components/ReactCompilerTests.tsx'],
	'react-hooks/use-memo': ['components/ReactCompilerTests.tsx'],
	'react-native/no-single-element-style-arrays': ['App.tsx'],
	'react-native/split-platform-components': ['App.tsx'],
	'react/jsx-no-leaked-render': ['App.tsx'],
	'react/jsx-no-useless-fragment': ['App.tsx'],
	'react/no-deprecated': ['App.tsx'],
	'react/no-direct-mutation-state': ['App.tsx'],
	'react/no-find-dom-node': ['App.tsx'],
	'react/no-is-mounted': ['App.tsx'],
	'react/no-render-return-value': ['App.tsx'],
	'react/no-this-in-sfc': ['App.tsx'],
	'react/no-unescaped-entities': ['App.tsx'],
	'react/require-render-return': ['App.tsx'],
});

const expectedRuleFiles = Object.fromEntries(
	Object.entries(expectedRules).map(([ruleId, files]) => [
		ruleId,
		files.map((file) => path.posix.join('test-project', file)),
	]),
);

const configOnlyRules = new Map([
	[
		'import-x/default',
		'Enabled from eslint-plugin-import-x recommended config; current resolver stack does not produce a stable local fixture diagnostic.',
	],
	[
		'react-hooks/config',
		'Enabled from eslint-plugin-react-hooks recommended config and exercised through config presence.',
	],
	[
		'react-hooks/gating',
		'Enabled from eslint-plugin-react-hooks recommended config and exercised through config presence.',
	],
	[
		'react-hooks/globals',
		'Enabled from eslint-plugin-react-hooks recommended config; stable mutation diagnostics currently report through immutability.',
	],
	[
		'react-hooks/incompatible-library',
		'Enabled from eslint-plugin-react-hooks recommended config and exercised through config presence.',
	],
	[
		'react-hooks/preserve-manual-memoization',
		'Enabled from eslint-plugin-react-hooks recommended config; current plugin has no stable local fixture diagnostic.',
	],
	[
		'react/jsx-uses-react',
		'Non-reporting helper rule covered by JSX usage behavior in unit tests.',
	],
	[
		'react/jsx-uses-vars',
		'Non-reporting helper rule covered by JSX usage behavior in unit tests.',
	],
]);

const repoRoot = path.resolve(__dirname, '..');
const packageDir = path.resolve(
	repoRoot,
	'packages',
	'eslint-config-expo-magic',
);

function runCommand(command, args, cwd = process.cwd()) {
	const result = spawnSync(command, args, {
		cwd,
		encoding: 'utf8',
		stdio: ['pipe', 'pipe', 'pipe'],
	});

	if (result.error) {
		throw result.error;
	}

	if (result.status !== 0 && result.status !== 1) {
		throw new Error(result.stderr || `Command failed: ${command}`);
	}

	return result;
}

function parseLintResults(result) {
	return JSON.parse(result.stdout.trim() || '[]');
}

function resolvePresetModulePath(presetModule) {
	const localPresetFiles = {
		'eslint-config-expo-magic': 'index.js',
		'eslint-config-expo-magic/agent': 'agent.js',
		'eslint-config-expo-magic/agent-guardrails': 'agent-guardrails.js',
		'eslint-config-expo-magic/app-guardrails': 'app-guardrails.js',
		'eslint-config-expo-magic/base': 'base.js',
		'eslint-config-expo-magic/component-structure': 'component-structure.js',
		'eslint-config-expo-magic/deprecated-apis': 'deprecated-apis.js',
		'eslint-config-expo-magic/feature-boundaries': 'feature-boundaries.js',
		'eslint-config-expo-magic/native-ui': 'native-ui.js',
		'eslint-config-expo-magic/strict': 'strict.js',
		'eslint-config-expo-magic/typed': 'typed.js',
		'eslint-config-expo-magic/react-compiler': 'react-compiler.js',
		'eslint-config-expo-magic/reanimated': 'reanimated.js',
		'eslint-config-expo-magic/semantic-colors': 'semantic-colors.js',
		'eslint-config-expo-magic/storybook': 'storybook.js',
		'eslint-config-expo-magic/worklets': 'worklets.js',
	};

	const localPresetFile = localPresetFiles[presetModule];
	if (localPresetFile) {
		return path.join(packageDir, localPresetFile);
	}

	return presetModule;
}

function createPresetConfigSource(presetModules) {
	const presetExpressions = presetModules.map((presetModule) => {
		const presetModulePath = resolvePresetModulePath(presetModule);
		const preset = require(presetModulePath);

		return Array.isArray(preset)
			? `require(${JSON.stringify(presetModulePath)})`
			: `require(${JSON.stringify(presetModulePath)}).recommended`;
	});

	return `module.exports = [...${presetExpressions.join(', ')}].flat();\n`;
}

function runPresetLint(presetModules, targets, options = {}) {
	const { stageFiles = {}, tsconfig } = options;
	const staged = Object.keys(stageFiles).length > 0 || tsconfig !== undefined;
	const tempRoot = staged ? process.cwd() : os.tmpdir();
	const tempDir = fs.mkdtempSync(
		path.join(
			tempRoot,
			staged ? 'validation-staging-' : 'eslint-config-expo-magic-preset-',
		),
	);
	const configPath = path.join(tempDir, 'eslint.config.js');
	const lintCwd = staged ? tempDir : process.cwd();

	try {
		fs.writeFileSync(configPath, createPresetConfigSource(presetModules));

		if (tsconfig !== undefined) {
			fs.writeFileSync(path.join(tempDir, 'tsconfig.json'), tsconfig);
		}

		for (const [relativePath, sourcePath] of Object.entries(stageFiles)) {
			const destPath = path.join(tempDir, relativePath);
			fs.mkdirSync(path.dirname(destPath), { recursive: true });
			fs.copyFileSync(sourcePath, destPath);
		}

		const result = runCommand(
			'bunx',
			[
				'eslint',
				...targets,
				'--no-config-lookup',
				'--config',
				configPath,
				'--format=json',
			],
			lintCwd,
		);

		return {
			cwd: lintCwd,
			lintResults: parseLintResults(result),
		};
	} finally {
		fs.rmSync(tempDir, { recursive: true, force: true });
	}
}

function validatePresetCheck({
	label,
	presetModules,
	targets,
	requiredRules = [],
	forbiddenRules = [],
	stageFiles,
	tsconfig,
	expectedByFile,
	forbiddenByFile,
}) {
	console.log(`\n🧪 Preset Check: ${label}`);
	console.log('==============================');

	const { cwd, lintResults } = runPresetLint(presetModules, targets, {
		stageFiles,
		tsconfig,
	});
	const messages = lintResults.flatMap((result) => result.messages ?? []);
	const messagesByFile = collectMessagesByFile(lintResults, cwd);

	let passed = true;

	for (const { ruleId, severity } of requiredRules) {
		const match = messages.find((message) => message.ruleId === ruleId);
		if (!match) {
			console.log(`❌ Missing ${ruleId}`);
			passed = false;
			continue;
		}

		if (severity !== undefined && match.severity !== severity) {
			console.log(
				`❌ ${ruleId} severity mismatch (expected ${severity}, got ${match.severity})`,
			);
			passed = false;
			continue;
		}

		console.log(`✅ ${ruleId}`);
	}

	for (const ruleId of forbiddenRules) {
		if (messages.some((message) => message.ruleId === ruleId)) {
			console.log(`❌ Unexpected ${ruleId}`);
			passed = false;
			continue;
		}

		console.log(`✅ ${ruleId} absent`);
	}

	const expectedFailures = findExpectedFileRuleFailures(
		messagesByFile,
		expectedByFile,
	);
	const forbiddenFailures = findUnexpectedFileRuleFailures(
		messagesByFile,
		forbiddenByFile,
	);

	for (const failure of [...expectedFailures, ...forbiddenFailures]) {
		console.log(`❌ ${failure.file}: ${failure.ruleId} (${failure.reason})`);
	}

	if (expectedFailures.length > 0 || forbiddenFailures.length > 0) {
		passed = false;
	}

	return passed;
}

function validatePresetChecks(checks) {
	let passed = true;

	for (const check of checks) {
		if (!validatePresetCheck(check)) {
			passed = false;
		}
	}

	return passed;
}

function validatePreset(
	label,
	presetModule,
	targets,
	requiredRules,
	forbiddenRules,
) {
	return validatePresetCheck({
		label,
		presetModules: [presetModule],
		targets,
		requiredRules,
		forbiddenRules,
	});
}

function isRuleEnabled(ruleConfig) {
	const severity = Array.isArray(ruleConfig) ? ruleConfig[0] : ruleConfig;
	return severity !== 'off' && severity !== 0;
}

async function collectEffectiveRuleIds() {
	const eslint = new ESLint({
		cwd: process.cwd(),
		overrideConfigFile: path.join(packageDir, 'index.js'),
	});
	const fileNames = [
		'App.tsx',
		'TsRules.ts',
		'__tests__/App.test.tsx',
		'test.web.tsx',
		'metro.config.js',
	];
	const ruleIds = new Set();

	for (const fileName of fileNames) {
		const fileConfig = await eslint.calculateConfigForFile(fileName);
		for (const [ruleId, ruleConfig] of Object.entries(fileConfig.rules ?? {})) {
			if (isRuleEnabled(ruleConfig)) {
				ruleIds.add(ruleId);
			}
		}
	}

	return ruleIds;
}

function sortRuleIds(ruleIds) {
	return [...ruleIds].sort((a, b) => a.localeCompare(b));
}

function findLegacyImportRules(ruleCounts) {
	return Object.keys(ruleCounts)
		.filter((ruleId) => ruleId.startsWith('import/'))
		.sort();
}

function isValidationPassing({
	missingRules,
	missingRuleFileCoverage,
	legacyImportRules,
	uncoveredEffectiveRules,
	staleConfigOnlyRules,
	basePresetPassed,
	defaultPresetPassed,
	strictPresetPassed,
	typedPresetPassed,
	focusedPresetPassed,
}) {
	return (
		missingRules.length === 0 &&
		missingRuleFileCoverage.length === 0 &&
		legacyImportRules.length === 0 &&
		uncoveredEffectiveRules.length === 0 &&
		staleConfigOnlyRules.length === 0 &&
		basePresetPassed &&
		defaultPresetPassed &&
		strictPresetPassed &&
		typedPresetPassed &&
		focusedPresetPassed
	);
}

async function runValidation() {
	console.log('🚀 ESLint Config Expo Magic - Comprehensive Validation Suite');
	console.log('===========================================================\n');
	console.log('📋 Running ESLint...');

	const result = runCommand('bunx', ['eslint', '.', '--format=json']);
	const eslintOutput = result.stdout.trim();
	const results = JSON.parse(eslintOutput);
	const { ruleCounts, ruleFiles, totalErrors, totalWarnings } =
		collectLintRuleResults(results, repoRoot);
	const legacyImportRules = findLegacyImportRules(ruleCounts);

	console.log('\n📊 Analysis Results:');
	console.log('===================');
	console.log(`Total Errors: ${totalErrors}`);
	console.log(`Total Warnings: ${totalWarnings}`);
	console.log(`Total Problems: ${totalErrors + totalWarnings}`);

	console.log('\n🔍 Checking Expected Rules:');
	console.log('===========================');

	const missingRules = [];
	const missingRuleFileCoverage = findMissingRuleFileCoverage(
		expectedRuleFiles,
		ruleFiles,
	);
	const extraRules = [];
	const effectiveRuleIds = await collectEffectiveRuleIds();
	const reportedRuleIds = new Set(Object.keys(ruleCounts));
	const uncoveredEffectiveRules = sortRuleIds(effectiveRuleIds).filter(
		(ruleId) => !reportedRuleIds.has(ruleId) && !configOnlyRules.has(ruleId),
	);
	const staleConfigOnlyRules = sortRuleIds(configOnlyRules.keys()).filter(
		(ruleId) => !effectiveRuleIds.has(ruleId),
	);

	for (const ruleId of Object.keys(expectedRules)) {
		const count = ruleCounts[ruleId];
		if (!count) {
			missingRules.push(ruleId);
			continue;
		}

		console.log(`✅ ${ruleId}: ${count} occurrences`);
	}

	for (const [ruleId, count] of Object.entries(ruleCounts)) {
		if (!expectedRules[ruleId]) {
			extraRules.push(`${ruleId} (${count} occurrences)`);
		}
	}

	if (missingRules.length > 0) {
		console.log('\n❌ Missing Expected Rules:');
		missingRules.forEach((rule) => console.log(`   - ${rule}`));
	}

	if (missingRuleFileCoverage.length > 0) {
		console.log('\n❌ Missing Expected Rule/File Coverage:');
		missingRuleFileCoverage.forEach(({ ruleId, files }) => {
			console.log(`   - ${ruleId}: ${files.join(', ')}`);
		});
	}

	if (extraRules.length > 0) {
		console.log('\nℹ️  Additional Reported Rules:');
		extraRules.forEach((rule) => console.log(`   - ${rule}`));
	}

	if (legacyImportRules.length > 0) {
		console.log('\n❌ Unexpected Legacy Import Diagnostics:');
		legacyImportRules.forEach((ruleId) => console.log(`   - ${ruleId}`));
	}

	if (uncoveredEffectiveRules.length > 0) {
		console.log('\n❌ Effective Rules Without Fixture Coverage:');
		uncoveredEffectiveRules.forEach((rule) => console.log(`   - ${rule}`));
	}

	if (staleConfigOnlyRules.length > 0) {
		console.log('\n❌ Config-Only Rules Are No Longer Effective:');
		staleConfigOnlyRules.forEach((rule) => console.log(`   - ${rule}`));
	}

	if (configOnlyRules.size > 0) {
		console.log('\n🧭 Config-Only Rule Coverage:');
		for (const [ruleId, reason] of configOnlyRules) {
			console.log(`✅ ${ruleId}: ${reason}`);
		}
	}

	const strictPresetPassed = validatePreset(
		'strict',
		'eslint-config-expo-magic/strict',
		['preset-fixtures/strict-only.ts'],
		[
			{ ruleId: 'no-console', severity: 2 },
			{ ruleId: '@typescript-eslint/no-non-null-assertion', severity: 2 },
			{ ruleId: '@typescript-eslint/no-misused-promises', severity: 2 },
		],
	);

	const basePresetPassed = validatePreset(
		'base',
		'eslint-config-expo-magic/base',
		['preset-fixtures/base-only.ts'],
		[
			{ ruleId: 'expo/no-dynamic-env-var', severity: 2 },
			{ ruleId: 'expo/no-env-var-destructuring', severity: 2 },
		],
		['no-console', 'prettier/prettier'],
	);

	const defaultPresetPassed = validatePreset(
		'default',
		'eslint-config-expo-magic',
		['preset-fixtures/default-only.ts'],
		[
			{ ruleId: 'no-console', severity: 1 },
			{ ruleId: 'import-x/order', severity: 2 },
		],
		['prettier/prettier'],
	);

	const typedPresetPassed = validatePreset(
		'typed',
		'eslint-config-expo-magic/typed',
		['preset-fixtures/typed-only.ts'],
		[{ ruleId: '@typescript-eslint/no-base-to-string', severity: 2 }],
	);

	const focusedPresetPassed = validatePresetChecks([
		{
			label: 'component structure',
			presetModules: [
				'eslint-config-expo-magic',
				'eslint-config-expo-magic/component-structure',
			],
			targets: ['preset-fixtures/component-structure.tsx'],
			requiredRules: [
				{ ruleId: 'expo-magic/no-inline-props', severity: 2 },
				{ ruleId: 'expo-magic/props-type-order', severity: 1 },
				{ ruleId: 'expo-magic/default-export-placement', severity: 2 },
				{ ruleId: 'expo-magic/require-children-usage', severity: 1 },
			],
		},
		{
			label: 'deprecated APIs',
			presetModules: [
				'eslint-config-expo-magic',
				'eslint-config-expo-magic/deprecated-apis',
			],
			targets: ['preset-fixtures/deprecated-apis.tsx'],
			requiredRules: [
				{ ruleId: 'no-restricted-properties', severity: 2 },
				{ ruleId: '@typescript-eslint/no-restricted-types', severity: 2 },
			],
		},
		{
			label: 'native UI restrictions',
			presetModules: [
				'eslint-config-expo-magic',
				'eslint-config-expo-magic/native-ui',
			],
			targets: ['preset-fixtures/native-ui.tsx'],
			requiredRules: [{ ruleId: 'no-restricted-imports', severity: 2 }],
		},
		{
			label: 'React Compiler diagnostics',
			presetModules: [
				'eslint-config-expo-magic',
				'eslint-config-expo-magic/react-compiler',
			],
			targets: ['preset-fixtures/react-compiler-focused.tsx'],
			requiredRules: [
				{ ruleId: 'react-hooks/purity', severity: 2 },
				{ ruleId: 'react-hooks/set-state-in-render', severity: 2 },
			],
		},
		{
			label: 'Reanimated restrictions',
			presetModules: [
				'eslint-config-expo-magic',
				'eslint-config-expo-magic/reanimated',
			],
			targets: ['preset-fixtures/reanimated.tsx'],
			requiredRules: [
				{
					ruleId: 'expo-magic-reanimated/no-shared-value-misuse',
					severity: 2,
				},
			],
		},
		{
			label: 'semantic colors',
			presetModules: [
				'eslint-config-expo-magic',
				'eslint-config-expo-magic/semantic-colors',
			],
			targets: ['preset-fixtures/semantic-colors.tsx'],
			requiredRules: [{ ruleId: 'no-restricted-syntax', severity: 2 }],
		},
		{
			label: 'storybook overrides',
			presetModules: [
				'eslint-config-expo-magic',
				'eslint-config-expo-magic/storybook',
			],
			targets: ['preset-fixtures/Button.stories.tsx'],
			requiredRules: [
				{ ruleId: '@typescript-eslint/no-explicit-any', severity: 2 },
			],
			forbiddenRules: ['no-console'],
		},
		{
			label: 'TypeScript extension scopes',
			presetModules: ['eslint-config-expo-magic'],
			targets: [
				'preset-fixtures/extensions/probe.cts',
				'preset-fixtures/extensions/probe.mts',
				'preset-fixtures/extensions/probe.d.cts',
				'preset-fixtures/extensions/probe.d.mts',
				'preset-fixtures/extensions/probe.d.ts',
			],
			requiredRules: [
				{ ruleId: '@typescript-eslint/no-explicit-any', severity: 2 },
			],
		},
	]);

	console.log('\n🎯 Final Validation:');
	console.log('===================');

	if (
		isValidationPassing({
			missingRules,
			missingRuleFileCoverage,
			legacyImportRules,
			uncoveredEffectiveRules,
			staleConfigOnlyRules,
			basePresetPassed,
			defaultPresetPassed,
			strictPresetPassed,
			typedPresetPassed,
			focusedPresetPassed,
		})
	) {
		console.log('🎉 All expected rules and file coverage checks passed!');
		console.log('🚀 Ready for publishing!');
		return true;
	}

	console.log('❌ VALIDATION FAILED!');
	console.log('🚫 PUBLISH CANCELLED - Check the configuration and test files.');
	return false;
}

module.exports = {
	findLegacyImportRules,
	isValidationPassing,
};

if (require.main === module) {
	runValidation()
		.then((success) => {
			process.exit(success ? 0 : 1);
		})
		.catch((error) => {
			console.error('❌ Error running validation:', error.message);
			process.exit(1);
		});
}
