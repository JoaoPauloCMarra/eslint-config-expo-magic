import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const architecture = require('./architecture.js');

export default architecture;
export const createArchitectureConfig = architecture.createArchitectureConfig;
export const DEFAULT_LAYERS = architecture.DEFAULT_LAYERS;
