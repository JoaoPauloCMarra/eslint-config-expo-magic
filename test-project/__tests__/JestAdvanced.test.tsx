import React from 'react';
import { render } from '@testing-library/react-native';

// Jest advanced violations
describe('JestAdvanced', () => {
	// jest/expect-expect
	test('no expect', () => {
		render(<div />);
	});

	// jest/no-commented-out-tests
	// test('commented out', () => {});

	// jest/no-conditional-expect
	test('conditional expect', () => {
		if (Math.random() > 0.5) {
			expect(true).toBe(true);
		}
	});

	// jest/no-disabled-tests
	test.skip('disabled test', () => {
		expect(true).toBe(true);
	});

	// jest/no-done-callback
	test('done callback', (done) => {
		setTimeout(() => {
			expect(true).toBe(true);
			done();
		}, 100);
	});

	// jest/no-export
	export const exportedTest = () => {};

	// jest/no-focused-tests
	test.only('focused test', () => {
		expect(true).toBe(true);
	});

	// jest/no-identical-title
	test('identical title', () => {
		expect(true).toBe(true);
	});
	test('identical title', () => {
		expect(false).toBe(false);
	});

	// jest/no-jasmine-globals
	test('jasmine globals', () => {
		jasmine.createSpy();
	});

	// jest/valid-describe-callback
	describe('invalid describe', 'not a function');

	// jest/valid-title
	test('', () => {});
	test(123, () => {});
});
