import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const config = require('./index.js');

export default config;
export const base = config.base;
export const createConfig = config.createConfig;
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
export const storybook = config.storybook;
export const worklets = config.worklets;
