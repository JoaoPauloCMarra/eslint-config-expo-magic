const run = (callback: () => void) => {
	callback();
};

const handler = async () => {
	await Promise.resolve();
};

const strictOnlyValue = ['expo'].find(Boolean)!;

run(handler);
console.log(strictOnlyValue);
