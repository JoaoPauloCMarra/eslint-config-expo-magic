const { existsSync, readFileSync } = require('node:fs');
const { spawnSync } = require('node:child_process');

const defaultRequiredCheckboxes = [
	'`bun run lint:ci`',
	'`bun run typecheck`',
	'`bun run test:unit`',
	'`bun run validate:pr-guardrails`',
	'Watched GitHub CI after the latest push until `Validate Code` passed or a blocker was documented',
	'No skipped tests, loosened types, broad ignores, fake mocks, or unrelated rewrites to make CI pass',
	'No unrelated `package.json` or `bun.lock` changes',
];

const defaultRuntimeCheckbox =
	'Confirmed this machine can build and run the app in iOS Simulator or Android Emulator';

const defaultRuntimeTargetCheckbox =
	'Simulator/emulator target used for validation is named in the PR body';

const defaultProtectedFilePatterns = [
	/^package\.json$/,
	/^bun\.lock$/,
	/^\.github\//,
	/^AGENTS\.md$/,
	/^CLAUDE\.md$/,
	/^app\.config\./,
	/^eas\.json$/,
	/^\.eas\//,
	/^app\//,
	/^features\/auth\//,
	/^features\/core\/api\//,
	/^features\/.*\/api\//,
	/^features\/.*\/.*native/i,
	/^services\/(api|analytics|sentry|storage|startup-routing|push-notifications)/,
	/^.*storybook/i,
	/^\.storybook\//,
];

const defaultMobileRuntimePatterns = [
	/^app\//,
	/^features\/.*\/screens\//,
	/^features\/.*\/components\//,
	/^features\/.*\/hooks\//,
	/^features\/.*\/api\//,
	/^uikit\//,
	/^hooks\//,
	/^services\/(api|analytics|sentry|storage|startup-routing|push-notifications|linking-routing)/,
	/^.*storybook/i,
	/^\.storybook\//,
	/^app\.config\./,
	/^eas\.json$/,
	/^\.eas\//,
];

const defaultScreenOrComponentPatterns = [
	/^features\/.*\/screens\/.*\.(ts|tsx)$/,
	/^features\/.*\/components\/.*\.(ts|tsx)$/,
	/^uikit\/.*\.(ts|tsx)$/,
];

