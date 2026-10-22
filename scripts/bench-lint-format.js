#!/usr/bin/env bun

// Benchmarks 5.x ESLint + Prettier against bun lint + bun fmt on the
// test-project fixture files. Usage: bun scripts/bench-lint-format.js
// [--runs <n>] [--scale <copies>] [--profile <name>]... [--write]
// Each command runs once to warm up, then --runs times (default 10); the table
// shows the median wall time and median peak memory. --scale copies the
// fixture files into <copies> extra folders to simulate a larger app.

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const profiles = require('../test-project/bun-golden/profiles.js');
const { buildProfileConfig } = require('./lib/bun-golden-config.js');
const { parsePeakRss, summarize } = require('./lib/bench.js');

const rootDir = path.resolve(__dirname, '..');
const fixtureDir = path.join(rootDir, 'test-project');
const binDir = path.join(rootDir, 'node_modules/.bin');

function options(name) {
	return process.argv.flatMap((value, index) =>
		process.argv[index - 1] === name ? [value] : [],
	);
}

function resolveBun() {
	if (process.env.BUN_PARITY_BIN) return process.env.BUN_PARITY_BIN;

	const result = spawnSync(
		'bunx',
		['bun@canary', '-e', 'console.log(process.execPath)'],
		{
			encoding: 'utf8',
		},
	);
	if (result.status !== 0) throw new Error(result.stderr);

	return result.stdout.trim();
}

function measure(command, args, cwd) {
	const timeFlag = process.platform === 'darwin' ? '-l' : '-v';
	const start = performance.now();
	const result = spawnSync('/usr/bin/time', [timeFlag, command, ...args], {
		cwd,
		encoding: 'utf8',
		maxBuffer: 256 * 1024 * 1024,
	});
	const ms = performance.now() - start;

	if (![0, 1].includes(result.status)) {
		throw new Error(
			`${command} ${args.slice(0, 4).join(' ')} exited with ${result.status}\n${result.stderr.slice(-2000)}`,
		);
	}

	return { ms, rss: parsePeakRss(result.stderr) };
}

function bench(label, command, args, cwd, runs) {
	measure(command, args, cwd);
	const samples = Array.from({ length: runs }, () =>
		measure(command, args, cwd),
	);
	const summary = summarize(samples);

	console.log(
		`${label}: median ${summary.medianMs.toFixed(0)} ms, ${summary.medianRssMb?.toFixed(0)} MB`,
	);

	return { label, ...summary };
}

// Copies the fixture files into `copies` folders inside a temporary folder in
// test-project, so module resolution and configs still apply.
function prepareFiles(files, copies) {
	if (copies === 0) return { files, cleanup: () => {} };

	const scaleDir = `.bun-golden-bench-${process.pid}`;
	const scaled = [...files];
	for (let copy = 0; copy < copies; copy++) {
		for (const file of files) {
			const target = path.join(scaleDir, `copy-${copy}`, file);
			fs.mkdirSync(path.dirname(path.join(fixtureDir, target)), {
				recursive: true,
			});
			fs.copyFileSync(
				path.join(fixtureDir, file),
				path.join(fixtureDir, target),
			);
			scaled.push(target);
		}
	}

	return {
		files: scaled,
		cleanup: () =>
			fs.rmSync(path.join(fixtureDir, scaleDir), {
				recursive: true,
				force: true,
			}),
	};
}

function writeEslintConfig(profile, file) {
	const factory =
		profile.factory === 'createMobileAppConfig'
			? `require(${JSON.stringify(path.join(rootDir, 'packages/eslint-config-expo-magic/mobile-app.js'))}).createMobileAppConfig`
			: `require(${JSON.stringify(path.join(rootDir, 'packages/eslint-config-expo-magic'))}).createConfig`;

	fs.writeFileSync(
		file,
		`module.exports = ${factory}(${JSON.stringify(profile.options)});\n`,
	);
}

