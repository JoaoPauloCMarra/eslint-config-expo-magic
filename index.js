const globals = require('globals');

const expoConfig = require('eslint-config-expo/flat');
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
  // Base Expo configuration
  ...(expoConfig || []),

  // TypeScript configuration
  ...(typescriptConfig || []),

  // React configuration
  ...(reactConfig || []),

  // Import organization
  ...(importsConfig || []),

  // Testing configuration
  ...(jestConfig || []),

  // Code formatting
  ...(prettierConfig || []),

  // Custom app rules
  ...(appConfig || []),

  // Global settings and environment
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

  // Environment-specific overrides
  {
    files: ['*.config.js', 'metro.config.js', 'babel.config.js'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },

  // Web-specific files
  {
    files: ['*.web.*'],
  },
];

module.exports = defineConfig(config);
