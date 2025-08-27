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
      'react/display-name': 'warn',
      'react/jsx-key': [
        'warn',
        {
          checkFragmentShorthand: true,
          checkKeyMustBeforeSpread: true,
          warnOnDuplicates: true,
        },
      ],
      'react/jsx-no-duplicate-props': 'error',
      'react/jsx-no-undef': 'error',
      'react/jsx-uses-react': 'warn',
      'react/jsx-uses-vars': 'warn',
      'react/jsx-boolean-value': ['error', 'never'],
      'react/no-danger-with-children': 'warn',
      'react/no-deprecated': 'warn',
      'react/no-direct-mutation-state': 'warn',

      'react-compiler/react-compiler': 'error',

      'react/jsx-no-leaked-render': 'error',
      'react/function-component-definition': [
        'error',
        {
          namedComponents: 'arrow-function',
          unnamedComponents: 'arrow-function',
        },
      ],
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',

      'react/self-closing-comp': [
        'error',
        {
          component: true,
          html: true,
        },
      ],
      'react/jsx-no-useless-fragment': 'error',
      'react/no-unstable-nested-components': 'error',

      'react-native/no-unused-styles': 'error',
      'react-native/no-inline-styles': 'error',
      'react-native/split-platform-components': 'error',
      'react-native/no-raw-text': 'error',
      'react-native/no-single-element-style-arrays': 'error',

      'react-19-upgrade/no-default-props': 'error',
      'react-19-upgrade/no-prop-types': 'warn',
      'react-19-upgrade/no-legacy-context': 'error',
      'react-19-upgrade/no-string-refs': 'error',
      'react-19-upgrade/no-factories': 'error',
    },
  },
];
