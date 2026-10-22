// Converts flat-config entries (rule data only) into one oxlint config object
// for `bun lint`. Each entry becomes an override in the same order, so later
// entries win exactly as in ESLint flat config.

const renamedPrefixes = {
	'@typescript-eslint': 'typescript',
	'import-x': 'import',
};

// Rule prefix -> oxlint plugin that Bun runs natively.
const nativePlugins = {
	typescript: 'typescript',
	react: 'react',
	'react-hooks': 'react',
	import: 'import',
	jest: 'jest',
};

const builtInPrefixes = new Set(['bun']);

function ruleName(name) {
	if (name === 'prettier/prettier') return 'bun/format';

	const slash = name.lastIndexOf('/');
	if (slash === -1) return name;

	const prefix = name.slice(0, slash);

	return `${renamedPrefixes[prefix] ?? prefix}/${name.slice(slash + 1)}`;
}

function rulePrefix(name) {
	const slash = name.lastIndexOf('/');

	return slash === -1 ? null : name.slice(0, slash);
}

function normalizeGlobals(globals) {
	return Object.fromEntries(
		Object.entries(globals).map(([name, value]) => [
			name,
			value === 'writable' || value === 'writeable' ? 'writable' : 'readonly',
		]),
	);
}

// Bun resolves with tsconfig paths by default; only the node resolver's
// extension list (React Native platform files) carries over.
function convertSettings(settings) {
	const converted = {};

	for (const [key, value] of Object.entries(settings)) {
		if (key === 'import-x/resolver') {
			if (value.node) converted['import/resolver'] = { node: value.node };
		} else if (key === 'react' && value.version === 'detect') {
			const { version: _detect, ...react } = value;
			converted.react = react;
		} else if (!key.startsWith('import-x/')) {
			converted[key] = value;
		}
	}

	return converted;
}

function isIgnoreOnly(entry) {
	return (
		Array.isArray(entry.ignores) &&
		Object.keys(entry).every((key) => key === 'ignores' || key === 'name')
	);
}

function isOff(value) {
	const level = Array.isArray(value) ? value[0] : value;

	return level === 'off' || level === 0;
}

function toOxlintConfig(entries, { jsPlugins = {} } = {}) {
	const plugins = new Set();
	const usedJsPlugins = new Set();
	const ignorePatterns = [];
	const overrides = [];
	// In Bun a core rule and its typescript-eslint extension are one rule, so
	// setting the core name alone would also change the TypeScript one.
	const typeScriptValues = new Map();
	let settings = {};
	let typeAware = false;

	for (const entry of entries) {
		const parserOptions = entry.languageOptions?.parserOptions;
		if (parserOptions?.projectService || parserOptions?.project)
			typeAware = true;
		if (isIgnoreOnly(entry)) {
			ignorePatterns.push(...entry.ignores);
			continue;
		}
		if (entry.settings)
			settings = { ...settings, ...convertSettings(entry.settings) };

		const rules = {};
		for (const [name, value] of Object.entries(entry.rules ?? {})) {
			const converted = ruleName(name);
			const prefix = rulePrefix(converted);

			if (prefix && nativePlugins[prefix]) plugins.add(nativePlugins[prefix]);
			else if (prefix && jsPlugins[prefix]) usedJsPlugins.add(prefix);
			else if (prefix && !builtInPrefixes.has(prefix)) {
				// Turning off a rule from a plugin Bun does not have changes nothing.
				if (isOff(value)) continue;
				throw new Error(
					`No native or JavaScript source for rule plugin "${prefix}" (${name}).`,
				);
			}
			if (prefix === 'typescript') typeScriptValues.set(converted, value);
			rules[converted] = value;
		}
		for (const name of Object.keys(rules)) {
			const typeScriptName = `typescript/${name}`;
			if (
				!rulePrefix(name) &&
				typeScriptValues.has(typeScriptName) &&
				!(typeScriptName in rules)
			) {
				rules[typeScriptName] = typeScriptValues.get(typeScriptName);
			}
		}

		const globals = entry.languageOptions?.globals;
		if (Object.keys(rules).length === 0 && !globals) continue;

		overrides.push({
			files: entry.files ?? ['**/*'],
			...(entry.ignores ? { excludeFiles: entry.ignores } : {}),
			...(globals ? { globals: normalizeGlobals(globals) } : {}),
			...(Object.keys(rules).length > 0 ? { rules } : {}),
		});
	}

	return {
		...(typeAware ? { options: { typeAware: true } } : {}),
		categories: { correctness: 'off' },
		plugins: [...plugins].sort(),
		jsPlugins: [...usedJsPlugins].map((name) => ({
			name,
			specifier: jsPlugins[name],
		})),
		settings,
		ignorePatterns,
		overrides,
	};
}

module.exports = { toOxlintConfig };
