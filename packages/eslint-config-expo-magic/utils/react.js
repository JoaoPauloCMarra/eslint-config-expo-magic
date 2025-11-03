const expoReact = require('eslint-config-expo/flat/utils/react.js');

const pluginReactHooks = require('eslint-plugin-react-hooks');
const pluginReactNative = require('eslint-plugin-react-native');
const pluginReact19Upgrade = require('eslint-plugin-react-19-upgrade');

const baseExpoReactConfig = { ...expoReact[0] };
const { 'react-hooks': _, ...expoPluginsWithoutReactHooks } = baseExpoReactConfig.plugins;
baseExpoReactConfig.plugins = expoPluginsWithoutReactHooks;

const expoRules = { ...baseExpoReactConfig.rules };
Object.keys(expoRules).forEach(key => {
  if (key.startsWith('react-hooks/')) {
    delete expoRules[key];
  }
});
baseExpoReactConfig.rules = expoRules;

module.exports = [
  baseExpoReactConfig,

  {
    plugins: {
      'react-hooks': pluginReactHooks,
      'react-native': pluginReactNative,
      'react-19-upgrade': pluginReact19Upgrade,
    },

    rules: {
      ...pluginReactHooks.configs.recommended.rules,

      // react-hooks/refs: Turn off refs rule to allow refs usage in React components
      'react-hooks/refs': 'off',

      // react/jsx-no-leaked-render: Prevent accidentally leaking render values to the DOM instead of rendering them
      'react/jsx-no-leaked-render': 'error',
      // react/jsx-no-useless-fragment: Avoid unnecessary JSX fragments to reduce DOM nodes and improve performance
      'react/jsx-no-useless-fragment': 'error',
      // react/jsx-key: Ensure unique keys for list items to prevent React rendering issues
      'react/jsx-key': 'error',
      // react/no-unstable-nested-components: Disabled as not considered worthy at this time
      'react/no-unstable-nested-components': 'off',
      // react/self-closing-comp: Maintain consistent JSX formatting by requiring self-closing tags for components without children
      'react/self-closing-comp': [
        'error',
        {
          component: true,
          html: true,
        },
      ],

      // react-native/no-unused-styles: Detect and remove unused StyleSheet rules to reduce bundle size
      'react-native/no-unused-styles': 'error',
      // react-native/no-inline-styles: Prevent inline styles for better performance and maintainable styling
      'react-native/no-inline-styles': 'off',
      // react-native/split-platform-components: Enforce platform-specific filenames for better code organization and tree-shaking
      'react-native/split-platform-components': 'error',
      // react-native/no-raw-text: Disabled due to crashes with undefined properties in edge cases
      'react-native/no-raw-text': 'off',
      // react-native/no-single-element-style-arrays: Avoid unnecessary StyleSheet arrays for single styles
      'react-native/no-single-element-style-arrays': 'error',

      // react-19-upgrade/no-default-props: Prepare for React 19 by using default parameters instead of defaultProps
      'react-19-upgrade/no-default-props': 'error',
      // react-19-upgrade/no-prop-types: Use TypeScript instead of PropTypes for better type safety in React 19
      'react-19-upgrade/no-prop-types': 'warn',
      // react-19-upgrade/no-legacy-context: Avoid legacy context API for React 19 compatibility
      'react-19-upgrade/no-legacy-context': 'error',
      // react-19-upgrade/no-string-refs: Use callback refs instead of string refs for React 19 compatibility
      'react-19-upgrade/no-string-refs': 'error',
      // react-19-upgrade/no-factories: Avoid React.createFactory which is removed in React 19
      'react-19-upgrade/no-factories': 'error',
    },
  },
];
