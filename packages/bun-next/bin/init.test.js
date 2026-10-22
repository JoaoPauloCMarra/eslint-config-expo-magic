import { afterEach, describe, expect, it } from 'bun:test';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const initPath = path.join(__dirname, 'init.js');
const roots = [];

function makeProject(files = {}) {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-magic-init-'));
	roots.push(root);
	for (const [name, contents] of Object.entries(files)) {
		fs.writeFileSync(
			path.join(root, name),
			typeof contents === 'string'
				? contents
				: `${JSON.stringify(contents, null, 2)}\n`,
		);
	}
	return root;
}

// A stand-in `bun` on PATH, so the tests do not depend on whether the Bun
// running them ships the built-in `bun lint` and `bun fmt`.
function fakeBunDir(builtIns) {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-magic-init-bin-'));
	roots.push(dir);
	fs.writeFileSync(
		path.join(dir, 'bun'),
		builtIns
			? '#!/bin/sh\nexit 0\n'
			: '#!/bin/sh\necho "error: Script not found \\"$1\\"" >&2\nexit 1\n',
		{ mode: 0o755 },
	);
	return dir;
}

function runInit(root, args = [], { builtIns = true } = {}) {
	const result = spawnSync(process.execPath, [initPath, ...args], {
		cwd: root,
		encoding: 'utf8',
		env: {
			...process.env,
			PATH: `${fakeBunDir(builtIns)}${path.delimiter}${process.env.PATH}`,
		},
	});
	return {
		status: result.status,
		stdout: result.stdout,
		stderr: result.stderr,
	};
}

function read(root, name) {
	return fs.readFileSync(path.join(root, name), 'utf8');
}

function exists(root, name) {
	return fs.existsSync(path.join(root, name));
}

afterEach(() => {
	for (const root of roots.splice(0)) {
		fs.rmSync(root, { recursive: true, force: true });
	}
});

describe('init dry run', () => {
	it('prints the plan and writes nothing', () => {
		const root = makeProject({ 'package.json': { name: 'app' } });

		const result = runInit(root);

		expect(result.status).toBe(0);
		expect(result.stdout).toContain('Recommended oxlint.config.ts');
		expect(result.stdout).toContain(
			"import { createMobileAppConfig } from 'eslint-config-expo-magic/mobile-app';",
		);
		expect(result.stdout).toContain('Recommended .prettierrc.js');
		expect(result.stdout).toContain('expo-magic.pr-guardrails.cjs');
		expect(result.stdout).toContain('"lint": "bun lint"');
		expect(result.stdout).toContain('"format:check": "bun fmt --check"');
		expect(result.stdout).toContain('expo-magic-init --write');
		expect(result.stdout).toContain('Next steps');
		expect(fs.readdirSync(root)).toEqual(['package.json']);
		expect(JSON.parse(read(root, 'package.json'))).toEqual({ name: 'app' });
	});
});

