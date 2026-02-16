import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const config = require('./index.js');

export default config.strict;
