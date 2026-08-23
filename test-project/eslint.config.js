const { createConfig } = require('eslint-config-expo-magic');

module.exports = [
	...createConfig({ prettier: true, testing: true }),
	// Add any custom overrides for testing here
	{
		ignores: [
			'node_modules/**',
			'dist/**',
			'build/**',
			'.env*',
			'.vscode/**',
			'.idea/**',
			'.DS_Store',
			'Thumbs.db',
			'*.log',
			'npm-debug.log*',
			'yarn-debug.log*',
			'yarn-error.log*',
			'package-lock.json',
			'preset-fixtures/**',
			'yarn.lock',
			'pnpm-lock.yaml',
		],
	},
];
