// Local dependency-free port of rules from eslint-plugin-react-19-upgrade@1.11.0
// (no-default-props, no-prop-types, no-legacy-context, no-string-refs, no-factories).
// Source: https://www.npmjs.com/package/eslint-plugin-react-19-upgrade
// MIT License, Copyright (c) 2024 Brett Farrow
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

'use strict';

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

function getComponentNode(
	context,
	assignmentNode,
	identifierName,
	seen = new Set(),
) {
	if (seen.has(identifierName)) {
		return null;
	}

	seen.add(identifierName);

	const scope = context.sourceCode.getScope(assignmentNode);
	const variable = findVariable(scope, identifierName);

	if (!variable || variable.defs.length === 0) {
		return null;
	}

	const definition = variable.defs[0];
	const definitionNode = definition.node;

	if (!definitionNode) {
		return null;
	}

	if (definitionNode.type === 'VariableDeclarator') {
		if (!definitionNode.init) {
			return null;
		}

		if (definitionNode.init.type === 'Identifier') {
			return getComponentNode(
				context,
				assignmentNode,
				definitionNode.init.name,
				seen,
			);
		}

		return definitionNode.init;
	}

	return definitionNode;
}

function isFunctionComponentNode(node) {
	return (
		node &&
		(node.type === 'FunctionDeclaration' ||
			node.type === 'FunctionExpression' ||
			node.type === 'ArrowFunctionExpression')
	);
}

function isClassComponentNode(node) {
	return (
		node &&
		(node.type === 'ClassDeclaration' || node.type === 'ClassExpression')
	);
}

function isSafeProperty(node) {
	return node.type === 'Property' && !node.computed && node.kind === 'init';
}

function getPropertyKeyName(node) {
	if (!isSafeProperty(node)) {
		return null;
	}

	if (node.key.type === 'Identifier') {
		return node.key.name;
	}

	if (node.key.type === 'Literal') {
		return String(node.key.value);
	}

	return null;
}

function getDefaultPropsMap(node, sourceCode) {
	const defaultProps = {};

	for (const property of node.right.properties) {
		const keyName = getPropertyKeyName(property);

		if (!keyName) {
			return null;
		}

		defaultProps[keyName] = sourceCode.getText(property.value);
	}

	return defaultProps;
}

function buildPropertyText(property, defaultValue, sourceCode) {
	if (!isSafeProperty(property)) {
		return null;
	}

	const keyText = sourceCode.getText(property.key);
	const value = property.value;

	if (value.type === 'AssignmentPattern') {
		return sourceCode.getText(property);
	}

	if (property.shorthand && value.type === 'Identifier') {
		return `${keyText} = ${defaultValue}`;
	}

	if (value.type === 'Identifier') {
		return `${keyText}: ${sourceCode.getText(value)} = ${defaultValue}`;
	}

	return null;
}

function isValidIdentifierName(name) {
	return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name);
}

function buildObjectPatternText(pattern, defaultProps, sourceCode) {
	const existingKeys = new Set();
	const propertyTexts = [];
	let restIndex = null;

	for (const property of pattern.properties) {
		if (property.type === 'RestElement') {
			restIndex = propertyTexts.length;
			propertyTexts.push(sourceCode.getText(property));
			continue;
		}

		const keyName = getPropertyKeyName(property);

		if (!keyName) {
			return null;
		}

		existingKeys.add(keyName);

		if (Object.hasOwn(defaultProps, keyName)) {
			const propertyText = buildPropertyText(
				property,
				defaultProps[keyName],
				sourceCode,
			);

			if (!propertyText) {
				return null;
			}

			propertyTexts.push(propertyText);
			continue;
		}

		propertyTexts.push(sourceCode.getText(property));
	}

	const missingProps = Object.entries(defaultProps)
		.filter(([key]) => !existingKeys.has(key))
		.map(([key, value]) => {
			if (!isValidIdentifierName(key)) {
				return null;
			}

			return `${key} = ${value}`;
		});

	if (missingProps.some((property) => property === null)) {
		return null;
	}

	if (missingProps.length > 0) {
		const insertIndex = restIndex ?? propertyTexts.length;
		propertyTexts.splice(insertIndex, 0, ...missingProps);
	}

	return `{ ${propertyTexts.join(', ')} }`;
}

