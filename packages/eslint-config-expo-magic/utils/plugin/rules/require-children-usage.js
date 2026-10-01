const CHILDREN_PROP = 'children';

function referenceParts(node) {
	if (node?.type === 'Identifier') return [node.name];
	if (node?.type === 'TSQualifiedName') {
		return [...referenceParts(node.left), node.right.name];
	}
	if (node?.type === 'MemberExpression' && !node.computed) {
		return [...referenceParts(node.object), node.property.name];
	}
	return [];
}

function isAmbientNamespace(node) {
	for (let current = node; current; current = current.parent) {
		if (current.type === 'TSModuleDeclaration' && current.declare) return true;
	}
	return false;
}

function isExportedDeclaration(node) {
	return node.parent?.type === 'ExportNamedDeclaration';
}

function createTypeLookup(sourceCode) {
	// Keep namespace declarations in their lexical scope. The parser does not
	// create a Variable for the root of `namespace UI.Layout { ... }`.
	const namespacesByScope = new Map();
	const namespaceIdentity = new Map();
	const mergedNamespaces = new Map();
	function recordNamespace(node) {
		const parts = referenceParts(node.id);
		const scope = sourceCode.scopeManager.acquire(node);
		if (!parts.length || !scope) return;
		let names = namespacesByScope.get(scope.upper);
		if (!names) namespacesByScope.set(scope.upper, (names = new Map()));
		const declarations = names.get(parts[0]) ?? [];
		declarations.push({ node, scope, remaining: parts.slice(1) });
		names.set(parts[0], declarations);
		const parent = namespaceIdentity.get(scope.upper);
		const joinsParent =
			parent && (isExportedDeclaration(node) || isAmbientNamespace(node));
		const root = joinsParent ? parent.root : scope.upper;
		const path = joinsParent ? [...parent.path, ...parts] : parts;
		namespaceIdentity.set(scope, { root, path, ownParts: parts.length });
		let groups = mergedNamespaces.get(root);
		if (!groups) mergedNamespaces.set(root, (groups = new Map()));
		const key = JSON.stringify(path);
		const scopes = groups.get(key) ?? [];
		scopes.push(scope);
		groups.set(key, scopes);
	}

	function inScope(scope, name, publicOnly = false, ambient = false) {
		const candidate = scope.set.get(name);
		const variable =
			candidate?.isTypeVariable &&
			(!publicOnly ||
				ambient ||
				candidate.defs.some((def) => isExportedDeclaration(def.node)))
				? candidate
				: null;
		const namespaces = (namespacesByScope.get(scope)?.get(name) ?? []).filter(
			(entry) => !publicOnly || ambient || isExportedDeclaration(entry.node),
		);
		return variable || namespaces.length ? { variable, namespaces } : null;
	}

	function findName(scope, name) {
		for (let current = scope; current; current = current.upper) {
			const target = inScope(current, name);
			const identity = namespaceIdentity.get(current);
			if (
				target &&
				(!identity ||
					!inScope(current, name, true, isAmbientNamespace(current.block)))
			)
				return [target];
			if (!identity) continue;
			// Other declarations share exported members, but never their private
			// bindings. Dotted declarations also have implicit namespace parents.
			for (let depth = 0; depth < identity.ownParts; depth++) {
				const path = identity.path.slice(0, identity.path.length - depth);
				const siblings =
					mergedNamespaces.get(identity.root)?.get(JSON.stringify(path)) ?? [];
				const found = siblings
					.filter((sibling) => sibling !== current)
					.map((sibling) =>
						inScope(sibling, name, true, isAmbientNamespace(sibling.block)),
					)
					.filter(Boolean);
				if (depth === 0 && target) found.unshift(target);
				// A dotted declaration creates namespace parents without parser
				// scopes. Recover their child edges from the qualified identity.
				for (const [key, scopes] of mergedNamespaces.get(identity.root) ?? []) {
					const childPath = JSON.parse(key);
					if (
						childPath.length <= path.length ||
						childPath[path.length] !== name ||
						!path.every((part, index) => childPath[index] === part)
					)
						continue;
					found.push({
						variable: null,
						namespaces: scopes.map((scope) => ({
							node: scope.block,
							scope,
							remaining: childPath.slice(path.length + 1),
						})),
					});
				}
				if (found.length) return found;
			}
		}
		return [];
	}

	function followAlias(target, seen) {
		if (!target) return [];
		const alias = target.variable?.defs.find(
			(def) =>
				def.node.type === 'TSImportEqualsDeclaration' &&
				def.node.moduleReference.type !== 'TSExternalModuleReference',
		);
		if (!alias) return [target];
		if (seen.has(target.variable)) return [];
		return resolve(
			alias.node.moduleReference,
			new Set([...seen, target.variable]),
		);
	}

	function member(target, name) {
		return target.namespaces.flatMap((entry) => {
			if (entry.remaining.length) {
				return entry.remaining[0] === name
					? [
							{
								variable: null,
								namespaces: [{ ...entry, remaining: entry.remaining.slice(1) }],
							},
						]
					: [];
			}
			const found = inScope(
				entry.scope,
				name,
				true,
				isAmbientNamespace(entry.node),
			);
			return found ? [found] : [];
		});
	}

	function resolve(node, seen = new Set()) {
		const parts = referenceParts(node);
		if (!parts.length) return [];
		let targets = findName(sourceCode.getScope(node), parts[0]).flatMap(
			(target) => followAlias(target, seen),
		);
		for (const name of parts.slice(1)) {
			targets = targets
				.flatMap((target) => member(target, name))
				.flatMap((target) => followAlias(target, seen));
		}
		return targets;
	}

	function isReactChildrenHelper(node) {
		const parts = referenceParts(node);
		const targets = findName(sourceCode.getScope(node), parts[0]);
		// Preserve the existing implicit React helper forms, but let real local
		// declarations and imports shadow them instead of matching only a suffix.
		if (!targets.length) {
			return (
				parts.join('.') === 'PropsWithChildren' ||
				parts.join('.') === 'React.PropsWithChildren'
			);
		}
		return targets.some((target) =>
			target.variable?.defs.some((def) => {
				if (def.node.type === 'TSImportEqualsDeclaration') {
					return (
						parts.length === 2 &&
						parts[1] === 'PropsWithChildren' &&
						def.node.moduleReference.type === 'TSExternalModuleReference' &&
						def.node.moduleReference.expression.value === 'react'
					);
				}
				if (def.parent?.source?.value !== 'react') return false;
				if (parts.length === 1) {
					return (
						def.node.type === 'ImportSpecifier' &&
						(def.node.imported.name ?? def.node.imported.value) ===
							'PropsWithChildren'
					);
				}
				return (
					parts.length === 2 &&
					parts[1] === 'PropsWithChildren' &&
					(def.node.type === 'ImportNamespaceSpecifier' ||
						def.node.type === 'ImportDefaultSpecifier')
				);
			}),
		);
	}
	return { recordNamespace, resolve, isReactChildrenHelper };
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
	return (
		node.type === 'TSPropertySignature' &&
		getPropertyName(node) === CHILDREN_PROP
	);
}

