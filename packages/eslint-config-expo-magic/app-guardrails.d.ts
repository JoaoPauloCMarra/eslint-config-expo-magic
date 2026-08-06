import type {
	AppGuardrailsConfig,
	AppGuardrailsOptions,
	RestrictedSyntaxGroup,
	RestrictedSyntaxSelector,
} from './types';

declare const appGuardrailsConfig: AppGuardrailsConfig;

declare namespace appGuardrailsConfig {
	export type AppGuardrailsOptions = import('./types').AppGuardrailsOptions;
	export type RestrictedSyntaxGroup = import('./types').RestrictedSyntaxGroup;
	export type RestrictedSyntaxSelector = import('./types').RestrictedSyntaxSelector;
}

export = appGuardrailsConfig;
