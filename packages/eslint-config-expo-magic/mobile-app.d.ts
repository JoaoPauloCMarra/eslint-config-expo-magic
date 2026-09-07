import type { Linter } from 'eslint';

type MobileAppConfigOptions = Readonly<{
	preset?: 'default' | 'fast';
	tsconfigProjects?: readonly string[];
	extraIgnores?: readonly string[];
}>;

type MobileAppRestrictedImport = Readonly<{
	name: string;
	importNames?: readonly string[];
	message?: string;
}>;

type MobileAppRestrictedImportPattern = Readonly<{
	group: readonly string[];
	message?: string;
}>;

type MobileAppRestrictedImportsOptions = Readonly<{
	files: readonly string[];
	ignores?: readonly string[];
	additionalPaths?: readonly MobileAppRestrictedImport[];
	additionalPatterns?: readonly MobileAppRestrictedImportPattern[];
}>;

declare function createMobileAppConfig(
	options?: MobileAppConfigOptions,
): Linter.Config[];

declare function createMobileAppRestrictedImportsConfig(
	options: MobileAppRestrictedImportsOptions,
): Linter.Config[];

declare const config: Linter.Config[] & {
	createMobileAppConfig: typeof createMobileAppConfig;
	createMobileAppRestrictedImportsConfig: typeof createMobileAppRestrictedImportsConfig;
};

declare namespace config {
	export type ConfigOptions = MobileAppConfigOptions;
	export type RestrictedImport = MobileAppRestrictedImport;
	export type RestrictedImportPattern = MobileAppRestrictedImportPattern;
	export type RestrictedImportsOptions = MobileAppRestrictedImportsOptions;
}

export = config;