const noDefaultProps = {
	meta: {
		type: 'problem',
		docs: {
			description:
				'Move defaultProps to default function parameters in destructured props',
			url: 'https://react.dev/blog/2024/04/25/react-19-upgrade-guide#removed-proptypes-and-defaultprops',
		},
		messages: {
			defaultPropsDisallowed:
				"'defaultProps' should not be used in '{{name}}' as they are no longer supported in React 19. Use default parameters instead.",
		},
		fixable: 'code',
		schema: [],
		ruleId: 'no-default-props',
		hasSuggestions: true,
	},
	create(context) {
		return {
			AssignmentExpression(node) {
				if (
					node.left.type !== 'MemberExpression' ||
					node.left.property.name !== 'defaultProps' ||
					node.left.object.type !== 'Identifier' ||
					node.right.type !== 'ObjectExpression'
				) {
					return;
				}

				const sourceCode = context.sourceCode;
				const defaultProps = getDefaultPropsMap(node, sourceCode);
				const componentNode = getComponentNode(
					context,
					node,
					node.left.object.name,
				);

				if (isClassComponentNode(componentNode)) {
					return;
				}

				context.report({
					node,
					messageId: 'defaultPropsDisallowed',
					data: { name: node.left.object.name },
					fix(fixer) {
						if (!defaultProps || !isFunctionComponentNode(componentNode)) {
							return null;
						}

						if (
							componentNode.params.length !== 1 ||
							!componentNode.params[0] ||
							componentNode.params[0].type !== 'ObjectPattern'
						) {
							return null;
						}

						const paramsText = buildObjectPatternText(
							componentNode.params[0],
							defaultProps,
							sourceCode,
						);

						if (!paramsText) {
							return null;
						}

						const targetNode =
							node.parent && node.parent.type === 'ExpressionStatement'
								? node.parent
								: node;

						return [
							fixer.replaceText(componentNode.params[0], paramsText),
							fixer.remove(targetNode),
						];
					},
				});
			},
		};
	},
};

function getFilenameBase(context) {
	return context.filename.split('/').pop().split('\\').pop().split('.')[0];
}

function getEnclosingClassName(node) {
	let current = node.parent;

	while (current) {
		if (
			current.type === 'ClassDeclaration' ||
			current.type === 'ClassExpression'
		) {
			if (current.id && current.id.type === 'Identifier') {
				return current.id.name;
			}

			if (
				current.parent &&
				current.parent.type === 'VariableDeclarator' &&
				current.parent.id.type === 'Identifier'
			) {
				return current.parent.id.name;
			}

			return '<anonymous>';
		}

		current = current.parent;
	}

	return '<anonymous>';
}

function isPropTypesKey(key) {
	if (!key) return false;
	if (key.type === 'Identifier') return key.name === 'propTypes';
	if (key.type === 'Literal') return key.value === 'propTypes';
	return false;
}

const noPropTypes = {
	meta: {
		type: 'suggestion',
		docs: {
			description: 'Disallow the use of propTypes in React components',
			url: 'https://react.dev/blog/2024/04/25/react-19-upgrade-guide#removed-proptypes-and-defaultprops',
		},
		messages: {
			propTypesDisallowed:
				"'propTypes' should not be used in '{{name}}' as they are no longer supported in React 19.",
			propTypesImportDisallowed:
				"'prop-types' should not be imported in '{{name}}' as they are no longer supported in React 19.",
		},
		schema: [],
		ruleId: 'no-prop-types',
		hasSuggestions: true,
	},
	create(context) {
		return {
			ImportDeclaration(node) {
				if (node.source.value === 'prop-types') {
					const name = getFilenameBase(context);
					node.specifiers.forEach((specifier) => {
						context.report({
							node: specifier,
							messageId: 'propTypesImportDisallowed',
							data: { name },
						});
					});
				}
			},
			CallExpression(node) {
				if (
					node.callee.type === 'Identifier' &&
					node.callee.name === 'require' &&
					node.arguments.length === 1 &&
					node.arguments[0].type === 'Literal' &&
					node.arguments[0].value === 'prop-types'
				) {
					context.report({
						node,
						messageId: 'propTypesImportDisallowed',
						data: { name: getFilenameBase(context) },
					});
				}
			},
			AssignmentExpression(node) {
				if (
					node.left.type === 'MemberExpression' &&
					!node.left.computed &&
					node.left.property.name === 'propTypes' &&
					node.left.object.type === 'Identifier' &&
					/^[A-Z]/.test(node.left.object.name)
				) {
					context.report({
						node,
						messageId: 'propTypesDisallowed',
						data: { name: node.left.object.name },
					});
				}
			},
			'ClassBody > PropertyDefinition, ClassBody > ClassProperty'(node) {
				if (node.static && !node.computed && isPropTypesKey(node.key)) {
					context.report({
						node,
						messageId: 'propTypesDisallowed',
						data: { name: getEnclosingClassName(node) },
					});
				}
			},
		};
	},
};

