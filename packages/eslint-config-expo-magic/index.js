const globals = require('globals');
const { fixupConfigRules } = require('@eslint/compat');
const {
	createTypeScriptImportResolver,
} = require('eslint-import-resolver-typescript');
const expoConfig = require('eslint-config-expo/flat');
const { createNodeResolver } = require('eslint-plugin-import-x');
const tseslint = require('typescript-eslint');

const appConfig = require('./utils/app.js');
const appGuardrailsConfig = require('./utils/app-guardrails.js');
const componentStructureConfig = require('./utils/component-structure.js');
const deprecatedApisConfig = require('./utils/deprecated-apis.js');
const allExtensions = require('./utils/extensions.js');
const featureBoundaryConfig = require('./utils/feature-boundaries.js');
const importsConfig = require('./utils/imports.js');
const jestConfig = require('./utils/jest.js');
const nativeUiConfig = require('./utils/native-ui.js');
const prettierConfig = require('./utils/prettier.js');
const reactConfig = require('./utils/react.js');
const reactCompilerConfig = require('./utils/react-compiler.js');
const reanimatedConfig = require('./utils/reanimated.js');
const {
	createComposedRestrictedSyntaxConfigs,
} = require('./utils/restricted-syntax.js');
const semanticColorsConfig = require('./utils/semantic-colors.js');
const storybookConfig = require('./utils/storybook.js');
const typescriptConfig = require('./utils/typescript.js');
const workletsConfig = require('./utils/worklets.js');

const typeScriptFiles = [
	'**/*.ts',
	'**/*.tsx',
	'**/*.mts',
	'**/*.cts',
	'**/*.d.ts',
	'**/*.d.mts',
	'**/*.d.cts',
];

const legacyTypeScriptFiles = new Set(['**/*.ts', '**/*.tsx', '**/*.d.ts']);

const defaultTsconfigProjectGlobs = [
	'./tsconfig.json',
	'./apps/*/tsconfig.json',
	'./packages/*/tsconfig.json',
	'./test-project/tsconfig.json',
];

const defaultIgnorePatterns = [
	'**/node_modules/**',
	'**/dist/**',
	'**/build/**',
	'**/.expo/**',
	'**/ios/**',
	'**/android/**',
];

function normalizeOptionConfig(value, createConfigForValue) {
	if (!value) {
		return [];
	}

	return createConfigForValue(value === true ? undefined : value);
}

function widenTypeScriptFiles(files) {
	if (
		!Array.isArray(files) ||
		!files.some((file) => legacyTypeScriptFiles.has(file))
	) {
		return files;
	}

	return [...new Set([...files, ...typeScriptFiles])];
}

function createExpoBaseConfig() {
	return expoConfig
		.map((config) => {
			if (!Array.isArray(config.files)) {
				return config;
			}

			return {
				...config,
				files: widenTypeScriptFiles(config.files),
			};
		})
		.filter((config) => !config.plugins || !config.plugins['react-hooks']);
}

function createTypeCheckedConfigs() {
	const seenConfigNames = new Set();

	return [
		...tseslint.configs.recommendedTypeChecked,
		...tseslint.configs.stylisticTypeChecked,
	]
		.filter((configEntry) => {
			if (!configEntry.name || !seenConfigNames.has(configEntry.name)) {
				seenConfigNames.add(configEntry.name);
				return true;
			}

			return false;
		})
		.map((configEntry) => {
			const { plugins: _ignoredPlugins, ...rest } = configEntry;

			return {
				...rest,
				files: widenTypeScriptFiles(configEntry.files ?? typeScriptFiles),
				languageOptions: {
					...(configEntry.languageOptions ?? {}),
					parserOptions: {
						...(configEntry.languageOptions?.parserOptions ?? {}),
						projectService: true,
						tsconfigRootDir: process.cwd(),
					},
				},
			};
		});
}

const filteredExpoConfig = fixupConfigRules(createExpoBaseConfig());
function createTypeScriptImportResolverConfig(tsconfigProjects) {
	return {
		alwaysTryTypes: true,
		bun: true,
		noWarnOnMultipleProjects: true,
		project: tsconfigProjects,
		tsconfigRootDir: process.cwd(),
	};
}

