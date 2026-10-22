const path = require('node:path');
const { checkPort } = require('./check-port.js');

checkPort('unused-imports', path.join(__dirname, 'unused-imports.js'));
