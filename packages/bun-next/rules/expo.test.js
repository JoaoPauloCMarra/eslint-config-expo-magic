const path = require('node:path');
const { checkPort } = require('./check-port.js');

checkPort('expo', path.join(__dirname, 'expo.js'));
