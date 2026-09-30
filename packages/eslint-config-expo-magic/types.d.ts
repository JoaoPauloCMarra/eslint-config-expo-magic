import type { ESLint, Linter, Rule } from 'eslint';

export type FlatConfig = Linter.Config;

export type RestrictedSyntaxSelector = Readonly<{
	selector: string;
	message?: string;
}>;

export type RestrictedSyntaxScope =
	| 'typescript'
	| 'typescript-without-tsx'
	| 'tsx'
	| 'test'
	| 'test-typescript'
	| 'test-tsx';

export type RestrictedSyntaxGroup = Readonly<{
	files: readonly string[];
	selectors: readonly RestrictedSyntaxSelector[];
	scope?: RestrictedSyntaxScope | readonly RestrictedSyntaxScope[];
	capability?: string;
	allowFiles?: readonly string[];
}>;

export type RestrictedSyntaxConfig = FlatConfig[] & {
	restrictedSyntaxGroups: readonly RestrictedSyntaxGroup[];
};

export type AgentGuardrailsConfig = RestrictedSyntaxConfig & {
	base: FlatConfig[];
	syntaxBase: FlatConfig[];
	createAgentGuardrailsConfig(): FlatConfig[];
	createRestrictedSyntaxGroups(): RestrictedSyntaxGroup[];
};

export type AppGuardrailsOptions = Readonly<{
	queryHookPattern?: string;
}>;

export type AppGuardrailsConfig = RestrictedSyntaxConfig & {
	base: FlatConfig[];
	createAppGuardrailsConfig(options?: AppGuardrailsOptions): FlatConfig[];
	createRestrictedSyntaxGroups(
		options?: AppGuardrailsOptions,
	): RestrictedSyntaxGroup[];
};

export type ComponentStructureOptions = Readonly<{
	propsTypePattern?: string;
}>;

export type DeprecatedApiRestrictedProperty = Readonly<{
	object?: string;
	property?: string;
	message?: string;
}>;

export type DeprecatedApiRestrictedType = Readonly<{
	message?: string;
	fixWith?: string;
}>;

export type DeprecatedApiOptions = Readonly<{
	additionalRestrictedProperties?: readonly DeprecatedApiRestrictedProperty[];
	additionalRestrictedTypes?: Readonly<
		Record<string, string | DeprecatedApiRestrictedType>
	>;
}>;

export type FeatureBoundaryOptions = Readonly<{
	featureElementTypes?: readonly string[];
	additionalFeatureElementTypes?: readonly string[];
	sharedComponentPatterns?: readonly string[];
	additionalSharedComponentPatterns?: readonly string[];
}>;

export type NativeUiRestriction = Readonly<{
	name: string;
	importNames?: readonly string[];
	message?: string;
}>;

export type NativeUiOptions = Readonly<{
	restrictions?: readonly NativeUiRestriction[];
	additionalRestrictions?: readonly NativeUiRestriction[];
	allowFiles?: readonly string[];
}>;

export type ReanimatedOptions = Readonly<{
	gestureHooks?: readonly string[];
	additionalGestureHooks?: readonly string[];
}>;

export type SemanticColorsOptions = Readonly<{
	tokenModule?: string;
	importName?: string;
	flagDirectAccess?: boolean;
	allowFiles?: readonly string[];
}>;

export type AgentOptions = Readonly<{
	appGuardrails?: boolean | AppGuardrailsOptions;
	deprecatedApis?: boolean | DeprecatedApiOptions;
	reactCompiler?: boolean;
	reanimated?: boolean | ReanimatedOptions;
	semanticColors?: boolean | SemanticColorsOptions;
	worklets?: boolean;
}>;

export type CreateConfigOptions = Readonly<{
	preset?: 'base' | 'default' | 'fast';
	prettier?: boolean;
	testing?: boolean;
	typeChecked?: boolean;
	strict?: boolean;
	tsconfigProjects?: readonly string[];
	extraIgnores?: readonly string[];
	importCycles?: boolean;
	agent?: boolean | AgentOptions;
	appGuardrails?: boolean | AppGuardrailsOptions;
	componentStructure?: boolean | ComponentStructureOptions;
	deprecatedApis?: boolean | DeprecatedApiOptions;
	featureBoundaries?: boolean | FeatureBoundaryOptions;
	inlineStyles?: boolean | Linter.RuleSeverity;
	nativeUi?: boolean | NativeUiOptions;
	reactCompiler?: boolean;
	reanimated?: boolean | ReanimatedOptions;
	semanticColors?: boolean | SemanticColorsOptions;
	storybook?: boolean;
	worklets?: boolean;
}>;

export type ReactCompilerRuleName =
	| 'react-hooks/incompatible-library'
	| 'react-hooks/unsupported-syntax'
	| 'react-hooks/immutability'
	| 'react-hooks/purity'
	| 'react-hooks/preserve-manual-memoization'
	| 'react-hooks/set-state-in-render'
	| 'react-hooks/static-components';

export type ReactCompilerConfig = FlatConfig[] & {
	rules: Readonly<Record<ReactCompilerRuleName, Linter.RuleEntry>>;
	restrictedSyntaxGroups: readonly RestrictedSyntaxGroup[];
};

export type ReanimatedConfig = FlatConfig[] & {
	createReanimatedConfig(options?: ReanimatedOptions): FlatConfig[];
	createRestrictedSyntaxGroups(
		options?: ReanimatedOptions,
	): RestrictedSyntaxGroup[];
	createSharedValueUsageConfig(): FlatConfig[];
	restrictedSyntaxGroups: readonly RestrictedSyntaxGroup[];
	sharedValueUsageRule: Rule.RuleModule;
};

