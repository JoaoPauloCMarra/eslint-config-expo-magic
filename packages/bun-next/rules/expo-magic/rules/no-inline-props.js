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

function getTopLevelStatement(node) {
	let target = node;
	if (node.type !== 'FunctionDeclaration') {
		let expression = node;
		while (
			expression.parent?.type === 'CallExpression' &&
			expression.parent.arguments.includes(expression)
		) {
			expression = expression.parent;
		}

		const declarator = expression.parent;
		if (
			declarator?.type !== 'VariableDeclarator' ||
			declarator.init !== expression
		) {
			return null;
		}

		target = declarator.parent;
	}

	if (target.parent?.type === 'Program') {
		return target;
	}

	if (
		(target.parent?.type === 'ExportNamedDeclaration' ||
			target.parent?.type === 'ExportDefaultDeclaration') &&
		target.parent.parent?.type === 'Program'
	) {
		return target.parent;
	}

	return null;
}

function hasModuleBinding(sourceCode, name) {
	const globalScope = sourceCode.scopeManager.globalScope;
	return [globalScope, ...globalScope.childScopes].some(
		(scope) =>
			(scope === globalScope || scope.type === 'module') && scope.set.has(name),
	);
}

function referencesUnsafeNames(sourceCode, node, typeLiteral) {
	const blocked = new Set(
		(node.typeParameters?.params ?? []).map((param) => param.name.name),
	);
	return sourceCode
		.getTokens(typeLiteral)
		.some(
			(token) =>
				(token.type === 'Identifier' && blocked.has(token.value)) ||
				(token.type === 'Keyword' && token.value === 'typeof') ||
				(token.type === 'Identifier' && token.value === 'typeof'),
		);
}

function getInsertionStart(sourceCode, statement) {
	let start = statement.range[0];
	let startLine = statement.loc.start.line;
	const comments = sourceCode.getCommentsBefore(statement);
	for (let index = comments.length - 1; index >= 0; index -= 1) {
		const comment = comments[index];
		if (startLine - comment.loc.end.line > 1) {
			break;
		}

		start = comment.range[0];
		startLine = comment.loc.start.line;
	}

	return start;
}

module.exports = {
	meta: {
		type: 'suggestion',
		fixable: 'code',
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
		const sourceCode = context.sourceCode;

		function buildFix(node, param) {
			const typeLiteral = param.typeAnnotation.typeAnnotation;
			const name = getComponentName(node);
			const statement = getTopLevelStatement(node);
			const aliasName = name
				? `${name.charAt(0).toUpperCase()}${name.slice(1)}Props`
				: null;
			if (
				!aliasName ||
				!statement ||
				hasModuleBinding(sourceCode, aliasName) ||
				referencesUnsafeNames(sourceCode, node, typeLiteral)
			) {
				return null;
			}

			const insertAt = getInsertionStart(sourceCode, statement);
			const literalText = sourceCode.getText(typeLiteral);
			return (fixer) => [
				fixer.insertTextBeforeRange(
					[insertAt, insertAt],
					`type ${aliasName} = ${literalText};\n\n`,
				),
				fixer.replaceText(typeLiteral, aliasName),
			];
		}

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
					const fix = buildFix(node, param);
					context.report({
						node: param,
						messageId: 'inline',
						...(fix ? { fix } : {}),
					});
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
