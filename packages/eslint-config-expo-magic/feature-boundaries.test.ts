import { describe, expect, it } from 'bun:test';
import { ESLint, type Linter } from 'eslint';
import path from 'node:path';

const featureBoundaries = require('./feature-boundaries.js');
const { createConfig } = require('./index.js');

const repoRoot = path.resolve(__dirname, '../..');

async function resolvedSettings(config: Linter.Config[], filePath: string) {
	const eslint = new ESLint({
		overrideConfigFile: true,
		overrideConfig: config,
		cwd: repoRoot,
	});

	return (await eslint.calculateConfigForFile(filePath)).settings;
}

describe('feature-boundaries subpath', () => {
	it('gives recommended the import resolver createConfig adds', async () => {
		const standalone = await resolvedSettings(
			[{ files: ['**/*.tsx'] }, ...featureBoundaries.recommended],
			'features/home/home-screen.tsx',
		);
		const composed = await resolvedSettings(
			createConfig({ preset: 'fast', featureBoundaries: true }),
			'features/home/home-screen.tsx',
		);

		expect(standalone['import/resolver']).toBeDefined();
		expect(standalone['import/resolver'].typescript).toEqual(
			expect.objectContaining({
				project: expect.arrayContaining(['./test-project/tsconfig.json']),
			}),
		);
		expect(standalone['import/resolver'].node).toEqual(
			composed['import/resolver'].node,
		);
	});
});
