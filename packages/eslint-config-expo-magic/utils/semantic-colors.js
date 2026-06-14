const { createRestrictedSyntaxConfigs } = require('./restricted-syntax.js');

const typeScriptFiles = ['**/*.ts', '**/*.tsx'];

const RAW_COLOR_SELECTOR =
	'Literal[value=/^(#([0-9a-fA-F]{3,8})|rgba?\\([^)]*\\)|hsla?\\([^)]*\\))$/]';

function buildImportSourceRegex(tokenModule) {
	const escaped = tokenModule
		.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
		.replace(/\//g, '\\/');

	return `(^|\\/)${escaped}$`;
}

function createRestrictedSyntaxGroups(options = {}) {
	const tokenModule = options.tokenModule ?? 'uikit/tokens/colors';
	const importName = options.importName ?? 'colors';
	const flagDirectAccess = options.flagDirectAccess ?? true;
	const importSourceRegex = buildImportSourceRegex(tokenModule);

	const selectors = [
		{
			selector: RAW_COLOR_SELECTOR,
			message:
				'Do not use raw color literals. Add the color to the token file and consume it through `semanticColors`.',
		},
		{
			selector: `ImportDeclaration[source.value=/${importSourceRegex}/] > ImportSpecifier[imported.name="${importName}"]`,
			message:
				'Do not import the raw color token map. Consume colors through `semanticColors`.',
		},
	];

	if (flagDirectAccess) {
		selectors.push({
			selector: `MemberExpression[object.name="${importName}"]`,
			message:
				'Do not access the raw color token map directly. Consume colors through `semanticColors`.',
		});
	}

	return [
		{
			files: typeScriptFiles,
			selectors,
		},
	];
}

function getAllowFiles(options = {}) {
	const tokenModule = options.tokenModule ?? 'uikit/tokens/colors';
	return options.allowFiles ?? [`**/${tokenModule}.{ts,tsx}`];
}

function createAllowConfig(options = {}) {
	const allowFiles = getAllowFiles(options);
	if (allowFiles.length === 0) {
		return [];
	}

	return [
		{
			files: allowFiles,
			rules: {
				'no-restricted-syntax': 'off',
			},
		},
	];
}

function createSemanticColorsConfig(options = {}) {
	return [
		...createRestrictedSyntaxConfigs(createRestrictedSyntaxGroups(options)),
		...createAllowConfig(options),
	];
}

const restrictedSyntaxGroups = createRestrictedSyntaxGroups();
const config = createSemanticColorsConfig();

module.exports = config;
module.exports.createAllowConfig = createAllowConfig;
module.exports.createRestrictedSyntaxGroups = createRestrictedSyntaxGroups;
module.exports.createSemanticColorsConfig = createSemanticColorsConfig;
module.exports.restrictedSyntaxGroups = restrictedSyntaxGroups;
