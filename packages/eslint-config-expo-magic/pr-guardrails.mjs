import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const guardrails = require('./pr-guardrails.js');

export default guardrails;
export const countChangedLines = guardrails.countChangedLines;
export const createPrGuardrailOptions = guardrails.createPrGuardrailOptions;
export const defaultOptions = guardrails.defaultOptions;
export const hasCheckedCheckbox = guardrails.hasCheckedCheckbox;
export const hasRelatedTestOrStory = guardrails.hasRelatedTestOrStory;
export const mentionsRuntimeTarget = guardrails.mentionsRuntimeTarget;
export const readPullRequestInputFromEnv = guardrails.readPullRequestInputFromEnv;
export const runCli = guardrails.runCli;
export const validateGuardrails = guardrails.validateGuardrails;
