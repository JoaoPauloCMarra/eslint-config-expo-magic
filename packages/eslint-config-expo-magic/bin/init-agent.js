#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const shouldWrite = process.argv.includes('--write');
const cwd = process.cwd();
const packageJsonPath = path.join(cwd, 'package.json');

const eslintConfig =
	"module.exports = require('eslint-config-expo-magic/mobile-app');\n";

const eslintConfigNames = [
	'eslint.config.js',
	'eslint.config.mjs',
	'eslint.config.cjs',
	'eslint.config.ts',
	'eslint.config.mts',
	'eslint.config.cts',
];

const prGuardrailsConfig = `module.exports = {
\tpreset: 'agentMobileApp',
};
`;

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

function findExistingEslintConfig() {
	return eslintConfigNames.find((fileName) =>
		fs.existsSync(path.join(cwd, fileName)),
	);
}

function findExistingPrettierConfig(packageJson) {
	if (packageJson.prettier !== undefined) {
		return 'package.json "prettier" key';
	}

	return fs
		.readdirSync(cwd)
		.find(
			(fileName) =>
				fileName === '.prettierrc' ||
				fileName.startsWith('.prettierrc.') ||
				fileName.startsWith('prettier.config.'),
		);
}

function eslintConfigNameFor(packageJson) {
	return packageJson.type === 'module'
		? 'eslint.config.cjs'
		: 'eslint.config.js';
}

function withRecommendedScripts(packageJson) {
	const next = {
		...packageJson,
		scripts: {
			...(packageJson.scripts ?? {}),
			lint: packageJson.scripts?.lint ?? 'eslint .',
			typecheck: packageJson.scripts?.typecheck ?? 'tsc --noEmit',
			'validate:pr-guardrails':
				packageJson.scripts?.['validate:pr-guardrails'] ??
				'expo-magic-pr-guardrails',
		},
	};

	if (!findExistingPrettierConfig(packageJson)) {
		next.prettier = 'eslint-config-expo-magic/prettier';
	}

	return next;
}

function printPlan() {
	const packageJson = readPackageJson()?.value ?? {};
	const recommended = withRecommendedScripts(packageJson);
	console.log(`Recommended ${eslintConfigNameFor(packageJson)}:\n`);
	console.log(eslintConfig);
	console.log('Recommended expo-magic.pr-guardrails.cjs:\n');
	console.log(prGuardrailsConfig);
	console.log('Recommended package.json scripts:\n');
	console.log(JSON.stringify(recommended.scripts ?? {}, null, 2));
	console.log(
		'\nRun `expo-magic-init --write` to write missing files/scripts.',
	);
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

function writeEslintConfig(packageJson) {
	const existing = findExistingEslintConfig();
	if (existing) {
		console.log(`Skipped ESLint config: found existing ${existing}`);
		return;
	}
	writeIfMissing(eslintConfigNameFor(packageJson), eslintConfig);
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
	writeEslintConfig(packageJson);
	writeIfMissing('expo-magic.pr-guardrails.cjs', prGuardrailsConfig);

	const existingPrettierConfig = findExistingPrettierConfig(packageJson);
	if (existingPrettierConfig) {
		console.log(
			`Skipped package.json "prettier": found existing ${existingPrettierConfig}`,
		);
	}

	const nextPackageJson = withRecommendedScripts(packageJson);
	if (JSON.stringify(nextPackageJson) === JSON.stringify(packageJson)) {
		console.log('Skipped package.json: recommended settings already present');
		return;
	}

	const trailingNewline = packageJsonFile.raw.endsWith('\n') ? '\n' : '';
	fs.writeFileSync(
		packageJsonPath,
		`${JSON.stringify(nextPackageJson, null, detectIndent(packageJsonFile.raw))}${trailingNewline}`,
	);
	console.log('Updated package.json scripts');
}

if (shouldWrite) {
	writePlan();
} else {
	printPlan();
}
