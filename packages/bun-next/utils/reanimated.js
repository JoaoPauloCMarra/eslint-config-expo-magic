const {
	createComposedRestrictedSyntaxConfigs,
} = require('./restricted-syntax.js');
const { tsAndTsxFiles } = require('./file-patterns.js');
const DEFAULT_GESTURE_HOOKS = ['usePanGesture'];
const PLUGIN_NAME = 'expo-magic-reanimated';
const RULE_NAME = 'no-shared-value-misuse';
const sharedValueUsageRule = require('../rules/expo-magic-reanimated.js').rules[
	RULE_NAME
];

function createSharedValueUsageConfig() {
	return [
		{
			files: tsAndTsxFiles,
			plugins: {
				[PLUGIN_NAME]: {},
			},
			rules: {
				[`${PLUGIN_NAME}/${RULE_NAME}`]: 'error',
			},
		},
	];
}

function createRestrictedSyntaxGroups(options = {}) {
	const gestureHooks = [
		...(options.gestureHooks ?? DEFAULT_GESTURE_HOOKS),
		...(options.additionalGestureHooks ?? []),
	];

	if (gestureHooks.length === 0) {
		return [];
	}

	return [
		{
			files: tsAndTsxFiles,
			selectors: [
				{
					selector: `CallExpression[callee.name=/^(${gestureHooks.join('|')})$/] > ObjectExpression`,
					message:
						'Memoize gesture config before passing it to RNGH gesture hooks so Reanimated does not rebuild worklet closures on every render.',
				},
			],
		},
	];
}

function createReanimatedConfig(options = {}) {
	return [
		...createSharedValueUsageConfig(),
		...createComposedRestrictedSyntaxConfigs(
			createRestrictedSyntaxGroups(options),
		),
	];
}

const restrictedSyntaxGroups = createRestrictedSyntaxGroups();
const config = createReanimatedConfig();

module.exports = config;
module.exports.createReanimatedConfig = createReanimatedConfig;
module.exports.createRestrictedSyntaxGroups = createRestrictedSyntaxGroups;
module.exports.createSharedValueUsageConfig = createSharedValueUsageConfig;
module.exports.restrictedSyntaxGroups = restrictedSyntaxGroups;
module.exports.sharedValueUsageRule = sharedValueUsageRule;
