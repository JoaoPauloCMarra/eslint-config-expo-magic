// ❌ Bad import order (should trigger import/order)
import React from "react"; // React should be first
import { View, Text } from "react-native";

// ❌ Unused import (should trigger no-unused-vars or unused-imports)

// ❌ Anonymous default export (should trigger import/no-anonymous-default-export)
export default () => {
  return (
    <View>
      <Text>Test Component</Text>
    </View>
  );
};

// ❌ Component that should fail React Compiler optimization due to mutation of captured variable
function BadComponent() {
  const [count, setCount] = React.useState(0);
  const increment = () => {
    count++; // ❌ Mutates captured variable - should fail optimization
    setCount(count);
  };
  return <button onPress={increment}>+</button>;
}

// ❌ Another component that should fail due to unsupported pattern
function AnotherBadComponent() {
  const [items, setItems] = React.useState([1, 2, 3]);
  const addItem = () => {
    const newItems = [...items];
    newItems.push(Math.random()); // ❌ Using Math.random() which can't be statically analyzed
    setItems(newItems);
  };
  return <button onPress={addItem}>Add Random</button>;
}
