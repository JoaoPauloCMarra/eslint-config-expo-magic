import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const reanimated = require('./reanimated.js');

export default reanimated;
export const createReanimatedConfig = reanimated.createReanimatedConfig;
export const createRestrictedSyntaxGroups =
	reanimated.createRestrictedSyntaxGroups;
export const restrictedSyntaxGroups = reanimated.restrictedSyntaxGroups;
