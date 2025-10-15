const expoReact = require('eslint-config-expo/flat/utils/react.js');

const pluginReactCompiler = require('eslint-plugin-react-compiler');
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
      'react-compiler': pluginReactCompiler,
      'react-native': pluginReactNative,
      'react-19-upgrade': pluginReact19Upgrade,
    },

    rules: {
      ...pluginReactHooks.configs.recommended.rules,

      // react/self-closing-comp: Require self-closing tags for components without children
      'react/self-closing-comp': [
        'error',
        {
          component: true,
          html: true,
        },
      ],
      // react/jsx-no-useless-fragment: Disallow unnecessary JSX fragments
      'react/jsx-no-useless-fragment': 'error',
      // react/no-unstable-nested-components: Prevent creating components inside components that can cause performance issues
      'react/no-unstable-nested-components': 'error',
      // react/jsx-no-leaked-render: Prevent leaking render values to the DOM
      'react/jsx-no-leaked-render': 'error',

      // react-native/no-unused-styles: Detect unused StyleSheet rules in React Native
      'react-native/no-unused-styles': 'error',
      // react-native/no-inline-styles: Prevent inline styles in React Native for better performance
      'react-native/no-inline-styles': 'error',
      // react-native/split-platform-components: Enforce platform-specific filenames for React Native components
      'react-native/split-platform-components': 'error',
      // react-native/no-raw-text: Prevent raw text outside of Text components in React Native
      'react-native/no-raw-text': 'error',
      // react-native/no-single-element-style-arrays: Prevent StyleSheet arrays with single elements in React Native
      'react-native/no-single-element-style-arrays': 'error',

      // react-19-upgrade/no-default-props: Disallow defaultProps in favor of default parameters for React 19 compatibility
      'react-19-upgrade/no-default-props': 'error',
      // react-19-upgrade/no-prop-types: Disallow PropTypes in favor of TypeScript for React 19 compatibility
      'react-19-upgrade/no-prop-types': 'warn',
      // react-19-upgrade/no-legacy-context: Disallow legacy context API for React 19 compatibility
      'react-19-upgrade/no-legacy-context': 'error',
      // react-19-upgrade/no-string-refs: Disallow string refs for React 19 compatibility
      'react-19-upgrade/no-string-refs': 'error',
      // react-19-upgrade/no-factories: Disallow React.createFactory for React 19 compatibility
      'react-19-upgrade/no-factories': 'error',
    },
  },
];
