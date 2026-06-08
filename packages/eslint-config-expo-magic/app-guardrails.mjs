import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const config = require('./app-guardrails.js');

export default config;
