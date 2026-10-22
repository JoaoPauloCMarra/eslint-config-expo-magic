const { describe, expect, test } = require('bun:test');
const fs = require('node:fs');
const path = require('node:path');
const { Linter } = require('eslint');
const tsParser = require('@typescript-eslint/parser');
const original = require('eslint-plugin-testing-library');
const port = require('./testing-library.js');

const fixtureDir = path.resolve(__dirname, '../../../test-project/__tests__');
const RULES = [
	'await-async-queries',
	'no-await-sync-queries',
	'no-debugging-utils',
	'no-dom-import',
];
const SEVERITY = {
	'await-async-queries': 'error',
	'no-await-sync-queries': 'error',
	'no-debugging-utils': 'warn',
	'no-dom-import': 'error',
};

function createConfig(prefix, plugin, rule, options, settings) {
	return [
		{
			files: ['**/*.ts', '**/*.tsx', '**/*.js'],
			languageOptions: {
				parser: tsParser,
				parserOptions: { ecmaFeatures: { jsx: true } },
			},
			plugins: { [prefix]: plugin },
			...(settings ? { settings } : {}),
			rules: { [`${prefix}/${rule}`]: [SEVERITY[rule], ...options] },
		},
	];
}

function normalize(messages, prefix) {
	return messages.map((message) => ({
		...message,
		ruleId: message.ruleId?.replace(`${prefix}/`, ''),
	}));
}

function runSide(prefix, plugin, rule, code, filename, options, settings) {
	const linter = new Linter({ configType: 'flat' });
	const config = createConfig(prefix, plugin, rule, options, settings);
	const messages = normalize(linter.verify(code, config, filename), prefix);
	const fixed = linter.verifyAndFix(code, config, { filename });

	return {
		messages,
		fixedOutput: fixed.output,
		fixedMessages: normalize(fixed.messages, prefix),
	};
}

function compare(rule, code, { filename, options = [], settings } = {}) {
	const name = filename ?? 'case.tsx';
	const orig = runSide('orig', original, rule, code, name, options, settings);
	const ported = runSide('port', port, rule, code, name, options, settings);

	expect(JSON.stringify(orig.messages.filter((m) => m.fatal))).toBe('[]');
	expect(ported.messages).toEqual(orig.messages);
	expect(ported.fixedOutput).toEqual(orig.fixedOutput);
	expect(ported.fixedMessages).toEqual(orig.fixedMessages);

	return orig;
}

describe('plugin shape', () => {
	test('exposes the plugin name and exactly the four ported rules', () => {
		expect(port.meta).toEqual({ name: 'testing-library' });
		expect(Object.keys(port.rules).sort()).toEqual([...RULES].sort());
	});

	for (const rule of RULES) {
		test(`${rule} keeps meta identical to the original`, () => {
			expect(JSON.parse(JSON.stringify(port.rules[rule].meta))).toEqual(
				JSON.parse(JSON.stringify(original.rules[rule].meta)),
			);
		});
	}
});

describe('real fixtures from test-project/__tests__', () => {
	const files = fs
		.readdirSync(fixtureDir)
		.filter((file) => /\.(tsx?|jsx?)$/.test(file));

	test('fixture directory is not empty', () => {
		expect(files.length).toBeGreaterThanOrEqual(3);
	});

	for (const file of files) {
		for (const rule of RULES) {
			test(`${rule} on ${file}`, () => {
				const code = fs.readFileSync(path.join(fixtureDir, file), 'utf8');
				compare(rule, code, { filename: file });
			});
		}
	}
});

