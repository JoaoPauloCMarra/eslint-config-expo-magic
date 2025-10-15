import React, { useState, useEffect, useRef } from "react";

// ❌ This should trigger @typescript-eslint/consistent-type-imports
// ❌ Should use type import

// ❌ This should trigger @typescript-eslint/no-import-type-side-effects

// ❌ This should trigger @typescript-eslint/consistent-type-imports
// ❌ Should use type import

// ❌ This should trigger @typescript-eslint/no-import-type-side-effects

// ❌ This should trigger @typescript-eslint/consistent-type-imports
// ❌ Should use type import

// ❌ This should trigger @typescript-eslint/no-import-type-side-effects
// ❌ defaultProps
import { View, Text, StyleSheet } from "react-native";

// ❌ This should trigger react-19-upgrade/no-prop-types
const PropTypes: any = require("prop-types"); // ❌ PropTypes import

// ❌ This should trigger no-restricted-imports (SafeAreaView from react-native)

// ❌ This should trigger no-unused-vars
const unusedVariable = "I am not used";

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

export default App;

// ❌ This should trigger @typescript-eslint/no-floating-promises
const asyncFunction = async () => {
  return Promise.resolve("data");
};

// Call the function to trigger the rule
asyncFunction(); // This should trigger no-floating-promises

// ❌ This should trigger @typescript-eslint/consistent-type-definitions
type BadInterface = {
  // This should trigger consistent-type-definitions
  name: string;
};

// ❌ This should trigger react-hooks/exhaustive-deps
export function ComponentWithHook() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    console.log(count); // Missing count in deps
  }, []); // ❌ Should include [count]

  return <Text>{count}</Text>;
}

// ❌ This should trigger @typescript-eslint/no-confusing-void-expression
function confusingVoidFunction() {
  console.log("This returns void but looks like it returns data");
}

// ❌ This should trigger react-native/no-inline-styles
const BadStyledComponent = () => (
  <View style={{ margin: 10, padding: 20 }}>
    {" "}
    {/* ❌ Inline styles */}
    <Text>Bad styling</Text>
  </View>
);

// ❌ This should trigger no-console
console.log("This is a console log");

// ❌ This should trigger react-hooks/purity (impure function in render)
function ComponentWithImpureRender() {
  const randomValue = Math.random(); // ❌ Impure!
  return <Text>Random: {randomValue}</Text>;
}

// ❌ This should trigger react-hooks/refs (reading ref during render)
function ComponentReadingRef() {
  const ref = useRef(null);
  const width = (ref.current as any)?.offsetWidth; // ❌ Reading ref during render
  return <View ref={ref}>Width: {width}</View>;
}

// ❌ This should trigger react-hooks/immutability (mutating state)
function ComponentMutatingState() {
  const [items, setItems] = useState([1, 2, 3]);
  items.push(4); // ❌ Mutating state directly
  return <Text>Items: {items.length}</Text>;
}

// ❌ This should trigger react-hooks/set-state-in-render (setting state during render)
function ComponentSettingStateInRender({ value }: { value: number }) {
  const [count, setCount] = useState(0);
  setCount(value); // ❌ Setting state during render
  return <Text>Count: {count}</Text>;
}

// ❌ This should trigger react-hooks/globals (mutating globals during render)
let globalCounter = 0;
function ComponentMutatingGlobals() {
  globalCounter++; // ❌ Mutating global during render
  return <Text>Global: {globalCounter}</Text>;
}

// ❌ Additional TypeScript rule test cases

// ❌ This should trigger @typescript-eslint/await-thenable
async function awaitThenable() {
  const notThenable = 42;
  await notThenable; // ❌ Awaiting a non-Thenable
}

// ❌ This should trigger @typescript-eslint/no-misused-promises
function misusedPromise() {
  if (Promise.resolve(true)) {
    // ❌ Promise in condition
    console.log("This should not work");
  }
}

// ❌ This should trigger @typescript-eslint/no-unnecessary-type-assertion
function unnecessaryAssertion() {
  const str: string = "hello";
  const asserted = str; // ❌ Unnecessary assertion
  return asserted;
}

// ❌ This should trigger @typescript-eslint/prefer-nullish-coalescing
function preferNullish() {
  const obj: { prop?: string } = {};
  const result = obj.prop || "default"; // ❌ Should use ??
  return result;
}

