// ❌ This should trigger no-console in production code
console.warn("This is a console warning in babel config");

// ❌ This should use Node.js globals properly
const path = require("path");

module.exports = {
  presets: ["babel-preset-expo"],
  plugins: [
    [
      "module-resolver",
      {
        root: ["./src"],
        extensions: [".ios.js", ".android.js", ".js", ".ts", ".tsx", ".json"],
        alias: {
          "@": path.resolve(__dirname, "src"),
        },
      },
    ],
  ],
};
