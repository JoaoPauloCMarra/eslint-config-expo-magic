import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const featureBoundaries = require('./feature-boundaries.js');

export default featureBoundaries;
export const createFeatureBoundaryConfig =
	featureBoundaries.createFeatureBoundaryConfig;
export const defaultFeatureElementTypes =
	featureBoundaries.defaultFeatureElementTypes;
export const recommended = featureBoundaries.recommended;
