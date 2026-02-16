import type { Linter } from 'eslint';

type FlatConfig = Linter.Config;

declare const config: FlatConfig[] & {
	strict: FlatConfig[];
};

export = config;
