import type { Linter } from 'eslint';

type RestrictedSyntaxSelector = {
	selector: string;
	message?: string;
};

type RestrictedSyntaxGroup = {
	files: string[];
	selectors: RestrictedSyntaxSelector[];
};

declare const workletsConfig: Linter.Config[] & {
	restrictedSyntaxGroups: RestrictedSyntaxGroup[];
};

export = workletsConfig;
