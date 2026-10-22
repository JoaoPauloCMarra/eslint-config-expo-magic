const path = require('node:path');
const { checkPort } = require('./check-port.js');

checkPort('react-19-upgrade', path.join(__dirname, 'react-19-upgrade.js'));
