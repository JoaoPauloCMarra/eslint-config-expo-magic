const agentGuardrailsConfig = require('./agent-guardrails.js');
const appGuardrailsConfig = require('./app-guardrails.js');
const componentStructureConfig = require('./component-structure.js');
const deprecatedApisConfig = require('./deprecated-apis.js');
const featureBoundaryConfig = require('./feature-boundaries.js');
const nativeUiConfig = require('./native-ui.js');
const prettierConfig = require('./prettier.js');
const reactCompilerConfig = require('./react-compiler.js');
const reanimatedConfig = require('./reanimated.js');
const semanticColorsConfig = require('./semantic-colors.js');
const storybookConfig = require('./storybook.js');
const workletsConfig = require('./worklets.js');
const {
	createBasePreset,
	createDefaultPreset,
	createTypeCheckedConfigs,
	defaultTsconfigProjectGlobs,
	fastTsconfigProjectGlobs,
	normalizeOptionConfig,
	strictTypeScriptRules,
	typeScriptFiles,
} = require('./config-core.js');
const {
	createComposedRestrictedSyntaxConfigs,
} = require('./restricted-syntax.js');

const validRuleSeverities = new Set([0, 1, 2, 'off', 'warn', 'error']);

const booleanOptions = [
	'prettier',
	'testing',
	'typeChecked',
	'strict',
	'importCycles',
	'reactCompiler',
	'storybook',
	'worklets',
];

const objectOptions = [
	'agent',
	'appGuardrails',
	'componentStructure',
	'deprecatedApis',
	'featureBoundaries',
	'nativeUi',
	'reanimated',
	'semanticColors',
];

