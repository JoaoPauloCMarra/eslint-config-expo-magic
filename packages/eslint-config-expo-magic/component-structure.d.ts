import type {
	ComponentStructureModule,
	ComponentStructureOptions,
} from './types';

declare const componentStructureConfig: ComponentStructureModule;

declare namespace componentStructureConfig {
	export type ComponentStructureOptions = import('./types').ComponentStructureOptions;
}

export = componentStructureConfig;