function createSharedConfig(tsconfigProjects, extraIgnores = []) {
	const typescriptImportResolver =
		createTypeScriptImportResolverConfig(tsconfigProjects);
	const importXResolvers = [
		createTypeScriptImportResolver(typescriptImportResolver),
		createNodeResolver({ extensions: allExtensions }),
	];

	return [
		{
			ignores: [...new Set([...defaultIgnorePatterns, ...extraIgnores])],
		},
		{
			name: 'import-ignores',
			settings: {
				'import/ignore': [
					'node_modules',
					'\\.json$',
					'\\.(scss|sass|css|less|styl)$',
					'\\.(svg|png|jpg|jpeg|gif|webp)$',
				],
				'import-x/ignore': [
					'node_modules',
					'\\.json$',
					'\\.(scss|sass|css|less|styl)$',
					'\\.(svg|png|jpg|jpeg|gif|webp)$',
				],
			},
		},
		...filteredExpoConfig,
		{
			settings: {
				'import/resolver': {
					node: { extensions: allExtensions },
					typescript: typescriptImportResolver,
				},
				'import-x/extensions': allExtensions,
				'import-x/resolver': {
					node: { extensions: allExtensions },
					typescript: typescriptImportResolver,
				},
				'import-x/resolver-next': importXResolvers,
			},
			languageOptions: {
				globals: {
					...globals.browser,
					__DEV__: 'readonly',
					ErrorUtils: false,
					FormData: false,
					XMLHttpRequest: false,
					alert: false,
					cancelAnimationFrame: false,
					cancelIdleCallback: false,
					clearImmediate: false,
					fetch: false,
					navigator: false,
					process: false,
					requestAnimationFrame: false,
					requestIdleCallback: false,
					setImmediate: false,
					window: false,
					'shared-node-browser': true,
				},
			},
		},
		{
			files: [
				'*.config.{js,cjs,mjs,ts,mts,cts}',
				'**/*.config.{js,cjs,mjs,ts,mts,cts}',
				'metro.config.{js,cjs,mjs,ts,mts,cts}',
				'babel.config.{js,cjs,mjs,ts,mts,cts}',
				'scripts/**/*.{js,cjs,mjs,ts,mts,cts}',
			],
			languageOptions: {
				globals: {
					...globals.node,
				},
			},
		},
		{
			files: ['*.web.*'],
			languageOptions: {
				globals: {
					...globals.browser,
				},
			},
		},
	];
}

const strictTypeScriptRules = {
	'@typescript-eslint/no-explicit-any': 'error',
	'@typescript-eslint/no-non-null-assertion': 'error',
	'@typescript-eslint/await-thenable': 'error',
	'@typescript-eslint/no-floating-promises': 'error',
	'@typescript-eslint/no-misused-promises': 'error',
};

function createBasePreset(tsconfigProjects, extraIgnores) {
	return [
		...createSharedConfig(tsconfigProjects, extraIgnores),
		{
			rules: {
				'expo/prefer-box-shadow': 'warn',
			},
		},
	];
}

function createDefaultPreset(
	tsconfigProjects,
	{ extraIgnores = [], testing = true } = {},
) {
	const defaultPreset = [
		...createBasePreset(tsconfigProjects, extraIgnores),
		...typescriptConfig,
		...reactConfig,
		...importsConfig,
		...appConfig,
		{
			files: ['apps/**'],
			rules: {
				'no-console': 'warn',
			},
		},
		{
			files: ['packages/**'],
			rules: {
				'no-console': 'error',
			},
		},
	];

	if (testing) {
		defaultPreset.push(...jestConfig);
	}

	return defaultPreset;
}

