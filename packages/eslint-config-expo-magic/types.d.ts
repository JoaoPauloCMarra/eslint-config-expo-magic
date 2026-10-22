export type RuleSeverity = 'off' | 'warn' | 'error' | 0 | 1 | 2;

export type RuleEntry = RuleSeverity | readonly [RuleSeverity, ...unknown[]];

export type GlobalValue = 'readonly' | 'writable' | 'off';

/** One file-scoped block of an oxlint config. Later overrides win. */
export type OxlintOverride = {
	files: string[];
	excludeFiles?: string[];
	globals?: Record<string, GlobalValue>;
	rules?: Record<string, RuleEntry>;
};

/** The oxlint-format config that `bun lint` reads from `oxlint.config.ts`. */
export type OxlintConfig = {
	options?: { typeAware?: boolean };
	categories: Record<string, RuleSeverity | 'allow' | 'deny'>;
	plugins: string[];
	jsPlugins: { name: string; specifier: string }[];
	settings: Record<string, unknown>;
	ignorePatterns: string[];
	overrides: OxlintOverride[];
};

/** Prettier-compatible options that `bun fmt` reads from `.prettierrc.js`. */
export type FormatterOptions = Readonly<Record<string, unknown>>;

export type AppGuardrailsOptions = Readonly<{
	queryHookPattern?: string;
}>;

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
	inlineStyles?: boolean | RuleSeverity;
	nativeUi?: boolean | NativeUiOptions;
	reactCompiler?: boolean;
	reanimated?: boolean | ReanimatedOptions;
	semanticColors?: boolean | SemanticColorsOptions;
	storybook?: boolean;
	worklets?: boolean;
}>;

export type MobileAppConfigOptions = Readonly<{
	preset?: 'default' | 'fast';
	tsconfigProjects?: readonly string[];
	extraIgnores?: readonly string[];
	/** Extra files that may import the raw primitives they wrap. */
	additionalNativeUiWrapperFiles?: readonly string[];
}>;

export type ArchitectureLayers = {
	/** Route or navigation-host folder under `srcRoot`. Expo: `app`. Bare: `core`. */
	routes: string;
	/** UI layer folder. Expo: `uikit`. Bare: `shared`. */
	ui: string;
	/** Design-token folder. Expo: `uikit/tokens`. Bare: `shared/theme`. */
	tokens: string;
	/** Owned-primitive folder. Expo: `uikit/components`. Bare: `shared/ui`. */
	components: string;
};

export type RestrictedImportPattern = {
	group?: string[];
	regex?: string;
	message?: string;
};

export type ArchitectureOptions = {
	/** Layer vocabulary. Defaults to the Expo lane. */
	layers?: Partial<ArchitectureLayers>;
	/** Source root. Defaults to `src`. */
	srcRoot?: string;
	/** Import alias prefix for `src`. Defaults to `@`. */
	aliasPrefix?: string;
	/** Colour token module path, as in `semanticColors` (`uikit/tokens/colors`). */
	tokenModule?: string;
	/** Logger module allowed to call `console.*`. */
	loggerModule?: string;
	/** Files permitted to import raw native primitives. */
	nativeWrappers?: string[];
	/** Extra `no-restricted-imports` paths merged into every layer block. */
	extraNativeUiRestrictions?: NativeUiRestriction[];
	/** Extra `no-restricted-imports` patterns merged into every layer block. */
	extraNativeLibPatterns?: RestrictedImportPattern[];
	/** The same `nativeUi` options passed in `base`. */
	nativeUi?: boolean | NativeUiOptions;
	/** `createConfig` options for the config the architecture blocks extend. */
	base?: CreateConfigOptions;
};

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
	runCli(options?: GuardrailOptions, deps?: PrGuardrailsCliDeps): Promise<void>;
};
