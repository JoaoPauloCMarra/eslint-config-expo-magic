import type { Linter } from 'eslint';

declare const reactCompilerConfig: Linter.Config[] & {
	rules: Record<string, Linter.RuleEntry>;
};

export = reactCompilerConfig;
