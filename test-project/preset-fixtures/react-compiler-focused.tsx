import { useState } from 'react';

export function ReactCompilerFocusedFixture({ code }: { code: string }) {
	const result = eval(code);
	const [count, setCount] = useState(0);
	setCount(count + 1);

	return (
		<>
			{result}:{Math.random()}:{count}
		</>
	);
}
