import type { Linter, Rule } from 'eslint';

type FlatConfig = Linter.Config;

type RestrictedSyntaxSelector = {
	selector: string;
	message?: string;
};

type RestrictedSyntaxGroup = {
	files: string[];
	selectors: RestrictedSyntaxSelector[];
};

type RestrictedSyntaxConfig = FlatConfig[] & {
	restrictedSyntaxGroups: RestrictedSyntaxGroup[];
};

type AgentGuardrailsConfig = RestrictedSyntaxConfig & {
	base: FlatConfig[];
	createAgentGuardrailsConfig(): FlatConfig[];
	createRestrictedSyntaxGroups(): RestrictedSyntaxGroup[];
};

type AppGuardrailsConfig = RestrictedSyntaxConfig & {
	base: FlatConfig[];
	createAppGuardrailsConfig(options?: AppGuardrailsOptions): FlatConfig[];
	createRestrictedSyntaxGroups(options?: AppGuardrailsOptions): RestrictedSyntaxGroup[];
};

type ReanimatedConfig = FlatConfig[] & {
	createReanimatedConfig(options?: ReanimatedOptions): FlatConfig[];
	createRestrictedSyntaxGroups(options?: ReanimatedOptions): RestrictedSyntaxGroup[];
	createSharedValueUsageConfig(): FlatConfig[];
	restrictedSyntaxGroups: RestrictedSyntaxGroup[];
	sharedValueUsageRule: Rule.RuleModule;
};

type SemanticColorsConfig = FlatConfig[] & {
	createSemanticColorsConfig(
		options?: SemanticColorsOptions,
	): FlatConfig[];
	createRestrictedSyntaxGroups(
		options?: SemanticColorsOptions,
	): RestrictedSyntaxGroup[];
	createAllowConfig(options?: SemanticColorsOptions): FlatConfig[];
	restrictedSyntaxGroups: RestrictedSyntaxGroup[];
};

type NativeUiRestriction = {
	name: string;
	importNames?: string[];
	message?: string;
};

type NativeUiOptions = {
	restrictions?: NativeUiRestriction[];
	additionalRestrictions?: NativeUiRestriction[];
	allowFiles?: string[];
};

type FeatureBoundaryOptions = {
	featureElementTypes?: string[];
	additionalFeatureElementTypes?: string[];
	sharedComponentPatterns?: string[];
	additionalSharedComponentPatterns?: string[];
};

type AppGuardrailsOptions = {
	queryHookPattern?: string;
};

type ComponentStructureOptions = {
	propsTypePattern?: string;
};

type DeprecatedApiRestrictedProperty = {
	object?: string;
	property?: string;
	message?: string;
};

type DeprecatedApiRestrictedType = {
	message?: string;
	fixWith?: string;
};

type DeprecatedApiOptions = {
	additionalRestrictedProperties?: DeprecatedApiRestrictedProperty[];
	additionalRestrictedTypes?: Record<
		string,
		string | DeprecatedApiRestrictedType
	>;
};

type ReanimatedOptions = {
	gestureHooks?: string[];
	additionalGestureHooks?: string[];
};

type SemanticColorsOptions = {
	tokenModule?: string;
	importName?: string;
	flagDirectAccess?: boolean;
	allowFiles?: string[];
};

type AgentOptions = {
	appGuardrails?: boolean | AppGuardrailsOptions;
	deprecatedApis?: boolean | DeprecatedApiOptions;
	reactCompiler?: boolean;
	reanimated?: boolean | ReanimatedOptions;
	semanticColors?: boolean | SemanticColorsOptions;
	worklets?: boolean;
};

type CreateConfigOptions = {
	preset?: 'base' | 'default';
	prettier?: boolean;
	testing?: boolean;
	typeChecked?: boolean;
	strict?: boolean;
	tsconfigProjects?: string[];
	extraIgnores?: string[];
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
};

type ReactCompilerConfig = FlatConfig[] & {
	rules: Record<string, Linter.RuleEntry>;
};

type NoPrettierConfig = FlatConfig[] & {
	strict: FlatConfig[];
	typed: FlatConfig[];
};

type TypedConfig = FlatConfig[] & {
	noPrettier: FlatConfig[];
};

declare const config: FlatConfig[] & {
	agent: FlatConfig[];
	agentGuardrails: AgentGuardrailsConfig;
	base: FlatConfig[];
	createConfig(options?: CreateConfigOptions): FlatConfig[];
	createAgentGuardrailsConfig(): FlatConfig[];
	strict: FlatConfig[];
	typed: TypedConfig;
	noPrettier: NoPrettierConfig;
	strictNoPrettier: FlatConfig[];
	typedNoPrettier: FlatConfig[];
	appGuardrails: AppGuardrailsConfig;
	createAppGuardrailsConfig(options?: AppGuardrailsOptions): FlatConfig[];
	componentStructure: FlatConfig[];
	createComponentStructureConfig(
		options?: ComponentStructureOptions,
	): FlatConfig[];
	deprecatedApis: FlatConfig[];
	createDeprecatedApiConfig(options?: DeprecatedApiOptions): FlatConfig[];
	createFeatureBoundaryConfig(options?: FeatureBoundaryOptions): FlatConfig[];
	createNativeUiConfig(options?: NativeUiOptions): FlatConfig[];
	featureBoundaries: FlatConfig[];
	nativeUi: FlatConfig[];
	reactCompiler: ReactCompilerConfig;
	reanimated: ReanimatedConfig;
	createReanimatedConfig(options?: ReanimatedOptions): FlatConfig[];
	semanticColors: SemanticColorsConfig;
	createSemanticColorsConfig(options?: SemanticColorsOptions): FlatConfig[];
	storybook: FlatConfig[];
	worklets: RestrictedSyntaxConfig;
};

declare namespace config {
	export {
		AgentGuardrailsConfig,
		AgentOptions,
		AppGuardrailsConfig,
		AppGuardrailsOptions,
		ComponentStructureOptions,
		CreateConfigOptions,
		DeprecatedApiOptions,
		DeprecatedApiRestrictedProperty,
		DeprecatedApiRestrictedType,
		FeatureBoundaryOptions,
		NativeUiOptions,
		NativeUiRestriction,
		ReactCompilerConfig,
		ReanimatedConfig,
		ReanimatedOptions,
		RestrictedSyntaxConfig,
		RestrictedSyntaxGroup,
		RestrictedSyntaxSelector,
		NoPrettierConfig,
		TypedConfig,
		SemanticColorsConfig,
		SemanticColorsOptions,
	};
}

export = config;