describe('init --write', () => {
	it('creates configs and scripts in an empty project', () => {
		const root = makeProject({
			'package.json': '{\n\t"name": "app"\n}\n',
		});

		const result = runInit(root, ['--write']);

		expect(result.status).toBe(0);
		expect(read(root, 'oxlint.config.ts')).toBe(
			"import { createMobileAppConfig } from 'eslint-config-expo-magic/mobile-app';\n\nexport default createMobileAppConfig();\n",
		);
		expect(read(root, '.prettierrc.js')).toBe(
			"module.exports = require('eslint-config-expo-magic/prettier');\n",
		);
		expect(read(root, 'expo-magic.pr-guardrails.cjs')).toContain(
			"preset: 'agentMobileApp'",
		);
		const raw = read(root, 'package.json');
		expect(raw.startsWith('{\n\t"name"')).toBe(true);
		expect(raw.endsWith('\n')).toBe(true);
		expect(JSON.parse(raw).scripts).toEqual({
			lint: 'bun lint',
			'lint:fix': 'bun lint --fix',
			format: 'bun fmt',
			'format:check': 'bun fmt --check',
			'validate:pr-guardrails': 'expo-magic-pr-guardrails',
		});
		expect(result.stdout).toContain('Wrote oxlint.config.ts');
		expect(result.stdout).toContain('Next steps');
	});

	it('skips the lint and format scripts when bun has no built-in bun lint or bun fmt', () => {
		const root = makeProject({ 'package.json': { name: 'app' } });

		const result = runInit(root, ['--write'], { builtIns: false });

		expect(result.status).toBe(0);
		expect(JSON.parse(read(root, 'package.json')).scripts).toEqual({
			'validate:pr-guardrails': 'expo-magic-pr-guardrails',
		});
		expect(result.stdout).toContain('This Bun has no built-in `bun lint`');
		expect(result.stdout).toContain('This Bun has no built-in `bun fmt`');
		expect(exists(root, 'oxlint.config.ts')).toBe(true);
	});

	it('fails without a package.json', () => {
		const root = makeProject();

		const result = runInit(root, ['--write']);

		expect(result.status).toBe(1);
		expect(result.stderr).toContain('No package.json found');
		expect(fs.readdirSync(root)).toEqual([]);
	});

	it('is idempotent on a second run', () => {
		const root = makeProject({ 'package.json': { name: 'app' } });
		runInit(root, ['--write']);
		const before = read(root, 'package.json');

		const result = runInit(root, ['--write']);

		expect(result.stdout).toContain(
			'Skipped oxlint.config.ts: found existing oxlint.config.ts',
		);
		expect(result.stdout).toContain(
			'Skipped existing expo-magic.pr-guardrails.cjs',
		);
		expect(result.stdout).toContain('recommended scripts already present');
		expect(read(root, 'package.json')).toBe(before);
	});
});

describe('init with existing configs and scripts', () => {
	it('keeps an existing oxlint config and Prettier config', () => {
		const root = makeProject({
			'package.json': { name: 'app' },
			'.oxlintrc.json': '{}\n',
			'prettier.config.mjs': 'export default {};\n',
		});

		const result = runInit(root, ['--write']);

		expect(result.stdout).toContain(
			'Skipped oxlint.config.ts: found existing .oxlintrc.json',
		);
		expect(result.stdout).toContain('found existing Prettier config');
		expect(exists(root, 'oxlint.config.ts')).toBe(false);
		expect(exists(root, '.prettierrc.js')).toBe(false);
		expect(read(root, '.oxlintrc.json')).toBe('{}\n');
	});

	it('detects a package.json prettier key and each oxlint config name', () => {
		for (const name of [
			'oxlint.config.ts',
			'oxlint.config.mts',
			'oxlint.config.js',
			'oxlint.config.mjs',
		]) {
			const root = makeProject({
				'package.json': { name: 'app', prettier: {} },
				[name]: 'export default {};\n',
			});

			const result = runInit(root, ['--write']);

			expect(result.stdout).toContain(`found existing ${name}`);
			expect(result.stdout).toContain('package.json "prettier" key');
			expect(exists(root, '.prettierrc.js')).toBe(false);
		}
	});

	it('does not overwrite existing scripts that differ and reports them', () => {
		const root = makeProject({
			'package.json': {
				name: 'app',
				scripts: { format: 'bun fmt src', 'lint:fix': 'bun lint --fix' },
			},
		});

		const result = runInit(root, ['--write']);

		const scripts = JSON.parse(read(root, 'package.json')).scripts;
		expect(scripts.format).toBe('bun fmt src');
		expect(scripts['lint:fix']).toBe('bun lint --fix');
		expect(scripts.lint).toBe('bun lint');
		expect(scripts['format:check']).toBe('bun fmt --check');
		expect(result.stdout).toContain(
			'Kept existing script "format": bun fmt src (recommended: bun fmt)',
		);
		expect(result.stdout).not.toContain('Kept existing script "lint:fix"');
	});

	it('leaves package.json untouched when all scripts are present', () => {
		const original = {
			name: 'app',
			scripts: {
				lint: 'bun lint',
				'lint:fix': 'bun lint --fix',
				format: 'bun fmt',
				'format:check': 'bun fmt --check',
				'validate:pr-guardrails': 'expo-magic-pr-guardrails',
			},
		};
		const root = makeProject({ 'package.json': original });
		const before = read(root, 'package.json');

		const result = runInit(root, ['--write']);

		expect(result.stdout).toContain('recommended scripts already present');
		expect(read(root, 'package.json')).toBe(before);
	});
});

