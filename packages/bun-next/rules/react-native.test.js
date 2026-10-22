const path = require('node:path');
const { checkPort } = require('./check-port.js');

checkPort('react-native', path.join(__dirname, 'react-native.js'));