const noLegacyContext = {
	meta: {
		type: 'problem',
		docs: {
			description:
				'Disallow the use of legacy context APIs in React components',
			url: 'https://react.dev/blog/2024/04/25/react-19-upgrade-guide#removed-removing-legacy-context',
		},
		messages: {
			noLegacyContext:
				"'{{name}}' uses a legacy context API that is no longer supported in React 19. Use 'React.createContext()' instead.",
			noLegacyContextTypes:
				"'{{name}}' uses a legacy contextTypes API that is no longer supported in React 19. Use 'contextType' instead.",
		},
		schema: [],
		ruleId: 'no-legacy-context',
		hasSuggestions: true,
	},
	create(context) {
		function checkClassBody(node) {
			node.body.body.forEach((member) => {
				if (
					member.type === 'ClassProperty' ||
					member.type === 'PropertyDefinition'
				) {
					if (
						member.key.name === 'childContextTypes' ||
						member.key.name === 'contextTypes'
					) {
						context.report({
							node: member,
							message: `'${member.key.name}' uses a legacy context API that is no longer supported in React 19. Use 'contextType' instead.`,
						});
					}
				}
				if (
					member.type === 'MethodDefinition' &&
					member.key.name === 'getChildContext'
				) {
					context.report({
						node: member,
						message:
							"'getChildContext' uses a legacy context API that is no longer supported in React 19. Use 'React.createContext()' instead.",
					});
				}
			});
		}

		return {
			'ClassDeclaration:exit': checkClassBody,
			'ClassExpression:exit': checkClassBody,
		};
	},
};

const noStringRefs = {
	meta: {
		type: 'problem',
		docs: {
			description: 'Disallow the use of string refs in React components',
			recommended: true,
			url: 'https://react.dev/blog/2024/04/25/react-19-upgrade-guide#removed-string-refs',
		},
		messages: {
			noStringRefs:
				'String refs are deprecated and will be removed in React 19. Use callback refs instead.',
		},
		schema: [],
		ruleId: 'no-string-refs',
		hasSuggestions: true,
	},
	create(context) {
		function report(node) {
			context.report({ node, messageId: 'noStringRefs' });
		}

		return {
			"JSXAttribute[name.name='ref']"(node) {
				const value = node.value;

				if (!value) {
					return;
				}

				if (value.type === 'Literal' && typeof value.value === 'string') {
					report(node);
					return;
				}

				if (
					value.type === 'JSXExpressionContainer' &&
					value.expression &&
					value.expression.type === 'Literal' &&
					typeof value.expression.value === 'string'
				) {
					report(node);
				}
			},
		};
	},
};

function isUppercaseName(name) {
	return typeof name === 'string' && /^[A-Z]/.test(name);
}

function getEnclosingFunction(node) {
	let current = node.parent;

	while (current) {
		if (
			current.type === 'FunctionDeclaration' ||
			current.type === 'FunctionExpression' ||
			current.type === 'ArrowFunctionExpression'
		) {
			return current;
		}

		current = current.parent;
	}

	return null;
}

function isLikelyReactModuleFactory(node) {
	const enclosingFunction = getEnclosingFunction(node);

	if (!enclosingFunction) {
		return false;
	}

	if (enclosingFunction.id && isUppercaseName(enclosingFunction.id.name)) {
		return true;
	}

	if (
		enclosingFunction.parent &&
		enclosingFunction.parent.type === 'VariableDeclarator' &&
		enclosingFunction.parent.id.type === 'Identifier'
	) {
		return isUppercaseName(enclosingFunction.parent.id.name);
	}

	return false;
}

