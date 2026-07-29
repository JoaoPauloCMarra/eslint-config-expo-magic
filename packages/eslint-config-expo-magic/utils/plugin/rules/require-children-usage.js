const CHILDREN_PROP = 'children';

function getReferenceName(typeName) {
	if (typeName?.type === 'Identifier') {
		return typeName.name;
	}

	if (typeName?.type === 'TSQualifiedName') {
		return typeName.right.name;
	}

	return '';
}

function getPropertyName(property) {
	if (!property || property.computed) {
		return '';
	}

	const propertyKey = property.key;
	if (propertyKey?.type === 'Identifier' || propertyKey?.type === 'Literal') {
		return String(propertyKey.name ?? propertyKey.value);
	}

	return '';
}

function hasChildrenDeclaration(node) {
	return node.type === 'TSPropertySignature' && getPropertyName(node) === CHILDREN_PROP;
}

function isPropsAliasDefinition(definition, propsName) {
	if (definition.type !== 'Variable') {
		return false;
	}

	const init = definition.node?.init;
	return init?.type === 'Identifier' && init.name === propsName;
}

function getPatternIdentifier(pattern) {
	let current = pattern;

	while (
		current?.type === 'AssignmentPattern' ||
		current?.type === 'RestElement' ||
		current?.type === 'TSParameterProperty'
	) {
		current = current.left ?? current.argument ?? current.parameter;
	}

	if (current?.type === 'Identifier') {
		return current;
	}

	return null;
}

function getObjectPatternProperty(pattern, name) {
	if (pattern?.type !== 'ObjectPattern') {
		return null;
	}

	return (
		pattern.properties.find(
			(property) => property.type === 'Property' && getPropertyName(property) === name,
		) ?? null
	);
}

function getPropertyBinding(property) {
	if (!property || property.type !== 'Property') {
		return null;
	}

	return getPatternIdentifier(property.value);
}

