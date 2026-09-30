const fs = require('node:fs');
const path = require('node:path');
const { describe, expect, test } = require('bun:test');
const { readSdk57FixtureVersions } = require('./packed-consumer.js');

const rootDir = path.resolve(__dirname, '../..');
const fixtureDevDependencies = JSON.parse(
	fs.readFileSync(path.join(rootDir, 'test-project', 'package.json'), 'utf8'),
).devDependencies;

describe('SDK 57 fixture versions', () => {
	test('reads the SDK 57 tuple from the test-project manifest', () => {
		const versions = readSdk57FixtureVersions();

		for (const packageName of [
			'@react-native/jest-preset',
			'@types/react',
			'expo',
			'expo-status-bar',
			'jest-expo',
			'react',
			'react-native',
			'react-test-renderer',
		]) {
			expect(versions[packageName]).toBe(fixtureDevDependencies[packageName]);
		}
	});

	test('fails when the manifest lacks a tuple package', () => {
		expect(() =>
			readSdk57FixtureVersions({ devDependencies: { expo: '57.0.0' } }),
		).toThrow(/react/);
	});

	test('smoke scripts do not hard-code SDK 57 versions', () => {
		for (const script of [
			'smoke-packed-consumer.js',
			'smoke-clean-sdk57-consumer.js',
		]) {
			const source = fs.readFileSync(
				path.join(rootDir, 'scripts', script),
				'utf8',
			);
			expect(source).not.toMatch(/['"]~?57\.\d+\.\d+['"]/);
		}
	});
});
