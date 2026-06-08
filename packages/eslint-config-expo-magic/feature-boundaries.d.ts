import type { Linter } from 'eslint';

export type FeatureBoundaryOptions = {
	featureElementTypes?: string[];
	additionalFeatureElementTypes?: string[];
	sharedComponentPatterns?: string[];
	additionalSharedComponentPatterns?: string[];
};

export declare function createFeatureBoundaryConfig(
	options?: FeatureBoundaryOptions,
): Linter.Config[];

export declare const defaultFeatureElementTypes: string[];
export declare const recommended: Linter.Config[];
