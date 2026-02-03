import React from 'react';
import { Text } from 'react-native';

// ❌ This should trigger import-x/no-anonymous-default-export
export default () => <Text>Anonymous</Text>;

// ❌ This should trigger react/display-name
export const NoDisplayName = React.memo(() => <Text>No Display Name</Text>);
