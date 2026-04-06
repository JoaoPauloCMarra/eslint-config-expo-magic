#!/usr/bin/env bun

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const packageDir = path.join(rootDir, 'packages', 'eslint-config-expo-magic');

const smokeLanes = [
	{
		name: 'sdk-54',
		expo: '54.0.33',
		react: '19.1.0',
		reactNative: '0.81.5',
		reactTestRenderer: '19.1.0',
	},
	{
		name: 'sdk-55',
		expo: '55.0.9',
		react: '19.2.0',
		reactNative: '0.83.4',
		reactTestRenderer: '19.2.0',
	},
];

const previewSmokeLanes = [
	{
		name: 'sdk-56-preview',
		expo: '56.0.0-canary-20260305-5163746',
		react: '19.2.3',
		reactNative: '0.84.1',
		reactTestRenderer: '19.2.3',
	},
];

function run(command, args, options = {}) {
	const result = spawnSync(command, args, {
		encoding: 'utf8',
		stdio: 'pipe',
		...options,
	});

	if (result.error) {
		throw result.error;
	}

	if (result.status !== 0) {
		throw new Error(result.stderr || result.stdout || `${command} failed`);
	}

	return result;
}

function runLint(tempProjectDir, configFile, targetFile) {
	const result = spawnSync(
		'bunx',
		[
			'eslint',
			targetFile,
			'--no-config-lookup',
			'--config',
			configFile,
			'--format=json',
		],
		{
			cwd: tempProjectDir,
			encoding: 'utf8',
		},
	);

	if (![0, 1].includes(result.status ?? -1)) {
		throw new Error(
			result.stderr || result.stdout || 'ESLint smoke run failed.',
		);
	}

	const lintResults = JSON.parse(result.stdout || '[]');
	const messages = lintResults.flatMap(
		(lintResult) => lintResult.messages ?? [],
	);
	const fatalMessage = messages.find((message) => message.fatal);

	if (fatalMessage) {
		throw new Error(fatalMessage.message);
	}

	return messages;
}

function listTarballs() {
	return fs
		.readdirSync(packageDir)
		.filter((file) => file.endsWith('.tgz'))
		.sort((leftFile, rightFile) => {
			const leftPath = path.join(packageDir, leftFile);
			const rightPath = path.join(packageDir, rightFile);
			return fs.statSync(rightPath).mtimeMs - fs.statSync(leftPath).mtimeMs;
		});
}

function createFixturePackageJson(tarballPath, lane) {
	return {
		name: `eslint-config-expo-magic-smoke-${lane.name}`,
		private: true,
		type: 'commonjs',
		devDependencies: {
			eslint: '^10.0.0',
			expo: lane.expo,
			react: lane.react,
			'react-native': lane.reactNative,
			'react-test-renderer': lane.reactTestRenderer,
			typescript: '^5.9.3',
			'eslint-config-expo-magic': `file:${tarballPath}`,
		},
	};
}

