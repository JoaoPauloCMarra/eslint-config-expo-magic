const { createConfig } = require('./index.js');
const { presetModule } = require('./utils/preset-module.js');

module.exports = presetModule(() => createConfig({ preset: 'base' }));
