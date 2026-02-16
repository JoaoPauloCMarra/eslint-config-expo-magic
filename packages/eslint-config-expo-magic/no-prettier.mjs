import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const config = require('./index.js');

const noPrettier = config.noPrettier;

export default noPrettier;
export const strict = config.strictNoPrettier;