function isPropsAliasDefinition(definition, propsVariable, scope, variable) {
	if (definition.type !== 'Variable') return false;
	const { id, init } = definition.node;
	if (
		init?.type !== 'Identifier' ||
		findVariable(scope, init.name) !== propsVariable
	)
		return false;
	if (id.type === 'Identifier') return true;
	// A rest copy retains children only when the pattern did not remove them.
	// Destructured properties themselves are never identity aliases of props.
	return (
		id.type === 'ObjectPattern' &&
		getRestBinding(id)?.name === variable.name &&
		!id.properties.some(
			(property) =>
				property.type === 'Property' &&
				(property.computed
					? property.key.type === 'Literal' &&
						String(property.key.value) === CHILDREN_PROP
					: getPropertyName(property) === CHILDREN_PROP),
		)
	);
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
			(property) =>
				property.type === 'Property' && getPropertyName(property) === name,
		) ?? null
	);
}

function getRestBinding(pattern) {
	if (pattern?.type !== 'ObjectPattern') {
		return null;
	}

	const rest = pattern.properties.find(
		(property) => property.type === 'RestElement',
	);
	return rest ? getPatternIdentifier(rest.argument) : null;
}

function getPropertyBinding(property) {
	if (!property || property.type !== 'Property') {
		return null;
	}

	return getPatternIdentifier(property.value);
}

