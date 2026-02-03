// @ts-nocheck
import React, { useMemo } from 'react';
import { View, Text } from 'react-native';

// ❌ This should trigger import/named
import { ThisDoesNotExist } from './only-default';
console.log(ThisDoesNotExist);

// ❌ This should trigger import/default (no-default has no default)
import DefaultImport from './no-default';
console.log(DefaultImport);

// ❌ This should trigger import/named
import { b } from './mixed-exports';
console.log(b);

// ❌ This should trigger react-hooks/use-memo
export const MemoSideEffect = () => {
	const x = useMemo(() => {
		console.log('Side effect!');
		return 1;
	}, []);
	return <View>{x}</View>;
};

// ❌ This should trigger react-hooks/globals
export const GlobalAccess = () => {
	const ua = window.navigator.userAgent;
	return <Text>{ua}</Text>;
};
