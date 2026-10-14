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

const compiledFunctionName = '/^(?:[A-Z](?![A-Z0-9_]*$)|use[A-Z0-9])/';
const compiledFunctions = [
	`FunctionDeclaration[id.name=${compiledFunctionName}]`,
	`VariableDeclarator[id.name=${compiledFunctionName}] > :function`,
	'CallExpression[callee.name=/^(?:memo|forwardRef)$/] > :function',
	'CallExpression[callee.property.name=/^(?:memo|forwardRef)$/] > :function',
];
const compiledTryWithoutCatch = `:matches(${compiledFunctions.join(', ')}) TryStatement[handler=null]`;

const restrictedSyntaxGroups = [
	{
		files: typeScriptFiles,
		selectors: [
			{
				selector: compiledTryWithoutCatch,
				message:
					'Never write try/finally without catch inside a React component or hook. The compiler cannot lower it ("Handle TryStatement without a catch clause") and skips the whole function. Use promise.finally() for async cleanup, or a real catch that handles or reports the error. try/catch/finally is not this bailout.',
			},
		],
	},
];

const {
	createComposedRestrictedSyntaxConfigs,
} = require('./restricted-syntax.js');
config.push(...createComposedRestrictedSyntaxConfigs(restrictedSyntaxGroups));

module.exports = config;
module.exports.rules = rules;
module.exports.restrictedSyntaxGroups = restrictedSyntaxGroups;
