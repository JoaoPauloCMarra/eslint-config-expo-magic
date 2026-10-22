// Transitional bridge for the golden runner: converts the 5.x flat config of a
// profile into an oxlint config. JavaScript-only plugins load through shim
// modules that take the plugin object from the same 5.x config, until
// packages/bun-next ships ported rules.

const fs = require('node:fs');
const path = require('node:path');
const {
	toOxlintConfig,
} = require('../../packages/bun-next/utils/to-oxlint.js');

const packageDir = path.resolve(
	__dirname,
	'../../packages/eslint-config-expo-magic',
);
const nativePrefixes = new Set([
	'@typescript-eslint',
	'react',
	'react-hooks',
	'import-x',
	'jest',
	'prettier',
]);

function createFlatConfig(profile) {
	const factories = {
		createConfig: () => require(packageDir).createConfig,
		createMobileAppConfig: () =>
			require(path.join(packageDir, 'mobile-app.js')).createMobileAppConfig,
	};

	return factories[profile.factory]()(profile.options);
}

function writePluginShim(profile, pluginName, shimDir) {
	const file = path.join(
		shimDir,
		`${profile.name}-${pluginName.replace(/[^\w-]/g, '_')}.cjs`,
	);
	const factory =
		profile.factory === 'createMobileAppConfig'
			? `require(${JSON.stringify(path.join(packageDir, 'mobile-app.js'))}).createMobileAppConfig`
			: `require(${JSON.stringify(packageDir)}).createConfig`;

	fs.writeFileSync(
		file,
		[
			`const entries = ${factory}(${JSON.stringify(profile.options)});`,
			`module.exports = entries.find((entry) => entry.plugins && entry.plugins[${JSON.stringify(pluginName)}]).plugins[${JSON.stringify(pluginName)}];`,
			'',
		].join('\n'),
	);

	return file;
}

function buildProfileConfig(profile, shimDir) {
	const entries = createFlatConfig(profile);
	const jsPlugins = {};

	for (const entry of entries) {
		for (const name of Object.keys(entry.plugins ?? {})) {
			if (!nativePrefixes.has(name) && !jsPlugins[name]) {
				jsPlugins[name] = writePluginShim(profile, name, shimDir);
			}
		}
	}

	return toOxlintConfig(entries, { jsPlugins });
}

module.exports = { buildProfileConfig };
