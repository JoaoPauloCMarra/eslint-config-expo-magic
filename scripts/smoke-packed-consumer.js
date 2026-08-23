#!/usr/bin/env bun

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { createRequire } = require('node:module');
const {
	run,
	withPackedTarball,
	withTempConsumer,
	writeJson,
} = require('./lib/packed-consumer.js');
const NO_RESTRICTED_SYNTAX_RULE_ID = 'no-restricted-syntax';
const REANIMATED_SHARED_VALUE_RULE_ID = 'expo-magic-reanimated/no-shared-value-misuse';

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
		typescript: '^5.9.3',
	},
	{
		name: 'sdk-56',
		expo: '56.0.9',
		react: '19.2.3',
		reactNative: '0.85.3',
		reactTestRenderer: '19.2.3',
		typescript: '^6.0.3',
	},
	{
		name: 'sdk-57',
		expo: '57.0.15',
		react: '19.2.3',
		reactNative: '0.86.2',
		reactTestRenderer: '19.2.3',
		typescript: '^6.0.3',
	},
];

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

function assertHasRule(messages, ruleId, message) {
	if (!messages.some((entry) => entry.ruleId === ruleId)) {
		throw new Error(message);
	}
}

function assertLacksRule(messages, ruleId, message) {
	if (messages.some((entry) => entry.ruleId === ruleId)) {
		throw new Error(message);
	}
}

function assertMessageForRule(messages, ruleId, messageText, errorMessage) {
	const hasMatch = messages.some(
		(message) =>
			message.ruleId === ruleId &&
			message.message.includes(messageText),
	);
	if (!hasMatch) {
		throw new Error(errorMessage);
	}
}

function createFixturePackageJson(tarballPath, lane) {
	return {
		name: `eslint-config-expo-magic-smoke-${lane.name}`,
		private: true,
		type: 'commonjs',
		devDependencies: {
			'@testing-library/react-native': '^14.0.1',
			eslint: '^10.9.0',
			'eslint-config-prettier': '^10.1.8',
			expo: lane.expo,
			'eslint-plugin-boundaries': '^7.2.0',
			'eslint-plugin-jest': '^29.16.1',
			'eslint-plugin-prettier': '^5.5.6',
			'eslint-plugin-testing-library': '^7.16.2',
			prettier: '^3.9.6',
			react: lane.react,
			'react-native': lane.reactNative,
			'react-test-renderer': lane.reactTestRenderer,
			typescript: lane.typescript ?? '^5.9.3',
			'eslint-config-expo-magic': `file:${tarballPath}`,
			jest: '^30.4.2',
		},
	};
}

function createNpmFixturePackageJson(tarballPath) {
	return {
		name: 'eslint-config-expo-magic-npm-consumer',
		private: true,
		type: 'module',
		dependencies: {
			eslint: '^10.9.0',
			expo: '57.0.15',
			react: '19.2.3',
			typescript: '6.0.3',
			'eslint-config-expo-magic': `file:${tarballPath}`,
		},
	};
}

function isRuntimeNamedExport(name) {
	return /^[$A-Z_a-z][$\w]*$/.test(name) && !/^(?:0|[1-9]\d*)$/.test(name);
}

function packageSpecifier(packageName, subpath) {
	return subpath === '.' ? packageName : `${packageName}${subpath.slice(1)}`;
}

