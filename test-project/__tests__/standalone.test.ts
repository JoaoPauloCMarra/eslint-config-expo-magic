import { expect } from '@jest/globals';

// ❌ This should trigger jest/no-standalone-expect
expect(1).toBe(1);

it('dummy test', () => {
	expect(1).toBe(1);
});
