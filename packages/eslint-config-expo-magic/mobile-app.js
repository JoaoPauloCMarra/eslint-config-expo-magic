const { createMobileAppConfig } = require('./index.js');
const { presetModule } = require('./utils/preset-module.js');

module.exports = presetModule(() => createMobileAppConfig(), {
	createMobileAppConfig,
});
