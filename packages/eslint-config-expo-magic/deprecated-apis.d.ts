import type { Linter } from 'eslint';

type DeprecatedApiRestrictedProperty = {
	object?: string;
	property?: string;
	message?: string;
};

type DeprecatedApiRestrictedType = {
	message?: string;
	fixWith?: string;
};

type DeprecatedApiOptions = {
	additionalRestrictedProperties?: DeprecatedApiRestrictedProperty[];
	additionalRestrictedTypes?: Record<
		string,
		string | DeprecatedApiRestrictedType
	>;
};

declare const deprecatedApisConfig: Linter.Config[] & {
	createDeprecatedApiConfig(options?: DeprecatedApiOptions): Linter.Config[];
	defaultRestrictedProperties: DeprecatedApiRestrictedProperty[];
	defaultRestrictedTypes: Record<string, DeprecatedApiRestrictedType>;
	recommended: Linter.Config[];
};

declare namespace deprecatedApisConfig {
	export {
		DeprecatedApiOptions,
		DeprecatedApiRestrictedProperty,
		DeprecatedApiRestrictedType,
	};
}

export = deprecatedApisConfig;
