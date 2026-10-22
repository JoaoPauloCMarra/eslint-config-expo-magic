const path = require('node:path');

const rulesDirectory = path.join(__dirname, '..', 'rules');

// Rule prefix -> port file, relative to ./rules.
const pluginFiles = {
	boundaries: 'boundaries.js',
	expo: 'expo.js',
	'expo-magic': 'expo-magic/index.js',
	'expo-magic-reanimated': 'expo-magic-reanimated.js',
	'react-19-upgrade': 'react-19-upgrade.js',
	'react-native': 'react-native.js',
	'testing-library': 'testing-library.js',
	'unused-imports': 'unused-imports.js',
};

function isOff(value) {
	const level = Array.isArray(value) ? value[0] : value;

	return level === 'off' || level === 0;
}

function createJsPluginOptions(entries) {
	const jsPlugins = Object.fromEntries(
		Object.entries(pluginFiles).map(([name, file]) => [
			name,
			path.join(rulesDirectory, file),
		]),
	);

	const usedPlugins = new Set();
	for (const entry of entries) {
		for (const [ruleName, value] of Object.entries(entry.rules ?? {})) {
			const slash = ruleName.lastIndexOf('/');
			const prefix = slash === -1 ? null : ruleName.slice(0, slash);
			if (prefix in pluginFiles && !isOff(value)) usedPlugins.add(prefix);
		}
	}

	const jsPluginRules = {};
	for (const name of usedPlugins) {
		jsPluginRules[name] = new Set(Object.keys(require(jsPlugins[name]).rules));
	}

	return { jsPlugins, jsPluginRules };
}

module.exports = { createJsPluginOptions, pluginFiles };
