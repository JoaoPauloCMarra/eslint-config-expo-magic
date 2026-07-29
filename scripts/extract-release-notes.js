#!/usr/bin/env bun

const fs = require('node:fs');
const path = require('node:path');
const { parseArgs } = require('node:util');

const rootDir = process.cwd();
const packageJsonPath = path.join(
	rootDir,
	'packages',
	'eslint-config-expo-magic',
	'package.json',
);

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const { values } = parseArgs({
	options: {
		changelog: { type: 'string', short: 'c', default: 'CHANGELOG.md' },
		output: { type: 'string', short: 'o', default: '' },
		version: { type: 'string', short: 'v' },
	},
});

const releaseVersion =
	values.version || JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')).version;
const changelogPath = path.resolve(rootDir, values.changelog);
const releaseNotesPath = values.output;

if (!releaseVersion) {
	console.error('Release version missing. Pass --version or ensure package.json has it.');
	process.exit(1);
}

if (!releaseNotesPath) {
	console.error('Output path missing. Pass --output <path>.');
	process.exit(1);
}

const changelog = fs.readFileSync(changelogPath, 'utf8').split('\n');
const heading = new RegExp(`^##\\s+${escapeRegExp(releaseVersion)}\\s*$`);

let start = -1;
for (let index = 0; index < changelog.length; index++) {
	if (heading.test(changelog[index])) {
		start = index;
		break;
	}
}

if (start < 0) {
	console.error(`Release section not found for version ${releaseVersion}.`);
	process.exit(1);
}

let end = changelog.length;
for (let index = start + 1; index < changelog.length; index++) {
	if (/^##\s+/.test(changelog[index])) {
		end = index;
		break;
	}
}

const sectionLines = changelog.slice(start, end);
const section = sectionLines.join('\n').trim();
const body = sectionLines.slice(1).join('\n').trim();

if (section.length === 0 || body.length === 0) {
	console.error(`Release notes section for ${releaseVersion} is empty.`);
	process.exit(1);
}

fs.writeFileSync(releaseNotesPath, `${section}\n`);
console.log(`Wrote release notes section for ${releaseVersion} to ${releaseNotesPath}`);