function collectTypeOnlyExportNames(typeScript, sourceFile) {
	const names = new Set();

	function hasExportModifier(node) {
		return node.modifiers?.some(
			(modifier) => modifier.kind === typeScript.SyntaxKind.ExportKeyword,
		);
	}

	function visitStatements(statements, namespaceBody = false) {
		for (const statement of statements) {
			if (
				(typeScript.isTypeAliasDeclaration(statement) ||
					typeScript.isInterfaceDeclaration(statement)) &&
				(namespaceBody || hasExportModifier(statement))
			) {
				names.add(statement.name.text);
			}

			if (typeScript.isExportDeclaration(statement)) {
				const exportClause = statement.exportClause;
				if (
					exportClause &&
					typeScript.isNamedExports(exportClause) &&
					(namespaceBody || statement.isTypeOnly)
				) {
					for (const element of exportClause.elements) {
						names.add(element.name.text);
					}
				}
			}

			if (
				typeScript.isModuleDeclaration(statement) &&
				statement.body &&
				typeScript.isModuleBlock(statement.body)
			) {
				visitStatements(statement.body.statements, true);
			}
		}
	}

	visitStatements(sourceFile.statements);
	return [...names].sort();
}

function writeRuntimeContract(
	tempProjectDir,
	{ includeOptionalIntegrations = true } = {},
) {
	fs.writeFileSync(
		path.join(tempProjectDir, 'package-runtime-contract.mjs'),
		[
			"import assert from 'node:assert/strict';",
			"import { createRequire } from 'node:module';",
			'',
			'const require = createRequire(import.meta.url);',
			"const manifest = require('eslint-config-expo-magic/package.json');",
			`const includeOptionalIntegrations = ${includeOptionalIntegrations};`,
			'',
			'function packageSpecifier(subpath) {',
			"\treturn subpath === '.' ? manifest.name : `${manifest.name}${subpath.slice(1)}`;",
			'}',
			'',
			'function isRuntimeNamedExport(name) {',
			'\treturn /^[$A-Z_a-z][$\\w]*$/.test(name) && !/^(?:0|[1-9]\\d*)$/.test(name);',
			'}',
			'',
			'for (const [subpath, exportValue] of Object.entries(manifest.exports)) {',
			"\tif (!includeOptionalIntegrations && subpath === './feature-boundaries') continue;",
			'\tconst specifier = packageSpecifier(subpath);',
			'',
			"\tif (typeof exportValue === 'string') {",
			'\t\tconst exportedValue = require(specifier);',
			'\t\tassert.equal(exportedValue.name, manifest.name);',
			'\t\tassert.equal(exportedValue.version, manifest.version);',
			'\t\tcontinue;',
			'\t}',
			'',
			'\tassert.equal(typeof exportValue.types, "string");',
			'\tassert.equal(typeof exportValue.require, "string");',
		'\tassert.equal(typeof exportValue.import, "string");',
		'\tconst commonJsModule = require(specifier);',
		'\tconst esmModule = await import(specifier);',
		'\tconst commonJsNamedExports = Object.keys(commonJsModule)',
		'\t\t.filter(isRuntimeNamedExport)',
		'\t\t.sort();',
		'\tconst esmNamedExports = Object.keys(esmModule)',
		"\t\t.filter((name) => name !== 'default')",
		'\t\t.sort();',
		'',
		'\tassert.equal(esmModule.default, commonJsModule, `${subpath} default export`);',
		'\tassert.deepEqual(esmNamedExports, commonJsNamedExports, `${subpath} named exports`);',
			'}',
			'',
		].join('\n'),
	);
}