export type SemanticColorsConfig = FlatConfig[] & {
	createSemanticColorsConfig(options?: SemanticColorsOptions): FlatConfig[];
	createRestrictedSyntaxGroups(
		options?: SemanticColorsOptions,
	): RestrictedSyntaxGroup[];
	createAllowConfig(options?: SemanticColorsOptions): FlatConfig[];
	restrictedSyntaxGroups: readonly RestrictedSyntaxGroup[];
};

export type TypedConfig = FlatConfig[];

export type GuardrailInput = Readonly<{
	eventName: string;
	prBody: string;
	labels: readonly string[];
	changedFiles: readonly string[];
	changedPatch: string;
}>;

export type GuardrailResult = Readonly<{
	passed: boolean;
	failures: readonly string[];
	warnings: readonly string[];
}>;

export type RiskyPattern = Readonly<{
	name: string;
	pattern: RegExp;
}>;

export type ResolvedGuardrailOptions = Readonly<{
	requiredCheckboxes: readonly string[];
	runtimeCheckbox: string;
	runtimeTargetCheckbox: string;
	protectedFilePatterns: readonly RegExp[];
	mobileRuntimePatterns: readonly RegExp[];
	screenOrComponentPatterns: readonly RegExp[];
	riskyPatterns: readonly RiskyPattern[];
	ignoredRiskyFilePatterns: readonly RegExp[];
	ownerApprovedLabel: string;
	largeApprovedLabel: string;
	maxChangedFiles: number;
	maxChangedLines: number;
}>;

export type PrGuardrailPreset =
	| 'default'
	| 'agentMobileApp'
	| 'agent-mobile-app'
	| 'mobileApp'
	| 'mobile-app';

export type GuardrailOptions = Readonly<{
	preset?: PrGuardrailPreset | ResolvedGuardrailOptions;
	requiredCheckboxes?: readonly string[];
	additionalRequiredCheckboxes?: readonly string[];
	runtimeCheckbox?: string;
	runtimeTargetCheckbox?: string;
	protectedFilePatterns?: readonly RegExp[];
	additionalProtectedFilePatterns?: readonly RegExp[];
	mobileRuntimePatterns?: readonly RegExp[];
	additionalMobileRuntimePatterns?: readonly RegExp[];
	screenOrComponentPatterns?: readonly RegExp[];
	additionalScreenOrComponentPatterns?: readonly RegExp[];
	riskyPatterns?: readonly RiskyPattern[];
	additionalRiskyPatterns?: readonly RiskyPattern[];
	ignoredRiskyFilePatterns?: readonly RegExp[];
	additionalIgnoredRiskyFilePatterns?: readonly RegExp[];
	ownerApprovedLabel?: string;
	largeApprovedLabel?: string;
	maxChangedFiles?: number;
	maxChangedLines?: number;
}>;

export type PrGuardrailsSpawnResult = Readonly<{
	status: number | null;
	stdout: string;
	stderr?: string;
}>;

export type PrGuardrailsInputDeps = Readonly<{
	env?: Readonly<Record<string, string | undefined>>;
	readFile?: (filePath: string) => string;
	spawn?: (
		command: string,
		args: readonly string[],
		options: Readonly<{ encoding: 'utf8' }>,
	) => PrGuardrailsSpawnResult;
	warn?: (message: string) => void;
	fetch?: (
		url: string,
		init: Readonly<{ headers: Readonly<Record<string, string>> }>,
	) => Promise<Readonly<{ ok: boolean; json(): Promise<unknown> }>>;
}>;

export type PrGuardrailsCliDeps = PrGuardrailsInputDeps &
	Readonly<{
		cwd?: string;
		log?: (message: string) => void;
		error?: (message: string) => void;
		exit?: (code: number) => void;
	}>;

export type PrGuardrailPresets = Readonly<{
	default: ResolvedGuardrailOptions;
	agentMobileApp: ResolvedGuardrailOptions;
	'agent-mobile-app': ResolvedGuardrailOptions;
	mobileApp: ResolvedGuardrailOptions;
	'mobile-app': ResolvedGuardrailOptions;
}>;

export type PrGuardrailsConfig = {
	defaultOptions: ResolvedGuardrailOptions;
	agentMobileAppOptions: ResolvedGuardrailOptions;
	mobileAppOptions: ResolvedGuardrailOptions;
	presets: PrGuardrailPresets;
	createPrGuardrailOptions(
		options?: GuardrailOptions,
	): ResolvedGuardrailOptions;
	validateGuardrails(
		input: GuardrailInput,
		options?: GuardrailOptions,
	): GuardrailResult;
	hasCheckedCheckbox(markdown: string, label: string): boolean;
	countChangedLines(patch: string): number;
	patchWithoutIgnoredFiles(
		patch: string,
		ignoredFilePatterns: readonly RegExp[],
	): string;
	hasRelatedTestOrStory(
		changedFiles: readonly string[],
		relatedFiles?: readonly string[],
	): boolean;
	mentionsRuntimeTarget(
		markdown: string,
		templateLabels?: readonly string[],
	): boolean;
	readPrGuardrailConfig(cwd?: string): GuardrailOptions;
	readCliOptionsFromEnv(
		cwd?: string,
		env?: Readonly<Record<string, string | undefined>>,
	): GuardrailOptions;
	readPullRequestInputFromEnv(
		deps?: PrGuardrailsInputDeps,
	): Promise<GuardrailInput>;
	runCli(
		options?: GuardrailOptions,
		deps?: PrGuardrailsCliDeps,
	): Promise<void>;
};

export type ComponentStructureModule = FlatConfig[] & {
	createComponentStructureConfig(
		options?: ComponentStructureOptions,
	): FlatConfig[];
	plugin: ESLint.Plugin;
	recommended: FlatConfig[];
};
