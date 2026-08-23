import { describe, expect, it } from 'bun:test';

const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

type ConditionalExport = {
	types: string;
	require: string;
	import: string;
};

type PackageManifest = {
	dependencies: Record<string, string>;
	exports: Record<string, ConditionalExport | string>;
	files: string[];
	peerDependencies: Record<string, string>;
	peerDependenciesMeta: Record<string, { optional: boolean }>;
	installPeers?: boolean;
};

const packageDir = __dirname;
const packageManifest = require('./package.json') as PackageManifest;

function isRuntimeNamedExport(name: string) {
	return /^[$A-Z_a-z][$\w]*$/.test(name) && !/^(?:0|[1-9]\d*)$/.test(name);
}

describe('package exports', () => {
	it('removes the obsolete no-prettier subpath', () => {
		expect(packageManifest.exports['./no-prettier']).toBeUndefined();
		expect(packageManifest.files).not.toContain('no-prettier.js');
		expect(packageManifest.files).not.toContain('no-prettier.mjs');
		expect(packageManifest.files).not.toContain('no-prettier.d.ts');
	});

	it('keeps required runtime ownership lean and optional integrations peer-only', () => {
		expect(Object.keys(packageManifest.dependencies).sort()).toEqual([
			'@eslint/compat',
			'eslint-config-expo',
			'eslint-import-resolver-typescript',
			'eslint-plugin-import-x',
			'eslint-plugin-react-19-upgrade',
			'eslint-plugin-react-hooks',
			'eslint-plugin-react-native',
			'eslint-plugin-unused-imports',
			'globals',
			'typescript-eslint',
		]);
		expect(packageManifest.peerDependencies).toMatchObject({
			eslint: '^10.9.0',
			typescript: '>=5.9.3 <6.1.0',
		});
		expect(packageManifest.peerDependencies['react-test-renderer']).toBeUndefined();
		expect(packageManifest.peerDependenciesMeta).toEqual({
			'eslint-config-prettier': { optional: true },
			'eslint-plugin-boundaries': { optional: true },
			'eslint-plugin-jest': { optional: true },
			'eslint-plugin-prettier': { optional: true },
			'eslint-plugin-testing-library': { optional: true },
			expo: { optional: true },
			prettier: { optional: true },
			react: { optional: true },
		});
		expect(packageManifest.installPeers).toBeUndefined();
		for (const redundantDependency of [
			'eslint',
			'@typescript-eslint/eslint-plugin',
			'@typescript-eslint/parser',
			'@typescript-eslint/utils',
			'eslint-plugin-react',
		]) {
			expect(packageManifest.dependencies).not.toHaveProperty(
				redundantDependency,
			);
		}
	});

	it('keeps the package README synchronized with the repository README', () => {
		const repositoryReadme = fs.readFileSync(
			path.join(packageDir, '..', '..', 'README.md'),
			'utf8',
		);
		const packageReadme = fs.readFileSync(
			path.join(packageDir, 'README.md'),
			'utf8',
		);

		expect(packageReadme).toBe(repositoryReadme);
	});

	it('keeps optional feature-boundary helpers out of the root API', async () => {
		const rootManifest = packageManifest.exports['.'];
		if (typeof rootManifest === 'string') {
			throw new Error('Root export must declare conditional exports');
		}

		const commonJsModule = require(path.join(packageDir, rootManifest.require));
		const esmModule = await import(
			`${pathToFileURL(path.join(packageDir, rootManifest.import)).href}?root-optional-peer-contract`
		);

		for (const name of [
			'createFeatureBoundaryConfig',
			'featureBoundaries',
		]) {
			expect(Object.prototype.hasOwnProperty.call(commonJsModule, name)).toBe(
				false,
			);
			expect(Object.prototype.hasOwnProperty.call(esmModule, name)).toBe(false);
		}
	});

	for (const [subpath, exportValue] of Object.entries(
		packageManifest.exports,
	)) {
		if (typeof exportValue === 'string') {
			it(`${subpath} resolves its declared file`, () => {
				expect(fs.existsSync(path.join(packageDir, exportValue))).toBe(true);
			});
			continue;
		}

		it(`${subpath} ships runtime and declaration targets`, () => {
			for (const target of [
				exportValue.types,
				exportValue.require,
				exportValue.import,
			]) {
				expect(fs.existsSync(path.join(packageDir, target))).toBe(true);
				expect(packageManifest.files).toContain(target.replace(/^\.\//, ''));
			}
		});

		it(`${subpath} keeps CommonJS and ESM exports aligned`, async () => {
			const commonJsModule = require(
				path.join(packageDir, exportValue.require),
			);
			const esmModule = await import(
				`${pathToFileURL(path.join(packageDir, exportValue.import)).href}?subpath=${encodeURIComponent(subpath)}`
			);
			const commonJsNamedExports = Object.keys(commonJsModule)
				.filter(isRuntimeNamedExport)
				.sort();
			const esmNamedExports = Object.keys(esmModule)
				.filter((name) => name !== 'default')
				.sort();

			expect(esmModule.default).toBe(commonJsModule);
			expect(esmNamedExports).toEqual(commonJsNamedExports);
		});
	}

	it('pr-guardrails default and named imports expose the CommonJS values', async () => {
		const exportValue = packageManifest.exports['./pr-guardrails'];
		if (typeof exportValue === 'string') {
			throw new Error('pr-guardrails must declare conditional exports');
		}

		const commonJsModule = require(path.join(packageDir, exportValue.require));
		const esmModule = await import(
			`${pathToFileURL(path.join(packageDir, exportValue.import)).href}?pr-guardrails-contract`
		);

		expect(esmModule.default).toBe(commonJsModule);
		for (const name of Object.keys(commonJsModule)) {
			expect(esmModule[name]).toBe(commonJsModule[name]);
		}
	});
});
