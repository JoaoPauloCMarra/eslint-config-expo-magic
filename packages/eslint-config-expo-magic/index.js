const globals = require('globals');
const { fixupConfigRules } = require('@eslint/compat');
const {
	createTypeScriptImportResolver,
} = require('eslint-import-resolver-typescript');
const expoConfig = require('eslint-config-expo/flat');
const { createNodeResolver } = require('eslint-plugin-import-x');
const tseslint = require('typescript-eslint');

const appConfig = require('./utils/app.js');
const allExtensions = require('./utils/extensions.js');
const importsConfig = require('./utils/imports.js');
const jestConfig = require('./utils/jest.js');
const prettierConfig = require('./utils/prettier.js');
const reactConfig = require('./utils/react.js');
const typescriptConfig = require('./utils/typescript.js');

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

const tsconfigProjectGlobs = [
	'./tsconfig.json',
	'./apps/*/tsconfig.json',
	'./packages/*/tsconfig.json',
	'./test-project/tsconfig.json',
];

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

const typescriptImportResolver = {
	alwaysTryTypes: true,
	bun: true,
	noWarnOnMultipleProjects: true,
	project: tsconfigProjectGlobs,
	tsconfigRootDir: process.cwd(),
};

const filteredExpoConfig = fixupConfigRules(createExpoBaseConfig());

const importXResolvers = [
	createTypeScriptImportResolver(typescriptImportResolver),
	createNodeResolver({ extensions: allExtensions }),
];

const baseConfig = [
	{
		ignores: [
			'**/node_modules/**',
			'**/dist/**',
			'**/build/**',
			'**/.expo/**',
			'**/ios/**',
			'**/android/**',
		],
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
	...typescriptConfig,
	...reactConfig,
	...importsConfig,
	...jestConfig,
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

const config = [...baseConfig, ...prettierConfig];
const typeCheckedConfig = createTypeCheckedConfigs();
const typed = [...baseConfig, ...typeCheckedConfig, ...prettierConfig];

const strictTypeScriptRules = {
	'@typescript-eslint/no-explicit-any': 'error',
	'@typescript-eslint/no-non-null-assertion': 'error',
	'@typescript-eslint/await-thenable': 'error',
	'@typescript-eslint/no-floating-promises': 'error',
	'@typescript-eslint/no-misused-promises': 'error',
};

const strict = [
	...config,
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
];

const strictNoPrettier = [
	...baseConfig,
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
];

const typedNoPrettier = [...baseConfig, ...typeCheckedConfig];

module.exports = config;
module.exports.strict = strict;
module.exports.typed = typed;
module.exports.noPrettier = baseConfig;
module.exports.strictNoPrettier = strictNoPrettier;
module.exports.typedNoPrettier = typedNoPrettier;
