import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const config = require('./base.js');

export default config;
