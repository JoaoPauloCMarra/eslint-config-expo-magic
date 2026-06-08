import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const config = require('./react-compiler.js');

export default config;