const cases = {
	'await-async-queries': {
		invalid: [
			[
				'findBy not awaited (react-native)',
				`import { render, screen } from '@testing-library/react-native';
test('a', async () => {
  render(<A />);
  screen.findByText('x');
});`,
			],
			[
				'findAllBy not awaited (react)',
				`import { screen } from '@testing-library/react';
test('a', async () => {
  screen.findAllByRole('button');
});`,
			],
			[
				'destructured findBy not awaited',
				`import { render } from '@testing-library/react-native';
test('a', async () => {
  const { findByText } = render(<A />);
  findByText('x');
});`,
			],
			[
				'renamed import',
				`import { screen as s } from '@testing-library/react';
test('a', async () => {
  s.findByTestId('x');
});`,
			],
			[
				'assigned promise never handled',
				`import { screen } from '@testing-library/react-native';
test('a', async () => {
  const el = screen.findByText('x');
  expect(el).toBeTruthy();
});`,
			],
			[
				'wrapper over async query not awaited',
				`import { screen } from '@testing-library/react-native';
const getThing = () => screen.findByText('x');
test('a', async () => {
  getThing();
});`,
			],
			[
				'function declaration wrapper in object',
				`import { screen } from '@testing-library/react';
function wrapper() { return screen.findByRole('button'); }
test('a', () => {
  wrapper();
});`,
			],
			[
				'findBy from dom import',
				`import { findByText } from '@testing-library/dom';
test('a', () => {
  findByText(document.body, 'x');
});`,
			],
			[
				'typescript non-null and chain',
				`import { screen } from '@testing-library/react';
test('a', async () => {
  screen?.findByText('x');
});`,
			],
			[
				'conditional not handled',
				`import { screen } from '@testing-library/react';
test('a', async () => {
  const x = cond ? screen.findByText('a') : null;
  void x;
});`,
			],
		],
		valid: [
			[
				'awaited',
				`import { screen } from '@testing-library/react-native';
test('a', async () => {
  await screen.findByText('x');
});`,
			],
			[
				'returned promise',
				`import { screen } from '@testing-library/react-native';
test('a', () => {
  return screen.findByText('x');
});`,
			],
			[
				'arrow returns promise',
				`import { screen } from '@testing-library/react';
test('a', () => screen.findByText('x'));`,
			],
			[
				'then chained',
				`import { screen } from '@testing-library/react';
test('a', () => {
  screen.findByText('x').then((el) => el);
});`,
			],
			[
				'catch and finally chained',
				`import { screen } from '@testing-library/react';
test('a', () => {
  screen.findByText('x').catch(() => null).finally(() => null);
});`,
			],
			[
				'Promise.all',
				`import { screen } from '@testing-library/react';
test('a', async () => {
  await Promise.all([screen.findByText('a'), screen.findByText('b')]);
});`,
			],
			[
				'Promise.allSettled without await',
				`import { screen } from '@testing-library/react';
test('a', () => {
  Promise.allSettled([screen.findByText('a')]);
});`,
			],
			[
				'resolves matcher',
				`import { screen } from '@testing-library/react';
test('a', async () => {
  expect(screen.findByText('x')).resolves.toBeTruthy();
});`,
			],
			[
				'assigned then awaited',
				`import { screen } from '@testing-library/react-native';
test('a', async () => {
  const el = screen.findByText('x');
  await el;
});`,
			],
			[
				'getBy is sync',
				`import { screen } from '@testing-library/react-native';
test('a', () => {
  screen.getByText('x');
});`,
			],
			[
				'wrapper awaited',
				`import { screen } from '@testing-library/react-native';
const getThing = () => screen.findByText('x');
test('a', async () => {
  await getThing();
});`,
			],
			[
				'non-query name',
				`test('a', async () => {
  findings.findBy;
  find('x');
});`,
			],
		],
	},
	'no-await-sync-queries': {
		invalid: [
			[
				'await getBy (react-native)',
				`import { screen } from '@testing-library/react-native';
test('a', async () => {
  await screen.getByText('x');
});`,
			],
			[
				'await queryAllBy (react)',
				`import { screen } from '@testing-library/react';
test('a', async () => {
  const items = await screen.queryAllByRole('button');
  void items;
});`,
			],
			[
				'await destructured getBy',
				`import { render } from '@testing-library/react-native';
test('a', async () => {
  const { getByTestId } = render(<A />);
  await getByTestId('x');
});`,
			],
			[
				'await renamed import',
				`import { screen as s } from '@testing-library/react';
test('a', async () => {
  await s.getAllByText('x');
});`,
			],
			[
				'await dom getBy',
				`import { getByText } from '@testing-library/dom';
test('a', async () => {
  await getByText(document.body, 'x');
});`,
			],
			[
				'await within().getBy',
				`import { within } from '@testing-library/react';
test('a', async () => {
  await within(el).getByRole('button');
});`,
			],
		],
		valid: [
			[
				'await findBy',
				`import { screen } from '@testing-library/react-native';
test('a', async () => {
  await screen.findByText('x');
});`,
			],
			[
				'sync getBy',
				`import { screen } from '@testing-library/react';
test('a', () => {
  screen.getByText('x');
});`,
			],
			[
				'await waitFor',
				`import { waitFor, screen } from '@testing-library/react';
test('a', async () => {
  await waitFor(() => screen.getByText('x'));
});`,
			],
			[
				'await non query',
				`test('a', async () => {
  await somethingElse();
  await getter('x');
});`,
			],
			[
				'await member non-query call',
				`test('a', async () => {
  await user.click(el);
});`,
			],
			[
				'await identifier not call',
				`test('a', async () => {
  await getByText;
});`,
			],
		],
	},
	'no-debugging-utils': {
		invalid: [
			[
				'screen.debug (react-native)',
				`import { screen } from '@testing-library/react-native';
test('a', () => {
  screen.debug();
});`,
			],
			[
				'destructured debug from render',
				`import { render } from '@testing-library/react-native';
test('a', () => {
  const { debug } = render(<A />);
  debug();
});`,
			],
			[
				'renamed destructured debug',
				`import { render } from '@testing-library/react';
test('a', () => {
  const { debug: log } = render(<A />);
  log();
});`,
			],
			[
				'render result debug',
				`import { render } from '@testing-library/react';
test('a', () => {
  const utils = render(<A />);
  utils.debug();
});`,
			],
			[
				'logRoles from dom',
				`import { logRoles } from '@testing-library/dom';
test('a', () => {
  logRoles(document.body);
});`,
			],
			[
				'prettyDOM and logDOM',
				`import { prettyDOM, logDOM } from '@testing-library/react';
test('a', () => {
  prettyDOM(el);
  logDOM(el);
});`,
			],
			[
				'logTestingPlaygroundURL and prettyFormat',
				`import { screen, prettyFormat } from '@testing-library/react';
test('a', () => {
  screen.logTestingPlaygroundURL();
  prettyFormat({});
});`,
			],
			[
				'renamed debug import',
				`import { debug as d } from '@testing-library/react';
test('a', () => {
  d();
});`,
			],
			[
				'render wrapper',
				`import { render } from '@testing-library/react';
function renderWithTheme(ui) { return render(ui); }
test('a', () => {
  const { debug } = renderWithTheme(<A />);
  debug();
});`,
			],
			[
				'member call on aliased console (original still reports)',
				`test('a', () => {
  const logger = console;
  logger.debug('x');
});`,
			],
			[
				'unimported debug (aggressive reporting)',
				`test('a', () => {
  screen.debug();
});`,
			],
		],
		valid: [
			[
				'console.debug',
				`import { screen } from '@testing-library/react';
test('a', () => {
  console.debug('x');
});`,
			],
			[
				'destructured console method',
				`test('a', () => {
  const { debug } = console;
  debug('x');
});`,
			],
			[
				'no debugging at all',
				`import { screen } from '@testing-library/react-native';
test('a', () => {
  expect(screen.getByText('x')).toBeTruthy();
});`,
			],
			[
				'unrelated debug on plain object',
				`const obj = { other() {} };
obj.other();`,
			],
		],
	},
	'no-dom-import': {
		invalid: [
			[
				'dom import',
				`import { screen } from '@testing-library/dom';
test('a', () => { screen.getByText('x'); });`,
			],
			[
				'dom namespace import',
				`import * as dom from '@testing-library/dom';
dom.screen.getByText('x');`,
			],
			[
				'old dom-testing-library import',
				`import { screen } from 'dom-testing-library';
screen.getByText('x');`,
			],
			[
				'dom require',
				`const { screen } = require('@testing-library/dom');
screen.getByText('x');`,
			],
			[
				'dom import with react import',
				`import { render } from '@testing-library/react';
import { fireEvent } from '@testing-library/dom';
render(<A />);
fireEvent.click(el);`,
			],
			['dom side-effect import', `import '@testing-library/dom';`],
		],
		valid: [
			[
				'react import',
				`import { screen } from '@testing-library/react';
screen.getByText('x');`,
			],
			[
				'react-native import',
				`import { render, screen } from '@testing-library/react-native';
render(<A />);`,
			],
			[
				'user-event import',
				`import userEvent from '@testing-library/user-event';
userEvent.setup();`,
			],
			['unrelated require', `const x = require('some-dom-library');`],
			[
				'dynamic non-literal require',
				`const name = '@testing-library/dom';
const x = require(name);`,
			],
		],
	},
};

