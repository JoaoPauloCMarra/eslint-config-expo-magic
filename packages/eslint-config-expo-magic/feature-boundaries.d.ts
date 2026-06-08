import type { Linter } from 'eslint';

export type FeatureBoundaryOptions = {
	featureElementTypes?: string[];
	sharedComponentPatterns?: string[];
};

export declare function createFeatureBoundaryConfig(
	options?: FeatureBoundaryOptions,
): Linter.Config[];

export declare const defaultFeatureElementTypes: string[];
export declare const recommended: Linter.Config[];
