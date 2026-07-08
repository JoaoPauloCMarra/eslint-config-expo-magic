#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const shouldWrite = process.argv.includes('--write');
const cwd = process.cwd();

const eslintConfig = `const { createConfig } = require('eslint-config-expo-magic');

module.exports = createConfig({
\tprettier: false,
\tagent: true,
});
`;

const prGuardrailsConfig = `module.exports = {
\tpreset: 'agentMobileApp',
};
`;

function readPackageJson() {
	const packageJsonPath = path.join(cwd, 'package.json');
	if (!fs.existsSync(packageJsonPath)) {
		return {};
	}
	return JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
}

function withRecommendedScripts(packageJson) {
	return {
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
}

function printPlan() {
	const packageJson = withRecommendedScripts(readPackageJson());
	console.log('Recommended eslint.config.js:\n');
	console.log(eslintConfig);
	console.log('Recommended expo-magic.pr-guardrails.cjs:\n');
	console.log(prGuardrailsConfig);
	console.log('Recommended package.json scripts:\n');
	console.log(JSON.stringify(packageJson.scripts ?? {}, null, 2));
	console.log('\nRun `expo-magic-init-agent --write` to write missing files/scripts.');
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

function writePlan() {
	writeIfMissing('eslint.config.js', eslintConfig);
	writeIfMissing('expo-magic.pr-guardrails.cjs', prGuardrailsConfig);
	const packageJsonPath = path.join(cwd, 'package.json');
	const packageJson = withRecommendedScripts(readPackageJson());
	fs.writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);
	console.log('Updated package.json scripts');
}

if (shouldWrite) {
	writePlan();
} else {
	printPlan();
}
