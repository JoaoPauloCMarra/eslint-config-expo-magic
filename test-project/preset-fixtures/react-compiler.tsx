declare const value: unknown;

export function ReactCompilerFixture() {
	try {
		value?.toString();
	} finally {
		Promise.resolve();
	}

	return null;
}
