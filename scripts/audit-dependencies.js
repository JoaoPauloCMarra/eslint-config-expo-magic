#!/usr/bin/env bun

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const rootDir = path.resolve(__dirname, '..');
const packageDir = path.join(rootDir, 'packages', 'eslint-config-expo-magic');
const policyPath = path.join(__dirname, 'dependency-audit-policy.json');
const severityRank = {
	low: 1,
	moderate: 2,
	high: 3,
	critical: 4,
};
const contractDatePattern = /^\d{4}-\d{2}-\d{2}$/;

function validateContract(key, contract) {
	if (!contract || typeof contract !== 'object' || Array.isArray(contract)) {
		throw new Error(`Remediation contract for ${key} must be an object.`);
	}

	for (const field of ['owner', 'remediation', 'expiry']) {
		if (typeof contract[field] !== 'string' || contract[field].trim() === '') {
			throw new Error(
				`Remediation contract for ${key} requires a non-empty ${field}.`,
			);
		}
	}

	if (!contractDatePattern.test(contract.expiry)) {
		throw new Error(
			`Remediation contract for ${key} has invalid expiry date: ${contract.expiry}.`,
		);
	}

	const expiryTime = Date.parse(`${contract.expiry}T23:59:59Z`);
	if (Number.isNaN(expiryTime)) {
		throw new Error(
			`Remediation contract for ${key} has invalid expiry date: ${contract.expiry}.`,
		);
	}

	if (expiryTime < Date.now()) {
		throw new Error(
			`Remediation contract for ${key} expired on ${contract.expiry}.`,
		);
	}
}

function advisoryKey(packageName, advisoryId) {
	return `${packageName}:${advisoryId}`;
}

function run(command, args, options = {}) {
	const result = spawnSync(command, args, {
		encoding: 'utf8',
		...options,
	});

	if (result.error) {
		throw result.error;
	}

	if (result.status !== 0 && options.ignoreExitCode !== true) {
		throw new Error(result.stderr || result.stdout || `${command} failed`);
	}

	return result;
}

function readAudit() {
	const result = run('bun', ['audit', '--json'], {
		cwd: rootDir,
		ignoreExitCode: true,
	});
	const jsonStartIndex = result.stdout.indexOf('{');
	if (jsonStartIndex === -1) {
		throw new Error('bun audit output did not include JSON payload.');
	}

	const auditJson = result.stdout.slice(jsonStartIndex);

	try {
		return JSON.parse(auditJson || '{}');
	} catch {
		throw new Error(result.stderr || result.stdout || 'bun audit failed');
	}
}

function snapshotTarballs() {
	return fs
		.readdirSync(packageDir)
		.filter((file) => file.endsWith('.tgz'))
		.reduce((accumulator, tarballName) => {
			accumulator.set(
				tarballName,
				fs.statSync(path.join(packageDir, tarballName)).mtimeMs,
			);
			return accumulator;
		}, new Map());
}

function findPublishedTarballPath() {
	const tarballBefore = snapshotTarballs();
	run('bun', ['pm', 'pack'], { cwd: packageDir });

	const tarballs = fs
		.readdirSync(packageDir)
		.filter((file) => file.endsWith('.tgz'))
		.filter((file) => {
			const mtimeMs = fs.statSync(path.join(packageDir, file)).mtimeMs;
			const previousMtimeMs = tarballBefore.get(file);
			return previousMtimeMs === undefined || mtimeMs > previousMtimeMs;
		})
		.sort((left, right) => {
			const leftMtime = fs.statSync(path.join(packageDir, left)).mtimeMs;
			const rightMtime = fs.statSync(path.join(packageDir, right)).mtimeMs;
			return rightMtime - leftMtime;
		});

	if (tarballs.length === 0) {
		throw new Error('Unable to create package tarball for dependency audit.');
	}

	return path.join(packageDir, tarballs[0]);
}

function extractDependencyPackagesFromLockfile(packageLock) {
	const names = new Set();

	const normalizePackagePath = (packagePath) => {
		if (!packagePath.startsWith('node_modules/')) {
			return null;
		}

		const segments = packagePath.slice('node_modules/'.length).split('/');
		const lastNodeModules = segments.lastIndexOf('node_modules');
		const packageSegments = segments.slice(
			lastNodeModules === -1 ? 0 : lastNodeModules + 1,
		);

		if (packageSegments[0].startsWith('@')) {
			return `${packageSegments[0]}/${packageSegments[1]}`;
		}

		return packageSegments[0];
	};

	if (packageLock.packages) {
		for (const packagePath of Object.keys(packageLock.packages)) {
			if (packagePath === '') {
				continue;
			}

			const packageName = normalizePackagePath(packagePath);
			if (!packageName) {
				continue;
			}

			names.add(packageName);
		}

		return names;
	}

	if (!packageLock.dependencies) {
		return names;
	}

	const walk = (dependencies) => {
		for (const [name, info] of Object.entries(dependencies)) {
			names.add(name);
			if (info.dependencies) {
				walk(info.dependencies);
			}
		}
	};

	walk(packageLock.dependencies);
	return names;
}

