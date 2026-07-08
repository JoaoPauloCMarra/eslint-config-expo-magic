#!/usr/bin/env bun

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const packageDir = path.join(rootDir, 'packages', 'eslint-config-expo-magic');

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

function snapshotTarballs() {
	return new Map(
		listTarballs().map((file) => [
			file,
			fs.statSync(path.join(packageDir, file)).mtimeMs,
		]),
	);
}

function writeJson(filePath, value) {
	fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

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
			eslint: '^10.6.0',
			'expo-status-bar': '57.0.0',
			expo: '57.0.4',
			'eslint-config-expo-magic': `file:${tarballPath}`,
			'jest-expo': '57.0.1',
			react: '19.2.3',
			'react-native': '0.86.0',
			'react-test-renderer': '19.2.3',
			typescript: '^6.0.3',
		},
	});

	writeJson(path.join(tempProjectDir, 'app.json'), {
		expo: {
			name: 'SDK 57 Smoke',
			slug: 'sdk-57-smoke',
			sdkVersion: '57.0.0',
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
	const result = spawnSync(
		'bunx',
		['eslint', 'App.tsx', '--format=json'],
		{
			cwd: tempProjectDir,
			encoding: 'utf8',
		},
	);

	if (result.status !== 0) {
		throw new Error(result.stderr || result.stdout || 'ESLint smoke failed.');
	}

	const lintResults = JSON.parse(result.stdout || '[]');
	const messages = lintResults.flatMap((lintResult) => lintResult.messages ?? []);
	if (messages.some((message) => message.fatal)) {
		throw new Error('ESLint reported a fatal diagnostic.');
	}
}

function main() {
	const tarballsBefore = snapshotTarballs();
	let generatedTarballPath;
	const tempProjectDir = fs.mkdtempSync(
		path.join(os.tmpdir(), 'eslint-config-expo-magic-clean-sdk57-'),
	);

	try {
		console.log('Packing local tarball...');
		run('bun', ['pm', 'pack'], { cwd: packageDir });

		const newTarball = listTarballs().find((file) => {
			const previousMtimeMs = tarballsBefore.get(file);
			if (previousMtimeMs === undefined) {
				return true;
			}

			return fs.statSync(path.join(packageDir, file)).mtimeMs > previousMtimeMs;
		});
		if (!newTarball) {
			throw new Error('Could not find generated tarball from bun pm pack.');
		}

		generatedTarballPath = path.join(packageDir, newTarball);

		writeConsumerFiles(tempProjectDir, generatedTarballPath);
		console.log('Installing clean SDK 57 consumer...');
		run('bun', ['install'], { cwd: tempProjectDir });

		console.log('Running Expo Doctor...');
		run('bunx', ['expo-doctor@latest'], { cwd: tempProjectDir });

		console.log('Running ESLint...');
		assertLintClean(tempProjectDir);

		console.log('Clean SDK 57 consumer smoke passed.');
	} finally {
		fs.rmSync(tempProjectDir, { recursive: true, force: true });

		if (generatedTarballPath && fs.existsSync(generatedTarballPath)) {
			fs.unlinkSync(generatedTarballPath);
		}
	}
}

main();
