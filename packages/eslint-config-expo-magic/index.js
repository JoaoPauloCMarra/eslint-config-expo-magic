const { createConfig } = require('./utils/create-config.js');
const config = createConfig();

function defineLazyExport(name, factory) {
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

defineLazyExport('agent', () => require('./agent.js'));
defineLazyExport('base', () => require('./base.js'));
defineLazyExport('fast', () => require('./fast.js'));
defineLazyExport('strict', () => require('./strict.js'));
defineLazyExport('typed', () => require('./typed.js'));

module.exports = config;
module.exports.createConfig = createConfig;
defineLazyExport('agentGuardrails', () => require('./agent-guardrails.js'));
defineLazyExport(
	'createAgentGuardrailsConfig',
	() => require('./agent-guardrails.js').createAgentGuardrailsConfig,
);
defineLazyExport('appGuardrails', () => require('./app-guardrails.js'));
defineLazyExport(
	'createAppGuardrailsConfig',
	() => require('./app-guardrails.js').createAppGuardrailsConfig,
);
defineLazyExport(
	'componentStructure',
	() => require('./component-structure.js').recommended,
);
defineLazyExport(
	'createComponentStructureConfig',
	() => require('./component-structure.js').createComponentStructureConfig,
);
defineLazyExport(
	'deprecatedApis',
	() => require('./deprecated-apis.js').recommended,
);
defineLazyExport(
	'createDeprecatedApiConfig',
	() => require('./deprecated-apis.js').createDeprecatedApiConfig,
);
defineLazyExport(
	'createNativeUiConfig',
	() => require('./native-ui.js').createNativeUiConfig,
);
defineLazyExport('nativeUi', () => require('./native-ui.js').recommended);
defineLazyExport('reactCompiler', () => require('./react-compiler.js'));
defineLazyExport('reanimated', () => require('./reanimated.js'));
defineLazyExport(
	'createReanimatedConfig',
	() => require('./reanimated.js').createReanimatedConfig,
);
defineLazyExport('semanticColors', () => require('./semantic-colors.js'));
defineLazyExport(
	'createSemanticColorsConfig',
	() => require('./semantic-colors.js').createSemanticColorsConfig,
);
defineLazyExport('storybook', () => require('./storybook.js'));
defineLazyExport('worklets', () => require('./worklets.js'));
