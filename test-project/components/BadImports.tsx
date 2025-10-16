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
