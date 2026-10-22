import type { MobileAppConfigOptions, OxlintConfig } from './types';

/** The opinionated mobile-app profile: `createMobileAppConfig()`. */
declare const config: OxlintConfig;
export default config;

export declare function createMobileAppConfig(
	options?: MobileAppConfigOptions,
): OxlintConfig;
