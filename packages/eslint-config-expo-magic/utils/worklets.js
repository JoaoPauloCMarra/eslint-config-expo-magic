const { createRestrictedSyntaxConfigs } = require('./restricted-syntax.js');

const restrictedSyntaxGroups = [
	{
		files: ['**/*.ts', '**/*.tsx'],
		selectors: [
			{
				selector:
					'CallExpression[callee.name="scheduleOnRN"] > ArrowFunctionExpression',
				message:
					'Pass an RN-runtime function reference to `scheduleOnRN` instead of an inline callback.',
			},
			{
				selector:
					'CallExpression[callee.name="scheduleOnRN"] > FunctionExpression',
				message:
					'Pass an RN-runtime function reference to `scheduleOnRN` instead of an inline callback.',
			},
		],
	},
];

const config = createRestrictedSyntaxConfigs(restrictedSyntaxGroups);

module.exports = config;
module.exports.restrictedSyntaxGroups = restrictedSyntaxGroups;
