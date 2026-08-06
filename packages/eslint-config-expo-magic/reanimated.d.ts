import type {
	ReanimatedConfig,
	ReanimatedOptions,
	RestrictedSyntaxGroup,
	RestrictedSyntaxSelector,
} from './types';

declare const reanimatedConfig: ReanimatedConfig;

declare namespace reanimatedConfig {
	export type ReanimatedOptions = import('./types').ReanimatedOptions;
	export type RestrictedSyntaxGroup = import('./types').RestrictedSyntaxGroup;
	export type RestrictedSyntaxSelector = import('./types').RestrictedSyntaxSelector;
}

export = reanimatedConfig;
