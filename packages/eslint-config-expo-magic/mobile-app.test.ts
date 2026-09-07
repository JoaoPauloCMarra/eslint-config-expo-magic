import { afterEach, describe, expect, it } from 'bun:test';
import type { Linter } from 'eslint';

const mobileApp = require('./mobile-app.js');

type FlatConfig = Linter.Config;

const originalPreset = process.env.ESLINT_CONFIG_PRESET;

function findRule(config: FlatConfig[], ruleName: string) {
	return config.find((entry) => entry.rules?.[ruleName])?.rules?.[ruleName];
}

afterEach(() => {
	if (originalPreset === undefined) {
		delete process.env.ESLINT_CONFIG_PRESET;
		return;
	}
	process.env.ESLINT_CONFIG_PRESET = originalPreset;
});

describe('mobile app profile', () => {
	it('owns the reusable production mobile defaults', () => {
		const config = mobileApp.createMobileAppConfig({ preset: 'default' });
		const boundaryEntry = config.find(
			(entry: FlatConfig) =>
				entry.settings?.['boundaries/elements-single-match'] === true,
		);
		const nativeUiRules = config
			.map((entry: FlatConfig) => entry.rules?.['no-restricted-imports'])
			.filter(Boolean);

		expect(findRule(config, 'prettier/prettier')).toBe('error');
		expect(findRule(config, 'react-hooks/purity')).toBeDefined();
		expect(
			findRule(config, '@typescript-eslint/naming-convention'),
		).toBeDefined();
		expect(boundaryEntry?.settings?.['boundaries/elements']).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ type: 'feature-domain' }),
				expect.objectContaining({ type: 'root-service' }),
				expect.objectContaining({ type: 'uikit' }),
			]),
		);
		expect(JSON.stringify(nativeUiRules)).toContain('ActivityIndicator');
		expect(JSON.stringify(nativeUiRules)).toContain('react-native-paper');
		expect(
			config.some(
				(entry: FlatConfig) =>
					entry.files?.includes('scripts/**/*.ts') &&
					JSON.stringify(entry.rules?.['no-console']).includes('warn'),
			),
		).toBe(true);
	});

	it('selects the fast profile from ESLINT_CONFIG_PRESET', () => {
		process.env.ESLINT_CONFIG_PRESET = 'fast';

		const config = mobileApp.createMobileAppConfig();

		expect(findRule(config, 'prettier/prettier')).toBe('error');
		expect(findRule(config, 'react-hooks/purity')).toBeUndefined();
	});

	it('adds project ignores without dropping mobile defaults', () => {
		const config = mobileApp.createMobileAppConfig({
			extraIgnores: ['generated/**'],
		});
		const ignores = config.flatMap((entry: FlatConfig) => entry.ignores ?? []);

		expect(ignores).toContain('.cache/**');
		expect(ignores).toContain('.eas/**');
		expect(ignores).toContain('expo-env.d.ts');
		expect(ignores).toContain('generated/**');
	});

	it('composes scoped import restrictions with mobile defaults', () => {
		const [config] = mobileApp.createMobileAppRestrictedImportsConfig({
			files: ['features/payments/**/*.{ts,tsx}'],
			ignores: ['features/payments/native-adapter.ts'],
			additionalPaths: [
				{
					name: '@/uikit/components/pressables',
					message: 'Use the payment button.',
				},
			],
		});
		const rule = config.rules?.['no-restricted-imports'];
		const serializedRule = JSON.stringify(rule);

		expect(config.files).toEqual(['features/payments/**/*.{ts,tsx}']);
		expect(config.ignores).toEqual(['features/payments/native-adapter.ts']);
		expect(serializedRule).toContain('react-native-nitro-storage');
		expect(serializedRule).toContain('@/uikit/components/pressables');
	});
});
