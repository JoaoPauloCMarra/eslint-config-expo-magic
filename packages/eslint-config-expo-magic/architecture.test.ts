import { describe, expect, it } from 'bun:test';
import { ESLint, type Linter } from 'eslint';

const { createConfig } = require('./index.js');
const { createArchitectureConfig } = require('./architecture.js');

const EXPO_LAYERS = {
	routes: 'app',
	ui: 'uikit',
	tokens: 'uikit/tokens',
	components: 'uikit/components',
};

const BARE_LAYERS = {
	routes: 'core',
	ui: 'shared',
	tokens: 'shared/theme',
	components: 'shared/ui',
};

function buildConfig(layers: Record<string, string>): Linter.Config[] {
	return createConfig({
		preset: 'base',
		prettier: false,
		semanticColors: {
			allowFiles: [`**/src/${layers.tokens}/colors.ts`],
			tokenModule: layers.tokens,
		},
		nativeUi: true,
	}).concat(createArchitectureConfig({ layers }));
}

async function lint(
	layers: Record<string, string>,
	filePath: string,
	code: string,
): Promise<string[]> {
	const eslint = new ESLint({
		overrideConfigFile: true,
		overrideConfig: buildConfig(layers) as Linter.Config[],
		cwd: process.cwd(),
	});
	const [result] = await eslint.lintText(code, { filePath });
	return (result?.messages ?? [])
		.map((message) => message.ruleId ?? 'fatal')
		.filter((ruleId): ruleId is string => Boolean(ruleId));
}

/**
 * Each case is a rule the kit documents. Before `createArchitectureConfig`
 * these were silently dropped by flat-config option replacement, so every one
 * of them is a regression test, not just a feature test.
 */
const VIOLATIONS: {
	code: string;
	file: string;
	name: string;
	rule: string;
}[] = [
	{
		code: "import { createHomeCopy } from '@/features/home/home-copy';\nexport const useX = () => createHomeCopy('x');\n",
		file: 'src/features/other/hooks/use-x.ts',
		name: 'cross-feature import of a root-level feature file',
		rule: 'expo-magic/no-cross-feature-imports',
	},
	{
		code: "import useHome from '@/features/home/hooks/use-home-screen';\nexport const useY = () => useHome();\n",
		file: 'src/features/other/hooks/use-y.ts',
		name: 'cross-feature import of a feature subfolder',
		rule: 'expo-magic/no-cross-feature-imports',
	},
	{
		code: "import { c } from '../../home/home-copy';\nexport const useZ = () => c;\n",
		file: 'src/features/other/hooks/use-z.ts',
		name: 'cross-feature import written as a relative path',
		rule: 'expo-magic/no-cross-feature-imports',
	},
	{
		code: "export const s = { backgroundColor: '#ff0000' };\n",
		file: 'src/features/home/screens/hex-view.tsx',
		name: 'raw hex colour in a view',
		rule: 'no-restricted-syntax',
	},
	{
		code: "export const s = { backgroundColor: 'rgba(0,0,0,0.5)' };\n",
		file: 'src/features/home/screens/rgba-view.tsx',
		name: 'raw rgba colour in a view',
		rule: 'no-restricted-syntax',
	},
	{
		code: "export { createHomeCopy } from '@/features/home/home-copy';\n",
		file: 'src/features/home/index.ts',
		name: 'feature barrel',
		rule: 'no-restricted-syntax',
	},
	{
		code: "export { createHomeCopy } from '@/features/home/home-copy';\n",
		file: 'src/features/home/hooks/index.ts',
		name: 'nested barrel',
		rule: 'no-restricted-syntax',
	},
	{
		code: "export const shout = () => {\n\tglobalThis.console.log('x');\n};\n",
		file: 'src/features/home/log-b.ts',
		name: 'globalThis.console bypass',
		rule: 'no-restricted-syntax',
	},
	{
		code: "export const load = () => globalThis.fetch('https://x.dev');\n",
		file: 'src/features/home/hooks/use-fetch-b.ts',
		name: 'globalThis.fetch bypass',
		rule: 'no-restricted-syntax',
	},
	{
		code: 'export const x = 1;\n',
		file: 'src/features/home/BadName.ts',
		name: 'PascalCase filename',
		rule: 'expo-magic/kebab-case-filenames',
	},
	{
		code: "import { Pressable } from 'react-native';\nexport default Pressable;\n",
		file: 'src/features/home/screens/prim-view.tsx',
		name: 'direct react-native Pressable in a view',
		rule: 'no-restricted-imports',
	},
	{
		code: "import { Image } from 'react-native';\nexport default Image;\n",
		file: 'src/features/home/screens/img-view.tsx',
		name: 'direct react-native Image in a view',
		rule: 'no-restricted-imports',
	},
	{
		code: 'export const t = (n: number[]) => n.filter((x) => x > 2).reduce((a, b) => a + b, 0);\n',
		file: 'src/features/home/screens/logic-view.tsx',
		name: 'business logic in a view',
		rule: 'no-restricted-syntax',
	},
	{
		code: "export type Entity = { id: string };\n",
		file: 'src/features/home/domain/entity.ts',
		name: 'Clean Architecture domain/ tree',
		rule: 'no-restricted-syntax',
	},
	{
		code: "export const load = () => fetch('https://x.dev');\n",
		file: 'src/features/home/hooks/use-fetch-a.ts',
		name: 'fetch in a feature hook',
		rule: 'no-restricted-globals',
	},
	{
		code: "export const shout = () => {\n\tconsole.log('x');\n};\n",
		file: 'src/features/home/log-a.ts',
		name: 'console.* in a feature',
		rule: 'no-console',
	},
	{
		code: "import { store } from '@/services/client-state/app-store';\nexport default store;\n",
		file: 'src/features/home/screens/state-view.tsx',
		name: 'view importing a client-state module',
		rule: 'no-restricted-imports',
	},
	{
		code: "import useHomeScreen from '@/features/home/hooks/use-home-screen';\nexport default useHomeScreen;\n",
		file: 'src/features/home/screens/home-screen-view.tsx',
		name: 'view importing a feature hook',
		rule: 'no-restricted-syntax',
	},
	{
		code: "import { createHomeCopy } from '@/features/home/home-copy';\nexport const x = createHomeCopy('a');\n",
		file: 'src/services/logger/bad-dep.ts',
		name: 'service importing a feature',
		rule: 'no-restricted-imports',
	},
];

