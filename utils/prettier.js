const pluginPrettier = require('eslint-plugin-prettier');

module.exports = [
  {
    plugins: {
      prettier: pluginPrettier,
    },
    rules: {
      'prettier/prettier': 'error',
    },
  },
];