function createConfig(options = {}) {
	const {
		preset = 'default',
		prettier = preset !== 'base',
		testing = preset !== 'base',
		typeChecked = false,
		strict = false,
		tsconfigProjects = defaultTsconfigProjectGlobs,
		extraIgnores = [],
		appGuardrails = false,
		componentStructure = false,
		deprecatedApis = false,
		featureBoundaries = false,
		inlineStyles = false,
		nativeUi = false,
		reactCompiler = false,
		reanimated = false,
		semanticColors = false,
		storybook = false,
		worklets = false,
	} = options;
	const restrictedSyntaxGroups = [];
	const postCompositionConfig = [];

	const presetConfig =
		preset === 'base'
			? createBasePreset(tsconfigProjects, extraIgnores)
			: createDefaultPreset(tsconfigProjects, { extraIgnores, testing });

	const finalConfig = [...presetConfig];

	if (appGuardrails) {
		const appGuardrailsOptions =
			appGuardrails === true ? undefined : appGuardrails;
		finalConfig.push(...appGuardrailsConfig.base);
		restrictedSyntaxGroups.push(
			...appGuardrailsConfig.createRestrictedSyntaxGroups(appGuardrailsOptions),
		);
	}

	if (componentStructure) {
		finalConfig.push(
			...normalizeOptionConfig(
				componentStructure,
				componentStructureConfig.createComponentStructureConfig,
			),
		);
	}

	if (deprecatedApis) {
		finalConfig.push(
			...normalizeOptionConfig(
				deprecatedApis,
				deprecatedApisConfig.createDeprecatedApiConfig,
			),
		);
	}

	if (featureBoundaries) {
		finalConfig.push(
			...normalizeOptionConfig(
				featureBoundaries,
				featureBoundaryConfig.createFeatureBoundaryConfig,
			),
		);
	}

	if (inlineStyles && preset !== 'base') {
		finalConfig.push({
			files: ['**/*.tsx'],
			rules: {
				'react-native/no-inline-styles':
					inlineStyles === true ? 'warn' : inlineStyles,
			},
		});
	}

	if (nativeUi) {
		finalConfig.push(
			...normalizeOptionConfig(nativeUi, nativeUiConfig.createNativeUiConfig),
		);
	}

	if (reactCompiler) {
		finalConfig.push({ rules: { ...reactCompilerConfig.rules } });
	}

	if (reanimated) {
		const reanimatedOptions = reanimated === true ? undefined : reanimated;
		restrictedSyntaxGroups.push(
			...reanimatedConfig.createRestrictedSyntaxGroups(reanimatedOptions),
		);
	}

	if (semanticColors) {
		const semanticColorsOptions =
			semanticColors === true ? undefined : semanticColors;
		restrictedSyntaxGroups.push(
			...semanticColorsConfig.createRestrictedSyntaxGroups(
				semanticColorsOptions,
			),
		);
		postCompositionConfig.push(
			...semanticColorsConfig.createAllowConfig(semanticColorsOptions),
		);
	}

	if (storybook) {
		finalConfig.push(...storybookConfig);
	}

	if (worklets) {
		restrictedSyntaxGroups.push(...workletsConfig.restrictedSyntaxGroups);
	}

	if (restrictedSyntaxGroups.length > 0) {
		finalConfig.push(
			...createComposedRestrictedSyntaxConfigs(restrictedSyntaxGroups),
		);
	}

	if (postCompositionConfig.length > 0) {
		finalConfig.push(...postCompositionConfig);
	}

	if (typeChecked) {
		finalConfig.push(...createTypeCheckedConfigs());
	}

	if (prettier) {
		finalConfig.push(...prettierConfig);
	}

	if (strict) {
		finalConfig.push(
			{
				files: typeScriptFiles,
				rules: {
					...strictTypeScriptRules,
				},
			},
			{
				rules: {
					'no-console': 'error',
				},
			},
		);
	}

	return finalConfig;
}

const base = createConfig({ preset: 'base', prettier: false });
const config = createConfig();
const noPrettier = createConfig({ prettier: false });
const typed = createConfig({ typeChecked: true });
const typedNoPrettier = createConfig({
	typeChecked: true,
	prettier: false,
});
const strict = createConfig({ strict: true });
const strictNoPrettier = createConfig({
	strict: true,
	prettier: false,
});

module.exports = config;
module.exports.base = base;
module.exports.createConfig = createConfig;
module.exports.strict = strict;
module.exports.typed = typed;
module.exports.noPrettier = noPrettier;
module.exports.strictNoPrettier = strictNoPrettier;
module.exports.typedNoPrettier = typedNoPrettier;
module.exports.appGuardrails = appGuardrailsConfig;
module.exports.createAppGuardrailsConfig =
	appGuardrailsConfig.createAppGuardrailsConfig;
module.exports.componentStructure = componentStructureConfig.recommended;
module.exports.createComponentStructureConfig =
	componentStructureConfig.createComponentStructureConfig;
module.exports.deprecatedApis = deprecatedApisConfig.recommended;
module.exports.createDeprecatedApiConfig =
	deprecatedApisConfig.createDeprecatedApiConfig;
module.exports.createFeatureBoundaryConfig =
	featureBoundaryConfig.createFeatureBoundaryConfig;
module.exports.createNativeUiConfig = nativeUiConfig.createNativeUiConfig;
module.exports.featureBoundaries = featureBoundaryConfig.recommended;
module.exports.nativeUi = nativeUiConfig.recommended;
module.exports.reactCompiler = reactCompilerConfig;
module.exports.reanimated = reanimatedConfig;
module.exports.createReanimatedConfig = reanimatedConfig.createReanimatedConfig;
module.exports.semanticColors = semanticColorsConfig;
module.exports.createSemanticColorsConfig =
	semanticColorsConfig.createSemanticColorsConfig;
module.exports.storybook = storybookConfig;
module.exports.worklets = workletsConfig;
