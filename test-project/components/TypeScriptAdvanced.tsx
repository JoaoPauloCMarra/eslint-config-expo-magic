import React from 'react';
import { View, Text } from 'react-native';

// TypeScript advanced violations
type Props = {
	name: string;
	age?: number;
};

export const TypeScriptAdvanced: React.FC<Props> = ({ name, age }) => {
	// @typescript-eslint/no-explicit-any
	const data: any = { key: 'value' };

	// @typescript-eslint/no-non-null-assertion
	const length = name.length;

	// @typescript-eslint/no-floating-promises
	Promise.resolve('test');

	// @typescript-eslint/await-thenable
	const thenable = {
		then: (callback: (value: string) => void) => {
			callback('test');
		},
	};

	async function testAwait() {
		await thenable;
	}

	// @typescript-eslint/no-empty-object-type
	type Empty = {};

	// @typescript-eslint/consistent-type-definitions
	type MyType = {
		prop: string;
	};

	// @typescript-eslint/naming-convention
	const camelCase = 'test';

	// @typescript-eslint/no-confusing-void-expression
	const confusing = (() => {})();

	// @typescript-eslint/no-redeclare
	var redeclare = 'first';
	var redeclare = 'second';

	// @typescript-eslint/no-require-imports
	const required = require('fs');

	// @typescript-eslint/no-unused-vars
	const unusedVar = 'unused';

	// @typescript-eslint/no-useless-constructor
	class UselessConstructor {
		constructor() {}
	}

	return (
		<View>
			<Text>{name}</Text>
		</View>
	);
};
