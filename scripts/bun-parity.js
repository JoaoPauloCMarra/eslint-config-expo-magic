#!/usr/bin/env bun

// Compares Bun's built-in `bun lint` / `bun fmt --check` with ESLint and
// Prettier on this repo with the latest Bun canary (only canary ships both
// commands as of 1.4.4). Set BUN_PARITY_BIN to test another binary.

const { resolveBunBinary } = require('./lib/bun-binary.js');

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const {
	compareFormat,
	compareLint,
	knownLintDivergences,
	parseCheckOutput,
} = require('./lib/bun-parity.js');

const rootDir = path.resolve(__dirname, '..');
const fixtureDir = path.join(rootDir, 'test-project');
const bunBin = resolveBunBinary();
const binDir = path.join(rootDir, 'node_modules/.bin');

function run(command, args, cwd, allowedStatuses) {
	const result = spawnSync(command, args, {
		cwd,
		encoding: 'utf8',
		maxBuffer: 64 * 1024 * 1024,
	});

	if (result.error || !allowedStatuses.includes(result.status)) {
		throw new Error(
			`${command} ${args.join(' ')} exited with ${result.status}\n${result.stderr || result.error}`,
		);
	}

	return result;
}

// `bun lint` and `bun fmt` run a package.json script with the same name
// instead of the built-in command.
function assertNoHijackingScripts() {
	const { scripts = {} } = JSON.parse(
		fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'),
	);

	for (const name of ['lint', 'fmt']) {
		if (scripts[name]) {
			throw new Error(
				`Root package.json has a "${name}" script, so bun ${name} would run it instead of the built-in command.`,
			);
		}
	}
}

// Bun releases without the built-in commands treat `bun lint` as a missing
// package.json script.
function assertBuiltInCommands() {
	for (const name of ['lint', 'fmt']) {
		run(bunBin, [name, '--help'], rootDir, [0]);
	}
}

function printList(title, items) {
	if (items.length === 0) return;

	console.log(`${title} (${items.length}):`);
	for (const item of items) console.log(`  ${item}`);
}

function checkLint() {
	const eslint = JSON.parse(
		run(path.join(binDir, 'eslint'), ['.', '-f', 'json'], fixtureDir, [0, 1])
			.stdout,
	);
	const bun = JSON.parse(
		run(
			bunBin,
			['lint', '--cwd', 'test-project', '-f', 'json'],
			rootDir,
			[0, 1],
		).stdout,
	);
	const comparison = compareLint({
		eslint,
		bun,
		rootDir: fixtureDir,
		knownDivergences: knownLintDivergences,
	});

	console.log(
		`lint: ${comparison.matched} findings match, ${comparison.knownInBun.length} known divergences`,
	);
	printList('Only ESLint reported', comparison.missingInBun);
	printList('Only bun lint reported', comparison.unexpectedInBun);
	printList(
		'Known divergences that no longer occur (remove them)',
		comparison.staleDivergences.map((entry) => `${entry.file} ${entry.ruleId}`),
	);

	return (
		comparison.missingInBun.length +
			comparison.unexpectedInBun.length +
			comparison.staleDivergences.length ===
		0
	);
}

// Both formatters print the `[warn]` lines to stderr.
function checkedFiles(command, args) {
	const { status, stdout, stderr } = run(command, args, rootDir, [0, 1]);
	const files = parseCheckOutput(`${stdout}\n${stderr}`);

	if (status === 1 && files.length === 0) {
		throw new Error(
			`${command} ${args.join(' ')} reported unformatted files, but none could be parsed:\n${stderr}`,
		);
	}

	return files;
}

function checkFormat() {
	const prettierFiles = checkedFiles(path.join(binDir, 'prettier'), [
		'--check',
		'.',
	]);
	const bunFiles = checkedFiles(bunBin, ['fmt', '--check', '.']);
	const { onlyPrettier, onlyBun } = compareFormat({ prettierFiles, bunFiles });

	console.log(`fmt: ${prettierFiles.length} files need formatting in Prettier`);
	printList('Only Prettier flagged', onlyPrettier);
	printList('Only bun fmt flagged', onlyBun);

	return onlyPrettier.length + onlyBun.length === 0;
}

function main() {
	assertNoHijackingScripts();
	console.log(`bun ${run(bunBin, ['--revision'], rootDir, [0]).stdout.trim()}`);
	assertBuiltInCommands();

	const lintMatches = checkLint();
	const formatMatches = checkFormat();

	if (!lintMatches || !formatMatches) {
		console.error('bun lint / bun fmt differ from ESLint / Prettier.');
		process.exit(1);
	}

	console.log('bun lint and bun fmt match ESLint and Prettier.');
}

main();
