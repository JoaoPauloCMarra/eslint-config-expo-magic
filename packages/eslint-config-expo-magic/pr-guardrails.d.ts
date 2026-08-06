import type {
	GuardrailInput,
	GuardrailOptions,
	GuardrailResult,
	PrGuardrailsConfig,
	RiskyPattern,
	ResolvedGuardrailOptions,
} from './types';

declare const prGuardrails: PrGuardrailsConfig;

declare namespace prGuardrails {
	export type GuardrailInput = import('./types').GuardrailInput;
	export type GuardrailResult = import('./types').GuardrailResult;
	export type RiskyPattern = import('./types').RiskyPattern;
	export type ResolvedGuardrailOptions = import('./types').ResolvedGuardrailOptions;
	export type GuardrailOptions = import('./types').GuardrailOptions;
}

export = prGuardrails;
