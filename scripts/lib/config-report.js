const fs = require('node:fs');
const path = require('node:path');
const { ESLint } = require('eslint');

const rootDir = path.resolve(__dirname, '../..');
const representativeFiles = {
	app: 'apps/mobile/App.tsx',
	package: 'packages/shared/src/index.ts',
	test: 'apps/mobile/src/__tests__/App.test.tsx',
	story: 'apps/mobile/src/components/Button.stories.tsx',
	config: 'metro.config.js',
	web: 'apps/mobile/src/App.web.tsx',
};

function sortObjectEntries(value) {
	return Object.fromEntries(
		Object.entries(value).sort(([leftKey], [rightKey]) =>
			leftKey.localeCompare(rightKey),
		),
	);
}

function collectRuleMap(configEntries) {
	const ruleMap = {};

	for (const entry of configEntries) {
		for (const [ruleName, ruleValue] of Object.entries(entry.rules ?? {})) {
			ruleMap[ruleName] = JSON.parse(JSON.stringify(ruleValue));
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
			JSON.stringify(leftRules[ruleName]) !==
			JSON.stringify(rightRules[ruleName])
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

function createPresetSummary(name, rulesOrEntries) {
	const rules = Array.isArray(rulesOrEntries)
		? collectRuleMap(rulesOrEntries)
		: sortObjectEntries(
				Object.fromEntries(
					Object.entries(rulesOrEntries ?? {}).map(([ruleName, ruleValue]) => [
						ruleName,
						JSON.parse(JSON.stringify(ruleValue)),
					]),
				),
			);

	return {
		name,
		ruleCount: Object.keys(rules).length,
		rules,
	};
}

function loadReportInputs(projectRoot) {
	const packageJson = require(
		path.join(projectRoot, 'packages/eslint-config-expo-magic/package.json'),
	);
	const expoConfigPackageJson = require(
		path.join(projectRoot, 'node_modules/eslint-config-expo/package.json'),
	);
	const expoFlatConfig = require(
		path.join(projectRoot, 'node_modules/eslint-config-expo/flat'),
	);
	const magicConfig = require(
		path.join(projectRoot, 'packages/eslint-config-expo-magic/index.js'),
	);

	return {
		expoConfigPackageJson,
		expoFlatConfig,
		magicConfig,
		packageJson,
	};
}

function createPresetConfigs(magicConfig, expoFlatConfig) {
	return {
		expo: expoFlatConfig,
		agent: magicConfig.agent,
		agentGuardrails: magicConfig.agentGuardrails,
		base: magicConfig.base,
		default: magicConfig,
		noPrettier: magicConfig.noPrettier,
		typed: magicConfig.typed,
		strict: magicConfig.strict,
		appGuardrails: magicConfig.appGuardrails,
		componentStructure: magicConfig.componentStructure,
		deprecatedApis: magicConfig.deprecatedApis,
		featureBoundaries: magicConfig.featureBoundaries,
		nativeUi: magicConfig.nativeUi,
		reactCompiler: magicConfig.reactCompiler,
		reanimated: magicConfig.reanimated,
		semanticColors: magicConfig.semanticColors,
		storybook: magicConfig.storybook,
		worklets: magicConfig.worklets,
		productionApp: magicConfig.createConfig({
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
	};
}

function createReportDeltas(presets) {
	return {
		baseVsExpo: createRuleDiff(presets.expo.rules, presets.base.rules),
		defaultVsExpo: createRuleDiff(presets.expo.rules, presets.default.rules),
		noPrettierVsDefault: createRuleDiff(
			presets.default.rules,
			presets.noPrettier.rules,
		),
		typedVsDefault: createRuleDiff(presets.default.rules, presets.typed.rules),
		strictVsDefault: createRuleDiff(
			presets.default.rules,
			presets.strict.rules,
		),
		productionAppVsDefault: createRuleDiff(
			presets.default.rules,
			presets.productionApp.rules,
		),
	};
}

function createAggregateConfigReport(options = {}) {
	const projectRoot = options.projectRoot ?? rootDir;
	const inputs = options.inputs ?? loadReportInputs(projectRoot);
	const presetConfigs = createPresetConfigs(
		inputs.magicConfig,
		inputs.expoFlatConfig,
	);
	const presets = Object.fromEntries(
		Object.entries(presetConfigs).map(([name, configEntries]) => [
			name,
			createPresetSummary(name, configEntries),
		]),
	);

	return {
		packageVersion: inputs.packageJson.version,
		expoConfigVersion: inputs.expoConfigPackageJson.version,
		presets,
		deltas: createReportDeltas(presets),
	};
}

function selectEffectivePresetConfigs(presetConfigs) {
	return Object.fromEntries(
		[
			'expo',
			'agent',
			'base',
			'default',
			'noPrettier',
			'typed',
			'strict',
			'productionApp',
		].map((name) => [name, presetConfigs[name]]),
	);
}

async function calculateScopedPresets({
	ESLintClass,
	fileScopes,
	presetConfigs,
	projectRoot,
}) {
	const scopeEntries = Object.entries(fileScopes);
	const presetEntries = [];
	for (const [name, configEntries] of Object.entries(presetConfigs)) {
		const eslint = new ESLintClass({
			cwd: projectRoot,
			overrideConfig: configEntries,
			overrideConfigFile: true,
		});
		const summaries = await Promise.all(
			scopeEntries.map(async ([scopeName, filePath]) => {
				const config = await eslint.calculateConfigForFile(filePath);
				if (!config) {
					throw new Error(
						`ESLint did not calculate ${name} config for ${filePath}`,
					);
				}

				return [scopeName, createPresetSummary(name, config.rules ?? {})];
			}),
		);

		presetEntries.push([name, Object.fromEntries(summaries)]);
	}
	const summariesByPreset = Object.fromEntries(presetEntries);

	return Object.fromEntries(
		scopeEntries.map(([scopeName, filePath]) => [
			scopeName,
			{
				filePath,
				presets: Object.fromEntries(
					Object.keys(presetConfigs).map((presetName) => [
						presetName,
						summariesByPreset[presetName][scopeName],
					]),
				),
			},
		]),
	);
}

async function createConfigReport(options = {}) {
	const projectRoot = options.projectRoot ?? rootDir;
	const inputs = options.inputs ?? loadReportInputs(projectRoot);
	const aggregateReport = createAggregateConfigReport({
		inputs,
		projectRoot,
	});
	const presetConfigs = selectEffectivePresetConfigs(
		createPresetConfigs(inputs.magicConfig, inputs.expoFlatConfig),
	);
	const scopes = await calculateScopedPresets({
		ESLintClass: options.ESLintClass ?? ESLint,
		fileScopes: options.representativeFiles ?? representativeFiles,
		presetConfigs,
		projectRoot,
	});
	const scopeDeltas = Object.fromEntries(
		Object.entries(scopes).map(([scopeName, scope]) => [
			scopeName,
			createReportDeltas(scope.presets),
		]),
	);

	return {
		...aggregateReport,
		scopes,
		scopeDeltas,
	};
}

function formatRuleList(ruleNames) {
	return ruleNames.length > 0
		? ruleNames.map((ruleName) => `- \`${ruleName}\``)
		: ['- None'];
}

function appendAggregateReport(sections, report) {
	sections.push(
		'',
		'## Aggregate Compatibility',
		'',
		'| Preset | Rule count |',
		'| --- | ---: |',
		...Object.values(report.presets).map(
			(preset) => `| ${preset.name} | ${preset.ruleCount} |`,
		),
	);

	for (const [deltaName, delta] of Object.entries(report.deltas)) {
		sections.push(
			'',
			`### ${deltaName}`,
			'',
			'#### Added',
			'',
			...formatRuleList(delta.added),
			'',
			'#### Changed',
			'',
			...formatRuleList(delta.changed),
			'',
			'#### Removed',
			'',
			...formatRuleList(delta.removed),
		);
	}
}

function appendScopedReport(sections, report) {
	const presetNames = Object.keys(Object.values(report.scopes)[0].presets);
	sections.push(
		'',
		'## Effective Rule Counts',
		'',
		`| Scope | File | ${presetNames.join(' | ')} |`,
		`| --- | --- | ${presetNames.map(() => '---:').join(' | ')} |`,
	);

	for (const [scopeName, scope] of Object.entries(report.scopes)) {
		sections.push(
			`| ${scopeName} | \`${scope.filePath}\` | ${presetNames
				.map((presetName) => scope.presets[presetName].ruleCount)
				.join(' | ')} |`,
		);
	}

	sections.push(
		'',
		'## Effective Delta Counts',
		'',
		'| Scope | Comparison | Added | Changed | Removed |',
		'| --- | --- | ---: | ---: | ---: |',
	);

	for (const [scopeName, deltas] of Object.entries(report.scopeDeltas)) {
		for (const [deltaName, delta] of Object.entries(deltas)) {
			sections.push(
				`| ${scopeName} | ${deltaName} | ${delta.added.length} | ${delta.changed.length} | ${delta.removed.length} |`,
			);
		}
	}
}

function createMarkdownReport(report) {
	const sections = [
		'# Config Diff',
		'',
		`Package version: \`${report.packageVersion}\``,
		`Expo config version: \`${report.expoConfigVersion}\``,
	];

	if (report.scopes) {
		appendScopedReport(sections, report);
	}

	appendAggregateReport(sections, report);
	return `${sections.join('\n')}\n`;
}

async function writeConfigReportFiles(
	outputDir = path.join(rootDir, 'docs'),
	report,
) {
	const resolvedReport = report ?? (await createConfigReport());
	fs.mkdirSync(outputDir, { recursive: true });
	fs.writeFileSync(
		path.join(outputDir, 'config-diff.json'),
		`${JSON.stringify(resolvedReport, null, 2)}\n`,
	);
	fs.writeFileSync(
		path.join(outputDir, 'CONFIG_DIFF.md'),
		createMarkdownReport(resolvedReport),
	);
	return resolvedReport;
}

module.exports = {
	createAggregateConfigReport,
	createConfigReport,
	createMarkdownReport,
	createRuleDiff,
	representativeFiles,
	writeConfigReportFiles,
};
