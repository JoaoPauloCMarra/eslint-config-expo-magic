const prettierConfig = require('eslint-config-prettier/flat');
const pluginPrettier = require('eslint-plugin-prettier');

module.exports = [
  {
    plugins: {
      prettier: pluginPrettier,
    },
    rules: {
      // prettier/prettier: Enforce consistent code formatting to reduce merge conflicts and improve code readability
      'prettier/prettier': 'error',
    },
  },
  prettierConfig,
];
