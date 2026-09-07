const { createConfig } = require('./create-config.js');
const { defaultRestrictions } = require('./native-ui.js');

const featureElementTypes = [
	'feature-screen',
	'feature-component',
	'feature-hook',
	'feature-service',
	'feature-contract',
	'feature-domain',
];

const runtimeElementTypes = [
	'app',
	'contract',
	'dev',
	...featureElementTypes,
	'module',
	'root-hook',
	'root-service',
	'shared-util',
	'uikit',
];

const mobileAppIgnores = [
	'.cache/**',
	'.eas/**',
	'.github/**',
	'.vscode/**',
	'.worktrees/**',
	'assets/**',
	'expo-env.d.ts',
];

const mobileAppNativeUiWrapperFiles = [
	'**/uikit/components/button.tsx',
	'**/uikit/components/dialog.tsx',
	'**/uikit/components/loading-spinner.tsx',
	'**/uikit/components/modal.tsx',
	'**/uikit/components/pressables.tsx',
	'**/uikit/components/screen.tsx',
	'**/uikit/components/scroll-view.tsx',
	'**/uikit/components/sheet.tsx',
	'**/uikit/components/spinner.tsx',
	'**/uikit/components/text-input.tsx',
	'**/uikit/components/text.tsx',
	'**/uikit/components/toggle.tsx',
	'**/uikit/components/video-player.tsx',
	'**/uikit/components/zoomable-diagram.tsx',
];

const additionalNativeUiRestrictions = [
	{
		name: 'react-native',
		importNames: [
			'ActivityIndicator',
			'Switch',
			'Text',
			'TextInput',
			'TouchableHighlight',
			'TouchableNativeFeedback',
			'TouchableWithoutFeedback',
		],
		message:
			'Use concrete components from your UIKit instead of raw React Native UI primitives.',
	},
	{
		name: 'react-native-paper',
		message: 'Use the project UIKit. Do not add third-party UI kits.',
	},
	{
		name: 'native-base',
		message: 'Use the project UIKit. Do not add third-party UI kits.',
	},
	{
		name: '@rneui/themed',
		message: 'Use the project UIKit. Do not add third-party UI kits.',
	},
	{
		name: 'react-native-elements',
		message: 'Use the project UIKit. Do not add third-party UI kits.',
	},
];

const mobileAppNativeUiRestrictions = [
	...defaultRestrictions,
	...additionalNativeUiRestrictions,
];

const mobileAppStorageRestrictedImportPatterns = [
	{
		group: ['@react-native-async-storage/async-storage'],
		message:
			'Use services/persistence/storage. Legacy storage is allowed only in services/persistence/storage-migration.ts.',
	},
	{
		group: ['expo-secure-store'],
		message:
			'Use services/auth/secure-tokens. Secure storage access must stay behind the adapter.',
	},
	{
		group: ['react-native-nitro-storage'],
		message:
			'Use services/persistence/storage or services/auth/secure-tokens. Keep Nitro access centralized.',
	},
];

const namingConventionRules = [
	{
		selector: 'variable',
		format: ['camelCase', 'PascalCase', 'UPPER_CASE'],
		leadingUnderscore: 'allow',
	},
	{
		selector: 'function',
		format: ['camelCase', 'PascalCase'],
		leadingUnderscore: 'forbid',
	},
	{
		selector: 'typeLike',
		format: ['PascalCase'],
		leadingUnderscore: 'forbid',
	},
	{
		selector: 'enumMember',
		format: ['UPPER_CASE'],
	},
];

const architectureElementSettings = [
	{ type: 'dev', pattern: 'app/dev', partialMatch: false },
	{ type: 'app', pattern: 'app', partialMatch: false },
	{ type: 'dev', pattern: 'features/dev', partialMatch: false },
	{
		type: 'feature-screen',
		pattern: 'features/*/screens',
		partialMatch: false,
		capture: ['feature'],
	},
	{
		type: 'feature-component',
		pattern: 'features/*/components',
		partialMatch: false,
		capture: ['feature'],
	},
	{
		type: 'feature-hook',
		pattern: 'features/*/hooks',
		partialMatch: false,
		capture: ['feature'],
	},
	{
		type: 'feature-service',
		pattern: 'features/*/services',
		partialMatch: false,
		capture: ['feature'],
	},
	{
		type: 'feature-contract',
		pattern: 'features/*/contracts',
		partialMatch: false,
		capture: ['feature'],
	},
	{
		type: 'feature-domain',
		pattern: 'features/*',
		partialMatch: false,
		capture: ['feature'],
	},
	{ type: 'root-hook', pattern: 'hooks', partialMatch: false },
	{ type: 'root-service', pattern: 'services', partialMatch: false },
	{ type: 'shared-util', pattern: 'utils', partialMatch: false },
	{ type: 'contract', pattern: 'types', partialMatch: false },
	{ type: 'uikit', pattern: 'uikit', partialMatch: false },
	{
		type: 'module',
		pattern: 'modules/*',
		partialMatch: false,
		capture: ['module'],
	},
];

