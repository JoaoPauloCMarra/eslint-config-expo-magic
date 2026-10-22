// Ported from eslint-plugin-react-native@5.0.0 (rules: no-unused-styles,
// split-platform-components, no-single-element-style-arrays, no-inline-styles).
// The MIT License (MIT)
// Copyright (c) 2015 Tom Hastjarjanto
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions: The above copyright
// notice and this permission notice shall be included in all copies or
// substantial portions of the Software. THE SOFTWARE IS PROVIDED "AS IS",
// WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED.

'use strict';

const util = require('node:util');

class StyleSheets {
	constructor() {
		this.styleSheets = {};
		this.objectExpressions = undefined;
	}

	add(styleSheetName, properties) {
		this.styleSheets[styleSheetName] = properties;
	}

	markAsUsed(fullyQualifiedName) {
		const nameSplit = fullyQualifiedName.split('.');
		const styleSheetName = nameSplit[0];
		const styleSheetProperty = nameSplit[1];

		if (this.styleSheets[styleSheetName]) {
			this.styleSheets[styleSheetName] = this.styleSheets[
				styleSheetName
			].filter((property) => property.key.name !== styleSheetProperty);
		}
	}

	getUnusedReferences() {
		return this.styleSheets;
	}

	addObjectExpressions(expressions) {
		if (!this.objectExpressions) {
			this.objectExpressions = [];
		}
		this.objectExpressions = this.objectExpressions.concat(expressions);
	}

	getObjectExpressions() {
		return this.objectExpressions;
	}
}

function getStyleSheetObjectNames(settings) {
	return (
		(settings && settings['react-native/style-sheet-object-names']) || [
			'StyleSheet',
		]
	);
}

const astHelpers = {
	containsStyleSheetObject(node, objectNames) {
		return Boolean(
			node &&
			node.type === 'CallExpression' &&
			node.callee &&
			node.callee.object &&
			node.callee.object.name &&
			objectNames.includes(node.callee.object.name),
		);
	},

	containsCreateCall(node) {
		return Boolean(
			node &&
			node.callee &&
			node.callee.property &&
			node.callee.property.name === 'create',
		);
	},

	isStyleSheetDeclaration(node, settings) {
		const objectNames = getStyleSheetObjectNames(settings);

		return Boolean(
			astHelpers.containsStyleSheetObject(node, objectNames) &&
			astHelpers.containsCreateCall(node),
		);
	},

	getStyleSheetName(node) {
		if (node && node.parent && node.parent.id) {
			return node.parent.id.name;
		}
	},

	getStyleDeclarations(node) {
		if (
			node &&
			node.type === 'CallExpression' &&
			node.arguments &&
			node.arguments[0] &&
			node.arguments[0].properties
		) {
			return node.arguments[0].properties.filter(
				(property) => property.type === 'Property',
			);
		}

		return [];
	},

	isStyleAttribute(node) {
		return Boolean(
			node.type === 'JSXAttribute' &&
			node.name &&
			node.name.name &&
			node.name.name.toLowerCase().includes('style'),
		);
	},

	collectStyleObjectExpressions(node, context) {
		if (astHelpers.hasArrayOfStyleReferences(node)) {
			return astHelpers.collectStyleObjectExpressionFromContainers(
				node.expression.elements,
				context,
			);
		}
		if (node && node.expression) {
			return astHelpers.getStyleObjectExpressionFromNode(
				node.expression,
				context,
			);
		}

		return [];
	},

	collectStyleObjectExpressionFromContainers(nodes, context) {
		let objectExpressions = [];
		nodes.forEach((node) => {
			objectExpressions = objectExpressions.concat(
				astHelpers.getStyleObjectExpressionFromNode(node, context),
			);
		});

		return objectExpressions;
	},

	getStyleObjectExpressionFromNode(node, context) {
		if (!node) {
			return [];
		}

		if (node.type === 'ObjectExpression') {
			return [astHelpers.getStyleObjectFromExpression(node, context)];
		}

		switch (node.type) {
			case 'LogicalExpression':
				return []
					.concat(
						astHelpers.getStyleObjectExpressionFromNode(node.left, context),
					)
					.concat(
						astHelpers.getStyleObjectExpressionFromNode(node.right, context),
					);
			case 'ConditionalExpression':
				return []
					.concat(
						astHelpers.getStyleObjectExpressionFromNode(
							node.consequent,
							context,
						),
					)
					.concat(
						astHelpers.getStyleObjectExpressionFromNode(
							node.alternate,
							context,
						),
					);
			default:
				return [];
		}
	},

	hasArrayOfStyleReferences(node) {
		return (
			node &&
			Boolean(
				node.type === 'JSXExpressionContainer' &&
				node.expression &&
				node.expression.type === 'ArrayExpression',
			)
		);
	},

	getStyleObjectFromExpression(node, context) {
		const obj = {};
		let invalid = false;
		if (node.properties && node.properties.length) {
			node.properties.forEach((p) => {
				if (!p.value || !p.key) {
					return;
				}
				if (p.value.type === 'Literal') {
					invalid = true;
					obj[p.key.name] = p.value.value;
				} else if (p.value.type === 'ConditionalExpression') {
					const innerNode = p.value;
					if (
						innerNode.consequent.type === 'Literal' ||
						innerNode.alternate.type === 'Literal'
					) {
						invalid = true;
						obj[p.key.name] = context.sourceCode.getText(innerNode);
					}
				} else if (
					p.value.type === 'UnaryExpression' &&
					p.value.operator === '-' &&
					p.value.argument.type === 'Literal'
				) {
					invalid = true;
					obj[p.key.name] = -1 * p.value.argument.value;
				} else if (
					p.value.type === 'UnaryExpression' &&
					p.value.operator === '+' &&
					p.value.argument.type === 'Literal'
				) {
					invalid = true;
					obj[p.key.name] = p.value.argument.value;
				}
			});
		}
		return invalid ? { expression: obj, node } : undefined;
	},

	getPotentialStyleReferenceFromMemberExpression(node) {
		if (
			node &&
			node.object &&
			node.object.type === 'Identifier' &&
			node.object.name &&
			node.property &&
			node.property.type === 'Identifier' &&
			node.property.name &&
			node.parent.type !== 'MemberExpression'
		) {
			return [node.object.name, node.property.name].join('.');
		}
	},
};

