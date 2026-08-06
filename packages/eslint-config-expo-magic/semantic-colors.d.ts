import type {
	RestrictedSyntaxGroup,
	RestrictedSyntaxSelector,
	SemanticColorsConfig,
	SemanticColorsOptions,
} from './types';

declare const semanticColorsConfig: SemanticColorsConfig;

declare namespace semanticColorsConfig {
	export type RestrictedSyntaxGroup = import('./types').RestrictedSyntaxGroup;
	export type RestrictedSyntaxSelector = import('./types').RestrictedSyntaxSelector;
	export type SemanticColorsOptions = import('./types').SemanticColorsOptions;
}

export = semanticColorsConfig;