function main() {
	const runs = Number(options('--runs')[0] ?? 10);
	const copies = Number(options('--scale')[0] ?? 0);
	const profileNames = options('--profile');
	const selected = profiles.filter(
		(profile) =>
			!profile.blockedBy &&
			(profileNames.length === 0
				? ['testing', 'fast'].includes(profile.name)
				: profileNames.includes(profile.name)),
	);
	const bun = resolveBun();
	const bunVersion = spawnSync(bun, ['--revision'], {
		encoding: 'utf8',
	}).stdout.trim();
	const golden = JSON.parse(
		fs.readFileSync(
			path.join(fixtureDir, 'bun-golden', 'default.json'),
			'utf8',
		),
	);
	const { files, cleanup } = prepareFiles(golden.files, copies);
	const rows = [];

	try {
		for (const profile of selected) {
			const eslintConfig = path.join(
				fixtureDir,
				`.bun-golden-bench-eslint-${process.pid}.config.js`,
			);
			const oxlintConfig = path.join(
				fixtureDir,
				`.bun-golden-bench-oxlint-${process.pid}.json`,
			);
			writeEslintConfig(profile, eslintConfig);
			fs.writeFileSync(
				oxlintConfig,
				JSON.stringify(buildProfileConfig(profile)),
			);

			try {
				rows.push({
					profile: profile.name,
					eslint: bench(
						`${profile.name} eslint`,
						path.join(binDir, 'eslint'),
						['-c', eslintConfig, ...files],
						fixtureDir,
						runs,
					),
					// From the repo root: test-project's own `lint` script would replace the built-in command.
					bunLint: bench(
						`${profile.name} bun lint`,
						bun,
						[
							'lint',
							'--cwd',
							fixtureDir,
							'-c',
							oxlintConfig,
							'-f',
							'json',
							...files,
						],
						rootDir,
						runs,
					),
				});
			} finally {
				fs.rmSync(eslintConfig, { force: true });
				fs.rmSync(oxlintConfig, { force: true });
			}
		}

		const format = {
			prettier: bench(
				'prettier --check',
				path.join(binDir, 'prettier'),
				['--check', ...files],
				fixtureDir,
				runs,
			),
			bunFmt: bench(
				'bun fmt --check',
				bun,
				['fmt', '--check', ...files],
				fixtureDir,
				runs,
			),
		};
		const report = renderReport({
			bunVersion,
			runs,
			fileCount: files.length,
			rows,
			format,
		});

		console.log(`\n${report}`);
		if (process.argv.includes('--write')) {
			fs.writeFileSync(path.join(rootDir, 'docs', 'BENCHMARKS.md'), report);
		}
	} finally {
		cleanup();
	}
}

function ratio(slow, fast) {
	return `${(slow.medianMs / fast.medianMs).toFixed(1)}x`;
}

function cell(summary) {
	return `${summary.medianMs.toFixed(0)} ms (${summary.minMs.toFixed(0)}–${summary.maxMs.toFixed(0)}), ${summary.medianRssMb?.toFixed(0) ?? '?'} MB`;
}

function renderReport({ bunVersion, runs, fileCount, rows, format }) {
	return [
		'# Benchmarks',
		'',
		`Generated by \`bun scripts/bench-lint-format.js\` on ${os.platform()} ${os.arch()}, ${os.cpus().length} CPUs, Bun ${bunVersion}. ${fileCount} files, median of ${runs} runs after one warm-up; ranges are min–max, memory is median peak RSS.`,
		'',
		'| Profile | ESLint 10 (5.x) | bun lint (6.0) | Faster |',
		'| --- | --- | --- | --- |',
		...rows.map(
			(row) =>
				`| ${row.profile} | ${cell(row.eslint)} | ${cell(row.bunLint)} | ${ratio(row.eslint, row.bunLint)} |`,
		),
		'',
		'| Formatter | Prettier 3 (5.x) | bun fmt (6.0) | Faster |',
		'| --- | --- | --- | --- |',
		`| --check | ${cell(format.prettier)} | ${cell(format.bunFmt)} | ${ratio(format.prettier, format.bunFmt)} |`,
		'',
	].join('\n');
}

main();
