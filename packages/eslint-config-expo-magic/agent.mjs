import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const agent = require('./agent.js');

export default agent;
