const { describe, expect, test } = require('bun:test');
const fs = require('node:fs');
const path = require('node:path');

const { createArchitectureConfig } = require('./architecture.js');
const {
	architectureOptionSets,
	expectationsDirectory,
	invalidOptions,
	withPackagePlaceholder,
} = require('./config-cases.js');

function recorded(name) {
	return JSON.parse(
		fs.readFileSync(path.join(expectationsDirectory, `${name}.json`), 'utf8'),
	);
}

describe('createArchitectureConfig matches the configs recorded from 5.x', () => {
	for (const { name, options } of architectureOptionSets) {
		test(name, () => {
			const config = createArchitectureConfig(options);

			expect(withPackagePlaceholder(config)).toEqual(
				recorded(`architecture-${name}`),
			);
			expect(config.overrides.length).toBeGreaterThan(0);
		});
	}

	test('base defaults to an empty createConfig options object', () => {
		expect(createArchitectureConfig()).toEqual(
			createArchitectureConfig({ base: {} }),
		);
	});
});

describe('createArchitectureConfig rejects baseConfig', () => {
	test('throws a TypeError that points to base', () => {
		expect(() => createArchitectureConfig({ baseConfig: [] })).toThrow(
			TypeError,
		);
		expect(() => createArchitectureConfig({ baseConfig: [] })).toThrow(
			/Pass base \(the createConfig options object\) instead/,
		);
	});
});

describe('createArchitectureConfig validation matches the errors recorded from 5.x', () => {
	recorded('validation').createArchitectureConfig.forEach(
		({ options, error }, index) => {
			test(JSON.stringify(options), () => {
				expect(invalidOptions.createArchitectureConfig[index]).toEqual(options);

				let thrown;
				try {
					createArchitectureConfig(options);
				} catch (caught) {
					thrown = caught;
				}
				expect(thrown?.constructor.name).toBe(error.type);
				expect(thrown.message).toBe(error.message);
			});
		},
	);
});
