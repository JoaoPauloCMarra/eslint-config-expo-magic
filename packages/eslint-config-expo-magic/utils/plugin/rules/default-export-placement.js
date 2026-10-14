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

function isMemberAssignment(statement, name) {
	const expression =
		statement?.type === 'ExpressionStatement' ? statement.expression : null;
	return (
		expression?.type === 'AssignmentExpression' &&
		expression.left.type === 'MemberExpression' &&
		expression.left.object.type === 'Identifier' &&
		expression.left.object.name === name
	);
}

module.exports = {
	meta: {
		type: 'suggestion',
		fixable: 'code',
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
		const sourceCode = context.sourceCode;

		function buildFix(body, index, name, declarationIndex) {
			const statement = body[index];
			const before = sourceCode.getTokenBefore(statement, {
				includeComments: true,
			});
			const after = sourceCode.getTokenAfter(statement, {
				includeComments: true,
			});
			if (
				before?.type === 'Line' ||
				before?.type === 'Block' ||
				(after &&
					(after.type === 'Line' || after.type === 'Block') &&
					after.loc.start.line === statement.loc.end.line)
			) {
				return null;
			}

			let targetIndex = declarationIndex;
			while (
				targetIndex + 1 < body.length &&
				isMemberAssignment(body[targetIndex + 1], name)
			) {
				targetIndex += 1;
			}

			const target = body[targetIndex];
			let insertAt = target.range[1];
			const trailing = sourceCode.getTokenAfter(target, {
				includeComments: true,
			});
			if (
				trailing &&
				(trailing.type === 'Line' || trailing.type === 'Block') &&
				trailing.loc.start.line === target.loc.end.line
			) {
				insertAt = trailing.range[1];
			}

			const removeRange = before
				? [before.range[1], statement.range[1]]
				: [statement.range[0], after ? after.range[0] : statement.range[1]];
			const text = sourceCode.getText(statement);
			return (fixer) => [
				fixer.replaceTextRange(removeRange, ''),
				fixer.insertTextAfterRange([insertAt, insertAt], `\n${text}`),
			];
		}

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

					let previousIndex = index - 1;
					while (
						previousIndex >= 0 &&
						isMemberAssignment(body[previousIndex], name)
					) {
						previousIndex -= 1;
					}

					const previous = body[previousIndex];
					if (previous && getDeclaredNames(previous).includes(name)) {
						return;
					}

					const fix = buildFix(body, index, name, declaredAt.get(name));
					context.report({
						node: statement,
						messageId: 'placement',
						data: { name },
						...(fix ? { fix } : {}),
					});
				});
			},
		};
	},
};
