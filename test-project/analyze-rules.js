const fs = require('fs');
const results = JSON.parse(fs.readFileSync('eslint-output.json', 'utf8'));
const ruleMap = {};

results.forEach((result) => {
	result.messages.forEach((msg) => {
		if (msg.ruleId) {
			if (!ruleMap[msg.ruleId]) {
				ruleMap[msg.ruleId] = { files: new Set(), severity: msg.severity };
			}
			ruleMap[msg.ruleId].files.add(result.filePath.split('/').pop());
		}
	});
});

console.log('// Expected rules that should trigger');
console.log('const expectedRules = {');

const categories = {
	TypeScript: '@typescript-eslint/',
	React: 'react',
	Jest: 'jest/',
	'Testing Library': 'testing-library/',
	Import: 'import',
	General: '',
	Prettier: 'prettier/',
};

Object.keys(categories).forEach((category) => {
	const prefix = categories[category];
	const rules = Object.keys(ruleMap).filter((rule) => {
		if (prefix === '') {
			// General rules - don't start with any known prefix
			return (
				!rule.includes('/') ||
				(!rule.startsWith('@typescript-eslint/') &&
					!rule.startsWith('react') &&
					!rule.startsWith('jest/') &&
					!rule.startsWith('testing-library/') &&
					!rule.startsWith('import') &&
					!rule.startsWith('prettier/'))
			);
		}
		return rule.startsWith(prefix);
	});

	if (rules.length > 0) {
		console.log(`  // ${category} rules`);
		rules.sort().forEach((rule) => {
			const files = Array.from(ruleMap[rule].files).sort();
			console.log(`  "${rule}": [${files.map((f) => `"${f}"`).join(', ')}],`);
		});
		console.log('');
	}
});

console.log('};');
