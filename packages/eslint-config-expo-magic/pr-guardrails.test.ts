import { describe, expect, it } from 'bun:test';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const prGuardrails = require('./pr-guardrails.js');

const mobileAppChecklist = [
	'- [x] `bun run lint:ci`',
	'- [x] `bun run typecheck`',
	'- [x] `bun run test:unit`',
	'- [x] `bun run validate:pr-guardrails`',
	'- [x] Watched GitHub CI after the latest push until `Validate Code` passed or a blocker was documented',
	'- [x] No skipped tests, loosened types, broad ignores, fake mocks, or unrelated rewrites to make CI pass',
	'- [x] No unrelated `package.json` or `bun.lock` changes',
];

const runtimeChecklist = [
	'- [x] Confirmed this machine can build and run the app in iOS Simulator or Android Emulator',
	'- [x] Simulator/emulator target used for validation is named in the PR body',
];

function failuresFor(
	input: Partial<{
		prBody: string;
		labels: string[];
		changedFiles: string[];
		changedPatch: string;
	}>,
	options: Record<string, unknown> = { preset: 'mobileApp' },
): string[] {
	return prGuardrails.validateGuardrails(
		{
			eventName: 'pull_request',
			prBody: mobileAppChecklist.join('\n'),
			labels: [],
			changedFiles: [],
			changedPatch: '',
			...input,
		},
		options,
	).failures;
}

const runtimeTargetFailure = 'PR body must name the iOS Simulator';

describe('pr guardrails runtime target evidence', () => {
	it('does not accept unchecked template lines as a runtime target', () => {
		expect(
			prGuardrails.mentionsRuntimeTarget(
				[
					'- [ ] Confirmed this machine can build and run the app in iOS Simulator or Android Emulator',
					'- [ ] Simulator/emulator target used for validation is named in the PR body',
				].join('\n'),
			),
		).toBe(false);
	});

	it('does not accept checked template labels as a runtime target', () => {
		expect(
			prGuardrails.mentionsRuntimeTarget(runtimeChecklist.join('\r\n')),
		).toBe(false);
		expect(
			failuresFor({
				prBody: [...mobileAppChecklist, ...runtimeChecklist].join('\n'),
				changedFiles: [
					'features/home/screens/home-screen.tsx',
					'features/home/screens/home-screen.test.tsx',
				],
			}),
		).toEqual(
			expect.arrayContaining([expect.stringContaining(runtimeTargetFailure)]),
		);
	});

	it('accepts prose and custom checked items that name a target', () => {
		expect(
			prGuardrails.mentionsRuntimeTarget(
				[...runtimeChecklist, 'Validated on iPhone 16 Simulator.'].join('\n'),
			),
		).toBe(true);
		expect(
			prGuardrails.mentionsRuntimeTarget('- [x] Pixel 9 emulator, Android 15'),
		).toBe(true);
		expect(
			failuresFor({
				prBody: [
					...mobileAppChecklist,
					...runtimeChecklist,
					'Validated on iPhone 16 Simulator.',
				].join('\n'),
				changedFiles: [
					'features/home/screens/home-screen.tsx',
					'features/home/screens/home-screen.test.tsx',
				],
			}),
		).toEqual([]);
	});
});

function riskyNamesFor(addedLine: string, preset: string): string[] {
	const options = prGuardrails.createPrGuardrailOptions({ preset });
	const patch = `${addedLine}\n@@ -1 +1 @@\n+const value = 1;`;
	return options.riskyPatterns
		.filter((risky: { pattern: RegExp }) => risky.pattern.test(patch))
		.map((risky: { name: string }) => risky.name);
}

