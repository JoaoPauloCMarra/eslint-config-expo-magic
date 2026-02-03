const fs = require('fs');
const config = require('../packages/eslint-config-expo-magic/index.js');
const results = JSON.parse(fs.readFileSync('./eslint-output.json', 'utf8'));

let enabledRules = new Set();
config.forEach((configItem) => {
	if (configItem.rules) {
		Object.entries(configItem.rules).forEach(([rule, setting]) => {
			if (
				setting !== 'off' &&
				setting !== 0 &&
				JSON.stringify(setting) !== '["off"]' &&
				JSON.stringify(setting) !== '[0]'
			) {
				enabledRules.add(rule);
			}
		});
	}
});

const triggeringRules = new Set();
results.forEach((result) => {
	result.messages.forEach((msg) => {
		if (msg.ruleId) {
			triggeringRules.add(msg.ruleId);
		}
	});
});

const triggeringHooks = Array.from(triggeringRules).filter((r) =>
	r.startsWith('react-hooks/'),
);
console.log('Triggering react-hooks rules:', triggeringHooks);

const silentRules = new Set([
	// React internal rules that don't trigger violations directly
	'react/jsx-uses-react',
	'react/jsx-uses-vars',

	// React Compiler experimental rules - require React Compiler to be enabled
	// These rules surface diagnostics from the React Compiler (babel-plugin-react-compiler)
	// They will only trigger when the compiler is actively analyzing the code
	'react-hooks/config',
	'react-hooks/gating',
	'react-hooks/component-hook-factories',
	'react-hooks/error-boundaries',
	'react-hooks/globals',
	'react-hooks/incompatible-library',
	'react-hooks/set-state-in-effect',
	'react-hooks/static-components',
	'react-hooks/use-memo',
]);

const missingRules = Array.from(enabledRules)
	.filter((rule) => !triggeringRules.has(rule) && !silentRules.has(rule))
	.sort();

console.log('Missing rules that need test cases:');
missingRules.forEach((rule) => console.log('- ' + rule));
console.log(`\nTotal missing: ${missingRules.length}`);
console.log(`Total enabled: ${enabledRules.size}`);
console.log(`Total triggering: ${triggeringRules.size}`);
