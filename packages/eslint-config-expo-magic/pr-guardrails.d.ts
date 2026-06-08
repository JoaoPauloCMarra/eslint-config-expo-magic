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

export type GuardrailOptions = {
	requiredCheckboxes?: string[];
	runtimeCheckbox?: string;
	runtimeTargetCheckbox?: string;
	protectedFilePatterns?: RegExp[];
	mobileRuntimePatterns?: RegExp[];
	screenOrComponentPatterns?: RegExp[];
	riskyPatterns?: RiskyPattern[];
	ownerApprovedLabel?: string;
	largeApprovedLabel?: string;
	maxChangedFiles?: number;
	maxChangedLines?: number;
};

export declare const defaultOptions: Required<GuardrailOptions>;

export declare function createPrGuardrailOptions(
	options?: GuardrailOptions,
): Required<GuardrailOptions>;
export declare function validateGuardrails(
	input: GuardrailInput,
	options?: GuardrailOptions,
): GuardrailResult;
export declare function hasCheckedCheckbox(
	markdown: string,
	label: string,
): boolean;
export declare function countChangedLines(patch: string): number;
export declare function hasRelatedTestOrStory(changedFiles: string[]): boolean;
export declare function mentionsRuntimeTarget(markdown: string): boolean;
export declare function readPullRequestInputFromEnv(): Promise<GuardrailInput>;
export declare function runCli(): Promise<void>;
