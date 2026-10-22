#!/usr/bin/env bun

// Lints test-project with `bun lint` for every golden profile and compares the
// findings with the 5.x ESLint golden data. Usage: bun scripts/bun-golden.js
// [--profile <name>] [--verbose] [--fixes]. Set BUN_PARITY_BIN to use a specific Bun binary.

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const profiles = require('../test-project/bun-golden/profiles.js');
const { resolveBunBinary } = require('./lib/bun-binary.js');
const { buildProfileConfig } = require('./lib/bun-golden-config.js');
const {
	compareFixes,
	compareGolden,
	hashText,
} = require('./lib/bun-golden.js');

const rootDir = path.resolve(__dirname, '..');
const fixtureDir = path.join(rootDir, 'test-project');
const bunBin = resolveBunBinary();

function option(name) {
	const index = process.argv.indexOf(name);

	return index === -1 ? undefined : process.argv[index + 1];
}

// Runs `bun lint --fix` on copies of the fixture files in a temporary folder
// inside test-project, so module resolution and the Prettier config still
// apply, and returns the hash of every file the fixes changed.
function fixProfile(profile, golden) {
	const workDir = path.join(
		fixtureDir,
		`.bun-golden-fix-${profile.name}-${process.pid}`,
	);

	try {
		for (const file of [...golden.files, 'tsconfig.json']) {
			fs.mkdirSync(path.dirname(path.join(workDir, file)), { recursive: true });
			fs.copyFileSync(path.join(fixtureDir, file), path.join(workDir, file));
		}
		const configPath = path.join(workDir, '.bun-golden.json');
		fs.writeFileSync(configPath, JSON.stringify(buildProfileConfig(profile)));

		// `bun lint --fix` applies one pass; ESLint repeats up to 10 passes until
		// nothing changes, so repeat the same way.
		const snapshot = () =>
			golden.files
				.map((file) => fs.readFileSync(path.join(workDir, file), 'utf8'))
				.join('\0');
		for (
			let pass = 0, before = null;
			pass < 10 && before !== snapshot();
			pass++
		) {
			before = snapshot();
			const result = spawnSync(
				bunBin,
				[
					'lint',
					'--cwd',
					workDir,
					'-c',
					configPath,
					'--fix',
					'-f',
					'json',
					...golden.files,
				],
				{ cwd: rootDir, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 },
			);
			if (![0, 1].includes(result.status)) {
				throw new Error(
					`bun lint --fix exited with ${result.status}\n${result.stderr.slice(0, 2000)}`,
				);
			}
		}

		const fixes = {};
		for (const file of golden.files) {
			const fixed = fs.readFileSync(path.join(workDir, file), 'utf8');
			if (fixed !== fs.readFileSync(path.join(fixtureDir, file), 'utf8')) {
				fixes[file] = hashText(fixed);
			}
		}

		return fixes;
	} finally {
		fs.rmSync(workDir, { recursive: true, force: true });
	}
}

function lintProfile(profile, golden) {
	const configPath = path.join(
		fixtureDir,
		`.bun-golden-${profile.name}-${process.pid}.json`,
	);
	fs.writeFileSync(configPath, JSON.stringify(buildProfileConfig(profile)));

	try {
		const result = spawnSync(
			bunBin,
			[
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
	const findingDivergences = divergences.filter(
		(entry) => entry.side !== 'fix',
	);
	const fixDivergences = divergences.filter((entry) => entry.side === 'fix');
	const usedFixDivergences = new Set();
	const checkFixes = process.argv.includes('--fixes');
	let stale = new Set(findingDivergences);
	let failed = false;

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
			report = lintProfile(profile, golden);
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
		const comparison = compareGolden({
			golden,
			report,
			divergences: findingDivergences,
		});
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
		if (checkFixes) {
			const fixes = compareFixes(golden.fixes, fixProfile(profile, golden));
			const unexplained = [
				...fixes.different,
				...fixes.missing,
				...fixes.extra,
			].filter((file) => {
				const divergence = fixDivergences.find((entry) => entry.file === file);
				if (divergence) usedFixDivergences.add(divergence);

				return !divergence;
			});

			if (unexplained.length > 0) failed = true;
			console.log(
				`  fixes: ${unexplained.length === 0 ? 'ok' : 'DIFF'} same=${fixes.matched.length} reviewed=${fixes.different.length + fixes.missing.length + fixes.extra.length - unexplained.length} unexplained=${unexplained.length}`,
			);
			for (const file of unexplained) console.log(`    ~ ${file}`);
		}
	}

	if (!only) {
		const staleEntries = [
			...stale,
			...(checkFixes
				? fixDivergences.filter((entry) => !usedFixDivergences.has(entry))
				: []),
		];
		if (staleEntries.length > 0) failed = true;
		for (const entry of staleEntries) {
			console.log(
				`stale divergence: ${entry.side} ${entry.pair ?? entry.file}`,
			);
		}
	}
	if (failed) process.exit(1);
}

main();
