#!/usr/bin/env bun

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const shouldWrite = process.argv.includes('--write');
const cwd = process.cwd();
const packageJsonPath = path.join(cwd, 'package.json');

const oxlintConfigFile = 'oxlint.config.ts';
const oxlintConfig = `import { createMobileAppConfig } from 'eslint-config-expo-magic/mobile-app';

export default createMobileAppConfig();
`;

const oxlintConfigNames = [
	'.oxlintrc.json',
	'oxlint.config.ts',
	'oxlint.config.mts',
	'oxlint.config.js',
	'oxlint.config.mjs',
];

const prettierConfigFile = '.prettierrc.js';
const prettierConfig =
	"module.exports = require('eslint-config-expo-magic/prettier');\n";

const prGuardrailsConfig = `module.exports = {
\tpreset: 'agentMobileApp',
};
`;

const recommendedScripts = {
	lint: 'bun lint',
	'lint:fix': 'bun lint --fix',
	format: 'bun fmt',
	'format:check': 'bun fmt --check',
	'validate:pr-guardrails': 'expo-magic-pr-guardrails',
};

// Scripts that call each built-in command.
const builtInScripts = {
	lint: ['lint', 'lint:fix'],
	fmt: ['format', 'format:check'],
};

// A Bun without the built-in command runs the package.json script of the same
// name instead, so `"lint": "bun lint"` would call itself forever. Ask from the
// temp directory, where no package.json script can answer.
function missingBuiltIns() {
	return Object.keys(builtInScripts).filter(
		(command) =>
			spawnSync('bun', [command, '--help'], {
				cwd: os.tmpdir(),
				stdio: 'ignore',
			}).status !== 0,
	);
}

const hijackingScriptNames = ['lint', 'fmt'];
const hijackingToolPattern = /\b(eslint|prettier)\b/;

function readPackageJson() {
	if (!fs.existsSync(packageJsonPath)) {
		return null;
	}
	const raw = fs.readFileSync(packageJsonPath, 'utf8');
	return { raw, value: JSON.parse(raw) };
}

function detectIndent(raw) {
	const match = /^([ \t]+)"/m.exec(raw);
	return match ? match[1] : 2;
}

function listCwd() {
	return fs.readdirSync(cwd);
}

function findExistingOxlintConfig() {
	return oxlintConfigNames.find((fileName) =>
		fs.existsSync(path.join(cwd, fileName)),
	);
}

function findExistingPrettierConfig(packageJson) {
	if (packageJson.prettier !== undefined) {
		return 'package.json "prettier" key';
	}

	return listCwd().find(
		(fileName) =>
			fileName === '.prettierrc' ||
			fileName.startsWith('.prettierrc.') ||
			fileName.startsWith('prettier.config.'),
	);
}

function findLeftoverEslintConfigs(packageJson) {
	const found = listCwd().filter(
		(fileName) =>
			fileName.startsWith('eslint.config.') || fileName.startsWith('.eslintrc'),
	);
	if (packageJson.eslintConfig !== undefined) {
		found.push('package.json "eslintConfig" key');
	}
	return found;
}

function isLintToolPackage(name) {
	if (name === 'eslint-config-expo-magic') {
		return false;
	}
	return (
		name === 'eslint' ||
		name === 'prettier' ||
		name === 'typescript-eslint' ||
		name.startsWith('@eslint/') ||
		name.startsWith('@typescript-eslint/') ||
		name.startsWith('@types/eslint') ||
		name.startsWith('eslint-') ||
		name.startsWith('prettier-') ||
		name.includes('-eslint-') ||
		name.endsWith('/eslint-plugin') ||
		name.endsWith('/eslint-config') ||
		name.endsWith('/prettier-plugin')
	);
}

function findRemovablePackages(packageJson) {
	const names = new Set();
	for (const field of ['dependencies', 'devDependencies']) {
		for (const name of Object.keys(packageJson[field] ?? {})) {
			if (isLintToolPackage(name)) {
				names.add(name);
			}
		}
	}
	return [...names].sort();
}

function hasBaseUrl() {
	const tsconfigPath = path.join(cwd, 'tsconfig.json');
	if (!fs.existsSync(tsconfigPath)) {
		return false;
	}
	const raw = fs.readFileSync(tsconfigPath, 'utf8');
	return raw
		.split('\n')
		.some(
			(line) =>
				!line.trimStart().startsWith('//') && /"baseUrl"\s*:/.test(line),
		);
}

function planScripts(packageJson) {
	const existing = packageJson.scripts ?? {};
	const added = {};
	const differing = [];
	const missing = missingBuiltIns();
	const skipped = new Set(
		missing.flatMap((command) => builtInScripts[command]),
	);
	for (const [name, command] of Object.entries(recommendedScripts)) {
		if (skipped.has(name)) continue;
		if (existing[name] === undefined) {
			added[name] = command;
		} else if (existing[name] !== command) {
			differing.push({ name, existing: existing[name], recommended: command });
		}
	}
	return { added, differing, missing };
}

function hijackingScripts(packageJson) {
	const scripts = packageJson.scripts ?? {};
	return hijackingScriptNames
		.filter(
			(name) =>
				scripts[name] !== undefined && hijackingToolPattern.test(scripts[name]),
		)
		.map((name) => ({ name, command: scripts[name] }));
}

