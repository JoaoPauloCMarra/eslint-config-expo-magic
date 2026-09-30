import { describe, expect, it } from 'bun:test';

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
		expect(prGuardrails.mentionsRuntimeTarget(runtimeChecklist.join('\r\n'))).toBe(
			false,
		);
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
			prGuardrails.patchWithoutIgnoredFiles(spacedPatch, [/^scripts\/my b\/x\.ts$/]),
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
	const options = prGuardrails.createPrGuardrailOptions({ preset: 'mobileApp' });

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
