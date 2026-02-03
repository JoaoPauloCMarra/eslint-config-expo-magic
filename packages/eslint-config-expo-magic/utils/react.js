/** @type {import('eslint').Linter.Config[]} */
// Rationale: https://github.com/JoaoPauloCMarra/eslint-config-expo-magic/blob/main/RULES.md#react--react-native
const expoReact = require('eslint-config-expo/flat/utils/react.js');

const pluginReactHooks = require('eslint-plugin-react-hooks');
const pluginReactNative = require('eslint-plugin-react-native');
const pluginReact19Upgrade = require('eslint-plugin-react-19-upgrade');

const baseExpoReactConfig = { ...expoReact[0] };
const { 'react-hooks': _, ...expoPluginsWithoutReactHooks } =
	baseExpoReactConfig.plugins;
baseExpoReactConfig.plugins = expoPluginsWithoutReactHooks;

const expoRules = { ...baseExpoReactConfig.rules };
Object.keys(expoRules).forEach((key) => {
	if (key.startsWith('react-hooks/')) {
		delete expoRules[key];
	}
});
baseExpoReactConfig.rules = expoRules;

module.exports = [
	baseExpoReactConfig,

	{
		plugins: {
			'react-hooks': pluginReactHooks,
			'react-native': pluginReactNative,
			'react-19-upgrade': pluginReact19Upgrade,
		},

		rules: {
			...pluginReactHooks.configs.recommended.rules,
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
