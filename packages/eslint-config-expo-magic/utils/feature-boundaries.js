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

function dependencyFileSelector(category, captured) {
	const selector = { categories: category };

	if (captured) {
		selector.captured = captured;
	}

	return { to: { file: selector } };
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
			partialMatch: false,
			capture: ['entry'],
		},
		{
			type: 'feature-api',
			pattern: 'features/*/api/**/*',
			partialMatch: false,
			capture: ['feature', 'entry'],
		},
		{
			type: 'feature-atom',
			pattern: 'features/*/atoms/**/*',
			partialMatch: false,
			capture: ['feature', 'entry'],
		},
		{
			type: 'feature-screen',
			pattern: 'features/*/screens/**/*',
			partialMatch: false,
			capture: ['feature', 'entry'],
		},
		...sharedComponentPatterns.map((pattern) => ({
			type: 'feature-shared-component',
			pattern,
			partialMatch: false,
			capture: ['feature'],
		})),
		{
			type: 'feature-component',
			pattern: 'features/*/components/**/*',
			partialMatch: false,
			capture: ['feature', 'entry'],
		},
		{
			type: 'feature-hook',
			pattern: 'features/*/hooks/**/*',
			partialMatch: false,
			capture: ['feature', 'entry'],
		},
		{
			type: 'feature-private',
			pattern: 'features/*/**',
			partialMatch: false,
			capture: ['feature', 'entry'],
		},
		{
			type: 'service',
			pattern: 'services/**',
			partialMatch: false,
			capture: ['entry'],
		},
		{
			type: 'shared-hook',
			pattern: 'hooks/**',
			partialMatch: false,
			capture: ['entry'],
		},
		{
			type: 'uikit',
			pattern: 'uikit/**',
			partialMatch: false,
			capture: ['entry'],
		},
	];
}

function createDependencyRules(featureElementTypes) {
	const sameFeatureSelectors = createSameFeatureSelectors(featureElementTypes);
	const sameFeatureAtomFileSelector = dependencyFileSelector(
		'feature-atom',
		{ feature: '{{from.captured.feature}}' },
	);
	const anyFeatureAtomFileSelector = dependencyFileSelector('feature-atom');

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
				anyFeatureAtomFileSelector,
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
				anyFeatureAtomFileSelector,
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
				sameFeatureAtomFileSelector,
			],
		},
		{
			from: elementSelector('feature-shared-component'),
			allow: [
				dependencySelector('service'),
				dependencySelector('shared-hook'),
				dependencySelector('uikit'),
				...sameFeatureSelectors,
				sameFeatureAtomFileSelector,
			],
		},
		{
			from: elementSelector('feature-api'),
			allow: [
				dependencySelector('service'),
				dependencySelector('shared-hook'),
				dependencySelector('feature-api'),
				...sameFeatureSelectors,
				sameFeatureAtomFileSelector,
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
				sameFeatureAtomFileSelector,
			],
		},
	];
}

function createFeatureBoundaryConfig(options = {}) {
	const featureElementTypes = [
		...(options.featureElementTypes ?? defaultFeatureElementTypes),
		...(options.additionalFeatureElementTypes ?? []),
	];
	const sharedComponentPatterns = [
		...(options.sharedComponentPatterns ?? defaultSharedComponentPatterns),
		...(options.additionalSharedComponentPatterns ?? []),
	];

	return [
		{
			plugins: {
				boundaries: fixupPluginRules(boundaries),
			},
			settings: {
				'boundaries/elements': createElementSettings(sharedComponentPatterns),
				'boundaries/files': [
					{
						category: 'feature-atom',
						pattern: 'features/*/atoms.ts',
						capture: ['feature'],
					},
					{
						category: 'feature-atom',
						pattern: 'features/*/atoms.tsx',
						capture: ['feature'],
					},
				],
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