function printNotes(packageJson, scriptPlan) {
	for (const command of scriptPlan.missing) {
		console.log(
			`This Bun has no built-in \`bun ${command}\`, so the ${builtInScripts[command].join(' and ')} scripts were skipped. Upgrade Bun and run expo-magic-init again.`,
		);
	}

	for (const { name, existing, recommended } of scriptPlan.differing) {
		console.log(
			`Kept existing script "${name}": ${existing} (recommended: ${recommended})`,
		);
	}

	for (const { name, command } of hijackingScripts(packageJson)) {
		console.log(
			`Warning: package.json script "${name}" runs ${command}. A "${name}" script that runs another tool hijacks \`bun ${name}\`. Rename or remove it.`,
		);
	}

	const eslintConfigs = findLeftoverEslintConfigs(packageJson);
	if (eslintConfigs.length > 0) {
		console.log(
			`Found ESLint config: ${eslintConfigs.join(', ')}. \`bun lint\` uses the oxlint config when both exist. You can remove the ESLint config and the ESLint, Prettier and plugin devDependencies.`,
		);
	}

	const removable = findRemovablePackages(packageJson);
	if (removable.length > 0) {
		console.log(`Removable packages present: ${removable.join(', ')}`);
		console.log(`Remove them with: bun remove ${removable.join(' ')}`);
	}

	if (hasBaseUrl()) {
		console.log(
			'Warning: tsconfig.json sets compilerOptions.baseUrl. Bun\'s type checker (TypeScript 7 behavior) rejects it. Remove baseUrl and write paths relative to the tsconfig, for example "@/*": ["./*"].',
		);
	}
}

function printNextSteps() {
	console.log('\nNext steps:');
	console.log('  1. bun add -d eslint-config-expo-magic');
	console.log('  2. bun lint');
	console.log('  3. bun fmt');
}

function printPlan() {
	const packageJson = readPackageJson()?.value ?? {};
	const scriptPlan = planScripts(packageJson);
	const existingOxlint = findExistingOxlintConfig();
	const existingPrettier = findExistingPrettierConfig(packageJson);

	if (existingOxlint) {
		console.log(`Existing ${existingOxlint} would be kept.\n`);
	} else {
		console.log(`Recommended ${oxlintConfigFile}:\n`);
		console.log(oxlintConfig);
	}

	if (existingPrettier) {
		console.log(
			`Existing Prettier config (${existingPrettier}) would be kept.\n`,
		);
	} else {
		console.log(`Recommended ${prettierConfigFile}:\n`);
		console.log(prettierConfig);
	}

	console.log('Recommended expo-magic.pr-guardrails.cjs:\n');
	console.log(prGuardrailsConfig);
	console.log('package.json scripts to add:\n');
	console.log(JSON.stringify(scriptPlan.added, null, 2));
	console.log('');
	printNotes(packageJson, scriptPlan);
	console.log(
		'\nRun `expo-magic-init --write` to write missing files/scripts.',
	);
	printNextSteps();
}

function writeIfMissing(fileName, contents) {
	const filePath = path.join(cwd, fileName);
	if (fs.existsSync(filePath)) {
		console.log(`Skipped existing ${fileName}`);
		return;
	}
	fs.writeFileSync(filePath, contents);
	console.log(`Wrote ${fileName}`);
}

function writeOxlintConfig() {
	const existing = findExistingOxlintConfig();
	if (existing) {
		console.log(`Skipped ${oxlintConfigFile}: found existing ${existing}`);
		return;
	}
	writeIfMissing(oxlintConfigFile, oxlintConfig);
}

function writePrettierConfig(packageJson) {
	const existing = findExistingPrettierConfig(packageJson);
	if (existing) {
		console.log(
			`Skipped ${prettierConfigFile}: found existing Prettier config (${existing})`,
		);
		return;
	}
	writeIfMissing(prettierConfigFile, prettierConfig);
}

function writePlan() {
	const packageJsonFile = readPackageJson();
	if (!packageJsonFile) {
		console.error(
			`No package.json found in ${cwd}. Run expo-magic-init from the project root.`,
		);
		process.exitCode = 1;
		return;
	}

	const packageJson = packageJsonFile.value;
	writeOxlintConfig();
	writePrettierConfig(packageJson);
	writeIfMissing('expo-magic.pr-guardrails.cjs', prGuardrailsConfig);

	const scriptPlan = planScripts(packageJson);
	if (Object.keys(scriptPlan.added).length === 0) {
		console.log('Skipped package.json: recommended scripts already present');
	} else {
		const nextPackageJson = {
			...packageJson,
			scripts: { ...(packageJson.scripts ?? {}), ...scriptPlan.added },
		};
		const trailingNewline = packageJsonFile.raw.endsWith('\n') ? '\n' : '';
		fs.writeFileSync(
			packageJsonPath,
			`${JSON.stringify(nextPackageJson, null, detectIndent(packageJsonFile.raw))}${trailingNewline}`,
		);
		console.log(
			`Updated package.json scripts: ${Object.keys(scriptPlan.added).join(', ')}`,
		);
	}

	printNotes(packageJson, scriptPlan);
	printNextSteps();
}

if (shouldWrite) {
	writePlan();
} else {
	printPlan();
}