class Components {
	constructor() {
		this.list = {};
	}

	getId(node) {
		return node && node.range.join(':');
	}

	add(node, confidence) {
		const id = this.getId(node);
		if (this.list[id]) {
			if (confidence === 0 || this.list[id].confidence === 0) {
				this.list[id].confidence = 0;
			} else {
				this.list[id].confidence = Math.max(
					this.list[id].confidence,
					confidence,
				);
			}
			return;
		}
		this.list[id] = { node, confidence };
	}

	all() {
		const list = {};
		Object.keys(this.list).forEach((i) => {
			if (this.list[i].confidence >= 2) {
				list[i] = this.list[i];
			}
		});
		return list;
	}
}

function detectComponents(rule) {
	return (context) => {
		const { sourceCode } = context;
		const components = new Components();

		const utils = {
			isES5Component(node) {
				if (!node.parent) {
					return false;
				}
				return /^(React\.)?createClass$/.test(
					sourceCode.getText(node.parent.callee),
				);
			},

			isES6Component(node) {
				if (!node.superClass) {
					return false;
				}
				return /^(React\.)?(Pure)?Component$/.test(
					sourceCode.getText(node.superClass),
				);
			},

			isReturningJSX(node) {
				let property;
				switch (node.type) {
					case 'ReturnStatement':
						property = 'argument';
						break;
					case 'ArrowFunctionExpression':
						property = 'body';
						break;
					default:
						return false;
				}

				const returnsJSX =
					node[property] &&
					(node[property].type === 'JSXElement' ||
						node[property].type === 'JSXFragment');
				const returnsReactCreateElement =
					node[property] &&
					node[property].callee &&
					node[property].callee.property &&
					node[property].callee.property.name === 'createElement';
				return Boolean(returnsJSX || returnsReactCreateElement);
			},

			getParentComponent(n) {
				return (
					utils.getParentES6Component(n) ||
					utils.getParentES5Component(n) ||
					utils.getParentStatelessComponent(n)
				);
			},

			getParentES5Component(n) {
				let scope = sourceCode.getScope(n);
				while (scope) {
					const node =
						scope.block && scope.block.parent && scope.block.parent.parent;
					if (node && utils.isES5Component(node)) {
						return node;
					}
					scope = scope.upper;
				}
				return null;
			},

			getParentES6Component(n) {
				let scope = sourceCode.getScope(n);
				while (scope && scope.type !== 'class') {
					scope = scope.upper;
				}
				const node = scope && scope.block;
				if (!node || !utils.isES6Component(node)) {
					return null;
				}
				return node;
			},

			getParentStatelessComponent(n) {
				let scope = sourceCode.getScope(n);
				while (scope) {
					const node = scope.block;
					const isFunction = /Function/.test(node.type);
					const isNotMethod =
						!node.parent || node.parent.type !== 'MethodDefinition';
					const isNotArgument =
						!node.parent || node.parent.type !== 'CallExpression';
					if (isFunction && isNotMethod && isNotArgument) {
						return node;
					}
					scope = scope.upper;
				}
				return null;
			},
		};

		const detectionInstructions = {
			ClassDeclaration(node) {
				if (!utils.isES6Component(node)) {
					return;
				}
				components.add(node, 2);
			},

			ClassProperty(n) {
				const node = utils.getParentComponent(n);
				if (!node) {
					return;
				}
				components.add(node, 2);
			},

			ObjectExpression(node) {
				if (!utils.isES5Component(node)) {
					return;
				}
				components.add(node, 2);
			},

			FunctionExpression(n) {
				const node = utils.getParentComponent(n);
				if (!node) {
					return;
				}
				components.add(node, 1);
			},

			FunctionDeclaration(n) {
				const node = utils.getParentComponent(n);
				if (!node) {
					return;
				}
				components.add(node, 1);
			},

			ArrowFunctionExpression(n) {
				const node = utils.getParentComponent(n);
				if (!node) {
					return;
				}
				if (node.expression && utils.isReturningJSX(node)) {
					components.add(node, 2);
				} else {
					components.add(node, 1);
				}
			},

			ThisExpression(n) {
				const node = utils.getParentComponent(n);
				if (!node || !/Function/.test(node.type)) {
					return;
				}
				components.add(node, 0);
			},

			ReturnStatement(node) {
				if (!utils.isReturningJSX(node)) {
					return;
				}
				const parentNode = utils.getParentComponent(node);
				if (!parentNode) {
					return;
				}
				components.add(parentNode, 2);
			},
		};

		const ruleInstructions = rule(context, components, utils);
		const updatedRuleInstructions = { ...ruleInstructions };
		Object.keys(detectionInstructions).forEach((instruction) => {
			updatedRuleInstructions[instruction] = (node) => {
				detectionInstructions[instruction](node);
				return ruleInstructions[instruction]
					? ruleInstructions[instruction](node)
					: undefined;
			};
		});
		return updatedRuleInstructions;
	};
}

