const agentGuardrailsConfig = require('./utils/agent-guardrails.js');
const appGuardrailsConfig = require('./utils/app-guardrails.js');
const componentStructureConfig = require('./utils/component-structure.js');
const deprecatedApisConfig = require('./utils/deprecated-apis.js');
const featureBoundaryConfig = require('./utils/feature-boundaries.js');
const nativeUiConfig = require('./utils/native-ui.js');
const reactCompilerConfig = require('./utils/react-compiler.js');
const reanimatedConfig = require('./utils/reanimated.js');
const semanticColorsConfig = require('./utils/semantic-colors.js');
const storybookConfig = require('./utils/storybook.js');
const workletsConfig = require('./utils/worklets.js');
const { createConfig } = require('./utils/create-config.js');
const config = createConfig();

function defineLazyPreset(name, factory) {
	Object.defineProperty(config, name, {
		configurable: true,
		enumerable: true,
		get() {
			const value = factory();
			Object.defineProperty(config, name, {
				configurable: false,
				enumerable: true,
				value,
				writable: false,
			});
			return value;
		},
	});
}

defineLazyPreset('agent', () => createConfig({ agent: true, prettier: false }));
defineLazyPreset('base', () => require('./base.js'));
defineLazyPreset('fast', () => require('./fast.js'));
defineLazyPreset('strict', () => createConfig({ strict: true }));
defineLazyPreset('strictNoPrettier', () =>
	createConfig({ strict: true, prettier: false }),
);
defineLazyPreset('typed', () => createConfig({ typeChecked: true }));
defineLazyPreset('typedNoPrettier', () =>
	createConfig({ typeChecked: true, prettier: false }),
);
defineLazyPreset('noPrettier', () => createConfig({ prettier: false }));

module.exports = config;
module.exports.agentGuardrails = agentGuardrailsConfig;
module.exports.createConfig = createConfig;
module.exports.createAgentGuardrailsConfig =
	agentGuardrailsConfig.createAgentGuardrailsConfig;
module.exports.appGuardrails = appGuardrailsConfig;
module.exports.createAppGuardrailsConfig =
	appGuardrailsConfig.createAppGuardrailsConfig;
module.exports.componentStructure = componentStructureConfig.recommended;
module.exports.createComponentStructureConfig =
	componentStructureConfig.createComponentStructureConfig;
module.exports.deprecatedApis = deprecatedApisConfig.recommended;
module.exports.createDeprecatedApiConfig =
	deprecatedApisConfig.createDeprecatedApiConfig;
module.exports.createFeatureBoundaryConfig =
	featureBoundaryConfig.createFeatureBoundaryConfig;
module.exports.createNativeUiConfig = nativeUiConfig.createNativeUiConfig;
module.exports.featureBoundaries = featureBoundaryConfig.recommended;
module.exports.nativeUi = nativeUiConfig.recommended;
module.exports.reactCompiler = reactCompilerConfig;
module.exports.reanimated = reanimatedConfig;
module.exports.createReanimatedConfig = reanimatedConfig.createReanimatedConfig;
module.exports.semanticColors = semanticColorsConfig;
module.exports.createSemanticColorsConfig =
	semanticColorsConfig.createSemanticColorsConfig;
module.exports.storybook = storybookConfig;
module.exports.worklets = workletsConfig;
