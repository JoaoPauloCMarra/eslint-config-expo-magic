const { describe, expect, test } = require('bun:test');
const {
	normalizeAudit,
	normalizePolicy,
	severityRank,
	validateContract,
} = require('../audit-dependencies.js');

const futureReview = '2099-12-31';
const contract = {
	owner: 'dependencies',
	remediation: 'Track upgrade through owning tool graph.',
	expiry: futureReview,
};

function basePolicy(overrides = {}) {
	return {
		schemaVersion: 1,
		reviewBy: futureReview,
		classifications: {
			fixture: {
				reason: 'Non-published fixture and tooling transitive.',
				mayAppearInPublishedDependencyTree: false,
			},
			published: {
				reason: 'Shared build tooling in the published tree.',
				mayAppearInPublishedDependencyTree: true,
			},
		},
		allowlist: {
			'fixture-low': {
				classification: 'fixture',
				advisories: { 'GHSA-aaaa-aaaa-aaaa': 'low' },
			},
			'fixture-high': {
				classification: 'fixture',
				advisories: { 'GHSA-bbbb-bbbb-bbbb': 'high' },
			},
			'published-critical': {
				classification: 'published',
				advisories: { 'GHSA-cccc-cccc-cccc': 'critical' },
			},
		},
		contracts: {
			'fixture-high:GHSA-bbbb-bbbb-bbbb': contract,
			'published-critical:GHSA-cccc-cccc-cccc': contract,
		},
		...overrides,
	};
}