function typeDeclaresChildren(
	typeNode,
	typeDeclarations,
	typeLookup,
	seen = new Set(),
) {
	if (!typeNode) {
		return false;
	}

	if (typeNode.type === 'TSTypeAnnotation') {
		return typeDeclaresChildren(
			typeNode.typeAnnotation,
			typeDeclarations,
			typeLookup,
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
			typeDeclaresChildren(member, typeDeclarations, typeLookup, seen),
		);
	}

	if (typeNode.type === 'TSParenthesizedType') {
		return typeDeclaresChildren(
			typeNode.typeAnnotation,
			typeDeclarations,
			typeLookup,
			seen,
		);
	}

	if (
		typeNode.type === 'TSTypeReference' ||
		typeNode.type === 'TSExpressionWithTypeArguments' ||
		typeNode.type === 'TSInterfaceHeritage'
	) {
		const reference = typeNode.typeName ?? typeNode.expression;
		if (typeLookup.isReactChildrenHelper(reference)) return true;
		return typeLookup.resolve(reference).some(({ variable }) => {
			if (!variable || seen.has(variable)) return false;
			const declaration = typeDeclarations.get(variable);
			if (!declaration) return false;
			return typeDeclaresChildren(
				declaration,
				typeDeclarations,
				typeLookup,
				new Set([...seen, variable]),
			);
		});
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

function findVariable(scope, name, typeOnly = false) {
	let currentScope = scope;
	while (currentScope) {
		const variable = currentScope.set.get(name);
		if (variable && (!typeOnly || variable.isTypeVariable)) {
			return variable;
		}
		currentScope = currentScope.upper;
	}

	return null;
}

function variableHasRead(variable) {
	return variable?.references.some((reference) => reference.isRead()) ?? false;
}

function isWriteTarget(node) {
	let current = node;
	while (current.parent) {
		const parent = current.parent;
		if (
			(parent.type === 'AssignmentExpression' && parent.left === current) ||
			(parent.type === 'UpdateExpression' && parent.argument === current) ||
			(parent.type === 'UnaryExpression' && parent.operator === 'delete') ||
			(['ForInStatement', 'ForOfStatement'].includes(parent.type) &&
				parent.left === current)
		)
			return true;
		if (
			(parent.type === 'Property' &&
				parent.value === current &&
				parent.parent.type === 'ObjectPattern') ||
			[
				'ObjectPattern',
				'ArrayPattern',
				'RestElement',
				'TSAsExpression',
				'TSNonNullExpression',
				'TSTypeAssertion',
				'TSSatisfiesExpression',
			].includes(parent.type) ||
			(parent.type === 'AssignmentPattern' && parent.left === current)
		) {
			current = parent;
			continue;
		}
		return false;
	}
	return false;
}

function collectChildrenAliasBindings(scope, propsVariable, aliases) {
	const edges = new Map();
	function collect(current) {
		for (const variable of current.variables) {
			for (const definition of variable.defs) {
				if (
					isPropsAliasDefinition(definition, propsVariable, current, variable)
				)
					aliases.add(variable);
				if (
					definition.type !== 'Variable' ||
					definition.node.id.type !== 'Identifier' ||
					definition.node.init?.type !== 'Identifier'
				)
					continue;
				const source = findVariable(current, definition.node.init.name);
				const next = edges.get(source) ?? [];
				next.push({ variable, constant: definition.parent.kind === 'const' });
				edges.set(source, next);
			}
		}
		for (const child of current.childScopes)
			if (child.type !== 'function') collect(child);
	}
	collect(scope);

	function reachable(constantsOnly) {
		const found = new Set([propsVariable]);
		for (const source of found) {
			for (const edge of edges.get(source) ?? []) {
				if (!constantsOnly || edge.constant) found.add(edge.variable);
			}
		}
		return found;
	}
	// Inspect all local identity aliases, including mutable siblings and captured
	// references, before recognizing additional const chains. This is deliberately
	// conservative; it does not attempt to order writes or analyze function calls.
	const group = reachable(false);
	for (const variable of group) {
		if (
			variable.references.some(
				(reference) => !isSafeAliasReference(reference, group),
			)
		)
			return;
	}
	for (const variable of reachable(true)) aliases.add(variable);
}

function outerTypeExpression(node) {
	while (
		[
			'TSAsExpression',
			'TSNonNullExpression',
			'TSTypeAssertion',
			'TSSatisfiesExpression',
			'ChainExpression',
		].includes(node.parent?.type)
	)
		node = node.parent;
	return node;
}

function isSafeAliasReference(reference, group) {
	if (reference.isWrite()) return Boolean(reference.init);
	const expression = outerTypeExpression(reference.identifier);
	const parent = expression.parent;
	if (parent?.type === 'MemberExpression' && parent.object === expression) {
		const member = outerTypeExpression(parent);
		return (
			!isWriteTarget(parent) &&
			!(
				member.parent?.type === 'CallExpression' &&
				member.parent.callee === member
			) &&
			!(
				member.parent?.type === 'NewExpression' &&
				member.parent.callee === member
			) &&
			!(
				member.parent?.type === 'TaggedTemplateExpression' &&
				member.parent.tag === member
			)
		);
	}
	if (parent?.type === 'VariableDeclarator' && parent.init === expression) {
		return (
			parent.id.type === 'ObjectPattern' ||
			(parent.id.type === 'Identifier' &&
				group.has(findVariable(reference.from, parent.id.name)))
		);
	}
	if (parent?.type === 'AssignmentExpression' && parent.right === expression)
		return parent.left.type === 'ObjectPattern';
	if (parent?.type === 'JSXSpreadAttribute' && parent.argument === expression)
		return true;
	if (parent?.type === 'SpreadElement' && parent.argument === expression)
		return parent.parent?.type === 'ObjectExpression';
	// Unknown escapes (calls, constructors, assignments, returned objects, etc.)
	// cannot establish that a later alias still carries the original children.
	return isCloneElementCall(expression, parent);
}

function collectChildrenReferences(scope, aliases, references) {
	for (const variable of scope.variables) {
		if (aliases.has(variable)) {
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

function isCloneElementCall(identifier, parent) {
	if (
		parent?.type !== 'CallExpression' ||
		!parent.arguments.includes(identifier)
	) {
		return false;
	}

	const callee = parent.callee;
	const calleeName =
		callee.type === 'Identifier'
			? callee.name
			: callee.type === 'MemberExpression' && !callee.computed
				? callee.property.name
				: '';
	return calleeName === 'cloneElement';
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
		return !isWriteTarget(parent);
	}

	if (
		(parent?.type === 'JSXSpreadAttribute' ||
			parent?.type === 'SpreadElement') &&
		parent.argument === identifier
	) {
		return true;
	}

	if (isCloneElementCall(identifier, parent)) {
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

	const propsBinding =
		getPatternIdentifier(parameter) ?? getRestBinding(parameter);
	if (!propsBinding) {
		return false;
	}

	const propsVariable = findVariable(scope, propsBinding.name);
	if (!propsVariable) {
		return false;
	}

	const aliases = new Set([propsVariable]);
	collectChildrenAliasBindings(scope, propsVariable, aliases);
	const references = new Set();
	collectChildrenReferences(scope, aliases, references);

	return Array.from(references).some((reference) =>
		referenceUsesChildren(reference, reference.from),
	);
}

function parameterDeclaresChildren(parameter, typeDeclarations, typeLookup) {
	return (
		Boolean(getObjectPatternProperty(parameter, CHILDREN_PROP)) ||
		typeDeclaresChildren(
			parameter?.typeAnnotation,
			typeDeclarations,
			typeLookup,
		)
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
		const typeLookup = createTypeLookup(sourceCode);
		const components = [];

		function recordComponent(node) {
			if (
				node.parent?.type === 'ExportDefaultDeclaration' ||
				/^[A-Z]/u.test(getComponentName(node))
			) {
				components.push(node);
			}
		}

		return {
			TSModuleDeclaration: typeLookup.recordNamespace,
			TSTypeAliasDeclaration(node) {
				typeDeclarations.set(
					sourceCode.getDeclaredVariables(node)[0],
					node.typeAnnotation,
				);
			},
			TSInterfaceDeclaration(node) {
				const inheritedTypes = node.extends ?? [];
				typeDeclarations.set(sourceCode.getDeclaredVariables(node)[0], {
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
						!parameterDeclaresChildren(
							parameter,
							typeDeclarations,
							typeLookup,
						) ||
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
