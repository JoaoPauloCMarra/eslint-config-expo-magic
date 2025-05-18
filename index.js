const globals = require('globals');

const coreConfig = require('eslint-config-expo/flat/utils/core.js');
const expoConfig = require('eslint-config-expo/flat/utils/expo.js');
const {
  allExtensions,
} = require('eslint-config-expo/flat/utils/extensions.js');

const appConfig = require('./utils/app.js');
const importsConfig = require('./utils/imports.js');
const jestConfig = require('./utils/jest.js');
const prettierConfig = require('./utils/prettier.js');
const reactConfig = require('./utils/react.js');
const typescriptConfig = require('./utils/typescript.js');
const { defineConfig } = require('eslint/config');

const config = [
  ...coreConfig,
  ...typescriptConfig,
  ...reactConfig,
  ...expoConfig,
  ...importsConfig,
  ...jestConfig,
  ...prettierConfig,
  ...appConfig,
  {
    settings: {
      'import/extensions': allExtensions,
      'import/resolver': {
        node: { extensions: allExtensions },
      },
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        __DEV__: 'readonly',
        ErrorUtils: false,
        FormData: false,
        XMLHttpRequest: false,
        alert: false,
        cancelAnimationFrame: false,
        cancelIdleCallback: false,
        clearImmediate: false,
        fetch: false,
        navigator: false,
        process: false,
        requestAnimationFrame: false,
        requestIdleCallback: false,
        setImmediate: false,
        window: false,
        'shared-node-browser': true,
      },
    },
  },
  {
    files: ['*.web.*'],
  },
];

module.exports = defineConfig(config);
