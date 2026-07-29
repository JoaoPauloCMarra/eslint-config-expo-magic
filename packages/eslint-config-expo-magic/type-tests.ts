import type { Linter } from 'eslint';
import indexDefault from './index';
import {
	agent,
	appGuardrails,
	createAppGuardrailsConfig,
	createConfig,
	createNativeUiConfig,
	createReanimatedConfig,
	noPrettier,
	reanimated,
	strict,
	typed,
} from './index';
import type {
	AppGuardrailsConfig,
	AppGuardrailsOptions,
	CreateConfigOptions,
	NativeUiOptions,
} from './index';
import type { NativeUiRestriction } from './native-ui';
import type { ReanimatedOptions } from './reanimated';

type ReanimatedModule = typeof import('./reanimated');
type DeprecatedModule = typeof import('./deprecated-apis');
type StructureModule = typeof import('./component-structure');
type ColorsModule = typeof import('./semantic-colors');
type NativeUiModule = typeof import('./native-ui');

type Magic = typeof import('./index');
type Opts = CreateConfigOptions;

declare const magic: Magic;
declare const reanimatedModule: ReanimatedModule;
declare const deprecated: DeprecatedModule;
declare const structure: StructureModule;
declare const colors: ColorsModule;
declare const nativeUiModule: NativeUiModule;
declare const typedModule: typeof import('./typed');
declare const noPrettierModule: typeof import('./no-prettier');
declare const strictModule: typeof import('./strict');

const defaultImport = indexDefault;
const strictSubpath = strict;
const noPrettierSubpath = noPrettier;
const typedSubpath = typed;

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
const reanimatedResult: Linter.Config[] = reanimatedModule.createReanimatedConfig();
const deprecatedResult: Linter.Config[] = deprecated.createDeprecatedApiConfig();
const structureResult: Linter.Config[] = structure.createComponentStructureConfig();
const colorsResult: Linter.Config[] = colors.createSemanticColorsConfig();
const nativeUiResult: Linter.Config[] = nativeUiModule.createNativeUiConfig();

const guardrailsCreateResult: Linter.Config[] =
	magic.appGuardrails.createAppGuardrailsConfig({
		queryHookPattern: '^useFetch[A-Z]',
	});
const guardrailsSyntaxGroups = magic.appGuardrails.createRestrictedSyntaxGroups();
const rootAgentGuardrailsResult: Linter.Config[] =
	magic.agentGuardrails.createAgentGuardrailsConfig();
const rootAgentGuardrailsGroups = magic.agentGuardrails.createRestrictedSyntaxGroups();
const rootReanimatedResult: Linter.Config[] =
	magic.reanimated.createReanimatedConfig({ gestureHooks: ['useX'] });
const rootReanimatedGroups = magic.reanimated.createRestrictedSyntaxGroups();
const rootSemanticColorsResult: Linter.Config[] =
	magic.semanticColors.createSemanticColorsConfig({
		tokenModule: 'uikit/tokens/colors',
	});
const rootSemanticColorsGroups = magic.semanticColors.createRestrictedSyntaxGroups();

const strictFromMagic = magic.strict;
const typedFromMagic = magic.typed;
const noPrettierFromMagic = magic.noPrettier;

const createConfigWithDefaults = createConfig({ preset: 'default' });
const createAppGuardrailsWithDefaults = createAppGuardrailsConfig({
	queryHookPattern: '^useGet',
});
const createNativeUiWithDefaults = createNativeUiConfig({ restrictions: [] });
const createReanimatedWithDefaults = createReanimatedConfig({
	additionalGestureHooks: ['useX'],
});

const strictResult: Linter.Config[] = strictModule;
const typedModuleResult: typeof typedModule = typedModule;
const noPrettierResult: Linter.Config[] = noPrettierModule;
const noPrettierStrictResult: Linter.Config[] = noPrettierModule.strict;
const noPrettierTypedResult: Linter.Config[] = noPrettierModule.typed;
const typedNoPrettierFromMagic = typedFromMagic.noPrettier;
const strictNoPrettierFromMagic = noPrettierFromMagic.strict;

const appGuardrailsFromMagic: AppGuardrailsConfig = appGuardrails;
const appGuardrailsOptions: AppGuardrailsOptions = {
	queryHookPattern: '^useGet',
};
const nativeUiOptions: NativeUiOptions = {
	additionalRestrictions: [{ name: 'react-native' }],
};
const reanimatedOptions: ReanimatedOptions = {
	gestureHooks: ['usePan'],
};
const restriction: NativeUiRestriction = {
	name: 'react-native',
	importNames: ['View'],
};

void defaultImport;
void strictSubpath;
void noPrettierSubpath;
void typedSubpath;
void noPrettier;
void strict;
void typed;
void reanimated;
void agent;
void appGuardrails;
void appGuardrailsFromMagic;
void createConfigWithDefaults;
void createAppGuardrailsWithDefaults;
void createNativeUiWithDefaults;
void createReanimatedWithDefaults;
void baseResult;
void reanimatedResult;
void deprecatedResult;
void structureResult;
void colorsResult;
void nativeUiResult;
void guardrailsCreateResult;
void guardrailsSyntaxGroups;
void rootAgentGuardrailsResult;
void rootAgentGuardrailsGroups;
void rootReanimatedResult;
void rootReanimatedGroups;
void rootSemanticColorsResult;
void rootSemanticColorsGroups;
void strictResult;
void strictFromMagic;
void typedFromMagic;
void noPrettierFromMagic;
void noPrettierResult;
void noPrettierStrictResult;
void noPrettierTypedResult;
void typedModuleResult;
void typedNoPrettierFromMagic;
void strictNoPrettierFromMagic;
void appGuardrailsOptions;
void nativeUiOptions;
void reanimatedOptions;
void restriction;

// @ts-expect-error preset only accepts 'base' | 'default'
const badPreset: Opts = { preset: 'ultra' };
// @ts-expect-error unknown option keys are rejected
const badKey: Opts = { unknownOption: true };
// @ts-expect-error inlineStyles accepts only boolean or valid RuleSeverity
const badSeverity: Opts = { inlineStyles: 999 };
// @ts-expect-error gestureHooks must be a string array
const badReanimated: Opts = { reanimated: { gestureHooks: [1] } };
// @ts-expect-error appGuardrails options require matching shape
const badAppGuardrailsQuery: Opts = { appGuardrails: { queryHookPattern: 123 } };
// @ts-expect-error additionalRestrictions expects NativeUiRestriction[]
const badNativeUi = createNativeUiConfig('not-a-restriction');
// @ts-expect-error createReanimatedConfig rejects invalid gesture hook entries
const badReanimatedFactory = magic.createReanimatedConfig('useX');
// @ts-expect-error createConfig rejects non-boolean strict option
const badCreateConfigCall = createConfig({ strict: 'no' });

void badPreset;
void badKey;
void badSeverity;
void badReanimated;
void badAppGuardrailsQuery;
void badNativeUi;
void badReanimatedFactory;
void badCreateConfigCall;
