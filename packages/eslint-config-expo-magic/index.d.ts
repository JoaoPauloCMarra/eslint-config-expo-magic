import type { Linter } from 'eslint';

type FlatConfig = Linter.Config;

declare const config: FlatConfig[] & {
	base: FlatConfig[];
	createConfig(options?: {
		preset?: 'base' | 'default';
		prettier?: boolean;
		testing?: boolean;
		typeChecked?: boolean;
		strict?: boolean;
		tsconfigProjects?: string[];
	}): FlatConfig[];
	strict: FlatConfig[];
	typed: FlatConfig[];
	noPrettier: FlatConfig[];
	strictNoPrettier: FlatConfig[];
	typedNoPrettier: FlatConfig[];
};

export = config;
