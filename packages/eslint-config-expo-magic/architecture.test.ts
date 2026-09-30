import { describe, expect, it } from 'bun:test';
import { ESLint, type Linter } from 'eslint';
import path from 'node:path';

const { createConfig } = require('./index.js');
const { createArchitectureConfig } = require('./architecture.js');

const repoRoot = path.resolve(__dirname, '../..');

type Layers = {
	routes: string;
	ui: string;
	tokens: string;
	components: string;
};

const EXPO_LAYERS: Layers = {
	routes: 'app',
	ui: 'uikit',
	tokens: 'uikit/tokens',
	components: 'uikit/components',
};

const BARE_LAYERS: Layers = {
	routes: 'core',
	ui: 'shared',
	tokens: 'shared/theme',
	components: 'shared/ui',
};

type BuildOptions = {
	architecture?: Record<string, unknown>;
	base?: Record<string, unknown>;
	composeBase?: boolean;
};

function buildConfig(
	layers: Layers,
	options: BuildOptions = {},
): Linter.Config[] {
	const base = createConfig({
		preset: 'base',
		prettier: false,
		semanticColors: {
			allowFiles: [`**/src/${layers.tokens}/colors.ts`],
			tokenModule: `${layers.tokens}/colors`,
		},
		nativeUi: true,
		...options.base,
	});

	return [
		...base,
		...createArchitectureConfig({
			layers,
			...(options.composeBase ? { baseConfig: base } : {}),
			...options.architecture,
		}),
	];
}

async function lintMessages(
	layers: Layers,
	filePath: string,
	code: string,
	options: BuildOptions = {},
): Promise<Linter.LintMessage[]> {
	const eslint = new ESLint({
		overrideConfigFile: true,
		overrideConfig: buildConfig(layers, options),
		cwd: repoRoot,
	});
	const [result] = await eslint.lintText(code, { filePath });
	const messages = result?.messages ?? [];
	const fatalMessage = messages.find((message) => message.fatal);
	if (fatalMessage) {
		throw new Error(`${filePath}: ${fatalMessage.message}`);
	}
	return messages;
}

async function lint(
	layers: Layers,
	filePath: string,
	code: string,
	options: BuildOptions = {},
): Promise<string[]> {
	const messages = await lintMessages(layers, filePath, code, options);
	return messages.map((message) => message.ruleId ?? 'unknown');
}

