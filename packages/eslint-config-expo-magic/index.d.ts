import type {
	ArchitectureOptions,
	CreateConfigOptions,
	MobileAppConfigOptions,
	OxlintConfig,
} from './types';

export type * from './types';

/** The default preset: `createConfig()`. */
declare const config: OxlintConfig;
export default config;

export declare function createConfig(
	options?: CreateConfigOptions,
): OxlintConfig;

export declare function createMobileAppConfig(
	options?: MobileAppConfigOptions,
): OxlintConfig;

export declare function createArchitectureConfig(
	options?: ArchitectureOptions,
): OxlintConfig;
