import { afterAll, describe, expect, it } from 'bun:test';

const { ESLint } = require('eslint');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createConfig } = require('./create-config.js');
const { createNativeUiConfig, defaultRestrictions } = require('./native-ui.js');

const tempDir = fs.mkdtempSync(
	path.join(os.tmpdir(), 'eslint-config-expo-magic-native-ui-'),
);

afterAll(() => {
	fs.rmSync(tempDir, { recursive: true, force: true });
});

const safeAreaSource =
	"import { SafeAreaView, Switch } from 'react-native';\nexport { SafeAreaView, Switch };\n";

async function lintRestrictedImports(nativeUi: unknown) {
	const eslint = new ESLint({
		cwd: tempDir,
		overrideConfigFile: true,
		overrideConfig: createConfig({ preset: 'fast', nativeUi }),
	});
	const [result] = await eslint.lintText(safeAreaSource, {
		filePath: path.join(tempDir, 'src/screen.ts'),
	});

	return result.messages
		.filter(
			(message: { ruleId: string | null }) =>
				message.ruleId === 'no-restricted-imports',
		)
		.map((message: { message: string }) => message.message);
}

describe('native UI restrictions', () => {
	it('keeps the SafeAreaView ban with custom restrictions', async () => {
		const messages = await lintRestrictedImports({
			restrictions: [
				{
					name: 'react-native',
					importNames: ['Switch'],
					message: 'Use the app switch.',
				},
			],
		});

		expect(messages).toHaveLength(2);
		expect(messages.some((message) => message.includes('SafeAreaView'))).toBe(
			true,
		);
		expect(messages.some((message) => message.includes('app switch'))).toBe(
			true,
		);
	});

	it('keeps the SafeAreaView ban with an empty restriction list', async () => {
		const messages = await lintRestrictedImports({ restrictions: [] });

		expect(messages).toHaveLength(1);
		expect(messages[0]).toContain('SafeAreaView');
	});

	it('does not repeat the base ban when restrictions include it', () => {
		const [entry] = createNativeUiConfig({ restrictions: defaultRestrictions });
		const paths = entry.rules['no-restricted-imports'][1].paths;
		const safeAreaEntries = paths.filter(
			(restriction: { importNames?: string[] }) =>
				restriction.importNames?.includes('SafeAreaView'),
		);

		expect(safeAreaEntries).toHaveLength(1);
		expect(paths).toHaveLength(defaultRestrictions.length);
	});
});
