const { createRestrictedSyntaxConfigs } = require('./restricted-syntax.js');

const typeScriptFiles = ['**/*.ts', '**/*.tsx'];

const DEFAULT_GESTURE_HOOKS = ['usePanGesture'];
const ANIMATED_HOOKS = [
	'useAnimatedStyle',
	'useAnimatedReaction',
	'useDerivedValue',
	'useAnimatedProps',
];

function createRestrictedSyntaxGroups(options = {}) {
	const gestureHooks = [
		...(options.gestureHooks ?? DEFAULT_GESTURE_HOOKS),
		...(options.additionalGestureHooks ?? []),
	];

	const selectors = [
		{
			selector:
				'CallExpression[callee.name="useSharedValue"] > CallExpression[callee.property.name="get"]',
			message:
				'Do not read a shared value with `.get()` inside `useSharedValue(...)`. Initialize from a plain value and sync in an effect or worklet reaction.',
		},
		{
			selector:
				'CallExpression[callee.name="useSharedValue"] > MemberExpression[property.name="value"]',
			message:
				'Do not read a shared value with `.value` inside `useSharedValue(...)`. Initialize from a plain value and sync in an effect or worklet reaction.',
		},
		{
			selector: `CallExpression[callee.name=/^(${ANIMATED_HOOKS.join('|')})$/] CallExpression[callee.property.name="get"]`,
			message:
				'Use `.value`, not `.get()`, when reading shared values inside Reanimated worklet hooks.',
		},
	];

	if (gestureHooks.length > 0) {
		selectors.push({
			selector: `CallExpression[callee.name=/^(${gestureHooks.join('|')})$/] > ObjectExpression`,
			message:
				'Memoize gesture config before passing it to RNGH gesture hooks so Reanimated does not rebuild worklet closures on every render.',
		});
	}

	return [
		{
			files: typeScriptFiles,
			selectors,
		},
	];
}

const restrictedSyntaxGroups = createRestrictedSyntaxGroups();

function createReanimatedConfig(options = {}) {
	return createRestrictedSyntaxConfigs(createRestrictedSyntaxGroups(options));
}

const config = createReanimatedConfig();

module.exports = config;
module.exports.createReanimatedConfig = createReanimatedConfig;
module.exports.createRestrictedSyntaxGroups = createRestrictedSyntaxGroups;
module.exports.restrictedSyntaxGroups = restrictedSyntaxGroups;
