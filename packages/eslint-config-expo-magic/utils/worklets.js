const {
	createComposedRestrictedSyntaxConfigs,
} = require('./restricted-syntax.js');
const { tsAndTsxFiles } = require('./file-patterns.js');

const restrictedSyntaxGroups = [
	{
		files: tsAndTsxFiles,
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

const config = createComposedRestrictedSyntaxConfigs(restrictedSyntaxGroups);

module.exports = config;
module.exports.restrictedSyntaxGroups = restrictedSyntaxGroups;
