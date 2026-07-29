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
	exports: Record<string, ConditionalExport | string>;
	files: string[];
};

const packageDir = __dirname;
const packageManifest = require('./package.json') as PackageManifest;

function isRuntimeNamedExport(name: string) {
	return /^[$A-Z_a-z][$\w]*$/.test(name) && !/^(?:0|[1-9]\d*)$/.test(name);
}

describe('package exports', () => {
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
});
