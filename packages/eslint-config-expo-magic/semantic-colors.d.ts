import type { Linter } from 'eslint';

type RestrictedSyntaxSelector = {
	selector: string;
	message?: string;
};

type RestrictedSyntaxGroup = {
	files: string[];
	selectors: RestrictedSyntaxSelector[];
};

type SemanticColorsOptions = {
	tokenModule?: string;
	importName?: string;
	flagDirectAccess?: boolean;
	allowFiles?: string[];
};

declare const semanticColorsConfig: Linter.Config[] & {
	createSemanticColorsConfig(options?: SemanticColorsOptions): Linter.Config[];
	createRestrictedSyntaxGroups(
		options?: SemanticColorsOptions,
	): RestrictedSyntaxGroup[];
	createAllowConfig(options?: SemanticColorsOptions): Linter.Config[];
	restrictedSyntaxGroups: RestrictedSyntaxGroup[];
};

declare namespace semanticColorsConfig {
	export {
		RestrictedSyntaxGroup,
		RestrictedSyntaxSelector,
		SemanticColorsOptions,
	};
}

export = semanticColorsConfig;
