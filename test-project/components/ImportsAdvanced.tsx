import React from 'react';
import { View } from 'react-native';
import { Text } from 'react-native';
import fs from 'fs';
import path from 'path';

// Import advanced violations
// import-x/first
import { useState } from 'react';

// import-x/no-amd
define(['module'], function(module) {});

// import-x/no-anonymous-default-export
export default function() {};

// import-x/no-duplicates
import { View as V1 } from 'react-native';
import { View as V2 } from 'react-native';

// import-x/no-unresolved
import { NonExistent } from 'non-existent-module';

// import-x/no-webpack-loader-syntax
import 'style-loader!css-loader!styles.css';

// import-x/order
import z from 'z';
import a from 'a';

// import/first
import b from 'b';

// import/no-duplicates
import { Text as T1 } from 'react-native';
import { Text as T2 } from 'react-native';

// import/no-unresolved
import nonexistent from 'nonexistent';

export const ImportsAdvanced = () => {
  return (
    <View>
      <Text>Imports</Text>
    </View>
  );
};