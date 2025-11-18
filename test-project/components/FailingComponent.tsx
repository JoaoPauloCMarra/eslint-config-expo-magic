import React, { useState } from 'react';
import { View, Text } from 'react-native';

// This component should fail React Compiler analysis due to unsupported patterns
// and should report ESLint errors since it has no successful compilations
const FailingComponent = () => {
	const [count, setCount] = useState(0);

	// This should fail - mutating a captured variable
	const increment = () => {
		count++; // ❌ Mutates captured variable
		setCount(count);
	};

	return (
		<View>
			<Text>Count: {count}</Text>
			<Text onPress={increment}>Increment</Text>
		</View>
	);
};

export default FailingComponent;

// This component should be successfully optimized
export const GoodComponent = () => {
	return (
		<View>
			<Text>I am good!</Text>
		</View>
	);
};
