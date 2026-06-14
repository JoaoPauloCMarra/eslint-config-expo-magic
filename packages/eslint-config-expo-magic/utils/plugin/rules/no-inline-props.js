function hasInlineObjectType(param) {
	const annotation = param.typeAnnotation?.typeAnnotation;
	return annotation?.type === 'TSTypeLiteral';
}

module.exports = {
	meta: {
		type: 'suggestion',
		docs: {
			description:
				'Disallow inline object types for a `props` parameter; declare a named `Props` type alias instead.',
		},
		schema: [],
		messages: {
			inline:
				'Declare a named `type ...Props` alias for component props instead of an inline object type.',
		},
	},
	create(context) {
		function check(node) {
			for (const param of node.params) {
				if (
					param.type === 'Identifier' &&
					param.name === 'props' &&
					hasInlineObjectType(param)
				) {
					context.report({ node: param, messageId: 'inline' });
				}
			}
		}

		return {
			FunctionDeclaration: check,
			FunctionExpression: check,
			ArrowFunctionExpression: check,
		};
	},
};
