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
				setting !== ['off'] &&
				setting !== [0]
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

const missingRules = Array.from(enabledRules)
	.filter((rule) => !triggeringRules.has(rule))
	.sort();

console.log('Missing rules that need test cases:');
missingRules.forEach((rule) => console.log('- ' + rule));
console.log(`\nTotal missing: ${missingRules.length}`);
console.log(`Total enabled: ${enabledRules.size}`);
console.log(`Total triggering: ${triggeringRules.size}`);
