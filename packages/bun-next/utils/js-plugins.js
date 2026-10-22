const fs = require('node:fs');
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
	const jsPlugins = {};
	const missing = new Set();

	for (const [name, file] of Object.entries(pluginFiles)) {
		const absolutePath = path.join(rulesDirectory, file);
		if (fs.existsSync(absolutePath)) jsPlugins[name] = absolutePath;
		else missing.add(name);
	}

	const usedPlugins = new Set();
	for (const entry of entries) {
		for (const [ruleName, value] of Object.entries(entry.rules ?? {})) {
			const slash = ruleName.lastIndexOf('/');
			const prefix = slash === -1 ? null : ruleName.slice(0, slash);
			if (!prefix || !(prefix in pluginFiles) || isOff(value)) continue;
			if (missing.has(prefix)) {
				throw new Error(
					`Port missing: the "${prefix}" plugin needs packages/bun-next/rules/${pluginFiles[prefix]}, which does not exist yet (rule ${ruleName}).`,
				);
			}
			usedPlugins.add(prefix);
		}
	}

	const jsPluginRules = {};
	for (const name of usedPlugins) {
		jsPluginRules[name] = new Set(Object.keys(require(jsPlugins[name]).rules));
	}

	return { jsPlugins, jsPluginRules };
}

module.exports = { createJsPluginOptions, pluginFiles };
