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

const filteredExpoConfig = expoConfig.filter(
  (c) => !c.plugins || !c.plugins['react-hooks']
);

const config = [
  // Global ignores for build artifacts and dependencies
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.expo/**',
      '**/ios/**',
      '**/android/**',
    ],
  },

  {
    name: 'import-ignores',
    settings: {
      'import/ignore': [
        'node_modules',
        '\\.json$',
        '\\.(scss|sass|css|less|styl)$',
        '\\.(svg|png|jpg|jpeg|gif|webp)$',
      ],
      'import-x/ignore': [
        'node_modules',
        '\\.json$',
        '\\.(scss|sass|css|less|styl)$',
        '\\.(svg|png|jpg|jpeg|gif|webp)$',
      ],
    },
  },

  // Base Expo configuration (filtered to avoid react-hooks conflicts)
  ...filteredExpoConfig,

  // TypeScript configuration with type-aware linting
  ...(typescriptConfig || []),

  // React, React Native, and React Hooks configuration
  ...(reactConfig || []),

  // Import organization and unused import detection
  ...(importsConfig || []),

  // Jest and Testing Library configuration
  ...(jestConfig || []),

  // Application-specific overrides
  ...(appConfig || []),

  // Prettier integration (must be last to override formatting rules)
  ...(prettierConfig || []),

  {
    settings: {
      'import-x/extensions': allExtensions,
      'import-x/resolver': {
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
    files: ['*.config.js', 'metro.config.js', 'babel.config.js'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },

  {
    files: ['*.web.*'],
    env: { browser: true },
  },
];

module.exports = defineConfig(config);
