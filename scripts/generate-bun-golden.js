#!/usr/bin/env bun

// Records the 5.x ESLint findings and autofix output for every profile in
// test-project/bun-golden/profiles.js. The Bun-only package must reproduce
// them (docs/BUN_MIGRATION.md). Rerun only when 5.x behavior changes on purpose.

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { ESLint } = require('eslint');
const magic = require('../packages/eslint-config-expo-magic');
const {
	createMobileAppConfig,
} = require('../packages/eslint-config-expo-magic/mobile-app.js');
const profiles = require('../test-project/bun-golden/profiles.js');
const { goldenFromResults, selectGoldenFiles } = require('./lib/bun-golden.js');

const rootDir = path.resolve(__dirname, '..');
const fixtureDir = path.join(rootDir, 'test-project');
const outputDir = path.join(fixtureDir, 'bun-golden');
const factories = { createConfig: magic.createConfig, createMobileAppConfig };

function trackedFixtureFiles() {
	const result = spawnSync('git', ['ls-files'], {
		cwd: fixtureDir,
		encoding: 'utf8',
	});

	if (result.status !== 0) throw new Error(result.stderr);

	return selectGoldenFiles(result.stdout.split('\n').filter(Boolean));
}

async function lintProfile(profile, files, fix) {
	const eslint = new ESLint({
		cwd: fixtureDir,
		fix,
		overrideConfigFile: true,
		overrideConfig: factories[profile.factory](profile.options),
	});

	return eslint.lintFiles(files);
}

async function main() {
	const files = trackedFixtureFiles();

	for (const profile of profiles) {
		const [results, fixedResults] = [
			await lintProfile(profile, files, false),
			await lintProfile(profile, files, true),
		];
		const { findings } = goldenFromResults({
			profile: profile.name,
			results,
			rootDir: fixtureDir,
		});
		const { fixes } = goldenFromResults({
			profile: profile.name,
			results: fixedResults,
			rootDir: fixtureDir,
		});

		fs.writeFileSync(
			path.join(outputDir, `${profile.name}.json`),
			`${JSON.stringify({ profile: profile.name, files, findings, fixes }, null, '\t')}\n`,
		);
		console.log(
			`${profile.name}: ${findings.length} findings, ${Object.keys(fixes).length} fixed files`,
		);
	}
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
