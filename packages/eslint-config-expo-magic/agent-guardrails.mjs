import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const agentGuardrails = require('./agent-guardrails.js');

export default agentGuardrails;
export const createAgentGuardrailsConfig =
	agentGuardrails.createAgentGuardrailsConfig;
export const createRestrictedSyntaxGroups =
	agentGuardrails.createRestrictedSyntaxGroups;
export const restrictedSyntaxGroups = agentGuardrails.restrictedSyntaxGroups;
