// Intersection of glob patterns. A flat-config `files` entry can be an array
// of patterns that must ALL match (an AND-group). oxlint overrides only take an
// OR-list of strings, so each AND-group is lowered to the OR-list of globs that
// match exactly the paths every pattern matches.
//
// Supported syntax: literal characters, `*` inside a segment, `**` segments,
// and `{a,b}` brace alternatives (nested too). `?`, `[...]`, `(...)`, `!` and
// `\` throw.

function expandBraces(pattern) {
	let depth = 0;
	let open = -1;

	for (let index = 0; index < pattern.length; index += 1) {
		const char = pattern[index];
		if (char === '{') {
			if (depth === 0) open = index;
			depth += 1;
		} else if (char === '}') {
			if (depth === 0) {
				throw new Error(`intersectGlobs: unbalanced "}" in "${pattern}".`);
			}
			depth -= 1;
			if (depth === 0) {
				const head = pattern.slice(0, open);
				const tail = pattern.slice(index + 1);
				const alternatives = [];
				let start = open + 1;
				let nested = 0;
				for (let cursor = open + 1; cursor <= index; cursor += 1) {
					const current = pattern[cursor];
					if (current === '{') nested += 1;
					else if (current === '}' && cursor !== index) nested -= 1;
					else if ((current === ',' && nested === 0) || cursor === index) {
						alternatives.push(pattern.slice(start, cursor));
						start = cursor + 1;
					}
				}

				return alternatives.flatMap((alternative) =>
					expandBraces(`${head}${alternative}${tail}`),
				);
			}
		}
	}

	if (depth !== 0) {
		throw new Error(`intersectGlobs: unbalanced "{" in "${pattern}".`);
	}

	return [pattern];
}

function assertSupported(pattern) {
	if (typeof pattern !== 'string' || pattern.length === 0) {
		throw new Error(`intersectGlobs: unsupported pattern ${String(pattern)}.`);
	}
	if (/[\\?[\]()]/.test(pattern) || pattern.startsWith('!')) {
		throw new Error(`intersectGlobs: unsupported glob syntax in "${pattern}".`);
	}
}

function toSegments(pattern) {
	const segments = pattern
		.replace(/^\.\//, '')
		.split('/')
		.map((segment) =>
			segment === '**' ? segment : segment.replace(/\*+/g, '*'),
		);

	// A trailing `**` needs at least one more path segment, like `**/*`.
	if (segments[segments.length - 1] === '**') segments.push('*');

	const collapsed = [];
	for (const segment of segments) {
		if (segment === '**' && collapsed[collapsed.length - 1] === '**') continue;
		collapsed.push(segment);
	}

	return collapsed;
}

function intersectSegmentPair(left, right) {
	const memo = new Map();

	function solve(i, j) {
		const key = `${i},${j}`;
		if (memo.has(key)) return memo.get(key);

		const results = new Set();
		const a = left[i];
		const b = right[j];

		if (a === undefined && b === undefined) {
			results.add('');
		} else if (a === undefined) {
			if (b === '*') for (const rest of solve(i, j + 1)) results.add(rest);
		} else if (b === undefined) {
			if (a === '*') for (const rest of solve(i + 1, j)) results.add(rest);
		} else if (a === '*' && b === '*') {
			for (const rest of solve(i + 1, j)) results.add(`*${rest}`);
			for (const rest of solve(i, j + 1)) results.add(`*${rest}`);
		} else if (a === '*') {
			for (const rest of solve(i + 1, j)) results.add(rest);
			for (const rest of solve(i, j + 1)) results.add(`${b}${rest}`);
		} else if (b === '*') {
			for (const rest of solve(i, j + 1)) results.add(rest);
			for (const rest of solve(i + 1, j)) results.add(`${a}${rest}`);
		} else if (a === b) {
			for (const rest of solve(i + 1, j + 1)) results.add(`${a}${rest}`);
		}

		memo.set(key, results);

		return results;
	}

	return [...solve(0, 0)].map((segment) => segment.replace(/\*+/g, '*'));
}

function intersectSegmentGlobs(left, right) {
	if (left === '*') return [right];
	if (right === '*') return [left];
	if (left === right) return [left];

	return intersectSegmentPair([...left], [...right]);
}

function intersectSegmentLists(first, second) {
	const memo = new Map();

	function solve(i, j) {
		const key = `${i},${j}`;
		if (memo.has(key)) return memo.get(key);

		const results = new Map();
		const add = (prefix, rests) => {
			for (const rest of rests) {
				const joined = [...prefix, ...rest];
				results.set(joined.join('/'), joined);
			}
		};
		const a = first[i];
		const b = second[j];

		if (a === undefined && b === undefined) {
			results.set('', []);
		} else if (a === undefined || b === undefined) {
			const remaining = a === undefined ? second.slice(j) : first.slice(i);
			if (remaining.every((segment) => segment === '**')) {
				results.set('', []);
			}
		} else if (a === '**' && b === '**') {
			add(['**'], solve(i + 1, j).values());
			add(['**'], solve(i, j + 1).values());
		} else if (a === '**') {
			add([], solve(i + 1, j).values());
			add([b], solve(i, j + 1).values());
		} else if (b === '**') {
			add([], solve(i, j + 1).values());
			add([a], solve(i + 1, j).values());
		} else {
			const rests = [...solve(i + 1, j + 1).values()];
			for (const segment of intersectSegmentGlobs(a, b)) {
				add([segment], rests);
			}
		}

		memo.set(key, results);

		return results;
	}

	return [...solve(0, 0).values()];
}

function intersectExpanded(first, second) {
	return intersectSegmentLists(toSegments(first), toSegments(second)).map(
		(segments) => segments.join('/'),
	);
}

/**
 * Returns globs (an OR-list) that match exactly the paths every input pattern
 * matches, or null when no path can match all of them.
 */
function intersectGlobs(patterns) {
	if (!Array.isArray(patterns) || patterns.length === 0) {
		throw new Error('intersectGlobs: expected a non-empty array of patterns.');
	}

	for (const pattern of patterns) assertSupported(pattern);

	let current = [...new Set(expandBraces(patterns[0]))];
	for (const pattern of patterns.slice(1)) {
		const expanded = [...new Set(expandBraces(pattern))];
		const next = new Set();
		for (const left of current) {
			for (const right of expanded) {
				for (const glob of intersectExpanded(left, right)) next.add(glob);
			}
		}
		current = [...next];
		if (current.length === 0) return null;
	}

	return current.length === 0 ? null : current;
}

module.exports = { expandBraces, intersectGlobs };
