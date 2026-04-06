import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const config = require('./index.js');

export default config;
export const base = config.base;
export const createConfig = config.createConfig;
export const strict = config.strict;
export const typed = config.typed;
export const noPrettier = config.noPrettier;
export const strictNoPrettier = config.strictNoPrettier;
export const typedNoPrettier = config.typedNoPrettier;
