const config = require('./index.js');

module.exports = config.noPrettier;
module.exports.fast = config.fast;
module.exports.strict = config.strictNoPrettier;
module.exports.typed = config.typedNoPrettier;
