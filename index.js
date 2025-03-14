const appConfig = require('./utils/app.js');
const coreConfig = require('./utils/core.js');
const expoConfig = require('./utils/expo.js');
const { allExtensions } = require('./utils/extensions.js');
const importsConfig = require('./utils/imports.js');
const jestConfig = require('./utils/jest.js');
const prettierConfig = require('./utils/prettier.js');
const reactConfig = require('./utils/react.js');
const typescriptConfig = require('./utils/typescript.js');

// reference: https://github.com/expo/expo/blob/main/packages/eslint-config-expo/flat/default.js

module.exports = [
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
    env: { browser: true },
  },
];
