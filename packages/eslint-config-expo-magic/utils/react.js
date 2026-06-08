/** @type {import('eslint').Linter.Config[]} */
// Rationale: https://github.com/JoaoPauloCMarra/eslint-config-expo-magic/blob/main/RULES.md#react--react-native
const { fixupPluginRules } = require('@eslint/compat');
const expoConfig = require('eslint-config-expo/flat');
const pluginReactHooks = require('eslint-plugin-react-hooks');
const pluginReactNative = require('eslint-plugin-react-native');
const pluginReact19Upgrade = require('eslint-plugin-react-19-upgrade');

function createExpoReactBaseConfig() {
	const expoReactConfig = expoConfig.find(
		(config) => config.plugins?.react && config.plugins['react-hooks'],
	);
	if (!expoReactConfig) {
		throw new Error(
			'Could not derive Expo React rules from eslint-config-expo/flat.',
		);
	}

	const { 'react-hooks': _ignoredPlugin, ...plugins } = expoReactConfig.plugins;
	const rules = Object.fromEntries(
		Object.entries(expoReactConfig.rules ?? {}).filter(
			([ruleName]) => !ruleName.startsWith('react-hooks/'),
		),
	);

	return {
		...expoReactConfig,
		plugins: {
			...plugins,
			react: fixupPluginRules(plugins.react),
		},
		rules,
	};
}

module.exports = [
	createExpoReactBaseConfig(),
	{
		plugins: {
			'react-hooks': fixupPluginRules(pluginReactHooks),
			'react-native': fixupPluginRules(pluginReactNative),
			'react-19-upgrade': fixupPluginRules(pluginReact19Upgrade),
		},
		rules: {
			...pluginReactHooks.configs.flat.recommended.rules,
			'react-hooks/exhaustive-deps': 'error',
			'react-hooks/set-state-in-effect': 'off',
			'react/jsx-no-leaked-render': 'error',
			'react/jsx-no-useless-fragment': 'error',
			'react/jsx-key': 'error',
			'react/no-unstable-nested-components': 'off',
			'react/self-closing-comp': 'error',
			'react-native/no-unused-styles': 'error',
			'react-native/no-inline-styles': 'off',
			'react-native/split-platform-components': 'error',
			'react-native/no-raw-text': 'off',
			'react-native/no-single-element-style-arrays': 'error',
			'react-19-upgrade/no-default-props': 'error',
			'react-19-upgrade/no-prop-types': 'warn',
			'react-19-upgrade/no-legacy-context': 'error',
			'react-19-upgrade/no-string-refs': 'error',
			'react-19-upgrade/no-factories': 'error',
		},
	},
];
