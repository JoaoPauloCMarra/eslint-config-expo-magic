function hasInlineObjectType(param) {
	const annotation = param.typeAnnotation?.typeAnnotation;
	return annotation?.type === 'TSTypeLiteral';
}

function unwrapDefault(param) {
	return param?.type === 'AssignmentPattern' ? param.left : param;
}

function getComponentName(node) {
	if (node.type === 'FunctionDeclaration') {
		return node.id?.name ?? '';
	}

	let expression = node;
	while (
		expression.parent?.type === 'CallExpression' &&
		expression.parent.arguments.includes(expression)
	) {
		expression = expression.parent;
	}

	const declarator = expression.parent;
	if (
		declarator?.type === 'VariableDeclarator' &&
		declarator.init === expression &&
		declarator.id.type === 'Identifier'
	) {
		return declarator.id.name;
	}

	return '';
}

function isComponent(node) {
	return (
		node.parent?.type === 'ExportDefaultDeclaration' ||
		/^[A-Z]/u.test(getComponentName(node))
	);
}

module.exports = {
	meta: {
		type: 'suggestion',
		docs: {
			description:
				'Disallow inline object types for component props; declare a named `Props` type alias instead.',
		},
		schema: [],
		messages: {
			inline:
				'Declare a named `type ...Props` alias for component props instead of an inline object type.',
		},
	},
	create(context) {
		function check(node) {
			node.params.forEach((rawParam, index) => {
				const param = unwrapDefault(rawParam);
				if (!param || !hasInlineObjectType(param)) {
					return;
				}

				const isPropsIdentifier =
					param.type === 'Identifier' && param.name === 'props';
				const isDestructuredComponentProps =
					index === 0 && param.type === 'ObjectPattern' && isComponent(node);

				if (isPropsIdentifier || isDestructuredComponentProps) {
					context.report({ node: param, messageId: 'inline' });
				}
			});
		}

		return {
			FunctionDeclaration: check,
			FunctionExpression: check,
			ArrowFunctionExpression: check,
		};
	},
};
