const { createConfig: createFlatConfig } = require('./utils/create-config.js');
const { createJsPluginOptions } = require('./utils/js-plugins.js');
const {
	createMobileAppConfig: createFlatMobileAppConfig,
} = require('./utils/mobile-app.js');
const { presetModule } = require('./utils/preset-module.js');
const { toOxlintConfig } = require('./utils/to-oxlint.js');
const { createArchitectureConfig } = require('./architecture.js');

function createConfig(options = {}) {
	const entries = createFlatConfig(options);

	return toOxlintConfig(entries, createJsPluginOptions(entries));
}

function createMobileAppConfig(options = {}) {
	const entries = createFlatMobileAppConfig(options);

	return toOxlintConfig(entries, createJsPluginOptions(entries));
}

module.exports = presetModule(() => createConfig(), {
	createArchitectureConfig,
	createConfig,
	createMobileAppConfig,
});
