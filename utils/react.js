const expoReact = require('eslint-config-expo/flat/utils/react.js');

const pluginReactCompiler = require('eslint-plugin-react-compiler');
const pluginReactNative = require('eslint-plugin-react-native');
const pluginReact19Upgrade = require('eslint-plugin-react-19-upgrade');

module.exports = [
  ...expoReact,
  {
    plugins: {
      'react-compiler': pluginReactCompiler,
      'react-native': pluginReactNative,
      'react-19-upgrade': pluginReact19Upgrade,
    },

    rules: {
      // react/display-name: Enforce displayName for React components. Default: 'off'
      'react/display-name': 'warn',
      // react/jsx-key: Report missing key props in iterators/collection literals. Default: 'off'
      'react/jsx-key': [
        'warn',
        {
          checkFragmentShorthand: true,
          checkKeyMustBeforeSpread: true,
          warnOnDuplicates: true,
        },
      ],
      // react/jsx-no-duplicate-props: Prevent duplicate props in JSX. Default: 'off'
      'react/jsx-no-duplicate-props': 'error',
      // react/jsx-no-undef: Disallow undeclared variables in JSX. Default: 'off'
      'react/jsx-no-undef': 'error',
      // react/jsx-uses-react: Prevent React to be incorrectly marked as unused. Default: 'off'
      'react/jsx-uses-react': 'warn',
      // react/jsx-uses-vars: Prevent variables used in JSX to be incorrectly marked as unused. Default: 'off'
      'react/jsx-uses-vars': 'warn',
      // react/jsx-boolean-value: Enforce boolean attributes notation in JSX. Default: 'off'
      'react/jsx-boolean-value': ['error', 'never'],
      // react/no-danger-with-children: Prevent problematical use of children and dangerouslySetInnerHTML. Default: 'off'
      'react/no-danger-with-children': 'warn',
      // react/no-deprecated: Prevent usage of deprecated methods. Default: 'off'
      'react/no-deprecated': 'warn',
      // react/no-direct-mutation-state: Prevent direct mutation of this.state. Default: 'off'
      'react/no-direct-mutation-state': 'warn',

      // react-compiler/react-compiler: Enforce the rules of React Compiler. Default: 'off'
      'react-compiler/react-compiler': 'error',

      // react/jsx-no-leaked-render: Prevent leaking rendered values to the DOM. Default: 'off'
      'react/jsx-no-leaked-render': 'error',
      // react/function-component-definition: Enforce a specific function type for function components. Default: 'off'
      'react/function-component-definition': [
        'error',
        {
          namedComponents: 'arrow-function',
          unnamedComponents: 'arrow-function',
        },
      ],
      // react-hooks/rules-of-hooks: Enforce Rules of Hooks. Default: 'off'
      'react-hooks/rules-of-hooks': 'error',
      // react-hooks/exhaustive-deps: Verify the list of dependencies for Hooks like useEffect and similar. Default: 'off'
      'react-hooks/exhaustive-deps': 'error',

      // react/self-closing-comp: Disallow extra closing tags for components without children. Default: 'off'
      'react/self-closing-comp': [
        'error',
        {
          component: true,
          html: true,
        },
      ],
      // react/jsx-no-useless-fragment: Disallow unnecessary JSX fragments. Default: 'off'
      'react/jsx-no-useless-fragment': 'error',
      // react/no-unstable-nested-components: Prevent the creation of components inside components. Default: 'off'
      'react/no-unstable-nested-components': 'error',

      // react-native/no-unused-styles: Detect unused StyleSheet rules in React Native. Default: 'off'
      'react-native/no-unused-styles': 'error',
      // react-native/no-inline-styles: Detect inline styles in React Native. Default: 'off'
      'react-native/no-inline-styles': 'error',
      // react-native/split-platform-components: Enforce using platform specific filenames when necessary. Default: 'off'
      'react-native/split-platform-components': 'error',
      // react-native/no-raw-text: Detect raw text outside of Text component in React Native. Default: 'off'
      'react-native/no-raw-text': 'error',
      // react-native/no-single-element-style-arrays: Detect StyleSheet arrays with single element in React Native. Default: 'off'
      'react-native/no-single-element-style-arrays': 'error',

      // react-19-upgrade/no-default-props: Disallow defaultProps in favor of default parameters. Default: 'off'
      'react-19-upgrade/no-default-props': 'error',
      // react-19-upgrade/no-prop-types: Disallow PropTypes in favor of TypeScript. Default: 'off'
      'react-19-upgrade/no-prop-types': 'warn',
      // react-19-upgrade/no-legacy-context: Disallow legacy context API. Default: 'off'
      'react-19-upgrade/no-legacy-context': 'error',
      // react-19-upgrade/no-string-refs: Disallow string refs. Default: 'off'
      'react-19-upgrade/no-string-refs': 'error',
      // react-19-upgrade/no-factories: Disallow React.createFactory. Default: 'off'
      'react-19-upgrade/no-factories': 'error',
    },
  },
];
