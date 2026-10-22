// Rationale: https://github.com/JoaoPauloCMarra/eslint-config-expo-magic/blob/main/RULES.md#react--react-native

const {
	expo: expoConfig,
	reactHooks: { recommendedRules: recommendedHooksRules },
} = require('./external-config.json');

function createExpoReactBaseConfig() {
	const expoReactConfig = expoConfig.find(
		(config) => config.plugins?.react && config.plugins['react-hooks'],
	);
	if (!expoReactConfig) {
		throw new Error(
			'Could not derive Expo React rules from eslint-config-expo/flat.',
		);
	}

	const { 'react-hooks': _ignoredPlugin, ...plugins } = expoReactConfig.plugins;
	const rules = Object.fromEntries(
		Object.entries(expoReactConfig.rules ?? {}).filter(
			([ruleName]) => !ruleName.startsWith('react-hooks/'),
		),
	);

	return {
		...expoReactConfig,
		plugins: {
			...plugins,
			react: {},
		},
		rules,
	};
}

function createReactConfig({ fast = false } = {}) {
	const hooksRules = fast
		? {
				'react-hooks/rules-of-hooks':
					recommendedHooksRules['react-hooks/rules-of-hooks'],
				'react-hooks/exhaustive-deps': 'error',
			}
		: {
				...recommendedHooksRules,
				'react-hooks/exhaustive-deps': 'error',
			};

	return [
		createExpoReactBaseConfig(),
		{
			plugins: {
				'react-hooks': {},
				'react-native': {},
				'react-19-upgrade': {},
			},
			rules: {
				...hooksRules,
				'react-hooks/set-state-in-effect': 'off',
				'react/jsx-no-leaked-render': 'error',
				'react/jsx-no-useless-fragment': 'error',
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
}

module.exports = createReactConfig();
module.exports.createReactConfig = createReactConfig;
