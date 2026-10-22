#!/usr/bin/env bun

// Packs packages/bun-next, installs it into a fresh project without ESLint or
// Prettier, sets it up with expo-magic-init, and checks that bun lint and
// bun fmt work from the shipped files alone. Needs a Bun with the built-in
// bun lint (the latest canary unless BUN_PARITY_BIN is set).

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { resolveBunBinary } = require('./lib/bun-binary.js');

const rootDir = path.resolve(__dirname, '..');
const packageDir = path.join(rootDir, 'packages', 'bun-next');

// Put the tested Bun first on PATH: a `"lint": "bun lint"` script calls `bun`
// from PATH, and a Bun without the built-in command would run the script again.
let pathEnv = process.env;

function run(command, args, cwd, allowedStatuses = [0]) {
	const result = spawnSync(command, args, {
		cwd,
		encoding: 'utf8',
		env: pathEnv,
		maxBuffer: 64 * 1024 * 1024,
		timeout: 300_000,
	});
	if (result.error || !allowedStatuses.includes(result.status)) {
		throw new Error(
			`${path.basename(command)} ${args.join(' ')} exited with ${result.status}\n${result.stdout.slice(-2000)}\n${result.stderr.slice(-2000)}`,
		);
	}

	return result;
}

function check(condition, message) {
	if (!condition) throw new Error(`Consumer smoke failed: ${message}`);
	console.log(`ok - ${message}`);
}

function writeFiles(dir, files) {
	for (const [file, content] of Object.entries(files)) {
		fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
		fs.writeFileSync(path.join(dir, file), content);
	}
}

function lintRules(bun, dir) {
	const { stdout } = run(bun, ['lint', '-f', 'json'], dir, [0, 1]);

	return new Set(
		JSON.parse(stdout).diagnostics.map(
			(diagnostic) => `${diagnostic.filename} ${diagnostic.code}`,
		),
	);
}

function main() {
	const bun = resolveBunBinary();
	const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bun-consumer-'));
	const consumerDir = path.join(workDir, 'app');

	try {
		pathEnv = {
			...process.env,
			PATH: `${path.dirname(bun)}${path.delimiter}${process.env.PATH}`,
		};
		console.log(`bun ${run(bun, ['--revision'], workDir).stdout.trim()}`);
		run(bun, ['pm', 'pack', '--destination', workDir], packageDir);
		const tarball = fs
			.readdirSync(workDir)
			.find((file) => file.endsWith('.tgz'));

		writeFiles(consumerDir, {
			'package.json': `${JSON.stringify(
				{
					name: 'bun-consumer-smoke',
					private: true,
					devDependencies: {
						'eslint-config-expo-magic': `file:${path.join(workDir, tarball)}`,
					},
				},
				null,
				2,
			)}\n`,
			'tsconfig.json': `${JSON.stringify({ compilerOptions: { strict: true, jsx: 'react-jsx', paths: { '@/*': ['./*'] } }, include: ['**/*.ts', '**/*.tsx'] }, null, 2)}\n`,
			'src/unsafe.ts': 'export const value: any = 1;\nconsole.log(value);\n',
			'src/disabled.ts':
				'// eslint-disable-next-line @typescript-eslint/no-explicit-any\nexport const allowed: any = 1;\n',
			'src/formatted.ts': 'export const formatted = { a: 1 };\n',
			'src/unformatted.ts': 'export const unformatted = {a:1}\n',
		});

		run(bun, ['install'], consumerDir);
		const installed = fs.readdirSync(path.join(consumerDir, 'node_modules'));
		check(
			!installed.some((name) =>
				[
					'eslint',
					'prettier',
					'typescript-eslint',
					'@typescript-eslint',
				].includes(name),
			),
			'installing the package pulls in no ESLint, Prettier or TypeScript ESLint packages',
		);

		run(
			bun,
			['node_modules/eslint-config-expo-magic/bin/init.js', '--write'],
			consumerDir,
		);
		check(
			fs.existsSync(path.join(consumerDir, 'oxlint.config.ts')),
			'expo-magic-init writes oxlint.config.ts',
		);
		check(
			fs.existsSync(path.join(consumerDir, '.prettierrc.js')),
			'expo-magic-init writes .prettierrc.js',
		);

		// B1: Bun rejects the mobile-app profile's id-match lookahead pattern.
		const mobileApp = run(bun, ['lint', '-f', 'json'], consumerDir, [0, 1, 2]);
		const output = `${mobileApp.stdout}${mobileApp.stderr}`;
		if (/look-around/.test(output)) {
			console.log(
				'note - the mobile-app profile is still blocked by B1 (id-match look-around)',
			);
		} else {
			check(
				mobileApp.stdout.startsWith('{'),
				'the mobile-app profile lints; B1 is fixed, update docs/BUN_MIGRATION.md',
			);
		}

		fs.writeFileSync(
			path.join(consumerDir, 'oxlint.config.ts'),
			"import { createConfig } from 'eslint-config-expo-magic';\n\nexport default createConfig({ prettier: true });\n",
		);
		const rules = lintRules(bun, consumerDir);
		check(
			rules.has('src/unsafe.ts typescript(no-explicit-any)'),
			'bun lint reports a native TypeScript rule',
		);
		check(
			rules.has('src/unsafe.ts eslint(no-console)'),
			'bun lint reports a core rule',
		);
		check(
			![...rules].some((rule) =>
				rule.startsWith('src/disabled.ts typescript(no-explicit-any)'),
			),
			'an eslint-disable comment with the @typescript-eslint name still works',
		);
		check(
			rules.has('src/unformatted.ts bun(format)'),
			'prettier: true reports formatting through bun/format',
		);

		const script = run(bun, ['run', 'lint'], consumerDir, [0, 1]);
		check(
			/no-explicit-any/.test(`${script.stdout}${script.stderr}`),
			'the "lint": "bun lint" script runs the built-in linter',
		);

		const format = run(bun, ['fmt', '--check', 'src'], consumerDir, [0, 1]);
		check(
			format.status === 1 &&
				/unformatted\.ts/.test(`${format.stdout}${format.stderr}`) &&
				!/formatted\.ts\n/.test(format.stdout.replace(/unformatted\.ts/g, '')),
			'bun fmt --check flags only the unformatted file with the shared options',
		);
	} finally {
		fs.rmSync(workDir, { recursive: true, force: true });
	}
}

main();