const noUnusedStyles = {
	meta: {
		schema: [],
	},
	create: detectComponents((context, components) => {
		const styleSheets = new StyleSheets();
		const styleReferences = new Set();

		function reportUnusedStyles(unusedStyles) {
			Object.keys(unusedStyles).forEach((key) => {
				const styles = unusedStyles[key];
				styles.forEach((node) => {
					const message = [
						'Unused style detected: ',
						key,
						'.',
						node.key.name,
					].join('');

					context.report({ node, message });
				});
			});
		}

		return {
			MemberExpression(node) {
				const styleRef =
					astHelpers.getPotentialStyleReferenceFromMemberExpression(node);
				if (styleRef) {
					styleReferences.add(styleRef);
				}
			},

			CallExpression(node) {
				if (astHelpers.isStyleSheetDeclaration(node, context.settings)) {
					const styleSheetName = astHelpers.getStyleSheetName(node);
					const styles = astHelpers.getStyleDeclarations(node);

					styleSheets.add(styleSheetName, styles);
				}
			},

			'Program:exit'() {
				const list = components.all();
				if (Object.keys(list).length > 0) {
					styleReferences.forEach((reference) => {
						styleSheets.markAsUsed(reference);
					});
					reportUnusedStyles(styleSheets.getUnusedReferences());
				}
			},
		};
	}),
};

