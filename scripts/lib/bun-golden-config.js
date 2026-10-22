// Builds the oxlint config of a golden profile with the package.
// packages/eslint-config-expo-magic/create-config.test.js proves it equals
// the 5.x config recorded for the same profile.

const expoMagic = require('../../packages/eslint-config-expo-magic');

function buildProfileConfig(profile) {
	return expoMagic[profile.factory](profile.options);
}

module.exports = { buildProfileConfig };
