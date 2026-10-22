// Option sets whose configs and validation errors were recorded from the 5.x
// ESLint package with scripts/record-config-expectations.js
// (__expectations__/configs). Test-only; not shipped.

const path = require('node:path');

const profiles = require('../../test-project/bun-golden/profiles.js');

const nativeUiSwitch = {
	name: 'react-native',
	importNames: ['Switch'],
	message: 'Use the owned toggle.',
};

const architectureOptionSets = [
	{
		name: 'readme-example',
		options: {
			base: { preset: 'base', prettier: false, nativeUi: true },
			layers: {
				routes: 'app',
				ui: 'uikit',
				tokens: 'uikit/tokens',
				components: 'uikit/components',
			},
		},
	},
	{ name: 'defaults', options: { base: {} } },
	{
		name: 'bare-layers-semantic-colors',
		options: {
			base: {
				preset: 'base',
				prettier: false,
				semanticColors: {
					allowFiles: ['**/src/shared/theme/colors.ts'],
					tokenModule: 'shared/theme/colors',
				},
				nativeUi: true,
			},
			layers: {
				routes: 'core',
				ui: 'shared',
				tokens: 'shared/theme',
				components: 'shared/ui',
			},
		},
	},
	{
		name: 'native-ui-variants',
		options: {
			base: {
				preset: 'base',
				prettier: false,
				nativeUi: { additionalRestrictions: [nativeUiSwitch] },
			},
			nativeUi: {
				additionalRestrictions: [nativeUiSwitch],
				allowFiles: ['src/uikit/components/toggle/*.tsx'],
			},
			nativeWrappers: ['src/uikit/wrappers/*.tsx'],
		},
	},
	{
		name: 'native-ui-restrictions-override',
		options: {
			base: { preset: 'fast', prettier: false },
			nativeUi: {
				restrictions: [{ name: 'react-native', importNames: ['Image'] }],
			},
		},
	},
	{
		name: 'token-module-src-root-alias',
		options: {
			base: { preset: 'base', prettier: false },
			tokenModule: 'uikit/tokens',
			srcRoot: 'source',
			aliasPrefix: '~',
			loggerModule: 'lib/log',
		},
	},
	{
		name: 'extra-restrictions-agent-base',
		options: {
			base: { preset: 'fast', agent: true },
			extraNativeUiRestrictions: [
				{
					name: 'react-native',
					importNames: ['Modal'],
					message: 'Use the owned modal.',
				},
			],
			extraNativeLibPatterns: [
				{ group: ['react-native-maps'], message: 'Use the map wrapper.' },
			],
			tokenModule: 'uikit/tokens/palette',
		},
	},
];

const invalidOptions = {
	createConfig: [
		null,
		[],
		{ preset: 'nope' },
		{ prettier: 'yes' },
		{ agent: 'yes' },
		{ tsconfigProjects: [1] },
		{ inlineStyles: 'loud' },
	],
	createMobileAppConfig: [{ preset: 'nope' }],
	createArchitectureConfig: [
		[],
		null,
		'x',
		...['routes', 'ui', 'tokens', 'components'].flatMap((key) => [
			{ layers: { [key]: '' } },
			{ layers: { [key]: 1 } },
		]),
		{ nativeUi: 'yes' },
		{ nativeUi: [] },
		{ nativeUi: null },
	],
};

// Port paths in jsPlugins and typeChecked's tsconfigRootDir (the cwd) are
// absolute; record them relative to the package and the cwd.
function withPackagePlaceholder(config) {
	return JSON.parse(
		JSON.stringify(config)
			.replaceAll(__dirname, '<package>')
			.replaceAll(process.cwd(), '<cwd>'),
	);
}

const expectationsDirectory = path.join(__dirname, '__expectations__', 'configs');

module.exports = {
	architectureOptionSets,
	expectationsDirectory,
	invalidOptions,
	profiles,
	withPackagePlaceholder,
};
