import type {
	AgentGuardrailsConfig,
	RestrictedSyntaxGroup,
	RestrictedSyntaxSelector,
} from './types';

declare const agentGuardrails: AgentGuardrailsConfig;

declare namespace agentGuardrails {
	export type RestrictedSyntaxGroup = import('./types').RestrictedSyntaxGroup;
	export type RestrictedSyntaxSelector = import('./types').RestrictedSyntaxSelector;
}

export = agentGuardrails;
