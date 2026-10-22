/*
 * Dependency-free port of the rules of eslint-plugin-expo 1.1.0
 * (use-dom-exports, no-env-var-destructuring, no-dynamic-env-var, prefer-box-shadow).
 * Source: https://github.com/expo/expo/tree/main/packages/eslint-plugin-expo
 *
 * The MIT License (MIT)
 * Copyright (c) 2016-present Expo
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
'use strict';

const docsUrl = (name) =>
	`https://github.com/expo/expo/blob/main/packages/eslint-plugin-expo/docs/rules/${name}.md`;

function createRule({ name, meta, defaultOptions, create }) {
	return {
		meta: { ...meta, docs: { ...meta.docs, url: docsUrl(name) } },
		defaultOptions,
		create(context) {
			return create(context, defaultOptions);
		},
	};
}

const noDynamicEnvVar = createRule({
	name: 'no-dynamic-env-var',
	meta: {
		type: 'problem',
		docs: {
			description: 'Prevents process.env from being accessed dynamically',
		},
		schema: [],
		messages: {
			unexpectedDynamicAccess:
				'Unexpected dynamic access. Cannot dynamically access {{value}} from process.env',
		},
	},
	defaultOptions: [],
	create(context) {
		return {
			VariableDeclarator(node) {
				const isProcessEnv =
					node.init?.type === 'MemberExpression' &&
					node.init.object.type === 'MemberExpression' &&
					node.init.object.object.type === 'Identifier' &&
					node.init.object.object.name === 'process' &&
					node.init.object.property.type === 'Identifier' &&
					node.init.object.property.name === 'env';
				if (
					isProcessEnv &&
					node.init?.type === 'MemberExpression' &&
					node.init.computed
				) {
					const identifierName =
						node.init.property.type === 'Identifier'
							? node.init.property.name
							: '';
					const literalValue =
						node.init.property.type === 'Literal'
							? node.init.property?.value
							: '';
					context.report({
						node,
						messageId: 'unexpectedDynamicAccess',
						data: {
							value: identifierName || literalValue,
						},
					});
				}
			},
		};
	},
});

const noEnvVarDestructuring = createRule({
	name: 'no-env-var-destructuring',
	meta: {
		type: 'problem',
		docs: {
			description: 'Disallow destructuring of environment variables',
		},
		schema: [],
		messages: {
			unexpectedDestructuring:
				'Unexpected destructuring. Cannot destructure {{value}} from process.env',
		},
	},
	defaultOptions: [],
	create(context) {
		return {
			VariableDeclarator(node) {
				const left = node.id;
				const isDestructuring = left.type === 'ObjectPattern';
				const isProcessEnv =
					node.init?.type === 'MemberExpression' &&
					node.init.object.type === 'Identifier' &&
					node.init.object.name === 'process' &&
					node.init.property.type === 'Identifier' &&
					node.init.property.name === 'env';
				if (isDestructuring && isProcessEnv) {
					left.properties.forEach(function (property) {
						context.report({
							node,
							messageId: 'unexpectedDestructuring',
							data: {
								value:
									property.value?.type === 'Identifier'
										? property.value.name
										: 'variables',
							},
						});
					});
				}
			},
		};
	},
});

const preferBoxShadow = createRule({
	name: 'prefer-box-shadow',
	meta: {
		type: 'suggestion',
		docs: {
			description:
				'Box shadow is a simpler, more consistent way of defining shadows on components. It is recommended for web builds.',
		},
		schema: [],
		messages: {
			preferBoxShadow: 'prefer box shadow',
		},
	},
	defaultOptions: [],
	create(context) {
		const oldShadowProps = [
			'shadowColor',
			'shadowOffset',
			'shadowOpacity',
			'shadowRadius',
			'elevation',
		];
		return {
			ObjectExpression(node) {
				for (const property of node.properties) {
					if (
						property.type === 'Property' &&
						property.key.type === 'Identifier' &&
						oldShadowProps.includes(property.key.name)
					) {
						context.report({
							node: property,
							messageId: 'preferBoxShadow',
						});
					}
				}
			},
		};
	},
});

const useDomExports = createRule({
	name: 'use-dom-exports',
	meta: {
		type: 'problem',
		docs: {
			description:
				'Files with the "use dom" directive may only contain a single default export of a React component, which must not be async and must be a function.',
		},
		schema: [],
		messages: {
			noOtherExports:
				'Files with the "use dom" directive may not contain named exports or other default exports.',
			asyncDefaultExport: 'The default export must not be an async function.',
			invalidDefaultExport: 'The default export must be a function.',
			missingDefaultExport:
				'Files with the "use dom" directive must export a React component as the default export.',
		},
	},
	defaultOptions: [],
	create(context) {
		return {
			Program(node) {
				let isDomComponent = false;
				let hasDefaultExport = false;

				for (const block of node.body) {
					if (
						block.type === 'ExpressionStatement' &&
						block.expression.type === 'Literal' &&
						block.expression.value === 'use dom'
					) {
						isDomComponent = true;
					}

					if (!isDomComponent) {
						continue;
					}

					if (
						block.type === 'ExportNamedDeclaration' &&
						(!block.declaration ||
							(block.declaration.type !== 'TSInterfaceDeclaration' &&
								block.declaration.type !== 'TSTypeAliasDeclaration' &&
								block.declaration.type !== 'TSModuleDeclaration'))
					) {
						if (
							block.specifiers.some(
								(specifier) =>
									specifier.type === 'ExportSpecifier' &&
									specifier.exported.type === 'Identifier' &&
									specifier.exported.name === 'default',
							)
						) {
							if (hasDefaultExport) {
								context.report({
									node: block,
									messageId: 'noOtherExports',
								});
								continue;
							}
							hasDefaultExport = true;
							if (block.specifiers.length > 1) {
								context.report({
									node: block,
									messageId: 'noOtherExports',
								});
							}
						} else {
							context.report({
								node: block,
								messageId: 'noOtherExports',
							});
						}
					}

					if (block.type === 'ExportDefaultDeclaration') {
						if (hasDefaultExport) {
							context.report({
								node: block,
								messageId: 'noOtherExports',
							});
							continue;
						}
						hasDefaultExport = true;

						if (block.declaration.type === 'Identifier') {
							continue;
						}
						if (
							block.declaration.type !== 'FunctionDeclaration' &&
							block.declaration.type !== 'ArrowFunctionExpression' &&
							block.declaration.type !== 'FunctionExpression'
						) {
							context.report({
								node: block,
								messageId: 'invalidDefaultExport',
							});
							continue;
						}

						if (block.declaration.async) {
							context.report({
								node: block,
								messageId: 'asyncDefaultExport',
							});
						}
					}

					if (
						block.type === 'ExportAllDeclaration' &&
						block.exported &&
						block.exported.name === 'default'
					) {
						if (hasDefaultExport) {
							context.report({
								node: block,
								messageId: 'noOtherExports',
							});
							continue;
						}
						hasDefaultExport = true;
					}
				}

				if (isDomComponent && !hasDefaultExport) {
					context.report({
						node,
						messageId: 'missingDefaultExport',
					});
				}
			},
		};
	},
});

module.exports = {
	meta: { name: 'expo' },
	rules: {
		'use-dom-exports': useDomExports,
		'no-env-var-destructuring': noEnvVarDestructuring,
		'no-dynamic-env-var': noDynamicEnvVar,
		'prefer-box-shadow': preferBoxShadow,
	},
};
