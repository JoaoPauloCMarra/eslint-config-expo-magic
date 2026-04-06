const fs = require('node:fs');
const path = require('node:path');
const { createConfigReport } = require('./config-report.js');

const rootDir = path.resolve(__dirname, '../..');
const packageJson = require(path.join(
	rootDir,
	'packages/eslint-config-expo-magic/package.json',
));

function formatRuleList(ruleNames, limit = 20) {
	if (ruleNames.length === 0) {
		return ['- None'];
	}

	const displayedRules = ruleNames.slice(0, limit).map((ruleName) => `- \`${ruleName}\``);
	if (ruleNames.length > limit) {
		displayedRules.push(`- ...and ${ruleNames.length - limit} more`);
	}

	return displayedRules;
}

function createReleaseNotes(report = createConfigReport()) {
	const sections = [
		`# Release Notes ${packageJson.version}`,
		'',
		'## Summary',
		`- Package version: \`${report.packageVersion}\``,
		`- Expo base version: \`${report.expoConfigVersion}\``,
		'',
		'## Base vs Expo',
		'### Added',
		...formatRuleList(report.deltas.baseVsExpo.added),
		'',
		'### Changed',
		...formatRuleList(report.deltas.baseVsExpo.changed),
		'',
		'### Removed',
		...formatRuleList(report.deltas.baseVsExpo.removed),
		'',
		'## Default vs Expo',
		'### Added',
		...formatRuleList(report.deltas.defaultVsExpo.added),
		'',
		'### Changed',
		...formatRuleList(report.deltas.defaultVsExpo.changed),
		'',
		'### Removed',
		...formatRuleList(report.deltas.defaultVsExpo.removed),
		'',
		'## Preset deltas',
		'### no-prettier vs default',
		...formatRuleList([
			...report.deltas.noPrettierVsDefault.added,
			...report.deltas.noPrettierVsDefault.changed,
			...report.deltas.noPrettierVsDefault.removed,
		]),
		'',
		'### typed vs default',
		...formatRuleList([
			...report.deltas.typedVsDefault.added,
			...report.deltas.typedVsDefault.changed,
			...report.deltas.typedVsDefault.removed,
		]),
		'',
		'### strict vs default',
		...formatRuleList([
			...report.deltas.strictVsDefault.added,
			...report.deltas.strictVsDefault.changed,
			...report.deltas.strictVsDefault.removed,
		]),
		'',
		'## Upgrade notes',
		'- Review `docs/CONFIG_DIFF.md` before publishing.',
		'- If a new rule is too aggressive, recommend `base`, `no-prettier`, or `createConfig(...)` overrides in release notes.',
	];

	return `${sections.join('\n')}\n`;
}

function writeReleaseNotesFile(outputPath = path.join(rootDir, 'docs/RELEASE_NOTES.next.md')) {
	fs.writeFileSync(outputPath, createReleaseNotes());
}

module.exports = {
	createReleaseNotes,
	writeReleaseNotesFile,
};
