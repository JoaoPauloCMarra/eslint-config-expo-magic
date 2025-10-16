import React from "react";
import { View, Text } from "react-native";

// ❌ This component is imported but never used (should trigger no-unused-vars)
const UnusedComponent: React.FC = () => {
  return (
    <View>
      <Text>I am an unused component</Text>
    </View>
  );
};

export default UnusedComponent;
