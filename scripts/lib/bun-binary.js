const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

function canaryAssetName(platform, arch) {
	if (!['darwin', 'linux'].includes(platform)) {
		throw new Error(
			`No Bun canary download for ${platform}; set BUN_PARITY_BIN.`,
		);
	}

	return `bun-${platform}-${arch === 'arm64' ? 'aarch64' : 'x64'}`;
}

// The npm canary can lag its platform packages, so fall back to the GitHub
// canary release, the same build oven-sh/setup-bun installs in CI.
function downloadCanary() {
	const asset = canaryAssetName(process.platform, process.arch);
	// One download per day keeps the binary current without refetching it on
	// every script run.
	const day = new Date().toISOString().slice(0, 10);
	const dir = path.join(os.tmpdir(), `bun-canary-${day}`);
	const binary = path.join(dir, asset, 'bun');
	if (fs.existsSync(binary)) return binary;

	fs.mkdirSync(dir, { recursive: true });
	const zip = path.join(dir, `${asset}.zip`);
	const url = `https://github.com/oven-sh/bun/releases/download/canary/${asset}.zip`;

	for (const [command, args] of [
		['curl', ['-fsSL', '-o', zip, url]],
		['unzip', ['-q', zip, '-d', dir]],
	]) {
		const result = spawnSync(command, args, { encoding: 'utf8' });
		if (result.status !== 0)
			throw new Error(`${command} failed: ${result.stderr}`);
	}
	fs.rmSync(zip, { force: true });

	return binary;
}

let resolved;

// The latest Bun canary, which ships the built-in bun lint.
function resolveBunBinary() {
	if (process.env.BUN_PARITY_BIN) return process.env.BUN_PARITY_BIN;
	if (resolved) return resolved;

	const bunx = spawnSync(
		'bunx',
		['bun@canary', '-e', 'console.log(process.execPath)'],
		{
			encoding: 'utf8',
		},
	);
	resolved = bunx.status === 0 ? bunx.stdout.trim() : downloadCanary();

	return resolved;
}

module.exports = { canaryAssetName, resolveBunBinary };
