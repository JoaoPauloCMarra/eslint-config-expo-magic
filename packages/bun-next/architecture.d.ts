import type {
	ArchitectureLayers,
	ArchitectureOptions,
	OxlintConfig,
} from './types';

export declare const DEFAULT_LAYERS: Readonly<ArchitectureLayers>;

export declare function createArchitectureConfig(
	options?: ArchitectureOptions,
): OxlintConfig;
