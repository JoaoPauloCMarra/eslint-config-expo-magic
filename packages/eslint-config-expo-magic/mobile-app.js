const {
	createMobileAppConfig,
	createMobileAppRestrictedImportsConfig,
} = require('./utils/mobile-app.js');

const config = createMobileAppConfig();

module.exports = config;
module.exports.createMobileAppConfig = createMobileAppConfig;
module.exports.createMobileAppRestrictedImportsConfig =
	createMobileAppRestrictedImportsConfig;