describe('pr guardrails broad eslint disables', () => {
	const targeted = [
		'+// eslint-disable-next-line no-console',
		'+console.log(value); // eslint-disable-line no-console',
		'+// eslint-disable-next-line @typescript-eslint/no-explicit-any -- boundary type',
	];
	const broad = [
		'+// eslint-disable-next-line',
		'+console.log(value); // eslint-disable-line',
		'+// eslint-disable-line -- no rule named',
		'+/* eslint-disable */',
		'+/* eslint-disable no-console */',
	];

	for (const preset of ['default', 'agentMobileApp']) {
		for (const line of targeted) {
			it(`${preset} allows targeted disable: ${line}`, () => {
				const names = riskyNamesFor(line, preset);
				expect(names).not.toContain('broad eslint disable');
				expect(names).not.toContain('broad ignore');
			});
		}

		for (const line of broad) {
			it(`${preset} flags broad disable: ${line}`, () => {
				const names = riskyNamesFor(line, preset);
				expect(names).toContain('broad eslint disable');
				if (preset === 'agentMobileApp') {
					expect(names).toContain('broad ignore');
				}
			});
		}
	}

	it('keeps ts-ignore and ts-nocheck flagged for the agent preset', () => {
		expect(riskyNamesFor('+// @ts-ignore', 'agentMobileApp')).toEqual(
			expect.arrayContaining(['ts-ignore', 'broad ignore']),
		);
		expect(riskyNamesFor('+// @ts-nocheck', 'agentMobileApp')).toEqual(
			expect.arrayContaining(['ts-nocheck', 'broad ignore']),
		);
	});
});