describe('createArchitectureConfig', () => {
	it('rejects a layers object missing a required key', () => {
		expect(() =>
			createArchitectureConfig({ layers: { routes: '' } }),
		).toThrow(TypeError);
	});

	it('rejects a non-object options argument', () => {
		expect(() => createArchitectureConfig([])).toThrow(TypeError);
	});

	for (const lane of [
		{ layers: EXPO_LAYERS, name: 'expo' },
		{ layers: BARE_LAYERS, name: 'bare' },
	]) {
		describe(`${lane.name} lane`, () => {
			for (const violation of VIOLATIONS) {
				it(`catches ${violation.name}`, async () => {
					const file = violation.file.replace(
						/src\/(uikit|shared)\//,
						`src/${lane.layers.ui}/`,
					);
					const ruleIds = await lint(lane.layers, file, violation.code);
					expect(ruleIds).toContain(violation.rule);
				});
			}

			it('allows a same-feature import', async () => {
				const ruleIds = await lint(
					lane.layers,
					'src/features/home/hooks/use-home.ts',
					"import { createHomeCopy } from '@/features/home/home-copy';\nexport const useHome = () => createHomeCopy('x');\n",
				);
				expect(ruleIds).not.toContain('expo-magic/no-cross-feature-imports');
			});

			it('allows a same-feature relative import', async () => {
				const ruleIds = await lint(
					lane.layers,
					'src/features/home/hooks/use-home.ts',
					"import { c } from '../home-copy';\nexport const useHome = () => c;\n",
				);
				expect(ruleIds).not.toContain(
					'expo-magic/no-cross-feature-imports',
				);
			});

			it('allows a cross-feature contracts import', async () => {
				const ruleIds = await lint(
					lane.layers,
					'src/features/other/hooks/use-other.ts',
					"import type { HomeContract } from '@/features/home/contracts/home';\nexport const use = (c: HomeContract) => c;\n",
				);
				expect(ruleIds).not.toContain('expo-magic/no-cross-feature-imports');
			});

			it('allows fetch inside services', async () => {
				const ruleIds = await lint(
					lane.layers,
					'src/services/api/client.ts',
					"export const load = () => fetch('https://x.dev');\n",
				);
				expect(ruleIds).not.toContain('no-restricted-globals');
			});

			it('allows console inside the owned logger', async () => {
				const ruleIds = await lint(
					lane.layers,
					'src/services/logger/logger.ts',
					"export const log = (m: string) => {\n\tconsole.log(m);\n};\n",
				);
				expect(ruleIds).not.toContain('no-console');
			});

			it('allows globalThis.console inside the owned logger', async () => {
				const ruleIds = await lint(
					lane.layers,
					'src/services/logger/logger.ts',
					"export const log = (m: string) => {\n\tglobalThis.console?.log(m);\n};\n",
				);
				expect(ruleIds).not.toContain('no-restricted-syntax');
			});
		});
	}
});
