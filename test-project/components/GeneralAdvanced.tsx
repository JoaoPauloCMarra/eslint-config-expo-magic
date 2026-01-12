import React from 'react';
import { View, Text } from 'react-native';

// General advanced violations
export const GeneralAdvanced = () => {
	// eqeqeq
	if (1 == '1') {
	}

	// expo/prefer-box-shadow
	const styles = {
		shadow: {
			shadowColor: '#000',
			shadowOffset: { width: 0, height: 2 },
			shadowOpacity: 0.8,
			shadowRadius: 2,
		},
	};

	// no-console
	console.log('test');

	// no-dupe-args
	function dupeArgs(a, a) {}

	// no-dupe-keys
	const obj = { a: 1, a: 2 };

	// no-duplicate-case
	switch (1) {
		case 1:
			break;
		case 1:
			break;
	}

	// no-empty-pattern
	const {} = obj;

	// no-extend-native
	Array.prototype.custom = () => {};

	// no-restricted-imports
	import('fs');

	// no-restricted-syntax
	with (obj) {
	}

	// no-undef
	undefinedVar;

	// no-unreachable
	return;
	console.log('unreachable');

	// no-unsafe-negation
	if ((!obj) instanceof Object) {
	}

	// no-unused-expressions
	1 + 1;

	// no-unused-labels
	for (let i = 0; i < 10; i++) {}

	// no-unused-vars
	const unused = 'unused';

	// no-var
	let oldVar = 'old';

	// no-with
	with (obj) {
	}

	// unused-imports/no-unused-imports

	return (
		<View>
			<Text>General</Text>
		</View>
	);
};