describe('pr guardrails ignored risky files', () => {
	const scriptPatch = [
		'diff --git a/scripts/check.ts b/scripts/check.ts',
		'+++ b/scripts/check.ts',
		'+const value: any = input;',
	];
	const patch = [
		...scriptPatch,
		'diff --git a/src/features/home/home.ts b/src/features/home/home.ts',
		'+++ b/src/features/home/home.ts',
		'+it.only("focus", () => {});',
	].join('\n');

	it('matches anchored patterns against the file path', () => {
		const filtered = prGuardrails.patchWithoutIgnoredFiles(patch, [
			/^scripts\//,
		]);

		expect(filtered).not.toContain('value: any');
		expect(filtered).toContain('it.only');
	});

	it('does not match the diff header or a/ b/ prefixes', () => {
		expect(prGuardrails.patchWithoutIgnoredFiles(patch, [/^b\//])).toBe(patch);
		expect(prGuardrails.patchWithoutIgnoredFiles(patch, [/^diff /])).toBe(
			patch,
		);
	});

	it('matches either path of a renamed file', () => {
		const renamePatch = [
			'diff --git a/scripts/old.ts b/tools/new.ts',
			'+const value: any = input;',
		].join('\n');

		expect(
			prGuardrails.patchWithoutIgnoredFiles(renamePatch, [/^scripts\//]),
		).not.toContain('value: any');
		expect(
			prGuardrails.patchWithoutIgnoredFiles(renamePatch, [/^tools\//]),
		).not.toContain('value: any');
	});

	it('matches paths that contain spaces', () => {
		const spacedPatch = [
			'diff --git a/scripts/my b/x.ts b/scripts/my b/x.ts',
			'+const value: any = input;',
		].join('\n');

		expect(
			prGuardrails.patchWithoutIgnoredFiles(spacedPatch, [
				/^scripts\/my b\/x\.ts$/,
			]),
		).not.toContain('value: any');
	});

	it('skips risky failures for anchored ignored files', () => {
		expect(
			failuresFor(
				{
					changedFiles: ['scripts/check.ts'],
					changedPatch: scriptPatch.join('\n'),
				},
				{ preset: 'mobileApp', ignoredRiskyFilePatterns: [/^scripts\//] },
			),
		).toEqual([]);
	});
});

function matches(patterns: RegExp[], filePath: string): boolean {
	return patterns.some((pattern) => pattern.test(filePath));
}

describe('pr guardrails src-rooted mobile app paths', () => {
	const options = prGuardrails.createPrGuardrailOptions({
		preset: 'mobileApp',
	});

	for (const filePath of [
		'src/app/_layout.tsx',
		'src/features/auth/login.ts',
		'src/features/home/api/client.ts',
		'src/features/camera/native-camera.ts',
		'src/services/api/client.ts',
		'app/_layout.tsx',
		'features/home/api/client.ts',
	]) {
		it(`protects ${filePath}`, () => {
			expect(matches(options.protectedFilePatterns, filePath)).toBe(true);
		});
	}

	for (const filePath of [
		'src/app/(tabs)/index.tsx',
		'src/features/home/screens/home-screen.tsx',
		'src/features/home/api/client.ts',
		'src/uikit/button.tsx',
		'src/services/linking-routing/index.ts',
		'features/home/hooks/use-home.ts',
	]) {
		it(`treats ${filePath} as a runtime file`, () => {
			expect(matches(options.mobileRuntimePatterns, filePath)).toBe(true);
		});
	}

	for (const filePath of [
		'src/features/home/screens/home-screen.tsx',
		'src/uikit/button.tsx',
	]) {
		it(`treats ${filePath} as a screen or component`, () => {
			expect(matches(options.screenOrComponentPatterns, filePath)).toBe(true);
		});
	}

	it('requires runtime evidence and owner approval for src/app changes', () => {
		const failures = failuresFor({
			changedFiles: ['src/app/_layout.tsx'],
		});

		expect(failures).toEqual(
			expect.arrayContaining([
				expect.stringContaining('Runtime validation checkbox is not checked'),
				expect.stringContaining('Protected files changed'),
			]),
		);
	});

	it('keeps default src paths unprotected', () => {
		const defaults = prGuardrails.createPrGuardrailOptions();

		expect(matches(defaults.protectedFilePatterns, 'src/app/_layout.tsx')).toBe(
			false,
		);
	});
});

const nearbyFailure = 'need nearby tests or stories';

describe('pr guardrails nearby tests and stories', () => {
	function coverageFailures(changedFiles: string[]): string[] {
		return failuresFor({ changedFiles }).filter((failure) =>
			failure.includes(nearbyFailure),
		);
	}

	for (const testFile of [
		'features/home/screens/home-screen.test.tsx',
		'features/home/screens/home-screen.spec.tsx',
		'features/home/screens/home-screen.test.js',
		'features/home/screens/home-screen.spec.jsx',
		'features/home/screens/home-screen.test.mts',
		'features/home/screens/home-screen.stories.jsx',
		'features/home/screens/__tests__/home-screen.tsx',
		'features/home/__tests__/home-screen.test.tsx',
		'features/home/hooks/use-home.test.ts',
	]) {
		it(`accepts ${testFile} as nearby coverage`, () => {
			expect(
				coverageFailures(['features/home/screens/home-screen.tsx', testFile]),
			).toEqual([]);
		});
	}

	it('accepts a sibling __tests__ directory outside features', () => {
		expect(
			coverageFailures(['uikit/button.tsx', 'uikit/__tests__/button.test.tsx']),
		).toEqual([]);
	});

	it('rejects a test in another feature', () => {
		expect(
			coverageFailures([
				'features/home/screens/home-screen.tsx',
				'features/profile/screens/profile-screen.test.tsx',
			]),
		).toHaveLength(1);
	});

	it('rejects a test in an unrelated directory', () => {
		expect(
			coverageFailures(['uikit/button.tsx', 'services/api/client.test.ts']),
		).toHaveLength(1);
	});

	it('needs nearby coverage for every changed screen or component', () => {
		expect(
			coverageFailures([
				'features/home/screens/home-screen.tsx',
				'features/home/screens/home-screen.test.tsx',
				'uikit/button.tsx',
			]),
		).toHaveLength(1);
	});

	it('keeps the single-argument helper as an any-test check', () => {
		expect(
			prGuardrails.hasRelatedTestOrStory([
				'features/home/screens/home-screen.tsx',
				'src/other/thing.spec.js',
			]),
		).toBe(true);
		expect(
			prGuardrails.hasRelatedTestOrStory([
				'features/home/screens/home-screen.tsx',
			]),
		).toBe(false);
	});
});

type SpawnResult = { status: number; stdout: string; stderr: string };

function createFakeGit(
	responses: Record<string, SpawnResult | (() => SpawnResult)>,
) {
	const calls: string[] = [];
	const spawn = (command: string, args: string[]) => {
		const key = [command, ...args].join(' ');
		calls.push(key);
		const match = Object.keys(responses).find((prefix) =>
			key.startsWith(prefix),
		);
		if (!match) {
			return { status: 0, stdout: '', stderr: '' };
		}
		const response = responses[match];
		return typeof response === 'function' ? response() : response;
	};
	return { calls, spawn };
}

const ok = (stdout = ''): SpawnResult => ({ status: 0, stdout, stderr: '' });
const failed = (stderr = 'fatal'): SpawnResult => ({
	status: 1,
	stdout: '',
	stderr,
});

const eventPayload = {
	number: 7,
	pull_request: {
		body: 'payload body',
		labels: [{ name: 'payload-label' }],
		base: { ref: 'main' },
	},
};

function pullRequestDeps(
	spawn: ReturnType<typeof createFakeGit>['spawn'],
	extra: Record<string, unknown> = {},
) {
	const warnings: string[] = [];
	return {
		warnings,
		deps: {
			env: {
				GITHUB_EVENT_NAME: 'pull_request',
				GITHUB_EVENT_PATH: '/event.json',
				GITHUB_REPOSITORY: 'owner/repo',
				GITHUB_TOKEN: 'test-token',
			},
			readFile: () => JSON.stringify(eventPayload),
			spawn,
			warn: (message: string) => warnings.push(message),
			...extra,
		},
	};
}

describe('pr guardrails pull request input', () => {
	it('returns an empty input outside pull_request events', async () => {
		const git = createFakeGit({});
		const input = await prGuardrails.readPullRequestInputFromEnv({
			env: { GITHUB_EVENT_NAME: 'push' },
			spawn: git.spawn,
		});

		expect(input).toEqual({
			eventName: 'push',
			prBody: '',
			labels: [],
			changedFiles: [],
			changedPatch: '',
		});
		expect(git.calls).toEqual([]);
	});

	it('uses a three-dot diff when a merge base exists', async () => {
		const git = createFakeGit({
			'git diff --name-only': ok('src/a.ts\n\nsrc/b.ts\n'),
			'git diff --unified=0': ok('+const a = 1;\n'),
		});
		const { deps, warnings } = pullRequestDeps(git.spawn, {
			fetch: async () => ({
				ok: true,
				json: async () => ({
					body: 'live body',
					labels: ['live', { name: 'x' }],
				}),
			}),
		});

		const input = await prGuardrails.readPullRequestInputFromEnv(deps);

		expect(input).toEqual({
			eventName: 'pull_request',
			prBody: 'live body',
			labels: ['live', 'x'],
			changedFiles: ['src/a.ts', 'src/b.ts'],
			changedPatch: '+const a = 1;\n',
		});
		expect(git.calls).toContain('git diff --name-only origin/main...HEAD');
		expect(git.calls.some((call) => call.includes('--unshallow'))).toBe(false);
		expect(warnings).toEqual([]);
	});

	it('unshallows a shallow checkout that has no merge base', async () => {
		let mergeBaseCalls = 0;
		const git = createFakeGit({
			'git merge-base': () => (++mergeBaseCalls === 1 ? failed() : ok('abc\n')),
			'git rev-parse --is-shallow-repository': ok('true\n'),
		});
		const { deps, warnings } = pullRequestDeps(git.spawn, {
			fetch: async () => ({ ok: false }),
		});

		await prGuardrails.readPullRequestInputFromEnv(deps);

		expect(git.calls.some((call) => call.includes('--unshallow'))).toBe(true);
		expect(git.calls).toContain('git diff --name-only origin/main...HEAD');
		expect(warnings).toEqual([]);
	});

	it('falls back to a two-dot diff when no merge base can be found', async () => {
		const git = createFakeGit({
			'git merge-base': failed(),
			'git rev-parse --is-shallow-repository': ok('false\n'),
		});
		const { deps, warnings } = pullRequestDeps(git.spawn, {
			fetch: async () => ({ ok: false }),
		});

		await prGuardrails.readPullRequestInputFromEnv(deps);

		expect(git.calls.some((call) => call.includes('--unshallow'))).toBe(false);
		expect(git.calls).toContain('git diff --name-only origin/main..HEAD');
		expect(warnings).toEqual([expect.stringContaining('fetch-depth: 0')]);
	});

	it('falls back to the event payload when the GitHub API is unreachable', async () => {
		const git = createFakeGit({});
		const { deps } = pullRequestDeps(git.spawn, {
			fetch: async () => {
				throw new TypeError('fetch failed');
			},
		});

		const input = await prGuardrails.readPullRequestInputFromEnv(deps);

		expect(input.prBody).toBe('payload body');
		expect(input.labels).toEqual(['payload-label']);
	});

	it('falls back to the event payload when the API response is not ok', async () => {
		const git = createFakeGit({});
		const { deps } = pullRequestDeps(git.spawn, {
			fetch: async () => ({ ok: false }),
		});

		const input = await prGuardrails.readPullRequestInputFromEnv(deps);

		expect(input.prBody).toBe('payload body');
	});
});

describe('pr guardrails shallow checkout', () => {
	const gitEnv = {
		...process.env,
		GIT_AUTHOR_NAME: 'Test',
		GIT_AUTHOR_EMAIL: 'test@example.test',
		GIT_COMMITTER_NAME: 'Test',
		GIT_COMMITTER_EMAIL: 'test@example.test',
		GIT_CONFIG_GLOBAL: '/dev/null',
		GIT_CONFIG_NOSYSTEM: '1',
	};

	function git(cwd: string, args: string[]): string {
		const result = spawnSync('git', args, {
			cwd,
			env: gitEnv,
			encoding: 'utf8',
		});
		if (result.status !== 0) {
			throw new Error(`git ${args.join(' ')} failed: ${result.stderr}`);
		}
		return result.stdout;
	}

	function commitFile(cwd: string, fileName: string, message: string) {
		fs.writeFileSync(path.join(cwd, fileName), `${message}\n`);
		git(cwd, ['add', fileName]);
		git(cwd, ['commit', '-q', '-m', message]);
	}

	it('finds the PR diff from a depth=1 checkout of the merge ref', async () => {
		const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pr-guardrails-git-'));
		try {
			const origin = path.join(root, 'origin.git');
			const work = path.join(root, 'work');
			const checkout = path.join(root, 'checkout');
			git(root, ['init', '-q', '--bare', '-b', 'main', origin]);
			git(root, ['init', '-q', '-b', 'main', work]);
			commitFile(work, 'base.ts', 'base');
			git(work, ['checkout', '-q', '-b', 'feature']);
			commitFile(work, 'feature-one.ts', 'feature one');
			commitFile(work, 'feature-two.ts', 'feature two');
			git(work, ['checkout', '-q', 'main']);
			commitFile(work, 'main-later.ts', 'main later');
			git(work, ['checkout', '-q', '--detach', 'main']);
			git(work, ['merge', '-q', '--no-ff', '-m', 'merge', 'feature']);
			git(work, ['remote', 'add', 'origin', origin]);
			git(work, [
				'push',
				'-q',
				'origin',
				'main',
				'feature',
				'HEAD:refs/pull/1/merge',
			]);
			fs.mkdirSync(checkout);
			git(checkout, ['init', '-q']);
			git(checkout, ['remote', 'add', 'origin', `file://${origin}`]);
			git(checkout, [
				'fetch',
				'-q',
				'--no-tags',
				'--depth=1',
				'origin',
				'+refs/pull/1/merge:refs/remotes/pull/1/merge',
			]);
			git(checkout, [
				'checkout',
				'-q',
				'--detach',
				'refs/remotes/pull/1/merge',
			]);

			const warnings: string[] = [];
			const calls: string[] = [];
			const input = await prGuardrails.readPullRequestInputFromEnv({
				env: {
					GITHUB_EVENT_NAME: 'pull_request',
					GITHUB_EVENT_PATH: 'event.json',
				},
				readFile: () =>
					JSON.stringify({
						number: 1,
						pull_request: { base: { ref: 'main' } },
					}),
				spawn: (command: string, args: string[], options: object) => {
					calls.push(args.join(' '));
					return spawnSync(command, args, {
						...options,
						cwd: checkout,
						env: gitEnv,
					});
				},
				warn: (message: string) => warnings.push(message),
			});

			expect(calls.some((call) => call.includes('--unshallow'))).toBe(true);
			expect(input.changedFiles.sort()).toEqual([
				'feature-one.ts',
				'feature-two.ts',
			]);
			expect(warnings).toEqual([]);
		} finally {
			fs.rmSync(root, { recursive: true, force: true });
		}
	}, 15_000);
});

describe('pr guardrails CLI', () => {
	function cliDeps(extra: Record<string, unknown> = {}) {
		const output: { log: string[]; warn: string[]; error: string[] } = {
			log: [],
			warn: [],
			error: [],
		};
		const exitCodes: number[] = [];
		return {
			output,
			exitCodes,
			deps: {
				env: { GITHUB_EVENT_NAME: 'push' },
				log: (message: string) => output.log.push(message),
				warn: (message: string) => output.warn.push(message),
				error: (message: string) => output.error.push(message),
				exit: (code: number) => exitCodes.push(code),
				...extra,
			},
		};
	}

	it('runs the bin entry outside pull_request events', () => {
		const result = spawnSync(
			process.execPath,
			[path.join(__dirname, 'bin/pr-guardrails.js')],
			{
				cwd: os.tmpdir(),
				env: { ...process.env, GITHUB_EVENT_NAME: 'push' },
				encoding: 'utf8',
			},
		);

		expect(result.status).toBe(0);
		expect(result.stdout).toContain('PR guardrails passed.');
	});

	it('exits the bin entry with 1 and a short error when git fails', () => {
		const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pr-guardrails-bin-'));
		try {
			const eventPath = path.join(root, 'event.json');
			fs.writeFileSync(
				eventPath,
				JSON.stringify({ number: 1, pull_request: { base: { ref: 'main' } } }),
			);
			const result = spawnSync(
				process.execPath,
				[path.join(__dirname, 'bin/pr-guardrails.js')],
				{
					cwd: root,
					env: {
						...process.env,
						GITHUB_EVENT_NAME: 'pull_request',
						GITHUB_EVENT_PATH: eventPath,
						GITHUB_TOKEN: '',
						GIT_CEILING_DIRECTORIES: path.dirname(root),
					},
					encoding: 'utf8',
				},
			);

			expect(result.status).toBe(1);
			expect(result.stderr).toContain('PR guardrails could not run');
			expect(result.stderr).not.toContain('    at ');
		} finally {
			fs.rmSync(root, { recursive: true, force: true });
		}
	});

	it('passes outside pull_request events', async () => {
		const { deps, output, exitCodes } = cliDeps();

		await prGuardrails.runCli({}, deps);

		expect(output.log).toEqual(['PR guardrails passed.']);
		expect(exitCodes).toEqual([]);
	});

	it('prints failures and exits with 1', async () => {
		const git = createFakeGit({
			'git diff --name-only': ok('package.json\n'),
			'git diff --unified=0': ok('+const value: any = input;\n'),
		});
		const { deps: inputDeps } = pullRequestDeps(git.spawn, {
			fetch: async () => ({ ok: false }),
		});
		const { deps, output, exitCodes } = cliDeps(inputDeps);

		await prGuardrails.runCli({}, { ...deps, env: inputDeps.env });

		expect(output.error).toEqual(
			expect.arrayContaining([
				expect.stringContaining('Protected files changed'),
				expect.stringContaining('explicit any'),
			]),
		);
		expect(output.log).toEqual([]);
		expect(exitCodes).toEqual([1]);
	});

	it('reports a git failure as a short error and exits with 1', async () => {
		const git = createFakeGit({
			'git fetch': failed("fatal: couldn't find remote ref main"),
		});
		const { deps: inputDeps } = pullRequestDeps(git.spawn, {
			fetch: async () => ({ ok: false }),
		});
		const { deps, output, exitCodes } = cliDeps(inputDeps);

		await prGuardrails.runCli({}, { ...deps, env: inputDeps.env });

		expect(output.error).toHaveLength(1);
		expect(output.error[0]).toContain('PR guardrails could not run');
		expect(output.error[0]).toContain("couldn't find remote ref main");
		expect(output.log).toEqual([]);
		expect(exitCodes).toEqual([1]);
	});
});
