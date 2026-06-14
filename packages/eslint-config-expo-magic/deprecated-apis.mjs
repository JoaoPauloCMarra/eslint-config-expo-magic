import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const deprecatedApis = require('./deprecated-apis.js');

export default deprecatedApis;
export const createDeprecatedApiConfig =
	deprecatedApis.createDeprecatedApiConfig;
export const defaultRestrictedProperties =
	deprecatedApis.defaultRestrictedProperties;
export const defaultRestrictedTypes = deprecatedApis.defaultRestrictedTypes;
export const recommended = deprecatedApis.recommended;