describe('dependency audit policy contracts', () => {
	test('accepts high/critical advisories with remediation contracts', () => {
		const result = normalizePolicy(basePolicy());

		expect(result.advisories.size).toBe(3);
		expect(result.contracts.size).toBe(2);
		expect(result.contracts.get('fixture-high:GHSA-bbbb-bbbb-bbbb').owner).toBe(
			'dependencies',
		);
	});

	test('rejects a high advisory without a remediation contract', () => {
		const policy = basePolicy();
		delete policy.contracts['fixture-high:GHSA-bbbb-bbbb-bbbb'];

		expect(() => normalizePolicy(policy)).toThrow(
			/Missing remediation contract for high\/critical advisory fixture-high:GHSA-bbbb-bbbb-bbbb \(high\)/,
		);
	});

	test('rejects a critical advisory without a remediation contract', () => {
		const policy = basePolicy();
		delete policy.contracts['published-critical:GHSA-cccc-cccc-cccc'];

		expect(() => normalizePolicy(policy)).toThrow(
			/Missing remediation contract for high\/critical advisory published-critical:GHSA-cccc-cccc-cccc \(critical\)/,
		);
	});

	test('allows low and moderate advisories without contracts', () => {
		const policy = {
			schemaVersion: 1,
			reviewBy: futureReview,
			classifications: {
				tooling: { reason: 'Tooling transitive.' },
			},
			allowlist: {
				dep: {
					classification: 'tooling',
					advisories: { 'GHSA-dddd-dddd-dddd': 'moderate' },
				},
			},
		};

		const result = normalizePolicy(policy);

		expect(result.advisories.size).toBe(1);
		expect(result.contracts.size).toBe(0);
	});

	test('requires owner, remediation, and expiry on every contract', () => {
		for (const field of ['owner', 'remediation', 'expiry']) {
			const policy = basePolicy({
				contracts: {
					'fixture-high:GHSA-bbbb-bbbb-bbbb': {
						...contract,
						[field]: '',
					},
					'published-critical:GHSA-cccc-cccc-cccc': contract,
				},
			});

			expect(() => normalizePolicy(policy)).toThrow(
				new RegExp(`requires a non-empty ${field}`),
			);
		}
	});

	test('rejects malformed or expired contract expiry dates', () => {
		const malformed = basePolicy({
			contracts: {
				'fixture-high:GHSA-bbbb-bbbb-bbbb': {
					...contract,
					expiry: '08/29/2026',
				},
				'published-critical:GHSA-cccc-cccc-cccc': contract,
			},
		});
		expect(() => normalizePolicy(malformed)).toThrow(/invalid expiry date/);

		const invalidCalendarDate = basePolicy({
			contracts: {
				'fixture-high:GHSA-bbbb-bbbb-bbbb': {
					...contract,
					expiry: '2026-99-99',
				},
				'published-critical:GHSA-cccc-cccc-cccc': contract,
			},
		});
		expect(() => normalizePolicy(invalidCalendarDate)).toThrow(
			/invalid expiry date/,
		);

		const expired = basePolicy({
			contracts: {
				'fixture-high:GHSA-bbbb-bbbb-bbbb': {
					...contract,
					expiry: '2000-01-01',
				},
				'published-critical:GHSA-cccc-cccc-cccc': contract,
			},
		});
		expect(() => normalizePolicy(expired)).toThrow(/expired on 2000-01-01/);
	});

	test('rejects a contract that does not reference a classified advisory', () => {
		const policy = basePolicy({
			contracts: {
				'unknown:GHSA-eeee-eeee-eeee': contract,
				'fixture-high:GHSA-bbbb-bbbb-bbbb': contract,
				'published-critical:GHSA-cccc-cccc-cccc': contract,
			},
		});

		expect(() => normalizePolicy(policy)).toThrow(
			/Remediation contract references unclassified advisory unknown:GHSA-eeee-eeee-eeee/,
		);
	});

	test('rejects unknown classifications and severities', () => {
		const unknownClassification = basePolicy({
			allowlist: {
				dep: {
					classification: 'missing',
					advisories: { 'GHSA-ffff-ffff-ffff': 'low' },
				},
			},
		});
		expect(() => normalizePolicy(unknownClassification)).toThrow(
			/Unknown classification missing for dep/,
		);

		const unknownSeverity = basePolicy({
			allowlist: {
				dep: {
					classification: 'fixture',
					advisories: { 'GHSA-ffff-ffff-ffff': 'severe' },
				},
			},
		});
		expect(() => normalizePolicy(unknownSeverity)).toThrow(
			/Unknown severity severe for dep:GHSA-ffff-ffff-ffff/,
		);
	});

	test('honors package-level published-tree overrides', () => {
		const policy = basePolicy({
			allowlist: {
				'fixture-low': {
					classification: 'fixture',
					advisories: { 'GHSA-aaaa-aaaa-aaaa': 'low' },
				},
				'fixture-high': {
					classification: 'fixture',
					mayAppearInPublishedDependencyTree: true,
					advisories: { 'GHSA-bbbb-bbbb-bbbb': 'high' },
				},
			},
			contracts: {
				'fixture-high:GHSA-bbbb-bbbb-bbbb': contract,
			},
		});

		const result = normalizePolicy(policy);

		expect(
			result.packageClassifications.get('fixture-high')
				.mayAppearInPublishedDependencyTree,
		).toBe(true);
		expect(
			result.packageClassifications.get('fixture-low')
				.mayAppearInPublishedDependencyTree,
		).toBe(false);
	});

	test('validateContract enforces the explicit contract shape', () => {
		expect(() =>
			validateContract('dep:GHSA-ffff-ffff-ffff', contract),
		).not.toThrow();
		expect(() =>
			validateContract('dep:GHSA-ffff-ffff-ffff', 'accepted'),
		).toThrow(/must be an object/);
	});
});

describe('dependency audit normalization', () => {
	test('ranks severities low through critical', () => {
		expect(severityRank.low).toBeLessThan(severityRank.moderate);
		expect(severityRank.moderate).toBeLessThan(severityRank.high);
		expect(severityRank.high).toBeLessThan(severityRank.critical);
	});

	test('keeps the highest severity for a repeated advisory', () => {
		const audit = {
			dep: [
				{
					url: 'https://github.com/advisories/GHSA-0000-0000-0000',
					severity: 'moderate',
				},
				{
					url: 'https://github.com/advisories/GHSA-0000-0000-0000',
					severity: 'high',
				},
			],
		};

		const result = normalizeAudit(audit);

		expect(result.size).toBe(1);
		expect(result.get('dep:GHSA-0000-0000-0000').severity).toBe('high');
	});

	test('rejects advisory URLs that cannot be parsed as GHSA IDs', () => {
		const audit = {
			dep: [
				{
					url: 'https://github.com/advisories/CVE-2026-0000',
					severity: 'high',
				},
			],
		};

		expect(() => normalizeAudit(audit)).toThrow(
			/Could not identify advisory URL for dep/,
		);
	});

	test('exposes policy helpers without executing the live audit', () => {
		expect(typeof normalizePolicy).toBe('function');
		expect(typeof normalizeAudit).toBe('function');
	});
});
