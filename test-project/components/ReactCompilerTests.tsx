/**
 * React Compiler Test Cases
 *
 * This file contains comprehensive test cases for the react-compiler ESLint rule.
 * Each section tests a specific failure pattern that the React Compiler cannot optimize.
 *
 * Reference: https://react.dev/learn/react-compiler
 */

import React, {
	useState,
	useRef,
	useEffect,
	useMemo,
	useCallback,
} from 'react';
import type { FlatList } from 'react-native';
import { View, Text } from 'react-native';

// ============================================================================
// 1. MUTATING CAPTURED VARIABLES
// React Compiler cannot optimize components that mutate captured variables
// ============================================================================

// ❌ Mutating captured variable directly
export const MutatingCapturedVariable = () => {
	let count = 0; // Using let to allow mutation (bad pattern)
	const [, setCount] = useState(0);

	const increment = () => {
		count++; // ❌ Direct mutation of captured variable
		setCount(count);
	};

	return <Text onPress={increment}>{count}</Text>;
};

// ❌ Mutating captured array
export const MutatingCapturedArray = () => {
	const [items, setItems] = useState<string[]>([]);

	const addItem = () => {
		items.push('new item'); // ❌ Mutates captured array
		setItems(items);
	};

	return <Text onPress={addItem}>{items.length}</Text>;
};

// ============================================================================
// 2. REF MUTATIONS DURING RENDER
// React Compiler cannot optimize components that mutate refs during render
// ============================================================================

// ❌ Mutating ref.current during render (from react-compiler-marker fixtures)
export const RefMutationDuringRender = () => {
	const ref = useRef('initial');

	ref.current = 'updated'; // ❌ Mutating ref during render

	return <Text>{ref.current}</Text>;
};

// ❌ Reading ref.current during render
export const RefReadDuringRender = () => {
	const currentRef = useRef<FlatList>(null);

	// ❌ Reading ref.current during render causes issues
	const scrollPosition = currentRef.current ? 'scrolled' : 'not scrolled';

	return <Text>{scrollPosition}</Text>;
};

// ============================================================================
// 3. IMPURE RENDER FUNCTIONS
// React Compiler requires pure render functions
// ============================================================================

// ❌ Using Math.random() in render
export const MathRandomInRender = () => {
	const id = Math.random(); // ❌ Different value every render
	return <Text key={id}>Random ID: {id}</Text>;
};

// ❌ Using Date.now() in render
export const DateNowInRender = () => {
	const timestamp = Date.now(); // ❌ Changes every render
	return <Text>Created at: {timestamp}</Text>;
};

// ❌ Mutating global variables during render
let globalCounter = 0;
export const GlobalMutationInRender = () => {
	globalCounter++; // ❌ Mutating global during render
	return <Text>Count: {globalCounter}</Text>;
};

// ============================================================================
// 4. HOOKS CALLED CONDITIONALLY
// React Compiler cannot optimize components with conditional hooks
// ============================================================================

// ❌ useState in condition
export const ConditionalUseState = ({ condition }: { condition: boolean }) => {
	if (condition) {
		const [value] = useState('test'); // ❌ Hook in condition
		return <Text>{value}</Text>;
	}
	return <Text>No value</Text>;
};

// ❌ Hook after early return
export const HookAfterEarlyReturn = ({ loading }: { loading: boolean }) => {
	if (loading) {
		return <Text>Loading...</Text>;
	}
	const [data] = useState('loaded'); // ❌ Hook after conditional return
	return <Text>{data}</Text>;
};

// ============================================================================
// 5. HOOKS IN LOOPS
// React Compiler cannot optimize components with hooks in loops
// ============================================================================

// ❌ useState in loop
export const UseStateInLoop = ({ count }: { count: number }) => {
	const items: string[] = [];
	for (let i = 0; i < count; i++) {
		const [item] = useState(`item-${i}`); // ❌ Hook in loop
		items.push(item);
	}
	return <Text>{items.join(', ')}</Text>;
};

// ============================================================================
// 6. HOOKS IN CALLBACKS
// React Compiler cannot optimize hooks called inside callbacks
// ============================================================================

// ❌ Hook in event handler
export const HookInEventHandler = () => {
	const handlePress = () => {
		const [value] = useState('clicked'); // ❌ Hook in callback
		console.log(value);
	};
	return <Text onPress={handlePress}>Click me</Text>;
};

// ============================================================================
// 7. IIFE MUTATIONS IN CATCH BLOCKS (from react-compiler-marker critical-error.tsx)
// Complex error handling patterns that fail compilation
// ============================================================================

async function doStuff() {
	return Promise.resolve();
}

// ❌ IIFE in catch block causes compilation failure
export const IIFEInCatchBlock = () => {
	async function onSubmit() {
		try {
			await doStuff();
		} catch (error) {
			const errorString = (() => {
				// ❌ IIFE that references error variable
				if (!(error instanceof Error)) {
					return 'An unexpected error occurred';
				}
				return error.message;
			})();

			console.log(errorString);
		}
	}

	return <Text onPress={onSubmit}>Submit</Text>;
};

// ============================================================================
// 8. UNSUPPORTED SYNTAX
// React Compiler cannot analyze certain JavaScript patterns
// ============================================================================

// ❌ Using eval (dynamic code execution)
export const EvalInComponent = ({ code }: { code: string }) => {
	const result = eval(code); // ❌ eval cannot be analyzed
	return <Text>{result}</Text>;
};

