const path = require('node:path');
const { checkPort } = require('./check-port.js');

checkPort('expo-magic', path.join(__dirname, 'expo-magic/index.js'));
