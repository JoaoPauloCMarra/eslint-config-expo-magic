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

const { typeScriptFiles } = require('./file-patterns.js');

const restrictedSyntaxGroups = [
	{
		files: typeScriptFiles,
		selectors: [
			{
				selector: 'TryStatement[handler=null]',
				message:
					'Never write try/finally without catch inside a React component or hook. The compiler cannot lower it ("Handle TryStatement without a catch clause") and skips the whole function. Use promise.finally() for async cleanup, or a real catch that handles or reports the error. try/catch/finally is not this bailout.',
			},
		],
	},
];

module.exports = config;
module.exports.rules = rules;
module.exports.restrictedSyntaxGroups = restrictedSyntaxGroups;
