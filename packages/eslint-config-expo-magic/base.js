const {
	createBasePreset,
	defaultTsconfigProjectGlobs,
} = require('./utils/config-core.js');

module.exports = createBasePreset(defaultTsconfigProjectGlobs, []);
