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
	allowFiles?: string[];
};

type FeatureBoundaryOptions = {
	featureElementTypes?: string[];
	sharedComponentPatterns?: string[];
};

declare const config: FlatConfig[] & {
	base: FlatConfig[];
	createConfig(options?: {
		preset?: 'base' | 'default';
		prettier?: boolean;
		testing?: boolean;
		typeChecked?: boolean;
		strict?: boolean;
		tsconfigProjects?: string[];
		extraIgnores?: string[];
		appGuardrails?: boolean;
		featureBoundaries?: boolean | FeatureBoundaryOptions;
		nativeUi?: boolean | NativeUiOptions;
		reactCompiler?: boolean;
		storybook?: boolean;
		worklets?: boolean;
	}): FlatConfig[];
	strict: FlatConfig[];
	typed: FlatConfig[];
	noPrettier: FlatConfig[];
	strictNoPrettier: FlatConfig[];
	typedNoPrettier: FlatConfig[];
	appGuardrails: AppGuardrailsConfig;
	createFeatureBoundaryConfig(options?: FeatureBoundaryOptions): FlatConfig[];
	createNativeUiConfig(options?: NativeUiOptions): FlatConfig[];
	featureBoundaries: FlatConfig[];
	nativeUi: FlatConfig[];
	reactCompiler: RestrictedSyntaxConfig;
	storybook: FlatConfig[];
	worklets: RestrictedSyntaxConfig;
};

export = config;
