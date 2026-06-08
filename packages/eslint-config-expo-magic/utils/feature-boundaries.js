const { fixupPluginRules } = require('@eslint/compat');
const boundaries = require('eslint-plugin-boundaries');

const defaultFeatureElementTypes = [
	'feature-api',
	'feature-atom',
	'feature-screen',
	'feature-shared-component',
	'feature-component',
	'feature-hook',
	'feature-private',
];

const defaultSharedComponentPatterns = [];

function elementSelector(type, captured) {
	return captured ? { type, captured } : { type };
}

function dependencySelector(type, captured) {
	return { to: elementSelector(type, captured) };
}

function createSameFeatureSelectors(featureElementTypes) {
	return featureElementTypes.map((type) =>
		dependencySelector(type, { feature: '{{from.captured.feature}}' }),
	);
}

function createElementSettings(sharedComponentPatterns) {
	return [
		{
			type: 'app',
			pattern: 'app/**',
			mode: 'full',
			capture: ['entry'],
		},
		{
			type: 'feature-api',
			pattern: 'features/*/api/**/*',
			mode: 'full',
			capture: ['feature', 'entry'],
		},
		{
			type: 'feature-atom',
			pattern: 'features/*/atoms.ts',
			mode: 'full',
			capture: ['feature'],
		},
		{
			type: 'feature-atom',
			pattern: 'features/*/atoms.tsx',
			mode: 'full',
			capture: ['feature'],
		},
		{
			type: 'feature-atom',
			pattern: 'features/*/atoms/**/*',
			mode: 'full',
			capture: ['feature', 'entry'],
		},
		{
			type: 'feature-screen',
			pattern: 'features/*/screens/**/*',
			mode: 'full',
			capture: ['feature', 'entry'],
		},
		...sharedComponentPatterns.map((pattern) => ({
			type: 'feature-shared-component',
			pattern,
			mode: 'full',
			capture: ['feature'],
		})),
		{
			type: 'feature-component',
			pattern: 'features/*/components/**/*',
			mode: 'full',
			capture: ['feature', 'entry'],
		},
		{
			type: 'feature-hook',
			pattern: 'features/*/hooks/**/*',
			mode: 'full',
			capture: ['feature', 'entry'],
		},
		{
			type: 'feature-private',
			pattern: 'features/*/**',
			mode: 'full',
			capture: ['feature', 'entry'],
		},
		{
			type: 'service',
			pattern: 'services/**',
			mode: 'full',
			capture: ['entry'],
		},
		{
			type: 'shared-hook',
			pattern: 'hooks/**',
			mode: 'full',
			capture: ['entry'],
		},
		{
			type: 'uikit',
			pattern: 'uikit/**',
			mode: 'full',
			capture: ['entry'],
		},
	];
}

function createDependencyRules(featureElementTypes) {
	const sameFeatureSelectors = createSameFeatureSelectors(featureElementTypes);

	return [
		{
			from: elementSelector('app'),
			allow: [
				dependencySelector('app'),
				dependencySelector('service'),
				dependencySelector('shared-hook'),
				dependencySelector('uikit'),
				dependencySelector('feature-api'),
				dependencySelector('feature-atom'),
				dependencySelector('feature-screen'),
				dependencySelector('feature-shared-component'),
				dependencySelector('feature-component'),
				dependencySelector('feature-hook'),
			],
		},
		{
			from: elementSelector('service'),
			allow: [
				dependencySelector('service'),
				dependencySelector('shared-hook'),
				dependencySelector('uikit'),
			],
		},
		{
			from: elementSelector('shared-hook'),
			allow: [
				dependencySelector('service'),
				dependencySelector('shared-hook'),
				dependencySelector('uikit'),
				dependencySelector('feature-api'),
				dependencySelector('feature-atom'),
			],
		},
		{
			from: elementSelector('uikit'),
			allow: [
				dependencySelector('service'),
				dependencySelector('shared-hook'),
				dependencySelector('uikit'),
			],
		},
		{
			from: elementSelector('feature-atom'),
			allow: [
				dependencySelector('service'),
				dependencySelector('shared-hook'),
				dependencySelector('uikit'),
				...sameFeatureSelectors,
			],
		},
		{
			from: elementSelector('feature-shared-component'),
			allow: [
				dependencySelector('service'),
				dependencySelector('shared-hook'),
				dependencySelector('uikit'),
				...sameFeatureSelectors,
			],
		},
		{
			from: elementSelector('feature-api'),
			allow: [
				dependencySelector('service'),
				dependencySelector('shared-hook'),
				dependencySelector('feature-api'),
				...sameFeatureSelectors,
			],
		},
		{
			from: [
				elementSelector('feature-screen'),
				elementSelector('feature-component'),
				elementSelector('feature-hook'),
				elementSelector('feature-private'),
			],
			allow: [
				dependencySelector('service'),
				dependencySelector('shared-hook'),
				dependencySelector('uikit'),
				dependencySelector('feature-api'),
				dependencySelector('feature-screen'),
				dependencySelector('feature-shared-component'),
				...sameFeatureSelectors,
			],
		},
	];
}

function createFeatureBoundaryConfig(options = {}) {
	const featureElementTypes =
		options.featureElementTypes ?? defaultFeatureElementTypes;
	const sharedComponentPatterns =
		options.sharedComponentPatterns ?? defaultSharedComponentPatterns;

	return [
		{
			plugins: {
				boundaries: fixupPluginRules(boundaries),
			},
			settings: {
				'boundaries/elements': createElementSettings(sharedComponentPatterns),
			},
			rules: {
				'boundaries/dependencies': [
					'error',
					{
						default: 'disallow',
						rules: createDependencyRules(featureElementTypes),
					},
				],
			},
		},
	];
}

const recommended = createFeatureBoundaryConfig();

module.exports = {
	createFeatureBoundaryConfig,
	defaultFeatureElementTypes,
	recommended,
};
