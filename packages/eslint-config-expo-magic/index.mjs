import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const config = require('./index.js');

export default config;
export const agent = config.agent;
export const agentGuardrails = config.agentGuardrails;
export const base = config.base;
export const createConfig = config.createConfig;
export const createAgentGuardrailsConfig = config.createAgentGuardrailsConfig;
export const createAppGuardrailsConfig = config.createAppGuardrailsConfig;
export const componentStructure = config.componentStructure;
export const createComponentStructureConfig =
	config.createComponentStructureConfig;
export const deprecatedApis = config.deprecatedApis;
export const createDeprecatedApiConfig = config.createDeprecatedApiConfig;
export const strict = config.strict;
export const typed = config.typed;
export const noPrettier = config.noPrettier;
export const strictNoPrettier = config.strictNoPrettier;
export const typedNoPrettier = config.typedNoPrettier;
export const appGuardrails = config.appGuardrails;
export const createFeatureBoundaryConfig = config.createFeatureBoundaryConfig;
export const createNativeUiConfig = config.createNativeUiConfig;
export const featureBoundaries = config.featureBoundaries;
export const nativeUi = config.nativeUi;
export const reactCompiler = config.reactCompiler;
export const reanimated = config.reanimated;
export const createReanimatedConfig = config.createReanimatedConfig;
export const semanticColors = config.semanticColors;
export const createSemanticColorsConfig = config.createSemanticColorsConfig;
export const storybook = config.storybook;
export const worklets = config.worklets;
