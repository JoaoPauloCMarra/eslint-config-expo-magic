import type { Linter } from 'eslint';

type FlatConfig = Linter.Config;

declare const config: FlatConfig[] & {
	strict: FlatConfig[];
	noPrettier: FlatConfig[];
	strictNoPrettier: FlatConfig[];
};

export = config;
