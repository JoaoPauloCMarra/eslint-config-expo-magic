const { createRestrictedSyntaxConfigs } = require('./restricted-syntax.js');

const restrictedSyntaxGroups = [
	{
		files: ['**/*.tsx'],
		selectors: [
			{
				selector: 'TryStatement[finalizer!=null]',
				message:
					'React Compiler does not support try/finally in component or hook render scope. Use Promise.finally or explicit cleanup paths.',
			},
			{
				selector: 'TryStatement ThrowStatement',
				message:
					'React Compiler does not support throw inside try/catch in component or hook render scope. Prefer early returns and callback/onError handling.',
			},
			{
				selector: 'TryStatement ChainExpression',
				message:
					'React Compiler can fail on optional chaining inside try/catch render scope. Resolve optional values before entering try/catch.',
			},
		],
	},
];

const config = createRestrictedSyntaxConfigs(restrictedSyntaxGroups);

module.exports = config;
module.exports.restrictedSyntaxGroups = restrictedSyntaxGroups;
