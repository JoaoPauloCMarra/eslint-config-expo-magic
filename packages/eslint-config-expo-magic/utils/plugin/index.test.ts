import { describe, expect, it } from 'bun:test';

const plugin = require('./index.js');
const packageJson = require('../../package.json');

describe('expo-magic plugin meta', () => {
	it('reports the package version', () => {
		expect(plugin.meta).toEqual({
			name: 'eslint-plugin-expo-magic',
			version: packageJson.version,
		});
	});
});
