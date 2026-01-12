import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';

// React advanced violations
export const ReactAdvanced: React.FC = () => {
	const [count, setCount] = useState(0);

	// react-hooks/exhaustive-deps
	useEffect(() => {
		console.log(count);
	}, []); // missing count

	// react-hooks/rules-of-hooks
	if (count > 5) {
		useState(0);
	}

	// react-hooks/purity
	const impure = () => {
		setCount(count + 1);
	};

	// react-hooks/preserve-manual-memoization
	const memoized = React.useMemo(() => count * 2, [count]);

	// react-hooks/unsupported-syntax
	const unsupported = React.createElement('div');

	// react-hooks/set-state-in-render
	if (count === 0) {
		setCount(1);
	}

	// react/display-name
	const Component = () => <Text>Component</Text>;

	// react/jsx-key
	const items = [1, 2, 3].map((item) => <Text key={item}>{item}</Text>);
	const noKey = [1, 2, 3].map((item) => <Text>{item}</Text>);

	// react/jsx-no-comment-textnodes
	const comment = <Text>{/* comment */}</Text>;

	// react/jsx-no-duplicate-props
	const duplicate = (
		<Text prop="1" prop="2">
			Duplicate
		</Text>
	);

	// react/jsx-no-undef
	const undef = <UndefinedComponent />;

	// react/no-children-prop
	const childrenProp = <Text children={<Text>Child</Text>} />;

	// react/no-danger-with-children
	const danger = (
		<Text dangerouslySetInnerHTML={{ __html: 'html' }}>
			<Text>Child</Text>
		</Text>
	);

	// react/no-string-refs
	const stringRef = <Text ref="stringRef" />;

	// react/no-unknown-property
	const unknown = <Text unknownProp="value" />;

	// react/self-closing-comp
	const selfClosing = <Text />;

	// react-native/no-unused-styles
	const unusedStyles = StyleSheet.create({
		unused: {
			color: 'red',
		},
	});

	// react-19-upgrade/no-factories
	const factory = React.createFactory('div');

	// react-19-upgrade/no-string-refs
	const stringRef2 = <Text ref="ref" />;

	return (
		<View>
			<Text>{count}</Text>
			{noKey}
		</View>
	);
};
