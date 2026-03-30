import type { Linter } from 'eslint';

type FlatConfig = Linter.Config;

declare const config: FlatConfig[] & {
	noPrettier: FlatConfig[];
};

export = config;