function writeFixtureFiles(tempProjectDir) {
	const srcDir = path.join(tempProjectDir, 'src');
	fs.mkdirSync(srcDir, { recursive: true });

	fs.writeFileSync(
		path.join(tempProjectDir, 'tsconfig.json'),
		`${JSON.stringify(
			{
				compilerOptions: {
					module: 'esnext',
					target: 'es2022',
					moduleResolution: 'bundler',
					strict: true,
					baseUrl: '.',
					paths: {
						'@/*': ['src/*'],
					},
				},
				include: ['**/*.ts'],
			},
			null,
			2,
		)}\n`,
	);

	fs.writeFileSync(path.join(srcDir, 'local-value.ts'), 'export default 1;\n');

	fs.writeFileSync(
		path.join(tempProjectDir, 'base-smoke.ts'),
		[
			"const envKey = 'EXPO_PUBLIC_API_URL';",
			'const dynamicEnv = process.env[envKey];',
			'const { EXPO_PUBLIC_TEST } = process.env;',
			'',
			'export const baseSmokeValue = [dynamicEnv, EXPO_PUBLIC_TEST].join(\":\");',
			'',
		].join('\n'),
	);

	fs.writeFileSync(
		path.join(tempProjectDir, 'default-smoke.ts'),
		[
			"import zlib from 'node:zlib';",
			"import path from 'node:path';",
			'',
			'console.log(path.sep, zlib.constants.Z_BEST_SPEED);',
			'',
		].join('\n'),
	);

	fs.writeFileSync(
		path.join(tempProjectDir, 'strict-smoke.ts'),
		[
			"import localValue from '@/local-value';",
			'',
			'console.log(localValue);',
			'',
		].join('\n'),
	);

	fs.writeFileSync(
		path.join(tempProjectDir, 'typed-smoke.ts'),
		[
			"import localValue from '@/local-value';",
			"import { describe } from 'bun:test';",
			'',
			'export const describeType = `${localValue}:${typeof describe}`;',
			'export const typedOnlyValue = `${{ answer: 42 }}`;',
			'',
		].join('\n'),
	);

	fs.writeFileSync(
		path.join(tempProjectDir, 'typed-esm-smoke.ts'),
		[
			"import localValue from '@/local-value';",
			"import { describe } from 'bun:test';",
			'',
			'export const typedEsmValue = `${localValue}:${typeof describe}:${{ answer: 42 }}`;',
			'',
		].join('\n'),
	);

	fs.writeFileSync(
		path.join(tempProjectDir, 'no-prettier-smoke.ts'),
		[
			"import localValue from '@/local-value';",
			"import path from 'node:path';",
			'',
			'export const noPrettierValue = [localValue, path.sep];',
			'',
		].join('\n'),
	);

	fs.writeFileSync(
		path.join(tempProjectDir, 'factory-custom-smoke.ts'),
		[
			"import zlib from 'node:zlib';",
			"import path from 'node:path';",
			'',
			'console.log(path.sep,zlib.constants.Z_BEST_SPEED)',
			'',
		].join('\n'),
	);

	fs.writeFileSync(
		path.join(tempProjectDir, 'eslint.base.config.js'),
		"const base = require('eslint-config-expo-magic/base');\n\nmodule.exports = [...base];\n",
	);
	fs.writeFileSync(
		path.join(tempProjectDir, 'eslint.default.config.js'),
		"const config = require('eslint-config-expo-magic');\n\nmodule.exports = [...config];\n",
	);
	fs.writeFileSync(
		path.join(tempProjectDir, 'eslint.strict.config.js'),
		"const strict = require('eslint-config-expo-magic/strict');\n\nmodule.exports = [...strict];\n",
	);
	fs.writeFileSync(
		path.join(tempProjectDir, 'eslint.typed.config.js'),
		"const typed = require('eslint-config-expo-magic/typed');\n\nmodule.exports = [...typed];\n",
	);
	fs.writeFileSync(
		path.join(tempProjectDir, 'eslint.typed-esm.config.mjs'),
		"import typed from 'eslint-config-expo-magic/typed';\n\nexport default [...typed];\n",
	);
	fs.writeFileSync(
		path.join(tempProjectDir, 'eslint.no-prettier.config.js'),
		"const noPrettier = require('eslint-config-expo-magic/no-prettier');\n\nmodule.exports = [...noPrettier];\n",
	);
	fs.writeFileSync(
		path.join(tempProjectDir, 'eslint.factory.config.js'),
		[
			"const { createConfig } = require('eslint-config-expo-magic');",
			'',
			'module.exports = [',
			'\t...createConfig({',
			"\t\ttsconfigProjects: ['./tsconfig.json'],",
			'\t\tprettier: false,',
			'\t\ttesting: false,',
			'\t}),',
			'];',
			'',
		].join('\n'),
	);
}

