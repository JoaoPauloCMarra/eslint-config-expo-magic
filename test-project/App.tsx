/// <reference path="foo" />
import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';

// prettier-ignore
// ❌ This should trigger no-unsafe-negation
const _unsafe = !'b' in { b: 1 };
console.log(_unsafe);

// ❌ This should trigger react/no-render-return-value
const container = {} as any;
// @ts-expect-error - testing render return
const _val = ReactDOM.render(<div />, container);

// ❌ This should trigger react/no-find-dom-node
// @ts-expect-error - testing findDOMNode
ReactDOM.findDOMNode(this);

// ❌ This should trigger import-x/default
import Def from 'react-native';
console.log(Def);

// ❌ This should trigger import-x/named
import { NonExistent } from 'react';
console.log(NonExistent);

// ❌ This should trigger import-x/no-named-as-default
import namedExport from './types';
console.log(namedExport);

// ❌ This should trigger import-x/no-named-as-default-member
import DefaultObj from './types';
console.log(DefaultObj.namedExport);

// ❌ This should trigger import-x/named
import { nonExistentMember } from './types';
console.log(nonExistentMember);

// ❌ This should trigger import/named
import { AlsoNonExistent } from './types';
console.log(AlsoNonExistent);

const TriggerHooks = () => {
	const [count, setCount] = useState(0);

	// ❌ This should trigger react-hooks/rules-of-hooks
	if (Math.random() > 0.5) {
		useState(0);
	}

	// ❌ This should trigger react-hooks/use-memo
	const _memoized = React.useMemo(() => {
		return count * 2;
	}, []);
	console.log(_memoized);

	// ❌ This should trigger react-hooks/set-state-in-effect
	// ❌ This should trigger react-hooks/set-state-in-effect
	const [loop, setLoop] = useState({});
	useEffect(() => {
		setLoop({});
	}, [loop]);
	// No dependencies!

	// ❌ This should trigger react-hooks/static-components
	// A component that could be static but uses a prop in a way that prevents it?
	// Actually, the rule might want us to NOT use hooks in some cases.
	const StaticComp = () => {
		return (
			<View>
				<Text>Static</Text>
			</View>
		);
	};
	console.log(StaticComp);

	// ❌ This should trigger react-hooks/globals
	_globalVar++;

	return (
		<View>
			<Text>{count}</Text>
			{/* ❌ This should trigger react-hooks/static-components */}
			{(() => {
				const Inner = () => <Text>Inner</Text>;
				return <Inner />;
			})()}
		</View>
	);
};
console.log(TriggerHooks);

// ❌ This should trigger react-hooks/static-components
const _Static = () => {
	const Nested = () => <div />;
	return <Nested />;
};

// ❌ This should trigger react-hooks/globals
let _globalVar = 0;
const _GlobalMutation = () => {
	_globalVar++;
	return <div />;
};

// ❌ This should trigger react/no-is-mounted
class IsMountedComponent extends React.Component {
	componentDidMount() {
		// @ts-expect-error - testing isMounted
		if (this.isMounted()) {
			console.log('mounted');
		}
	}
	render() {
		return null;
	}
}
console.log(IsMountedComponent);

// ❌ This should trigger react-hooks/error-boundaries
class MyErrorBoundary extends React.Component {
	componentDidCatch() {}
	render() {
		return <View>{this.props.children}</View>;
	}
}

const HookInErrorBoundary = () => {
	return (
		<MyErrorBoundary>
			{/* @ts-expect-error - trigger hook in error boundary? no, that's not it */}
			{/* maybe this rule is about something else */}
			<Text>Test</Text>
		</MyErrorBoundary>
	);
};
console.log(HookInErrorBoundary);

// ❌ This should trigger react-hooks/immutability
const MutateInComp = (props: any) => {
	props.foo = 1;
	return null;
};
console.log(MutateInComp);

// ❌ This should trigger react-hooks/component-hook-factories
const hookFactory = () => {
	return () => {
		useState(0);
		return null;
	};
};
console.log(hookFactory);

// ❌ This should trigger react-hooks/globals
const _GlobalWindowComp = () => {
	// @ts-expect-error - testing global mutation
	window.someGlobal = 1;
	return null;
};
console.log(_GlobalWindowComp);

