const DEFAULTS = {
	aliasPrefix: '@',
	contractsSegment: 'contracts',
	featuresSegment: 'features',
	srcRoot: 'src',
};

/**
 * Returns the feature name for a file path, or null when the file is not inside
 * a feature. Works on the raw path, so no import resolver is required.
 */
function featureOfFile(filePath, options) {
	const normalized = filePath.split('\\').join('/');
	const marker = `/${options.srcRoot}/${options.featuresSegment}/`;
	const index = normalized.indexOf(marker);
	const tail =
		index === -1
			? normalized.startsWith(`${options.srcRoot}/${options.featuresSegment}/`)
				? normalized.slice(
						`${options.srcRoot}/${options.featuresSegment}/`.length,
					)
				: null
			: normalized.slice(index + marker.length);

	if (!tail) {
		return null;
	}

	const segment = tail.split('/')[0];
	return segment && segment.length > 0 ? segment : null;
}

/** Parses `@/features/<name>/<rest...>` from an import specifier. */
function parseSpecifier(source, options) {
	const prefix = `${options.aliasPrefix}/${options.featuresSegment}/`;
	if (!source.startsWith(prefix)) {
		return null;
	}

	const rest = source.slice(prefix.length).split('/');
	const feature = rest.shift();
	if (!feature) {
		return null;
	}

	return { feature, isContract: rest[0] === options.contractsSegment };
}

module.exports = {
	meta: {
		type: 'problem',
		docs: {
			description:
				'Disallow importing another feature internals. Cross-feature access is contracts-only.',
		},
		schema: [
			{
				type: 'object',
				properties: {
					aliasPrefix: { type: 'string' },
					contractsSegment: { type: 'string' },
					featuresSegment: { type: 'string' },
					srcRoot: { type: 'string' },
				},
				additionalProperties: false,
			},
		],
		messages: {
			crossFeature:
				'Feature "{{from}}" must not import internals of feature "{{to}}". Use `{{alias}}/{{features}}/{{to}}/{{contracts}}/*`.',
		},
	},
	create(context) {
		const options = { ...DEFAULTS, ...(context.options[0] ?? {}) };
		const filePath = context.filename ?? context.getFilename();
		const fromFeature = featureOfFile(filePath, options);

		if (!fromFeature) {
			return {};
		}

		function check(node, source) {
			if (typeof source !== 'string') {
				return;
			}

			const parsed = parseSpecifier(source, options);
			if (!parsed || parsed.isContract || parsed.feature === fromFeature) {
				return;
			}

			context.report({
				node,
				messageId: 'crossFeature',
				data: {
					alias: options.aliasPrefix,
					contracts: options.contractsSegment,
					features: options.featuresSegment,
					from: fromFeature,
					to: parsed.feature,
				},
			});
		}

		return {
			ImportDeclaration(node) {
				check(node, node.source.value);
			},
			ExportNamedDeclaration(node) {
				if (node.source) {
					check(node, node.source.value);
				}
			},
			ExportAllDeclaration(node) {
				check(node, node.source.value);
			},
			ImportExpression(node) {
				if (node.source?.type === 'Literal') {
					check(node, node.source.value);
				}
			},
		};
	},
};
