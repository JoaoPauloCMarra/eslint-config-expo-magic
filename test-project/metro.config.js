// ❌ This should trigger no-console in production code
console.log("This is a console log in config file");

// ❌ This should use Node.js globals properly
const path = require("path");
const config = {
  entry: path.join(__dirname, "index.js"),
};

module.exports = config;