// ❌ This should trigger react-hooks/component-hook-factories
function _createComponentFactory() {
	return function NestedComp() {
		// ❌ This should trigger react-hooks/rules-of-hooks AND potentially component-hook-factories
		useState(0);
		return null;
	};
}
console.log(_createComponentFactory);

// ❌ This should trigger react-hooks/error-boundaries
class _ErrorBoundaryWithHooks extends React.Component {
	componentDidCatch() {}
	render() {
		return null;
	}
}
// ❌ Potential violation if it sees this as a component with hooks?
// Documentation says it warns when hooks are used in a way that interferes with error boundaries.
const _CompWithHook = () => {
	useState(0);
	return <_ErrorBoundaryWithHooks />;
};
console.log(_CompWithHook);
// ❌ This should trigger react-hooks/error-boundaries
class BadErrorBoundary extends React.Component<any> {
	componentDidCatch() {}
	render() {
		useMemo(() => 1, []);
		return this.props.children;
	}
}
console.log(BadErrorBoundary);

// ❌ This should trigger react-hooks/component-hook-factories
const hookFactory = () => {
	useState(0);
	return () => <View />;
};
console.log(hookFactory);

// ❌ This should trigger react-hooks/immutability
const MutationInEffect = ({ item }: any) => {
	useEffect(() => {
		item.mutated = true;
	}, [item]);
	return null;
};
console.log(MutationInEffect);
// ❌ This should trigger react-hooks/error-boundaries
const _BadTryCatch = () => {
	try {
		return <View />;
	} catch (e) {
		console.log(e);
		return null;
	}
};
// ❌ This should trigger react-native/split-platform-components
import { DatePickerIOS } from 'react-native';
console.log(DatePickerIOS);

import { FC, ReactElement } from 'react';
const TestFC: FC = () => null;
console.log(TestFC);

// ❌ This should trigger @typescript-eslint/no-import-type-side-effects
import { type SomeType } from './types';
const t: SomeType = {} as any;
console.log(t);

import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
console.log(SafeAreaView);

// ❌ This should trigger @typescript-eslint/no-dupe-class-members and no-dupe-class-members
class Dupe {
	foo() {}
	foo() {}
}
console.log(Dupe);

// ❌ This should trigger @typescript-eslint/triple-slash-reference
/// <reference path="foo" />

// ❌ This should trigger no-unused-vars
const unusedVariable = 'I am not used';

// ❌ This should trigger @typescript-eslint/no-explicit-any
const badFunction = (param: any) => {
	console.log(param);
};

// ❌ This should trigger react/no-unstable-nested-components
function App() {
	const NestedComponent = () => <Text>Hi</Text>; // Created on every render

	return (
		<View>
			<NestedComponent />
			<Text style={{ margin: 10, padding: 20 }}>Inline styled text</Text>
		</View>
	);
}

export default App;

// ❌ This should trigger @typescript-eslint/no-floating-promises
const asyncFunction = async () => {
	return 'data';
};
asyncFunction();

// ❌ This should trigger @typescript-eslint/consistent-type-definitions
interface BadInterface {
	name: string;
}

// ❌ This should trigger react-hooks/exhaustive-deps
export function ComponentWithHook() {
	const [count] = useState(0);
	useEffect(() => {
		console.log(count);
	}, []);

	return <Text>{count}</Text>;
}

// ❌ This should trigger @typescript-eslint/no-confusing-void-expression
const voidExpr = (cond: boolean) => (cond ? console.log(1) : console.log(2));

// ❌ This should trigger react-native/no-inline-styles
const BadStyledComponent = () => (
	<View style={{ margin: 10 }}>
		<Text>Bad styling</Text>
	</View>
);

// ❌ This should trigger no-console
console.log('This is a console log');

// ❌ This should trigger eqeqeq
const eqtest = 1 == '1';

// ❌ This should trigger no-dupe-args
function duplicateArgs(a: any, b: any) {
	// To trigger no-dupe-args, we need actual duplicate names in JS,
	// but TS usually catches this first.
}

// ❌ This should trigger no-dupe-keys
const duplicateKeys = {
	a: 1,
	a: 2,
};

// ❌ This should trigger no-duplicate-case
function switchWithDuplicates(value: number) {
	switch (value) {
		case 1:
			return 'one';
		case 1:
			return 'duplicate';
		default:
			return 'other';
	}
}

