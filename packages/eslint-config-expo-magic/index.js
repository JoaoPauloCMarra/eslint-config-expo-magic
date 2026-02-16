const globals = require('globals');
const {
	fixupConfigRules,
	fixupPluginRules,
} = require('@eslint/compat');
const typescriptPlugin = require('@typescript-eslint/eslint-plugin');
const expoConfig = require('eslint-config-expo/flat');
const {
	allExtensions,
} = require('eslint-config-expo/flat/utils/extensions.js');

const appConfig = require('./utils/app.js');
const importsConfig = require('./utils/imports.js');
const jestConfig = require('./utils/jest.js');
const prettierConfig = require('./utils/prettier.js');
const reactConfig = require('./utils/react.js');

const typescriptConfig = require('./utils/typescript.js');

const filteredExpoConfig = fixupConfigRules(
	expoConfig.filter(
		(c) => !c.plugins || !c.plugins['react-hooks'],
	),
);

const tsconfigProjectGlobs = [
	'./tsconfig.json',
	'./apps/*/tsconfig.json',
	'./packages/*/tsconfig.json',
	'./test-project/tsconfig.json',
];

const typescriptImportResolver = {
	alwaysTryTypes: true,
	project: tsconfigProjectGlobs,
	tsconfigRootDir: process.cwd(),
};

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
		files: [
			'**/*.ts',
			'**/*.tsx',
			'**/*.d.ts',
			'**/*.mts',
			'**/*.cts',
		],
		plugins: {
			'@typescript-eslint': fixupPluginRules(typescriptPlugin),
		},
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
		files: [
			'**/*.ts',
			'**/*.tsx',
			'**/*.d.ts',
			'**/*.mts',
			'**/*.cts',
		],
		plugins: {
			'@typescript-eslint': fixupPluginRules(typescriptPlugin),
		},
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

module.exports = config;
module.exports.strict = strict;
module.exports.noPrettier = baseConfig;
module.exports.strictNoPrettier = strictNoPrettier;