describe('init hijacking script warning', () => {
	it('warns when lint or fmt scripts call eslint or prettier', () => {
		const root = makeProject({
			'package.json': {
				name: 'app',
				scripts: { lint: 'eslint .', fmt: 'prettier --write .' },
			},
		});

		const result = runInit(root, ['--write']);

		expect(result.stdout).toContain('script "lint" runs eslint .');
		expect(result.stdout).toContain('script "fmt" runs prettier --write .');
		expect(result.stdout).toContain('hijacks `bun lint`');
		expect(result.stdout).toContain('hijacks `bun fmt`');
		expect(JSON.parse(read(root, 'package.json')).scripts.lint).toBe(
			'eslint .',
		);
	});

	it('warns in the dry run too', () => {
		const root = makeProject({
			'package.json': { name: 'app', scripts: { lint: 'eslint .' } },
		});

		const result = runInit(root);

		expect(result.stdout).toContain('hijacks `bun lint`');
	});

	it('does not warn for scripts that run bun or other names', () => {
		const root = makeProject({
			'package.json': {
				name: 'app',
				scripts: { lint: 'bun lint src', 'lint:eslint': 'eslint .' },
			},
		});

		const result = runInit(root, ['--write']);

		expect(result.stdout).not.toContain('hijacks');
	});
});

describe('init leftover ESLint setup', () => {
	it('lists the ESLint config and removable packages', () => {
		const root = makeProject({
			'package.json': {
				name: 'app',
				dependencies: { react: '19.0.0' },
				devDependencies: {
					eslint: '^9.0.0',
					prettier: '^3.0.0',
					'eslint-config-expo-magic': '^5.0.0',
					'eslint-plugin-react': '^7.0.0',
					'typescript-eslint': '^8.0.0',
					'@typescript-eslint/parser': '^8.0.0',
					'@eslint/js': '^9.0.0',
					'prettier-plugin-tailwindcss': '^0.6.0',
					typescript: '^6.0.0',
				},
			},
			'eslint.config.js': 'module.exports = [];\n',
			'.eslintrc.json': '{}\n',
		});

		const result = runInit(root, ['--write']);

		expect(result.stdout).toContain('Found ESLint config:');
		expect(result.stdout).toContain('eslint.config.js');
		expect(result.stdout).toContain('.eslintrc.json');
		expect(result.stdout).toContain('`bun lint` uses the oxlint config');
		expect(result.stdout).toContain(
			'Removable packages present: @eslint/js, @typescript-eslint/parser, eslint, eslint-plugin-react, prettier, prettier-plugin-tailwindcss, typescript-eslint',
		);
		expect(result.stdout).not.toContain('eslint-config-expo-magic,');
		expect(result.stdout).not.toMatch(
			/Removable packages present:.*typescript\b(?!-)/,
		);
		expect(read(root, 'eslint.config.js')).toBe('module.exports = [];\n');
	});

	it('stays quiet in a project without ESLint', () => {
		const root = makeProject({ 'package.json': { name: 'app' } });

		const result = runInit(root, ['--write']);

		expect(result.stdout).not.toContain('Found ESLint config');
		expect(result.stdout).not.toContain('Removable packages');
	});
});

describe('init tsconfig baseUrl warning', () => {
	it('warns when compilerOptions.baseUrl is set', () => {
		const root = makeProject({
			'package.json': { name: 'app' },
			'tsconfig.json': `{
	// comment
	"compilerOptions": {
		"baseUrl": ".",
		"paths": { "@/*": ["src/*"] }
	}
}
`,
		});

		const result = runInit(root, ['--write']);

		expect(result.stdout).toContain('compilerOptions.baseUrl');
		expect(result.stdout).toContain('"@/*": ["./*"]');
	});

	it('does not warn without baseUrl or when it is commented out', () => {
		const root = makeProject({
			'package.json': { name: 'app' },
			'tsconfig.json': `{
	"compilerOptions": {
		// "baseUrl": ".",
		"paths": { "@/*": ["./*"] }
	}
}
`,
		});

		const result = runInit(root, ['--write']);

		expect(result.stdout).not.toContain('baseUrl');
	});
});
