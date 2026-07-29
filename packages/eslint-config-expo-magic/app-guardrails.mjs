import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const config = require('./app-guardrails.js');

export default config;
export const base = config.base;
export const createAppGuardrailsConfig = config.createAppGuardrailsConfig;
export const createRestrictedSyntaxGroups = config.createRestrictedSyntaxGroups;
export const restrictedSyntaxGroups = config.restrictedSyntaxGroups;
