import type { Linter } from 'eslint';

type RestrictedSyntaxSelector = {
	selector: string;
	message?: string;
};

type RestrictedSyntaxGroup = {
	files: string[];
	selectors: RestrictedSyntaxSelector[];
};

type ReanimatedOptions = {
	gestureHooks?: string[];
	additionalGestureHooks?: string[];
};

declare const reanimatedConfig: Linter.Config[] & {
	createReanimatedConfig(options?: ReanimatedOptions): Linter.Config[];
	createRestrictedSyntaxGroups(
		options?: ReanimatedOptions,
	): RestrictedSyntaxGroup[];
	restrictedSyntaxGroups: RestrictedSyntaxGroup[];
};

declare namespace reanimatedConfig {
	export { ReanimatedOptions, RestrictedSyntaxGroup, RestrictedSyntaxSelector };
}

export = reanimatedConfig;
