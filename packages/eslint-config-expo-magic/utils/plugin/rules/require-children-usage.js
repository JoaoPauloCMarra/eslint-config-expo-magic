function getReferenceName(typeName) {
	if (!typeName) {
		return '';
	}

	if (typeName.type === 'Identifier') {
		return typeName.name;
	}

	if (typeName.type === 'TSQualifiedName') {
		return typeName.right.name;
	}

	return '';
}

function isDeclarationKey(node) {
	const parent = node.parent;
	return (
		parent?.type === 'TSPropertySignature' &&
		parent.key === node &&
		!parent.computed
	);
}

module.exports = {
	meta: {
		type: 'suggestion',
		docs: {
			description:
				'Disallow declaring a `children` prop that the component never renders.',
		},
		schema: [],
		messages: {
			unused:
				'`children` is declared but never rendered. Reserve children for components that render arbitrary caller content.',
		},
	},
	create(context) {
		let declarationNode = null;
		let usesChildren = false;

		function markDeclaration(node) {
			if (!declarationNode) {
				declarationNode = node;
			}
		}

		return {
			TSPropertySignature(node) {
				if (
					node.key?.type === 'Identifier' &&
					node.key.name === 'children' &&
					!node.computed
				) {
					markDeclaration(node);
				}
			},
			TSTypeReference(node) {
				if (getReferenceName(node.typeName) === 'PropsWithChildren') {
					markDeclaration(node);
				}
			},
			Identifier(node) {
				if (node.name === 'children' && !isDeclarationKey(node)) {
					usesChildren = true;
				}
			},
			JSXSpreadAttribute() {
				usesChildren = true;
			},
			SpreadElement(node) {
				if (
					node.argument?.type === 'Identifier' &&
					node.argument.name === 'props'
				) {
					usesChildren = true;
				}
			},
			'Program:exit'() {
				if (declarationNode && !usesChildren) {
					context.report({ node: declarationNode, messageId: 'unused' });
				}
			},
		};
	},
};
