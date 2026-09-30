import { afterEach, describe, expect, it } from 'bun:test';
import { ESLint, type Linter } from 'eslint';
import path from 'node:path';

const mobileApp = require('./mobile-app.js');

const repoRoot = path.resolve(__dirname, '../..');
const originalPreset = process.env.ESLINT_CONFIG_PRESET;

type RestrictedPath = { name: string; importNames?: string[] };
type RestrictedPattern = { group?: string[] };

afterEach(() => {
	if (originalPreset === undefined) {
		delete process.env.ESLINT_CONFIG_PRESET;
		return;
	}
	process.env.ESLINT_CONFIG_PRESET = originalPreset;
});

async function effectiveConfig(
	filePath: string,
	config: Linter.Config[] = mobileApp.createMobileAppConfig({ preset: 'fast' }),
) {
	const eslint = new ESLint({
		overrideConfigFile: true,
		overrideConfig: config,
		cwd: repoRoot,
	});

	return eslint.calculateConfigForFile(filePath);
}

function restrictedImports(rules: Record<string, unknown>) {
	const rule = rules['no-restricted-imports'] as
		| [number, { paths?: RestrictedPath[]; patterns?: RestrictedPattern[] }]
		| undefined;
	const options = rule?.[1] ?? {};

	return {
		paths: options.paths ?? [],
		patterns: options.patterns ?? [],
	};
}

function bansImport(
	rules: Record<string, unknown>,
	name: string,
	importName?: string,
) {
	return restrictedImports(rules).paths.some(
		(entry) =>
			entry.name === name &&
			(importName === undefined
				? entry.importNames === undefined
				: (entry.importNames ?? []).includes(importName)),
	);
}

function bansPattern(rules: Record<string, unknown>, group: string) {
	return restrictedImports(rules).patterns.some((entry) =>
		(entry.group ?? []).includes(group),
	);
}

function boundariesDefault(rules: Record<string, unknown>) {
	const rule = rules['boundaries/dependencies'] as
		[number, { default: string }] | undefined;
	return rule?.[1].default;
}

