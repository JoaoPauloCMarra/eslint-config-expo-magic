// Entry modules export the config as the ES default plus named factories, so
// `import config from` and `import { createConfig } from` both work, and the
// config object itself carries no extra keys that oxlint would reject.
function presetModule(build, named = {}) {
	const moduleExports = { __esModule: true, ...named };
	let config;

	Object.defineProperty(moduleExports, 'default', {
		enumerable: true,
		get() {
			config ??= build();
			return config;
		},
	});

	return moduleExports;
}

module.exports = { presetModule };
