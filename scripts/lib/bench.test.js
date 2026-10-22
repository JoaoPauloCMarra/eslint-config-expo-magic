const { describe, expect, test } = require('bun:test');
const { median, parsePeakRss, summarize } = require('./bench.js');

describe('bench', () => {
	test('takes the median of odd and even sample counts', () => {
		expect(median([3, 1, 2])).toBe(2);
		expect(median([4, 1, 3, 2])).toBe(2.5);
	});

	test('reads peak memory from macOS and Linux time output', () => {
		expect(parsePeakRss('  104857600  maximum resident set size')).toBe(
			104857600,
		);
		expect(parsePeakRss('Maximum resident set size (kbytes): 2048')).toBe(
			2097152,
		);
		expect(parsePeakRss('no data')).toBeNull();
	});

	test('summarizes timing and memory samples', () => {
		expect(
			summarize([
				{ ms: 30, rss: 3 * 1024 * 1024 },
				{ ms: 10, rss: 1 * 1024 * 1024 },
				{ ms: 20, rss: 2 * 1024 * 1024 },
			]),
		).toEqual({ runs: 3, medianMs: 20, minMs: 10, maxMs: 30, medianRssMb: 2 });
	});
});
