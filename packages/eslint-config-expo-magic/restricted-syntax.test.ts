import { afterAll, describe, expect, it } from 'bun:test';
import type { Linter } from 'eslint';

const { ESLint } = require('eslint');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createConfig } = require('./utils/create-config.js');
const {
	createComposedRestrictedSyntaxConfigs,
} = require('./utils/restricted-syntax.js');
const agentGuardrails = require('./utils/agent-guardrails.js');
const appGuardrails = require('./utils/app-guardrails.js');
const semanticColors = require('./utils/semantic-colors.js');

const tempDir = fs.mkdtempSync(
	path.join(os.tmpdir(), 'eslint-config-expo-magic-restricted-syntax-'),
);

afterAll(() => {
	fs.rmSync(tempDir, { recursive: true, force: true });
});

async function lintWith(
	config: Linter.Config[],
	filePath: string,
	source: string,
) {
	const eslint = new ESLint({
		cwd: tempDir,
		overrideConfigFile: true,
		overrideConfig: config,
	});
	const [result] = await eslint.lintText(source, {
		filePath: path.join(tempDir, filePath),
	});
	const fatalMessage = result.messages.find(
		(message: { fatal?: boolean }) => message.fatal,
	);
	if (fatalMessage) {
		throw new Error(fatalMessage.message);
	}

	return result.messages
		.filter(
			(message: { ruleId: string | null }) =>
				message.ruleId === 'no-restricted-syntax',
		)
		.map((message: { message: string }) => message.message);
}

function lint(
	options: Record<string, unknown>,
	filePath: string,
	source: string,
) {
	return lintWith(createConfig({ preset: 'fast', ...options }), filePath, source);
}

describe('test-only restricted syntax groups', () => {
	it('does not flag skip or only calls in production files', async () => {
		for (const filePath of ['src/db.ts', 'src/db.tsx']) {
			expect(
				await lint({ agent: true }, filePath, 'query.skip(10);\nquery.only();\n'),
			).toEqual([]);
		}
	});

	it('still flags skip and only calls in test files', async () => {
		for (const filePath of ['src/db.test.ts', 'src/db.test.tsx']) {
			const messages = await lint(
				{ agent: true },
				filePath,
				'it.skip("a", () => {});\nit.only("b", () => {});\n',
			);

			expect(messages).toContain('Do not commit skipped tests.');
			expect(messages).toContain('Do not commit focused tests.');
		}
	});

	it('does not flag snapshots in production files with app guardrails', async () => {
		expect(
			await lint(
				{ appGuardrails: true },
				'src/x.ts',
				'expect(value).toMatchSnapshot();\n',
			),
		).toEqual([]);
	});

	it('still flags snapshots in test files with app guardrails', async () => {
		expect(
			await lint(
				{ appGuardrails: true },
				'src/x.test.ts',
				'expect(value).toMatchSnapshot();\n',
			),
		).toEqual([
			'Prefer focused assertions over snapshots for production app regressions.',
		]);
	});

	it('keeps source guardrails on test files', async () => {
		expect(
			await lint(
				{ agent: true },
				'src/x.test.ts',
				'export const value: any = 1;\n',
			),
		).toContain(
			'Do not introduce `any`. Use unknown, a domain type, or a generic constraint.',
		);
	});
});

describe('restricted syntax selector dedupe', () => {
	it('keeps one entry per selector', () => {
		const configs = createComposedRestrictedSyntaxConfigs([
			...appGuardrails.createRestrictedSyntaxGroups(),
			...agentGuardrails.createRestrictedSyntaxGroups(),
		]);

		for (const entry of configs) {
			const rule = entry.rules['no-restricted-syntax'];
			if (!Array.isArray(rule)) {
				continue;
			}
			const selectors = rule
				.slice(1)
				.map((selector: { selector: string }) => selector.selector);

			expect(selectors).toEqual([...new Set(selectors)]);
		}
	});
});

describe('semantic colors allow files', () => {
	const tokenFile = 'uikit/tokens/colors.ts';
	const tokenSource = "export const colors = { white: '#ffffff' };\n";
	const screenSource = "export const background = '#ffffff';\n";

	it('allows the token file when semantic colors is the only syntax layer', async () => {
		expect(await lint({ semanticColors: true }, tokenFile, tokenSource)).toEqual(
			[],
		);
		expect(
			await lint({ semanticColors: true }, 'src/screen.ts', screenSource),
		).toHaveLength(1);
	});

	it('allows custom allow files when semantic colors is the only syntax layer', async () => {
		const options = {
			semanticColors: { allowFiles: ['**/theme/palette.ts'] },
		};

		expect(await lint(options, 'theme/palette.ts', screenSource)).toEqual([]);
		expect(await lint(options, 'src/screen.ts', screenSource)).toHaveLength(1);
	});

	it('allows the token file in the standalone config', async () => {
		expect(await lintWith(semanticColors, tokenFile, tokenSource)).toEqual([]);
		expect(
			await lintWith(semanticColors, 'src/screen.ts', screenSource),
		).toHaveLength(1);
	});

	it('returns a real allow config', () => {
		expect(semanticColors.createAllowConfig()).toEqual([
			{
				files: ['**/uikit/tokens/colors.{ts,tsx}'],
				rules: { 'no-restricted-syntax': 'off' },
			},
		]);
	});
});
