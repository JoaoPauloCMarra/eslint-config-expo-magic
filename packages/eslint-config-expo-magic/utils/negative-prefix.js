// Bun's oxlint config parser compiles rule-option patterns without look-around.
// `^(?!P)` ("does not start with P") has an equivalent without it when P is a
// sequence of single-character atoms: the name ends before P is complete or
// differs from P at the first mismatching position.

const lookAround = /\(\?<?[=!]/;
const shorthandNegations = {
	d: '\\D',
	D: '\\d',
	w: '\\W',
	W: '\\w',
	s: '\\S',
	S: '\\s',
};

function lookAroundError(pattern) {
	return new Error(
		`Cannot rewrite the look-around in ${JSON.stringify(pattern)} for bun lint; only ^(?!...) with single-character atoms is supported.`,
	);
}

function classChar(char) {
	return /[\\\]^-]/.test(char) ? `\\${char}` : char;
}

// Splits P into atoms: a literal, an escape, or a character class.
function atoms(prefix, pattern) {
	const result = [];
	let index = 0;

	while (index < prefix.length) {
		const char = prefix[index];
		if (char === '\\') {
			result.push(prefix.slice(index, index + 2));
			index += 2;
		} else if (char === '[') {
			const end = prefix.indexOf(']', index + 2);
			if (end === -1) throw lookAroundError(pattern);
			result.push(prefix.slice(index, end + 1));
			index = end + 1;
		} else if ('()|*+?{}.^$'.includes(char)) {
			throw lookAroundError(pattern);
		} else {
			result.push(char);
			index += 1;
		}
	}

	return result;
}

function negate(atom) {
	if (atom.startsWith('[^')) return `[${atom.slice(2)}`;
	if (atom.startsWith('[')) return `[^${atom.slice(1)}`;
	if (atom.startsWith('\\')) {
		const escaped = atom[1];
		return shorthandNegations[escaped] ?? `[^${classChar(escaped)}]`;
	}

	return `[^${classChar(atom)}]`;
}

function rewriteNegativePrefix(pattern) {
	if (!lookAround.test(pattern)) return pattern;

	const match = /^\^\(\?!(.+)\)$/.exec(pattern);
	if (!match) throw lookAroundError(pattern);

	const parts = atoms(match[1], pattern);
	let tail = '';
	for (const atom of parts.reverse()) {
		tail = `(?:$|${negate(atom)}${tail ? `|${atom}${tail}` : ''})`;
	}

	return `^${tail}`;
}

module.exports = { rewriteNegativePrefix };