const splitPlatformComponents = {
	meta: {
		fixable: 'code',
		schema: [
			{
				type: 'object',
				properties: {
					androidPathRegex: {
						type: 'string',
					},
					iosPathRegex: {
						type: 'string',
					},
				},
				additionalProperties: false,
			},
		],
	},
	create(context) {
		let reactComponents = [];
		const androidMessage =
			'Android components should be placed in android files';
		const iosMessage = 'IOS components should be placed in ios files';
		const conflictMessage = "IOS and Android components can't be mixed";
		const iosPathRegex =
			context.options[0] && context.options[0].iosPathRegex
				? new RegExp(context.options[0].iosPathRegex)
				: /\.ios\.[j|t]sx?$/;
		const androidPathRegex =
			context.options[0] && context.options[0].androidPathRegex
				? new RegExp(context.options[0].androidPathRegex)
				: /\.android\.[j|t]sx?$/;

		function getName(node) {
			if (node.type === 'Property') {
				const key = node.key || node.argument;
				return key.type === 'Identifier' ? key.name : key.value;
			}
			if (node.type === 'Identifier') {
				return node.name;
			}
		}

		function hasNodeWithName(nodes, name) {
			return nodes.some((node) => {
				const nodeName = getName(node);
				return nodeName && nodeName.includes(name);
			});
		}

		function reportErrors(components, filename) {
			const containsAndroidAndIOS =
				hasNodeWithName(components, 'IOS') &&
				hasNodeWithName(components, 'Android');

			components.forEach((node) => {
				const propName = getName(node);

				if (propName.includes('IOS') && !filename.match(iosPathRegex)) {
					context.report({
						node,
						message: containsAndroidAndIOS ? conflictMessage : iosMessage,
					});
				}

				if (propName.includes('Android') && !filename.match(androidPathRegex)) {
					context.report({
						node,
						message: containsAndroidAndIOS ? conflictMessage : androidMessage,
					});
				}
			});
		}

		return {
			VariableDeclarator(node) {
				const destructuring =
					node.init && node.id && node.id.type === 'ObjectPattern';
				const statelessDestructuring =
					destructuring && node.init.name === 'React';
				if (destructuring && statelessDestructuring) {
					reactComponents = reactComponents.concat(node.id.properties);
				}
			},
			ImportDeclaration(node) {
				if (node.source.value === 'react-native') {
					node.specifiers.forEach((importSpecifier) => {
						if (importSpecifier.type === 'ImportSpecifier') {
							reactComponents = reactComponents.concat(
								importSpecifier.imported,
							);
						}
					});
				}
			},
			'Program:exit'() {
				reportErrors(reactComponents, context.filename);
			},
		};
	},
};

const noSingleElementStyleArrays = {
	meta: {
		docs: {
			description:
				'Disallow single element style arrays. These cause unnecessary re-renders as the identity of the array always changes',
			category: 'Stylistic Issues',
			recommended: false,
			url: '',
		},
		fixable: 'code',
	},

	create(context) {
		function reportNode(JSXExpressionNode) {
			context.report({
				node: JSXExpressionNode,
				message:
					'Single element style arrays are not necessary and cause unnecessary re-renders',
				fix(fixer) {
					const realStyleNode = JSXExpressionNode.value.expression.elements[0];
					const styleSource = context.sourceCode.getText(realStyleNode);
					return fixer.replaceText(
						JSXExpressionNode.value.expression,
						styleSource,
					);
				},
			});
		}

		return {
			JSXAttribute(node) {
				if (node.name.name !== 'style') return;
				if (!node.value.expression) return;
				if (node.value.expression.type !== 'ArrayExpression') return;
				if (node.value.expression.elements.length === 1) {
					reportNode(node);
				}
			},
		};
	},
};

const noInlineStyles = {
	meta: {
		schema: [],
	},
	create: detectComponents((context) => {
		const styleSheets = new StyleSheets();

		function reportInlineStyles(inlineStyles) {
			if (inlineStyles) {
				inlineStyles.forEach((style) => {
					if (style) {
						const expression = util.inspect(style.expression);
						context.report({
							node: style.node,
							message: 'Inline style: {{expression}}',
							data: { expression },
						});
					}
				});
			}
		}

		return {
			JSXAttribute: (node) => {
				if (astHelpers.isStyleAttribute(node)) {
					const styles = astHelpers.collectStyleObjectExpressions(
						node.value,
						context,
					);
					styleSheets.addObjectExpressions(styles);
				}
			},

			'Program:exit': () =>
				reportInlineStyles(styleSheets.getObjectExpressions()),
		};
	}),
};

module.exports = {
	meta: { name: 'react-native' },
	rules: {
		'no-unused-styles': noUnusedStyles,
		'split-platform-components': splitPlatformComponents,
		'no-single-element-style-arrays': noSingleElementStyleArrays,
		'no-inline-styles': noInlineStyles,
	},
};
