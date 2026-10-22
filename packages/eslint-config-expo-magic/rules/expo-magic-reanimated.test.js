const path = require('node:path');
const { checkPort } = require('./check-port.js');

checkPort(
	'expo-magic-reanimated',
	path.join(__dirname, 'expo-magic-reanimated.js'),
);
