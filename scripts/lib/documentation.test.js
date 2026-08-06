const fs = require('node:fs');
const path = require('node:path');
const { describe, expect, test } = require('bun:test');

const rootDir = path.resolve(__dirname, '../..');
const packageDir = path.join(rootDir, 'packages/eslint-config-expo-magic');
const packageManifest = JSON.parse(
	fs.readFileSync(path.join(packageDir, 'package.json'), 'utf8'),
);
const rootReadmePath = path.join(rootDir, 'README.md');
const packageReadmePath = path.join(packageDir, 'README.md');
const readme = fs.readFileSync(rootReadmePath, 'utf8');
const changelog = fs.readFileSync(path.join(rootDir, 'CHANGELOG.md'), 'utf8');

function getReleaseSection(markdown, version) {
	const lines = markdown.split('\n');
	const start = lines.findIndex((line) => line === `## ${version}`);
	if (start === -1) {
		return '';
	}

	const end = lines.findIndex(
		(line, index) => index > start && /^## /.test(line),
	);
	return lines.slice(start, end === -1 ? lines.length : end).join('\n');
}

describe('package documentation', () => {
	test('root and packed package READMEs stay identical', () => {
		expect(fs.readFileSync(packageReadmePath, 'utf8')).toBe(readme);
	});

	test('badges are clickable and point to the package surfaces', () => {
		const expectedBadges = [
			[
				'npm version',
				'https://img.shields.io/npm/v/eslint-config-expo-magic.svg',
				'https://www.npmjs.com/package/eslint-config-expo-magic',
			],
			[
				'npm downloads',
				'https://img.shields.io/npm/dm/eslint-config-expo-magic.svg',
				'https://www.npmjs.com/package/eslint-config-expo-magic',
			],
			[
				'CI',
				'https://github.com/JoaoPauloCMarra/eslint-config-expo-magic/actions/workflows/ci.yml/badge.svg',
				'https://github.com/JoaoPauloCMarra/eslint-config-expo-magic/actions/workflows/ci.yml',
			],
			[
				'Release',
				'https://github.com/JoaoPauloCMarra/eslint-config-expo-magic/actions/workflows/release.yml/badge.svg',
				'https://github.com/JoaoPauloCMarra/eslint-config-expo-magic/actions/workflows/release.yml',
			],
			[
				'Documentation',
				'https://img.shields.io/badge/docs-guides-blue.svg',
				'https://github.com/JoaoPauloCMarra/eslint-config-expo-magic/tree/main/docs',
			],
			[
				'License: MIT',
				'https://img.shields.io/badge/license-MIT-blue.svg',
				'https://github.com/JoaoPauloCMarra/eslint-config-expo-magic/blob/main/LICENSE',
			],
		];

		for (const [label, imageUrl, targetUrl] of expectedBadges) {
			expect(readme).toContain(`[![${label}](${imageUrl})](${targetUrl})`);
		}

		for (const line of readme
			.split('\n')
			.filter((line) => line.includes('[!['))) {
			expect(line).toMatch(
				/^\[!\[[^\]]+\]\(https?:\/\/[^)]+\)\]\(https?:\/\/[^)]+\)$/,
			);
		}
	});

	test('repository links resolve to checked-in files or directories', () => {
		const repositoryLinks = [
			...readme.matchAll(
				/https:\/\/github\.com\/JoaoPauloCMarra\/eslint-config-expo-magic\/(?:blob|tree)\/main\/([^\s)]+)/g,
			),
		];

		for (const [, target] of repositoryLinks) {
			const relativePath = decodeURIComponent(target.split('#')[0]);
			expect(fs.existsSync(path.join(rootDir, relativePath))).toBe(true);
		}
	});

	test('every changelog release documents breaking changes explicitly', () => {
		const releaseVersions = [
			...changelog.matchAll(/^## (\d+\.\d+\.\d+)$/gm),
		].map((match) => match[1]);
		expect(releaseVersions.length).toBeGreaterThan(0);

		for (const version of releaseVersions) {
			expect(getReleaseSection(changelog, version)).toMatch(
				/^### Breaking Changes$/m,
			);
		}

		const currentSection = getReleaseSection(
			changelog,
			packageManifest.version,
		);
		expect(currentSection).toContain(`## ${packageManifest.version}`);
		expect(currentSection).toContain('### Breaking Changes');
	});
});