function elementSelector(types, captured) {
	return {
		element: {
			types: Array.isArray(types) ? { anyOf: types } : types,
			...(captured ? { captured } : {}),
		},
	};
}

function dependencySelector(types, captured) {
	return { to: elementSelector(types, captured) };
}

const sameFeatureDependency = dependencySelector(featureElementTypes, {
	feature: '{{from.element.captured.feature}}',
});

const sameModuleDependency = dependencySelector('module', {
	module: '{{from.element.captured.module}}',
});

const architecturePolicies = [
	{
		from: elementSelector('app'),
		allow: dependencySelector(runtimeElementTypes),
	},
	{
		from: elementSelector('dev'),
		allow: dependencySelector(runtimeElementTypes),
	},
	{
		from: elementSelector(featureElementTypes),
		allow: [
			sameFeatureDependency,
			dependencySelector([
				'contract',
				'module',
				'root-hook',
				'root-service',
				'shared-util',
				'uikit',
			]),
		],
	},
	{
		from: elementSelector('root-hook'),
		allow: dependencySelector([
			'contract',
			'module',
			'root-hook',
			'root-service',
			'shared-util',
		]),
	},
	{
		from: elementSelector('root-service'),
		allow: dependencySelector([
			'contract',
			'module',
			'root-service',
			'shared-util',
		]),
	},
	{
		from: elementSelector('uikit'),
		allow: dependencySelector([
			'contract',
			'module',
			'root-hook',
			'root-service',
			'shared-util',
			'uikit',
		]),
	},
	{
		from: elementSelector('module'),
		allow: [
			sameModuleDependency,
			dependencySelector(['root-service', 'shared-util']),
		],
	},
	{
		from: elementSelector('contract'),
		allow: dependencySelector(['contract', 'shared-util']),
	},
	{
		from: elementSelector('shared-util'),
		allow: dependencySelector(['contract', 'shared-util']),
	},
];

function createRestrictedImportsRule(paths, patterns) {
	return ['error', { paths, patterns }];
}

function createMobileAppRestrictedImportsConfig(options) {
	if (!options || !Array.isArray(options.files)) {
		throw new TypeError(
			'createMobileAppRestrictedImportsConfig files must be an array.',
		);
	}

	return [
		{
			files: options.files,
			...(options.ignores ? { ignores: options.ignores } : {}),
			rules: {
				'no-restricted-imports': createRestrictedImportsRule(
					[
						...mobileAppNativeUiRestrictions,
						...(options.additionalPaths ?? []),
					],
					[
						...mobileAppStorageRestrictedImportPatterns,
						...(options.additionalPatterns ?? []),
					],
				),
			},
		},
	];
}

function createArchitectureConfigs() {
	return [
		{
			settings: {
				'boundaries/elements': architectureElementSettings,
				'boundaries/elements-single-match': true,
				'boundaries/files': [
					{
						category: 'test',
						pattern: '**/*.{test,spec}.{ts,tsx,js,jsx}',
					},
					{
						category: 'source',
						pattern: '**/*.{ts,tsx,js,jsx,mjs,cjs,json}',
					},
				],
				'boundaries/ignore': ['assets/**', 'expo-env.d.ts', 'package.json'],
				'boundaries/legacy-templates': false,
				'boundaries/additional-dependency-nodes': [
					{
						selector: 'TSImportType > Literal',
						kind: 'type',
						name: 'import-type',
					},
					{
						selector:
							'TSImportEqualsDeclaration > TSExternalModuleReference > Literal',
						kind: 'value',
						name: 'import-equals',
					},
				],
			},
			rules: {
				'boundaries/dependencies': [
					'error',
					{ default: 'allow', policies: architecturePolicies },
				],
			},
		},
		{
			files: [
				'{app,features,hooks,services,uikit,modules,utils}/**/*.{ts,tsx}',
			],
			rules: {
				'boundaries/dependencies': [
					'error',
					{ default: 'disallow', policies: architecturePolicies },
				],
				'boundaries/no-unknown-dependencies': ['error', { require: 'element' }],
				'boundaries/no-unknown-files': 'error',
			},
		},
	];
}