// ============================================================================
// 9. UNCONDITIONAL setState DURING RENDER
// Calling setState unconditionally during render causes infinite loops
// ============================================================================

// ❌ Unconditional setState in render
export const UnconditionalSetStateDuringRender = ({
	value,
}: {
	value: number;
}) => {
	const [count, setCount] = useState(0);
	setCount(value); // ❌ Infinite loop!
	return <Text>{count}</Text>;
};

// ❌ Clamping during render (wrong approach)
export const ClampDuringRender = ({ max }: { max: number }) => {
	const [count, setCount] = useState(0);

	if (count > max) {
		setCount(max); // ❌ setState called during render
	}

	return (
		<Text
			onPress={() => {
				setCount((c) => c + 1);
			}}
		>
			{count}
		</Text>
	);
};

// ============================================================================
// 10. MISSING HOOK DEPENDENCIES
// While not always a compilation failure, missing deps can cause issues
// ============================================================================

// ❌ Missing dependencies in useEffect
export const MissingEffectDeps = ({ userId }: { userId: string }) => {
	const [data, setData] = useState<string | null>(null);

	useEffect(() => {
		// userId is used but not in deps
		fetch(`/api/user/${userId}`)
			.then((r) => r.text())
			.then(setData);
	}, []); // ❌ Missing userId

	return <Text>{data}</Text>;
};

// ❌ Missing dependencies in useMemo
export const MissingMemoDeps = ({
	items,
	filter,
}: {
	items: string[];
	filter: (s: string) => boolean;
}) => {
	const filtered = useMemo(() => {
		return items.filter(filter);
	}, [items]); // ❌ Missing filter

	return <Text>{filtered.join(', ')}</Text>;
};

// ❌ Missing dependencies in useCallback
export const MissingCallbackDeps = ({
	onUpdate,
	value,
}: {
	onUpdate: (v: number) => void;
	value: number;
}) => {
	const handleClick = useCallback(() => {
		onUpdate(value);
	}, [onUpdate]); // ❌ Missing value

	return <Text onPress={handleClick}>Update</Text>;
};

// ============================================================================
// 11. COMPLEX NESTED FUNCTIONS
// Deeply nested functions with closures can be hard to optimize
// ============================================================================

// ❌ Complex nested arrow functions with shared mutable state
export const ComplexNestedClosures = () => {
	let mutableState = 0; // ❌ Mutable captured variable

	const outer = () => {
		mutableState++; // ❌ Mutation in nested closure

		const inner = () => {
			return mutableState * 2;
		};

		return inner();
	};

	return <Text onPress={outer}>{mutableState}</Text>;
};

// ============================================================================
// 12. ASYNC COMPONENT PATTERNS (from react-compiler-marker fixtures)
// Various async function declarations that should compile
// ============================================================================

// ✅ Async function declaration (should compile)
async function AsyncFunctionComponent() {
	return <Text>Async component</Text>;
}

// ✅ Export async function (should compile)
export async function ExportAsyncFunction() {
	return <Text>Export async</Text>;
}

// ============================================================================
// 13. CORRECT PATTERNS (for comparison - these SHOULD compile)
// ============================================================================

// ✅ Correct: Pure component
export const PureComponent = ({ name }: { name: string }) => {
	return <Text>Hello, {name}!</Text>;
};

// ✅ Correct: Using state correctly
export const CorrectStateUsage = () => {
	const [count, setCount] = useState(0);
	return (
		<Text
			onPress={() => {
				setCount((c) => c + 1);
			}}
		>
			{count}
		</Text>
	);
};

// ✅ Correct: Ref accessed only in effect
export const CorrectRefUsage = () => {
	const ref = useRef<View>(null);

	useEffect(() => {
		// ✅ Accessing ref in effect is correct
		if (ref.current) {
			console.log('Mounted');
		}
	}, []);

	return <View ref={ref} />;
};

// ✅ Correct: All dependencies included
export const CorrectDependencies = ({ userId }: { userId: string }) => {
	const [data, setData] = useState<string | null>(null);

	useEffect(() => {
		fetch(`/api/user/${userId}`)
			.then((r) => r.text())
			.then(setData);
	}, [userId]); // ✅ All deps included

	return <Text>{data}</Text>;
};

// ✅ Correct: Immutable state updates
export const ImmutableStateUpdate = () => {
	const [items, setItems] = useState<string[]>([]);

	const addItem = () => {
		setItems((prev) => [...prev, 'new item']); // ✅ Immutable update
	};

	return <Text onPress={addItem}>{items.length}</Text>;
};

// ✅ Correct: Clamping in event handler
export const CorrectClamp = ({ max }: { max: number }) => {
	const [count, setCount] = useState(0);

	const increment = () => {
		setCount((current) => Math.min(current + 1, max)); // ✅ Clamp in handler
	};

	return <Text onPress={increment}>{count}</Text>;
};

// ============================================================================
// 14. CUSTOM HOOKS (should be detected and analyzed)
// ============================================================================

// ✅ Custom hook - should be analyzed
export function useCustomCounter(initial: number) {
	const [count, setCount] = useState(initial);
	return {
		count,
		increment: () => {
			setCount((c) => c + 1);
		},
	};
}

// ❌ Custom hook with mutation
export function useBrokenCounter() {
	let count = 0; // ❌ Mutable variable captured

	const increment = () => {
		count++; // ❌ Mutation
	};

	return { count, increment };
}

// ✅ Custom hook using other hooks
export function useWindowTitle(title: string) {
	useEffect(() => {
		document.title = title;
	}, [title]);
}
