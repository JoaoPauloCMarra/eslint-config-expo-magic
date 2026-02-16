import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const config = require('./index.js');

export default config;
export const strict = config.strict;
export const noPrettier = config.noPrettier;
export const strictNoPrettier = config.strictNoPrettier;
