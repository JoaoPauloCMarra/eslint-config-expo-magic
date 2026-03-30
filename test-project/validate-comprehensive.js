#!/usr/bin/env bun

const fs = require('fs');
const os = require('os');
const { spawnSync } = require('child_process');
const path = require('path');

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
	'jest/no-disabled-tests': ['App.test.tsx'],
	'jest/no-done-callback': ['App.test.tsx'],
	'jest/no-export': ['App.test.tsx'],
	'jest/no-focused-tests': ['App.test.tsx'],
	'jest/no-identical-title': ['App.test.tsx'],
	'jest/no-jasmine-globals': ['JestAdvanced.test.tsx'],
	'jest/valid-describe-callback': ['App.test.tsx'],
	'jest/valid-title': ['App.test.tsx'],

	// Testing Library rules
	'testing-library/await-async-queries': ['App.test.tsx'],
	'testing-library/no-debugging-utils': ['App.test.tsx'],

	// Import rules
	'import-x/first': ['App.tsx'],
	'import-x/no-amd': ['ImportsAdvanced.tsx'],
	'import-x/no-anonymous-default-export': ['BadImports.tsx'],
	'import-x/no-duplicates': ['App.tsx'],
	'import-x/no-unresolved': ['ImportsAdvanced.tsx', 'alias-unresolved.ts'],
	'import-x/no-webpack-loader-syntax': ['ImportsAdvanced.tsx'],
	'import-x/order': ['App.tsx', 'import-violations.ts'],

	// General rules
	eqeqeq: ['App.tsx'],
	'expo/prefer-box-shadow': ['GeneralAdvanced.tsx'],
	'no-console': [
		'App.tsx',
		'analyze-rules.js',
		'babel.config.js',
		'find-missing-rules.js',
		'index.js',
		'metro.config.js',
		'validate-comprehensive.js',
		'validate.js',
	],
	'no-dupe-args': ['GeneralAdvanced.tsx'],
	'no-dupe-keys': ['App.tsx'],
	'no-duplicate-case': ['App.tsx'],
	'no-empty-pattern': ['App.tsx'],
	'no-extend-native': ['GeneralAdvanced.tsx'],
	'no-restricted-imports': ['App.tsx'],
	'no-undef': ['validate.js'],
	'no-unreachable': ['App.tsx'],
	'no-unsafe-negation': ['App.tsx'],
	'no-unused-expressions': ['App.tsx', 'GeneralAdvanced.tsx'],
	'no-unused-labels': ['App.tsx'],
	'no-unused-vars': [
		'App.test.tsx',
		'App.tsx',
		'metro.config.js',
		'validate.js',
	],
	'no-var': ['App.tsx'],
	'no-with': ['GeneralAdvanced.tsx'],
	'unused-imports/no-unused-imports': ['App.tsx'],

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
		'validate.js',
	],
};

expectedRules['@typescript-eslint/no-explicit-any'].push(
	'module-file.cts',
	'module-file.mts',
);

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

function runValidation() {
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
		console.log('\n⚠️  Unexpected Rules (might be okay):');
		extraRules.forEach((rule) => console.log(`   - ${rule}`));
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

try {
	const success = runValidation();
	process.exit(success ? 0 : 1);
} catch (error) {
	console.error('❌ Error running validation:', error.message);
	process.exit(1);
}
