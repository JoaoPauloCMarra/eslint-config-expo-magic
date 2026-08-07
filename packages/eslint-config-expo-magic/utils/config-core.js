const globals = require('globals');
const { fixupConfigRules } = require('@eslint/compat');
const {
	createTypeScriptImportResolver,
} = require('eslint-import-resolver-typescript');
const expoConfig = require('eslint-config-expo/flat');
const { createNodeResolver } = require('eslint-plugin-import-x');
const tseslint = require('typescript-eslint');

const allExtensions = require('./extensions.js');
const { typeScriptFiles } = require('./file-patterns.js');

const legacyTypeScriptFiles = new Set(['**/*.ts', '**/*.tsx', '**/*.d.ts']);

const defaultTsconfigProjectGlobs = [
	'./tsconfig.json',
	'./apps/*/tsconfig.json',
	'./packages/*/tsconfig.json',
	'./test-project/tsconfig.json',
];
const fastTsconfigProjectGlobs = ['./tsconfig.json'];

const defaultIgnorePatterns = [
	'**/node_modules/**',
	'**/dist/**',
	'**/build/**',
	'**/.expo/**',
	'**/ios/**',
	'**/android/**',
];

const strictTypeScriptRules = {
	'@typescript-eslint/no-explicit-any': 'error',
	'@typescript-eslint/no-non-null-assertion': 'error',
	'@typescript-eslint/await-thenable': 'error',
	'@typescript-eslint/no-floating-promises': 'error',
	'@typescript-eslint/no-misused-promises': 'error',
};

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

function createTypeCheckedConfigs(
	tsconfigProjects = defaultTsconfigProjectGlobs,
) {
	const seenConfigNames = new Set();
	const usesDefaultProjects =
		tsconfigProjects === defaultTsconfigProjectGlobs ||
		JSON.stringify(tsconfigProjects) ===
			JSON.stringify(defaultTsconfigProjectGlobs);

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
						...(usesDefaultProjects
							? { projectService: true }
							: { project: tsconfigProjects }),
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
	{
		extraIgnores = [],
		importCycles = true,
		testing = true,
		typeAware = true,
	} = {},
) {
	return [
		...createBasePreset(tsconfigProjects, extraIgnores),
		...require('./typescript.js').createTypeScriptConfig({
			typeChecked: typeAware,
		}),
		...require('./react.js'),
		...require('./imports.js').createImportConfig({ noCycle: importCycles }),
		...require('./app.js'),
		...(testing ? require('./jest.js') : []),
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
}

module.exports = {
	createBasePreset,
	createDefaultPreset,
	createTypeCheckedConfigs,
	defaultTsconfigProjectGlobs,
	fastTsconfigProjectGlobs,
	normalizeOptionConfig,
	strictTypeScriptRules,
	typeScriptFiles,
};
