#!/usr/bin/env bun

const fs = require('fs');
const os = require('os');
const { spawnSync } = require('child_process');
const path = require('path');
const { ESLint } = require('eslint');

console.log('🚀 ESLint Config Expo Magic - Comprehensive Validation Suite');
console.log('===========================================================\n');

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
	'@typescript-eslint/no-require-imports': ['TypeScriptAdvanced.tsx'],
	'@typescript-eslint/no-unused-vars': ['App.test.tsx', 'App.tsx'],
	'@typescript-eslint/no-useless-constructor': ['App.tsx'],

	// React rules
	'react-19-upgrade/no-factories': ['App.tsx'],
	'react-19-upgrade/no-string-refs': ['App.tsx'],
	'react-hooks/exhaustive-deps': ['App.tsx'],
	'react-native/no-unused-styles': ['ReactAdvanced.tsx'],
	'react/display-name': ['BadImports.tsx'],
	'react/jsx-key': ['App.tsx'],
	'react/jsx-no-comment-textnodes': ['App.tsx'],
	'react/jsx-no-duplicate-props': ['App.tsx'],
	'react/jsx-no-undef': ['App.tsx'],
	'react/no-children-prop': ['App.tsx'],
	'react/no-danger-with-children': ['App.tsx'],
	'react/no-string-refs': ['App.tsx'],
	'react/no-unknown-property': ['BadImports.tsx'],
	'react/self-closing-comp': ['App.tsx'],

	// Jest rules
	'jest/expect-expect': ['App.test.tsx'],
	'jest/no-commented-out-tests': ['App.test.tsx'],
	'jest/no-conditional-expect': ['App.test.tsx'],
	'jest/no-deprecated-functions': ['App.test.tsx'],
	'jest/no-disabled-tests': ['App.test.tsx'],
	'jest/no-done-callback': ['App.test.tsx'],
	'jest/no-export': ['App.test.tsx'],
	'jest/no-focused-tests': ['App.test.tsx'],
	'jest/no-identical-title': ['App.test.tsx'],
	'jest/no-interpolation-in-snapshots': ['App.test.tsx'],
	'jest/no-jasmine-globals': ['JestAdvanced.test.tsx'],
	'jest/no-alias-methods': ['App.test.tsx'],
	'jest/no-mocks-import': ['App.test.tsx'],
	'jest/no-standalone-expect': ['standalone.test.ts'],
	'jest/no-test-prefixes': ['App.test.tsx'],
	'jest/prefer-hooks-on-top': ['App.test.tsx'],
	'jest/prefer-to-be': ['App.test.tsx'],
	'jest/valid-describe-callback': ['App.test.tsx'],
	'jest/valid-expect': ['App.test.tsx'],
	'jest/valid-expect-in-promise': ['App.test.tsx'],
	'jest/valid-title': ['App.test.tsx'],

	// Testing Library rules
	'testing-library/await-async-queries': ['App.test.tsx'],
	'testing-library/no-await-sync-queries': ['App.test.tsx'],
	'testing-library/no-debugging-utils': ['App.test.tsx'],
	'testing-library/no-dom-import': ['App.test.tsx'],

	// Import rules
	'import-x/export': ['duplicate-exports.ts'],
	'import-x/first': ['App.tsx'],
	'import-x/no-amd': ['ImportsAdvanced.tsx'],
	'import-x/no-anonymous-default-export': ['BadImports.tsx'],
	'import-x/no-cycle': ['cycleA.ts', 'cycleB.ts'],
	'import-x/no-duplicates': ['App.tsx'],
	'import-x/no-named-as-default': ['App.tsx'],
	'import-x/no-named-as-default-member': ['App.tsx'],
	'import-x/namespace': ['import-violations.ts'],
	'import-x/no-unresolved': ['ImportsAdvanced.tsx', 'alias-unresolved.ts'],
	'import-x/no-webpack-loader-syntax': ['ImportsAdvanced.tsx'],
	'import-x/order': ['App.tsx', 'import-violations.ts'],

	// General rules
	eqeqeq: ['App.tsx'],
	'expo/prefer-box-shadow': ['GeneralAdvanced.tsx'],
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
	'no-dupe-args': ['GeneralAdvanced.tsx'],
	'no-dupe-class-members': ['Legacy.js'],
	'no-dupe-keys': ['App.tsx'],
	'no-duplicate-case': ['App.tsx'],
	'no-empty-character-class': ['App.tsx'],
	'no-empty-pattern': ['App.tsx'],
	'no-extend-native': ['GeneralAdvanced.tsx'],
	'no-extra-bind': ['App.tsx'],
	'no-redeclare': ['Legacy.js'],
	'no-restricted-imports': ['App.tsx'],
	'no-undef': ['validate-comprehensive.js'],
	'no-unreachable': ['App.tsx'],
	'no-unsafe-negation': ['App.tsx'],
	'no-unused-expressions': ['App.tsx', 'GeneralAdvanced.tsx'],
	'no-unused-labels': ['App.tsx'],
	'no-unused-vars': [
		'App.test.tsx',
		'App.tsx',
		'metro.config.js',
	],
	'no-var': ['App.tsx'],
	'no-with': ['GeneralAdvanced.tsx'],
	'unicode-bom': ['bom.js'],
	'unused-imports/no-unused-imports': ['App.tsx'],
	'use-isnan': ['App.tsx'],
	'valid-typeof': ['App.tsx'],

	// Prettier rules
	'prettier/prettier': [
		'.eslintrc.js',
		'BadImports.tsx',
		'ImportsAdvanced.tsx',
		'SimpleList.tsx',
		'TestRefAccess.tsx',
		'UnusedComponent.tsx',
		'babel.config.js',
		'bom.js',
		'helpers.ts',
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
	'react-hooks/error-boundaries': ['ReactCompilerTests.tsx'],
	'react-hooks/immutability': ['compiler-rules-test.tsx'],
	'react-hooks/purity': ['ReactCompilerTests.tsx'],
	'react-hooks/refs': ['ReactCompilerTests.tsx'],
	'react-hooks/rules-of-hooks': ['App.tsx', 'ReactCompilerTests.tsx'],
	'react-hooks/set-state-in-render': ['ReactCompilerTests.tsx'],
	'react-hooks/static-components': ['ReactCompilerTests.tsx'],
	'react-hooks/unsupported-syntax': ['ReactCompilerTests.tsx'],
	'react-hooks/use-memo': ['ReactCompilerTests.tsx'],
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

const packageDir = path.resolve(
	__dirname,
	'..',
	'packages',
	'eslint-config-expo-magic',
);

function runCommand(command, args, options = {}) {
	const result = spawnSync(command, args, {
		cwd: process.cwd(),
		encoding: 'utf8',
		stdio: ['pipe', 'pipe', 'pipe'],
		...options,
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
		'eslint-config-expo-magic/base': 'base.js',
		'eslint-config-expo-magic/strict': 'strict.js',
		'eslint-config-expo-magic/no-prettier': 'no-prettier.js',
		'eslint-config-expo-magic/typed': 'typed.js',
	};

	const localPresetFile = localPresetFiles[presetModule];
	if (localPresetFile) {
		return path.join(packageDir, localPresetFile);
	}

	return presetModule;
}

function runPresetLint({ presetModule, targets }) {
	const tempDir = fs.mkdtempSync(
		path.join(os.tmpdir(), 'eslint-config-expo-magic-preset-'),
	);
	const configPath = path.join(tempDir, 'eslint.config.js');
	const presetModulePath = resolvePresetModulePath(presetModule);

	try {
		fs.writeFileSync(
			configPath,
			`const preset = require(${JSON.stringify(presetModulePath)});\n\nmodule.exports = [...preset];\n`,
		);

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
			{ cwd: process.cwd() },
		);

		return parseLintResults(result);
	} finally {
		fs.rmSync(tempDir, { recursive: true, force: true });
	}
}

function validatePreset({
	label,
	presetModule,
	targets,
	requiredRules,
	forbiddenRules = [],
}) {
	console.log(`\n🧪 Preset Check: ${label}`);
	console.log('==============================');

	const lintResults = runPresetLint({ presetModule, targets });
	const messages = lintResults.flatMap((result) => result.messages ?? []);

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

	return passed;
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

async function runValidation() {
	console.log('📋 Running ESLint...');

	const result = runCommand('bunx', ['eslint', '.', '--format=json']);
	const eslintOutput = result.stdout.trim();
	const results = JSON.parse(eslintOutput);

	const ruleCounts = {};
	const ruleFiles = {};
	let totalErrors = 0;
	let totalWarnings = 0;

	results.forEach((lintResult) => {
		if (!lintResult.filePath) {
			return;
		}

		const fileName = path.basename(lintResult.filePath);

		lintResult.messages.forEach((message) => {
			if (!message.ruleId) {
				return;
			}

			ruleCounts[message.ruleId] = (ruleCounts[message.ruleId] || 0) + 1;
			ruleFiles[message.ruleId] = ruleFiles[message.ruleId] || new Set();
			ruleFiles[message.ruleId].add(fileName);

			if (message.severity === 2) {
				totalErrors++;
			} else if (message.severity === 1) {
				totalWarnings++;
			}
		});
	});

	console.log('\n📊 Analysis Results:');
	console.log('===================');
	console.log(`Total Errors: ${totalErrors}`);
	console.log(`Total Warnings: ${totalWarnings}`);
	console.log(`Total Problems: ${totalErrors + totalWarnings}`);

	console.log('\n🔍 Checking Expected Rules:');
	console.log('===========================');

	const missingRules = [];
	const missingRuleFileCoverage = [];
	const extraRules = [];
	const effectiveRuleIds = await collectEffectiveRuleIds();
	const reportedRuleIds = new Set(Object.keys(ruleCounts));
	const uncoveredEffectiveRules = sortRuleIds(effectiveRuleIds).filter(
		(ruleId) => !reportedRuleIds.has(ruleId) && !configOnlyRules.has(ruleId),
	);
	const staleConfigOnlyRules = sortRuleIds(configOnlyRules.keys()).filter(
		(ruleId) => !effectiveRuleIds.has(ruleId),
	);

	for (const [ruleId, expectedFiles] of Object.entries(expectedRules)) {
		const count = ruleCounts[ruleId];
		if (!count) {
			missingRules.push(ruleId);
			continue;
		}

		const triggeredFiles = ruleFiles[ruleId] || new Set();
		const uncoveredFiles = expectedFiles.filter(
			(file) => !triggeredFiles.has(file),
		);
		if (uncoveredFiles.length > 0) {
			missingRuleFileCoverage.push({
				ruleId,
				files: uncoveredFiles,
			});
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

	const strictPresetPassed = validatePreset({
		label: 'strict',
		presetModule: 'eslint-config-expo-magic/strict',
		targets: ['preset-fixtures/strict-only.ts'],
		requiredRules: [
			{ ruleId: 'no-console', severity: 2 },
			{ ruleId: '@typescript-eslint/no-non-null-assertion', severity: 2 },
			{ ruleId: '@typescript-eslint/no-misused-promises', severity: 2 },
		],
	});

	const basePresetPassed = validatePreset({
		label: 'base',
		presetModule: 'eslint-config-expo-magic/base',
		targets: ['preset-fixtures/base-only.ts'],
		requiredRules: [
			{ ruleId: 'expo/no-dynamic-env-var', severity: 2 },
			{ ruleId: 'expo/no-env-var-destructuring', severity: 2 },
		],
		forbiddenRules: ['no-console', 'prettier/prettier'],
	});

	const defaultPresetPassed = validatePreset({
		label: 'default',
		presetModule: 'eslint-config-expo-magic',
		targets: ['preset-fixtures/default-only.ts'],
		requiredRules: [
			{ ruleId: 'no-console', severity: 1 },
			{ ruleId: 'import-x/order', severity: 2 },
			{ ruleId: 'prettier/prettier', severity: 2 },
		],
	});

	const noPrettierPresetPassed = validatePreset({
		label: 'no-prettier',
		presetModule: 'eslint-config-expo-magic/no-prettier',
		targets: ['preset-fixtures/no-prettier.ts'],
		requiredRules: [{ ruleId: 'import-x/order', severity: 2 }],
		forbiddenRules: ['prettier/prettier'],
	});

	const typedPresetPassed = validatePreset({
		label: 'typed',
		presetModule: 'eslint-config-expo-magic/typed',
		targets: ['preset-fixtures/typed-only.ts'],
		requiredRules: [
			{ ruleId: '@typescript-eslint/no-base-to-string', severity: 2 },
		],
	});

	console.log('\n🎯 Final Validation:');
	console.log('===================');

	if (
		missingRules.length === 0 &&
		missingRuleFileCoverage.length === 0 &&
		uncoveredEffectiveRules.length === 0 &&
		staleConfigOnlyRules.length === 0 &&
		basePresetPassed &&
		defaultPresetPassed &&
		strictPresetPassed &&
		noPrettierPresetPassed &&
		typedPresetPassed
	) {
		console.log('🎉 All expected rules and file coverage checks passed!');
		console.log('🚀 Ready for publishing!');
		return true;
	}

	console.log('❌ VALIDATION FAILED!');
	console.log('🚫 PUBLISH CANCELLED - Check the configuration and test files.');
	return false;
}

runValidation()
	.then((success) => {
		process.exit(success ? 0 : 1);
	})
	.catch((error) => {
		console.error('❌ Error running validation:', error.message);
		process.exit(1);
	});