// ❌ This should trigger no-empty-pattern
const {} = {};

// ❌ This should trigger no-extend-native
(Object.prototype as any).badExtension = () => {};

// ❌ This should trigger no-extra-bind
const boundFunction = function () {
	return 1;
}.bind({});

// ❌ This should trigger no-unreachable
function unreachableCode() {
	return true;
	console.log('unreachable');
}

// ❌ This should trigger no-unsafe-negation
const unsafeneg = (!'key') in {};

// ❌ This should trigger no-unused-expressions
1 + 1;

// ❌ This should trigger no-unused-labels
unusedLabel: for (let i = 0; i < 1; i++) {
	break;
}

// ❌ This should trigger no-with
// with ({ a: 1 }) { console.log(a); } // Not allowed in strict mode (TS default)

// ❌ This should trigger @typescript-eslint/no-unnecessary-type-assertion
const unnecasrt = 'hello' as string;

// ❌ This should trigger @typescript-eslint/prefer-optional-chain
const optchainobj: any = {};
const optchainresult = optchainobj && optchainobj.prop;

// ❌ This should trigger @typescript-eslint/no-meaningless-void-operator
const meaninglessvoid = void 1;

// ❌ This should trigger @typescript-eslint/array-type
const arrtype: Array<string> = ['hello'];

// ❌ This should trigger @typescript-eslint/no-empty-object-type
type EmptyObjType = {};

// ❌ This should trigger @typescript-eslint/no-unnecessary-type-constraint
function unnecessaryConstraint<T extends any>(param: T) {
	return param;
}

// ❌ This should trigger @typescript-eslint/no-wrapper-object-types
const wrappedObj: String = 'hi';

// ❌ This should trigger @typescript-eslint/triple-slash-reference
/// <reference path="./App.tsx" />

// ❌ This should trigger @typescript-eslint/no-extra-non-null-assertion
const extranonnull: any = {};
const extranonnullres = extranonnull!!.prop;

// ❌ This should trigger @typescript-eslint/no-redeclare
var redeclareVar = 'first';
var redeclareVar = 'second';

// ❌ This should trigger @typescript-eslint/no-useless-constructor
class UselessConstructor {
	constructor() {}
}

// ❌ This should trigger @typescript-eslint/naming-convention
const bad_variable_name = 1;

// ❌ This should trigger react/jsx-key
function ComponentWithList() {
	return (
		<View>
			{[1, 2].map((item) => (
				<Text>{item}</Text>
			))}
		</View>
	);
}

// ❌ This should trigger react/jsx-no-comment-textnodes
function ComponentWithComment() {
	return <View>// This is not a comment node but text</View>;
}

// ❌ This should trigger react/jsx-no-duplicate-props
const DupeProp = () => (
	<Text key="1" key="2">
		Hi
	</Text>
);

// ❌ This should trigger react/jsx-no-undef
// const UndefComp = () => <UndefinedComponent />;

// ❌ This should trigger react/no-children-prop
const ChildrenProp = () => <View children={<Text>Hi</Text>} />;

// ❌ This should trigger react/no-danger-with-children
const DangerChildren = () => (
	<View dangerouslySetInnerHTML={{ __html: '' }}>Hi</View>
);

// ❌ This should trigger react/self-closing-comp
const SelfClose = () => <View></View>;

// ❌ This should trigger react/jsx-no-useless-fragment
const UselessFrag = () => (
	<>
		<Text>Hi</Text>
	</>
);

// ❌ This should trigger react/jsx-no-leaked-render
const LeakedRender = () => <View>{0 && <Text>Zero</Text>}</View>;

// ❌ This should trigger react-native/no-unused-styles
const unusedStyles = StyleSheet.create({
	unused: { color: 'red' },
});

// ❌ This should trigger react-native/no-single-element-style-arrays
const singleStyleArray = () => <View style={[unusedStyles.unused]} />;

// ❌ This should trigger react-19-upgrade/no-default-props
function DefProps({ name }: any) {
	return <Text>{name}</Text>;
}
DefProps.defaultProps = { name: 'Hi' };

// ❌ This should trigger react-19-upgrade/no-legacy-context
function LegacyContext(props: any, context: any) {
	return <Text>Hi</Text>;
}
(LegacyContext as any).contextTypes = {};

