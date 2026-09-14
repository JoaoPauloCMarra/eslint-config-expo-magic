const DEFAULT_KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function baseName(filePath) {
	return filePath.split(/[\\/]/).pop() ?? '';
}

/**
 * Strips every extension so `use-home-screen.test.ts` and `+not-found.tsx`
 * reduce to the stem the convention applies to.
 */
function stem(name) {
	const dotIndex = name.indexOf('.');
	return dotIndex === -1 ? name : name.slice(0, dotIndex);
}

module.exports = {
	meta: {
		type: 'suggestion',
		docs: {
			description:
				'Require lowercase kebab-case file names so authored modules stay predictable across platforms.',
		},
		schema: [
			{
				type: 'object',
				properties: {
					ignore: {
						type: 'array',
						items: { type: 'string' },
					},
					allowLeadingCharacters: {
						type: 'string',
					},
				},
				additionalProperties: false,
			},
		],
		messages: {
			notKebab:
				'File "{{name}}" is not lowercase kebab-case. Rename it to "{{suggestion}}".',
		},
	},
	create(context) {
		const options = context.options[0] ?? {};
		const ignore = (options.ignore ?? []).map((value) => new RegExp(value));
		// Router conventions such as `+not-found` or `[id]` keep their prefix.
		const leading = options.allowLeadingCharacters ?? '+_[]()$@.';

		return {
			Program(node) {
				const filePath = context.filename ?? context.getFilename();
				if (!filePath || filePath === '<input>' || filePath === '<text>') {
					return;
				}

				const name = baseName(filePath);
				if (ignore.some((pattern) => pattern.test(name))) {
					return;
				}

				let candidate = stem(name);
				let prefix = '';
				while (candidate.length > 0 && leading.includes(candidate[0])) {
					prefix += candidate[0];
					candidate = candidate.slice(1);
				}
				let suffix = '';
				while (
					candidate.length > 0 &&
					leading.includes(candidate[candidate.length - 1])
				) {
					suffix = candidate[candidate.length - 1] + suffix;
					candidate = candidate.slice(0, -1);
				}

				if (candidate.length === 0 || DEFAULT_KEBAB.test(candidate)) {
					return;
				}

				const suggestion = candidate
					.replace(/([a-z0-9])([A-Z])/g, '$1-$2')
					.replace(/[_\s]+/g, '-')
					.toLowerCase();

				context.report({
					node,
					messageId: 'notKebab',
					data: { name, suggestion: `${prefix}${suggestion}${suffix}` },
				});
			},
		};
	},
};