function typeDeclaresChildren(typeNode, typeDeclarations, seen = new Set()) {
	if (!typeNode) {
		return false;
	}

	if (typeNode.type === 'TSTypeAnnotation') {
		return typeDeclaresChildren(
			typeNode.typeAnnotation,
			typeDeclarations,
			seen,
		);
	}

	if (typeNode.type === 'TSTypeLiteral') {
		return typeNode.members.some((member) => hasChildrenDeclaration(member));
	}

	if (typeNode.type === 'TSInterfaceBody') {
		return typeNode.body.some((member) => hasChildrenDeclaration(member));
	}

	if (
		typeNode.type === 'TSIntersectionType' ||
		typeNode.type === 'TSUnionType'
	) {
		return typeNode.types.some((member) =>
			typeDeclaresChildren(member, typeDeclarations, seen),
		);
	}

	if (typeNode.type === 'TSParenthesizedType') {
		return typeDeclaresChildren(
			typeNode.typeAnnotation,
			typeDeclarations,
			seen,
		);
	}

	if (
		typeNode.type === 'TSTypeReference' ||
		typeNode.type === 'TSExpressionWithTypeArguments'
	) {
		const referenceName = getReferenceName(
			typeNode.typeName ?? typeNode.expression,
		);
		if (referenceName === 'PropsWithChildren') {
			return true;
		}

		if (!referenceName || seen.has(referenceName)) {
			return false;
		}

		const declaration = typeDeclarations.get(referenceName);
		if (!declaration) {
			return false;
		}

		const nextSeen = new Set(seen);
		nextSeen.add(referenceName);
		return typeDeclaresChildren(declaration, typeDeclarations, nextSeen);
	}

	return false;
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

function unwrapParameter(parameter) {
	while (
		parameter?.type === 'AssignmentPattern' ||
		parameter?.type === 'TSParameterProperty'
	) {
		parameter = parameter.left ?? parameter.parameter;
	}

	return parameter;
}

function findVariable(scope, name) {
	let currentScope = scope;
	while (currentScope) {
		const variable = currentScope.set.get(name);
		if (variable) {
			return variable;
		}
		currentScope = currentScope.upper;
	}

	return null;
}

function variableHasRead(variable) {
	return variable?.references.some((reference) => reference.isRead()) ?? false;
}

function collectChildrenAliasBindings(scope, propsName, aliases) {
	for (const variable of scope.variables) {
		if (variable.name === propsName) {
			continue;
		}

		if (variable.defs.some((definition) => isPropsAliasDefinition(definition, propsName))) {
			aliases.add(variable.name);
		}
	}

	for (const childScope of scope.childScopes) {
		if (childScope.type === 'function') {
			continue;
		}
		collectChildrenAliasBindings(childScope, propsName, aliases);
	}
}

function collectChildrenReferences(scope, aliases, references) {
	for (const variable of scope.variables) {
		if (aliases.has(variable.name)) {
			for (const reference of variable.references) {
				references.add(reference);
			}
		}
	}

	for (const childScope of scope.childScopes) {
		if (childScope.type === 'function') {
			continue;
		}
		collectChildrenReferences(childScope, aliases, references);
	}
}

function patternReadsChildren(pattern, scope) {
	const childrenProperty = getObjectPatternProperty(pattern, CHILDREN_PROP);
	const binding = getPropertyBinding(childrenProperty);
	if (!binding) {
		return false;
	}

	return variableHasRead(findVariable(scope, binding.name));
}

function isChildrenMemberAccess(identifier, parent) {
	return (
		parent?.type === 'MemberExpression' &&
		parent.object === identifier &&
		((parent.property.type === 'Identifier' &&
			!parent.computed &&
			parent.property.name === CHILDREN_PROP) ||
			(parent.property.type === 'Literal' &&
				parent.computed &&
				parent.property.value === CHILDREN_PROP))
	);
}

function referenceUsesChildren(reference, scope) {
	const identifier = reference.identifier;
	const parent = identifier.parent;

	if (isChildrenMemberAccess(identifier, parent)) {
		return true;
	}

	if (
		(parent?.type === 'JSXSpreadAttribute' ||
			parent?.type === 'SpreadElement') &&
		parent.argument === identifier
	) {
		return true;
	}

	if (
		parent?.type === 'VariableDeclarator' &&
		parent.init === identifier &&
		patternReadsChildren(parent.id, scope)
	) {
		return true;
	}

	if (
		parent?.type === 'AssignmentExpression' &&
		parent.right === identifier &&
		patternReadsChildren(parent.left, scope)
	) {
		return true;
	}

	return false;
}

function componentUsesChildren(node, parameter, sourceCode) {
	const scope = sourceCode.scopeManager.acquire(node, true);
	if (!scope) {
		return false;
	}

	const childrenProperty = getObjectPatternProperty(parameter, CHILDREN_PROP);
	const childrenBinding = getPropertyBinding(childrenProperty);
	if (childrenBinding) {
		return variableHasRead(findVariable(scope, childrenBinding.name));
	}

	const propsBinding = getPatternIdentifier(parameter);
	if (!propsBinding) {
		return false;
	}

	const propsVariable = findVariable(scope, propsBinding.name);
	if (!propsVariable) {
		return false;
	}

	const aliases = new Set([propsBinding.name]);
	collectChildrenAliasBindings(scope, propsBinding.name, aliases);
	const references = new Set();
	collectChildrenReferences(scope, aliases, references);

	return Array.from(references).some((reference) =>
		referenceUsesChildren(reference, scope),
	);
}

function parameterDeclaresChildren(parameter, typeDeclarations) {
	return (
		Boolean(getObjectPatternProperty(parameter, CHILDREN_PROP)) ||
		typeDeclaresChildren(parameter?.typeAnnotation, typeDeclarations)
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
		const sourceCode = context.sourceCode;
		const typeDeclarations = new Map();
		const components = [];

		function recordComponent(node) {
			if (/^[A-Z]/u.test(getComponentName(node))) {
				components.push(node);
			}
		}

		return {
			TSTypeAliasDeclaration(node) {
				typeDeclarations.set(node.id.name, node.typeAnnotation);
			},
			TSInterfaceDeclaration(node) {
				const inheritedTypes = node.extends ?? [];
				typeDeclarations.set(node.id.name, {
					type: 'TSIntersectionType',
					types: [node.body, ...inheritedTypes],
				});
			},
			FunctionDeclaration: recordComponent,
			FunctionExpression: recordComponent,
			ArrowFunctionExpression: recordComponent,
			'Program:exit'() {
				for (const component of components) {
					const parameter = unwrapParameter(component.params[0]);
					if (
						!parameter ||
						!parameterDeclaresChildren(parameter, typeDeclarations) ||
						componentUsesChildren(component, parameter, sourceCode)
					) {
						continue;
					}

					context.report({ node: parameter, messageId: 'unused' });
				}
			},
		};
	},
};
