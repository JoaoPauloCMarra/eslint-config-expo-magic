const plugin = require('./plugin/index.js');
const { testFiles } = require('./file-patterns.js');

const propTypeFiles = ['**/*.ts', '**/*.tsx'];
const componentFiles = ['**/*.tsx'];

function createComponentStructureConfig(options = {}) {
	const propsTypePattern = options.propsTypePattern;
	const propsOrderRule = propsTypePattern
		? ['warn', { pattern: propsTypePattern }]
		: ['warn'];

	return [
		{
			files: propTypeFiles,
			ignores: testFiles,
			plugins: {
				'expo-magic': plugin,
			},
			rules: {
				'expo-magic/no-inline-props': 'error',
				'expo-magic/props-type-order': propsOrderRule,
			},
		},
		{
			files: componentFiles,
			ignores: testFiles,
			plugins: {
				'expo-magic': plugin,
			},
			rules: {
				'expo-magic/default-export-placement': 'error',
				'expo-magic/require-children-usage': 'warn',
			},
		},
	];
}

const recommended = createComponentStructureConfig();

module.exports = recommended;
module.exports.createComponentStructureConfig = createComponentStructureConfig;
module.exports.plugin = plugin;
module.exports.recommended = recommended;
