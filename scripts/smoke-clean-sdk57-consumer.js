#!/usr/bin/env bun

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const {
	run,
	withPackedTarball,
	withTempConsumer,
	writeJson,
} = require('./lib/packed-consumer.js');

const expoDoctorVersion = '1.20.1';

function writeConsumerFiles(tempProjectDir, tarballPath) {
	writeJson(path.join(tempProjectDir, 'package.json'), {
		name: 'eslint-config-expo-magic-clean-sdk57-consumer',
		private: true,
		type: 'commonjs',
		scripts: {
			lint: 'eslint App.tsx',
			doctor: 'expo-doctor',
		},
		devDependencies: {
			'@types/react': '~19.2.17',
			eslint: '^10.8.0',
			'expo-status-bar': '57.0.1',
			expo: '57.0.11',
			'eslint-config-expo-magic': `file:${tarballPath}`,
			'jest-expo': '57.0.3',
			react: '19.2.3',
			'react-native': '0.86.2',
			'react-test-renderer': '19.2.3',
			typescript: '^6.0.3',
		},
	});

	writeJson(path.join(tempProjectDir, 'app.json'), {
		expo: {
			name: 'SDK 57 Smoke',
			slug: 'sdk-57-smoke',
			platforms: ['ios', 'android'],
		},
	});

	writeJson(path.join(tempProjectDir, 'tsconfig.json'), {
		extends: 'expo/tsconfig.base',
		compilerOptions: {
			strict: true,
		},
		include: ['**/*.ts', '**/*.tsx'],
	});

	fs.writeFileSync(
		path.join(tempProjectDir, 'eslint.config.js'),
		[
			"const expoMagic = require('eslint-config-expo-magic');",
			'',
			'module.exports = [...expoMagic];',
			'',
		].join('\n'),
	);

	fs.writeFileSync(
		path.join(tempProjectDir, 'App.tsx'),
		[
			'import { Text, View } from "react-native";',
			'import { StatusBar } from "expo-status-bar";',
			'',
			'export default function App() {',
			'  return (',
			'    <View>',
			'      <Text>SDK 57 smoke</Text>',
			'      <StatusBar style="auto" />',
			'    </View>',
			'  );',
			'}',
			'',
		].join('\n'),
	);
}

function assertLintClean(tempProjectDir) {
	const result = spawnSync('bunx', ['eslint', 'App.tsx', '--format=json'], {
		cwd: tempProjectDir,
		encoding: 'utf8',
	});

	if (result.status !== 0) {
		throw new Error(result.stderr || result.stdout || 'ESLint smoke failed.');
	}

	const lintResults = JSON.parse(result.stdout || '[]');
	const messages = lintResults.flatMap(
		(lintResult) => lintResult.messages ?? [],
	);
	if (messages.some((message) => message.fatal)) {
		throw new Error('ESLint reported a fatal diagnostic.');
	}
}

function main() {
	console.log('Packing local tarball...');
	withPackedTarball((tarballPath) => {
		withTempConsumer('clean-sdk57', (tempProjectDir) => {
			writeConsumerFiles(tempProjectDir, tarballPath);
			console.log('Installing clean SDK 57 consumer...');
			run('bun', ['install'], { cwd: tempProjectDir });

			console.log(`Running Expo Doctor ${expoDoctorVersion}...`);
			run('bunx', [`expo-doctor@${expoDoctorVersion}`], {
				cwd: tempProjectDir,
			});

			console.log('Running ESLint...');
			assertLintClean(tempProjectDir);
		});
	});
	console.log('Clean SDK 57 consumer smoke passed.');
}

main();