function isRequireReact(node) {
	return (
		node &&
		node.type === 'CallExpression' &&
		node.callee.type === 'Identifier' &&
		node.callee.name === 'require' &&
		node.arguments.length === 1 &&
		node.arguments[0].type === 'Literal' &&
		node.arguments[0].value === 'react'
	);
}

function isReactLikeObject(node) {
	if (!node) return false;
	if (node.type === 'Identifier' && node.name === 'React') return true;
	return isRequireReact(node);
}

function isReactCreateFactoryMemberExpression(node) {
	return (
		node &&
		node.type === 'MemberExpression' &&
		!node.computed &&
		isReactLikeObject(node.object) &&
		node.property.type === 'Identifier' &&
		node.property.name === 'createFactory'
	);
}

function getLocalName(property) {
	if (property.value.type === 'Identifier') {
		return property.value.name;
	}

	if (property.value.left && property.value.left.type === 'Identifier') {
		return property.value.left.name;
	}

	return null;
}

function getCreateFactoryAliasNames(node) {
	const names = new Set();

	if (node.id.type === 'Identifier') {
		if (isReactCreateFactoryMemberExpression(node.init)) {
			names.add(node.id.name);
		}
		return names;
	}

	if (node.id.type !== 'ObjectPattern' || !isReactLikeObject(node.init)) {
		return names;
	}

	for (const property of node.id.properties) {
		if (property.type !== 'Property' || property.computed) continue;

		const keyName =
			property.key.type === 'Identifier'
				? property.key.name
				: property.key.value;

		if (keyName === 'createFactory') {
			const localName = getLocalName(property);
			if (localName) names.add(localName);
		}
	}

	return names;
}

const noFactories = {
	meta: {
		type: 'problem',
		docs: {
			description: 'Disallow module pattern factories and React.createFactory',
			url: 'https://react.dev/blog/2024/04/25/react-19-upgrade-guide#removed-module-pattern-factories',
		},
		messages: {
			noModulePattern:
				'Module pattern factories are removed in React 19. Use regular functions instead.',
			noCreateFactory:
				'React.createFactory is removed in React 19. Use JSX instead.',
		},
		schema: [],
		ruleId: 'no-factories',
		hasSuggestions: true,
	},
	create(context) {
		const sourceCode = context.sourceCode;

		return {
			ReturnStatement(node) {
				if (
					node.argument &&
					node.argument.type === 'ObjectExpression' &&
					isLikelyReactModuleFactory(node)
				) {
					const hasRenderMethod = node.argument.properties.some(
						(property) =>
							property.type === 'Property' &&
							property.key.type === 'Identifier' &&
							property.key.name === 'render' &&
							property.value.type === 'FunctionExpression',
					);

					if (hasRenderMethod) {
						context.report({
							node,
							messageId: 'noModulePattern',
						});
					}
				}
			},
			ImportDeclaration(node) {
				if (node.source.value === 'react' && node.specifiers) {
					node.specifiers.forEach((spec) => {
						if (spec.imported && spec.imported.name === 'createFactory') {
							context.report({
								node: spec,
								messageId: 'noCreateFactory',
							});
						}
					});
				}
			},
			VariableDeclarator(node) {
				const aliasNames = getCreateFactoryAliasNames(node);
				if (aliasNames.size === 0) return;

				for (const variable of sourceCode.getDeclaredVariables(node)) {
					if (!aliasNames.has(variable.name)) continue;

					for (const reference of variable.references) {
						const { identifier } = reference;
						const parent = identifier.parent;

						if (
							parent &&
							parent.type === 'CallExpression' &&
							parent.callee === identifier
						) {
							context.report({ node: parent, messageId: 'noCreateFactory' });
						}
					}
				}
			},
			CallExpression(node) {
				if (isReactCreateFactoryMemberExpression(node.callee)) {
					context.report({
						node,
						messageId: 'noCreateFactory',
					});
				}
			},
		};
	},
};

module.exports = {
	meta: { name: 'react-19-upgrade' },
	rules: {
		'no-default-props': noDefaultProps,
		'no-prop-types': noPropTypes,
		'no-legacy-context': noLegacyContext,
		'no-string-refs': noStringRefs,
		'no-factories': noFactories,
	},
};
