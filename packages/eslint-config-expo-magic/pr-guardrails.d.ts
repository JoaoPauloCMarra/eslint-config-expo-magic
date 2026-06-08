export type GuardrailInput = {
	eventName: string;
	prBody: string;
	labels: string[];
	changedFiles: string[];
	changedPatch: string;
};

export type GuardrailResult = {
	passed: boolean;
	failures: string[];
	warnings: string[];
};

export type RiskyPattern = {
	name: string;
	pattern: RegExp;
};

export type ResolvedGuardrailOptions = {
	requiredCheckboxes: string[];
	runtimeCheckbox: string;
	runtimeTargetCheckbox: string;
	protectedFilePatterns: RegExp[];
	mobileRuntimePatterns: RegExp[];
	screenOrComponentPatterns: RegExp[];
	riskyPatterns: RiskyPattern[];
	ignoredRiskyFilePatterns: RegExp[];
	ownerApprovedLabel: string;
	largeApprovedLabel: string;
	maxChangedFiles: number;
	maxChangedLines: number;
};

export type GuardrailOptions = {
	preset?: 'default' | 'mobileApp' | 'mobile-app' | ResolvedGuardrailOptions;
	requiredCheckboxes?: string[];
	additionalRequiredCheckboxes?: string[];
	runtimeCheckbox?: string;
	runtimeTargetCheckbox?: string;
	protectedFilePatterns?: RegExp[];
	additionalProtectedFilePatterns?: RegExp[];
	mobileRuntimePatterns?: RegExp[];
	additionalMobileRuntimePatterns?: RegExp[];
	screenOrComponentPatterns?: RegExp[];
	additionalScreenOrComponentPatterns?: RegExp[];
	riskyPatterns?: RiskyPattern[];
	additionalRiskyPatterns?: RiskyPattern[];
	ignoredRiskyFilePatterns?: RegExp[];
	additionalIgnoredRiskyFilePatterns?: RegExp[];
	ownerApprovedLabel?: string;
	largeApprovedLabel?: string;
	maxChangedFiles?: number;
	maxChangedLines?: number;
};

export declare const defaultOptions: ResolvedGuardrailOptions;
export declare const mobileAppOptions: ResolvedGuardrailOptions;
export declare const presets: {
	default: ResolvedGuardrailOptions;
	mobileApp: ResolvedGuardrailOptions;
	'mobile-app': ResolvedGuardrailOptions;
};

export declare function createPrGuardrailOptions(
	options?: GuardrailOptions,
): ResolvedGuardrailOptions;
export declare function validateGuardrails(
	input: GuardrailInput,
	options?: GuardrailOptions,
): GuardrailResult;
export declare function hasCheckedCheckbox(
	markdown: string,
	label: string,
): boolean;
export declare function countChangedLines(patch: string): number;
export declare function patchWithoutIgnoredFiles(
	patch: string,
	ignoredFilePatterns: RegExp[],
): string;
export declare function hasRelatedTestOrStory(changedFiles: string[]): boolean;
export declare function mentionsRuntimeTarget(markdown: string): boolean;
export declare function readPrGuardrailConfig(cwd?: string): GuardrailOptions;
export declare function readCliOptionsFromEnv(cwd?: string): GuardrailOptions;
export declare function readPullRequestInputFromEnv(): Promise<GuardrailInput>;
export declare function runCli(options?: GuardrailOptions): Promise<void>;