function readPublishedDependencyPackages() {
	let tarballPath;
	const tempDir = fs.mkdtempSync(
		path.join(os.tmpdir(), 'eslint-config-audit-'),
	);

	try {
		tarballPath = findPublishedTarballPath();
		const tarballName = path.basename(tarballPath);
		const copiedTarballPath = path.join(tempDir, tarballName);
		fs.copyFileSync(tarballPath, copiedTarballPath);

		const consumerPackageJson = {
			name: 'eslint-config-expo-magic-audit-consumer',
			private: true,
			version: '1.0.0',
			dependencies: {
				'eslint-config-expo-magic': `file:${tarballName}`,
			},
		};

		fs.writeFileSync(
			path.join(tempDir, 'package.json'),
			`${JSON.stringify(consumerPackageJson, null, 2)}\n`,
		);

		run(
			'npm',
			[
				'install',
				'--package-lock-only',
				'--package-lock=true',
				'--dry-run=false',
				'--ignore-scripts',
				'--legacy-peer-deps',
				'--no-audit',
			],
			{
				cwd: tempDir,
			},
		);

		const packageLock = JSON.parse(
			fs.readFileSync(path.join(tempDir, 'package-lock.json'), 'utf8'),
		);
		return extractDependencyPackagesFromLockfile(packageLock);
	} finally {
		if (tarballPath && fs.existsSync(tarballPath)) {
			fs.unlinkSync(tarballPath);
		}
		fs.rmSync(tempDir, { recursive: true, force: true });
	}
}

function normalizeAudit(audit) {
	const advisories = new Map();

	for (const [packageName, packageAdvisories] of Object.entries(audit)) {
		for (const advisory of packageAdvisories) {
			const advisoryId = advisory.url.split('/').at(-1);
			if (!/^GHSA-[a-z0-9-]+$/i.test(advisoryId)) {
				throw new Error(
					`Could not identify advisory URL for ${packageName}: ${advisory.url}`,
				);
			}

			const key = advisoryKey(packageName, advisoryId);
			const previous = advisories.get(key);
			if (
				!previous ||
				severityRank[advisory.severity] > severityRank[previous.severity]
			) {
				advisories.set(key, {
					advisoryId,
					packageName,
					severity: advisory.severity,
				});
			}
		}
	}

	return advisories;
}

function normalizePolicy(policy) {
	const advisories = new Map();
	const packageClassifications = new Map();
	const classificationRules = new Map();

	if (policy.schemaVersion !== 1) {
		throw new Error(`Unsupported audit policy schema ${policy.schemaVersion}.`);
	}

	if (Date.parse(`${policy.reviewBy}T23:59:59Z`) < Date.now()) {
		throw new Error(`Dependency audit policy expired on ${policy.reviewBy}.`);
	}

	for (const [classification, classificationPolicy] of Object.entries(
		policy.classifications,
	)) {
		const classificationMayAppearInPublishedDependencyTree =
			classificationPolicy.mayAppearInPublishedDependencyTree ?? false;

		if (typeof classificationMayAppearInPublishedDependencyTree !== 'boolean') {
			throw new Error(
				`Invalid mayAppearInPublishedDependencyTree for classification ${classification}.`,
			);
		}

		classificationRules.set(classification, {
			mayAppearInPublishedDependencyTree:
				classificationMayAppearInPublishedDependencyTree,
		});
	}

	for (const [packageName, packagePolicy] of Object.entries(policy.allowlist)) {
		if (!policy.classifications[packagePolicy.classification]) {
			throw new Error(
				`Unknown classification ${packagePolicy.classification} for ${packageName}.`,
			);
		}

		const classificationPolicy = classificationRules.get(
			packagePolicy.classification,
		);
		let mayAppearInPublishedDependencyTree =
			classificationPolicy?.mayAppearInPublishedDependencyTree ?? false;

		if (packagePolicy.hasOwnProperty('mayAppearInPublishedDependencyTree')) {
			if (
				typeof packagePolicy.mayAppearInPublishedDependencyTree !== 'boolean'
			) {
				throw new Error(
					`Invalid mayAppearInPublishedDependencyTree for ${packageName}.`,
				);
			}

			mayAppearInPublishedDependencyTree =
				packagePolicy.mayAppearInPublishedDependencyTree;
		}

		packageClassifications.set(packageName, {
			classification: packagePolicy.classification,
			mayAppearInPublishedDependencyTree,
		});

		for (const [advisoryId, severity] of Object.entries(
			packagePolicy.advisories ?? {},
		)) {
			if (typeof advisoryId !== 'string' || advisoryId.trim() === '') {
				continue;
			}
			if (!severityRank[severity]) {
				throw new Error(
					`Unknown severity ${severity} for ${packageName}:${advisoryId}.`,
				);
			}

			advisories.set(advisoryKey(packageName, advisoryId), {
				advisoryId,
				classification: packagePolicy.classification,
				packageName,
				severity,
			});
		}
	}

	const contracts = new Map();
	for (const [key, contract] of Object.entries(policy.contracts ?? {})) {
		if (!advisories.has(key)) {
			throw new Error(
				`Remediation contract references unclassified advisory ${key}.`,
			);
		}

		validateContract(key, contract);
		contracts.set(key, contract);
	}

	for (const [key, advisory] of advisories) {
		if (
			severityRank[advisory.severity] >= severityRank.high &&
			!contracts.has(key)
		) {
			throw new Error(
				`Missing remediation contract for high/critical advisory ${key} (${advisory.severity}).`,
			);
		}
	}

	return {
		advisories,
		classificationRules,
		packageClassifications,
		contracts,
	};
}

