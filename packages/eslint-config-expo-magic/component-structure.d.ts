import type { ESLint, Linter } from 'eslint';

type ComponentStructureOptions = {
	propsTypePattern?: string;
};

declare const componentStructureConfig: Linter.Config[] & {
	createComponentStructureConfig(
		options?: ComponentStructureOptions,
	): Linter.Config[];
	plugin: ESLint.Plugin;
	recommended: Linter.Config[];
};

declare namespace componentStructureConfig {
	export { ComponentStructureOptions };
}

export = componentStructureConfig;
