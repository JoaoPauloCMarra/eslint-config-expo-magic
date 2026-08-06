import type { Linter } from 'eslint';
import type { FeatureBoundaryOptions } from './types';

export type { FeatureBoundaryOptions } from './types';

export declare function createFeatureBoundaryConfig(
	options?: FeatureBoundaryOptions,
): Linter.Config[];

export declare const defaultFeatureElementTypes: readonly string[];
export declare const recommended: Linter.Config[];