function isPlainObject(value) {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function validateBooleanOptions(options) {
	for (const optionName of booleanOptions) {
		if (
			options[optionName] !== undefined &&
			typeof options[optionName] !== 'boolean'
		) {
			throw new TypeError(`createConfig ${optionName} must be a boolean.`);
		}
	}
}

function validateObjectOptions(options) {
	for (const optionName of objectOptions) {
		const value = options[optionName];
		if (
			value !== undefined &&
			value !== false &&
			value !== true &&
			!isPlainObject(value)
		) {
			throw new TypeError(
				`createConfig ${optionName} must be false, true, or an options object.`,
			);
		}
	}
}

function validateCreateConfigOptions(options) {
	if (
		options === null ||
		typeof options !== 'object' ||
		Array.isArray(options)
	) {
		throw new TypeError('createConfig options must be an object.');
	}

	validateBooleanOptions(options);
	validateObjectOptions(options);

	for (const optionName of ['tsconfigProjects', 'extraIgnores']) {
		const value = options[optionName];
		if (
			value !== undefined &&
			(!Array.isArray(value) ||
				value.some((entry) => typeof entry !== 'string'))
		) {
			throw new TypeError(
				`createConfig ${optionName} must be an array of strings.`,
			);
		}
	}

	if (
		options.preset !== undefined &&
		!['base', 'default', 'fast'].includes(options.preset)
	) {
		throw new RangeError(
			`Unknown createConfig preset: ${String(options.preset)}. Use "base", "default", or "fast".`,
		);
	}

	if (
		options.inlineStyles !== undefined &&
		options.inlineStyles !== false &&
		options.inlineStyles !== true &&
		!validRuleSeverities.has(options.inlineStyles)
	) {
		throw new TypeError(
			'createConfig inlineStyles must be false, true, or an ESLint rule severity.',
		);
	}
}

function resolveAgentAwareOption(
	optionValue,
	optionName,
	defaultValue,
	options,
	agent,
	agentOptions,
) {
	if (!agent) {
		return optionValue;
	}

	if (
		agent !== true &&
		Object.prototype.hasOwnProperty.call(agentOptions, optionName)
	) {
		return agentOptions[optionName];
	}

	if (Object.prototype.hasOwnProperty.call(options, optionName)) {
		return optionValue;
	}

	return defaultValue;
}

function createConfig(options = {}) {
	validateCreateConfigOptions(options);

	const {
		preset = 'default',
		prettier = preset === 'default',
		testing = preset !== 'base',
		typeChecked = false,
		strict = false,
		tsconfigProjects = preset === 'fast'
			? fastTsconfigProjectGlobs
			: defaultTsconfigProjectGlobs,
		extraIgnores = [],
		importCycles = preset !== 'fast',
		agent = false,
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
	const typeAware = preset !== 'fast' || typeChecked || strict;
	const restrictedSyntaxGroups = [];
	const agentOptions = agent === true ? {} : agent || {};
	const agentEnabled = Boolean(agent);
	const effectiveAppGuardrails = resolveAgentAwareOption(
		appGuardrails,
		'appGuardrails',
		true,
		options,
		agent,
		agentOptions,
	);
	const effectiveDeprecatedApis = resolveAgentAwareOption(
		deprecatedApis,
		'deprecatedApis',
		true,
		options,
		agent,
		agentOptions,
	);
	const effectiveReactCompiler = resolveAgentAwareOption(
		reactCompiler,
		'reactCompiler',
		typeAware,
		options,
		agent,
		agentOptions,
	);
	const effectiveReanimated = resolveAgentAwareOption(
		reanimated,
		'reanimated',
		true,
		options,
		agent,
		agentOptions,
	);
	const effectiveSemanticColors = resolveAgentAwareOption(
		semanticColors,
		'semanticColors',
		false,
		options,
		agent,
		agentOptions,
	);
	const effectiveWorklets = resolveAgentAwareOption(
		worklets,
		'worklets',
		true,
		options,
		agent,
		agentOptions,
	);

	const presetConfig =
		preset === 'base'
			? createBasePreset(tsconfigProjects, extraIgnores)
			: createDefaultPreset(tsconfigProjects, {
					extraIgnores,
					importCycles,
					testing,
					typeAware,
				});
	const finalConfig = [...presetConfig];

	if (effectiveAppGuardrails) {
		const appGuardrailsOptions =
			effectiveAppGuardrails === true ? undefined : effectiveAppGuardrails;
		finalConfig.push(...appGuardrailsConfig.base);
		restrictedSyntaxGroups.push(
			...appGuardrailsConfig.createRestrictedSyntaxGroups(appGuardrailsOptions),
		);
	}

	if (agentEnabled) {
		finalConfig.push(
			...(typeAware
				? agentGuardrailsConfig.base
				: agentGuardrailsConfig.syntaxBase),
		);
		restrictedSyntaxGroups.push(
			...agentGuardrailsConfig.restrictedSyntaxGroups,
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

	if (effectiveDeprecatedApis) {
		finalConfig.push(
			...normalizeOptionConfig(
				effectiveDeprecatedApis,
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

	if (effectiveReactCompiler) {
		finalConfig.push({ rules: { ...reactCompilerConfig.rules } });
	}

	if (effectiveReanimated) {
		const reanimatedOptions =
			effectiveReanimated === true ? undefined : effectiveReanimated;
		finalConfig.push(...reanimatedConfig.createSharedValueUsageConfig());
		restrictedSyntaxGroups.push(
			...reanimatedConfig.createRestrictedSyntaxGroups(reanimatedOptions),
		);
	}

	if (effectiveSemanticColors) {
		const semanticColorsOptions =
			effectiveSemanticColors === true ? undefined : effectiveSemanticColors;
		restrictedSyntaxGroups.push(
			...semanticColorsConfig.createRestrictedSyntaxGroups(
				semanticColorsOptions,
			),
		);
	}

	if (storybook) {
		finalConfig.push(...storybookConfig);
	}

	if (effectiveWorklets) {
		restrictedSyntaxGroups.push(...workletsConfig.restrictedSyntaxGroups);
	}

	if (restrictedSyntaxGroups.length > 0) {
		finalConfig.push(
			...createComposedRestrictedSyntaxConfigs(restrictedSyntaxGroups),
		);
	}

	if (typeChecked) {
		finalConfig.push(...createTypeCheckedConfigs(tsconfigProjects));
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

module.exports = {
	createConfig,
	validateCreateConfigOptions,
};
