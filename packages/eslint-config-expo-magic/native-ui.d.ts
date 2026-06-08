import type { Linter } from 'eslint';

export type NativeUiRestriction = {
	name: string;
	importNames?: string[];
	message?: string;
};

export type NativeUiOptions = {
	restrictions?: NativeUiRestriction[];
	additionalRestrictions?: NativeUiRestriction[];
	allowFiles?: string[];
};

export declare function createNativeUiConfig(
	options?: NativeUiOptions,
): Linter.Config[];

export declare const defaultRestrictions: NativeUiRestriction[];
export declare const recommended: Linter.Config[];
