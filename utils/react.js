const expoReact = require('eslint-config-expo/flat/utils/react.js');

const pluginReactCompiler = require('eslint-plugin-react-compiler');
const pluginReactNative = require('eslint-plugin-react-native');

module.exports = [
  ...expoReact,
  {
    plugins: {
      'react-compiler': pluginReactCompiler,
      'react-native': pluginReactNative,
    },

    rules: {
      'react/display-name': 'warn',
      'react/jsx-key': [
        'error',
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

      'react/no-string-refs': [
        'warn',
        {
          noTemplateLiterals: true,
        },
      ],

      'react/require-render-return': 'warn',

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

      'react-native/no-unused-styles': 'error',
      'react-native/no-inline-styles': 'error',
      'react-native/split-platform-components': 'error',
      'react-native/no-raw-text': 'error',
      'react-native/no-single-element-style-arrays': 'error',
    },
  },
];