function validateLane(tempProjectDir) {
	const baseMessages = runLint(
		tempProjectDir,
		'eslint.base.config.js',
		'base-smoke.ts',
	);
	if (
		!baseMessages.some(
			(message) => message.ruleId === 'expo/no-dynamic-env-var',
		)
	) {
		throw new Error('Base preset did not report expo/no-dynamic-env-var.');
	}
	if (
		!baseMessages.some(
			(message) => message.ruleId === 'expo/no-env-var-destructuring',
		)
	) {
		throw new Error(
			'Base preset did not report expo/no-env-var-destructuring.',
		);
	}
	if (baseMessages.some((message) => message.ruleId === 'no-console')) {
		throw new Error('Base preset should not report no-console.');
	}

	const defaultMessages = runLint(
		tempProjectDir,
		'eslint.default.config.js',
		'default-smoke.ts',
	);
	if (!defaultMessages.some((message) => message.ruleId === 'no-console')) {
		throw new Error('Default preset did not report no-console.');
	}
	if (
		!defaultMessages.some((message) => message.ruleId === 'import-x/order')
	) {
		throw new Error('Default preset did not report import-x/order.');
	}
	if (
		!defaultMessages.some((message) => message.ruleId === 'prettier/prettier')
	) {
		throw new Error('Default preset did not report prettier/prettier.');
	}

	const strictMessages = runLint(
		tempProjectDir,
		'eslint.strict.config.js',
		'strict-smoke.ts',
	);
	if (!strictMessages.some((message) => message.ruleId === 'no-console')) {
		throw new Error('Strict preset did not report no-console.');
	}

	const typedMessages = runLint(
		tempProjectDir,
		'eslint.typed.config.js',
		'typed-smoke.ts',
	);
	if (
		!typedMessages.some(
			(message) => message.ruleId === '@typescript-eslint/no-base-to-string',
		)
	) {
		throw new Error(
			'Typed preset did not report @typescript-eslint/no-base-to-string.',
		);
	}
	if (
		typedMessages.some((message) => message.ruleId === 'import-x/no-unresolved')
	) {
		throw new Error('Typed preset failed to resolve bun:test.');
	}

	const typedEsmMessages = runLint(
		tempProjectDir,
		'eslint.typed-esm.config.mjs',
		'typed-esm-smoke.ts',
	);
	if (
		!typedEsmMessages.some(
			(message) => message.ruleId === '@typescript-eslint/no-base-to-string',
		)
	) {
		throw new Error(
			'ESM typed preset did not report @typescript-eslint/no-base-to-string.',
		);
	}
	if (
		typedEsmMessages.some(
			(message) => message.ruleId === 'import-x/no-unresolved',
		)
	) {
		throw new Error('ESM typed preset failed to resolve bun:test.');
	}

	const noPrettierMessages = runLint(
		tempProjectDir,
		'eslint.no-prettier.config.js',
		'no-prettier-smoke.ts',
	);
	if (
		noPrettierMessages.some((message) => message.ruleId === 'prettier/prettier')
	) {
		throw new Error('no-prettier preset reported prettier/prettier.');
	}
	if (
		!noPrettierMessages.some((message) => message.ruleId === 'import-x/order')
	) {
		throw new Error('no-prettier preset did not report import-x/order.');
	}

	const factoryMessages = runLint(
		tempProjectDir,
		'eslint.factory.config.js',
		'factory-custom-smoke.ts',
	);
	if (!factoryMessages.some((message) => message.ruleId === 'no-console')) {
		throw new Error('Factory config did not report no-console.');
	}
	if (!factoryMessages.some((message) => message.ruleId === 'import-x/order')) {
		throw new Error('Factory config did not report import-x/order.');
	}
	if (factoryMessages.some((message) => message.ruleId === 'prettier/prettier')) {
		throw new Error('Factory config should not report prettier/prettier.');
	}
	if (
		factoryMessages.some((message) => message.ruleId === 'jest/no-disabled-tests')
	) {
		throw new Error('Factory config should not enable Jest rules when testing is false.');
	}
}

function main() {
	const lanes = process.argv.includes('--all-lanes')
		? [...smokeLanes, ...previewSmokeLanes]
		: process.argv.includes('--preview')
			? previewSmokeLanes
			: smokeLanes;
	const tarballsBefore = new Set(listTarballs());
	let generatedTarballPath;
	const tempProjectDirs = [];

	try {
		console.log('Packing local tarball...');
		run('bun', ['pm', 'pack'], { cwd: packageDir });

		const newTarball = listTarballs().find((file) => !tarballsBefore.has(file));
		if (!newTarball) {
			throw new Error('Could not find generated tarball from bun pm pack.');
		}

		generatedTarballPath = path.join(packageDir, newTarball);

		for (const lane of lanes) {
			console.log(`Installing packed consumer for ${lane.name}...`);
			const tempProjectDir = fs.mkdtempSync(
				path.join(os.tmpdir(), `eslint-config-expo-magic-${lane.name}-`),
			);
			tempProjectDirs.push(tempProjectDir);

			fs.writeFileSync(
				path.join(tempProjectDir, 'package.json'),
				`${JSON.stringify(
					createFixturePackageJson(generatedTarballPath, lane),
					null,
					2,
				)}\n`,
			);

			run('bun', ['install'], { cwd: tempProjectDir });
			writeFixtureFiles(tempProjectDir);
			validateLane(tempProjectDir);
		}

		console.log('Pack smoke checks passed.');
	} finally {
		for (const tempProjectDir of tempProjectDirs) {
			fs.rmSync(tempProjectDir, { recursive: true, force: true });
		}

		if (generatedTarballPath && fs.existsSync(generatedTarballPath)) {
			fs.unlinkSync(generatedTarballPath);
		}
	}
}

main();
