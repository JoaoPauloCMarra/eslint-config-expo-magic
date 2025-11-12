import React, { useState, useEffect, useRef } from "react";

// ❌ This should trigger @typescript-eslint/consistent-type-imports
// ❌ Should use type import
import type { Component } from "react";

// ❌ This should trigger @typescript-eslint/no-import-type-side-effects
import { type SomeType, someValue } from "./types";

// ❌ This should trigger @typescript-eslint/consistent-type-imports
// ❌ Should use type import
import type { FC } from "react";

// ❌ This should trigger @typescript-eslint/no-import-type-side-effects
import { type AnotherType, anotherValue } from "./types";

// ❌ This should trigger @typescript-eslint/consistent-type-imports
// ❌ Should use type import
import type { ReactElement } from "react";

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

  // Pass the component as a prop to trigger the rule
  const items = [1, 2, 3];
  const renderedItems = items.map((item) => <NestedComponent key={item} />);

  return (
    <View>
      {renderedItems}
      <Text style={{ margin: 10, padding: 20 }}>Inline styled text</Text>
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

// ❌ This should trigger eqeqeq
function equalityCheck() {
  if (1 == "1") { // ❌ Should use ===
    return true;
  }
  return false;
}

// ❌ This should trigger no-dupe-args
function duplicateArgs(a: number, a: string) { // ❌ Duplicate parameter
  return a;
}

// ❌ This should trigger no-dupe-keys
const duplicateKeys = {
  a: 1,
  a: 2, // ❌ Duplicate key
};

// ❌ This should trigger no-duplicate-case
function switchWithDuplicates(value: number) {
  switch (value) {
    case 1:
      return "one";
    case 1: // ❌ Duplicate case
      return "duplicate";
    default:
      return "other";
  }
}

// ❌ This should trigger no-empty-character-class
const emptyCharClass = /^$/; // This might trigger if we have an empty character class

// ❌ This should trigger no-empty-pattern
const {} = {}; // ❌ Empty destructuring pattern

// ❌ This should trigger no-extend-native
Object.prototype.badExtension = () => {}; // ❌ Extending native prototype

// ❌ This should trigger no-extra-bind
const boundFunction = function() {
  return this.value;
}.bind({}); // ❌ Unnecessary bind

// ❌ This should trigger no-unreachable
function unreachableCode() {
  return true;
  console.log("unreachable"); // ❌ Unreachable code
}

// ❌ This should trigger no-unsafe-negation
if (!1 in [1, 2, 3]) { // ❌ Unsafe negation
  console.log("unsafe");
}

// ❌ This should trigger no-unused-expressions
1 + 1; // ❌ Unused expression

// ❌ This should trigger no-unused-labels
unusedLabel: for (let i = 0; i < 1; i++) { // ❌ Unused label
  break;
}

// ❌ This should trigger no-with
with ({ a: 1 }) { // ❌ With statement
  console.log(a);
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

// ❌ This should trigger react/jsx-key
function ComponentWithList() {
  const items = [1, 2, 3];
  return (
    <View>
      {items.map(item => (
        <Text>{item}</Text> // ❌ Missing key
      ))}
    </View>
  );
}

// ❌ This should trigger react/jsx-no-comment-textnodes
function ComponentWithComment() {
  return (
    <View>
      {/* This is a comment */} // ❌ Comment in JSX
      <Text>Hi</Text>
    </View>
  );
}

// ❌ This should trigger react/jsx-no-duplicate-props
function ComponentWithDuplicateProps() {
  return (
    <Text key="1" key="2"> // ❌ Duplicate props
      Duplicate
    </Text>
  );
}

// ❌ This should trigger react/jsx-no-undef
function ComponentWithUndefined() {
  return (
    <UndefinedComponent /> // ❌ Undefined component
  );
}

// ❌ This should trigger react/jsx-uses-react
function ComponentUsingReact() {
  return React.createElement("div", null, "Hi"); // This might trigger jsx-uses-react
}

// ❌ This should trigger react/no-children-prop
function ComponentWithChildrenProp() {
  return (
    <Text children="Hi" /> // ❌ Children as prop
  );
}

// ❌ This should trigger react/no-danger-with-children
function ComponentWithDanger() {
  return (
    <Text dangerouslySetInnerHTML={{ __html: "<strong>Hi</strong>" }}>
      Children here // ❌ Danger with children
    </Text>
  );
}

// ❌ This should trigger react/no-deprecated
function ComponentWithDeprecated() {
  return (
    <Text onPress={() => {}} /> // This might be deprecated in some contexts
  );
}

// ❌ This should trigger react/no-direct-mutation-state
function ComponentMutatingProps(props: any) {
  props.value = "mutated"; // ❌ Direct mutation
  return <Text>{props.value}</Text>;
}

// ❌ This should trigger react/no-find-dom-node
function ComponentFindingDOM() {
  // This would require ReactDOM.findDOMNode which isn't available in RN
  return <Text>DOM node</Text>;
}

// ❌ This should trigger react/no-is-mounted
function ComponentCheckingMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);
  if (mounted) { // ❌ Checking isMounted
    return <Text>Mounted</Text>;
  }
  return null;
}

