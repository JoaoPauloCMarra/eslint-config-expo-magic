#!/usr/bin/env bun

// Records the oxlint configs and option errors the 5.x ESLint package produces
// for packages/bun-next/config-cases.js, converted with toOxlintConfig, so the
// Bun-only package can be compared against them after 5.x leaves the
// repository. Usage: bun scripts/record-config-expectations.js

const fs = require('node:fs');
const path = require('node:path');

const bunNextDirectory = path.resolve(__dirname, '../packages/bun-next');
const fiveXDirectory = path.resolve(
	__dirname,
	'../packages/eslint-config-expo-magic',
);
const {
	architectureOptionSets,
	expectationsDirectory,
	invalidOptions,
	profiles,
	withPackagePlaceholder,
} = require(path.join(bunNextDirectory, 'config-cases.js'));
const { createJsPluginOptions } = require(
	path.join(bunNextDirectory, 'utils/js-plugins.js'),
);
const { toOxlintConfig } = require(
	path.join(bunNextDirectory, 'utils/to-oxlint.js'),
);

const fiveX = {
	createConfig: require(fiveXDirectory).createConfig,
	createMobileAppConfig: require(path.join(fiveXDirectory, 'mobile-app.js'))
		.createMobileAppConfig,
	createArchitectureConfig: require(path.join(fiveXDirectory, 'architecture.js'))
		.createArchitectureConfig,
};

function convert(entries) {
	return withPackagePlaceholder(
		toOxlintConfig(entries, createJsPluginOptions(entries)),
	);
}

function write(name, value) {
	const file = path.join(expectationsDirectory, `${name}.json`);
	fs.mkdirSync(path.dirname(file), { recursive: true });
	fs.writeFileSync(file, `${JSON.stringify(value, null, '\t')}\n`);
}

function errorOf(build) {
	try {
		build();
	} catch (error) {
		return { type: error.constructor.name, message: error.message };
	}
	throw new Error('Expected the 5.x package to reject these options.');
}

function main() {
	fs.rmSync(expectationsDirectory, { recursive: true, force: true });

	for (const { name, factory, options } of profiles) {
		write(`profile-${name}`, convert(fiveX[factory](options)));
	}

	for (const { name, options } of architectureOptionSets) {
		const { base = {}, ...rest } = options;
		const baseConfig = fiveX.createConfig(base);
		write(
			`architecture-${name}`,
			convert([
				...baseConfig,
				...fiveX.createArchitectureConfig({ ...rest, baseConfig }),
			]),
		);
	}

	write(
		'validation',
		Object.fromEntries(
			Object.entries(invalidOptions).map(([factory, optionList]) => [
				factory,
				optionList.map((options) => ({
					options,
					error: errorOf(() => fiveX[factory](options)),
				})),
			]),
		),
	);

	console.log(`Recorded configs to ${path.relative(process.cwd(), expectationsDirectory)}`);
}

main();