const EXTRA = {
	'no-debugging-utils': [
		['only debug', [{ utilsToCheckFor: { debug: true, prettyDOM: false } }]],
		['all disabled', [{ utilsToCheckFor: { debug: false } }]],
		['empty options', [{}]],
	],
	'no-dom-import': [
		['react framework', ['react']],
		['vue framework', ['vue']],
		['angular framework', ['angular']],
		['marko framework', ['marko']],
	],
};

const SETTINGS = [
	['utils-module custom', { 'testing-library/utils-module': 'test-utils' }],
	['custom-queries', { 'testing-library/custom-queries': ['^findByFoo'] }],
	['custom-queries off', { 'testing-library/custom-queries': 'off' }],
	['custom-renders', { 'testing-library/custom-renders': ['renderWith'] }],
	[
		'utils-module and renders',
		{
			'testing-library/utils-module': 'test-utils',
			'testing-library/custom-renders': 'off',
		},
	],
];

for (const rule of RULES) {
	describe(`${rule} focused cases`, () => {
		for (const [name, code] of cases[rule].invalid) {
			test(`invalid: ${name}`, () => {
				const result = compare(rule, code);
				expect(result.messages.length).toBeGreaterThan(0);
			});
		}

		for (const [name, code] of cases[rule].valid) {
			test(`valid: ${name}`, () => {
				const result = compare(rule, code);
				expect(result.messages.length).toBe(0);
			});
		}

		for (const [name, options] of EXTRA[rule] ?? []) {
			test(`options: ${name}`, () => {
				for (const group of ['invalid', 'valid']) {
					for (const [, code] of cases[rule][group]) {
						compare(rule, code, { options });
					}
				}
			});
		}

		for (const [name, settings] of SETTINGS) {
			test(`settings: ${name}`, () => {
				const extraCode = [
					`import { render, screen } from 'test-utils';
test('a', async () => {
  const { debug, findByFoo } = render(<A />);
  debug();
  findByFoo();
  await screen.getByText('x');
  screen.findByText('y');
});`,
					`import { screen } from '@testing-library/react';
test('a', async () => {
  screen.debug();
  await screen.getByText('x');
  screen.findByText('y');
  screen.findByFoo();
});`,
					`const { screen, render } = require('test-utils');
const { renderWith } = require('./helpers');
test('a', async () => {
  const { debug } = renderWith(<A />);
  debug();
  screen.debug();
});`,
				];
				for (const group of ['invalid', 'valid']) {
					for (const [, code] of cases[rule][group]) {
						compare(rule, code, { settings });
					}
				}
				for (const code of extraCode) compare(rule, code, { settings });
			});
		}
	});
}

