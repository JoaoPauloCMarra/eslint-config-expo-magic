const {
	createArchitectureConfig: createFlatArchitectureConfig,
	DEFAULT_LAYERS,
} = require('./utils/architecture.js');
const { createConfig } = require('./utils/create-config.js');
const { createJsPluginOptions } = require('./utils/js-plugins.js');
const { toOxlintConfig } = require('./utils/to-oxlint.js');

function createArchitectureConfig(options = {}) {
	if (
		options === null ||
		typeof options !== 'object' ||
		Array.isArray(options)
	) {
		return createFlatArchitectureConfig(options);
	}

	const { base = {}, ...rest } = options;
	if (Object.prototype.hasOwnProperty.call(rest, 'baseConfig')) {
		throw new TypeError(
			'createArchitectureConfig baseConfig is not supported in 6.0. Pass base (the createConfig options object) instead.',
		);
	}

	const baseEntries = createConfig(base);
	const entries = [
		...baseEntries,
		...createFlatArchitectureConfig({ ...rest, baseConfig: baseEntries }),
	];

	return toOxlintConfig(entries, createJsPluginOptions(entries));
}

module.exports = { createArchitectureConfig, DEFAULT_LAYERS };
