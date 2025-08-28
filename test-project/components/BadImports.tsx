// ❌ Bad import order (should trigger import/order)
import { useState } from 'react';
import { View, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import React from 'react'; // React should be first

// ❌ Unused import (should trigger no-unused-vars or unused-imports)
import { StyleSheet } from 'react-native';

// ❌ Anonymous default export (should trigger import/no-anonymous-default-export)
export default () => {
  return (
    <View>
      <Text>Test Component</Text>
    </View>
  );
};