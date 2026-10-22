const { describe, expect, test } = require('bun:test');
const { rewriteNegativePrefix } = require('./negative-prefix.js');

// Deterministic generator so the fuzz cases are the same on every run.
function* identifiers(seed = 7) {
	let state = seed;
	const next = (max) => {
		state = (state * 1103515245 + 12345) % 2147483648;
		return state % max;
	};
	const alphabet = 'handleHANDLExyzXYZ019_$';
	const prefixes = [
		'',
		'h',
		'ha',
		'han',
		'hand',
		'handl',
		'handle',
		'Handle',
		'handlE',
	];

	for (let index = 0; index < 5000; index++) {
		let suffix = '';
		for (let length = next(6); length > 0; length--) {
			suffix += alphabet[next(alphabet.length)];
		}
		yield `${prefixes[next(prefixes.length)]}${suffix}`;
	}
}

describe('rewriteNegativePrefix', () => {
	test('rewrites a negative prefix lookahead without look-around', () => {
		const rewritten = rewriteNegativePrefix('^(?!handle[A-Z])');

		expect(rewritten).not.toMatch(/\(\?[!=<]/);
		expect(new RegExp(rewritten).test('handlePress')).toBe(false);
		expect(new RegExp(rewritten).test('handler')).toBe(true);
		expect(new RegExp(rewritten).test('onPress')).toBe(true);
		expect(new RegExp(rewritten).test('handle')).toBe(true);
	});

	test('accepts exactly the identifiers the original pattern accepts', () => {
		const original = /^(?!handle[A-Z])/;
		const rewritten = new RegExp(rewriteNegativePrefix('^(?!handle[A-Z])'));
		let checked = 0;

		for (const name of identifiers()) {
			expect([name, rewritten.test(name)]).toEqual([name, original.test(name)]);
			checked += 1;
		}
		expect(checked).toBe(5000);
	});

	test('handles escaped literals and several character classes', () => {
		const original = /^(?!a\.[0-9][a-c])/;
		const rewritten = new RegExp(rewriteNegativePrefix('^(?!a\\.[0-9][a-c])'));

		for (const name of [
			'a.1b',
			'a.1d',
			'a.1',
			'a.',
			'ab',
			'a',
			'',
			'x',
			'a.x',
		]) {
			expect([name, rewritten.test(name)]).toEqual([name, original.test(name)]);
		}
	});

	test('leaves patterns without look-around unchanged', () => {
		expect(rewriteNegativePrefix('^[a-z]+$')).toBe('^[a-z]+$');
	});

	test('throws on look-around it cannot rewrite', () => {
		expect(() => rewriteNegativePrefix('^foo(?=bar)')).toThrow('look-around');
		expect(() => rewriteNegativePrefix('^(?!a|b)')).toThrow('look-around');
	});
});
