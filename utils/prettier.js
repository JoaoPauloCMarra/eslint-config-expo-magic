const prettierConfig = require('eslint-config-prettier');
const pluginPrettier = require('eslint-plugin-prettier');

module.exports = [
  {
    plugins: {
      prettier: pluginPrettier,
    },
    rules: {
      // prettier/prettier: Runs Prettier as an ESLint rule and reports differences as individual ESLint issues. Default: 'off'
      'prettier/prettier': 'error',
    },
  },
  prettierConfig,
];
