const typeScriptFiles = [
	'**/*.ts',
	'**/*.tsx',
	'**/*.mts',
	'**/*.cts',
	'**/*.d.ts',
	'**/*.d.mts',
	'**/*.d.cts',
];

const defaultRestrictedTypes = {
	MutableRefObject: {
		message:
			'`MutableRefObject` is removed from React 19 typings. Use `RefObject` instead.',
		fixWith: 'RefObject',
	},
};

const defaultRestrictedProperties = [
	{
		object: 'StyleSheet',
		property: 'absoluteFillObject',
		message:
			'`StyleSheet.absoluteFillObject` is deprecated. Use `StyleSheet.absoluteFill`.',
	},
	{
		object: 'AccessibilityInfo',
		property: 'setAccessibilityFocus',
		message:
			'`AccessibilityInfo.setAccessibilityFocus` is deprecated. Use `AccessibilityInfo.sendAccessibilityEvent`.',
	},
];

function createDeprecatedApiConfig(options = {}) {
	const restrictedTypes = {
		...defaultRestrictedTypes,
		...(options.additionalRestrictedTypes ?? {}),
	};
	const restrictedProperties = [
		...defaultRestrictedProperties,
		...(options.additionalRestrictedProperties ?? []),
	];

	return [
		{
			rules: {
				'no-restricted-properties': ['error', ...restrictedProperties],
			},
		},
		{
			files: typeScriptFiles,
			rules: {
				'@typescript-eslint/no-restricted-types': [
					'error',
					{ types: restrictedTypes },
				],
			},
		},
	];
}

const recommended = createDeprecatedApiConfig();

module.exports = recommended;
module.exports.createDeprecatedApiConfig = createDeprecatedApiConfig;
module.exports.defaultRestrictedProperties = defaultRestrictedProperties;
module.exports.defaultRestrictedTypes = defaultRestrictedTypes;
module.exports.recommended = recommended;
