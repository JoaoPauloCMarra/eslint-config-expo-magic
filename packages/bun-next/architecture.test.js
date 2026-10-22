const { describe, expect, test } = require('bun:test');
const path = require('node:path');

const { createArchitectureConfig } = require('./architecture.js');
const { createJsPluginOptions } = require('./utils/js-plugins.js');
const { toOxlintConfig } = require('./utils/to-oxlint.js');

const fiveXDirectory = path.resolve(__dirname, '../eslint-config-expo-magic');
const fiveX = {
	createConfig: require(fiveXDirectory).createConfig,
	createArchitectureConfig: require(
		path.join(fiveXDirectory, 'architecture.js'),
	).createArchitectureConfig,
};

const optionSets = [
	{
		name: 'README example',
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
	{
		name: 'defaults with the default preset',
		options: { base: {} },
	},
	{
		name: 'bare layers with semantic colors',
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
		name: 'nativeUi variants',
		options: {
			base: {
				preset: 'base',
				prettier: false,
				nativeUi: {
					additionalRestrictions: [
						{
							name: 'react-native',
							importNames: ['Switch'],
							message: 'Use the owned toggle.',
						},
					],
				},
			},
			nativeUi: {
				additionalRestrictions: [
					{
						name: 'react-native',
						importNames: ['Switch'],
						message: 'Use the owned toggle.',
					},
				],
				allowFiles: ['src/uikit/components/toggle/*.tsx'],
			},
			nativeWrappers: ['src/uikit/wrappers/*.tsx'],
		},
	},
	{
		name: 'nativeUi boolean and restrictions override',
		options: {
			base: { preset: 'fast', prettier: false },
			nativeUi: {
				restrictions: [{ name: 'react-native', importNames: ['Image'] }],
			},
		},
	},
	{
		name: 'tokenModule as layer directory, srcRoot and aliasPrefix',
		options: {
			base: { preset: 'base', prettier: false },
			tokenModule: 'uikit/tokens',
			srcRoot: 'source',
			aliasPrefix: '~',
			loggerModule: 'lib/log',
		},
	},
	{
		name: 'extra restrictions and agent base',
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

describe('bun-next createArchitectureConfig matches 5.x through the converter', () => {
	for (const { name, options } of optionSets) {
		test(name, () => {
			const { base, ...rest } = options;
			const fiveXBase = fiveX.createConfig(base);
			const entries = [
				...fiveXBase,
				...fiveX.createArchitectureConfig({ ...rest, baseConfig: fiveXBase }),
			];
			const expected = toOxlintConfig(entries, createJsPluginOptions(entries));

			expect(createArchitectureConfig(options)).toEqual(expected);
			expect(expected.overrides.length).toBeGreaterThan(0);
		});
	}

	test('base defaults to an empty createConfig options object', () => {
		expect(createArchitectureConfig()).toEqual(
			createArchitectureConfig({ base: {} }),
		);
	});
});

describe('bun-next createArchitectureConfig rejects baseConfig', () => {
	test('throws a TypeError that points to base', () => {
		expect(() => createArchitectureConfig({ baseConfig: [] })).toThrow(
			TypeError,
		);
		expect(() => createArchitectureConfig({ baseConfig: [] })).toThrow(
			/Pass base \(the createConfig options object\) instead/,
		);
	});
});

describe('bun-next createArchitectureConfig validates options like 5.x', () => {
	const cases = [
		{
			name: 'non-object options (array)',
			options: [],
			message: 'createArchitectureConfig options must be an object.',
		},
		{
			name: 'non-object options (null)',
			options: null,
			message: 'createArchitectureConfig options must be an object.',
		},
		{
			name: 'non-object options (string)',
			options: 'x',
			message: 'createArchitectureConfig options must be an object.',
		},
		...['routes', 'ui', 'tokens', 'components'].flatMap((key) => [
			{
				name: `empty layers.${key}`,
				options: { layers: { [key]: '' } },
				message: `createArchitectureConfig layers.${key} must be a non-empty string.`,
			},
			{
				name: `non-string layers.${key}`,
				options: { layers: { [key]: 1 } },
				message: `createArchitectureConfig layers.${key} must be a non-empty string.`,
			},
		]),
		{
			name: 'nativeUi that is not an object',
			options: { nativeUi: 'yes' },
			message: 'createArchitectureConfig nativeUi must be an object.',
		},
		{
			name: 'nativeUi that is an array',
			options: { nativeUi: [] },
			message: 'createArchitectureConfig nativeUi must be an object.',
		},
		{
			name: 'nativeUi that is null',
			options: { nativeUi: null },
			message: 'createArchitectureConfig nativeUi must be an object.',
		},
	];

	for (const { name, options, message } of cases) {
		test(name, () => {
			let fiveXError;
			try {
				fiveX.createArchitectureConfig(options);
			} catch (error) {
				fiveXError = error;
			}
			expect(fiveXError).toBeInstanceOf(TypeError);
			if (message) expect(fiveXError.message).toBe(message);

			let error;
			try {
				createArchitectureConfig(options);
			} catch (caught) {
				error = caught;
			}
			expect(error).toBeInstanceOf(TypeError);
			expect(error.message).toBe(fiveXError.message);
		});
	}
});
