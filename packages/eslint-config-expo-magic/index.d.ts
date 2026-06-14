import type { Linter } from 'eslint';

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

type AppGuardrailsConfig = RestrictedSyntaxConfig & {
	base: FlatConfig[];
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

type CreateConfigOptions = {
	preset?: 'base' | 'default';
	prettier?: boolean;
	testing?: boolean;
	typeChecked?: boolean;
	strict?: boolean;
	tsconfigProjects?: string[];
	extraIgnores?: string[];
	appGuardrails?: boolean | AppGuardrailsOptions;
	componentStructure?: boolean | ComponentStructureOptions;
	deprecatedApis?: boolean | DeprecatedApiOptions;
	featureBoundaries?: boolean | FeatureBoundaryOptions;
	inlineStyles?: boolean | Linter.RuleLevel;
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

declare const config: FlatConfig[] & {
	base: FlatConfig[];
	createConfig(options?: CreateConfigOptions): FlatConfig[];
	strict: FlatConfig[];
	typed: FlatConfig[];
	noPrettier: FlatConfig[];
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
	reanimated: FlatConfig[];
	createReanimatedConfig(options?: ReanimatedOptions): FlatConfig[];
	semanticColors: FlatConfig[];
	createSemanticColorsConfig(options?: SemanticColorsOptions): FlatConfig[];
	storybook: FlatConfig[];
	worklets: RestrictedSyntaxConfig;
};

declare namespace config {
	export {
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
		ReanimatedOptions,
		RestrictedSyntaxConfig,
		RestrictedSyntaxGroup,
		RestrictedSyntaxSelector,
		SemanticColorsOptions,
	};
}

export = config;
