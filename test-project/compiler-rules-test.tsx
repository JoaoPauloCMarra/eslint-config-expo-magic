// @ts-nocheck
// Specific triggers for React Compiler rules

import React, { useState, useEffect, useMemo, Component } from 'react';
import { View, Text } from 'react-native';

// ❌ react-hooks/component-hook-factories
// Higher-order function that returns a component with hooks
function createComponentWithHooks() {
	return function InnerComponent() {
		const [state] = useState(0);
		return <View>{state}</View>;
	};
}
console.log(createComponentWithHooks);

// ❌ react-hooks/static-components
// Static component (no props, no hooks) - should be extracted
function StaticChild() {
	return <Text>Static content</Text>;
}
export const ParentWithStaticChild = () => {
	return (
		<View>
			<StaticChild />
		</View>
	);
};

// ❌ react-hooks/error-boundaries
// Error boundary using hooks (not allowed)
export class BadErrorBoundary extends Component {
	componentDidCatch() {}
	render() {
		// ❌ Can't use hooks in class components
		const [count] = useState(0);
		return this.props.children;
	}
}

// ❌ react-hooks/globals
// Accessing/modifying globals during render
export const GlobalAccessor = () => {
	// Direct global access during render
	window.myGlobal = 'value';
	globalThis.someValue = 123;
	return <View />;
};

// ❌ react-hooks/immutability
// Mutating props or objects that should be immutable
export const ImmutabilityViolation = ({ data }) => {
	useEffect(() => {
		data.modified = true; // ❌ Mutating prop
	}, [data]);

	return <View />;
};

// ❌ react-hooks/use-memo
// Side effects in useMemo
export const UseMemoWithSideEffects = () => {
	const value = useMemo(() => {
		console.log('Side effect'); // ❌ Side effect in useMemo
		window.myVar = 'test'; // ❌ Another side effect
		return 42;
	}, []);

	return <View>{value}</View>;
};

// ❌ react-hooks/set-state-in-effect
// Setting state that causes infinite loop
export const InfiniteLoopEffect = () => {
	const [count, setCount] = useState(0);

	useEffect(() => {
		setCount(count + 1); // ❌ This will cause infinite re-renders
	}, [count]);

	return <View>{count}</View>;
};

// ❌ react-hooks/incompatible-library
// Using incompatible third-party libraries (requires actual detection)
// This is usually for libraries that don't work with React Compiler
export const IncompatibleLibraryUsage = () => {
	// This rule detects specific library patterns
	return <View />;
};
