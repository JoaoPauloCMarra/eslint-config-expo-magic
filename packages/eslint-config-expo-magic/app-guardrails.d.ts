import type { Linter } from 'eslint';

type RestrictedSyntaxSelector = {
	selector: string;
	message?: string;
};

type RestrictedSyntaxGroup = {
	files: string[];
	selectors: RestrictedSyntaxSelector[];
};

type AppGuardrailsOptions = {
	queryHookPattern?: string;
};

declare const appGuardrailsConfig: Linter.Config[] & {
	base: Linter.Config[];
	createAppGuardrailsConfig(options?: AppGuardrailsOptions): Linter.Config[];
	createRestrictedSyntaxGroups(
		options?: AppGuardrailsOptions,
	): RestrictedSyntaxGroup[];
	restrictedSyntaxGroups: RestrictedSyntaxGroup[];
};

declare namespace appGuardrailsConfig {
	export {
		AppGuardrailsOptions,
		RestrictedSyntaxGroup,
		RestrictedSyntaxSelector,
	};
}

export = appGuardrailsConfig;
