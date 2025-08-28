import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import UnusedComponent from './components/UnusedComponent';
import { HelperFunction } from './utils/helpers';

// ❌ This should trigger no-unused-vars
const unusedVariable = 'I am not used';

// ❌ This should trigger @typescript-eslint/no-explicit-any
const badFunction = (param: any) => {
  console.log(param);
};

// ❌ This should trigger react/no-unstable-nested-components
function App() {
  const NestedComponent = () => <Text>Hi</Text>; // Created on every render

  return (
    <View>
      <NestedComponent />
    </View>
  );
}

// ❌ This should trigger @typescript-eslint/no-floating-promises
const asyncFunction = async () => {
  return Promise.resolve('data');
};

// Call the function to trigger the rule
asyncFunction(); // This should trigger no-floating-promises

// ❌ This should trigger @typescript-eslint/consistent-type-definitions
interface BadInterface { // This should trigger consistent-type-definitions
  name: string;
}

// ❌ This should trigger react-hooks/exhaustive-deps
function ComponentWithHook() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    console.log(count); // Missing count in deps
  }, []); // ❌ Should include [count]

  return <Text>{count}</Text>;
}

// ❌ This should trigger @typescript-eslint/no-confusing-void-expression
function confusingVoidFunction() {
  return console.log('This returns void but looks like it returns data');
}

// ❌ This should trigger react-native/no-inline-styles
const BadStyledComponent = () => (
  <View style={{ margin: 10, padding: 20 }}> {/* ❌ Inline styles */}
    <Text>Bad styling</Text>
  </View>
);

// ❌ This should trigger no-restricted-imports (SafeAreaView from react-native)
import { SafeAreaView as BadSafeAreaView } from 'react-native';

// ❌ This should trigger no-console
console.log('This is a console log');

// ❌ This should trigger prefer-const
let shouldBeConst = 'I never change';