const defaultRiskyPatterns = [
	{ name: 'focused test', pattern: /^\+.*\b(describe|test|it)\.only\s*\(/m },
	{ name: 'skipped test', pattern: /^\+.*\b(describe|test|it)\.skip\s*\(/m },
	{
		name: 'broad eslint disable',
		pattern: /^\+.*eslint-disable(?!-next-line\s+[\w@/-])/m,
	},
	{ name: 'explicit any', pattern: /^\+.*:\s*any\b/m },
	{ name: 'generic any', pattern: /^\+.*<any\b/m },
	{ name: 'any assertion', pattern: /^\+.*\bas\s+any\b/m },
	{ name: 'unknown double assertion', pattern: /^\+.*as\s+unknown\s+as\b/m },
	{ name: 'non-null assertion', pattern: /^\+.*\b[a-zA-Z_$][\w$]*!\s*[\].)]/m },
	{ name: 'snapshot churn', pattern: /^\+.*toMatchSnapshot\s*\(/m },
];

const defaultOptions = {
	requiredCheckboxes: defaultRequiredCheckboxes,
	runtimeCheckbox: defaultRuntimeCheckbox,
	runtimeTargetCheckbox: defaultRuntimeTargetCheckbox,
	protectedFilePatterns: defaultProtectedFilePatterns,
	mobileRuntimePatterns: defaultMobileRuntimePatterns,
	screenOrComponentPatterns: defaultScreenOrComponentPatterns,
	riskyPatterns: defaultRiskyPatterns,
	ownerApprovedLabel: 'owner-approved',
	largeApprovedLabel: 'large-approved',
	maxChangedFiles: 80,
	maxChangedLines: 2500,
};

function createPrGuardrailOptions(options = {}) {
	return {
		...defaultOptions,
		...options,
		requiredCheckboxes:
			options.requiredCheckboxes ?? defaultOptions.requiredCheckboxes,
		protectedFilePatterns:
			options.protectedFilePatterns ?? defaultOptions.protectedFilePatterns,
		mobileRuntimePatterns:
			options.mobileRuntimePatterns ?? defaultOptions.mobileRuntimePatterns,
		screenOrComponentPatterns:
			options.screenOrComponentPatterns ??
			defaultOptions.screenOrComponentPatterns,
		riskyPatterns: options.riskyPatterns ?? defaultOptions.riskyPatterns,
	};
}

function validateGuardrails(input, options = {}) {
	const resolvedOptions = createPrGuardrailOptions(options);
	const failures = [];
	const warnings = [];
	const labels = new Set(input.labels);
	const protectedFiles = input.changedFiles.filter((filePath) =>
		matchesAny(filePath, resolvedOptions.protectedFilePatterns),
	);
	const mobileRuntimeFiles = input.changedFiles.filter((filePath) =>
		matchesAny(filePath, resolvedOptions.mobileRuntimePatterns),
	);
	const screenOrComponentFiles = input.changedFiles.filter((filePath) =>
		matchesAny(filePath, resolvedOptions.screenOrComponentPatterns),
	);
	const changedLineCount = countChangedLines(input.changedPatch);

	if (input.eventName !== 'pull_request') {
		return { passed: true, failures, warnings };
	}

	for (const label of resolvedOptions.requiredCheckboxes) {
		if (!hasCheckedCheckbox(input.prBody, label)) {
			failures.push(`Required PR checkbox is not checked: ${label}`);
		}
	}

	if (mobileRuntimeFiles.length > 0) {
		if (!hasCheckedCheckbox(input.prBody, resolvedOptions.runtimeCheckbox)) {
			failures.push(
				`Runtime validation checkbox is not checked: ${resolvedOptions.runtimeCheckbox}`,
			);
		}
		if (!hasCheckedCheckbox(input.prBody, resolvedOptions.runtimeTargetCheckbox)) {
			failures.push(
				`Runtime target checkbox is not checked: ${resolvedOptions.runtimeTargetCheckbox}`,
			);
		}
		if (!mentionsRuntimeTarget(input.prBody)) {
			failures.push(
				'PR body must name the iOS Simulator, Android Emulator, or physical device used for validation.',
			);
		}
	}

	if (
		protectedFiles.length > 0 &&
		!labels.has(resolvedOptions.ownerApprovedLabel)
	) {
		failures.push(
			`Protected files changed without ${resolvedOptions.ownerApprovedLabel} label: ${protectedFiles.join(', ')}`,
		);
	}

	for (const riskyPattern of resolvedOptions.riskyPatterns) {
		if (riskyPattern.pattern.test(input.changedPatch)) {
			failures.push(
				`Risky pattern detected in added lines: ${riskyPattern.name}`,
			);
		}
	}

	if (
		screenOrComponentFiles.length > 0 &&
		!hasRelatedTestOrStory(input.changedFiles) &&
		!labels.has(resolvedOptions.ownerApprovedLabel)
	) {
		failures.push(
			'Screen/component/UIKit changes need nearby tests or stories, or the owner approval label.',
		);
	}

	if (
		(input.changedFiles.length > resolvedOptions.maxChangedFiles ||
			changedLineCount > resolvedOptions.maxChangedLines) &&
		!labels.has(resolvedOptions.largeApprovedLabel)
	) {
		failures.push(
			`PR size exceeds guardrail threshold (${input.changedFiles.length} files, ${changedLineCount} changed lines) without ${resolvedOptions.largeApprovedLabel} label.`,
		);
	}

	if (hasStorybookFiles(input.changedFiles) && !hasStorybookInstalled()) {
		warnings.push(
			'Storybook files changed, but no Storybook package/config was detected in this checkout.',
		);
	}

	return {
		passed: failures.length === 0,
		failures,
		warnings,
	};
}

function hasCheckedCheckbox(markdown, label) {
	const normalizedLabel = escapeRegExp(label.trim());
	const pattern = new RegExp(
		`^-\\s*\\[[xX]\\]\\s*${normalizedLabel}\\s*$`,
		'm',
	);
	return pattern.test(markdown);
}

function countChangedLines(patch) {
	return patch
		.split('\n')
		.filter((line) => line.startsWith('+') || line.startsWith('-'))
		.filter((line) => !line.startsWith('+++') && !line.startsWith('---'))
		.length;
}

function hasRelatedTestOrStory(changedFiles) {
	return changedFiles.some((filePath) =>
		/(\.test\.(ts|tsx)|\.stories\.(ts|tsx))$/.test(filePath),
	);
}

function mentionsRuntimeTarget(markdown) {
	return /\b(iPhone|iPad|Simulator|Android Emulator|Pixel|Galaxy|physical device|device)\b/i.test(
		markdown,
	);
}

function matchesAny(filePath, patterns) {
	return patterns.some((pattern) => pattern.test(filePath));
}

function hasStorybookFiles(changedFiles) {
	return changedFiles.some((filePath) =>
		/(^\.storybook\/|\.stories\.(ts|tsx)$|storybook)/i.test(filePath),
	);
}

function hasStorybookInstalled() {
	if (existsSync('.storybook')) {
		return true;
	}
	if (!existsSync('package.json')) {
		return false;
	}
	const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
	return [
		...Object.keys(packageJson.dependencies ?? {}),
		...Object.keys(packageJson.devDependencies ?? {}),
		...Object.values(packageJson.scripts ?? {}),
	].some((value) => value.toLowerCase().includes('storybook'));
}

function escapeRegExp(value) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function runCommand(command) {
	const result = spawnSync(command[0], command.slice(1), {
		stdout: 'pipe',
		stderr: 'pipe',
		encoding: 'utf8',
	});
	if (result.status !== 0) {
		throw new Error(
			`Command failed: ${command.join(' ')}${result.stderr ? `\n${result.stderr.trim()}` : ''}`,
		);
	}
	return result.stdout;
}

async function readPullRequestInputFromEnv() {
	const eventName = process.env.GITHUB_EVENT_NAME ?? '';
	const eventPath = process.env.GITHUB_EVENT_PATH;
	if (eventName !== 'pull_request' || !eventPath) {
		return {
			eventName,
			prBody: '',
			labels: [],
			changedFiles: [],
			changedPatch: '',
		};
	}

	const eventPayload = JSON.parse(readFileSync(eventPath, 'utf8'));
	const livePr = await readLivePullRequestMetadata(eventPayload.number);
	const baseRef = eventPayload.pull_request?.base?.ref ?? 'main';
	runCommand(['git', 'fetch', '--no-tags', '--depth=1', 'origin', baseRef]);
	const changedFiles = runCommand([
		'git',
		'diff',
		'--name-only',
		`origin/${baseRef}...HEAD`,
	])
		.split('\n')
		.map((line) => line.trim())
		.filter((line) => line.length > 0);
	const changedPatch = runCommand([
		'git',
		'diff',
		'--unified=0',
		`origin/${baseRef}...HEAD`,
	]);

	return {
		eventName,
		prBody: livePr?.body ?? eventPayload.pull_request?.body ?? '',
		labels:
			livePr?.labels ??
			eventPayload.pull_request?.labels
				?.map((label) => label.name)
				.filter(Boolean) ??
			[],
		changedFiles,
		changedPatch,
	};
}

async function readLivePullRequestMetadata(prNumber) {
	const repository = process.env.GITHUB_REPOSITORY;
	const token = process.env.GITHUB_TOKEN;
	if (!repository || !token || !prNumber) {
		return null;
	}
	const response = await fetch(
		`https://api.github.com/repos/${repository}/issues/${prNumber}`,
		{
			headers: {
				Authorization: `Bearer ${token}`,
				Accept: 'application/vnd.github+json',
			},
		},
	);
	if (!response.ok) {
		return null;
	}
	const issue = await response.json();
	return {
		body: issue.body ?? '',
		labels:
			issue.labels
				?.map((label) => (typeof label === 'string' ? label : label.name))
				.filter(Boolean) ?? [],
	};
}

async function runCli() {
	const result = validateGuardrails(await readPullRequestInputFromEnv());
	for (const warning of result.warnings) {
		console.warn(`Warning: ${warning}`);
	}
	if (!result.passed) {
		for (const failure of result.failures) {
			console.error(`Failure: ${failure}`);
		}
		process.exit(1);
	}
	console.log('PR guardrails passed.');
}

module.exports = {
	countChangedLines,
	createPrGuardrailOptions,
	defaultOptions,
	hasCheckedCheckbox,
	hasRelatedTestOrStory,
	mentionsRuntimeTarget,
	readPullRequestInputFromEnv,
	runCli,
	validateGuardrails,
};
