import type { Linter } from 'eslint';
import type {
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
	FlatConfig,
	GuardrailInput,
	GuardrailOptions,
	GuardrailResult,
	NativeUiOptions,
	NativeUiRestriction,
	PrGuardrailPreset,
	PrGuardrailPresets,
	ReactCompilerConfig,
	ReactCompilerRuleName,
	ReanimatedConfig,
	ReanimatedOptions,
	RestrictedSyntaxConfig,
	RestrictedSyntaxGroup,
	RestrictedSyntaxSelector,
	RiskyPattern,
	ResolvedGuardrailOptions,
	SemanticColorsConfig,
	SemanticColorsOptions,
	TypedConfig,
	NoPrettierConfig,
} from './types';

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
	export type AgentGuardrailsConfig = import('./types').AgentGuardrailsConfig;
	export type AgentOptions = import('./types').AgentOptions;
	export type AppGuardrailsConfig = import('./types').AppGuardrailsConfig;
	export type AppGuardrailsOptions = import('./types').AppGuardrailsOptions;
	export type ComponentStructureOptions = import('./types').ComponentStructureOptions;
	export type CreateConfigOptions = import('./types').CreateConfigOptions;
	export type DeprecatedApiOptions = import('./types').DeprecatedApiOptions;
	export type DeprecatedApiRestrictedProperty = import('./types').DeprecatedApiRestrictedProperty;
	export type DeprecatedApiRestrictedType = import('./types').DeprecatedApiRestrictedType;
	export type FeatureBoundaryOptions = import('./types').FeatureBoundaryOptions;
	export type FlatConfig = import('./types').FlatConfig;
	export type GuardrailInput = import('./types').GuardrailInput;
	export type GuardrailOptions = import('./types').GuardrailOptions;
	export type GuardrailResult = import('./types').GuardrailResult;
	export type NativeUiOptions = import('./types').NativeUiOptions;
	export type NativeUiRestriction = import('./types').NativeUiRestriction;
	export type PrGuardrailPreset = import('./types').PrGuardrailPreset;
	export type PrGuardrailPresets = import('./types').PrGuardrailPresets;
	export type ReactCompilerConfig = import('./types').ReactCompilerConfig;
	export type ReactCompilerRuleName = import('./types').ReactCompilerRuleName;
	export type ReanimatedConfig = import('./types').ReanimatedConfig;
	export type ReanimatedOptions = import('./types').ReanimatedOptions;
	export type RestrictedSyntaxConfig = import('./types').RestrictedSyntaxConfig;
	export type RestrictedSyntaxGroup = import('./types').RestrictedSyntaxGroup;
	export type RestrictedSyntaxSelector = import('./types').RestrictedSyntaxSelector;
	export type RiskyPattern = import('./types').RiskyPattern;
	export type ResolvedGuardrailOptions = import('./types').ResolvedGuardrailOptions;
	export type SemanticColorsConfig = import('./types').SemanticColorsConfig;
	export type SemanticColorsOptions = import('./types').SemanticColorsOptions;
	export type NoPrettierConfig = import('./types').NoPrettierConfig;
	export type TypedConfig = import('./types').TypedConfig;
}

export = config;
