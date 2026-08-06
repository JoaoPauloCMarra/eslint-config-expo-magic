import type { Linter } from 'eslint';
import type { NativeUiOptions, NativeUiRestriction } from './types';

export type { NativeUiOptions, NativeUiRestriction } from './types';

export declare function createNativeUiConfig(
	options?: NativeUiOptions,
): Linter.Config[];

export declare const defaultRestrictions: readonly NativeUiRestriction[];
export declare const recommended: Linter.Config[];
