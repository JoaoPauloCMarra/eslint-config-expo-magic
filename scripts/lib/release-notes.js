const fs = require('node:fs');
const path = require('node:path');
const { createConfigReport } = require('./config-report.js');

const rootDir = path.resolve(__dirname, '../..');
const packageJson = require(path.join(
	rootDir,
	'packages/eslint-config-expo-magic/package.json',
));

function pluralize(count, label) {
	return `${count} ${label}${count === 1 ? '' : 's'}`;
}

function formatRuleList(ruleNames, limit = 8) {
	if (ruleNames.length === 0) {
		return 'none';
	}

	const displayedRules = ruleNames
		.slice(0, limit)
		.map((ruleName) => `\`${ruleName}\``);
	if (ruleNames.length > limit) {
		displayedRules.push(`and ${ruleNames.length - limit} more`);
	}

	return displayedRules.join(', ');
}

function formatRuleSample(label, ruleNames) {
	if (ruleNames.length === 0) {
		return [];
	}

	return [`  - ${label}: ${formatRuleList(ruleNames)}`];
}

function formatDelta(name, delta) {
	return [
		`- ${name}: ${pluralize(delta.added.length, 'rule')} added, ${pluralize(delta.changed.length, 'rule')} changed, ${pluralize(delta.removed.length, 'rule')} removed.`,
		...formatRuleSample('Added', delta.added),
		...formatRuleSample('Changed', delta.changed),
		...formatRuleSample('Removed', delta.removed),
	];
}

function combineDeltaRules(delta) {
	return [...delta.added, ...delta.changed, ...delta.removed].sort();
}

function createReleaseNotes(report = createConfigReport()) {
	const hasAgentPreset = Boolean(packageJson.exports?.['./agent']);
	const sections = [
		'# Changes',
		'',
		`- Package version: \`${report.packageVersion}\``,
		`- Expo base version: \`${report.expoConfigVersion}\``,
	];

	if (hasAgentPreset) {
		sections.push(
			'- Adds `createConfig({ agent: true })` and `eslint-config-expo-magic/agent` for AI-agent-heavy Expo projects.',
			'- Adds `agent-guardrails`, `agentMobileApp` PR guardrails, `expo-magic-init-agent`, and `docs/AGENTS_RECIPE.md`.',
		);
	}

	sections.push(
		...formatDelta('Base preset vs Expo', report.deltas.baseVsExpo),
		...formatDelta('Default preset vs Expo', report.deltas.defaultVsExpo),
		`- no-prettier preset delta: ${formatRuleList(combineDeltaRules(report.deltas.noPrettierVsDefault))}`,
		`- typed preset delta: ${formatRuleList(combineDeltaRules(report.deltas.typedVsDefault))}`,
		`- strict preset delta: ${formatRuleList(combineDeltaRules(report.deltas.strictVsDefault))}`,
	);

	if (report.deltas.productionAppVsDefault) {
		sections.push(
			...formatDelta(
				'Production app hardening vs default',
				report.deltas.productionAppVsDefault,
			),
		);
	}

	sections.push(
		'- Upgrade notes:',
		'  - Review `docs/CONFIG_DIFF.md` before upgrading.',
		'  - If a new rule is too aggressive, recommend `base`, `no-prettier`, or `createConfig(...)` overrides.',
	);

	return `${sections.join('\n')}\n`;
}

function writeReleaseNotesFile(outputPath = path.join(rootDir, 'docs/RELEASE_NOTES.next.md')) {
	fs.writeFileSync(outputPath, createReleaseNotes());
}

module.exports = {
	createReleaseNotes,
	writeReleaseNotesFile,
};