function relocate(file: string, layers: Layers): string {
	return file
		.replace(/^src\/uikit\/components\//, `src/${layers.components}/`)
		.replace(/^src\/uikit\/tokens\//, `src/${layers.tokens}/`)
		.replace(/^src\/uikit\//, `src/${layers.ui}/`)
		.replace(/^src\/app\//, `src/${layers.routes}/`);
}

function relocateCode(code: string, layers: Layers): string {
	return code
		.replace(/@\/uikit\/tokens\//g, `@/${layers.tokens}/`)
		.replace(/@\/app\//g, `@/${layers.routes}/`);
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
		code: "export const s = { backgroundColor: '#ff0000' };\n",
		file: 'src/uikit/card.tsx',
		name: 'raw hex colour in the UI layer',
		rule: 'no-restricted-syntax',
	},
	{
		code: "import { colors } from '@/uikit/tokens/colors';\nexport const c = colors;\n",
		file: 'src/features/home/theme.ts',
		name: 'feature importing the raw colour token map',
		rule: 'no-restricted-syntax',
	},
	{
		code: "export { createHomeCopy } from '@/features/home/home-copy';\n",
		file: 'src/features/home/index.ts',
		name: 'feature barrel',
		rule: 'no-restricted-syntax',
	},
	{
		code: "export { Home } from '@/features/home/home-screen';\n",
		file: 'src/features/home/index.tsx',
		name: 'feature barrel written as .tsx',
		rule: 'no-restricted-syntax',
	},
	{
		code: "export { createHomeCopy } from '@/features/home/home-copy';\n",
		file: 'src/features/home/hooks/index.ts',
		name: 'nested barrel',
		rule: 'no-restricted-syntax',
	},
	{
		code: "export { Card } from './card';\n",
		file: 'src/uikit/index.ts',
		name: 'UI-layer barrel',
		rule: 'no-restricted-syntax',
	},
	{
		code: "export { home } from './home';\n",
		file: 'src/app/index.ts',
		name: 'route-layer barrel',
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
		code: "export const load = () => globalThis.fetch('https://x.dev');\n",
		file: 'src/features/home/hooks/use-fetch-c.mts',
		name: 'globalThis.fetch bypass in a .mts module',
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
		code: "import { Pressable } from 'react-native';\nexport default Pressable;\n",
		file: 'src/uikit/card.tsx',
		name: 'direct react-native Pressable outside the owned wrappers',
		rule: 'no-restricted-imports',
	},
	{
		code: "import { SafeAreaView } from 'react-native';\nexport default SafeAreaView;\n",
		file: 'src/uikit/components/screen.tsx',
		name: 'react-native SafeAreaView inside an owned wrapper',
		rule: 'no-restricted-imports',
	},
	{
		code: 'export const t = (n: number[]) => n.filter((x) => x > 2).reduce((a, b) => a + b, 0);\n',
		file: 'src/features/home/screens/logic-view.tsx',
		name: 'business logic in a view',
		rule: 'no-restricted-syntax',
	},
	{
		code: 'export type Entity = { id: string };\n',
		file: 'src/features/home/domain/entity.ts',
		name: 'Clean Architecture domain/ tree',
		rule: 'no-restricted-syntax',
	},
	{
		code: 'export const Entity = () => null;\n',
		file: 'src/features/home/domain/entity.tsx',
		name: 'Clean Architecture domain/ tree written as .tsx',
		rule: 'no-restricted-syntax',
	},
	{
		code: "export const load = () => fetch('https://x.dev');\n",
		file: 'src/features/home/hooks/use-fetch-a.ts',
		name: 'fetch in a feature hook',
		rule: 'no-restricted-globals',
	},
	{
		code: "import axios from 'axios';\nexport default axios;\n",
		file: 'src/features/home/api.ts',
		name: 'HTTP client in a feature module',
		rule: 'no-restricted-imports',
	},
	{
		code: "import axios from 'axios';\nexport default axios;\n",
		file: 'src/features/home/home-view.tsx',
		name: 'HTTP client in a feature view',
		rule: 'no-restricted-imports',
	},
	{
		code: "import axios from 'axios';\nexport default axios;\n",
		file: 'src/app/home.tsx',
		name: 'HTTP client in a route',
		rule: 'no-restricted-imports',
	},
	{
		code: "import { layout } from '@/app/_layout';\nexport default layout;\n",
		file: 'src/features/home/home-screen.tsx',
		name: 'feature view importing a route',
		rule: 'no-restricted-imports',
	},
	{
		code: "import { layout } from '@/app/_layout';\nexport default layout;\n",
		file: 'src/features/home/home-copy.ts',
		name: 'feature module importing a route',
		rule: 'no-restricted-imports',
	},
	{
		code: "import { home } from '@/features/home/home-copy';\nexport default home;\n",
		file: 'src/uikit/card.ts',
		name: 'UI module importing a feature',
		rule: 'no-restricted-imports',
	},
	{
		code: "import { home } from '@/features/home/home-copy';\nexport default home;\n",
		file: 'src/uikit/card.tsx',
		name: 'UI view importing a feature',
		rule: 'no-restricted-imports',
	},
	{
		code: "import { api } from '@/services/api/client';\nexport default api;\n",
		file: 'src/uikit/card.jsx',
		name: 'UI view importing a service in .jsx',
		rule: 'no-restricted-imports',
	},
	{
		code: "import { home } from '@/features/home/home-copy';\nexport default home;\n",
		file: 'src/uikit/components/button.tsx',
		name: 'owned wrapper importing a feature',
		rule: 'no-restricted-imports',
	},
	{
		code: "import { home } from '@/features/home/home-copy';\nexport default home;\n",
		file: 'src/services/native/camera.ts',
		name: 'native service wrapper importing a feature',
		rule: 'no-restricted-imports',
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
		code: "import { query } from '@/services/query/home';\nexport default query;\n",
		file: 'src/app/home.tsx',
		name: 'route importing a query module',
		rule: 'no-restricted-imports',
	},
	{
		code: "import useHomeScreen from '@/features/home/hooks/use-home-screen';\nexport default useHomeScreen;\n",
		file: 'src/features/home/screens/home-screen-view.tsx',
		name: 'view importing a feature hook',
		rule: 'no-restricted-syntax',
	},
	{
		code: "import { useHome } from './use-home';\nexport default useHome;\n",
		file: 'src/features/home/home-view.tsx',
		name: 'view importing a flat feature hook',
		rule: 'no-restricted-syntax',
	},
	{
		code: "import { createHomeCopy } from '@/features/home/home-copy';\nexport const x = createHomeCopy('a');\n",
		file: 'src/services/logger/bad-dep.ts',
		name: 'service importing a feature',
		rule: 'no-restricted-imports',
	},
	{
		code: "import { home } from '../../features/home/home-copy';\nexport default home;\n",
		file: 'src/services/api/bad-dep.ts',
		name: 'service importing a feature by relative path',
		rule: 'no-restricted-imports',
	},
	{
		code: "import { SafeAreaView } from 'react-native';\nexport default SafeAreaView;\n",
		file: 'src/features/home/home-view.test.tsx',
		name: 'react-native SafeAreaView in a test',
		rule: 'no-restricted-imports',
	},
];

const ALLOWED: {
	code: string;
	file: string;
	name: string;
	rule: string;
}[] = [
	{
		code: "import { createHomeCopy } from '@/features/home/home-copy';\nexport const useHome = () => createHomeCopy('x');\n",
		file: 'src/features/home/hooks/use-home.ts',
		name: 'a same-feature import',
		rule: 'expo-magic/no-cross-feature-imports',
	},
	{
		code: "import { c } from '../home-copy';\nexport const useHome = () => c;\n",
		file: 'src/features/home/hooks/use-home.ts',
		name: 'a same-feature relative import',
		rule: 'expo-magic/no-cross-feature-imports',
	},
	{
		code: "import type { HomeContract } from '@/features/home/contracts/home';\nexport const use = (c: HomeContract) => c;\n",
		file: 'src/features/other/hooks/use-other.ts',
		name: 'a cross-feature contracts import',
		rule: 'expo-magic/no-cross-feature-imports',
	},
	{
		code: "import { createStorageItem } from 'react-native-nitro-storage';\nexport default createStorageItem;\n",
		file: 'src/services/native/nitro-storage.ts',
		name: 'the owned native wrapper importing its library',
		rule: 'no-restricted-imports',
	},
	{
		code: "import { Pressable } from 'react-native';\nexport default Pressable;\n",
		file: 'src/services/native/press.ts',
		name: 'the owned native wrapper importing a primitive',
		rule: 'no-restricted-imports',
	},
	{
		code: "import { Pressable } from 'react-native';\nexport default Pressable;\n",
		file: 'src/uikit/components/button.tsx',
		name: 'an owned component wrapper importing its primitive',
		rule: 'no-restricted-imports',
	},
	{
		code: "export const load = () => fetch('https://x.dev');\n",
		file: 'src/services/api/client.ts',
		name: 'fetch inside services',
		rule: 'no-restricted-globals',
	},
	{
		code: "import axios from 'axios';\nexport default axios;\n",
		file: 'src/services/api/client.ts',
		name: 'an HTTP client inside services',
		rule: 'no-restricted-imports',
	},
	{
		code: 'export const log = (m: string) => {\n\tconsole.log(m);\n};\n',
		file: 'src/services/logger/logger.ts',
		name: 'console inside the owned logger',
		rule: 'no-console',
	},
	{
		code: 'export const log = (m: string) => {\n\tglobalThis.console?.log(m);\n};\n',
		file: 'src/services/logger/logger.ts',
		name: 'globalThis.console inside the owned logger',
		rule: 'no-restricted-syntax',
	},
	{
		code: "export const colors = { primary: '#ffffff' };\n",
		file: 'src/uikit/tokens/colors.ts',
		name: 'raw colours inside the token module',
		rule: 'no-restricted-syntax',
	},
	{
		code: 'export const List = (p: { items: string[] }) => p.items.map((i) => i);\n',
		file: 'src/features/home/list-view.tsx',
		name: 'a single map call in a view',
		rule: 'no-restricted-syntax',
	},
	{
		code: "import type { HomeState } from './use-home';\nexport const x = (s: HomeState) => s;\n",
		file: 'src/features/home/home-view.tsx',
		name: 'a type-only import of a feature hook in a view',
		rule: 'no-restricted-syntax',
	},
	{
		code: "import { home } from '../home-copy';\nexport default home;\n",
		file: 'src/services/api/client.ts',
		name: 'a relative import that stays inside services',
		rule: 'no-restricted-imports',
	},
];

describe('createArchitectureConfig', () => {
	it('rejects a layers object missing a required key', () => {
		expect(() => createArchitectureConfig({ layers: { routes: '' } })).toThrow(
			TypeError,
		);
	});

	it('rejects a non-object options argument', () => {
		expect(() => createArchitectureConfig([])).toThrow(TypeError);
	});

	it('rejects a non-array baseConfig', () => {
		expect(() => createArchitectureConfig({ baseConfig: {} })).toThrow(
			TypeError,
		);
	});

	it('throws on a parse error instead of passing an allow case', async () => {
		await expect(
			lint(EXPO_LAYERS, 'src/features/home/x.ts', 'export const = ;\n'),
		).rejects.toThrow();
	});

	/**
	 * A type-stripped app is .js/.jsx. Layer globs that only matched .ts/.tsx
	 * silently stopped enforcing anything there, so every rule is re-checked
	 * against the JavaScript extensions.
	 */
	describe('javascript lane', () => {
		const jsCases: {
			code: string;
			file: string;
			name: string;
			rule: string;
		}[] = [
			{
				code: 'export const x = 1;\n',
				file: 'src/features/home/BadName.js',
				name: 'PascalCase filename',
				rule: 'expo-magic/kebab-case-filenames',
			},
			{
				code: "export const shout = () => {\n\tglobalThis.console.log('x');\n};\n",
				file: 'src/features/home/log-b.js',
				name: 'globalThis.console bypass',
				rule: 'no-restricted-syntax',
			},
			{
				code: "export { c } from '@/features/home/home-copy';\n",
				file: 'src/features/home/hooks/index.js',
				name: 'nested barrel',
				rule: 'no-restricted-syntax',
			},
			{
				code: "export { c } from './home-screen';\n",
				file: 'src/features/home/index.jsx',
				name: 'barrel written as .jsx',
				rule: 'no-restricted-syntax',
			},
			{
				code: "import { c } from '@/features/home/home-copy';\nexport const useX = () => c;\n",
				file: 'src/features/other/hooks/use-x.js',
				name: 'cross-feature import',
				rule: 'expo-magic/no-cross-feature-imports',
			},
			{
				code: "export const load = () => fetch('https://x.dev');\n",
				file: 'src/features/home/hooks/use-f.js',
				name: 'fetch in a feature hook',
				rule: 'no-restricted-globals',
			},
			{
				code: "import axios from 'axios';\nexport default axios;\n",
				file: 'src/features/home/home-view.jsx',
				name: 'HTTP client in a feature view',
				rule: 'no-restricted-imports',
			},
		];

		for (const jsCase of jsCases) {
			it(`catches ${jsCase.name} in ${path.extname(jsCase.file)}`, async () => {
				const ruleIds = await lint(EXPO_LAYERS, jsCase.file, jsCase.code);
				expect(ruleIds).toContain(jsCase.rule);
			});
		}
	});

	for (const lane of [
		{ layers: EXPO_LAYERS, name: 'expo' },
		{ layers: BARE_LAYERS, name: 'bare' },
	]) {
		for (const composeBase of [false, true]) {
			const mode = composeBase ? 'with baseConfig' : 'standalone';
			describe(`${lane.name} lane (${mode})`, () => {
				for (const violation of VIOLATIONS) {
					it(`catches ${violation.name}`, async () => {
						const ruleIds = await lint(
							lane.layers,
							relocate(violation.file, lane.layers),
							relocateCode(violation.code, lane.layers),
							{ composeBase },
						);
						expect(ruleIds).toContain(violation.rule);
					});
				}

				for (const allowed of ALLOWED) {
					it(`allows ${allowed.name}`, async () => {
						const ruleIds = await lint(
							lane.layers,
							relocate(allowed.file, lane.layers),
							relocateCode(allowed.code, lane.layers),
							{ composeBase },
						);
						expect(ruleIds).not.toContain(allowed.rule);
					});
				}
			});
		}
	}

	describe('aliasPrefix', () => {
		const options = { architecture: { aliasPrefix: '~' } };

		it('bans a service importing a feature through the alias', async () => {
			const ruleIds = await lint(
				EXPO_LAYERS,
				'src/services/api/bad-dep.ts',
				"import { home } from '~/features/home/home-copy';\nexport default home;\n",
				options,
			);
			expect(ruleIds).toContain('no-restricted-imports');
		});

		it('bans a feature importing a route through the alias', async () => {
			const ruleIds = await lint(
				EXPO_LAYERS,
				'src/features/home/home-copy.ts',
				"import { layout } from '~/app/_layout';\nexport default layout;\n",
				options,
			);
			expect(ruleIds).toContain('no-restricted-imports');
		});

		it('bans a view importing a query module through the alias', async () => {
			const ruleIds = await lint(
				EXPO_LAYERS,
				'src/features/home/home-view.tsx',
				"import { q } from '~/services/query/home';\nexport default q;\n",
				options,
			);
			expect(ruleIds).toContain('no-restricted-imports');
		});
	});

	describe('baseConfig composition', () => {
		const agentBase = {
			preset: 'fast',
			agent: true,
		};

		it('keeps the agent selectors in src when composed', async () => {
			const ruleIds = await lint(
				EXPO_LAYERS,
				'src/features/home/cast.ts',
				'export const cast = (v: string) => v as unknown as number;\n',
				{ base: agentBase, composeBase: true },
			);
			expect(ruleIds).toContain('no-restricted-syntax');
		});

		it('keeps the agent selectors in a view when composed', async () => {
			const ruleIds = await lint(
				EXPO_LAYERS,
				'src/features/home/cast-view.tsx',
				'export const cast = (v: string) => v as unknown as number;\n',
				{ base: agentBase, composeBase: true },
			);
			expect(ruleIds).toContain('no-restricted-syntax');
		});

		it('drops the agent selectors in src without baseConfig', async () => {
			const ruleIds = await lint(
				EXPO_LAYERS,
				'src/features/home/cast.ts',
				'export const cast = (v: string) => v as unknown as number;\n',
				{ base: agentBase },
			);
			expect(ruleIds).not.toContain('no-restricted-syntax');
		});

		it('does not apply test-only selectors to source files', async () => {
			const ruleIds = await lint(
				EXPO_LAYERS,
				'src/services/db.ts',
				'export const page = (q: { skip: (n: number) => unknown }) => q.skip(10);\n',
				{ base: agentBase, composeBase: true },
			);
			expect(ruleIds).not.toContain('no-restricted-syntax');
		});

		it('keeps the architecture selectors alongside the agent ones', async () => {
			const messages = await lintMessages(
				EXPO_LAYERS,
				'src/features/home/cast.ts',
				"export const cast = (v: string) => v as unknown as number;\nexport const load = () => globalThis.fetch('x');\n",
				{ base: agentBase, composeBase: true },
			);
			expect(
				messages.filter((message) => message.ruleId === 'no-restricted-syntax'),
			).toHaveLength(2);
		});

		it('keeps a consumer import ban inside src when composed', async () => {
			const base = [
				...createConfig({ preset: 'base', prettier: false }),
				{
					rules: {
						'no-restricted-imports': [
							'error',
							{ paths: [{ name: 'lodash', message: 'Use native methods.' }] },
						],
					},
				},
			];
			const eslint = new ESLint({
				overrideConfigFile: true,
				overrideConfig: [
					...base,
					...createArchitectureConfig({ baseConfig: base }),
				],
				cwd: repoRoot,
			});
			const [result] = await eslint.lintText(
				"import _ from 'lodash';\nexport default _;\n",
				{ filePath: 'src/features/home/home-copy.ts' },
			);
			expect(result.messages.map((message) => message.message)).toContain(
				"'lodash' import is restricted from being used. Use native methods.",
			);
		});

		it('keeps a consumer path ban in wrapper and test files when composed', async () => {
			const base = [
				...createConfig({ preset: 'base', prettier: false, nativeUi: true }),
				{
					rules: {
						'no-restricted-imports': [
							'error',
							{ paths: [{ name: 'lodash', message: 'Use native methods.' }] },
						],
					},
				},
			];
			const eslint = new ESLint({
				overrideConfigFile: true,
				overrideConfig: [
					...base,
					...createArchitectureConfig({ baseConfig: base, nativeUi: true }),
				],
				cwd: repoRoot,
			});

			for (const filePath of [
				'src/uikit/components/button.tsx',
				'src/services/native/cam.ts',
				'src/features/home/home.test.tsx',
			]) {
				const [result] = await eslint.lintText(
					"import _ from 'lodash';\nimport { Pressable } from 'react-native';\nexport default [_, Pressable];\n",
					{ filePath },
				);
				const messages = result.messages.map((message) => message.message);
				expect(messages).toContain(
					"'lodash' import is restricted from being used. Use native methods.",
				);
				expect(
					messages.some((message) => message.includes("'Pressable'")),
				).toBe(false);
			}
		});

		it('honours nativeUi.additionalRestrictions from the base config', async () => {
			const nativeUi = {
				additionalRestrictions: [
					{
						name: 'react-native',
						importNames: ['Switch'],
						message: 'Use the owned toggle.',
					},
				],
			};
			const ruleIds = await lint(
				EXPO_LAYERS,
				'src/features/home/settings-view.tsx',
				"import { Switch } from 'react-native';\nexport default Switch;\n",
				{ base: { nativeUi }, composeBase: true },
			);
			expect(ruleIds).toContain('no-restricted-imports');
		});
	});

	describe('nativeUi option', () => {
		const nativeUi = {
			additionalRestrictions: [
				{
					name: 'react-native',
					importNames: ['Switch'],
					message: 'Use the owned toggle.',
				},
			],
			allowFiles: ['src/uikit/components/toggle/*.tsx'],
		};

		it('restates nativeUi.additionalRestrictions in every layer', async () => {
			const ruleIds = await lint(
				EXPO_LAYERS,
				'src/features/home/settings-view.tsx',
				"import { Switch } from 'react-native';\nexport default Switch;\n",
				{ base: { nativeUi }, architecture: { nativeUi } },
			);
			expect(ruleIds).toContain('no-restricted-imports');
		});

		it('treats nativeUi.allowFiles as owned wrappers', async () => {
			const ruleIds = await lint(
				EXPO_LAYERS,
				'src/uikit/components/toggle/switch.tsx',
				"import { Switch } from 'react-native';\nexport default Switch;\n",
				{ base: { nativeUi }, architecture: { nativeUi }, composeBase: true },
			);
			expect(ruleIds).not.toContain('no-restricted-imports');
		});
	});

	describe('tokenModule', () => {
		for (const tokenModule of ['uikit/tokens', 'uikit/tokens/colors']) {
			it(`accepts ${tokenModule} as the token module`, async () => {
				const options = { architecture: { tokenModule } };
				const tokenFile = await lint(
					EXPO_LAYERS,
					'src/uikit/tokens/colors.ts',
					"export const colors = { primary: '#ffffff' };\n",
					options,
				);
				const consumer = await lint(
					EXPO_LAYERS,
					'src/features/home/theme.ts',
					"import { colors } from '@/uikit/tokens/colors';\nexport const c = colors;\n",
					options,
				);
				expect(tokenFile).not.toContain('no-restricted-syntax');
				expect(consumer).toContain('no-restricted-syntax');
			});
		}
	});
});
