import type { Linter } from 'eslint';
import type {
	DeprecatedApiOptions,
	DeprecatedApiRestrictedProperty,
	DeprecatedApiRestrictedType,
} from './types';

declare const deprecatedApisConfig: Linter.Config[] & {
	createDeprecatedApiConfig(options?: DeprecatedApiOptions): Linter.Config[];
	defaultRestrictedProperties: readonly DeprecatedApiRestrictedProperty[];
	defaultRestrictedTypes: Readonly<Record<string, DeprecatedApiRestrictedType>>;
	recommended: Linter.Config[];
};

declare namespace deprecatedApisConfig {
	export type DeprecatedApiOptions = import('./types').DeprecatedApiOptions;
	export type DeprecatedApiRestrictedProperty = import('./types').DeprecatedApiRestrictedProperty;
	export type DeprecatedApiRestrictedType = import('./types').DeprecatedApiRestrictedType;
}

export = deprecatedApisConfig;