function createConventionConfigs() {
	return [
		{
			files: ['**/*.{ts,tsx}'],
			rules: {
				'@typescript-eslint/naming-convention': [
					'error',
					...namingConventionRules,
				],
				'id-match': [
					'error',
					'^(?!handle[A-Z])',
					{
						classFields: true,
						onlyDeclarations: true,
						properties: true,
					},
				],
				'no-empty': ['error', { allowEmptyCatch: false }],
				'react/jsx-boolean-value': ['error', 'never'],
			},
		},
		{
			files: ['uikit/tokens/colors.ts'],
			rules: {
				'@typescript-eslint/naming-convention': [
					'error',
					...namingConventionRules,
					{
						selector: 'property',
						format: ['camelCase'],
						leadingUnderscore: 'forbid',
					},
				],
			},
		},
	];
}

function createMobileAppConfig(options = {}) {
	if (
		options === null ||
		typeof options !== 'object' ||
		Array.isArray(options)
	) {
		throw new TypeError('createMobileAppConfig options must be an object.');
	}

	const preset =
		options.preset ?? process.env.ESLINT_CONFIG_PRESET ?? 'default';
	const extraIgnores = [...mobileAppIgnores, ...(options.extraIgnores ?? [])];
	const config = createConfig({
		preset,
		tsconfigProjects: options.tsconfigProjects,
		extraIgnores,
		prettier: true,
		agent: { semanticColors: true },
		featureBoundaries: true,
		nativeUi: {
			allowFiles: [
				...mobileAppNativeUiWrapperFiles,
				'**/hooks/use-navigator.ts',
			],
			additionalRestrictions: additionalNativeUiRestrictions,
		},
	});

	return config.concat(
		createArchitectureConfigs(),
		createConventionConfigs(),
		createMobileAppRestrictedImportsConfig({
			files: [
				'app/**/*.{ts,tsx}',
				'features/**/*.{ts,tsx}',
				'hooks/**/*.{ts,tsx}',
				'services/**/*.{ts,tsx}',
			],
			ignores: [
				'hooks/use-navigator.ts',
				'services/auth/secure-tokens.ts',
				'services/persistence/storage-migration.ts',
				'services/persistence/storage.ts',
			],
		}),
		[
			{
				files: [
					'services/logger.ts',
					'services/sentry.ts',
					'uikit/components/error-boundary.tsx',
				],
				rules: {
					'no-console': ['error', { allow: ['error', 'log', 'warn'] }],
				},
			},
			{
				files: mobileAppNativeUiWrapperFiles,
				ignores: [
					'uikit/components/pressables.tsx',
					'uikit/components/text.tsx',
				],
				rules: {
					'no-restricted-imports': createRestrictedImportsRule(
						[
							{
								name: 'react-native',
								importNames: ['Pressable', 'TouchableOpacity'],
								message:
									'Use your UIKit pressable wrapper. Raw React Native press primitives belong only inside that wrapper.',
							},
							{
								name: 'react-native-gesture-handler',
								importNames: ['Pressable', 'TouchableOpacity'],
								message:
									'Use your UIKit pressable wrapper for taps. Reserve Gesture Handler for composed gestures.',
							},
							{
								name: 'react-native',
								importNames: ['Text'],
								message:
									'Use your UIKit text wrapper. Raw React Native Text belongs only inside that wrapper.',
							},
						],
						mobileAppStorageRestrictedImportPatterns,
					),
				},
			},
			{
				files: ['scripts/**/*.ts'],
				rules: {
					'no-console': ['error', { allow: ['error', 'log', 'warn'] }],
				},
			},
		],
	);
}

module.exports = {
	createMobileAppConfig,
	createMobileAppRestrictedImportsConfig,
};