// ❌ This should trigger react/no-render-return-value
function ComponentWithRenderReturn() {
  const renderResult = <Text>Hi</Text>; // ❌ Render return value
  return renderResult;
}

// ❌ This should trigger react/no-this-in-sfc
function FunctionalComponent() {
  return this ? <Text>Hi</Text> : null; // ❌ this in functional component
}

// ❌ This should trigger react/no-unescaped-entities
function ComponentWithEntities() {
  return (
    <Text>Hi & bye</Text> // ❌ Unescaped entities
  );
}

// ❌ This should trigger react/no-unknown-property
function ComponentWithUnknownProp() {
  return (
    <Text unknownProp="value" /> // ❌ Unknown property
  );
}

// ❌ This should trigger react/require-render-return
function ComponentWithoutReturn() {
  // Missing return statement
}

// ❌ This should trigger react/self-closing-comp
function SelfClosingTest() {
  return (
    <View>
      <Text></Text> // ❌ Should be self-closing
    </View>
  );
}

// ❌ This should trigger react/jsx-no-useless-fragment
function UselessFragmentTest() {
  return <Text>Hi</Text>; // ❌ Useless fragment
}

// ❌ This should trigger react/jsx-no-leaked-render
function LeakedRenderTest() {
  const condition = Math.random() > 0.5;
  return <Text>{condition ? "Hi" : null}</Text>; // ❌ Leaked render
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

// ❌ This should trigger react-19-upgrade/no-factories
const FactoryComponent = React.createFactory(Text); // ❌ React factory

// ❌ This should trigger @typescript-eslint/await-thenable
async function awaitThenable() {
  const notPromise = "string";
  await notPromise; // ❌ Awaiting non-Promise
}

// ❌ This should trigger @typescript-eslint/prefer-readonly
function preferReadonly() {
  const mutableArray: string[] = ["a", "b"]; // ❌ Should be readonly
  return mutableArray;
}

// ❌ This should trigger import-x/first
console.log("Import should be first"); // ❌ Import not first

// ❌ This should trigger import-x/no-amd
define(["module"], function(module) {}); // ❌ AMD module

// ❌ This should trigger import-x/no-cycle
// This would require circular imports between files

// ❌ This should trigger import-x/no-named-as-default
import { NamedExport } from "module";
const DefaultImport = NamedExport; // ❌ Named as default

// ❌ This should trigger import-x/no-named-as-default-member
import * as AllExports from "module";
const SpecificExport = AllExports.specific; // ❌ Named as default member

// ❌ This should trigger import-x/no-webpack-loader-syntax
import "style-loader!css-loader!styles.css"; // ❌ Webpack loader syntax

// ❌ This should trigger expo/prefer-box-shadow
const shadowStyle = {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.25,
  shadowRadius: 3.84,
  elevation: 5, // ❌ Should use boxShadow
};

// ❌ This should trigger no-restricted-imports
import { SafeAreaView } from "react-native"; // ❌ Restricted import

// ❌ This should trigger no-restricted-syntax
interface BadInterfaceSyntax {
  name: string;
} // ❌ Interface usage
