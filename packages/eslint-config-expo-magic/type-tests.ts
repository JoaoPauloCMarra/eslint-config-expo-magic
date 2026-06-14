import type { Linter } from 'eslint';

type Magic = typeof import('./index');
type Opts = import('./index').CreateConfigOptions;

declare const magic: Magic;

const options: Opts = {
	preset: 'base',
	prettier: false,
	appGuardrails: { queryHookPattern: '^useFetch[A-Z]' },
	componentStructure: { propsTypePattern: 'Props$' },
	deprecatedApis: true,
	inlineStyles: 'warn',
	reanimated: { additionalGestureHooks: ['useFlingGesture'] },
	semanticColors: { tokenModule: 'theme/palette', importName: 'palette' },
};

const baseResult: Linter.Config[] = magic.createConfig(options);
const reResult: Linter.Config[] = magic.createReanimatedConfig({
	gestureHooks: ['useX'],
});
const compilerRules: Record<string, Linter.RuleEntry> =
	magic.reactCompiler.rules;
void baseResult;
void reResult;
void compilerRules;

type ReanimatedModule = typeof import('./reanimated');
type DeprecatedModule = typeof import('./deprecated-apis');
type StructureModule = typeof import('./component-structure');
type ColorsModule = typeof import('./semantic-colors');

declare const reanimated: ReanimatedModule;
declare const deprecated: DeprecatedModule;
declare const structure: StructureModule;
declare const colors: ColorsModule;

const reanimatedResult: Linter.Config[] = reanimated.createReanimatedConfig();
const deprecatedResult: Linter.Config[] =
	deprecated.createDeprecatedApiConfig();
const structureResult: Linter.Config[] =
	structure.createComponentStructureConfig();
const colorsResult: Linter.Config[] = colors.createSemanticColorsConfig();
void reanimatedResult;
void deprecatedResult;
void structureResult;
void colorsResult;

// @ts-expect-error preset only accepts 'base' | 'default'
const badPreset: Opts = { preset: 'ultra' };
// @ts-expect-error unknown option keys are rejected
const badKey: Opts = { unknownOption: true };
// @ts-expect-error gestureHooks must be a string array
const badReanimated: Opts = { reanimated: { gestureHooks: [1] } };
void badPreset;
void badKey;
void badReanimated;
