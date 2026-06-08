import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const config = require('./storybook.js');

export default config;
