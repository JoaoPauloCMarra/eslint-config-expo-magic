const fs = require('node:fs');
const path = require('node:path');

const rootDir = path.resolve(__dirname, '../..');
const packageJson = require(path.join(rootDir, 'packages/eslint-config-expo-magic/package.json'));
const expoConfigPackageJson = require(path.join(rootDir, 'node_modules/eslint-config-expo/package.json'));
const expoFlatConfig = require(path.join(rootDir, 'node_modules/eslint-config-expo/flat'));
const magicConfig = require(path.join(
	rootDir,
	'packages/eslint-config-expo-magic/index.js',
));

function sortObjectEntries(value) {
	return Object.fromEntries(
		Object.entries(value).sort(([leftKey], [rightKey]) =>
			leftKey.localeCompare(rightKey),
		),
	);
}

function normalizeRuleValue(ruleValue) {
	return JSON.parse(JSON.stringify(ruleValue));
}

function collectRuleMap(configEntries) {
	const ruleMap = {};

	for (const entry of configEntries) {
		for (const [ruleName, ruleValue] of Object.entries(entry.rules ?? {})) {
			ruleMap[ruleName] = normalizeRuleValue(ruleValue);
		}
	}

	return sortObjectEntries(ruleMap);
}

function createRuleDiff(leftRules, rightRules) {
	const leftRuleNames = new Set(Object.keys(leftRules));
	const rightRuleNames = new Set(Object.keys(rightRules));

	const added = [];
	const removed = [];
	const changed = [];

	for (const ruleName of rightRuleNames) {
		if (!leftRuleNames.has(ruleName)) {
			added.push(ruleName);
			continue;
		}

		if (
			JSON.stringify(leftRules[ruleName]) !== JSON.stringify(rightRules[ruleName])
		) {
			changed.push(ruleName);
		}
	}

	for (const ruleName of leftRuleNames) {
		if (!rightRuleNames.has(ruleName)) {
			removed.push(ruleName);
		}
	}

	return {
		added: added.sort(),
		removed: removed.sort(),
		changed: changed.sort(),
	};
}

function createPresetSummary(name, configEntries) {
	const rules = collectRuleMap(configEntries);

	return {
		name,
		ruleCount: Object.keys(rules).length,
		rules,
	};
}

function createConfigReport() {
	const presets = {
		expo: createPresetSummary('expo', expoFlatConfig),
		agent: createPresetSummary('agent', magicConfig.agent),
		agentGuardrails: createPresetSummary(
			'agentGuardrails',
			magicConfig.agentGuardrails,
		),
		base: createPresetSummary('base', magicConfig.base),
		default: createPresetSummary('default', magicConfig),
		noPrettier: createPresetSummary('noPrettier', magicConfig.noPrettier),
		typed: createPresetSummary('typed', magicConfig.typed),
		strict: createPresetSummary('strict', magicConfig.strict),
		appGuardrails: createPresetSummary(
			'appGuardrails',
			magicConfig.appGuardrails,
		),
		componentStructure: createPresetSummary(
			'componentStructure',
			magicConfig.componentStructure,
		),
		deprecatedApis: createPresetSummary(
			'deprecatedApis',
			magicConfig.deprecatedApis,
		),
		featureBoundaries: createPresetSummary(
			'featureBoundaries',
			magicConfig.featureBoundaries,
		),
		nativeUi: createPresetSummary('nativeUi', magicConfig.nativeUi),
		reactCompiler: createPresetSummary(
			'reactCompiler',
			magicConfig.reactCompiler,
		),
		reanimated: createPresetSummary('reanimated', magicConfig.reanimated),
		semanticColors: createPresetSummary(
			'semanticColors',
			magicConfig.semanticColors,
		),
		storybook: createPresetSummary('storybook', magicConfig.storybook),
		worklets: createPresetSummary('worklets', magicConfig.worklets),
		productionApp: createPresetSummary(
			'productionApp',
			magicConfig.createConfig({
				appGuardrails: true,
				componentStructure: true,
				deprecatedApis: true,
				inlineStyles: true,
				nativeUi: true,
				reactCompiler: true,
				reanimated: true,
				semanticColors: true,
				storybook: true,
				worklets: true,
			}),
		),
	};

	return {
		packageVersion: packageJson.version,
		expoConfigVersion: expoConfigPackageJson.version,
		presets,
		deltas: {
			baseVsExpo: createRuleDiff(presets.expo.rules, presets.base.rules),
			defaultVsExpo: createRuleDiff(presets.expo.rules, presets.default.rules),
			noPrettierVsDefault: createRuleDiff(
				presets.default.rules,
				presets.noPrettier.rules,
			),
			typedVsDefault: createRuleDiff(
				presets.default.rules,
				presets.typed.rules,
			),
			strictVsDefault: createRuleDiff(
				presets.default.rules,
				presets.strict.rules,
			),
			productionAppVsDefault: createRuleDiff(
				presets.default.rules,
				presets.productionApp.rules,
			),
		},
	};
}

function formatRuleList(ruleNames) {
	return ruleNames.length > 0 ? ruleNames.map((ruleName) => `- \`${ruleName}\``) : ['- None'];
}

function createMarkdownReport(report) {
	const sections = [
		'# Config Diff',
		'',
		`Package version: \`${report.packageVersion}\``,
		`Expo config version: \`${report.expoConfigVersion}\``,
		'',
		'## Rule Counts',
		'',
		'| Preset | Rule count |',
		'| --- | ---: |',
		...Object.values(report.presets).map(
			(preset) => `| ${preset.name} | ${preset.ruleCount} |`,
		),
	];

	for (const [deltaName, delta] of Object.entries(report.deltas)) {
		sections.push('', `## ${deltaName}`, '', '### Added', '', ...formatRuleList(delta.added));
		sections.push('', '### Changed', '', ...formatRuleList(delta.changed));
		sections.push('', '### Removed', '', ...formatRuleList(delta.removed));
	}

	return `${sections.join('\n')}\n`;
}

function writeConfigReportFiles(outputDir = path.join(rootDir, 'docs')) {
	const report = createConfigReport();
	fs.mkdirSync(outputDir, { recursive: true });
	fs.writeFileSync(
		path.join(outputDir, 'config-diff.json'),
		`${JSON.stringify(report, null, 2)}\n`,
	);
	fs.writeFileSync(
		path.join(outputDir, 'CONFIG_DIFF.md'),
		createMarkdownReport(report),
	);
}

module.exports = {
	createConfigReport,
	createMarkdownReport,
	writeConfigReportFiles,
};
