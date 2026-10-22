const path = require('node:path');
const { checkPort } = require('./check-port.js');

checkPort('boundaries', path.join(__dirname, 'boundaries.js'));