function main() {
	const policy = JSON.parse(fs.readFileSync(policyPath, 'utf8'));
	const currentAdvisories = normalizeAudit(readAudit());
	const {
		advisories: allowedAdvisories,
		classificationRules,
		packageClassifications,
		contracts,
	} = normalizePolicy(policy);
	const failures = [];
	const resolved = [];
	const classificationCounts = new Map();
	const highCriticalAdvisoryKeys = new Set();
	const publishedPackages = readPublishedDependencyPackages();

	for (const [packageName, packageInfo] of packageClassifications) {
		if (
			!packageInfo.mayAppearInPublishedDependencyTree &&
			publishedPackages.has(packageName)
		) {
			failures.push(
				`Disallowed package on published tree: ${packageName} (` +
					`${packageInfo.classification} must not ship in published dependency tree).`,
			);
		}
	}

	for (const [key, advisory] of currentAdvisories) {
		const allowed = allowedAdvisories.get(key);
		if (!allowed) {
			failures.push(
				`Unclassified advisory ${advisory.packageName}:${advisory.advisoryId} (${advisory.severity}).`,
			);
			continue;
		}

		if (severityRank[advisory.severity] > severityRank[allowed.severity]) {
			failures.push(
				`Severity increased for ${advisory.packageName}:${advisory.advisoryId}: ${allowed.severity} -> ${advisory.severity}.`,
			);
			continue;
		}

		classificationCounts.set(
			allowed.classification,
			(classificationCounts.get(allowed.classification) ?? 0) + 1,
		);
		if (severityRank[advisory.severity] >= severityRank.high) {
			highCriticalAdvisoryKeys.add(key);
		}
	}

	for (const [key, advisory] of allowedAdvisories) {
		if (!currentAdvisories.has(key)) {
			resolved.push(`${advisory.packageName}:${advisory.advisoryId}`);
		}
	}

	if (failures.length > 0) {
		throw new Error(failures.join('\n'));
	}

	for (const [classification, count] of [...classificationCounts].sort()) {
		console.log(`${classification}: ${count} unresolved advisories`);
	}
	console.log(
		`Dependency audit passed with ${currentAdvisories.size} classified advisories ` +
			`(${highCriticalAdvisoryKeys.size} high/critical under remediation contracts); ` +
			`review by ${policy.reviewBy}.`,
	);

	if (resolved.length > 0) {
		console.log(
			`Policy entries no longer reported: ${resolved.sort().join(', ')}`,
		);
	}

	const resolvedContracts = resolved.filter((key) => contracts.has(key));
	if (resolvedContracts.length > 0) {
		console.log(
			`Contracts for resolved advisories: ${resolvedContracts.sort().join(', ')}`,
		);
	}
}

if (require.main === module) {
	main();
}

module.exports = {
	advisoryKey,
	normalizeAudit,
	normalizePolicy,
	severityRank,
	validateContract,
};
