import React from 'react';
import { View, Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';
// ❌ This should trigger testing-library/no-dom-import
import { fireEvent } from '@testing-library/dom';
console.log(fireEvent);

// ❌ Test importing mocks (should trigger jest/no-mocks-import)
import '../__mocks__/App.tsx';

describe('Test Suite', () => {
	const mockFn = jest.fn();
	console.log(mockFn);

	it('should be before hook', () => {
		expect(1).toBe(1);
	});

	// ❌ Hook not at top (should trigger jest/prefer-hooks-on-top)
	beforeEach(() => {
		// Setup
	});

	// ❌ Disabled test (should trigger jest/no-disabled-tests and jest/no-test-prefixes)
	it.skip('should be disabled', () => {
		expect(true).toBe(true);
	});

	// ❌ Focused test (should trigger jest/no-focused-tests)
	it.only('should be focused', () => {
		expect(true).toBe(true);
	});

	// ❌ Test with conditional expect (should trigger jest/no-conditional-expect)
	it('should have conditional expect', () => {
		if (Math.random() > 0.5) {
			expect(true).toBe(true);
		}
	});

	// ❌ Test with done callback (should trigger jest/no-done-callback)
	it('should use done callback', (done) => {
		setTimeout(() => {
			expect(true).toBe(true);
			done();
		}, 100);
	});

	// ❌ Test with identical title (should trigger jest/no-identical-title)
	it('should work', () => {
		expect(true).toBe(true);
	});
	it('should work', () => {
		// ❌ Identical title
		expect(false).toBe(false);
	});

	it('snapshot interpolation', () => {
		const name = 'test';
		const title = `snapshot ${name}`;
		// ❌ This should trigger jest/no-interpolation-in-snapshots
		expect({ name }).toMatchSnapshot(title);
	});

	// ❌ Test with interpolation in snapshot (should trigger jest/no-interpolation-in-snapshots)
	it('should have interpolation in snapshot', () => {
		const value = 'test';
		expect(`interp ${value}`).toMatchSnapshot();
	});

	// ❌ Test using jasmine globals (should trigger jest/no-jasmine-globals)
	it('should use jasmine globals', () => {
		(global as any).spyOn(console, 'log');
		expect(true).toBe(true);
	});

	// ❌ Test with alias methods (should trigger jest/no-alias-methods)
	it('should use alias methods', () => {
		expect(1).toHaveBeenCalled(); // Should prefer toBeCalledWith or similar if configured, or just use an alias
	});

	// ❌ Test with commented out tests (should trigger jest/no-commented-out-tests)
	// it("should be commented out", () => { expect(true).toBe(true); });

	// ❌ Test with invalid describe callback (should trigger jest/valid-describe-callback)
	describe('invalid describe', () => {
		return 1; // ❌ Describe should not return anything
	});

	// ❌ Test with invalid expect (should trigger jest/valid-expect)
	it('should have invalid expect', () => {
		expect(true); // ❌ Missing matcher
	});

	// ❌ Test with invalid expect in promise (should trigger jest/valid-expect-in-promise)
	it('should have invalid expect in promise', () => {
		return Promise.resolve().then(() => {
			expect(true);
		});
	});

	// ❌ Test with invalid title (should trigger jest/valid-title)
	it('', () => {
		expect(true).toBe(true);
	});

	// ❌ Async test without await (should trigger testing-library/await-async-queries)
	it('should handle async operations', async () => {
		const _element = screen.findByText('Test');
	});

	// ❌ Test using toEqual for primitive (should trigger jest/prefer-to-be)
	it('should use toBe for primitives', () => {
		expect(1).toEqual(1);
	});

	// ❌ Async test without await (should trigger testing-library/no-await-sync-queries)
	it('should not await sync queries', async () => {
		await screen.getByText('Sync Test');
	});

	// ❌ Test using debug (should trigger testing-library/no-debugging-utils)
	it('should not use debug', () => {
		screen.debug();
	});

	// This would require actually importing from @testing-library/dom
});

// ❌ Test using fit/fdescribe (should trigger jest/no-test-prefixes)
fit('should be focused using fit', () => {
	expect(true).toBe(true);
});

fdescribe('focused describe', () => {
	it('should work', () => {});
});

xit('skipped with xit', () => {});
xdescribe('skipped with xdescribe', () => {});

// ❌ Test using deprecated functions (should trigger jest/no-deprecated-functions)
// @ts-expect-error - testing deprecated function
const _mocked = jest.genMockFromModule('fs');
console.log(_mocked);

// ❌ Async test without await (should trigger jest/valid-expect-in-promise)
it('should not use expect in promise', () => {
	Promise.resolve().then(() => {
		expect(1).toBe(1);
	});
});

// ❌ Test using standalone expect (should trigger jest/no-standalone-expect)
// It must be outside describe/it
expect(1).toBe(1);

function helper() {
	// Also here
	expect(1).toBe(1);
}
console.log(helper);

// ❌ Test exporting from test file (should trigger jest/no-export)
export const exportedValue = 'test';

describe('more jest rules', () => {
	// ❌ Test using alias methods (should trigger jest/no-alias-methods)
	it('should not use alias methods', () => {
		const mock = jest.fn();
		mock();
		expect(mock).toBeCalled();
	});

	// ❌ Test using interpolation in snaps	// ❌ This should trigger jest/no-interpolation-in-snapshots
	it('triggers no-interpolation-in-snapshots', () => {
		const val = 1;
		expect(val).toMatchSnapshot(`interpolated ${val}`);
	});

	// ❌ Test using expect in promise (should trigger jest/valid-expect-in-promise)
	it('should not use expect in promise again', () => {
		Promise.resolve().then(() => {
			expect(1).toBe(1);
		});
	});
});