// ❌ This should trigger @typescript-eslint/prefer-optional-chain
function preferOptionalChain() {
  const obj: { prop?: { nested: string } } = {};
  const result = obj.prop?.nested; // ❌ Should use ?.
  return result;
}

// ❌ This should trigger @typescript-eslint/no-meaningless-void-operator
function meaninglessVoid() {
  const result = void "string"; // ❌ Meaningless void
  return result;
}

// ❌ This should trigger @typescript-eslint/array-type
function arrayType() {
  const arr: string[] = ["hello"]; // ❌ Should use string[]
  return arr;
}

// ❌ This should trigger @typescript-eslint/no-empty-object-type
type EmptyInterface = {}; // ❌ Empty interface

// ❌ This should trigger @typescript-eslint/no-unnecessary-type-constraint
function unnecessaryConstraint<T extends {}>(param: T) {
  // ❌ Unnecessary constraint
  return param;
}

// ❌ This should trigger @typescript-eslint/no-wrapper-object-types
function wrapperObject(obj: object) {
  // ❌ Should use object
  return obj;
}

// ❌ This should trigger @typescript-eslint/triple-slash-reference
/// <reference path="./types.d.ts" /> // ❌ Triple slash reference

// ❌ This should trigger @typescript-eslint/consistent-type-assertions
function consistentAssertions() {
  const str = "hello" as any as string; // ❌ Should use single 'as'
  return str;
}

// ❌ This should trigger @typescript-eslint/no-extra-non-null-assertion
function extraNonNull() {
  const str: string | null = "hello";
  const result = (str as any)!; // ❌ Extra non-null assertion
  return result;
}

// ❌ This should trigger @typescript-eslint/no-non-null-assertion
function nonNullAssertion() {
  const str: string | null = "hello";
  const result = str; // ❌ Non-null assertion
  return result;
}

// ❌ This should trigger @typescript-eslint/no-redeclare
function redeclareFunction() {
  var redeclareVar = "first";
  var redeclareVar = "second"; // ❌ Redeclaration
}

// ❌ This should trigger @typescript-eslint/no-useless-constructor
class UselessConstructor {
  constructor() {} // ❌ Useless constructor
}

// ❌ This should trigger @typescript-eslint/naming-convention
const badVariableName = "snake_case"; // ❌ Should be camelCase
enum BadEnum {
  badMember = "value", // ❌ Should be UPPER_CASE
} // ❌ Type import with side effects

// ❌ This should trigger react/self-closing-comp
function SelfClosingTest() {
  return (
    <View>
      <Text />
    </View>
  ); // ❌ Text should be self-closing
}

// ❌ This should trigger react/jsx-no-useless-fragment
function UselessFragmentTest() {
  return <Text>Hi</Text>; // ❌ Useless fragment
}

// ❌ This should trigger react/jsx-no-leaked-render
function LeakedRenderTest() {
  const condition = Math.random() > 0.5;
  return <Text>{condition && "Hi"}</Text>; // ❌ Leaked render
}

// ❌ This should trigger react-native/no-unused-styles
const unusedStyles = StyleSheet.create({
  unused: { color: "red" }, // ❌ Unused style
});

// ❌ This should trigger react-native/split-platform-components
function PlatformSpecificTest() {
  return <Text>Platform test</Text>; // This would be in a file that should be split
}

// ❌ This should trigger react-native/no-single-element-style-arrays
const singleStyleArray = StyleSheet.create({
  single: [{ color: "red" }] as any, // ❌ Single element array
});

// ❌ This should trigger react-19-upgrade/no-default-props
function ComponentWithDefaultProps({ name = "Default" }) {
  return <Text>{name || "Default"}</Text>;
}
// ❌ PropTypes import
function ComponentWithPropTypes({ name }: any) {
  return <Text>{name}</Text>;
}
(ComponentWithPropTypes as any).propTypes = {
  name: PropTypes.string, // ❌ PropTypes usage
};

// ❌ This should trigger react-19-upgrade/no-legacy-context
const LegacyContext = React.createContext("default"); // ❌ Legacy context

// ❌ This should trigger react-19-upgrade/no-string-refs
function ComponentWithStringRef() {
  return <View ref="stringRef" />; // ❌ String ref
}
