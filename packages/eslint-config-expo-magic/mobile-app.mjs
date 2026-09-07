import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const mobileApp = require('./mobile-app.js');

export default mobileApp;
export const createMobileAppConfig = mobileApp.createMobileAppConfig;
export const createMobileAppRestrictedImportsConfig =
	mobileApp.createMobileAppRestrictedImportsConfig;
