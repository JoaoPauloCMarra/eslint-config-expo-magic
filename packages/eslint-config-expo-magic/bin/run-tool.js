const path = require('node:path');
const { spawnSync } = require('node:child_process');

function resolveToolExecutable(packageName, executableName) {
	const manifestPath = require.resolve(`${packageName}/package.json`);
	const manifest = require(manifestPath);
	const relativePath =
		typeof manifest.bin === 'string'
			? manifest.bin
			: manifest.bin?.[executableName];

	if (typeof relativePath !== 'string' || relativePath.length === 0) {
		throw new Error(`${packageName} does not provide ${executableName}.`);
	}

	return path.resolve(path.dirname(manifestPath), relativePath);
}

function runTool(packageName, executableName) {
	let executablePath;

	try {
		executablePath = resolveToolExecutable(packageName, executableName);
	} catch (error) {
		console.error(error instanceof Error ? error.message : String(error));
		process.exitCode = 1;
		return;
	}

	const result = spawnSync(
		process.execPath,
		[executablePath, ...process.argv.slice(2)],
		{ stdio: 'inherit' },
	);

	if (result.error) {
		console.error(result.error.message);
		process.exitCode = 1;
		return;
	}

	process.exitCode = result.status ?? 1;
}

module.exports = { resolveToolExecutable, runTool };