function writeTypeContract(tempProjectDir) {
	const consumerRequire = createRequire(
		path.join(tempProjectDir, 'package.json'),
	);
	const manifestPath = consumerRequire.resolve(
		'eslint-config-expo-magic/package.json',
	);
	const packageRoot = path.dirname(manifestPath);
	const manifest = consumerRequire('eslint-config-expo-magic/package.json');
	const typeScript = consumerRequire('typescript');
	const sourceLines = [];
	let exportIndex = 0;

	for (const [subpath, exportValue] of Object.entries(manifest.exports)) {
		if (typeof exportValue === 'string') {
			continue;
		}

		const specifier = packageSpecifier(manifest.name, subpath);
		const commonJsModule = consumerRequire(specifier);
		const runtimeNames = Object.keys(commonJsModule)
			.filter(isRuntimeNamedExport)
			.sort();
		const declarationPath = path.join(packageRoot, exportValue.types);
		const declarationSource = fs.readFileSync(declarationPath, 'utf8');
		const sourceFile = typeScript.createSourceFile(
			declarationPath,
			declarationSource,
			typeScript.ScriptTarget.Latest,
			true,
			typeScript.ScriptKind.TS,
		);
		const typeNames = collectTypeOnlyExportNames(typeScript, sourceFile).filter(
			(name) => !runtimeNames.includes(name),
		);
		const prefix = `export${exportIndex}`;

		sourceLines.push(
			`import ${prefix}Default from ${JSON.stringify(specifier)};`,
		);
		if (runtimeNames.length > 0) {
			sourceLines.push(
				`import { ${runtimeNames
					.map((name) => `${name} as ${prefix}_${name}`)
					.join(', ')} } from ${JSON.stringify(specifier)};`,
			);
		}
		if (typeNames.length > 0) {
			sourceLines.push(
				`import type { ${typeNames
					.map((name) => `${name} as ${prefix}_${name}`)
					.join(', ')} } from ${JSON.stringify(specifier)};`,
			);
		}
		sourceLines.push(`void ${prefix}Default;`);
		if (runtimeNames.length > 0) {
			sourceLines.push(
				`void [${runtimeNames.map((name) => `${prefix}_${name}`).join(', ')}];`,
			);
		}
		if (typeNames.length > 0) {
			sourceLines.push(
				`type ${prefix}Types = [${typeNames
					.map((name) => `${prefix}_${name}`)
					.join(', ')}];`,
			);
		}
		sourceLines.push('');
		exportIndex += 1;
	}

	fs.writeFileSync(
		path.join(tempProjectDir, 'package-type-contract.mts'),
		`${sourceLines.join('\n')}\n`,
	);
	writeJson(path.join(tempProjectDir, 'tsconfig.package-contract.json'), {
		compilerOptions: {
			allowSyntheticDefaultImports: true,
			esModuleInterop: true,
			module: 'NodeNext',
			moduleResolution: 'NodeNext',
			noEmit: true,
			skipLibCheck: false,
			strict: true,
			target: 'ES2022',
			types: [],
			verbatimModuleSyntax: true,
		},
		files: ['package-type-contract.mts'],
	});
}

function validatePackageContract(tempProjectDir) {
	writeRuntimeContract(tempProjectDir);
	writeTypeContract(tempProjectDir);
	run('node', ['package-runtime-contract.mjs'], { cwd: tempProjectDir });
	run('bunx', ['tsc', '--project', 'tsconfig.package-contract.json'], {
		cwd: tempProjectDir,
	});
}

