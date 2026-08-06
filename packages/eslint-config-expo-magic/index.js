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

const base = require('./base.js');
const config = createConfig();
const noPrettier = createConfig({ prettier: false });
const typed = createConfig({ typeChecked: true });
const typedNoPrettier = createConfig({
	typeChecked: true,
	prettier: false,
});
const strict = createConfig({ strict: true });
const strictNoPrettier = createConfig({
	strict: true,
	prettier: false,
});
const agent = createConfig({ agent: true, prettier: false });

module.exports = config;
module.exports.agent = agent;
module.exports.agentGuardrails = agentGuardrailsConfig;
module.exports.base = base;
module.exports.createConfig = createConfig;
module.exports.createAgentGuardrailsConfig =
	agentGuardrailsConfig.createAgentGuardrailsConfig;
module.exports.strict = strict;
module.exports.typed = typed;
module.exports.noPrettier = noPrettier;
module.exports.strictNoPrettier = strictNoPrettier;
module.exports.typedNoPrettier = typedNoPrettier;
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