describe('mobile app profile', () => {
	it('owns the reusable production mobile defaults', async () => {
		const config = mobileApp.createMobileAppConfig({ preset: 'default' });
		const rules = (
			await effectiveConfig('features/home/home-screen.tsx', config)
		).rules;
		const settings = (
			await effectiveConfig('features/home/home-screen.tsx', config)
		).settings;

		expect(rules['prettier/prettier']).toEqual([2]);
		expect(rules['react-hooks/purity']).toBeDefined();
		expect(rules['@typescript-eslint/naming-convention']).toBeDefined();
		expect(settings['boundaries/elements']).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ type: 'feature-domain' }),
				expect.objectContaining({ type: 'root-service' }),
				expect.objectContaining({ type: 'uikit' }),
			]),
		);
		expect(bansImport(rules, 'react-native', 'ActivityIndicator')).toBe(true);
		expect(bansImport(rules, 'react-native-paper')).toBe(true);
		expect(bansImport(rules, 'react-native', 'SafeAreaView')).toBe(true);
	});

	it('allows log and warn in scripts', async () => {
		const { rules } = await effectiveConfig('scripts/release.ts');

		expect(rules['no-console']).toEqual([
			2,
			{ allow: ['error', 'log', 'warn'] },
		]);
	});

	it('selects the fast profile from ESLINT_CONFIG_PRESET', async () => {
		process.env.ESLINT_CONFIG_PRESET = 'fast';

		const { rules } = await effectiveConfig(
			'features/home/home-screen.tsx',
			mobileApp.createMobileAppConfig(),
		);

		expect(rules['prettier/prettier']).toEqual([2]);
		expect(rules['react-hooks/purity']).toBeUndefined();
	});

	it('rejects the base preset with a clear error', () => {
		expect(() => mobileApp.createMobileAppConfig({ preset: 'base' })).toThrow(
			RangeError,
		);
	});

	it('adds project ignores without dropping mobile defaults', async () => {
		const config = mobileApp.createMobileAppConfig({
			preset: 'fast',
			extraIgnores: ['generated/**'],
		});
		const eslint = new ESLint({
			overrideConfigFile: true,
			overrideConfig: config,
			cwd: repoRoot,
		});

		expect(await eslint.isPathIgnored('generated/x.ts')).toBe(true);
		expect(await eslint.isPathIgnored('.cache/x.ts')).toBe(true);
		expect(await eslint.isPathIgnored('.eas/x.ts')).toBe(true);
		expect(await eslint.isPathIgnored('expo-env.d.ts')).toBe(true);
	});

	describe('native UI wrappers', () => {
		it('keeps SafeAreaView, UI-kit and router bans in a wrapper', async () => {
			const { rules } = await effectiveConfig('uikit/components/screen.tsx');

			expect(bansImport(rules, 'react-native', 'SafeAreaView')).toBe(true);
			expect(bansImport(rules, 'react-native-paper')).toBe(true);
			expect(bansImport(rules, 'expo-router', 'useRouter')).toBe(true);
			expect(bansImport(rules, 'react-native', 'Pressable')).toBe(true);
			expect(bansImport(rules, 'react-native', 'Text')).toBe(true);
			expect(bansImport(rules, 'react-native', 'ScrollView')).toBe(false);
		});

		it('lets the pressable wrapper use press primitives only', async () => {
			const { rules } = await effectiveConfig(
				'uikit/components/pressables.tsx',
			);

			expect(bansImport(rules, 'react-native', 'Pressable')).toBe(false);
			expect(bansImport(rules, 'react-native', 'Text')).toBe(true);
			expect(bansImport(rules, 'react-native', 'SafeAreaView')).toBe(true);
			expect(bansImport(rules, 'expo-router', 'useRouter')).toBe(true);
		});

		it('lets the text wrapper use Text only', async () => {
			const { rules } = await effectiveConfig('uikit/components/text.tsx');

			expect(bansImport(rules, 'react-native', 'Text')).toBe(false);
			expect(bansImport(rules, 'react-native', 'Pressable')).toBe(true);
			expect(bansImport(rules, 'react-native-paper')).toBe(true);
		});

		it('exempts the pressable wrapper inside a nested app folder', async () => {
			const { rules } = await effectiveConfig(
				'apps/mobile/uikit/components/pressables.tsx',
			);

			expect(bansImport(rules, 'react-native', 'Pressable')).toBe(false);
		});

		it('accepts additional wrapper files', async () => {
			const config = mobileApp.createMobileAppConfig({
				preset: 'fast',
				additionalNativeUiWrapperFiles: ['**/uikit/components/avatar.tsx'],
			});
			const wrapper = (
				await effectiveConfig('uikit/components/avatar.tsx', config)
			).rules;
			const other = (
				await effectiveConfig('uikit/components/badge.tsx', config)
			).rules;

			expect(bansImport(wrapper, 'react-native', 'Image')).toBe(false);
			expect(bansImport(wrapper, 'react-native', 'SafeAreaView')).toBe(true);
			expect(bansImport(other, 'react-native', 'Image')).toBe(true);
		});
	});

	describe('boundaries', () => {
		for (const filePath of [
			'types/api.ts',
			'features/home/home-screen.js',
			'uikit/card.jsx',
		]) {
			it(`disallows unknown dependencies by default in ${filePath}`, async () => {
				const { rules } = await effectiveConfig(filePath);

				expect(boundariesDefault(rules)).toBe('disallow');
				expect(rules['boundaries/no-unknown-files']).toEqual([2]);
			});
		}
	});

	describe('storage boundaries', () => {
		for (const filePath of [
			'features/home/home-store.ts',
			'features/home/home-store.js',
			'uikit/card.tsx',
			'utils/cache.ts',
			'modules/sync/store.ts',
			'hooks/use-cache.ts',
		]) {
			it(`bans direct storage imports in ${filePath}`, async () => {
				const { rules } = await effectiveConfig(filePath);

				expect(
					bansPattern(rules, '@react-native-async-storage/async-storage'),
				).toBe(true);
				expect(bansPattern(rules, 'expo-secure-store')).toBe(true);
			});
		}

		for (const filePath of [
			'services/persistence/storage.ts',
			'services/auth/secure-tokens.ts',
		]) {
			it(`allows the storage adapter ${filePath}`, async () => {
				const { rules } = await effectiveConfig(filePath);

				expect(
					bansPattern(rules, '@react-native-async-storage/async-storage'),
				).toBe(false);
			});
		}
	});

	it('composes scoped import restrictions with mobile defaults', async () => {
		const config = mobileApp.createMobileAppRestrictedImportsConfig({
			files: ['features/payments/**/*.{ts,tsx}'],
			ignores: ['features/payments/native-adapter.ts'],
			additionalPaths: [
				{
					name: '@/uikit/components/pressables',
					message: 'Use the payment button.',
				},
			],
		});
		const scoped = (await effectiveConfig('features/payments/pay.ts', config))
			.rules;
		const ignored = await effectiveConfig(
			'features/payments/native-adapter.ts',
			config,
		);

		expect(bansPattern(scoped, 'react-native-nitro-storage')).toBe(true);
		expect(bansImport(scoped, '@/uikit/components/pressables')).toBe(true);
		expect(bansImport(scoped, 'react-native', 'SafeAreaView')).toBe(true);
		expect(ignored?.rules?.['no-restricted-imports']).toBeUndefined();
	});
});
