// Builds the oxlint config of a golden profile with the Bun-only package.
// packages/bun-next/create-config.test.js proves it equals the 5.x config
// converted by toOxlintConfig, so the golden runs test the real package.

const bunNext = require('../../packages/bun-next');

function buildProfileConfig(profile) {
	return bunNext[profile.factory](profile.options);
}

module.exports = { buildProfileConfig };
