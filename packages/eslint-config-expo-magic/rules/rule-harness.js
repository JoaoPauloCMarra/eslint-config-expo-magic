// Runs rule cases through `bun lint` and returns, per case, the messages and
// the fully fixed output, in the shape recorded from the original ESLint
// plugins (rules/__expectations__/<plugin>.json).
//
// A case is { name, rule, code, filename } or, for multi-file projects,
// { name, rule, files: { path: content }, lint: [path, ...] }, plus optional
// `options` (rule options array), `settings` and `isolate` (lint in its own
// project root, for rules that read the file system relative to the cwd).

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { resolveBunBinary } = require('../../../scripts/lib/bun-binary.js');

function caseFiles(testCase) {
	return testCase.files ?? { [testCase.filename]: testCase.code };
}

function lintTargets(testCase) {
	return testCase.lint ?? [testCase.filename];
}

// Bun's span offsets count UTF-8 bytes; ESLint columns count UTF-16 units.
function endPosition(text, byteOffset) {
	const before = Buffer.from(text).subarray(0, byteOffset).toString().split('\n');

	return { line: before.length, column: before.at(-1).length + 1 };
}

// Expo route names such as `(tabs)/[id].tsx` are glob syntax; escape them so
// the override matches the file instead of silently matching nothing.
function literalGlob(file) {
	return file.replace(/[[\]{}()*?!\\]/g, '\\$&');
}

// Reports once per linted file, so a case whose override matched nothing fails
// instead of passing with no messages.
const probePlugin = `module.exports = {
	meta: { name: 'harness-probe' },
	rules: {
		seen: {
			create(context) {
				return { Program(node) { context.report({ node, message: 'seen' }); } };
			},
		},
	},
};
`;

function writeGroup(dir, plugin, pluginPath, group) {
	const overrides = [];
	fs.writeFileSync(path.join(dir, 'harness-probe.js'), probePlugin);

	group.forEach((testCase, index) => {
		const caseDir = path.join(dir, `case-${index}`);
		for (const [file, content] of Object.entries(caseFiles(testCase))) {
			fs.mkdirSync(path.dirname(path.join(caseDir, file)), { recursive: true });
			fs.writeFileSync(path.join(caseDir, file), content);
		}
		overrides.push({
			files: lintTargets(testCase).map((file) =>
				literalGlob(`case-${index}/${file}`),
			),
			rules: {
				[`${plugin}/${testCase.rule}`]: ['error', ...(testCase.options ?? [])],
				'harness-probe/seen': 'error',
			},
		});
	});

	fs.writeFileSync(
		path.join(dir, '.oxlintrc.json'),
		JSON.stringify({
			categories: { correctness: 'off' },
			plugins: [],
			jsPlugins: [
				{ name: plugin, specifier: pluginPath },
				{ name: 'harness-probe', specifier: './harness-probe.js' },
			],
			settings: group[0].settings ?? {},
			overrides,
		}),
	);
}

function bunLint(dir, args) {
	const result = spawnSync(
		resolveBunBinary(),
		['lint', '--cwd', dir, '-c', path.join(dir, '.oxlintrc.json'), ...args],
		{ cwd: dir, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 120_000 },
	);
	if (![0, 1].includes(result.status)) {
		throw new Error(
			`bun lint exited with ${result.status}\n${result.stdout.slice(0, 2000)}\n${result.stderr.slice(0, 2000)}`,
		);
	}

	return result.stdout;
}

function collectMessages(dir, group) {
	const report = JSON.parse(bunLint(dir, ['-f', 'json']));
	const results = group.map(() => ({ messages: [] }));
	const unseen = new Set(
		group.flatMap((testCase, index) =>
			lintTargets(testCase).map((file) => `case-${index}/${file}`),
		),
	);

	for (const diagnostic of report.diagnostics) {
		const [, index, file] = /^case-(\d+)\/(.+)$/.exec(diagnostic.filename);
		// Parse errors also count: the file was read, and the error is reported.
		unseen.delete(diagnostic.filename);
		if (diagnostic.code === 'harness-probe(seen)') continue;
		const rule = /\((.+)\)$/.exec(diagnostic.code ?? '')?.[1] ?? null;
		const text = fs.readFileSync(path.join(dir, diagnostic.filename), 'utf8');
		const { offset, length, line, column } = diagnostic.labels[0].span;
		const end = endPosition(text, offset + length);

		results[index].messages.push({
			file,
			rule,
			line,
			column,
			endLine: end.line,
			endColumn: end.column,
			message: diagnostic.message,
		});
	}

	if (unseen.size > 0) {
		throw new Error(
			`No override matched these case files: ${[...unseen].join(', ')}`,
		);
	}

	return results;
}

function snapshotFiles(dir, group) {
	return group.map((testCase, index) =>
		Object.fromEntries(
			lintTargets(testCase).map((file) => [
				file,
				fs.readFileSync(path.join(dir, `case-${index}`, file), 'utf8'),
			]),
		),
	);
}

// `bun lint --fix` applies one pass; ESLint's verifyAndFix repeats up to 10.
function fixUntilStable(dir, group) {
	for (let pass = 0, before = null; pass < 10; pass++) {
		const current = JSON.stringify(snapshotFiles(dir, group));
		if (current === before) break;
		before = current;
		bunLint(dir, ['--fix', '-f', 'json']);
	}

	return snapshotFiles(dir, group);
}

function sortMessages(messages) {
	return messages.sort(
		(a, b) =>
			a.file.localeCompare(b.file) ||
			a.line - b.line ||
			a.column - b.column ||
			a.message.localeCompare(b.message),
	);
}

function runGroup(plugin, pluginPath, group) {
	// Bun matches override globs against real paths, so a symlinked temp
	// directory (macOS /var -> /private/var) would leave every override unused.
	const dir = fs.realpathSync(
		fs.mkdtempSync(path.join(os.tmpdir(), `rule-harness-${plugin}-`)),
	);

	try {
		writeGroup(dir, plugin, pluginPath, group);
		const results = collectMessages(dir, group);
		const outputs = fixUntilStable(dir, group);

		return results.map((result, index) => ({
			messages: sortMessages(result.messages),
			output: outputs[index],
		}));
	} finally {
		fs.rmSync(dir, { recursive: true, force: true });
	}
}

function runCases({ plugin, pluginPath, cases }) {
	const groups = new Map();

	cases.forEach((testCase, index) => {
		const key = testCase.isolate
			? `isolate-${index}`
			: JSON.stringify(testCase.settings ?? {});
		groups.set(key, [...(groups.get(key) ?? []), { testCase, index }]);
	});

	const results = new Array(cases.length);
	for (const entries of groups.values()) {
		const outputs = runGroup(
			plugin,
			pluginPath,
			entries.map((entry) => entry.testCase),
		);
		entries.forEach((entry, position) => {
			results[entry.index] = outputs[position];
		});
	}

	return Object.fromEntries(
		cases.map((testCase, index) => [testCase.name, results[index]]),
	);
}

module.exports = { caseFiles, lintTargets, runCases, sortMessages };
