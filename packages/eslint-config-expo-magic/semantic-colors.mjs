import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const semanticColors = require('./semantic-colors.js');

export default semanticColors;
export const createSemanticColorsConfig =
	semanticColors.createSemanticColorsConfig;
export const createRestrictedSyntaxGroups =
	semanticColors.createRestrictedSyntaxGroups;
export const createAllowConfig = semanticColors.createAllowConfig;
export const restrictedSyntaxGroups = semanticColors.restrictedSyntaxGroups;
