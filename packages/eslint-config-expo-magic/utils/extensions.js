const platformVariants = ['android', 'ios', 'web', 'native'];
const baseExtensions = [
	'.cjs',
	'.mjs',
	'.cts',
	'.mts',
	'.js',
	'.jsx',
	'.ts',
	'.tsx',
	'.d.cts',
	'.d.mts',
	'.d.ts',
];

const platformExtensions = platformVariants.flatMap((platform) =>
	baseExtensions.map((extension) => `.${platform}${extension}`),
);

module.exports = [...platformExtensions, ...baseExtensions];
