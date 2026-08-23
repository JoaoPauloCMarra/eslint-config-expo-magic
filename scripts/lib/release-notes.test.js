const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { describe, expect, test } = require('bun:test');
const {
	createReleaseNotes,
	loadReleaseComparison,
} = require('./release-notes.js');

const projectRoot = path.resolve(__dirname, '../..');

function createReport(version, defaultRules, agentRules = {}) {
	return {
		packageVersion: version,
		scopes: {
			app: {
				filePath: 'apps/mobile/App.tsx',
				presets: {
					agent: { name: 'agent', ruleCount: 0, rules: agentRules },
					default: {
						name: 'default',
						ruleCount: Object.keys(defaultRules).length,
						rules: defaultRules,
					},
				},
			},
		},
	};
}

describe('release notes', () => {
	test('compares the current release candidate with the latest release tag', async () => {
		const comparison = await loadReleaseComparison({ rootDir: projectRoot });

		expect(comparison.previousRef).toBe('v3.0.2');
		expect(comparison.previousManifest.version).toBe('3.0.2');
		expect(comparison.currentManifest.version).toBe('4.0.0');
	});

	test('describes previous-to-current package changes only', () => {
		const previousManifest = {
			version: '2.8.0',
			exports: {
				'.': './index.js',
				'./agent': './agent.js',
			},
			peerDependencies: {
				eslint: '>=10',
			},
			dependencies: {
				'eslint-plugin-jest': '^29.15.4',
			},
		};
		const currentManifest = {
			version: '3.0.0',
			exports: {
				'.': './index.js',
				'./agent': './agent.js',
				'./recommended': './recommended.js',
			},
			peerDependencies: {
				eslint: '>=10 <11',
			},
			dependencies: {
				'eslint-plugin-jest': '^29.16.0',
			},
		};
		const previousReport = createReport(
			'2.8.0',
			{ eqeqeq: 'warn' },
			{ 'no-console': 'warn' },
		);
		const currentReport = createReport(
			'3.0.0',
			{ eqeqeq: 'error', 'no-alert': 'error' },
			{ 'no-console': 'warn' },
		);

		const notes = createReleaseNotes({
			currentManifest,
			currentReport,
			previousManifest,
			previousRef: 'v2.8.0',
			previousReport,
		});

		expect(notes).toContain('`2.8.0` → `3.0.0`');
		expect(notes).toContain('`./recommended`');
		expect(notes).toContain('Omitted: rule diff unavailable because dependency graphs differ.');
		expect(notes).not.toContain('`eqeqeq`');
		expect(notes).toContain('`eslint-plugin-jest`: `^29.15.4` → `^29.16.0`');
		expect(notes).toContain('`eslint`: `>=10` → `>=10 <11`');
		expect(notes).not.toContain('AI-agent-heavy');
		expect(notes).not.toContain('Base preset vs Expo');
		expect(notes).not.toContain('agent (`app`)');
	});

	test('includes effective rule diff when dependency manifests are unchanged', () => {
		const previousManifest = {
			version: '2.8.0',
			exports: {
				'.': './index.js',
				'./agent': './agent.js',
			},
			peerDependencies: {
				eslint: '>=10 <11',
			},
			dependencies: {
				'eslint-plugin-jest': '^29.16.0',
			},
		};
		const currentManifest = {
			version: '3.0.0',
			exports: {
				'.': './index.js',
				'./agent': './agent.js',
				'./recommended': './recommended.js',
			},
			peerDependencies: {
				eslint: '>=10 <11',
			},
			dependencies: {
				'eslint-plugin-jest': '^29.16.0',
			},
		};
		const previousReport = createReport(
			'2.8.0',
			{ eqeqeq: 'warn' },
			{ 'no-console': 'warn' },
		);
		const currentReport = createReport(
			'3.0.0',
			{ eqeqeq: 'error', 'no-alert': 'error' },
			{ 'no-console': 'warn' },
		);

		const notes = createReleaseNotes({
			currentManifest,
			currentReport,
			previousManifest,
			previousRef: 'v2.8.0',
			previousReport,
		});

		expect(notes).toContain('## Effective rules');
		expect(notes).toContain('`eqeqeq`');
		expect(notes).toContain('`default`');
	});

	test('omits unchanged package surfaces and rules', () => {
		const manifest = {
			version: '2.8.0',
			exports: { '.': './index.js', './agent': './agent.js' },
			peerDependencies: { eslint: '>=10' },
			dependencies: {},
		};
		const report = createReport('2.8.0', { eqeqeq: 'warn' });

		const notes = createReleaseNotes({
			currentManifest: manifest,
			currentReport: report,
			previousManifest: manifest,
			previousRef: 'v2.8.0',
			previousReport: report,
		});

		expect(notes).toContain('No package changes detected');
		expect(notes).not.toContain('agent');
		expect(notes).not.toContain('Expo');
	});

	test('requires explicit baseline when no release tag is reachable', async () => {
		const rootDir = fs.mkdtempSync(
			path.join(os.tmpdir(), 'expo-magic-no-release-tag-'),
		);

		try {
			await expect(loadReleaseComparison({ rootDir })).rejects.toThrow(
				'Pass --previous-ref <git-ref>',
			);
		} finally {
			fs.rmSync(rootDir, { force: true, recursive: true });
		}
	});
});