// ❌ This should trigger react-19-upgrade/no-string-refs
class StringRef extends React.Component {
	render() {
		return <View ref="myRef" />;
	}
}

// ❌ This should trigger react-19-upgrade/no-factories
const factory = React.createFactory('div');

// ❌ This should trigger @typescript-eslint/await-thenable
async function awaitThenable() {
	await 'not a promise';
}

// ❌ This should trigger @typescript-eslint/prefer-readonly
class PreferReadonly {
	private neverAssigned = 1;
	getValue() {
		return this.neverAssigned;
	}
}

// ❌ This should trigger export-specific best practices
const envVar = process.env.DATABASE_URL; // Should trigger restricted-syntax (EXPO_PUBLIC_)
const dynamicEnv = process.env[bad_variable_name as any]; // Should trigger expo/no-dynamic-env-var

// ❌ This should trigger expo/no-env-var-destructuring
const { EXPO_PUBLIC_TEST } = process.env;

// ❌ This should trigger @typescript-eslint/naming-convention
class bad_class_name {}
console.log(bad_class_name);
enum BadEnum {
	bad_member,
}
console.log(BadEnum.bad_member);

// ❌ This should trigger use-isnan
if (NaN == NaN) {
	console.log('NaN');
}

// ❌ This should trigger valid-typeof
const typeofcheck = typeof {} === 'strin';
console.log(typeofcheck);

// ❌ This should trigger react/no-deprecated
class DeprecatedTest extends React.Component {
	componentWillMount() {
		console.log('deprecated');
	}
	render() {
		return null;
	}
}
console.log(DeprecatedTest);

// ❌ This should trigger no-redeclare (in a plain JS file maybe? or if enabled)
// For TS we use @typescript-eslint/no-redeclare
var x = 1;
var x = 2;
console.log(x);

// ❌ This should trigger no-empty-character-class
const emptyregex = /[]/;
console.log(emptyregex);

// ❌ This should trigger react/no-direct-mutation-state
class MutateState extends React.Component {
	mutate() {
		// @ts-expect-error - testing direct mutation
		this.state = { a: 2 };
	}
	render() {
		return <ProgressBarAndroid />;
	}
}
console.log(MutateState);

// ❌ This should trigger react/no-is-mounted
class IsMountedCheck extends React.Component {
	check() {
		(this as any).isMounted();
	}
	render() {
		return null;
	}
}
console.log(IsMountedCheck);

// ❌ This should trigger react/no-this-in-sfc
function ThisInSFC(props: any) {
	return <div>{this.props.name}</div>;
}
console.log(ThisInSFC);

// ❌ This should trigger react/no-unescaped-entities
function Unescaped() {
	return <div> ' </div>;
}
console.log(Unescaped);

// ❌ This should trigger react/require-render-return
class NoReturn extends React.Component {
	render() {
		console.log('no return');
	}
}
console.log(NoReturn);

// ❌ This should trigger react/jsx-uses-react and react/jsx-uses-vars (if they trigger violations)
function UsesReact(_props: any) {
	const Var = 'div';
	return <Var />;
}
console.log(UsesReact);

// ❌ This should trigger react-19-upgrade/no-prop-types
const PropTypeComp = () => null;
// @ts-expect-error - testing propTypes
PropTypeComp.propTypes = {};
console.log(PropTypeComp);

// ❌ This should trigger react-19-upgrade/no-legacy-context
class LegacyContextClass extends React.Component {
	// @ts-expect-error - testing legacy context
	static childContextTypes = {
		color: () => null,
	};
	getChildContext() {
		return { color: 'red' };
	}
	render() {
		return null;
	}
}
console.log(LegacyContextClass);

// ❌ This should trigger @typescript-eslint/no-meaningless-void-operator
void console.log('meaningless');

// ❌ This should trigger @typescript-eslint/no-unnecessary-type-assertion
const assertionVal: string = 'hi';
const _assertionVal2 = assertionVal as string;

// ❌ Avoided by find-missing-rules? but let's try again for no-unsafe-negation
const _negation = (!'a') in { a: 1 };

export const exportedA = 1;
export const exportedB = 2;

// ❌ Trigger no-unsafe-negation
if ((!'x') in {}) {
	console.log('unsafe');
}

// ❌ Trigger no-restricted-syntax for interfaces
interface ITest {
	name: string;
}
const itest: ITest = { name: 'test' };
console.log(itest);
