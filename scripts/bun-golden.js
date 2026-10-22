#!/usr/bin/env bun

// Lints test-project with `bun lint` for every golden profile and compares the
// findings with the 5.x ESLint golden data. Usage: bun scripts/bun-golden.js
// [--profile <name>] [--verbose]. Set BUN_PARITY_BIN to use a specific Bun binary.

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const profiles = require('../test-project/bun-golden/profiles.js');
const { buildProfileConfig } = require('./lib/bun-golden-config.js');
const { compareGolden } = require('./lib/bun-golden.js');

const rootDir = path.resolve(__dirname, '..');
const fixtureDir = path.join(rootDir, 'test-project');
const [bunBin, ...bunArgs] = process.env.BUN_PARITY_BIN
	? [process.env.BUN_PARITY_BIN]
	: ['bunx', 'bun@canary'];

function option(name) {
	const index = process.argv.indexOf(name);

	return index === -1 ? undefined : process.argv[index + 1];
}

function lintProfile(profile, golden, shimDir) {
	const configPath = path.join(fixtureDir, `.bun-golden-${profile.name}.json`);
	fs.writeFileSync(
		configPath,
		JSON.stringify(buildProfileConfig(profile, shimDir)),
	);

	try {
		const result = spawnSync(
			bunBin,
			[
				...bunArgs,
				'lint',
				'--cwd',
				fixtureDir,
				'-c',
				configPath,
				'-f',
				'json',
				...golden.files,
			],
			{ cwd: rootDir, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 },
		);

		if (![0, 1].includes(result.status) || !result.stdout.startsWith('{')) {
			throw new Error(
				`bun lint exited with ${result.status}\n${result.stdout.slice(0, 2000)}\n${result.stderr.slice(0, 2000)}`,
			);
		}

		return JSON.parse(result.stdout);
	} finally {
		fs.rmSync(configPath, { force: true });
	}
}

function main() {
	const only = option('--profile');
	const divergences = JSON.parse(
		fs.readFileSync(
			path.join(fixtureDir, 'bun-golden', 'divergences.json'),
			'utf8',
		),
	);
	const shimDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bun-golden-'));
	let stale = new Set(divergences);
	let failed = false;

	try {
		for (const profile of profiles.filter(
			(entry) => !only || entry.name === only,
		)) {
			const golden = JSON.parse(
				fs.readFileSync(
					path.join(fixtureDir, 'bun-golden', `${profile.name}.json`),
					'utf8',
				),
			);
			let report;
			try {
				report = lintProfile(profile, golden, shimDir);
			} catch (error) {
				if (!profile.blockedBy || !error.message.includes(profile.blockedBy))
					throw error;
				console.log(`${profile.name}: blocked (${profile.blockedBy})`);
				continue;
			}
			if (profile.blockedBy) {
				console.log(
					`${profile.name}: no longer blocked; remove blockedBy from profiles.js`,
				);
			}
			const comparison = compareGolden({ golden, report, divergences });
			const problems = [
				...comparison.missing,
				...comparison.extra,
				...comparison.acceptedInvalidFiles,
			];

			stale = new Set(
				comparison.staleDivergences.filter((entry) => stale.has(entry)),
			);
			if (problems.length > 0) failed = true;
			console.log(
				`${profile.name}: ${problems.length === 0 ? 'ok' : 'DIFF'} rules-in-files=${comparison.matched} count-diffs=${comparison.countDiffs.length} missing=${comparison.missing.length} extra=${comparison.extra.length}`,
			);
			for (const pair of comparison.missing) console.log(`  - ${pair}`);
			for (const pair of comparison.extra) console.log(`  + ${pair}`);
			for (const file of comparison.acceptedInvalidFiles) {
				console.log(`  no parse error in ${file}`);
			}
			if (process.argv.includes('--verbose')) {
				for (const [pair, eslint, bun] of comparison.countDiffs) {
					console.log(`  ~ ${pair} eslint=${eslint} bun=${bun}`);
				}
			}
		}
	} finally {
		fs.rmSync(shimDir, { recursive: true, force: true });
	}

	if (!only && stale.size > 0) {
		failed = true;
		for (const entry of stale)
			console.log(`stale divergence: ${entry.side} ${entry.pair}`);
	}
	if (failed) process.exit(1);
}

main();
