import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const config = require('./prettier.js');

export default config;
export const arrowParens = config.arrowParens;
export const bracketSameLine = config.bracketSameLine;
export const bracketSpacing = config.bracketSpacing;
export const embeddedLanguageFormatting = config.embeddedLanguageFormatting;
export const endOfLine = config.endOfLine;
export const htmlWhitespaceSensitivity = config.htmlWhitespaceSensitivity;
export const insertPragma = config.insertPragma;
export const jsxSingleQuote = config.jsxSingleQuote;
export const overrides = config.overrides;
export const plugins = config.plugins;
export const printWidth = config.printWidth;
export const proseWrap = config.proseWrap;
export const quoteProps = config.quoteProps;
export const rangeEnd = config.rangeEnd;
export const rangeStart = config.rangeStart;
export const requirePragma = config.requirePragma;
export const semi = config.semi;
export const singleAttributePerLine = config.singleAttributePerLine;
export const singleQuote = config.singleQuote;
export const tabWidth = config.tabWidth;
export const trailingComma = config.trailingComma;
export const useTabs = config.useTabs;
