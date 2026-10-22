const { describe, expect, test } = require('bun:test');
const { canaryAssetName } = require('./bun-binary.js');

describe('bun binary', () => {
	test('names the GitHub canary asset for each platform', () => {
		expect(canaryAssetName('darwin', 'arm64')).toBe('bun-darwin-aarch64');
		expect(canaryAssetName('darwin', 'x64')).toBe('bun-darwin-x64');
		expect(canaryAssetName('linux', 'x64')).toBe('bun-linux-x64');
		expect(canaryAssetName('linux', 'arm64')).toBe('bun-linux-aarch64');
		expect(() => canaryAssetName('win32', 'x64')).toThrow('win32');
	});
});
