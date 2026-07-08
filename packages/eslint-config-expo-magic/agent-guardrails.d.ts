import type { Linter } from 'eslint';

type RestrictedSyntaxSelector = {
	selector: string;
	message?: string;
};

type RestrictedSyntaxGroup = {
	files: string[];
	selectors: RestrictedSyntaxSelector[];
};

declare const agentGuardrails: Linter.Config[] & {
	createAgentGuardrailsConfig(): Linter.Config[];
	createRestrictedSyntaxGroups(): RestrictedSyntaxGroup[];
	restrictedSyntaxGroups: RestrictedSyntaxGroup[];
};

declare namespace agentGuardrails {
	export { RestrictedSyntaxGroup, RestrictedSyntaxSelector };
}

export = agentGuardrails;
