function getDeclaredNames(statement) {
	if (!statement) {
		return [];
	}

	let node = statement;
	if (node.type === 'ExportNamedDeclaration' && node.declaration) {
		node = node.declaration;
	}

	if (
		(node.type === 'FunctionDeclaration' || node.type === 'ClassDeclaration') &&
		node.id
	) {
		return [node.id.name];
	}

	if (node.type === 'VariableDeclaration') {
		return node.declarations
			.filter((declaration) => declaration.id.type === 'Identifier')
			.map((declaration) => declaration.id.name);
	}

	return [];
}

module.exports = {
	meta: {
		type: 'suggestion',
		docs: {
			description:
				'Require `export default Component;` to be placed immediately after the exported component declaration.',
		},
		schema: [],
		messages: {
			placement:
				'`export default {{name}};` should be placed immediately after the `{{name}}` declaration, before helpers, styles, or child components.',
		},
	},
	create(context) {
		return {
			Program(node) {
				const body = node.body;
				const declaredAt = new Map();

				body.forEach((statement, index) => {
					for (const name of getDeclaredNames(statement)) {
						if (!declaredAt.has(name)) {
							declaredAt.set(name, index);
						}
					}
				});

				body.forEach((statement, index) => {
					if (statement.type !== 'ExportDefaultDeclaration') {
						return;
					}

					const declaration = statement.declaration;
					if (!declaration || declaration.type !== 'Identifier') {
						return;
					}

					const name = declaration.name;
					if (!/^[A-Z]/.test(name) || !declaredAt.has(name)) {
						return;
					}

					const previous = body[index - 1];
					if (previous && getDeclaredNames(previous).includes(name)) {
						return;
					}

					context.report({
						node: statement,
						messageId: 'placement',
						data: { name },
					});
				});
			},
		};
	},
};
