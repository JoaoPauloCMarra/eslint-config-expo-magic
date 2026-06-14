import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const componentStructure = require('./component-structure.js');

export default componentStructure;
export const createComponentStructureConfig =
	componentStructure.createComponentStructureConfig;
export const plugin = componentStructure.plugin;
export const recommended = componentStructure.recommended;