function validateNpmConsumer(tarballPath) {
	withTempConsumer('npm-consumer', (tempProjectDir) => {
		writeJson(
			path.join(tempProjectDir, 'package.json'),
			createNpmFixturePackageJson(tarballPath),
		);
		run(
			'npm',
			[
				'install',
				'--dry-run=false',
				'--ignore-scripts',
				'--no-audit',
				'--no-fund',
			],
			{
				cwd: tempProjectDir,
				env: {
					...process.env,
					npm_config_package_lock: 'false',
				},
			},
		);
		writeRuntimeContract(tempProjectDir, { includeOptionalIntegrations: false });
		run('node', ['package-runtime-contract.mjs'], { cwd: tempProjectDir });
	});
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
					jsx: 'react-jsx',
					strict: true,
					baseUrl: '.',
					paths: {
						'@/*': ['src/*'],
					},
				},
				include: ['**/*.ts', '**/*.tsx'],
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
		path.join(tempProjectDir, 'agent-smoke.test.ts'),
		[
			'// @ts-ignore agent smoke',
			'const unsafeValue = {} as any;',
			'const generated = "Generated by smoke";',
			'',
			'it.skip("skips", () => {',
			'\texpect([unsafeValue, generated]).toBeDefined();',
			'});',
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
		path.join(tempProjectDir, 'hardening-smoke.tsx'),
		[
			"import { Button, StyleSheet } from 'react-native';",
			'// eslint-disable-next-line import-x/no-unresolved',
			"import { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';",
			'',
			"declare module 'react-native-reanimated' {",
			'\texport type SharedValue<T> = { value: T; get: () => T };',
			'\texport function useAnimatedStyle<T>(callback: () => T): { value: T };',
			'\texport function useSharedValue<T>(value: T): SharedValue<T>;',
			'}',
			'',
			'declare const value: unknown;',
			'declare const shared: { value: number };',
			'declare function useGetPeople(): { data: string[] };',
			'declare function usePanGesture(cfg: object): object;',
			'declare function scheduleOnRN(callback: () => void): void;',
			'',
			'type QueryResult = ReturnType<typeof useGetPeople>;',
			'const unsafeValue = value as unknown as string;',
			'const queryResult = {} as QueryResult;',
			'const fill = StyleSheet.absoluteFillObject;',
			"const semanticColor = '#ff0000';",
			'',
			'export function HardeningSmoke() {',
			'\tconst animated = useSharedValue(shared.value);',
			'\tconst style = useAnimatedStyle(() => ({ opacity: animated.get() }));',
			'\tconst gesture = usePanGesture({ onStart: () => {} });',
			'\tscheduleOnRN(() => {});',
			'',
			'\treturn (',
			'\t\t<Button',
			'\t\t\ttitle={`${unsafeValue}:${queryResult.data.length}:${animated.value}:${semanticColor}:${String(fill)}:${String(gesture)}:${String(style.opacity)}`}',
			'\t\t/>',
			'\t);',
			'}',
			'',
		].join('\n'),
	);

	fs.writeFileSync(
		path.join(tempProjectDir, 'hardening.stories.tsx'),
		[
			'export const Story = () => {',
			"\tconsole.log('story diagnostics');",
			'\treturn null;',
			'};',
			'',
		].join('\n'),
	);

	fs.writeFileSync(
		path.join(tempProjectDir, 'optional-integration.test.tsx'),
		[
			"import { screen } from '@testing-library/react-native';",
			'',
			"it.skip('optional integration smoke', async () => {",
			"  screen.findByText('value');",
			'});',
			'',
		].join('\n'),
	);

	fs.mkdirSync(path.join(tempProjectDir, 'features/people/screens'), {
		recursive: true,
	});
	fs.mkdirSync(path.join(tempProjectDir, 'services'), { recursive: true });
	fs.writeFileSync(
		path.join(tempProjectDir, 'features/people/screens/ListScreen.tsx'),
		['export function ListScreen() {', '\treturn null;', '}', ''].join('\n'),
	);
	fs.writeFileSync(
		path.join(tempProjectDir, 'services/people-service.ts'),
		[
			"import { ListScreen } from '../features/people/screens/ListScreen';",
			'',
			'export const invalidServiceDependency = ListScreen;',
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
		path.join(tempProjectDir, 'eslint.agent.config.js'),
		"const agent = require('eslint-config-expo-magic/agent');\n\nmodule.exports = [...agent];\n",
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
	fs.writeFileSync(
		path.join(tempProjectDir, 'eslint.hardening.config.js'),
		[
			"const { createConfig } = require('eslint-config-expo-magic');",
			'',
			'module.exports = createConfig({',
			'\tprettier: false,',
			'\ttesting: false,',
			'\tappGuardrails: true,',
			'\tcomponentStructure: true,',
			'\tdeprecatedApis: true,',
			'\tfeatureBoundaries: true,',
			'\tinlineStyles: true,',
			'\tnativeUi: true,',
			'\treactCompiler: true,',
			'\treanimated: true,',
			'\tsemanticColors: true,',
			'\tstorybook: true,',
			'\tworklets: true,',
			'});',
			'',
		].join('\n'),
	);
	fs.writeFileSync(
		path.join(tempProjectDir, 'eslint.optional.config.js'),
		[
			"const { createConfig } = require('eslint-config-expo-magic');",
			'',
			'module.exports = createConfig({',
			'\tprettier: true,',
			'\ttesting: true,',
			'\tfeatureBoundaries: true,',
			'});',
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
	assertHasRule(
		baseMessages,
		'expo/no-dynamic-env-var',
		'Base preset did not report expo/no-dynamic-env-var.',
	);
	assertHasRule(
		baseMessages,
		'expo/no-env-var-destructuring',
		'Base preset did not report expo/no-env-var-destructuring.',
	);
	assertLacksRule(
		baseMessages,
		'no-console',
		'Base preset should not report no-console.',
	);

	const defaultMessages = runLint(
		tempProjectDir,
		'eslint.default.config.js',
		'default-smoke.ts',
	);
	assertHasRule(
		defaultMessages,
		'no-console',
		'Default preset did not report no-console.',
	);
	assertHasRule(
		defaultMessages,
		'import-x/order',
		'Default preset did not report import-x/order.',
	);
	assertLacksRule(
		defaultMessages,
		'prettier/prettier',
		'Default preset should not report prettier/prettier.',
	);

	const strictMessages = runLint(
		tempProjectDir,
		'eslint.strict.config.js',
		'strict-smoke.ts',
	);
	assertHasRule(
		strictMessages,
		'no-console',
		'Strict preset did not report no-console.',
	);

	const agentMessages = runLint(
		tempProjectDir,
		'eslint.agent.config.js',
		'agent-smoke.test.ts',
	);
	assertHasRule(
		agentMessages,
		'@typescript-eslint/ban-ts-comment',
		'Agent preset did not report ban-ts-comment.',
	);
	assertHasRule(
		agentMessages,
		NO_RESTRICTED_SYNTAX_RULE_ID,
		'Agent preset did not report no-restricted-syntax.',
	);
	assertLacksRule(
		agentMessages,
		'prettier/prettier',
		'Agent preset should not report prettier/prettier.',
	);

	const typedMessages = runLint(
		tempProjectDir,
		'eslint.typed.config.js',
		'typed-smoke.ts',
	);
	assertHasRule(
		typedMessages,
		'@typescript-eslint/no-base-to-string',
		'Typed preset did not report @typescript-eslint/no-base-to-string.',
	);
	assertLacksRule(
		typedMessages,
		'import-x/no-unresolved',
		'Typed preset failed to resolve bun:test.',
	);

	const typedEsmMessages = runLint(
		tempProjectDir,
		'eslint.typed-esm.config.mjs',
		'typed-esm-smoke.ts',
	);
	assertHasRule(
		typedEsmMessages,
		'@typescript-eslint/no-base-to-string',
		'ESM typed preset did not report @typescript-eslint/no-base-to-string.',
	);
	assertLacksRule(
		typedEsmMessages,
		'import-x/no-unresolved',
		'ESM typed preset failed to resolve bun:test.',
	);

	const factoryMessages = runLint(
		tempProjectDir,
		'eslint.factory.config.js',
		'factory-custom-smoke.ts',
	);
	assertHasRule(
		factoryMessages,
		'no-console',
		'Factory config did not report no-console.',
	);
	assertHasRule(
		factoryMessages,
		'import-x/order',
		'Factory config did not report import-x/order.',
	);
	assertLacksRule(
		factoryMessages,
		'prettier/prettier',
		'Factory config should not report prettier/prettier.',
	);
	assertLacksRule(
		factoryMessages,
		'jest/no-disabled-tests',
		'Factory config should not enable Jest rules when testing is false.',
	);

	const hardeningMessages = runLint(
		tempProjectDir,
		'eslint.hardening.config.js',
		'hardening-smoke.tsx',
	);
	if (process.env.DEBUG_SMOKE_HARDENING_RULES === '1') {
		console.log(
			`[${tempProjectDir}] hardening messages:`,
			JSON.stringify(
				hardeningMessages.map((message) => ({
					ruleId: message.ruleId,
					message: message.message,
				})),
				null,
				2,
			),
		);
	}
	assertHasRule(
		hardeningMessages,
		'no-restricted-imports',
		'Hardening config did not report no-restricted-imports.',
	);
	assertHasRule(
		hardeningMessages,
		NO_RESTRICTED_SYNTAX_RULE_ID,
		'Hardening config did not compose no-restricted-syntax.',
	);
	assertMessageForRule(
		hardeningMessages,
		NO_RESTRICTED_SYNTAX_RULE_ID,
		'Avoid double type assertions.',
		'Hardening config did not report app guardrail double type assertions.',
	);
	assertMessageForRule(
		hardeningMessages,
		NO_RESTRICTED_SYNTAX_RULE_ID,
		'Avoid `ReturnType<typeof useGet...',
		'Hardening config did not report app guardrail ReturnType selectors.',
	);
	assertMessageForRule(
		hardeningMessages,
		NO_RESTRICTED_SYNTAX_RULE_ID,
		'Memoize gesture config before passing it to RNGH gesture hooks',
		'Hardening config did not report Reanimated gesture hardening.',
	);
	assertMessageForRule(
		hardeningMessages,
		NO_RESTRICTED_SYNTAX_RULE_ID,
		'Do not use raw color literals.',
		'Hardening config did not report semantic color hardening.',
	);
	assertHasRule(
		hardeningMessages,
		'no-restricted-properties',
		'Hardening config did not compose deprecated-api rules.',
	);
	assertHasRule(
		hardeningMessages,
		REANIMATED_SHARED_VALUE_RULE_ID,
		`Hardening config did not report ${REANIMATED_SHARED_VALUE_RULE_ID}.`,
	);

	const storyMessages = runLint(
		tempProjectDir,
		'eslint.hardening.config.js',
		'hardening.stories.tsx',
	);
	assertLacksRule(
		storyMessages,
		'no-console',
		'Storybook config should allow console in stories.',
	);

	const boundaryMessages = runLint(
		tempProjectDir,
		'eslint.hardening.config.js',
		'services/people-service.ts',
	);
	assertHasRule(
		boundaryMessages,
		'boundaries/dependencies',
		'Hardening config did not report feature boundary violations.',
	);

	const optionalMessages = runLint(
		tempProjectDir,
		'eslint.optional.config.js',
		'optional-integration.test.tsx',
	);
	assertHasRule(
		optionalMessages,
		'prettier/prettier',
		'Optional integration config did not load Prettier diagnostics.',
	);
	assertHasRule(
		optionalMessages,
		'jest/no-disabled-tests',
		'Optional integration config did not load Jest diagnostics.',
	);
	assertHasRule(
		optionalMessages,
		'testing-library/await-async-queries',
		'Optional integration config did not load Testing Library diagnostics.',
	);
}

function main() {
	const contractsOnly = process.argv.includes('--contracts-only');
	const npmOnly = process.argv.includes('--npm-only');
	const lanes = contractsOnly ? [smokeLanes.at(-1)] : smokeLanes;
	console.log('Packing local tarball...');
	withPackedTarball((tarballPath) => {
		if (!npmOnly) {
			for (const lane of lanes) {
				console.log(`Installing packed consumer for ${lane.name}...`);
				withTempConsumer(lane.name, (tempProjectDir) => {
					writeJson(
						path.join(tempProjectDir, 'package.json'),
						createFixturePackageJson(tarballPath, lane),
					);
					run('bun', ['install'], { cwd: tempProjectDir });
					validatePackageContract(tempProjectDir);
					if (!contractsOnly) {
						writeFixtureFiles(tempProjectDir);
						validateLane(tempProjectDir);
					}
				});
			}
		}

		if (!contractsOnly) {
			console.log('Installing isolated npm consumer...');
			validateNpmConsumer(tarballPath);
		}
	});
	console.log('Pack smoke checks passed.');
}

main();
