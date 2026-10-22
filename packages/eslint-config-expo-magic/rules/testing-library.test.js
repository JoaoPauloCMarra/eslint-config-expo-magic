const path = require('node:path');
const { checkPort } = require('./check-port.js');

checkPort('testing-library', path.join(__dirname, 'testing-library.js'));
