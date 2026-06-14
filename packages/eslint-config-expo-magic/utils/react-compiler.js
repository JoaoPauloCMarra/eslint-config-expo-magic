const { fixupPluginRules } = require('@eslint/compat');
const pluginReactHooks = require('eslint-plugin-react-hooks');

const rules = {
	'react-hooks/incompatible-library': 'error',
	'react-hooks/unsupported-syntax': 'error',
	'react-hooks/immutability': 'error',
	'react-hooks/purity': 'error',
	'react-hooks/preserve-manual-memoization': 'error',
	'react-hooks/set-state-in-render': 'error',
	'react-hooks/static-components': 'error',
};

const config = [
	{
		plugins: {
			'react-hooks': fixupPluginRules(pluginReactHooks),
		},
		rules: { ...rules },
	},
];

module.exports = config;
module.exports.rules = rules;
