// Snapshots every external preset and rule table that the 5.x utils consume
// into packages/bun-next/utils/external-config.json, so the Bun-only package
// has no runtime dependency on eslint-config-expo, typescript-eslint and the
// other plugin packages. Plugin objects become `true`; parser objects and
// functions are dropped; everything else is kept verbatim.

const fs = require('node:fs');
const { createRequire } = require('node:module');
const path = require('node:path');

const packageDir = path.resolve(
	__dirname,
	'../packages/eslint-config-expo-magic',
);
const outputFile = path.resolve(
	__dirname,
	'../packages/bun-next/utils/external-config.json',
);
const requireFromPackage = createRequire(path.join(packageDir, 'package.json'));

function isPlainObject(value) {
	return (
		value !== null &&
		typeof value === 'object' &&
		Object.getPrototypeOf(value) === Object.prototype
	);
}

function sanitizeValue(value, location) {
	if (typeof value === 'function') return undefined;
	if (Array.isArray(value)) {
		return value
			.map((item, index) => sanitizeValue(item, `${location}[${index}]`))
			.filter((item) => item !== undefined);
	}
	if (isPlainObject(value)) {
		const result = {};
		for (const [key, item] of Object.entries(value)) {
			const sanitized = sanitizeValue(item, `${location}.${key}`);
			if (sanitized !== undefined) result[key] = sanitized;
		}
		return result;
	}
	if (value !== null && typeof value === 'object') {
		throw new Error(`Cannot snapshot non-plain object at ${location}.`);
	}

	return value;
}

function sanitizeEntry(entry, location) {
	const { plugins, languageOptions, ...rest } = entry;
	const result = {};

	for (const [key, value] of Object.entries(entry)) {
		if (key === 'plugins') {
			result.plugins = Object.fromEntries(
				Object.keys(plugins).map((name) => [name, true]),
			);
		} else if (key === 'languageOptions') {
			const { parser: _parser, ...options } = languageOptions;
			result.languageOptions = sanitizeValue(options, `${location}.${key}`);
		} else {
			result[key] = sanitizeValue(rest[key], `${location}.${key}`);
		}
	}

	return result;
}

function sanitizeEntries(entries, location) {
	return entries.map((entry, index) =>
		sanitizeEntry(entry, `${location}[${index}]`),
	);
}

function load(name) {
	return requireFromPackage(name);
}

function buildSnapshot() {
	const expoConfig = load('eslint-config-expo/flat');
	const tseslint = load('typescript-eslint');
	const importX = load('eslint-plugin-import-x');
	const reactHooks = load('eslint-plugin-react-hooks');
	const jest = load('eslint-plugin-jest');
	const prettierConfig = load('eslint-config-prettier/flat');
	const globals = load('globals');

	return {
		expo: sanitizeEntries(expoConfig, 'expo'),
		typescriptEslint: {
			recommendedTypeChecked: sanitizeEntries(
				tseslint.configs.recommendedTypeChecked,
				'typescriptEslint.recommendedTypeChecked',
			),
			stylisticTypeChecked: sanitizeEntries(
				tseslint.configs.stylisticTypeChecked,
				'typescriptEslint.stylisticTypeChecked',
			),
		},
		importX: {
			recommended: {
				rules: sanitizeValue(
					importX.configs.recommended.rules,
					'importX.recommended.rules',
				),
				settings: sanitizeValue(
					importX.configs.recommended.settings,
					'importX.recommended.settings',
				),
			},
			typescript: {
				rules: sanitizeValue(
					importX.configs.typescript.rules,
					'importX.typescript.rules',
				),
				settings: sanitizeValue(
					importX.configs.typescript.settings,
					'importX.typescript.settings',
				),
			},
		},
		reactHooks: {
			recommendedRules: sanitizeValue(
				reactHooks.configs.flat.recommended.rules,
				'reactHooks.recommendedRules',
			),
		},
		jest: {
			recommendedRules: sanitizeValue(
				jest.configs.recommended.rules,
				'jest.recommendedRules',
			),
			globals: sanitizeValue(jest.environments.globals.globals, 'jest.globals'),
		},
		prettier: sanitizeEntry(prettierConfig, 'prettier'),
		globals: {
			browser: sanitizeValue(globals.browser, 'globals.browser'),
			node: sanitizeValue(globals.node, 'globals.node'),
		},
	};
}

function main() {
	const snapshot = buildSnapshot();

	fs.writeFileSync(outputFile, `${JSON.stringify(snapshot, null, '\t')}\n`);
	console.log(`Wrote ${path.relative(process.cwd(), outputFile)}`);
}

if (require.main === module) main();

module.exports = { buildSnapshot };
