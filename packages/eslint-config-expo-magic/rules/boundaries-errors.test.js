// The port rejects options and settings it does not implement. The original
// plugin accepts them, so these checks have no recorded expectations.

const { describe, expect, test } = require('bun:test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { resolveBunBinary } = require('../../../scripts/lib/bun-binary.js');

const pluginPath = path.join(__dirname, 'boundaries.js');
const stub = (...imports) =>
	`${imports.map((specifier) => `import '${specifier}';`).join('\n')}\nexport const value = 1;\n`;
const plain = 'export const value = 1;\n';

const baseSettings = {
	'boundaries/elements': [
		{
			type: 'feature',
			pattern: 'features/*',
			partialMatch: false,
			capture: ['name'],
		},
		{ type: 'shared', pattern: 'shared', partialMatch: false },
		{
			type: 'service',
			pattern: 'services/*',
			partialMatch: false,
			capture: ['service'],
		},
	],
	'boundaries/files': [
		{ category: 'test', pattern: '**/*.test.ts', capture: ['stem'] },
	],
	'boundaries/root-path': 'case-0',
	'import/resolver': {
		node: { extensions: ['.js', '.ts', '.tsx'] },
		typescript: { project: ['case-0/tsconfig.json'] },
	},
};
const layout = {
	'tsconfig.json': '{}',
	'features/a/index.ts': stub('../b/index', '../../shared/util', 'lodash'),
	'features/b/index.ts': plain,
	'shared/util.ts': plain,
};
const policy = {
	policies: [
		{
			from: { element: { type: 'feature' } },
			allow: { to: { element: { type: 'feature' } } },
		},
	],
};

// Runs `bun lint` on the layout and throws the diagnostic text when the plugin
// fails; the shared harness only reads diagnostics that carry a source span.
function attempt({ rule = 'dependencies', options, settings = {} }) {
	return () => {
		const dir = fs.realpathSync(
			fs.mkdtempSync(path.join(os.tmpdir(), 'boundaries-errors-')),
		);

		try {
			for (const [file, content] of Object.entries(layout)) {
				const target = path.join(dir, 'case-0', file);
				fs.mkdirSync(path.dirname(target), { recursive: true });
				fs.writeFileSync(target, content);
			}
			fs.writeFileSync(
				path.join(dir, '.oxlintrc.json'),
				JSON.stringify({
					categories: { correctness: 'off' },
					plugins: [],
					jsPlugins: [{ name: 'boundaries', specifier: pluginPath }],
					settings: { ...baseSettings, ...settings },
					overrides: [
						{
							files: ['case-0/features/a/index.ts'],
							rules: {
								[`boundaries/${rule}`]: ['error', ...(options ? [options] : [])],
							},
						},
					],
				}),
			);
			const result = spawnSync(
				resolveBunBinary(),
				['lint', '--cwd', dir, '-c', path.join(dir, '.oxlintrc.json'), '-f', 'json'],
				{ cwd: dir, encoding: 'utf8', timeout: 120_000 },
			);
			const { diagnostics } = JSON.parse(result.stdout);
			const failure = diagnostics.find((diagnostic) =>
				diagnostic.message.startsWith('Error running JS plugin'),
			);
			if (failure) throw new Error(failure.message);
		} finally {
			fs.rmSync(dir, { recursive: true, force: true });
		}
	};
}

describe('boundaries port rejects unsupported options and settings', () => {
	test('accepts the supported configuration', () => {
		expect(attempt({ options: policy })).not.toThrow();
	});

	test.each([
		['unknown property', { options: { ...policy, unknown: true } }, /unsupported property "unknown"/],
		[
			'legacy string selectors',
			{ options: { policies: [{ from: 'feature', allow: ['feature'] }] } },
			/legacy/,
		],
		[
			'parent selectors',
			{
				options: {
					policies: [
						{
							from: { element: { type: 'feature', parent: { type: 'x' } } },
							allow: { to: { element: { type: 'feature' } } },
						},
					],
				},
			},
			/parent/,
		],
		[
			'relationship selectors',
			{
				options: {
					policies: [
						{
							from: { element: { type: 'feature' } },
							allow: {
								dependency: { relationship: { to: 'child' } },
								to: { element: { type: 'feature' } },
							},
						},
					],
				},
			},
			/relationship/,
		],
		[
			'parent message placeholders',
			{ options: { ...policy, message: 'see ${from.parent.type}' } },
			/parent/,
		],
		[
			'handlebars blocks in messages',
			{ options: { ...policy, message: '{{#if from}}x{{/if}}' } },
			/unsupported template expression/,
		],
		[
			'handlebars blocks in selectors',
			{
				options: {
					policies: [
						{
							from: { element: { type: 'feature' } },
							allow: { to: { element: { type: '{{ #each x }}' } } },
						},
					],
				},
			},
			/unsupported template expression/,
		],
		[
			'boundaries/types setting',
			{ options: policy, settings: { 'boundaries/types': ['feature'] } },
			/unsupported setting "boundaries\/types"/,
		],
		[
			'boundaries/alias setting',
			{ options: policy, settings: { 'boundaries/alias': {} } },
			/unsupported setting/,
		],
		[
			'boundaries/debug setting',
			{ options: policy, settings: { 'boundaries/debug': { enabled: true } } },
			/debug/,
		],
		[
			'elements without partialMatch false',
			{
				options: policy,
				settings: { 'boundaries/elements': [{ type: 'a', pattern: 'a' }] },
			},
			/partialMatch: false/,
		],
		[
			'element mode property',
			{
				options: policy,
				settings: {
					'boundaries/elements': [
						{ type: 'a', pattern: 'a', partialMatch: false, mode: 'file' },
					],
				},
			},
			/unsupported property "mode"/,
		],
		[
			'legacy string elements',
			{ options: policy, settings: { 'boundaries/elements': ['legacy'] } },
			/legacy string/,
		],
		[
			'unsupported glob',
			{
				options: policy,
				settings: {
					'boundaries/elements': [
						{ type: 'a', pattern: 'a/[bc]', partialMatch: false },
					],
				},
			},
			/unsupported glob/,
		],
		[
			'webpack resolver',
			{ options: policy, settings: { 'import/resolver': { webpack: {} } } },
			/unsupported import resolver "webpack"/,
		],
		[
			'non-boolean legacy-templates',
			{ options: policy, settings: { 'boundaries/legacy-templates': 'yes' } },
			/must be a boolean/,
		],
		[
			'invalid no-unknown-dependencies require',
			{ rule: 'no-unknown-dependencies', options: { require: 'nope' } },
			/./,
		],
	])('%s', (_title, config, pattern) => {
		expect(attempt(config)).toThrow(pattern);
	});
});