describe('function shapes for wrapper detection', () => {
	const shapes = [
		`import { screen } from '@testing-library/react';
const obj = { wrapper: () => screen.findByText('x'), other() { return screen.findByRole('b'); } };
test('a', () => { obj.wrapper(); obj.other(); });`,
		`import { screen } from '@testing-library/react';
class Helper {
  static find() { return screen.findByText('x'); }
  get item() { return screen.findByText('y'); }
  field = () => screen.findByText('z');
  #p() { return screen.findByText('w'); }
  [\`computed\`]() { return screen.findByText('q'); }
}
test('a', () => { Helper.find(); new Helper().field(); });`,
		`import { screen } from '@testing-library/react';
export default function () { return screen.findByText('x'); }
export const named = async function inner() { return screen.findByText('x'); };
test('a', () => { named(); inner(); });`,
		`import { screen } from '@testing-library/react';
let w;
w = () => screen.findByText('x');
function* gen() { return screen.findByText('x'); }
test('a', () => { w(); gen(); });`,
		`import { render } from '@testing-library/react';
const renderThing = () => render(<A />);
function renderOther() { return render(<A />); }
test('a', () => {
  const { debug } = renderThing();
  const o = renderOther();
  debug();
  o.debug();
});`,
	];

	for (const [index, code] of shapes.entries()) {
		for (const rule of RULES) {
			test(`${rule} shape ${index + 1}`, () => {
				compare(rule, code);
			});
		}
	}
});
